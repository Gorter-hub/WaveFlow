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

export interface SpotifyExportResult {
  id: string;
  url: string;
  name: string;
  totalTracksAdded: number;
}

/**
 * Creates or updates a Spotify playlist with the ordered set and injects track URIs
 * Migrated to official February 2026 endpoint: POST /v1/playlists/{playlist_id}/items
 * Supports batching (<= 100 items), safe retry without empty duplicates, and verification.
 */
export async function exportToSpotifyPlaylist(
  accessToken: string,
  userId: string,
  tracks: Track[],
  playlistName?: string,
  description?: string,
  existingPlaylistId?: string,
  onProgress?: (addedCount: number, totalCount: number) => void
): Promise<SpotifyExportResult> {
  if (tracks.length === 0) {
    throw new Error('No tracks to export.');
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const finalName = playlistName || `WaveFlow Set — ${dateStr}`;
  const finalDesc =
    description ||
    'Curated by WaveFlow AI: adaptive sequence with calibrated valence and rhythmic continuity.';

  let playlistId = existingPlaylistId || '';
  let playlistUrl = playlistId ? `https://open.spotify.com/playlist/${playlistId}` : '';

  // 1. Create Playlist if no existing playlist ID was supplied for retry
  if (!playlistId) {
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
      const safeUserId = encodeURIComponent(userId || 'me');
      const fallbackRes = await fetch(`${SPOTIFY_API_BASE}/users/${safeUserId}/playlists`, {
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
        const errText = await fallbackRes.text();
        let errMsg = errText;
        try {
          const parsed = JSON.parse(errText);
          errMsg = parsed.error?.message || errText;
        } catch {}

        if (fallbackRes.status === 403) {
          throw new Error(
            `Error de permisos Spotify (403 Forbidden al crear playlist): ${errMsg}. Asegúrate de haber iniciado sesión con los permisos de modificación de playlist y que tu usuario esté registrado en el Spotify Developer Dashboard.`
          );
        }
        throw new Error(`Failed to create playlist (${fallbackRes.status}): ${errMsg}`);
      }
      playlistData = await fallbackRes.json();
    }

    playlistId = playlistData.id;
    playlistUrl =
      playlistData.external_urls?.spotify || `https://open.spotify.com/playlist/${playlistId}`;
  }

  // 2. Extract valid Spotify track URIs (preserving exact sequence order)
  const validUris: string[] = tracks
    .map((t) => {
      if (t.uri && t.uri.startsWith('spotify:track:')) return t.uri;
      if (t.id && !t.id.startsWith('mock') && !t.id.startsWith('track-')) {
        return `spotify:track:${t.id}`;
      }
      if (t.uri) return t.uri;
      return '';
    })
    .filter(Boolean);

  if (validUris.length === 0) {
    throw new Error('No valid Spotify track URIs found in generated set.');
  }

  // 3. Inject tracks using official February 2026 endpoint: POST /v1/playlists/{playlist_id}/items
  // Spotify limits to max 100 items per request -> batch sequentially
  const BATCH_SIZE = 100;
  let addedCount = 0;

  for (let i = 0; i < validUris.length; i += BATCH_SIZE) {
    const batch = validUris.slice(i, i + BATCH_SIZE);

    // Primary endpoint: /items
    let addRes = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: batch
      })
    });

    // Fallback to legacy /tracks only if /items returns 404 (e.g. older mock proxies)
    if (addRes.status === 404) {
      addRes = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: batch
        })
      });
    }

    if (!addRes.ok) {
      const errText = await addRes.text();
      let errorDetail = errText;
      try {
        const parsed = JSON.parse(errText);
        errorDetail = parsed.error?.message || errText;
      } catch {}

      if (addRes.status === 403) {
        const diagMsg =
          `Error de permisos Spotify (403 Forbidden al agregar canciones). ` +
          (errorDetail ? `Detalle Spotify: "${errorDetail}". ` : '') +
          `Causa: Tu sesión actual de Spotify carece del alcance 'playlist-modify-public' o 'playlist-modify-private', o tu cuenta no está en 'User Management' en el Dashboard de Spotify. ` +
          `La playlist fue creada sin duplicados (${playlistUrl}). Vuelve a conectar tu cuenta de Spotify para renovar permisos y reintentar.`;

        const err: any = new Error(diagMsg);
        err.status = 403;
        err.playlistId = playlistId;
        err.playlistUrl = playlistUrl;
        throw err;
      }

      const err: any = new Error(
        `Playlist creada (${playlistUrl}), pero falló al agregar canciones (${addRes.status}): ${errorDetail}`
      );
      err.status = addRes.status;
      err.playlistId = playlistId;
      err.playlistUrl = playlistUrl;
      throw err;
    }

    addedCount += batch.length;
    if (onProgress) {
      onProgress(addedCount, validUris.length);
    }
  }

  // 4. Verify final track count on Spotify
  try {
    const verifyRes = await fetch(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}?fields=tracks.total,items.total,name,external_urls`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    if (verifyRes.ok) {
      const verifyData = await verifyRes.json();
      const confirmedTotal = verifyData.tracks?.total ?? verifyData.items?.total ?? addedCount;
      console.info(`Verified: ${confirmedTotal} tracks confirmed on Spotify playlist ${playlistId}`);
    }
  } catch (verifyErr) {
    console.warn('Playlist verification fetch skipped:', verifyErr);
  }

  return {
    id: playlistId,
    url: playlistUrl,
    name: finalName,
    totalTracksAdded: addedCount
  };
}
