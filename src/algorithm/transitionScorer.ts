import { Track, CognitiveFlowIntentId } from '../types';

export interface TransitionContext {
  intentId: CognitiveFlowIntentId;
  targetBpmDelta?: number;
  allowHalfDoubleTime?: boolean;
  transitionStyle?: 'seamless' | 'balanced' | 'adventurous';
  phaseType?: 'warmup' | 'build' | 'plateau' | 'reset' | 'climax' | 'cooldown';
  recentArtists?: string[]; // Last 3-4 artists in sequence
}

export interface TransitionEvaluation {
  score: number; // 0 (incompatible) to 100 (flawless transition)
  rhythmicScore: number;
  emotionalScore: number;
  stylisticScore: number;
  penalty: number;
  transitionType: string;
  note: string;
}

/**
 * Calculates effective BPM difference taking into account half-time and double-time relationships.
 * For instance: 70 BPM and 140 BPM, or 80 BPM and 160 BPM, are harmonically locked in half/double time.
 */
export function calculateBpmCompatibility(
  bpmA: number,
  bpmB: number,
  allowHalfDouble: boolean = true
): { effectiveDelta: number; isHalfDouble: boolean; relation: 'exact' | 'half' | 'double' | 'near' } {
  const directDelta = Math.abs(bpmA - bpmB);

  if (!allowHalfDouble) {
    return {
      effectiveDelta: directDelta,
      isHalfDouble: false,
      relation: directDelta <= 3 ? 'exact' : 'near'
    };
  }

  // Check double time (B is ~2x A)
  const doubleDelta = Math.abs(bpmA * 2 - bpmB);
  // Check half time (A is ~2x B)
  const halfDelta = Math.abs(bpmA - bpmB * 2);

  const minDelta = Math.min(directDelta, doubleDelta, halfDelta);

  if (minDelta === directDelta) {
    return {
      effectiveDelta: directDelta,
      isHalfDouble: false,
      relation: directDelta <= 3 ? 'exact' : 'near'
    };
  } else if (minDelta === doubleDelta && doubleDelta <= 6) {
    return {
      effectiveDelta: doubleDelta,
      isHalfDouble: true,
      relation: 'double'
    };
  } else if (minDelta === halfDelta && halfDelta <= 6) {
    return {
      effectiveDelta: halfDelta,
      isHalfDouble: true,
      relation: 'half'
    };
  }

  return {
    effectiveDelta: minDelta,
    isHalfDouble: false,
    relation: 'near'
  };
}

/**
 * Evaluates the musical compatibility between two consecutive tracks
 */
export function evaluateTrackTransition(
  prevTrack: Track | null,
  nextTrack: Track,
  context: TransitionContext
): TransitionEvaluation {
  // If set opener, evaluate self-anchoring
  if (!prevTrack) {
    return {
      score: 95,
      rhythmicScore: 100,
      emotionalScore: 100,
      stylisticScore: 100,
      penalty: 0,
      transitionType: 'opener',
      note: 'Set Opener · Key Anchor'
    };
  }

  const {
    intentId,
    allowHalfDoubleTime = true,
    transitionStyle = 'balanced',
    phaseType = 'plateau',
    recentArtists = []
  } = context;

  // 1. Rhythmic Compatibility (BPM & Half/Double time)
  const { effectiveDelta, isHalfDouble, relation } = calculateBpmCompatibility(
    prevTrack.bpm || 124,
    nextTrack.bpm || 124,
    allowHalfDoubleTime
  );

  let maxAllowedDelta = 4;
  if (intentId === 'deep_focus' || intentId === 'reading_study') maxAllowedDelta = 3;
  if (intentId === 'festival_explosive') maxAllowedDelta = 7;
  if (intentId === 'night_drive' || intentId === 'creative_flow') maxAllowedDelta = 6;
  if (intentId === 'genre_cadence') maxAllowedDelta = 3;

  if (transitionStyle === 'seamless') maxAllowedDelta = Math.max(2, maxAllowedDelta - 1);
  if (transitionStyle === 'adventurous') maxAllowedDelta += 3;

  let rhythmicScore = 100;
  if (effectiveDelta <= maxAllowedDelta) {
    rhythmicScore = 100 - (effectiveDelta / maxAllowedDelta) * 15;
  } else {
    // Gradual decay penalty
    const excess = effectiveDelta - maxAllowedDelta;
    rhythmicScore = Math.max(10, 85 - excess * 8);
  }

  // Bonus for clever half-time / double-time bridges
  if (isHalfDouble && effectiveDelta <= 4) {
    rhythmicScore = Math.min(100, rhythmicScore + 10);
  }

  // 2. Emotional Compatibility (Valence & Arousal/Energy step)
  const prevValence = prevTrack.valence_score ?? prevTrack.valence ?? 50;
  const nextValence = nextTrack.valence_score ?? nextTrack.valence ?? 50;
  const valenceDelta = Math.abs(nextValence - prevValence);

  const prevEnergy = prevTrack.energy_score ?? prevTrack.energy ?? 50;
  const nextEnergy = nextTrack.energy_score ?? nextTrack.energy ?? 50;
  const energyDelta = Math.abs(nextEnergy - prevEnergy);

  let emotionalScore = 100;

  // Valence continuity: whiplash > 30 is penalized unless in adventurous mode
  if (valenceDelta <= 12) {
    emotionalScore = 98;
  } else if (valenceDelta <= 25) {
    emotionalScore = 85;
  } else {
    emotionalScore = Math.max(20, 85 - (valenceDelta - 25) * 1.8);
  }

  // Energy step appropriateness
  if (phaseType === 'reset') {
    // In a reset valley, a downward energy step is positive!
    if (nextEnergy < prevEnergy) {
      emotionalScore += 8;
    }
  } else if (phaseType === 'build' || phaseType === 'climax') {
    // In build or climax, upward momentum is rewarded
    if (nextEnergy >= prevEnergy - 4) {
      emotionalScore += 5;
    }
  } else if (phaseType === 'plateau') {
    // Energy should remain stable (±10%)
    if (energyDelta > 16) {
      emotionalScore -= (energyDelta - 16) * 1.5;
    }
  }

  emotionalScore = Math.min(100, Math.max(0, emotionalScore));

  // 3. Stylistic & Texture Compatibility
  let stylisticScore = 85;
  const prevMood = (prevTrack.mood_vibe || '').toLowerCase();
  const nextMood = (nextTrack.mood_vibe || '').toLowerCase();

  if (prevMood && nextMood && prevMood === nextMood) {
    stylisticScore = 100;
  } else if (
    (prevMood.includes('groove') && nextMood.includes('groove')) ||
    (prevMood.includes('hypnotic') && nextMood.includes('deep')) ||
    (prevMood.includes('club') && nextMood.includes('voltage')) ||
    (prevMood.includes('acoustic') && nextMood.includes('serene'))
  ) {
    stylisticScore = 95;
  }

  // Vocal transition smoothness
  const prevVocals = prevTrack.vocal_presence ?? 50;
  const nextVocals = nextTrack.vocal_presence ?? 50;
  const vocalDelta = Math.abs(nextVocals - prevVocals);

  if (intentId === 'deep_focus' || intentId === 'reading_study') {
    // Low vocal changes preferred
    if (nextVocals > 35) {
      stylisticScore -= (nextVocals - 35) * 1.2;
    }
  } else if (vocalDelta > 55) {
    // Abrupt jump from 0% instrumental to 100% choir/rap vocal
    stylisticScore -= 12;
  }

  stylisticScore = Math.min(100, Math.max(10, stylisticScore));

  // 4. Sequence Context Penalties
  let penalty = 0;

  // Duplicate track penalty: strict 0 score
  if (prevTrack.id === nextTrack.id) {
    penalty += 200;
  }

  // Duplicate title/artist penalty
  if (
    prevTrack.name.toLowerCase() === nextTrack.name.toLowerCase() &&
    prevTrack.artist.toLowerCase() === nextTrack.artist.toLowerCase()
  ) {
    penalty += 150;
  }

  // Consecutive same artist penalty
  if (prevTrack.artist.toLowerCase() === nextTrack.artist.toLowerCase()) {
    penalty += 85;
  } else if (recentArtists.includes(nextTrack.artist.toLowerCase())) {
    // Repeated artist within last 3-4 tracks
    penalty += 25;
  }

  // 5. Weighting by intent
  let wRhythm = 0.35;
  let wEmotion = 0.35;
  let wStyle = 0.30;

  if (intentId === 'deep_focus' || intentId === 'reading_study') {
    wRhythm = 0.45;
    wEmotion = 0.30;
    wStyle = 0.25;
  } else if (intentId === 'festival_explosive') {
    wRhythm = 0.30;
    wEmotion = 0.45;
    wStyle = 0.25;
  } else if (intentId === 'night_drive' || intentId === 'creative_flow') {
    wRhythm = 0.25;
    wEmotion = 0.40;
    wStyle = 0.35;
  } else if (intentId === 'genre_cadence') {
    wRhythm = 0.45;
    wEmotion = 0.20;
    wStyle = 0.35;
  }

  const rawScore =
    rhythmicScore * wRhythm + emotionalScore * wEmotion + stylisticScore * wStyle - penalty;
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Generate deterministic explanatory note
  let note = '';
  let transitionType = 'smooth';

  if (isHalfDouble) {
    transitionType = 'half_double';
    note = relation === 'double' ? 'Double-Time Shift (2x BPM)' : 'Half-Time Groove Lock';
  } else if (effectiveDelta <= 1) {
    transitionType = 'tempo_lock';
    note = `BPM Synced (±0-1) · Harmonic ${valenceDelta < 15 ? 'Locked' : 'Glide'}`;
  } else if (phaseType === 'reset') {
    transitionType = 'valley_reset';
    note = `Auditory Valley · Energy Relief (-${Math.round(energyDelta)}%)`;
  } else if (energyDelta >= 15 && nextEnergy > prevEnergy) {
    transitionType = 'energy_build';
    note = `Energy Crest (+${Math.round(energyDelta)}%) · Dynamic Build`;
  } else if (valenceDelta <= 10) {
    transitionType = 'mood_lock';
    note = `Mood Resonance · Δ ${Math.round(effectiveDelta)} BPM`;
  } else {
    transitionType = 'flow_bridge';
    note = `Δ ${Math.round(effectiveDelta)} BPM · ${nextTrack.mood_vibe || 'Smooth Wave'}`;
  }

  return {
    score: finalScore,
    rhythmicScore: Math.round(rhythmicScore),
    emotionalScore: Math.round(emotionalScore),
    stylisticScore: Math.round(stylisticScore),
    penalty,
    transitionType,
    note
  };
}
