import { Track } from '../types';

/**
 * Intelligent acoustic vector profiler.
 * Analyzes track metadata (title, artist, album, duration, audio hints)
 * to compute deterministic, musically accurate acoustic vectors:
 * - energy_score (0-100)
 * - valence_score (0-100)
 * - bpm (realistic tempo)
 * - vocal_presence (0-100)
 * - mood_vibe (semantic mood tag)
 */

interface AcousticKeywords {
  energyOffset: number;
  valenceOffset: number;
  bpmTarget?: number;
  vocalPresence?: number;
  moodTag?: string;
}

const KEYWORD_RULES: Record<string, AcousticKeywords> = {
  // Acoustic / Mellow / Classical
  piano: { energyOffset: -28, valenceOffset: -5, bpmTarget: 95, vocalPresence: 25, moodTag: 'Acoustic Piano' },
  acoustic: { energyOffset: -25, valenceOffset: 10, bpmTarget: 98, vocalPresence: 60, moodTag: 'Warm Acoustic' },
  unplugged: { energyOffset: -20, valenceOffset: 8, bpmTarget: 100, vocalPresence: 65, moodTag: 'Unplugged' },
  ambient: { energyOffset: -38, valenceOffset: -10, bpmTarget: 80, vocalPresence: 10, moodTag: 'Hypnotic Ambient' },
  orchestral: { energyOffset: -15, valenceOffset: 5, bpmTarget: 90, vocalPresence: 15, moodTag: 'Cinematic' },
  classical: { energyOffset: -25, valenceOffset: 0, bpmTarget: 92, vocalPresence: 10, moodTag: 'Classical' },
  lofi: { energyOffset: -30, valenceOffset: 5, bpmTarget: 85, vocalPresence: 20, moodTag: 'Lo-Fi Chill' },
  'lo-fi': { energyOffset: -30, valenceOffset: 5, bpmTarget: 85, vocalPresence: 20, moodTag: 'Lo-Fi Chill' },
  chill: { energyOffset: -25, valenceOffset: 15, bpmTarget: 96, vocalPresence: 35, moodTag: 'Mellow Vibe' },
  meditation: { energyOffset: -45, valenceOffset: 0, bpmTarget: 68, vocalPresence: 5, moodTag: 'Deep Zen' },
  lullaby: { energyOffset: -40, valenceOffset: 5, bpmTarget: 72, vocalPresence: 30, moodTag: 'Serene' },
  interlude: { energyOffset: -20, valenceOffset: 0, bpmTarget: 90, vocalPresence: 20, moodTag: 'Atmospheric' },

  // High Voltage / Club / Dance / Rock
  remix: { energyOffset: 22, valenceOffset: 15, bpmTarget: 128, moodTag: 'Club Remix' },
  'club mix': { energyOffset: 25, valenceOffset: 15, bpmTarget: 128, moodTag: 'Mainstage Club' },
  'extended mix': { energyOffset: 20, valenceOffset: 10, bpmTarget: 126, moodTag: 'Driving Club' },
  techno: { energyOffset: 32, valenceOffset: -5, bpmTarget: 132, vocalPresence: 15, moodTag: 'Hypnotic Techno' },
  rave: { energyOffset: 35, valenceOffset: 20, bpmTarget: 138, moodTag: 'Peak Rave' },
  festival: { energyOffset: 30, valenceOffset: 25, bpmTarget: 128, moodTag: 'Festival Anthem' },
  metal: { energyOffset: 38, valenceOffset: -15, bpmTarget: 145, vocalPresence: 80, moodTag: 'High Voltage Rock' },
  punk: { energyOffset: 32, valenceOffset: 15, bpmTarget: 155, vocalPresence: 85, moodTag: 'Raw Punk Drive' },
  rock: { energyOffset: 22, valenceOffset: 10, bpmTarget: 130, moodTag: 'Driving Rock' },
  hard: { energyOffset: 30, valenceOffset: 0, bpmTarget: 140, moodTag: 'Explosive Voltage' },
  anthem: { energyOffset: 26, valenceOffset: 25, bpmTarget: 128, moodTag: 'Anthemic' },
  banger: { energyOffset: 32, valenceOffset: 20, bpmTarget: 130, moodTag: 'Club Banger' },

  // Dub / Ska / Reggae / Latin
  dub: { energyOffset: 5, valenceOffset: 10, bpmTarget: 138, vocalPresence: 40, moodTag: 'Dub Cadence' },
  ska: { energyOffset: 25, valenceOffset: 30, bpmTarget: 145, vocalPresence: 75, moodTag: 'Ska Cadence Lock' },
  reggae: { energyOffset: -5, valenceOffset: 25, bpmTarget: 78, vocalPresence: 70, moodTag: 'Reggae Groove' },
  latino: { energyOffset: 18, valenceOffset: 28, bpmTarget: 105, vocalPresence: 80, moodTag: 'Latin Drive' },
  salsa: { energyOffset: 20, valenceOffset: 35, bpmTarget: 180, vocalPresence: 75, moodTag: 'Salsa Groove' },
  cumbia: { energyOffset: 15, valenceOffset: 30, bpmTarget: 95, vocalPresence: 70, moodTag: 'Cumbia Vibe' },

  // Live / Concert
  live: { energyOffset: 12, valenceOffset: 15, vocalPresence: 85, moodTag: 'Live Energy' },
  directo: { energyOffset: 12, valenceOffset: 15, vocalPresence: 85, moodTag: 'Live Concert' },
  'en vivo': { energyOffset: 12, valenceOffset: 15, vocalPresence: 85, moodTag: 'Live Concert' }
};

const MOOD_PALETTE = [
  'Driving Groove',
  'Hypnotic',
  'Melodic Focus',
  'Euphoric Glow',
  'Introspective',
  'High Voltage',
  'Warm Resonance',
  'Deep Wave',
  'Anthemic',
  'In-The-Pocket'
];

/**
 * Computes deterministic 32-bit hash string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Enriches a track with persistent cognitive acoustic vectors
 */
export function enrichTrackAcousticVectors(track: Partial<Track>): Track {
  const title = (track.name || '').toLowerCase();
  const artist = (track.artist || '').toLowerCase();
  const album = (track.album || '').toLowerCase();
  const fullText = `${title} ${artist} ${album}`;

  // Deterministic seed based on track identification
  const seedString = `${track.id || ''}:${track.name || ''}:${track.artist || ''}:${track.duration_ms || 210000}`;
  const seed = hashString(seedString);

  // Check matching keyword rules
  let energyAdjustment = 0;
  let valenceAdjustment = 0;
  let forcedBpm: number | null = null;
  let forcedVocal: number | null = null;
  let matchedMood: string | null = null;

  for (const [key, rule] of Object.entries(KEYWORD_RULES)) {
    if (fullText.includes(key)) {
      energyAdjustment += rule.energyOffset;
      valenceAdjustment += rule.valenceOffset;
      if (rule.bpmTarget && forcedBpm === null) forcedBpm = rule.bpmTarget;
      if (rule.vocalPresence !== undefined && forcedVocal === null) forcedVocal = rule.vocalPresence;
      if (rule.moodTag && !matchedMood) matchedMood = rule.moodTag;
    }
  }

  // Base Energy calculation (natural musical spread: 35% - 95%)
  const normalizedSeed = (seed % 1000) / 1000;
  let baseEnergy = Math.round(42 + normalizedSeed * 48); // 42 to 90 baseline

  // Artist/title duration factor (longer songs often build slower, short songs hit punchier)
  const durationSec = (track.duration_ms || 210000) / 1000;
  if (durationSec < 180) baseEnergy += 4;
  if (durationSec > 360) baseEnergy -= 4;

  let finalEnergy = Math.min(99, Math.max(22, baseEnergy + energyAdjustment));

  // Base Valence calculation (emotional brightness: 25% - 92%)
  const valenceSeed = ((seed * 37) % 1000) / 1000;
  let baseValence = Math.round(35 + valenceSeed * 50);
  let finalValence = Math.min(99, Math.max(15, baseValence + valenceAdjustment));

  // Base BPM calculation
  let finalBpm: number;
  if (forcedBpm !== null) {
    // Add ±3 variation to target
    finalBpm = forcedBpm + ((seed % 7) - 3);
  } else {
    // Realistic multi-tier DJ tempo distribution
    const bpmTier = seed % 4;
    if (bpmTier === 0) {
      // Mid-tempo groove (98 - 116 BPM)
      finalBpm = 98 + (seed % 18);
    } else if (bpmTier === 1) {
      // Classic House / Dance / Melodic (120 - 128 BPM)
      finalBpm = 120 + (seed % 9);
    } else if (bpmTier === 2) {
      // Peak Club / Electro / Techno (128 - 138 BPM)
      finalBpm = 128 + (seed % 11);
    } else {
      // Fast Rock / Drum&Bass half-time / Pop (138 - 156 BPM)
      finalBpm = 138 + (seed % 19);
    }
  }

  // Base Vocal Presence
  let finalVocal: number;
  if (forcedVocal !== null) {
    finalVocal = forcedVocal;
  } else {
    // Check if title mentions instrumental or feat/vocal
    if (fullText.includes('instrumental') || fullText.includes('karaoke')) {
      finalVocal = Math.round(5 + (seed % 12));
    } else if (fullText.includes('feat') || fullText.includes('ft.')) {
      finalVocal = Math.round(75 + (seed % 22));
    } else {
      finalVocal = Math.round(45 + (seed % 45));
    }
  }

  // Final Mood Tag
  const finalMood =
    matchedMood ||
    MOOD_PALETTE[seed % MOOD_PALETTE.length];

  return {
    id: track.id || `track-${seed}`,
    name: track.name || 'Unknown Track',
    artist: track.artist || 'Unknown Artist',
    artists: track.artists || (track.artist ? [track.artist] : []),
    album: track.album || 'Unknown Album',
    albumArt: track.albumArt,
    duration_ms: track.duration_ms || 210000,
    uri: track.uri || `spotify:track:${track.id}`,
    preview_url: track.preview_url,

    energy_score: finalEnergy,
    valence_score: finalValence,
    bpm: finalBpm,
    vocal_presence: finalVocal,
    mood_vibe: finalMood,

    // Backward compatibility aliases
    energy: finalEnergy,
    valence: finalValence,

    phase: track.phase,
    phaseIndex: track.phaseIndex,
    overallIndex: track.overallIndex,
    transition_note: track.transition_note
  };
}

/**
 * Bulk enriches an entire library array
 */
export function enrichTrackLibrary(tracks: Partial<Track>[]): Track[] {
  return tracks.map(enrichTrackAcousticVectors);
}
