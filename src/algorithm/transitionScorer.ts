import { Track, CognitiveFlowIntentId, TransitionStyleOption } from '../types';
import { evaluateCamelotTransition, CamelotCompatibilityResult } from './camelot';

export interface TransitionContext {
  intentId: CognitiveFlowIntentId;
  targetBpmDelta?: number;
  allowHalfDoubleTime?: boolean;
  transitionStyle?: TransitionStyleOption;
  phaseType?: 'warmup' | 'build' | 'plateau' | 'reset' | 'climax' | 'cooldown';
  recentArtists?: string[]; // Recent artists in sequence for cooldown check
}

export interface TransitionEvaluation {
  score: number; // 0 (incompatible) to 100 (flawless transition)
  cost: number; // 0 (flawless) to 100 (incompatible)
  rhythmicScore: number;
  harmonicScore: number;
  emotionalScore: number;
  stylisticScore: number;
  penalty: number;
  transitionType: string;
  harmonicDetails?: CamelotCompatibilityResult;
  note: string;
}

/**
 * Metric Tempo Compatibility:
 * Calculates normalized BPM divergence according to master neuroacoustic specification:
 * ΔBPM_norm(b_i, b_j) = min_{m in {0.5, 1.0, 2.0}} (|b_j * m - b_i| / (0.08 * b_i))
 */
export function calculateBpmCompatibility(
  bpmA: number,
  bpmB: number,
  allowHalfDouble: boolean = true
): {
  effectiveDelta: number;
  ratio: number;
  relation: 'tempo_lock' | 'near' | 'half_time' | 'double_time' | 'glide' | 'jump';
  cost: number; // 0 to 1.0
  score: number; // 0 to 100
  deltaBpmNorm: number;
} {
  const bA = Math.max(40, bpmA || 124);
  const bB = Math.max(40, bpmB || 124);
  const directDelta = Math.abs(bA - bB);
  const ratio = bB / bA;

  // Master metric ratios: 0.5x, 1.0x, 2.0x normalized by (0.08 * bA)
  const multipliers = allowHalfDouble ? [0.5, 1.0, 2.0] : [1.0];
  let minNormDivergence = Infinity;
  let bestM = 1.0;

  for (const m of multipliers) {
    const diff = Math.abs(bB * m - bA);
    const norm = diff / (0.08 * bA);
    if (norm < minNormDivergence) {
      minNormDivergence = norm;
      bestM = m;
    }
  }

  // Cost mapping from ΔBPM_norm
  let relation: 'tempo_lock' | 'near' | 'half_time' | 'double_time' | 'glide' | 'jump' = 'jump';
  let cost = Math.min(1.0, minNormDivergence * 0.25);

  if (minNormDivergence <= 0.15) {
    relation = bestM === 0.5 ? 'double_time' : bestM === 2.0 ? 'half_time' : 'tempo_lock';
    cost = bestM === 1.0 ? 0.0 : 0.08;
  } else if (minNormDivergence <= 0.5) {
    relation = bestM === 0.5 ? 'double_time' : bestM === 2.0 ? 'half_time' : 'near';
    cost = bestM === 1.0 ? 0.06 : 0.12;
  } else if (minNormDivergence <= 1.0) {
    relation = bestM === 0.5 ? 'double_time' : bestM === 2.0 ? 'half_time' : 'glide';
    cost = 0.15 + (minNormDivergence - 0.5) * 0.2;
  } else {
    relation = 'jump';
    cost = Math.min(1.0, 0.40 + (minNormDivergence - 1.0) * 0.25);
  }

  const score = Math.max(5, Math.round((1 - Math.min(1.0, cost)) * 100));

  return {
    effectiveDelta: directDelta,
    ratio,
    relation,
    cost,
    score,
    deltaBpmNorm: Number(minNormDivergence.toFixed(3))
  };
}

/**
 * Russell Circumplex Vector Distance:
 * Evaluates emotional transition in the 2D (Valence, Arousal) plane
 */
export function calculateCircumplexDistance(
  prevTrack: Track,
  nextTrack: Track,
  phaseType: string = 'plateau'
): { distance: number; cost: number; score: number; label: string } {
  const vA = prevTrack.valence_norm !== undefined
    ? prevTrack.valence_norm
    : ((prevTrack.valence_score ?? 50) - 50) / 50;

  const aA = prevTrack.arousal_norm !== undefined
    ? prevTrack.arousal_norm
    : ((prevTrack.energy_score ?? 50) - 50) / 50;

  const vB = nextTrack.valence_norm !== undefined
    ? nextTrack.valence_norm
    : ((nextTrack.valence_score ?? 50) - 50) / 50;

  const aB = nextTrack.arousal_norm !== undefined
    ? nextTrack.arousal_norm
    : ((nextTrack.energy_score ?? 50) - 50) / 50;

  const dV = vB - vA;
  const dA = aB - aA;
  const rawDist = Math.sqrt(dV * dV + dA * dA); // Max possible distance ~2.828
  const normDist = Math.min(1.0, rawDist / 1.6);

  let cost = normDist * 0.6;
  let label = 'Circumplex Continuity';

  // Modulation based on phase trajectory
  if (phaseType === 'reset') {
    // In reset valleys, lowering arousal (relaxing) is positive
    if (dA < -0.15) {
      cost = Math.max(0, cost - 0.25);
      label = 'Valley Decompression (Auditory Rest)';
    }
  } else if (phaseType === 'build' || phaseType === 'climax') {
    // In build or climax, climbing arousal is positive
    if (dA > 0.15) {
      cost = Math.max(0, cost - 0.20);
      label = 'Emotional Voltage Build';
    }
  } else if (phaseType === 'plateau') {
    // Steady arousal preferred
    if (Math.abs(dA) > 0.4) {
      cost = Math.min(1.0, cost + 0.25);
      label = 'Plateau Disruption';
    } else {
      label = 'Steady Flow Resonance';
    }
  }

  const score = Math.max(5, Math.round((1 - cost) * 100));
  return { distance: rawDist, cost, score, label };
}

/**
 * Main Academic Multi-Attribute Transition Cost Function:
 * Evaluates the musical compatibility between two consecutive tracks:
 * - Camelot Wheel Distance (Harmonic mixing)
 * - Metric Tempo Ratios (1.0x, 0.5x, 2.0x)
 * - Russell Circumplex Space (Valence/Arousal)
 * - Artist Repeat Cooldowns & Duplicates
 */
export function evaluateTrackTransition(
  prevTrack: Track | null,
  nextTrack: Track,
  context: TransitionContext
): TransitionEvaluation {
  // If set opener, anchor with perfect initiation score
  if (!prevTrack) {
    return {
      score: 98,
      cost: 0.02,
      rhythmicScore: 100,
      harmonicScore: 100,
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
    transitionStyle = 'natural',
    phaseType = 'plateau',
    recentArtists = []
  } = context;

  // 1. Camelot Harmonic Evaluation (using phaseType for climax boost qualification)
  const harmonicResult = evaluateCamelotTransition(
    prevTrack.camelot_key,
    nextTrack.camelot_key,
    phaseType
  );
  let cHarmonic = harmonicResult.cost;

  // 2. Metric Tempo Evaluation (using normalized ΔBPM_norm)
  const bpmResult = calculateBpmCompatibility(
    prevTrack.bpm || 124,
    nextTrack.bpm || 124,
    allowHalfDoubleTime
  );
  let cTempo = Math.min(1.0, bpmResult.deltaBpmNorm > 1.0 ? 1.0 : bpmResult.cost);

  // 3. Russell Circumplex Evaluation
  const circumplexResult = calculateCircumplexDistance(prevTrack, nextTrack, phaseType);
  let cEmot = circumplexResult.cost;

  // 4. Stylistic & Vocal Continuity
  let cStyle = 0.15;
  const prevVocals = prevTrack.vocal_presence ?? 50;
  const nextVocals = nextTrack.vocal_presence ?? 50;
  const vocalDelta = Math.abs(nextVocals - prevVocals);

  if (intentId === 'deep_focus' || intentId === 'reading_study') {
    if (nextVocals > 35) cStyle += (nextVocals - 35) * 0.015;
  } else if (vocalDelta > 55) {
    cStyle += 0.20; // Sudden shift from pure ambient to vocal choir
  }

  // Genre compatibility bonus
  const prevGenre = (prevTrack.genre_vibe || '').toLowerCase();
  const nextGenre = (nextTrack.genre_vibe || '').toLowerCase();
  if (prevGenre && nextGenre && prevGenre === nextGenre) {
    cStyle = Math.max(0, cStyle - 0.12);
  }

  // 5. Sequence Context Penalties & Artist Cooldown (P_artist = 2.0 if in last 4 positions)
  let penalty = 0;

  // Hard duplicate prevention
  if (prevTrack.id === nextTrack.id) {
    penalty += 200;
  }
  if (
    prevTrack.name.toLowerCase() === nextTrack.name.toLowerCase() &&
    prevTrack.artist.toLowerCase() === nextTrack.artist.toLowerCase()
  ) {
    penalty += 180;
  }

  // Artist cooldown penalty: P_artist = 2.0 (200 in 0-100 scale) if in past 4 positions
  const prevArtistNorm = prevTrack.artist.toLowerCase().trim();
  const nextArtistNorm = nextTrack.artist.toLowerCase().trim();

  if (prevArtistNorm === nextArtistNorm) {
    penalty += 200; // Consecutive same artist is strictly blocked
  } else {
    // Check recent 4 positions
    const last4Artists = recentArtists.slice(-4).map((a) => a.toLowerCase().trim());
    if (last4Artists.includes(nextArtistNorm)) {
      penalty += 150; // P_artist cooldown penalty
    }
  }

  // 6. Master Neuroacoustic Specification Weights
  // C(i,j) = 0.35 * D_Camelot + 0.25 * ΔBPM_norm + 0.25 * |E_j - E*| + 0.15 * |V_j - V*| + P_artist
  const isSmooth = transitionStyle === 'smooth' || transitionStyle === 'seamless';
  const isDynamic = transitionStyle === 'dynamic' || transitionStyle === 'adventurous';

  let wHarmonic = 0.35;
  let wTempo = 0.25;
  let wEmot = 0.25;
  let wStyle = 0.15;

  if (isSmooth) {
    wHarmonic = 0.40;
    wTempo = 0.35;
    wEmot = 0.15;
    wStyle = 0.10;
    // Strict prune on tempo deviation in smooth mode: if ΔBPM_norm > 1.0 (exceeds 8%)
    if (bpmResult.deltaBpmNorm > 1.0) cTempo = 1.0;
    if (harmonicResult.relation === 'clash') cHarmonic = 1.0;
  } else if (isDynamic) {
    wHarmonic = 0.25;
    wTempo = 0.20;
    wEmot = 0.35;
    wStyle = 0.20;
    // Reward energy boosts and half/double time shifts
    if (harmonicResult.relation === 'energy_boost') cHarmonic = 0.10;
    if (bpmResult.relation === 'double_time' || bpmResult.relation === 'half_time') cTempo = 0.05;
  }

  const weightedCost =
    cHarmonic * wHarmonic +
    cTempo * wTempo +
    cEmot * wEmot +
    cStyle * wStyle;

  const totalCost = Math.min(100, Math.round(weightedCost * 100 + penalty));
  const finalScore = Math.max(0, Math.min(100, 100 - totalCost));

  // Determine transition label & type
  let transitionType = 'smooth';
  let note = '';

  const keyA = prevTrack.camelot_key || '8A';
  const keyB = nextTrack.camelot_key || '8A';

  if (harmonicResult.relation === 'energy_boost') {
    transitionType = 'energy_boost';
    note = `${keyA} → ${keyB} (+2 Key Modulation) · ${bpmResult.relation === 'tempo_lock' ? 'BPM Synced' : `Δ ${Math.round(bpmResult.effectiveDelta)} BPM`}`;
  } else if (bpmResult.relation === 'double_time' || bpmResult.relation === 'half_time') {
    transitionType = 'metric_shift';
    note = `Metric Shift (${bpmResult.relation === 'double_time' ? '2.0x' : '0.5x'}) · ${harmonicResult.label}`;
  } else if (harmonicResult.relation === 'exact' || harmonicResult.relation === 'relative') {
    transitionType = 'harmonic_lock';
    note = `${keyA} → ${keyB} (${harmonicResult.relation === 'exact' ? 'Exact Key' : 'Relative Mode'}) · ${bpmResult.relation === 'tempo_lock' ? 'BPM Locked' : `Δ ${Math.round(bpmResult.effectiveDelta)} BPM`}`;
  } else if (circumplexResult.label.includes('Valley')) {
    transitionType = 'valley_reset';
    note = `Auditory Valley · ${circumplexResult.label}`;
  } else {
    transitionType = 'flow_bridge';
    note = `${keyA} → ${keyB} · Δ ${Math.round(bpmResult.effectiveDelta)} BPM · ${nextTrack.mood_vibe || 'Flow Glide'}`;
  }

  return {
    score: finalScore,
    cost: totalCost,
    rhythmicScore: bpmResult.score,
    harmonicScore: harmonicResult.score,
    emotionalScore: circumplexResult.score,
    stylisticScore: Math.round((1 - cStyle) * 100),
    penalty,
    transitionType,
    harmonicDetails: harmonicResult,
    note
  };
}

/**
 * Bidirectional Transition Cost for Single-Track Swapping:
 * Evaluates total cost of inserting a candidate track between track[i-1] and track[i+1].
 */
export function evaluateBidirectionalSwapCost(
  candidate: Track,
  prevTrack: Track | null,
  nextTrack: Track | null,
  context: TransitionContext
): {
  totalCost: number;
  combinedScore: number;
  note: string;
} {
  let costIn = 0;
  let costOut = 0;
  let scoreIn = 100;
  let scoreOut = 100;
  let noteIn = '';
  let noteOut = '';

  if (prevTrack) {
    const evalIn = evaluateTrackTransition(prevTrack, candidate, context);
    costIn = evalIn.cost;
    scoreIn = evalIn.score;
    noteIn = evalIn.note;
  }

  if (nextTrack) {
    const evalOut = evaluateTrackTransition(candidate, nextTrack, context);
    costOut = evalOut.cost;
    scoreOut = evalOut.score;
    noteOut = evalOut.note;
  }

  const totalCost = prevTrack && nextTrack
    ? Math.round((costIn + costOut) / 2)
    : prevTrack
    ? costIn
    : costOut;

  const combinedScore = Math.max(0, Math.min(100, 100 - totalCost));
  const note = prevTrack && nextTrack
    ? `Incoming: ${noteIn} | Outgoing: ${noteOut}`
    : prevTrack
    ? noteIn
    : noteOut;

  return {
    totalCost,
    combinedScore,
    note
  };
}
