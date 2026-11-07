export type CognitiveFlowIntentId =
  | 'deep_focus'
  | 'reading_study'
  | 'creative_flow'
  | 'relax_unwind'
  | 'mood_shift'
  | 'night_drive'
  | 'festival_explosive'
  | 'workout'
  | 'morning_boost'
  | 'morning_motivation' // backward compatibility alias for morning_boost
  | 'roadtrip'
  | 'genre_cadence'
  | 'musical_discovery';

export type IntentCategory =
  | 'focus_creativity'
  | 'relaxation_emotion'
  | 'energy_movement'
  | 'journey_exploration';

export type FlowPhaseName = string;
export type FlowStyleId = CognitiveFlowIntentId;

export type IntensityLevel = 'calm' | 'balanced' | 'intense' | 'energetic';
export type TransitionStyleOption = 'smooth' | 'natural' | 'dynamic' | 'seamless' | 'adventurous';
export type VocalPresenceOption = 'instrumental' | 'mixed' | 'welcome' | 'balanced';

export interface FlowGenerationControls {
  targetDurationMins?: number;
  intensity?: IntensityLevel;
  transitionStyle?: TransitionStyleOption;
  vocals?: VocalPresenceOption;

  // Contextual controls
  moodShiftCurrent?: 'calm' | 'neutral' | 'tired' | 'restless' | 'low' | 'energized';
  moodShiftTarget?: 'relaxed' | 'focused' | 'uplifted' | 'motivated' | 'energized' | 'reflective';
  genrePreference?: string;
  studyTaskType?: 'reading' | 'writing' | 'studying';
  workoutProfile?: 'sustained' | 'intervals' | 'power';
  discoveryNovelty?: 'balanced' | 'deep_cuts' | 'adventurous';
}

export interface CognitiveIntentConfig {
  id: CognitiveFlowIntentId;
  name: string;
  tagline: string;
  category: IntentCategory;
  musical_objective: string;
  neuroscience_rationale?: string; // preserved for compatibility
  duration_target_mins: [number, number]; // [minMins, maxMins]
  default_duration_mins: number;
  target_energy_range: [number, number];
  target_valence_range?: [number, number];
  bpm_tolerance: number;
  vocal_threshold_max?: number;
  badge: string;
  color: string;
  accentGradient: string;
  phases: CognitivePhaseTemplate[];
  defaultControls: Required<Pick<FlowGenerationControls, 'targetDurationMins' | 'intensity' | 'transitionStyle' | 'vocals'>> &
    Partial<FlowGenerationControls>;
}

export interface CognitivePhaseTemplate {
  name: string;
  description: string;
  duration_ratio: number; // 0 to 1 proportion of total set duration
  target_energy_range: [number, number];
  target_valence_range: [number, number];
  phaseType?: 'warmup' | 'build' | 'plateau' | 'reset' | 'climax' | 'cooldown';
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
  applied_controls?: FlowGenerationControls;
}

export interface GenerationStatus {
  step: 'idle' | 'configuring' | 'fetching' | 'analyzing' | 'sorting' | 'ready' | 'exporting' | 'exported' | 'error';
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
