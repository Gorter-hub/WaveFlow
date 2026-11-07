import { create } from 'zustand';
import {
  FlowPhaseName,
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
import { analyzeTracksWithGemini } from '../api/gemini';
import { generateDJCurve } from '../algorithm/curveGenerator';
import { generateMockLikedTracks } from '../api/mockData';
import confetti from 'canvas-confetti';

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

  // Tracks State
  likedTracks: Track[];
  flowTracks: Track[];
  activeTrack: Track | null;
  selectedPhaseFilter: FlowPhaseName | 'all';
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
  setSelectedPhaseFilter: (phase: FlowPhaseName | 'all') => void;
  clearError: () => void;

  // Core Flow Workflow
  generateFlow: () => Promise<void>;
  exportToSpotify: () => Promise<void>;
}

export const useWaveFlowStore = create<WaveFlowStore>((set, get) => ({
  spotifyClientId:
    localStorage.getItem('waveflow_spotify_client_id') ||
    import.meta.env.VITE_SPOTIFY_CLIENT_ID ||
    '',
  geminiApiKey:
    localStorage.getItem('waveflow_gemini_api_key') ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    '',
  isMockMode: false,

  tokens: null,
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,

  likedTracks: [],
  flowTracks: [],
  activeTrack: null,
  selectedPhaseFilter: 'all',
  activeTab: 'generate',

  status: {
    step: 'idle',
    message: 'Ready to generate your personal DJ flow',
    progress: 0
  },
  errorMessage: null,
  exportedPlaylist: null,

  init: async () => {
    set({ isAuthLoading: true });
    try {
      const stored = getStoredTokens();
      if (stored && stored.accessToken) {
        // Validate / fetch profile
        if (Date.now() < stored.expiresAt) {
          try {
            const profile = await getUserProfile(stored.accessToken);
            set({
              tokens: stored,
              user: profile,
              isAuthenticated: true,
              isMockMode: false
            });
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
      const mockTracks = generateMockLikedTracks();
      const initialFlow = generateDJCurve(mockTracks);
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
        flowTracks: initialFlow,
        activeTrack: initialFlow[0] || null,
        errorMessage: null,
        status: {
          step: 'ready',
          message: 'WaveFlow DJ set ready! 50 tracks curated across 6 dynamic phases.',
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
  clearError: () => set({ errorMessage: null }),

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
    const { isMockMode, tokens, geminiApiKey } = get();

    set({
      status: {
        step: 'fetching',
        message: 'Fetching all Liked Songs from your Spotify library...',
        progress: 10
      },
      errorMessage: null,
      exportedPlaylist: null
    });

    let rawTracks: Track[] = [];

    try {
      // Step 1: Fetch tracks
      if (isMockMode || !tokens?.accessToken) {
        // Mock mode fetch with smooth simulation
        await new Promise((r) => setTimeout(r, 600));
        rawTracks = generateMockLikedTracks();
        set((state) => ({
          likedTracks: rawTracks,
          status: {
            step: 'fetching',
            message: `Loaded ${rawTracks.length} personal liked tracks`,
            progress: 35
          }
        }));
      } else {
        // Spotify API fetch (200 tracks)
        rawTracks = await fetchUserLikedSongs(
          tokens.accessToken,
          undefined,
          (fetched, total) => {
            set((state) => ({
              status: {
                step: 'fetching',
                message: `Retrieving liked songs (${fetched}/${total})...`,
                progress: 10 + Math.round((fetched / Math.max(1, total)) * 25)
              }
            }));
          }
        );
        set({ likedTracks: rawTracks });
      }

      if (rawTracks.length === 0) {
        throw new Error('No liked songs found in your library. Like some songs on Spotify first!');
      }

      // Step 2: AI Energy & Valence Rating via Gemini API
      set({
        status: {
          step: 'analyzing',
          message: 'Passing tracks to Gemini AI for acoustic energy scoring...',
          progress: 40
        }
      });

      const scoreMap = await analyzeTracksWithGemini(
        rawTracks,
        geminiApiKey,
        (current, total) => {
          const pct = 40 + Math.round((current / total) * 35);
          set({
            status: {
              step: 'analyzing',
              message: `Gemini AI analyzing energy & mood dynamics (${current}/${total})...`,
              progress: pct
            }
          });
        }
      );

      // Merge scores into tracks
      const scoredTracks: Track[] = rawTracks.map((t) => {
        const score = scoreMap.get(t.id);
        return {
          ...t,
          energy: score?.energy ?? 50,
          valence: score?.valence ?? 50
        };
      });

      // Step 3: Run DJ Set Curve Algorithm (6 Phases, 50 tracks)
      set({
        status: {
          step: 'sorting',
          message: 'Synthesizing 6-phase DJ set curve: Warm-up → Build → Peak → Valley → Climax → Outro',
          progress: 85
        }
      });

      await new Promise((r) => setTimeout(r, 400));
      const orderedFlow = generateDJCurve(scoredTracks);

      set({
        flowTracks: orderedFlow,
        activeTrack: orderedFlow[0] || null,
        status: {
          step: 'ready',
          message: `WaveFlow DJ set ready! 50 tracks curated across 6 dynamic phases.`,
          progress: 100
        }
      });
    } catch (err: any) {
      console.error('Flow generation error:', err);
      set({
        status: {
          step: 'error',
          message: err?.message || 'Error generating flow',
          progress: 0
        },
        errorMessage: err?.message || 'An error occurred during flow generation'
      });
    }
  },

  exportToSpotify: async () => {
    const { flowTracks, isMockMode, tokens, user } = get();

    if (flowTracks.length === 0) {
      set({ errorMessage: 'No flow tracks available. Generate a flow first!' });
      return;
    }

    set({
      status: {
        step: 'exporting',
        message: 'Creating private playlist & injecting 50 ordered tracks into Spotify...',
        progress: 50
      },
      errorMessage: null
    });

    try {
      if (isMockMode || !tokens?.accessToken) {
        // Simulated export
        await new Promise((r) => setTimeout(r, 1200));
        const mockResult = {
          id: `mock-playlist-${Date.now()}`,
          url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
          name: `WaveFlow DJ Set — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        };

        set({
          exportedPlaylist: mockResult,
          status: {
            step: 'exported',
            message: 'Playlist exported successfully to Spotify!',
            progress: 100
          }
        });

        // Trigger celebratory confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#1DB954', '#1ed760', '#ffffff', '#38bdf8', '#f43f5e']
        });
      } else {
        const result = await exportToSpotifyPlaylist(
          tokens.accessToken,
          user?.id || 'me',
          flowTracks
        );

        set({
          exportedPlaylist: result,
          status: {
            step: 'exported',
            message: `Created "${result.name}" with 50 tracks in your Spotify library!`,
            progress: 100
          }
        });

        // Trigger celebratory confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.8 },
          colors: ['#1DB954', '#1ed760', '#ffffff', '#38bdf8', '#f43f5e']
        });
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      set({
        status: {
          step: 'error',
          message: err?.message || 'Export failed',
          progress: 0
        },
        errorMessage: err?.message || 'Failed to export playlist to Spotify'
      });
    }
  }
}));
