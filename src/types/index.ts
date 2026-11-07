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
  energy?: number; // 0 - 100
  valence?: number; // 0 - 100
  phase?: FlowPhaseName;
  phaseIndex?: number;
  overallIndex?: number;
}

export type FlowPhaseName =
  | 'Warm-up'
  | 'Build-up'
  | 'Peak'
  | 'Valley/Respiro'
  | 'Climax'
  | 'Outro';

export type FlowStyleId = 'classic' | 'festival' | 'deep' | 'relentless';

export interface FlowStylePreset {
  id: FlowStyleId;
  name: string;
  tagline: string;
  badge: string;
  description: string;
  phaseWeights: { [key in FlowPhaseName]: number }; // percentage weights summing to 100
  energyRanges?: { [key in FlowPhaseName]?: [number, number] };
}

export interface FlowPhaseConfig {
  name: FlowPhaseName;
  description: string;
  trackCount: number;
  minEnergy: number;
  maxEnergy: number;
  color: string;
  gradient: string;
  rangeIndex: [number, number]; // 1-based start and end indices
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
}
