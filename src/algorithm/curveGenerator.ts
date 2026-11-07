import {
  Track,
  FlowPhaseConfig,
  CognitiveFlowIntentId,
  CognitiveIntentConfig,
  CuratedSetResult,
  FlowGenerationControls
} from '../types';
import { evaluateTrackTransition, TransitionContext } from './transitionScorer';

/**
 * 8 Neuroscience & Musically-Calibrated Intent Presets
 * (4 Core Primary Intents + 4 Extended Listening Presets)
 */
export const COGNITIVE_INTENTS: Record<CognitiveFlowIntentId, CognitiveIntentConfig> = {
  // === 4 CORE INTENTS ===
  deep_focus: {
    id: 'deep_focus',
    name: 'Deep Focus',
    tagline: 'Ultradian Rhythm · 75 to 90 min mental flow',
    neuroscience_rationale:
      'Aligned with the 90-minute human ultradian cycle. Flat, stable energy (40-62%) with minimal vocal distractions and strict ±3 BPM delta transitions to avoid cognitive context switching, closing with an intentional decompression drop.',
    duration_target_mins: [75, 90],
    target_energy_range: [40, 62],
    bpm_tolerance: 3,
    vocal_threshold_max: 35,
    badge: 'Ultradian (75-90m)',
    color: '#10b981',
    accentGradient: 'from-emerald-500/25 to-teal-500/5',
    category: 'core',
    defaultControls: {
      targetDurationMins: 80,
      intensity: 'balanced',
      transitionStyle: 'seamless',
      vocals: 'instrumental'
    },
    phases: [
      {
        name: 'Attunement',
        description: 'Gentle neural synchronization into task immersion',
        duration_ratio: 0.15,
        target_energy_range: [40, 52],
        target_valence_range: [40, 65],
        phaseType: 'warmup',
        color: '#34d399',
        gradient: 'from-emerald-500/25 to-emerald-500/5'
      },
      {
        name: 'Alpha State Plateau',
        description: 'Sustained hypnotic baseline with strict ±3 BPM lock',
        duration_ratio: 0.70,
        target_energy_range: [48, 62],
        target_valence_range: [45, 60],
        phaseType: 'plateau',
        color: '#10b981',
        gradient: 'from-emerald-600/30 to-emerald-600/5'
      },
      {
        name: 'Mental Decompression',
        description: 'Intentional energy dip to signal healthy cognitive break',
        duration_ratio: 0.15,
        target_energy_range: [32, 44],
        target_valence_range: [35, 55],
        phaseType: 'cooldown',
        color: '#06b6d4',
        gradient: 'from-cyan-500/25 to-cyan-500/5'
      }
    ]
  },

  festival_explosive: {
    id: 'festival_explosive',
    name: 'Party / Festival Explosive',
    tagline: 'Single Arc Mainstage Set · 50 to 65 mins',
    neuroscience_rationale:
      'Engineered for maximum dopamine release: fast launch, aggressive voltage climb, followed by a sustained peak plateau (85-100% energy) with tight high-energy landing.',
    duration_target_mins: [50, 65],
    target_energy_range: [70, 100],
    bpm_tolerance: 6,
    badge: 'Single Arc (50-65m)',
    color: '#f43f5e',
    accentGradient: 'from-rose-500/25 to-amber-500/5',
    category: 'core',
    defaultControls: {
      targetDurationMins: 55,
      intensity: 'energetic',
      transitionStyle: 'adventurous',
      vocals: 'welcome'
    },
    phases: [
      {
        name: 'Quick Launch',
        description: 'Fast energetic greeting to gather crowd attention',
        duration_ratio: 0.14,
        target_energy_range: [58, 74],
        target_valence_range: [60, 85],
        phaseType: 'warmup',
        color: '#fb923c',
        gradient: 'from-orange-500/25 to-orange-500/5'
      },
      {
        name: 'Voltage Climb',
        description: 'Steep acceleration into mainstage festival frequencies',
        duration_ratio: 0.18,
        target_energy_range: [74, 88],
        target_valence_range: [65, 90],
        phaseType: 'build',
        color: '#f59e0b',
        gradient: 'from-amber-500/30 to-amber-500/5'
      },
      {
        name: 'Peak Energy Plateau',
        description: 'Sustained adrenaline and euphoric mainstage drops',
        duration_ratio: 0.54,
        target_energy_range: [86, 100],
        target_valence_range: [70, 98],
        phaseType: 'climax',
        color: '#f43f5e',
        gradient: 'from-rose-500/35 to-rose-500/5'
      },
      {
        name: 'Tight Landing',
        description: 'Crisp euphoric cooldown',
        duration_ratio: 0.14,
        target_energy_range: [52, 68],
        target_valence_range: [55, 80],
        phaseType: 'cooldown',
        color: '#ec4899',
        gradient: 'from-pink-500/25 to-pink-500/5'
      }
    ]
  },

  night_drive: {
    id: 'night_drive',
    name: 'Night Drive / Roadtrip',
    tagline: 'Multi-Peak Cinematic Wave · 2 to 3 hours',
    neuroscience_rationale:
      'Long-distance cognitive endurance architecture. Anti-fatigue "Reset Valleys" prevent auditory saturation before building into successive higher peaks.',
    duration_target_mins: [120, 180],
    target_energy_range: [35, 95],
    bpm_tolerance: 5,
    badge: 'Multi-Act (2-3 hrs)',
    color: '#8b5cf6',
    accentGradient: 'from-purple-500/25 to-indigo-500/5',
    category: 'core',
    defaultControls: {
      targetDurationMins: 135,
      intensity: 'balanced',
      transitionStyle: 'balanced',
      vocals: 'balanced'
    },
    phases: [
      {
        name: 'Horizon Departure',
        description: 'Atmospheric departure as city lights fade',
        duration_ratio: 0.14,
        target_energy_range: [45, 62],
        target_valence_range: [40, 65],
        phaseType: 'warmup',
        color: '#a855f7',
        gradient: 'from-purple-500/25 to-purple-500/5'
      },
      {
        name: 'Act I: Highway Cruise',
        description: 'Propulsive forward motion and rhythmic momentum',
        duration_ratio: 0.22,
        target_energy_range: [65, 80],
        target_valence_range: [50, 75],
        phaseType: 'build',
        color: '#6366f1',
        gradient: 'from-indigo-500/25 to-indigo-500/5'
      },
      {
        name: 'Reset Valley I',
        description: 'Auditory decompression dip to eliminate listening fatigue',
        duration_ratio: 0.10,
        target_energy_range: [35, 48],
        target_valence_range: [35, 55],
        phaseType: 'reset',
        color: '#38bdf8',
        gradient: 'from-sky-500/20 to-sky-500/5'
      },
      {
        name: 'Act II: Neon Ascent',
        description: 'Secondary ascent building into deeper nighttime voltage',
        duration_ratio: 0.24,
        target_energy_range: [75, 88],
        target_valence_range: [55, 80],
        phaseType: 'build',
        color: '#ec4899',
        gradient: 'from-pink-500/30 to-pink-500/5'
      },
      {
        name: 'Reset Valley II',
        description: 'Second rhythmic breather before final midnight crest',
        duration_ratio: 0.08,
        target_energy_range: [38, 50],
        target_valence_range: [40, 60],
        phaseType: 'reset',
        color: '#06b6d4',
        gradient: 'from-cyan-500/20 to-cyan-500/5'
      },
      {
        name: 'Midnight Climax',
        description: 'Peak velocity under empty skies',
        duration_ratio: 0.16,
        target_energy_range: [84, 98],
        target_valence_range: [60, 90],
        phaseType: 'climax',
        color: '#f43f5e',
        gradient: 'from-rose-500/35 to-rose-500/5'
      },
      {
        name: 'Dawn Outro',
        description: 'Harmonic resolution and quiet dawn arrival',
        duration_ratio: 0.06,
        target_energy_range: [35, 50],
        target_valence_range: [40, 65],
        phaseType: 'cooldown',
        color: '#14b8a6',
        gradient: 'from-teal-500/20 to-teal-500/5'
      }
    ]
  },

  genre_cadence: {
    id: 'genre_cadence',
    name: 'Genre & Cadence Lock',
    tagline: 'Harmonic & Cadence Lock · 60 to 75 mins',
    neuroscience_rationale:
      'Strict semantic and rhythmic synchronization. Locks into a narrow BPM groove (±3-4 BPM) with high valence continuity to maintain an unbroken uplifting vibe without energy dips.',
    duration_target_mins: [60, 75],
    target_energy_range: [60, 92],
    bpm_tolerance: 4,
    badge: 'Cadence Lock (60-75m)',
    color: '#eab308',
    accentGradient: 'from-amber-500/25 to-yellow-500/5',
    category: 'core',
    defaultControls: {
      targetDurationMins: 65,
      intensity: 'energetic',
      transitionStyle: 'seamless',
      vocals: 'balanced'
    },
    phases: [
      {
        name: 'Cadence Initialization',
        description: 'Locks the listener into the core rhythmic groove',
        duration_ratio: 0.20,
        target_energy_range: [60, 75],
        target_valence_range: [65, 88],
        phaseType: 'warmup',
        color: '#facc15',
        gradient: 'from-yellow-500/25 to-yellow-500/5'
      },
      {
        name: 'In-The-Pocket Drive',
        description: 'Tight syncopation and continuous positive momentum',
        duration_ratio: 0.45,
        target_energy_range: [70, 85],
        target_valence_range: [70, 92],
        phaseType: 'plateau',
        color: '#eab308',
        gradient: 'from-amber-500/30 to-amber-500/5'
      },
      {
        name: 'Euphoric Crescendo',
        description: 'Maximum harmonic release while preserving cadence lock',
        duration_ratio: 0.25,
        target_energy_range: [82, 95],
        target_valence_range: [75, 98],
        phaseType: 'climax',
        color: '#f97316',
        gradient: 'from-orange-500/35 to-orange-500/5'
      },
      {
        name: 'Dub Release',
        description: 'Satisfying groove tail with warm resonance',
        duration_ratio: 0.10,
        target_energy_range: [52, 68],
        target_valence_range: [60, 80],
        phaseType: 'cooldown',
        color: '#10b981',
        gradient: 'from-emerald-500/20 to-emerald-500/5'
      }
    ]
  },

  // === 4 EXTENDED PRESETS ===
  relax_unwind: {
    id: 'relax_unwind',
    name: 'Relax & Unwind',
    tagline: 'Gentle Pacing · 30 to 45 mins evening decompression',
    neuroscience_rationale:
      'Parasympathetic nervous system recovery. Low acoustic stimulation (30-48% energy), warm emotional valence, and smooth gentle transitions to encourage bodily rest and stress reduction.',
    duration_target_mins: [30, 45],
    target_energy_range: [25, 50],
    bpm_tolerance: 5,
    vocal_threshold_max: 50,
    badge: 'Gentle Calm (30-45m)',
    color: '#06b6d4',
    accentGradient: 'from-cyan-500/25 to-sky-500/5',
    category: 'extended',
    defaultControls: {
      targetDurationMins: 40,
      intensity: 'calm',
      transitionStyle: 'seamless',
      vocals: 'balanced'
    },
    phases: [
      {
        name: 'Twilight Settling',
        description: 'Slowing down from the noise of the day',
        duration_ratio: 0.25,
        target_energy_range: [40, 50],
        target_valence_range: [45, 65],
        phaseType: 'warmup',
        color: '#38bdf8',
        gradient: 'from-sky-500/25 to-sky-500/5'
      },
      {
        name: 'Warm Resonance',
        description: 'Velvety organic textures and acoustic peace',
        duration_ratio: 0.50,
        target_energy_range: [30, 44],
        target_valence_range: [40, 60],
        phaseType: 'plateau',
        color: '#06b6d4',
        gradient: 'from-cyan-500/25 to-cyan-500/5'
      },
      {
        name: 'Deep Slumber Glow',
        description: 'Quiet meditative harmonic resolution',
        duration_ratio: 0.25,
        target_energy_range: [25, 38],
        target_valence_range: [35, 55],
        phaseType: 'cooldown',
        color: '#14b8a6',
        gradient: 'from-teal-500/20 to-teal-500/5'
      }
    ]
  },

  creative_flow: {
    id: 'creative_flow',
    name: 'Creative Flow',
    tagline: 'Expansive Mindset · 60 to 90 mins ideation',
    neuroscience_rationale:
      'Divergent thinking facilitation. Balanced mid-tempo energy with engaging textural diversity (electronic, acoustic, ambient grooves) that stimulates creative exploration without cognitive overload.',
    duration_target_mins: [60, 90],
    target_energy_range: [48, 72],
    bpm_tolerance: 6,
    badge: 'Ideation Flow (60-90m)',
    color: '#a855f7',
    accentGradient: 'from-purple-500/25 to-fuchsia-500/5',
    category: 'extended',
    defaultControls: {
      targetDurationMins: 75,
      intensity: 'balanced',
      transitionStyle: 'balanced',
      vocals: 'balanced'
    },
    phases: [
      {
        name: 'Curiosity Ignition',
        description: 'Opening auditory horizons and lateral connections',
        duration_ratio: 0.20,
        target_energy_range: [48, 62],
        target_valence_range: [50, 75],
        phaseType: 'warmup',
        color: '#c084fc',
        gradient: 'from-purple-400/25 to-purple-400/5'
      },
      {
        name: 'Exploratory Canvas',
        description: 'Dynamic balance between rhythm and textural surprise',
        duration_ratio: 0.60,
        target_energy_range: [54, 72],
        target_valence_range: [55, 80],
        phaseType: 'plateau',
        color: '#a855f7',
        gradient: 'from-purple-600/30 to-purple-600/5'
      },
      {
        name: 'Synthesis & Integration',
        description: 'Reflective resolution connecting disparate motifs',
        duration_ratio: 0.20,
        target_energy_range: [44, 58],
        target_valence_range: [45, 70],
        phaseType: 'cooldown',
        color: '#818cf8',
        gradient: 'from-indigo-400/25 to-indigo-400/5'
      }
    ]
  },

  reading_study: {
    id: 'reading_study',
    name: 'Reading / Studying',
    tagline: 'Zero Interference · 45 to 60 mins reading retention',
    neuroscience_rationale:
      'Phonological loop protection. Strict vocal minimization (<= 25% vocals) with consistent acoustic texture to prevent semantic linguistic collision with printed material.',
    duration_target_mins: [45, 60],
    target_energy_range: [32, 52],
    bpm_tolerance: 4,
    vocal_threshold_max: 25,
    badge: 'Retention (45-60m)',
    color: '#14b8a6',
    accentGradient: 'from-teal-500/25 to-emerald-500/5',
    category: 'extended',
    defaultControls: {
      targetDurationMins: 50,
      intensity: 'calm',
      transitionStyle: 'seamless',
      vocals: 'instrumental'
    },
    phases: [
      {
        name: 'Quiet Focus Entry',
        description: 'Gentle acoustic soundscape settling the visual workspace',
        duration_ratio: 0.20,
        target_energy_range: [34, 46],
        target_valence_range: [38, 58],
        phaseType: 'warmup',
        color: '#2dd4bf',
        gradient: 'from-teal-400/25 to-teal-400/5'
      },
      {
        name: 'Linguistic Immunity',
        description: 'Hypnotic instrumental rhythm protecting deep comprehension',
        duration_ratio: 0.65,
        target_energy_range: [36, 52],
        target_valence_range: [40, 62],
        phaseType: 'plateau',
        color: '#14b8a6',
        gradient: 'from-teal-600/30 to-teal-600/5'
      },
      {
        name: 'Gentle Bookmark',
        description: 'Light contemplative outro signaling reading pause',
        duration_ratio: 0.15,
        target_energy_range: [30, 42],
        target_valence_range: [35, 55],
        phaseType: 'cooldown',
        color: '#0d9488',
        gradient: 'from-teal-700/25 to-teal-700/5'
      }
    ]
  },

  morning_motivation: {
    id: 'morning_motivation',
    name: 'Morning Motivation',
    tagline: 'Solar Wakeup Crescendo · 35 to 50 mins progressive drive',
    neuroscience_rationale:
      'Cortisol awakening response synchronizer. Begins with warm melodic grounding before progressively elevating tempo and energy toward an invigorated, productive morning peak.',
    duration_target_mins: [35, 50],
    target_energy_range: [42, 86],
    bpm_tolerance: 5,
    badge: 'Solar Surge (35-50m)',
    color: '#f97316',
    accentGradient: 'from-orange-500/25 to-amber-500/5',
    category: 'extended',
    defaultControls: {
      targetDurationMins: 45,
      intensity: 'energetic',
      transitionStyle: 'balanced',
      vocals: 'welcome'
    },
    phases: [
      {
        name: 'Morning Awakening',
        description: 'Warm acoustic sunlight and melodic clarity',
        duration_ratio: 0.22,
        target_energy_range: [42, 56],
        target_valence_range: [50, 75],
        phaseType: 'warmup',
        color: '#fbbf24',
        gradient: 'from-amber-400/25 to-amber-400/5'
      },
      {
        name: 'Momentum Builder',
        description: 'Crisp percussive lift igniting daily focus and drive',
        duration_ratio: 0.45,
        target_energy_range: [58, 74],
        target_valence_range: [60, 85],
        phaseType: 'build',
        color: '#f97316',
        gradient: 'from-orange-500/30 to-orange-500/5'
      },
      {
        name: 'Daybreak Momentum',
        description: 'Full dopamine release ready to tackle ambitious goals',
        duration_ratio: 0.33,
        target_energy_range: [74, 88],
        target_valence_range: [65, 95],
        phaseType: 'climax',
        color: '#ef4444',
        gradient: 'from-red-500/35 to-red-500/5'
      }
    ]
  }
};

/**
 * Normalizes track vectors to guaranteed numerical bounds
 */
export function normalizeTrack(t: Track): Track {
  const energy =
    typeof t.energy_score === 'number' && !isNaN(t.energy_score)
      ? t.energy_score
      : typeof t.energy === 'number' && !isNaN(t.energy)
      ? t.energy
      : 50;

  const valence =
    typeof t.valence_score === 'number' && !isNaN(t.valence_score)
      ? t.valence_score
      : typeof t.valence === 'number' && !isNaN(t.valence)
      ? t.valence
      : 50;

  const bpm = typeof t.bpm === 'number' && t.bpm >= 45 && t.bpm <= 220 ? t.bpm : 124;
  const vocal_presence =
    typeof t.vocal_presence === 'number' && !isNaN(t.vocal_presence)
      ? t.vocal_presence
      : 50;

  return {
    ...t,
    energy_score: Math.min(100, Math.max(0, Math.round(energy))),
    valence_score: Math.min(100, Math.max(0, Math.round(valence))),
    bpm: Math.round(bpm),
    vocal_presence: Math.min(100, Math.max(0, Math.round(vocal_presence))),
    mood_vibe: t.mood_vibe || 'Balanced Groove',
    energy: Math.min(100, Math.max(0, Math.round(energy))),
    valence: Math.min(100, Math.max(0, Math.round(valence)))
  };
}

/**
 * Computes a soft target trajectory curve at progress t (0.0 to 1.0)
 */
function getTargetTrajectoryPoint(
  intent: CognitiveIntentConfig,
  progress: number,
  intensityAdjustment: number = 0
): { targetEnergy: number; targetValence: number; currentPhaseIdx: number } {
  let accumulatedRatio = 0;
  let phaseIdx = 0;

  for (let i = 0; i < intent.phases.length; i++) {
    const phase = intent.phases[i];
    const nextRatio = accumulatedRatio + phase.duration_ratio;
    if (progress <= nextRatio || i === intent.phases.length - 1) {
      phaseIdx = i;
      // Progress within this phase (0 to 1)
      const phaseT = Math.min(
        1,
        Math.max(0, (progress - accumulatedRatio) / Math.max(0.01, phase.duration_ratio))
      );
      const [minE, maxE] = phase.target_energy_range;
      const [minV, maxV] = phase.target_valence_range;

      const targetEnergy = Math.min(
        100,
        Math.max(10, minE + (maxE - minE) * phaseT + intensityAdjustment)
      );
      const targetValence = minV + (maxV - minV) * phaseT;

      return { targetEnergy, targetValence, currentPhaseIdx: phaseIdx };
    }
    accumulatedRatio = nextRatio;
  }

  const lastPhase = intent.phases[intent.phases.length - 1];
  return {
    targetEnergy: lastPhase.target_energy_range[1] + intensityAdjustment,
    targetValence: lastPhase.target_valence_range[1],
    currentPhaseIdx: intent.phases.length - 1
  };
}

/**
 * Adaptive Multi-Criteria Cognitive DJ Set Synthesizer
 * Implements Section 2, 4, 5, 7, 9:
 * Playlist Quality = Intent Fit + Transition Coherence + Global Trajectory + Variety - Penalties
 */
export function generateCognitiveDJFlow(
  availableTracks: Track[],
  intentId: CognitiveFlowIntentId = 'deep_focus',
  controls?: FlowGenerationControls
): CuratedSetResult {
  if (!availableTracks || availableTracks.length === 0) {
    return {
      flow_intent: intentId,
      computed_total_duration_ms: 0,
      computed_total_tracks: 0,
      phases: [],
      curated_set: [],
      applied_controls: controls
    };
  }

  const intent = COGNITIVE_INTENTS[intentId] || COGNITIVE_INTENTS.deep_focus;
  const mergedControls: Required<FlowGenerationControls> = {
    ...intent.defaultControls,
    ...controls
  };

  // Determine intensity energy offset
  let intensityOffset = 0;
  if (mergedControls.intensity === 'calm') intensityOffset = -8;
  if (mergedControls.intensity === 'energetic') intensityOffset = 8;

  // Compute target total duration
  const targetDurationMins =
    mergedControls.targetDurationMins ||
    (intent.duration_target_mins[0] + intent.duration_target_mins[1]) / 2;
  const targetDurationMs = targetDurationMins * 60 * 1000;

  const normalizedPool = availableTracks.map(normalizeTrack);

  // Apply vocal filter if specified
  let candidatePool = normalizedPool;
  const isInstrumentalPriority =
    mergedControls.vocals === 'instrumental' ||
    (Boolean(intent.vocal_threshold_max) && mergedControls.vocals !== 'welcome');

  if (isInstrumentalPriority) {
    const threshold = intent.vocal_threshold_max || 35;
    const instrumentalCandidates = normalizedPool.filter((t) => t.vocal_presence <= threshold);
    if (instrumentalCandidates.length >= 10) {
      candidatePool = instrumentalCandidates;
    } else {
      // Relax threshold gradually to get lowest available vocal tracks in user's library
      const relaxed = normalizedPool.filter((t) => t.vocal_presence <= threshold + 20);
      if (relaxed.length >= 10) {
        candidatePool = relaxed;
      }
    }
  }

  const curatedSet: Track[] = [];
  const usedTrackIds = new Set<string>();
  const recentArtists: string[] = [];
  let accumulatedMs = 0;

  // Transition scoring context template
  const transitionContext: TransitionContext = {
    intentId,
    transitionStyle: mergedControls.transitionStyle,
    allowHalfDoubleTime: true
  };

  // 1. Pick Opener Track
  // Opener should match the starting phase energy target closely with high acoustic clarity
  const openerTrajectory = getTargetTrajectoryPoint(intent, 0.0, intensityOffset);
  const openerCandidates = candidatePool.filter(
    (t) =>
      Math.abs(t.energy_score - openerTrajectory.targetEnergy) <= 15 &&
      Math.abs(t.valence_score - openerTrajectory.targetValence) <= 25
  );

  const initialPickList = openerCandidates.length > 0 ? openerCandidates : candidatePool;
  // Sort by closest to opener target
  const sortedOpeners = [...initialPickList].sort(
    (a, b) =>
      Math.abs(a.energy_score - openerTrajectory.targetEnergy) -
      Math.abs(b.energy_score - openerTrajectory.targetEnergy)
  );

  const opener = sortedOpeners[0];
  usedTrackIds.add(opener.id);
  recentArtists.push(opener.artist.toLowerCase());
  accumulatedMs += opener.duration_ms || 210000;

  const openerEval = evaluateTrackTransition(null, opener, transitionContext);

  curatedSet.push({
    ...opener,
    overallIndex: 1,
    transition_note: openerEval.note
  });

  // 2. Adaptive Sequencing Loop (Step-by-step Multi-Factor Beam Selection)
  let currentAnchor = opener;
  let trackIndex = 2;

  // We loop until we reach target duration (with sensible bounds: at least 6 tracks, up to 100 tracks max)
  while (accumulatedMs < targetDurationMs && usedTrackIds.size < candidatePool.length && trackIndex <= 100) {
    const progress = Math.min(0.98, accumulatedMs / targetDurationMs);
    const trajectory = getTargetTrajectoryPoint(intent, progress, intensityOffset);
    const currentPhaseTemplate = intent.phases[trajectory.currentPhaseIdx];

    const currentContext: TransitionContext = {
      ...transitionContext,
      phaseType: currentPhaseTemplate.phaseType,
      recentArtists: recentArtists.slice(-4)
    };

    // Filter available candidates
    const available = candidatePool.filter((t) => !usedTrackIds.has(t.id));
    if (available.length === 0) break;

    let bestCandidate: Track | null = null;
    let highestScore = -Infinity;
    let bestEval = openerEval;

    // Evaluate candidate suitability & transition coherence
    for (let i = 0; i < available.length; i++) {
      const candidate = available[i];

      // 1. Transition Coherence Score (0 to 100)
      const transEval = evaluateTrackTransition(currentAnchor, candidate, currentContext);

      // 2. Global Trajectory Alignment (0 to 100)
      const energyDelta = Math.abs(candidate.energy_score - trajectory.targetEnergy);
      let trajectoryScore = Math.max(0, 100 - energyDelta * 2.2);

      // 3. Intent Fit Score (0 to 100)
      let intentFitScore = 100;
      if (candidate.energy_score < intent.target_energy_range[0] - 10) {
        intentFitScore -= 30;
      } else if (candidate.energy_score > intent.target_energy_range[1] + 10) {
        intentFitScore -= 30;
      }
      if (isInstrumentalPriority && candidate.vocal_presence > (intent.vocal_threshold_max || 35)) {
        intentFitScore -= (candidate.vocal_presence - (intent.vocal_threshold_max || 35)) * 1.2;
      }

      // Combine into composite Quality score
      const qualityScore =
        transEval.score * 0.50 +
        trajectoryScore * 0.35 +
        intentFitScore * 0.15;

      if (qualityScore > highestScore) {
        highestScore = qualityScore;
        bestCandidate = candidate;
        bestEval = transEval;
      }
    }

    if (!bestCandidate) {
      // Fallback: pick any unused track closest to target energy
      bestCandidate = available[0];
      bestEval = evaluateTrackTransition(currentAnchor, bestCandidate, currentContext);
    }

    usedTrackIds.add(bestCandidate.id);
    recentArtists.push(bestCandidate.artist.toLowerCase());
    accumulatedMs += bestCandidate.duration_ms || 210000;

    curatedSet.push({
      ...bestCandidate,
      overallIndex: trackIndex++,
      transition_note: bestEval.note
    });

    currentAnchor = bestCandidate;
  }

  // 3. Dynamic Phase Segmentation
  // Assign tracks to the intent phases based on actual cumulative duration
  const totalSetDurationMs = curatedSet.reduce((sum, t) => sum + (t.duration_ms || 210000), 0);
  const phaseConfigs: FlowPhaseConfig[] = [];
  let currentDurationTracker = 0;
  let phaseTrackAccumulator: Track[] = [];
  let currentPhaseIdx = 0;

  for (let i = 0; i < curatedSet.length; i++) {
    const track = curatedSet[i];
    phaseTrackAccumulator.push(track);
    currentDurationTracker += track.duration_ms || 210000;

    const progressRatio = currentDurationTracker / Math.max(1, totalSetDurationMs);
    let targetRatioSum = 0;
    for (let p = 0; p <= currentPhaseIdx; p++) {
      targetRatioSum += intent.phases[p].duration_ratio;
    }

    const isLastTrack = i === curatedSet.length - 1;
    const isPhaseComplete = progressRatio >= targetRatioSum && currentPhaseIdx < intent.phases.length - 1;

    if (isPhaseComplete || isLastTrack) {
      const template = intent.phases[currentPhaseIdx];
      const phaseStartIdx = curatedSet.indexOf(phaseTrackAccumulator[0]) + 1;
      const phaseEndIdx = curatedSet.indexOf(phaseTrackAccumulator[phaseTrackAccumulator.length - 1]) + 1;

      const phaseDuration = phaseTrackAccumulator.reduce(
        (sum, t) => sum + (t.duration_ms || 210000),
        0
      );

      const energies = phaseTrackAccumulator.map((t) => t.energy_score);
      const minE = energies.length ? Math.min(...energies) : template.target_energy_range[0];
      const maxE = energies.length ? Math.max(...energies) : template.target_energy_range[1];

      // Assign phase label to tracks
      for (const t of phaseTrackAccumulator) {
        t.phase = template.name;
      }

      phaseConfigs.push({
        name: template.name,
        description: template.description,
        trackCount: phaseTrackAccumulator.length,
        duration_ms: phaseDuration,
        minEnergy: minE,
        maxEnergy: maxE,
        color: template.color,
        gradient: template.gradient,
        rangeIndex: [phaseStartIdx, phaseEndIdx]
      });

      phaseTrackAccumulator = [];
      if (currentPhaseIdx < intent.phases.length - 1) {
        currentPhaseIdx++;
      }
    }
  }

  return {
    flow_intent: intentId,
    computed_total_duration_ms: totalSetDurationMs,
    computed_total_tracks: curatedSet.length,
    phases: phaseConfigs,
    curated_set: curatedSet,
    applied_controls: mergedControls
  };
}

/**
 * Backward-compatible helper for legacy callers
 */
export function generateDJCurve(
  availableTracks: Track[],
  _targetCount: number = 50,
  intentId: CognitiveFlowIntentId = 'deep_focus',
  controls?: FlowGenerationControls
): Track[] {
  const result = generateCognitiveDJFlow(availableTracks, intentId, controls);
  return result.curated_set;
}

/**
 * Default phases for initial render
 */
export const PHASE_CONFIGS: FlowPhaseConfig[] = COGNITIVE_INTENTS.deep_focus.phases.map(
  (p, i) => ({
    name: p.name,
    description: p.description,
    trackCount: Math.round(p.duration_ratio * 20),
    duration_ms: p.duration_ratio * 80 * 60 * 1000,
    minEnergy: p.target_energy_range[0],
    maxEnergy: p.target_energy_range[1],
    color: p.color,
    gradient: p.gradient,
    rangeIndex: [i * 7 + 1, (i + 1) * 7]
  })
);

export function getPhaseConfigsForStyle(
  intentId: CognitiveFlowIntentId = 'deep_focus',
  _totalTracks?: number
): FlowPhaseConfig[] {
  const intent = COGNITIVE_INTENTS[intentId] || COGNITIVE_INTENTS.deep_focus;
  const targetMins = (intent.duration_target_mins[0] + intent.duration_target_mins[1]) / 2;
  const totalDurationMs = targetMins * 60 * 1000;

  let start = 1;
  return intent.phases.map((p) => {
    const estTracks = Math.max(2, Math.round(p.duration_ratio * 22));
    const cfg: FlowPhaseConfig = {
      name: p.name,
      description: p.description,
      trackCount: estTracks,
      duration_ms: p.duration_ratio * totalDurationMs,
      minEnergy: p.target_energy_range[0],
      maxEnergy: p.target_energy_range[1],
      color: p.color,
      gradient: p.gradient,
      rangeIndex: [start, start + estTracks - 1]
    };
    start += estTracks;
    return cfg;
  });
}
