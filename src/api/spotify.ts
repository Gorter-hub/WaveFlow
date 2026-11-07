import { SpotifyAuthTokens, Track, UserProfile } from '../types';
import { enrichTrackAcousticVectors } from '../algorithm/acousticAnalyzer';

import { generateCodeChallenge, generateRandomString } from '../utils/pkce';

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

const SCOPES = [
  'user-library-read',
  'playlist-modify-private',
  'playlist-modify-public',
  'user-read-private',
  'user-read-email'
].join(' ');

export function getRedirectUri(): string {
  // Use current origin + /callback to work smoothly on localhost:5173 or custom ports
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/callback`;
  }
  return 'http://localhost:5173/callback';
}

/**
 * Initiates the Spotify PKCE OAuth login
 */
export async function redirectToSpotifyLogin(clientId: string): Promise<void> {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store verifier for token exchange
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: SCOPES
  });

  window.location.href = `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchanges authorization code for Access & Refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string
): Promise<SpotifyAuthTokens> {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  if (!codeVerifier) {
    throw new Error('Code verifier not found in storage. Please restart login.');
  }

  const redirectUri = getRedirectUri();

  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const tokens: SpotifyAuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    tokenType: data.token_type || 'Bearer'
  };

  saveTokens(tokens);
  localStorage.removeItem('spotify_code_verifier');
  return tokens;
}

/**
 * Refreshes an expired access token using the stored refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string
): Promise<SpotifyAuthTokens> {
  const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Spotify access token');
  }

  const data = await response.json();
  const tokens: SpotifyAuthTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
    tokenType: data.token_type || 'Bearer'
  };

  saveTokens(tokens);
  return tokens;
}

export function saveTokens(tokens: SpotifyAuthTokens): void {
  localStorage.setItem('spotify_tokens', JSON.stringify(tokens));
}

export function getStoredTokens(): SpotifyAuthTokens | null {
  const raw = localStorage.getItem('spotify_tokens');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStoredTokens(): void {
  localStorage.removeItem('spotify_tokens');
  localStorage.removeItem('spotify_code_verifier');
}

/**
 * Fetches the user's Spotify profile
 */
export async function getUserProfile(accessToken: string): Promise<UserProfile> {
  const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user profile (${res.status})`);
  }

  return res.json();
}

/**
 * Fetches all "Liked Songs" from Spotify (paginates through all pages)
 */
export async function fetchUserLikedSongs(
  accessToken: string,
  targetCount?: number,
  onProgress?: (fetched: number, total: number) => void
): Promise<Track[]> {
  const allTracks: Track[] = [];
  const limit = 50;
  let offset = 0;
  let totalReported = Infinity;

  while (offset < totalReported) {
    const url = `${SPOTIFY_API_BASE}/me/tracks?limit=${limit}&offset=${offset}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Spotify session expired. Please re-authenticate.');
      }
      throw new Error(`Failed to fetch liked songs: ${res.statusText}`);
    }

    const data = await res.json();
    totalReported = targetCount ? Math.min(targetCount, data.total || 0) : (data.total || 0);
    const items = data.items || [];

    for (const item of items) {
      const t = item.track;
      if (!t) continue;

      const rawTrack: Partial<Track> = {
        id: t.id,
        name: t.name,
        artist: t.artists?.map((a: { name: string }) => a.name).join(', ') || 'Unknown Artist',
        artists: t.artists?.map((a: { name: string }) => a.name) || [],
        album: t.album?.name || 'Unknown Album',
        albumArt: t.album?.images?.[0]?.url || t.album?.images?.[1]?.url,
        duration_ms: t.duration_ms,
        uri: t.uri,
        preview_url: t.preview_url
      };

      // Compute intelligent acoustic vectors immediately
      allTracks.push(enrichTrackAcousticVectors(rawTrack));
    }

    if (onProgress) {
      onProgress(allTracks.length, totalReported);
    }

    // Stop if reached target, no more items, or end of user's library
    if (items.length < limit || allTracks.length >= totalReported) {
      break;
    }

    offset += limit;
  }

  return allTracks;
}

/**
 * Creates a private Spotify playlist with the ordered DJ set and injects the 50 track URIs
 */
export async function exportToSpotifyPlaylist(
  accessToken: string,
  userId: string,
  tracks: Track[],
  playlistName?: string,
  description?: string
): Promise<{ id: string; url: string; name: string }> {
  if (tracks.length === 0) {
    throw new Error('No tracks to export.');
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const finalName =
    playlistName || `WaveFlow DJ Set — ${dateStr}`;

  const finalDesc =
    description ||
    'Curated by WaveFlow AI: 50-track dynamic DJ energy curve (Warm-up → Build-up → Peak → Valley → Climax → Outro).';

  // 1. Create Playlist (POST /v1/me/playlists)
  const createRes = await fetch(`${SPOTIFY_API_BASE}/me/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: finalName,
      description: finalDesc,
      public: false
    })
  });

  let playlistData;
  if (createRes.ok) {
    playlistData = await createRes.json();
  } else {
    // Fallback to /users/{user_id}/playlists if /me/playlists rejects
    const fallbackRes = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: finalName,
        description: finalDesc,
        public: false
      })
    });

    if (!fallbackRes.ok) {
      const err = await fallbackRes.text();
      throw new Error(`Failed to create playlist: ${err}`);
    }
    playlistData = await fallbackRes.json();
  }
  const playlistId = playlistData.id;
  const playlistUrl =
    playlistData.external_urls?.spotify || `https://open.spotify.com/playlist/${playlistId}`;

  // 2. Inject tracks (POST /v1/playlists/{playlist_id}/tracks)
  // Spotify allows max 100 URIs per request; our DJ set has 50
  const uris = tracks.map((t) => t.uri).filter(Boolean);

  const addTracksRes = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uris: uris
    })
  });

  if (!addTracksRes.ok) {
    const errText = await addTracksRes.text();
    throw new Error(`Playlist created, but failed to add tracks: ${errText}`);
  }

  return {
    id: playlistId,
    url: playlistUrl,
    name: finalName
  };
}
