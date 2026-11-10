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

export type GenreSelectionMode = 'surprise' | 'prefer' | 'strict';

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type CamelotKey = `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}${'A' | 'B'}`;

export type MacroGenre =
  | 'Ska'
  | 'Reggae'
  | 'Punk'
  | 'Rock'
  | 'Metal'
  | 'Electronic'
  | 'Hip-Hop'
  | 'Jazz'
  | 'Latin'
  | 'Pop'
  | 'Indie'
  | 'Folk'
  | 'Classical'
  | 'Lo-Fi';

export interface EnrichedTrack {
  id: string;
  uri: string;
  name: string;
  artist: string;
  artists: string[];
  album: string;
  album_art: string;
  albumArt?: string;
  duration_ms: number;
  preview_url: string | null;
  bpm: number;
  camelot_key: CamelotKey;
  pitch_class: number; // 0 to 11 (C, C#, D...)
  mode: 0 | 1; // 0 = Minor (A), 1 = Major (B)
  energy_score: number; // 0 - 100
  valence_score: number; // 0 - 100
  arousal_norm: number; // -1.0 to 1.0 (Russell circumplex)
  valence_norm: number; // -1.0 to 1.0 (Russell circumplex)
  vocal_presence: number; // 0 - 100
  has_lyrics?: boolean;
  genres: string[];
  macro_genres?: MacroGenre[];
  genre_vibe?: string;
  mood_vibe: string;
  analysis_source: 'web_audio' | 'gemini_batch' | 'heuristic';
  cached_at: number;

  // Compatibility aliases
  energy?: number;
  valence?: number;
  phase?: string;
  phaseIndex?: number;
  overallIndex?: number;
  transition_note?: string;
  transition_score?: number;
}

export interface FlowGenerationControls {
  targetDurationMins?: number;
  intensity?: IntensityLevel;
  transitionStyle?: TransitionStyleOption;
  vocals?: VocalPresenceOption;

  // Enhanced Genre Controls
  selectedGenres?: string[];
  genreMode?: GenreSelectionMode;
  seed?: number;

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
  has_lyrics?: boolean;
  mood_vibe: string; // Semantic descriptor: "hypnotic", "driving", "ambient", "euphoric", "introspective"
  genre_vibe?: string;

  // Harmonic & Russell Circumplex Space
  camelot_key?: CamelotKey;
  pitch_class?: number; // 0 to 11
  mode?: 0 | 1; // 0 = Minor (A), 1 = Major (B)
  arousal_norm?: number; // -1.0 to 1.0 (Russell circumplex)
  valence_norm?: number; // -1.0 to 1.0 (Russell circumplex)
  genres?: string[];
  macro_genres?: MacroGenre[];
  analysis_source?: 'web_audio' | 'gemini_batch' | 'heuristic';
  cached_at?: number;
  transition_score?: number;

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
  strictWarning?: string;
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
