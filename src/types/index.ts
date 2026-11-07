export type CognitiveFlowIntentId =
  | 'deep_focus'
  | 'festival_explosive'
  | 'night_drive'
  | 'genre_cadence';

export type FlowPhaseName = string;
export type FlowStyleId = CognitiveFlowIntentId;


export interface CognitiveIntentConfig {
  id: CognitiveFlowIntentId;
  name: string;
  tagline: string;
  neuroscience_rationale: string;
  duration_target_mins: [number, number]; // [minMins, maxMins]
  target_energy_range: [number, number];
  bpm_tolerance: number; // max allowable BPM delta between adjacent tracks
  vocal_threshold_max?: number; // max allowable vocal presence for focus
  badge: string;
  color: string;
  accentGradient: string;
  phases: CognitivePhaseTemplate[];
}

export interface CognitivePhaseTemplate {
  name: string;
  description: string;
  duration_ratio: number; // 0 to 1 proportion of total set duration
  target_energy_range: [number, number];
  target_valence_range: [number, number];
  color: string;
  gradient: string;
}

export interface FlowPhaseConfig {
  name: string;
  description: string;
  trackCount: number;
  duration_ms: number;
  minEnergy: number;
  maxEnergy: number;
  color: string;
  gradient: string;
  rangeIndex: [number, number]; // 1-based start and end indices
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  artists?: string[];
  album: string;
  albumArt?: string;
  duration_ms: number;
  uri: string;
  preview_url?: string | null;

  // Persistent Cognitive Metadata Vectors
  energy_score: number; // 0 - 100
  valence_score: number; // 0 - 100 (emotional brightness)
  bpm: number; // Tempo
  vocal_presence: number; // 0 - 100 (0 = purely instrumental, 100 = heavy vocals)
  mood_vibe: string; // Semantic descriptor: "hypnotic", "driving", "ambient", "euphoric", "introspective"
  genre_vibe?: string;

  // Backwards compatibility aliases
  energy?: number;
  valence?: number;

  // Intent Curated Set Placement
  phase?: string;
  phaseIndex?: number;
  overallIndex?: number;
  transition_note?: string;
}

export interface CuratedSetResult {
  flow_intent: CognitiveFlowIntentId;
  computed_total_duration_ms: number;
  computed_total_tracks: number;
  phases: FlowPhaseConfig[];
  curated_set: Track[];
}

export interface GenerationStatus {
  step: 'idle' | 'fetching' | 'analyzing' | 'sorting' | 'ready' | 'exporting' | 'exported' | 'error';
  message: string;
  progress: number; // 0 to 100
  totalTracksFound?: number;
  analyzedCount?: number;
}

export interface UserProfile {
  id: string;
  display_name: string;
  email?: string;
  images?: { url: string }[];
  product?: string;
}

export interface SpotifyAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
}

export interface GeminiEnergyScore {
  id: string;
  energy: number;
  valence: number;
  bpm?: number;
  vocal_presence?: number;
  mood_vibe?: string;
}
