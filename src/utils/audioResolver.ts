import { Track } from '../types';

/**
 * Audio Preview Resolver
 * Retrieves authentic 30-second master studio recordings with original vocals & instrumentation
 * using iTunes / Apple Music Catalog Search API (CORS enabled, 100% free, no API key required).
 */

const PREVIEW_CACHE_KEY = 'waveflow_resolved_audio_previews';

// In-memory cache
const memoryCache = new Map<string, string>();

// Initialize from localStorage
try {
  const stored = localStorage.getItem(PREVIEW_CACHE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string') memoryCache.set(k, v);
    }
  }
} catch (e) {
  // Ignore localStorage read errors
}

function saveToLocalStorage() {
  try {
    const obj: Record<string, string> = {};
    for (const [k, v] of memoryCache.entries()) {
      obj[k] = v;
    }
    localStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(obj));
  } catch (e) {
    // Ignore storage quota errors
  }
}

/**
 * Cleans track and artist string for high-accuracy search queries
 */
function cleanQueryTerm(str: string): string {
  return str
    .replace(/\s*-\s*Remaster(ed)?(\s*\d+)?/gi, '')
    .replace(/\s*-\s*Live(\s*at\s*[^)]+)?/gi, '')
    .replace(/\(feat\.[^)]+\)/gi, '')
    .replace(/\[feat\.[^\]]+\]/gi, '')
    .replace(/[\(\)\[\]\-]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Resolves a real 30-second studio audio preview URL for any track
 */
export async function resolveTrackAudioPreview(track: Track): Promise<string | null> {
  if (!track) return null;

  // 1. If track already has a valid direct preview_url
  if (track.preview_url && track.preview_url.startsWith('http')) {
    return track.preview_url;
  }

  // 2. Check cache
  const cacheKey = `${track.name}:::${track.artist}`.toLowerCase();
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // 3. Query iTunes Search API (CORS allowed, high-quality audio previews)
  try {
    const cleanArtist = cleanQueryTerm(track.artist || '');
    const cleanTitle = cleanQueryTerm(track.name || '');

    // Attempt 1: Artist + Title
    let query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
    let res = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=3`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        // Find result with previewUrl
        const match = data.results.find((r: any) => r.previewUrl);
        if (match?.previewUrl) {
          memoryCache.set(cacheKey, match.previewUrl);
          saveToLocalStorage();
          return match.previewUrl;
        }
      }
    }

    // Attempt 2: Title only (fallback if artist name had complex features)
    query = encodeURIComponent(cleanTitle);
    res = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=5`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const match = data.results.find((r: any) => r.previewUrl);
        if (match?.previewUrl) {
          memoryCache.set(cacheKey, match.previewUrl);
          saveToLocalStorage();
          return match.previewUrl;
        }
      }
    }
  } catch (error) {
    console.warn(`Could not resolve audio preview for ${track.name}:`, error);
  }

  return null;
}

/**
 * Pre-fetches audio previews for upcoming tracks so skipping is instantaneous
 */
export function prefetchUpcomingPreviews(tracks: Track[], startIndex: number = 0, count: number = 4) {
  const slice = tracks.slice(startIndex, startIndex + count);
  for (const t of slice) {
    resolveTrackAudioPreview(t);
  }
}
