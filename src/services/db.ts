/**
 * Local-First IndexedDB Database Service for WaveFlow
 * Provides ultra-fast, offline-capable persistence for enriched acoustic track vectors.
 */

import { EnrichedTrack } from '../types';

const DB_NAME = 'waveflow_db';
const DB_VERSION = 1;
const STORE_NAME = 'cached_tracks';

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

export async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not available in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('energy_score', 'energy_score', { unique: false });
        store.createIndex('bpm', 'bpm', { unique: false });
        store.createIndex('camelot_key', 'camelot_key', { unique: false });
        store.createIndex('cached_at', 'cached_at', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbInitPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = () => {
      dbInitPromise = null;
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });

  return dbInitPromise;
}

/**
 * Retrieve a single enriched track by Spotify ID
 */
export async function getCachedTrack(id: string): Promise<EnrichedTrack | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn(`[IndexedDB] Error fetching track ${id}:`, error);
    return null;
  }
}

/**
 * Retrieve all cached enriched tracks
 */
export async function getAllCachedTracks(): Promise<EnrichedTrack[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('[IndexedDB] Error reading all tracks:', error);
    return [];
  }
}

/**
 * Save or update a single enriched track
 */
export async function saveCachedTrack(track: EnrichedTrack): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(track);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn(`[IndexedDB] Error saving track ${track.id}:`, error);
  }
}

/**
 * Bulk save or update an array of enriched tracks inside a single transaction
 */
export async function saveCachedTracks(tracks: EnrichedTrack[]): Promise<void> {
  if (!tracks.length) return;
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));

      for (const track of tracks) {
        store.put(track);
      }
    });
  } catch (error) {
    console.warn('[IndexedDB] Error bulk saving tracks:', error);
  }
}

/**
 * Query tracks by energy score range using index
 */
export async function getCachedTracksByEnergy(
  minEnergy: number,
  maxEnergy: number
): Promise<EnrichedTrack[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('energy_score');
      const range = IDBKeyRange.bound(minEnergy, maxEnergy);
      const req = index.getAll(range);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('[IndexedDB] Error querying by energy:', error);
    return [];
  }
}

/**
 * Query tracks by BPM range using index
 */
export async function getCachedTracksByBpm(
  minBpm: number,
  maxBpm: number
): Promise<EnrichedTrack[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('bpm');
      const range = IDBKeyRange.bound(minBpm, maxBpm);
      const req = index.getAll(range);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('[IndexedDB] Error querying by BPM:', error);
    return [];
  }
}

/**
 * Count total cached tracks
 */
export async function getCachedTracksCount(): Promise<number> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return 0;
  }
}

/**
 * Clear the entire track cache
 */
export async function clearCachedTracks(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('[IndexedDB] Error clearing cache:', error);
  }
}
