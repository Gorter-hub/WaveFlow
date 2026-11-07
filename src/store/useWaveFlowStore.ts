import { create } from 'zustand';
import {
  FlowPhaseName,
  CognitiveFlowIntentId,
  FlowPhaseConfig,
  CuratedSetResult,
  GenerationStatus,
  SpotifyAuthTokens,
  Track,
  UserProfile
} from '../types';
import {
  clearStoredTokens,
  exchangeCodeForTokens,
  exportToSpotifyPlaylist,
  fetchUserLikedSongs,
  getStoredTokens,
  getUserProfile,
  redirectToSpotifyLogin
} from '../api/spotify';
import { curateCognitiveFlowWithGemini } from '../api/gemini';
import {
  COGNITIVE_INTENTS,
  generateCognitiveDJFlow,
  PHASE_CONFIGS
} from '../algorithm/curveGenerator';
import { enrichTrackLibrary } from '../algorithm/acousticAnalyzer';
import { generateMockLikedTracks } from '../api/mockData';
import confetti from 'canvas-confetti';

function saveCachedTracks(tracks: Track[]) {
  try {
    const compact = tracks.map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artist,
      artists: t.artists,
      album: t.album,
      albumArt: t.albumArt,
      duration_ms: t.duration_ms,
      uri: t.uri,
      preview_url: t.preview_url,
      energy_score: t.energy_score,
      valence_score: t.valence_score,
      bpm: t.bpm,
      vocal_presence: t.vocal_presence,
      mood_vibe: t.mood_vibe,
      genre_vibe: t.genre_vibe,
      energy: t.energy_score ?? t.energy,
      valence: t.valence_score ?? t.valence
    }));
    localStorage.setItem('waveflow_cached_liked_songs', JSON.stringify(compact));
  } catch (e) {
    console.warn('Could not cache all songs to localStorage:', e);
  }
}

function getCachedTracks(): Track[] {
  try {
    const raw = localStorage.getItem('waveflow_cached_liked_songs');
    if (!raw) return [];
    const parsed: Track[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];

    // Auto-migrate: check if any track lacks BPM, energy_score, or mood_vibe
    const needsMigration = parsed.some(
      (t) => !t.bpm || t.energy_score === undefined || !t.mood_vibe
    );

    if (needsMigration) {
      console.info(`Auto-analyzing ${parsed.length} tracks with acoustic vectors...`);
      const enriched = enrichTrackLibrary(parsed);
      saveCachedTracks(enriched);
      return enriched;
    }

    return parsed;
  } catch {
    return [];
  }
}

interface WaveFlowStore {
  // Config & Credentials
  spotifyClientId: string;
  geminiApiKey: string;
  isMockMode: boolean;

  // Auth State
  tokens: SpotifyAuthTokens | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isSyncingLibrary: boolean;

  // Tracks State
  likedTracks: Track[];
  flowTracks: Track[];
  activeTrack: Track | null;
  selectedPhaseFilter: string | 'all';
  flowIntent: CognitiveFlowIntentId;
  targetTrackCount: number;
  flowResult: CuratedSetResult | null;
  currentPhases: FlowPhaseConfig[];
  activeTab: 'home' | 'generate' | 'library';

  // Generation & Export State
  status: GenerationStatus;
  errorMessage: string | null;
  exportedPlaylist: { id: string; url: string; name: string } | null;

  // Actions
  init: () => Promise<void>;
  login: () => Promise<void>;
  handleAuthCallback: (code: string) => Promise<boolean>;
  logout: () => void;
  setMockMode: (enabled: boolean) => void;
  setCredentials: (clientId: string, geminiKey: string) => void;
  setActiveTab: (tab: 'home' | 'generate' | 'library') => void;
  setActiveTrack: (track: Track | null) => void;
  setSelectedPhaseFilter: (phase: string | 'all') => void;
  setFlowIntent: (intent: CognitiveFlowIntentId) => void;
  setTargetTrackCount: (count: number) => void;
  clearError: () => void;
  syncLibrary: () => Promise<void>;

  // Core Flow Workflow
  generateFlow: () => Promise<void>;
  exportToSpotify: () => Promise<void>;
}

export const useWaveFlowStore = create<WaveFlowStore>((set, get) => ({
  spotifyClientId:
    localStorage.getItem('waveflow_spotify_client_id') ||
    import.meta.env.VITE_SPOTIFY_CLIENT_ID ||
    'eff8d23bb9144906a6c6c014188e1c24',
  geminiApiKey:
    localStorage.getItem('waveflow_gemini_api_key') ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    '',
  isMockMode: false,

  tokens: null,
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,
  isSyncingLibrary: false,

  likedTracks: [],
  flowTracks: [],
  activeTrack: null,
  selectedPhaseFilter: 'all',
  flowIntent: 'deep_focus',
  targetTrackCount: 22,
  flowResult: null,
  currentPhases: PHASE_CONFIGS,
  activeTab: 'generate',

  status: {
    step: 'idle',
    message: 'WaveFlow Cognitive DJ ready. Select an intent to synthesize your set.',
    progress: 0
  },
  errorMessage: null,
  exportedPlaylist: null,

  init: async () => {
    set({ isAuthLoading: true });
    try {
      const stored = getStoredTokens();
      const cached = getCachedTracks();

      // Load cached tracks immediately if present
      if (cached.length > 0) {
        const initialFlow = generateCognitiveDJFlow(cached, 'deep_focus');
        set({
          likedTracks: cached,
          flowTracks: initialFlow.curated_set,
          flowResult: initialFlow,
          currentPhases: initialFlow.phases,
          targetTrackCount: initialFlow.computed_total_tracks,
          activeTrack: initialFlow.curated_set[0] || null,
          status: {
            step: 'ready',
            message: `${cached.length} canciones analizadas. Set listo: ${initialFlow.computed_total_tracks} tracks (${Math.round(initialFlow.computed_total_duration_ms / 60000)}m).`,
            progress: 100
          }
        });
      }

      if (stored) {
        if (stored.expiresAt && stored.expiresAt > Date.now()) {
          try {
            const profile = await getUserProfile(stored.accessToken);
            set({
              tokens: stored,
              user: profile,
              isAuthenticated: true,
              isMockMode: false
            });

            // If library was never cached, trigger background sync
            if (cached.length === 0) {
              get().syncLibrary();
            }
          } catch (e) {
            console.warn('Stored token invalid, clearing:', e);
            clearStoredTokens();
            set({ tokens: null, user: null, isAuthenticated: false });
          }
        } else {
          clearStoredTokens();
          set({ tokens: null, user: null, isAuthenticated: false });
        }
      }
    } finally {
      set({ isAuthLoading: false });
    }
  },

  setMockMode: (enabled: boolean) => {
    if (enabled) {
      const mockTracks = enrichTrackLibrary(generateMockLikedTracks());
      const initialFlow = generateCognitiveDJFlow(mockTracks, get().flowIntent);
      saveCachedTracks(mockTracks);
      set({
        isMockMode: true,
        isAuthenticated: true,
        user: {
          id: 'waveflow-demo-user',
          display_name: 'Demo DJ Guest',
          email: 'guest@waveflow.audio',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&q=80'
            }
          ]
        },
        likedTracks: mockTracks,
        flowTracks: initialFlow.curated_set,
        flowResult: initialFlow,
        currentPhases: initialFlow.phases,
        targetTrackCount: initialFlow.computed_total_tracks,
        activeTrack: initialFlow.curated_set[0] || null,
        errorMessage: null,
        status: {
          step: 'ready',
          message: `WaveFlow Demo Set ready: ${initialFlow.computed_total_tracks} tracks curated for ${COGNITIVE_INTENTS[get().flowIntent].name}.`,
          progress: 100
        }
      });
    } else {
      set({
        isMockMode: false,
        isAuthenticated: Boolean(get().tokens)
      });
    }
  },

  setCredentials: (clientId: string, geminiKey: string) => {
    localStorage.setItem('waveflow_spotify_client_id', clientId.trim());
    localStorage.setItem('waveflow_gemini_api_key', geminiKey.trim());
    set({
      spotifyClientId: clientId.trim(),
      geminiApiKey: geminiKey.trim()
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveTrack: (track) => set({ activeTrack: track }),
  setSelectedPhaseFilter: (phase) => set({ selectedPhaseFilter: phase }),
  setTargetTrackCount: (count) => set({ targetTrackCount: count }),

  setFlowIntent: (intent: CognitiveFlowIntentId) => {
    set({ flowIntent: intent, selectedPhaseFilter: 'all' });
    const { likedTracks } = get();
    // If tracks are already loaded, immediately preview the new cognitive arc
    if (likedTracks.length > 0) {
      const preview = generateCognitiveDJFlow(likedTracks, intent);
      set({
        flowTracks: preview.curated_set,
        flowResult: preview,
        currentPhases: preview.phases,
        targetTrackCount: preview.computed_total_tracks,
        activeTrack: preview.curated_set[0] || null,
        status: {
          step: 'ready',
          message: `${COGNITIVE_INTENTS[intent].name} arc generated: ${preview.computed_total_tracks} tracks (${Math.round(preview.computed_total_duration_ms / 60000)} mins).`,
          progress: 100
        }
      });
    }
  },

  clearError: () => set({ errorMessage: null }),

  syncLibrary: async () => {
    const { tokens, isMockMode } = get();
    set({
      isSyncingLibrary: true,
      status: {
        step: 'fetching',
        message: 'Sincronizando y analizando canciones de tu biblioteca...',
        progress: 15
      }
    });

    try {
      let rawTracks: Track[] = [];
      if (isMockMode || !tokens?.accessToken) {
        await new Promise((r) => setTimeout(r, 400));
        rawTracks = generateMockLikedTracks();
      } else {
        rawTracks = await fetchUserLikedSongs(
          tokens.accessToken,
          undefined,
          (fetched, total) => {
            set({
              status: {
                step: 'fetching',
                message: `Descargando canciones de tu biblioteca (${fetched}/${total})...`,
                progress: 15 + Math.round((fetched / Math.max(1, total)) * 40)
              }
            });
          }
        );
      }

      // Automatically analyze & enrich all tracks with cognitive acoustic vectors
      const enrichedTracks = enrichTrackLibrary(rawTracks);
      saveCachedTracks(enrichedTracks);
      set({
        likedTracks: enrichedTracks,
        isSyncingLibrary: false,
        status: {
          step: 'idle',
          message: `Biblioteca analizada: ${enrichedTracks.length} canciones con BPM, energía y mood únicos.`,
          progress: 100
        }
      });
    } catch (e: any) {
      console.error('Error syncing library:', e);
      set({
        isSyncingLibrary: false,
        errorMessage: e?.message || 'Error al sincronizar canciones de Spotify'
      });
    }
  },

  login: async () => {
    const { spotifyClientId } = get();
    if (
      !spotifyClientId ||
      spotifyClientId.includes('tu_client_id') ||
      spotifyClientId.includes('your_spotify') ||
      spotifyClientId.length < 15
    ) {
      set({
        errorMessage:
          'Se requiere un Client ID real de Spotify. Configúralo en Settings o usa el "Demo Mode" para probarlo inmediatamente sin credenciales.'
      });
      return;
    }
    try {
      await redirectToSpotifyLogin(spotifyClientId);
    } catch (err: any) {
      set({ errorMessage: err?.message || 'Failed to start Spotify authentication' });
    }
  },

  handleAuthCallback: async (code: string) => {
    set({ isAuthLoading: true });
    const { spotifyClientId } = get();
    try {
      const tokens = await exchangeCodeForTokens(code, spotifyClientId);
      const user = await getUserProfile(tokens.accessToken);
      set({
        tokens,
        user,
        isAuthenticated: true,
        isMockMode: false,
        errorMessage: null
      });
      return true;
    } catch (err: any) {
      console.error('Auth callback error:', err);
      set({
        errorMessage: `Spotify Authorization Failed: ${err?.message || 'Unknown error'}`
      });
      return false;
    } finally {
      set({ isAuthLoading: false });
    }
  },

  logout: () => {
    clearStoredTokens();
    set({
      tokens: null,
      user: null,
      isAuthenticated: false,
      isMockMode: false,
      likedTracks: [],
      flowTracks: [],
      flowResult: null,
      activeTrack: null,
      status: {
        step: 'idle',
        message: 'Logged out from Spotify',
        progress: 0
      },
      exportedPlaylist: null
    });
  },

  generateFlow: async () => {
    const { isMockMode, tokens, geminiApiKey, flowIntent } = get();

    set({
      status: {
        step: 'fetching',
        message: 'Checking persistent track library...',
        progress: 10
      },
      errorMessage: null,
      exportedPlaylist: null
    });

    let rawTracks: Track[] = get().likedTracks;

    try {
      // Step 1: Ingest tracks if not in state
      if (!rawTracks || rawTracks.length === 0) {
        const cached = getCachedTracks();
        if (cached.length > 0) {
          rawTracks = cached;
          set({ likedTracks: rawTracks });
        } else if (isMockMode || !tokens?.accessToken) {
          await new Promise((r) => setTimeout(r, 400));
          rawTracks = enrichTrackLibrary(generateMockLikedTracks());
          saveCachedTracks(rawTracks);
          set({ likedTracks: rawTracks });
        } else {
          const fetched = await fetchUserLikedSongs(
            tokens.accessToken,
            undefined,
            (cur, total) => {
              set({
                status: {
                  step: 'fetching',
                  message: `Descargando canciones de biblioteca (${cur}/${total})...`,
                  progress: 10 + Math.round((cur / Math.max(1, total)) * 25)
                }
              });
            }
          );
          rawTracks = enrichTrackLibrary(fetched);
          saveCachedTracks(rawTracks);
          set({ likedTracks: rawTracks });
        }
      }

      if (rawTracks.length === 0) {
        throw new Error('No liked songs found in your library. Like some songs on Spotify first!');
      }

      // Step 2: Cognitive DJ Set Synthesis via Gemini AI
      set({
        status: {
          step: 'analyzing',
          message: `Calibrating ${COGNITIVE_INTENTS[flowIntent].name} neuroscience curve...`,
          progress: 35
        }
      });

      const result = await curateCognitiveFlowWithGemini(
        rawTracks,
        flowIntent,
        geminiApiKey,
        (progress, message) => {
          set({
            status: {
              step: 'analyzing',
              message,
              progress
            }
          });
        }
      );

      // Step 3: Set State and Celebrate
      set({
        flowTracks: result.curated_set,
        flowResult: result,
        currentPhases: result.phases,
        targetTrackCount: result.computed_total_tracks,
        activeTrack: result.curated_set[0] || null,
        selectedPhaseFilter: 'all',
        status: {
          step: 'ready',
          message: `WaveFlow ${COGNITIVE_INTENTS[flowIntent].name} synthesized! ${result.computed_total_tracks} tracks (${Math.round(result.computed_total_duration_ms / 60000)} mins).`,
          progress: 100
        }
      });

      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.65 }
        });
      } catch (e) {
        // Confetti optional
      }
    } catch (err: any) {
      console.error('Flow generation error:', err);
      set({
        status: {
          step: 'error',
          message: err?.message || 'Error al generar el DJ set',
          progress: 0
        },
        errorMessage: err?.message || 'Error al generar el DJ set'
      });
    }
  },

  exportToSpotify: async () => {
    const { tokens, flowTracks, isMockMode, flowIntent, flowResult } = get();

    if (flowTracks.length === 0) {
      set({ errorMessage: 'No hay canciones para exportar. Genera un set primero.' });
      return;
    }

    const intentConfig = COGNITIVE_INTENTS[flowIntent];
    const durationMins = Math.round((flowResult?.computed_total_duration_ms || 3600000) / 60000);

    set({
      status: {
        step: 'exporting',
        message: 'Creando playlist y ordenando canciones en Spotify...',
        progress: 20
      },
      errorMessage: null
    });

    try {
      if (isMockMode || !tokens?.accessToken) {
        await new Promise((r) => setTimeout(r, 1200));
        const mockExport = {
          id: 'mock-exported-playlist-id',
          url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
          name: `WaveFlow — ${intentConfig.name}`
        };
        set({
          exportedPlaylist: mockExport,
          status: {
            step: 'exported',
            message: `¡Playlist "${mockExport.name}" exportada con éxito! (${flowTracks.length} canciones)`,
            progress: 100
          }
        });
        return;
      }

      const playlistTitle = `WaveFlow: ${intentConfig.name} (${durationMins}m)`;
      const description = `${intentConfig.tagline}. Calibrado por WaveFlow AI con arquitectura de transición de BPM y valencia.`;

      const result = await exportToSpotifyPlaylist(
        tokens.accessToken,
        get().user?.id || 'me',
        flowTracks,
        playlistTitle,
        description
      );

      set({
        exportedPlaylist: result,
        status: {
          step: 'exported',
          message: `¡Set exportado a Spotify! "${result.name}"`,
          progress: 100
        }
      });

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Confetti optional
      }
    } catch (err: any) {
      console.error('Export error:', err);
      set({
        status: {
          step: 'error',
          message: err?.message || 'Error al exportar playlist a Spotify',
          progress: 0
        },
        errorMessage: err?.message || 'Error al exportar playlist a Spotify'
      });
    }
  }
}));
