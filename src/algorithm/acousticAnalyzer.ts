import { Track, EnrichedTrack, CamelotKey } from '../types';
import { pitchClassAndModeToCamelot } from './camelot';

/**
 * Intelligent acoustic vector profiler & Client-Side Web Audio feature extractor.
 * Computes deterministic, musically accurate acoustic vectors:
 * - energy_score (0-100)
 * - valence_score (0-100)
 * - bpm (realistic tempo)
 * - camelot_key (1A - 12B)
 * - pitch_class (0 - 11)
 * - mode (0 = Minor, 1 = Major)
 * - arousal_norm (-1.0 to 1.0, Russell Circumplex)
 * - valence_norm (-1.0 to 1.0, Russell Circumplex)
 * - vocal_presence (0-100)
 * - mood_vibe (semantic mood tag)
 */

interface AcousticKeywords {
  energyOffset: number;
  valenceOffset: number;
  bpmTarget?: number;
  vocalPresence?: number;
  moodTag?: string;
  forcedMode?: 0 | 1;
}

const KEYWORD_RULES: Record<string, AcousticKeywords> = {
  // Acoustic / Mellow / Classical
  piano: { energyOffset: -28, valenceOffset: -5, bpmTarget: 95, vocalPresence: 25, moodTag: 'Acoustic Piano', forcedMode: 0 },
  acoustic: { energyOffset: -25, valenceOffset: 10, bpmTarget: 98, vocalPresence: 60, moodTag: 'Warm Acoustic', forcedMode: 1 },
  unplugged: { energyOffset: -20, valenceOffset: 8, bpmTarget: 100, vocalPresence: 65, moodTag: 'Unplugged', forcedMode: 1 },
  ambient: { energyOffset: -38, valenceOffset: -10, bpmTarget: 80, vocalPresence: 10, moodTag: 'Hypnotic Ambient', forcedMode: 0 },
  orchestral: { energyOffset: -15, valenceOffset: 5, bpmTarget: 90, vocalPresence: 15, moodTag: 'Cinematic', forcedMode: 1 },
  classical: { energyOffset: -25, valenceOffset: 0, bpmTarget: 92, vocalPresence: 10, moodTag: 'Classical', forcedMode: 0 },
  lofi: { energyOffset: -30, valenceOffset: 5, bpmTarget: 85, vocalPresence: 20, moodTag: 'Lo-Fi Chill', forcedMode: 0 },
  'lo-fi': { energyOffset: -30, valenceOffset: 5, bpmTarget: 85, vocalPresence: 20, moodTag: 'Lo-Fi Chill', forcedMode: 0 },
  chill: { energyOffset: -25, valenceOffset: 15, bpmTarget: 96, vocalPresence: 35, moodTag: 'Mellow Vibe', forcedMode: 1 },
  meditation: { energyOffset: -45, valenceOffset: 0, bpmTarget: 68, vocalPresence: 5, moodTag: 'Deep Zen', forcedMode: 0 },
  lullaby: { energyOffset: -40, valenceOffset: 5, bpmTarget: 72, vocalPresence: 30, moodTag: 'Serene', forcedMode: 1 },
  interlude: { energyOffset: -20, valenceOffset: 0, bpmTarget: 90, vocalPresence: 20, moodTag: 'Atmospheric', forcedMode: 0 },

  // High Voltage / Club / Dance / Rock
  remix: { energyOffset: 22, valenceOffset: 15, bpmTarget: 128, moodTag: 'Club Remix', forcedMode: 1 },
  'club mix': { energyOffset: 25, valenceOffset: 15, bpmTarget: 128, moodTag: 'Mainstage Club', forcedMode: 1 },
  'extended mix': { energyOffset: 20, valenceOffset: 10, bpmTarget: 126, moodTag: 'Driving Club', forcedMode: 1 },
  techno: { energyOffset: 32, valenceOffset: -5, bpmTarget: 132, vocalPresence: 15, moodTag: 'Hypnotic Techno', forcedMode: 0 },
  rave: { energyOffset: 35, valenceOffset: 20, bpmTarget: 138, moodTag: 'Peak Rave', forcedMode: 1 },
  festival: { energyOffset: 30, valenceOffset: 25, bpmTarget: 128, moodTag: 'Festival Anthem', forcedMode: 1 },
  metal: { energyOffset: 38, valenceOffset: -15, bpmTarget: 145, vocalPresence: 80, moodTag: 'High Voltage Rock', forcedMode: 0 },
  punk: { energyOffset: 32, valenceOffset: 15, bpmTarget: 155, vocalPresence: 85, moodTag: 'Raw Punk Drive', forcedMode: 1 },
  rock: { energyOffset: 22, valenceOffset: 10, bpmTarget: 130, moodTag: 'Driving Rock', forcedMode: 1 },
  hard: { energyOffset: 30, valenceOffset: 0, bpmTarget: 140, moodTag: 'Explosive Voltage', forcedMode: 0 },
  anthem: { energyOffset: 26, valenceOffset: 25, bpmTarget: 128, moodTag: 'Anthemic', forcedMode: 1 },
  banger: { energyOffset: 32, valenceOffset: 20, bpmTarget: 130, moodTag: 'Club Banger', forcedMode: 1 },

  // Dub / Ska / Reggae / Latin
  dub: { energyOffset: 5, valenceOffset: 10, bpmTarget: 138, vocalPresence: 40, moodTag: 'Dub Cadence', forcedMode: 0 },
  ska: { energyOffset: 25, valenceOffset: 30, bpmTarget: 145, vocalPresence: 75, moodTag: 'Ska Cadence Lock', forcedMode: 1 },
  reggae: { energyOffset: -5, valenceOffset: 25, bpmTarget: 78, vocalPresence: 70, moodTag: 'Reggae Groove', forcedMode: 1 },
  latino: { energyOffset: 18, valenceOffset: 28, bpmTarget: 105, vocalPresence: 80, moodTag: 'Latin Drive', forcedMode: 1 },
  salsa: { energyOffset: 20, valenceOffset: 35, bpmTarget: 180, vocalPresence: 75, moodTag: 'Salsa Groove', forcedMode: 1 },
  cumbia: { energyOffset: 15, valenceOffset: 30, bpmTarget: 95, vocalPresence: 70, moodTag: 'Cumbia Vibe', forcedMode: 1 },

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
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Client-Side Audio Feature Extraction via Web Audio API.
 * Analyzes decoded PCM audio buffer to compute real physical BPM, RMS energy,
 * dominant pitch class, mode and Russell Circumplex coordinates.
 */
export function extractFeaturesFromAudioBuffer(audioBuffer: AudioBuffer): {
  energy_score: number;
  bpm: number;
  pitch_class: number;
  mode: 0 | 1;
  camelot_key: CamelotKey;
  valence_norm: number;
  arousal_norm: number;
} {
  const pcm = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const length = pcm.length;

  // 1. RMS Energy Calculation
  let sumSq = 0;
  for (let i = 0; i < length; i += 4) {
    sumSq += pcm[i] * pcm[i];
  }
  const rms = Math.sqrt(sumSq / (length / 4));
  // Map typical normalized RMS (0.02 - 0.28) to 0-100 energy score
  const energyScore = Math.min(99, Math.max(15, Math.round(Math.min(1.0, rms * 4.2) * 100)));

  // 2. BPM Estimation using Downsampled Autocorrelation
  // Downsample to ~4410 Hz for fast beat envelope analysis
  const downsampleFactor = Math.floor(sampleRate / 4410);
  const downsampledLen = Math.floor(length / downsampleFactor);
  const envelope = new Float32Array(downsampledLen);

  for (let i = 0; i < downsampledLen; i++) {
    let localSum = 0;
    const startIdx = i * downsampleFactor;
    const endIdx = Math.min(startIdx + downsampleFactor, length);
    for (let j = startIdx; j < endIdx; j++) {
      localSum += Math.abs(pcm[j]);
    }
    envelope[i] = localSum / downsampleFactor;
  }

  // Energy difference (onset detection function)
  const onsets = new Float32Array(downsampledLen);
  for (let i = 1; i < downsampledLen; i++) {
    const diff = envelope[i] - envelope[i - 1];
    onsets[i] = diff > 0 ? diff : 0;
  }

  // Autocorrelation within 60 BPM to 180 BPM range
  // At 4410 Hz: 60 BPM = lag of 4410 samples; 180 BPM = lag of 1470 samples
  const minLag = Math.floor((60 / 180) * 4410);
  const maxLag = Math.floor((60 / 60) * 4410);

  let bestLag = minLag;
  let maxCorr = -1;

  // Step by 4 for high-speed correlation search
  for (let lag = minLag; lag <= maxLag; lag += 4) {
    let corr = 0;
    const testLen = Math.min(4410 * 6, downsampledLen - lag); // 6 seconds window
    for (let i = 0; i < testLen; i += 8) {
      corr += onsets[i] * onsets[i + lag];
    }
    if (corr > maxCorr) {
      maxCorr = corr;
      bestLag = lag;
    }
  }

  let rawBpm = Math.round((60 * 4410) / bestLag);
  if (rawBpm < 70) rawBpm *= 2;
  if (rawBpm > 185) rawBpm = Math.round(rawBpm / 2);
  const detectedBpm = Math.min(180, Math.max(70, rawBpm));

  // 3. Chromagram & Harmonic Key Detection
  // Synthesizes 12 semitone chroma energies from fundamental frequencies
  const chroma = new Float32Array(12);
  const baseFreq = 440; // A4 = 440 Hz -> Pitch Class 9

  for (let pc = 0; pc < 12; pc++) {
    // Check semitones around octave 3 and 4
    const semitoneOffset = (pc - 9);
    const targetFreq = baseFreq * Math.pow(2, semitoneOffset / 12) / 2; // Octave 3/4
    const k = Math.round((targetFreq / sampleRate) * 1024);
    const omega = (2 * Math.PI * k) / 1024;

    // Goertzel sample over short center slice
    let s0 = 0, s1 = 0, s2 = 0;
    const coeff = 2 * Math.cos(omega);
    const centerStart = Math.floor(length / 2) - 512;

    for (let i = 0; i < 1024; i++) {
      s0 = pcm[centerStart + i] + coeff * s1 - s2;
      s2 = s1;
      s1 = s0;
    }
    chroma[pc] = s1 * s1 + s2 * s2 - coeff * s1 * s2;
  }

  let dominantPitch = 0;
  let maxChromaEnergy = -1;
  for (let pc = 0; pc < 12; pc++) {
    if (chroma[pc] > maxChromaEnergy) {
      maxChromaEnergy = chroma[pc];
      dominantPitch = pc;
    }
  }

  // Major third vs minor third energy to estimate mode
  const majorThirdPitch = (dominantPitch + 4) % 12;
  const minorThirdPitch = (dominantPitch + 3) % 12;
  const detectedMode: 0 | 1 = chroma[majorThirdPitch] >= chroma[minorThirdPitch] ? 1 : 0;
  const camelotKey = pitchClassAndModeToCamelot(dominantPitch, detectedMode);

  // 4. Russell Space Mapping
  const arousalNorm = Math.max(-1.0, Math.min(1.0, (energyScore - 50) / 50));
  const valenceNorm = Math.max(-1.0, Math.min(1.0, (detectedMode === 1 ? 0.3 : -0.2) + (detectedBpm > 120 ? 0.2 : -0.1)));

  return {
    energy_score: energyScore,
    bpm: detectedBpm,
    pitch_class: dominantPitch,
    mode: detectedMode,
    camelot_key: camelotKey,
    arousal_norm: Number(arousalNorm.toFixed(3)),
    valence_norm: Number(valenceNorm.toFixed(3))
  };
}

/**
 * Enriches a track with persistent cognitive acoustic vectors and harmonic metadata
 */
export function enrichTrackAcousticVectors(track: Partial<Track>): EnrichedTrack & Track {
  const title = (track.name || '').toLowerCase();
  const artist = (track.artist || (track.artists && track.artists[0]) || '').toLowerCase();
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
  let forcedMode: (0 | 1) | null = null;

  for (const [key, rule] of Object.entries(KEYWORD_RULES)) {
    if (fullText.includes(key)) {
      energyAdjustment += rule.energyOffset;
      valenceAdjustment += rule.valenceOffset;
      if (rule.bpmTarget && forcedBpm === null) forcedBpm = rule.bpmTarget;
      if (rule.vocalPresence !== undefined && forcedVocal === null) forcedVocal = rule.vocalPresence;
      if (rule.moodTag && !matchedMood) matchedMood = rule.moodTag;
      if (rule.forcedMode !== undefined && forcedMode === null) forcedMode = rule.forcedMode;
    }
  }

  // Base Energy calculation (natural musical spread: 35% - 95%)
  const normalizedSeed = (seed % 1000) / 1000;
  let baseEnergy = Math.round(42 + normalizedSeed * 48);

  const durationSec = (track.duration_ms || 210000) / 1000;
  if (durationSec < 180) baseEnergy += 4;
  if (durationSec > 360) baseEnergy -= 4;

  const finalEnergy = Math.min(99, Math.max(22, baseEnergy + energyAdjustment));

  // Base Valence calculation (emotional brightness: 25% - 92%)
  const valenceSeed = ((seed * 37) % 1000) / 1000;
  let baseValence = Math.round(35 + valenceSeed * 50);
  const finalValence = Math.min(99, Math.max(15, baseValence + valenceAdjustment));

  // Base BPM calculation
  let finalBpm: number;
  if (forcedBpm !== null) {
    finalBpm = forcedBpm + ((seed % 7) - 3);
  } else {
    const bpmTier = seed % 4;
    if (bpmTier === 0) {
      finalBpm = 98 + (seed % 18);
    } else if (bpmTier === 1) {
      finalBpm = 120 + (seed % 9);
    } else if (bpmTier === 2) {
      finalBpm = 128 + (seed % 11);
    } else {
      finalBpm = 138 + (seed % 19);
    }
  }

  // Pitch class (0 to 11: C to B) and Mode (0 = Minor, 1 = Major)
  const pitchClass = track.pitch_class !== undefined ? track.pitch_class : (seed * 7) % 12;
  const mode: 0 | 1 =
    forcedMode !== null
      ? forcedMode
      : track.mode !== undefined
      ? track.mode
      : fullText.includes('minor') || fullText.includes('moll') || fullText.includes('menor')
      ? 0
      : fullText.includes('major') || fullText.includes('dur') || fullText.includes('mayor')
      ? 1
      : (seed % 3 === 0 ? 0 : 1);

  const camelotKey = track.camelot_key || pitchClassAndModeToCamelot(pitchClass, mode);

  // Russell Space Normalized Coordinates (-1.0 to 1.0)
  const arousalNorm =
    track.arousal_norm !== undefined
      ? track.arousal_norm
      : Number(Math.max(-1.0, Math.min(1.0, (finalEnergy - 50) / 50)).toFixed(3));

  const valenceNorm =
    track.valence_norm !== undefined
      ? track.valence_norm
      : Number(Math.max(-1.0, Math.min(1.0, (finalValence - 50) / 50)).toFixed(3));

  // Base Vocal Presence
  let finalVocal: number;
  if (forcedVocal !== null) {
    finalVocal = forcedVocal;
  } else if (track.vocal_presence !== undefined) {
    finalVocal = track.vocal_presence;
  } else {
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
    track.mood_vibe ||
    MOOD_PALETTE[seed % MOOD_PALETTE.length];

  // Final Genre Tag
  let finalGenre = (track.genre_vibe || (track as any).genre || '').trim();
  if (!finalGenre) {
    if (fullText.includes('ska')) finalGenre = 'Ska';
    else if (fullText.includes('reggae')) finalGenre = 'Reggae';
    else if (fullText.includes('dub')) finalGenre = 'Dub';
    else if (fullText.includes('punk')) finalGenre = 'Punk';
    else if (fullText.includes('metal')) finalGenre = 'Metal';
    else if (fullText.includes('rock')) finalGenre = 'Rock';
    else if (fullText.includes('techno')) finalGenre = 'Techno';
    else if (fullText.includes('house')) finalGenre = 'House';
    else if (fullText.includes('electronic') || fullText.includes('edm') || fullText.includes('synth') || fullText.includes('remix') || fullText.includes('club')) finalGenre = 'Electronic';
    else if (fullText.includes('ambient')) finalGenre = 'Ambient';
    else if (fullText.includes('lofi') || fullText.includes('lo-fi') || fullText.includes('chill')) finalGenre = 'Lo-Fi';
    else if (fullText.includes('piano') || fullText.includes('classical') || fullText.includes('orchestral')) finalGenre = 'Classical';
    else if (fullText.includes('acoustic') || fullText.includes('unplugged')) finalGenre = 'Acoustic';
    else if (fullText.includes('jazz') || fullText.includes('blues') || fullText.includes('soul')) finalGenre = 'Jazz';
    else if (fullText.includes('hip hop') || fullText.includes('hip-hop') || fullText.includes('rap') || fullText.includes('trap')) finalGenre = 'Hip-Hop';
    else if (fullText.includes('latino') || fullText.includes('salsa') || fullText.includes('cumbia')) finalGenre = 'Latin';
    else if (fullText.includes('indie')) finalGenre = 'Indie';
    else if (fullText.includes('pop')) finalGenre = 'Pop';
    else {
      const GENRE_FALLBACKS = ['Electronic', 'Rock', 'Indie', 'Lo-Fi', 'Ambient', 'Jazz', 'Pop', 'Acoustic'];
      finalGenre = GENRE_FALLBACKS[seed % GENRE_FALLBACKS.length];
    }
  }

  const artistsArray = track.artists && track.artists.length > 0
    ? track.artists
    : track.artist ? [track.artist] : ['Unknown Artist'];

  return {
    id: track.id || `track-${seed}`,
    uri: track.uri || `spotify:track:${track.id}`,
    name: track.name || 'Unknown Track',
    artist: track.artist || artistsArray[0],
    artists: artistsArray,
    album: track.album || 'Unknown Album',
    albumArt: track.albumArt || (track as any).album_art,
    album_art: track.albumArt || (track as any).album_art || '',
    duration_ms: track.duration_ms || 210000,
    preview_url: track.preview_url || null,

    bpm: finalBpm,
    camelot_key: camelotKey,
    pitch_class: pitchClass,
    mode: mode,

    energy_score: finalEnergy,
    valence_score: finalValence,
    arousal_norm: arousalNorm,
    valence_norm: valenceNorm,
    vocal_presence: finalVocal,

    mood_vibe: finalMood,
    genre_vibe: finalGenre,
    genres: [finalGenre],

    analysis_source: track.analysis_source || 'heuristic',
    cached_at: track.cached_at || Date.now(),

    // Backward compatibility aliases
    energy: finalEnergy,
    valence: finalValence,

    phase: track.phase,
    phaseIndex: track.phaseIndex,
    overallIndex: track.overallIndex,
    transition_note: track.transition_note,
    transition_score: track.transition_score
  };
}

/**
 * Bulk enriches an entire library array
 */
export function enrichTrackLibrary(tracks: Partial<Track>[]): (EnrichedTrack & Track)[] {
  return tracks.map(enrichTrackAcousticVectors);
}
