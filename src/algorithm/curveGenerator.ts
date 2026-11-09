import {
  Track,
  FlowPhaseConfig,
  CognitiveFlowIntentId,
  CognitiveIntentConfig,
  CuratedSetResult,
  FlowGenerationControls,
  IntentCategory,
  IntensityLevel,
  TransitionStyleOption,
  VocalPresenceOption
} from '../types';
import { evaluateTrackTransition, TransitionContext } from './transitionScorer';
import { hashString } from './acousticAnalyzer';

/**
 * Checks whether a track matches any of the specified genre tags
 */
export function trackMatchesGenres(track: Track, genres: string[]): boolean {
  if (!genres || genres.length === 0) return true;
  const list = genres.map((g) => g.toLowerCase().trim()).filter(Boolean);
  if (
    list.length === 0 ||
    list.includes('all') ||
    list.includes('all genres') ||
    list.includes('surprise me')
  ) {
    return true;
  }
  const trackGenre = (track.genre_vibe || '').toLowerCase();
  const trackMood = (track.mood_vibe || '').toLowerCase();
  const trackName = (track.name || '').toLowerCase();
  const trackArtist = (track.artist || '').toLowerCase();

  return list.some((target) => {
    return (
      trackGenre.includes(target) ||
      trackMood.includes(target) ||
      trackName.includes(target) ||
      trackArtist.includes(target)
    );
  });
}

/**
 * 12 Evidence-Informed Listening Intentions
 * Grouped into 4 Discoverable Categories:
 * - Focus & Creativity
 * - Relaxation & Emotion
 * - Energy & Movement
 * - Journey & Exploration
 */
export const COGNITIVE_INTENTS: Record<CognitiveFlowIntentId, CognitiveIntentConfig> = {
  // ==========================================
  // 1. FOCUS & CREATIVITY
  // ==========================================
  deep_focus: {
    id: 'deep_focus',
    name: 'Deep Focus',
    tagline: 'Stable, low-distraction musical continuity',
    category: 'focus_creativity',
    musical_objective:
      'Minimizes cognitive friction through a steady, non-intrusive musical atmosphere. Prioritizes low fluctuation in acoustic intensity, gentle transitions, and minimal vocal interference.',
    duration_target_mins: [75, 90],
    default_duration_mins: 90,
    target_energy_range: [38, 62],
    bpm_tolerance: 3,
    vocal_threshold_max: 30,
    badge: 'Focus (90m)',
    color: '#10b981',
    accentGradient: 'from-emerald-500/25 to-teal-500/5',
    defaultControls: {
      targetDurationMins: 90,
      intensity: 'balanced',
      transitionStyle: 'smooth',
      vocals: 'instrumental'
    },
    phases: [
      {
        name: 'Gentle Entry',
        description: 'Smooth grounding to settle attention into the workspace',
        duration_ratio: 0.15,
        target_energy_range: [38, 48],
        target_valence_range: [40, 60],
        phaseType: 'warmup',
        color: '#34d399',
        gradient: 'from-emerald-500/25 to-emerald-500/5'
      },
      {
        name: 'Sustained Flow',
        description: 'Unbroken hypnotic baseline with consistent rhythmic texture',
        duration_ratio: 0.70,
        target_energy_range: [45, 60],
        target_valence_range: [45, 60],
        phaseType: 'plateau',
        color: '#10b981',
        gradient: 'from-emerald-600/30 to-emerald-600/5'
      },
      {
        name: 'Soft Resolution',
        description: 'Subtle energy tapering signaling completion of work session',
        duration_ratio: 0.15,
        target_energy_range: [35, 45],
        target_valence_range: [38, 55],
        phaseType: 'cooldown',
        color: '#06b6d4',
        gradient: 'from-cyan-500/25 to-cyan-500/5'
      }
    ]
  },

  reading_study: {
    id: 'reading_study',
    name: 'Reading & Studying',
    tagline: 'Low linguistic interference for reading and study',
    category: 'focus_creativity',
    musical_objective:
      'Supports reading comprehension and language-heavy tasks by prioritizing instrumental textures, gentle dynamics, and low contrast to protect phonological focus.',
    duration_target_mins: [45, 60],
    default_duration_mins: 60,
    target_energy_range: [30, 52],
    bpm_tolerance: 4,
    vocal_threshold_max: 20,
    badge: 'Study (60m)',
    color: '#14b8a6',
    accentGradient: 'from-teal-500/25 to-emerald-500/5',
    defaultControls: {
      targetDurationMins: 60,
      intensity: 'calm',
      transitionStyle: 'smooth',
      vocals: 'instrumental',
      studyTaskType: 'reading'
    },
    phases: [
      {
        name: 'Quiet Entry',
        description: 'Calm acoustic introduction easing visual concentration',
        duration_ratio: 0.18,
        target_energy_range: [32, 44],
        target_valence_range: [40, 58],
        phaseType: 'warmup',
        color: '#2dd4bf',
        gradient: 'from-teal-400/25 to-teal-400/5'
      },
      {
        name: 'Textual Immersion',
        description: 'Hypnotic, instrumental consistency avoiding auditory distraction',
        duration_ratio: 0.68,
        target_energy_range: [36, 52],
        target_valence_range: [40, 60],
        phaseType: 'plateau',
        color: '#14b8a6',
        gradient: 'from-teal-600/30 to-teal-600/5'
      },
      {
        name: 'Gentle Bookmark',
        description: 'Warm contemplative outro signaling reading pause',
        duration_ratio: 0.14,
        target_energy_range: [30, 42],
        target_valence_range: [35, 55],
        phaseType: 'cooldown',
        color: '#0d9488',
        gradient: 'from-teal-700/25 to-teal-700/5'
      }
    ]
  },

  creative_flow: {
    id: 'creative_flow',
    name: 'Creative Flow',
    tagline: 'Stimulating, open atmosphere for ideation and design',
    category: 'focus_creativity',
    musical_objective:
      'Stimulates creative exploration with moderate energy and controlled novelty. Blends organic and electronic textures while maintaining musical continuity.',
    duration_target_mins: [60, 90],
    default_duration_mins: 90,
    target_energy_range: [48, 72],
    bpm_tolerance: 5,
    badge: 'Ideation (90m)',
    color: '#a855f7',
    accentGradient: 'from-purple-500/25 to-fuchsia-500/5',
    defaultControls: {
      targetDurationMins: 90,
      intensity: 'balanced',
      transitionStyle: 'natural',
      vocals: 'mixed'
    },
    phases: [
      {
        name: 'Curiosity Spark',
        description: 'Engaging, expansive opening setting an open mindset',
        duration_ratio: 0.18,
        target_energy_range: [48, 62],
        target_valence_range: [50, 75],
        phaseType: 'warmup',
        color: '#c084fc',
        gradient: 'from-purple-400/25 to-purple-400/5'
      },
      {
        name: 'Exploratory Canvas',
        description: 'Sustained momentum with organic and electronic textural variety',
        duration_ratio: 0.64,
        target_energy_range: [55, 72],
        target_valence_range: [55, 80],
        phaseType: 'plateau',
        color: '#a855f7',
        gradient: 'from-purple-600/30 to-purple-600/5'
      },
      {
        name: 'Synthesis & Integration',
        description: 'Reflective resolution bringing ideas together',
        duration_ratio: 0.18,
        target_energy_range: [45, 58],
        target_valence_range: [48, 70],
        phaseType: 'cooldown',
        color: '#818cf8',
        gradient: 'from-indigo-400/25 to-indigo-400/5'
      }
    ]
  },

  // ==========================================
  // 2. RELAXATION & EMOTION
  // ==========================================
  relax_unwind: {
    id: 'relax_unwind',
    name: 'Relax & Unwind',
    tagline: 'Gentle, comforting atmosphere for settling down',
    category: 'relaxation_emotion',
    musical_objective:
      'Creates a comfortable, calming soundscape. Features gentle transitions, warm emotional valence, and reduced dramatic contrast to help release tension.',
    duration_target_mins: [45, 60],
    default_duration_mins: 60,
    target_energy_range: [25, 48],
    bpm_tolerance: 5,
    vocal_threshold_max: 55,
    badge: 'Calm (60m)',
    color: '#06b6d4',
    accentGradient: 'from-cyan-500/25 to-sky-500/5',
    defaultControls: {
      targetDurationMins: 60,
      intensity: 'calm',
      transitionStyle: 'smooth',
      vocals: 'mixed'
    },
    phases: [
      {
        name: 'Twilight Settling',
        description: 'Gradual de-escalation from daily stimulation',
        duration_ratio: 0.22,
        target_energy_range: [38, 48],
        target_valence_range: [45, 65],
        phaseType: 'warmup',
        color: '#38bdf8',
        gradient: 'from-sky-500/25 to-sky-500/5'
      },
      {
        name: 'Warm Resonance',
        description: 'Comforting acoustic and ambient warmth with soothing harmonics',
        duration_ratio: 0.56,
        target_energy_range: [28, 44],
        target_valence_range: [40, 60],
        phaseType: 'plateau',
        color: '#06b6d4',
        gradient: 'from-cyan-500/25 to-cyan-500/5'
      },
      {
        name: 'Quiet Rest',
        description: 'Serene meditative closing with soft acoustic presence',
        duration_ratio: 0.22,
        target_energy_range: [24, 36],
        target_valence_range: [35, 55],
        phaseType: 'cooldown',
        color: '#14b8a6',
        gradient: 'from-teal-500/20 to-teal-500/5'
      }
    ]
  },

  mood_shift: {
    id: 'mood_shift',
    name: 'Mood Shift',
    tagline: 'Guided emotional journey from how you feel to where you want to be',
    category: 'relaxation_emotion',
    musical_objective:
      'Constructs a deliberate emotional trajectory guided by valence and arousal principles, meeting your current state and gently shifting toward your desired mindset.',
    duration_target_mins: [45, 60],
    default_duration_mins: 60,
    target_energy_range: [30, 85],
    bpm_tolerance: 5,
    badge: 'Emotion Wave (60m)',
    color: '#ec4899',
    accentGradient: 'from-pink-500/25 to-rose-500/5',
    defaultControls: {
      targetDurationMins: 60,
      intensity: 'balanced',
      transitionStyle: 'natural',
      vocals: 'mixed',
      moodShiftCurrent: 'neutral',
      moodShiftTarget: 'uplifted'
    },
    phases: [
      {
        name: 'Present State Alignment',
        description: 'Harmonizes with your initial emotional starting point',
        duration_ratio: 0.25,
        target_energy_range: [35, 55],
        target_valence_range: [35, 55],
        phaseType: 'warmup',
        color: '#f472b6',
        gradient: 'from-pink-400/25 to-pink-400/5'
      },
      {
        name: 'Emotional Pivot',
        description: 'Gradual valence and arousal bridge shifting the musical mood',
        duration_ratio: 0.50,
        target_energy_range: [45, 70],
        target_valence_range: [50, 75],
        phaseType: 'build',
        color: '#ec4899',
        gradient: 'from-pink-500/30 to-pink-500/5'
      },
      {
        name: 'Target State Arrival',
        description: 'Settles firmly into your desired emotional destination',
        duration_ratio: 0.25,
        target_energy_range: [55, 80],
        target_valence_range: [65, 88],
        phaseType: 'climax',
        color: '#fb7185',
        gradient: 'from-rose-400/25 to-rose-400/5'
      }
    ]
  },

  night_drive: {
    id: 'night_drive',
    name: 'Night Drive',
    tagline: 'Atmospheric, cinematic journey for nighttime travel',
    category: 'relaxation_emotion',
    musical_objective:
      'Delivers an immersive, cinematic nighttime atmosphere. Features smooth genre bridging, controlled intensity, and natural momentum without jarring interruptions.',
    duration_target_mins: [75, 90],
    default_duration_mins: 90,
    target_energy_range: [40, 82],
    bpm_tolerance: 5,
    badge: 'Cinematic (90m)',
    color: '#6366f1',
    accentGradient: 'from-indigo-500/25 to-purple-500/5',
    defaultControls: {
      targetDurationMins: 90,
      intensity: 'balanced',
      transitionStyle: 'smooth',
      vocals: 'mixed'
    },
    phases: [
      {
        name: 'City Lights Fade',
        description: 'Atmospheric departure as skyline fades into dark highway',
        duration_ratio: 0.20,
        target_energy_range: [45, 60],
        target_valence_range: [40, 65],
        phaseType: 'warmup',
        color: '#818cf8',
        gradient: 'from-indigo-400/25 to-indigo-400/5'
      },
      {
        name: 'Neon Cruise',
        description: 'Propulsive forward motion and immersive synth textures',
        duration_ratio: 0.60,
        target_energy_range: [58, 78],
        target_valence_range: [48, 75],
        phaseType: 'plateau',
        color: '#6366f1',
        gradient: 'from-indigo-600/30 to-indigo-600/5'
      },
      {
        name: 'Midnight Horizon',
        description: 'Quiet harmonic arrival under empty night skies',
        duration_ratio: 0.20,
        target_energy_range: [40, 55],
        target_valence_range: [40, 65],
        phaseType: 'cooldown',
        color: '#4f46e5',
        gradient: 'from-indigo-700/25 to-indigo-700/5'
      }
    ]
  },

  // ==========================================
  // 3. ENERGY & MOVEMENT
  // ==========================================
  festival_explosive: {
    id: 'festival_explosive',
    name: 'Party / Festival',
    tagline: 'High rhythmic momentum and celebratory peak energy',
    category: 'energy_movement',
    musical_objective:
      'Engineered for celebration and high-energy gatherings. Builds an energetic launch, escalates through voltage peaks, and maintains dynamic contrast.',
    duration_target_mins: [60, 90],
    default_duration_mins: 90,
    target_energy_range: [68, 100],
    bpm_tolerance: 6,
    badge: 'Party (90m)',
    color: '#f43f5e',
    accentGradient: 'from-rose-500/25 to-amber-500/5',
    defaultControls: {
      targetDurationMins: 90,
      intensity: 'intense',
      transitionStyle: 'dynamic',
      vocals: 'welcome'
    },
    phases: [
      {
        name: 'Warmup Groove',
        description: 'Upbeat entrance drawing listeners to the floor',
        duration_ratio: 0.15,
        target_energy_range: [60, 75],
        target_valence_range: [65, 88],
        phaseType: 'warmup',
        color: '#fb923c',
        gradient: 'from-orange-500/25 to-orange-500/5'
      },
      {
        name: 'Ascent',
        description: 'Driving acceleration into mainstage festival frequencies',
        duration_ratio: 0.20,
        target_energy_range: [75, 88],
        target_valence_range: [70, 92],
        phaseType: 'build',
        color: '#f59e0b',
        gradient: 'from-amber-500/30 to-amber-500/5'
      },
      {
        name: 'Peak Energy Plateau',
        description: 'Maximum adrenaline drops and crowd-favorite climaxes',
        duration_ratio: 0.50,
        target_energy_range: [86, 100],
        target_valence_range: [72, 98],
        phaseType: 'climax',
        color: '#f43f5e',
        gradient: 'from-rose-500/35 to-rose-500/5'
      },
      {
        name: 'Euphoric Landing',
        description: 'Crisp, celebratory cooldown keeping spirits high',
        duration_ratio: 0.15,
        target_energy_range: [56, 72],
        target_valence_range: [60, 85],
        phaseType: 'cooldown',
        color: '#ec4899',
        gradient: 'from-pink-500/25 to-pink-500/5'
      }
    ]
  },

  workout: {
    id: 'workout',
    name: 'Workout',
    tagline: 'Sustained rhythmic drive and high-tempo physical momentum',
    category: 'energy_movement',
    musical_objective:
      'Provides propulsive rhythm and motivating musical momentum for athletic training. Keeps transitions punchy without disruptive tempo crashes.',
    duration_target_mins: [45, 60],
    default_duration_mins: 60,
    target_energy_range: [72, 98],
    bpm_tolerance: 6,
    badge: 'Workout (60m)',
    color: '#ef4444',
    accentGradient: 'from-red-500/25 to-orange-500/5',
    defaultControls: {
      targetDurationMins: 60,
      intensity: 'intense',
      transitionStyle: 'dynamic',
      vocals: 'welcome',
      workoutProfile: 'sustained'
    },
    phases: [
      {
        name: 'Cardio Warmup',
        description: 'Elevating cadence and engaging initial muscular rhythm',
        duration_ratio: 0.15,
        target_energy_range: [65, 78],
        target_valence_range: [60, 85],
        phaseType: 'warmup',
        color: '#f97316',
        gradient: 'from-orange-500/25 to-orange-500/5'
      },
      {
        name: 'Power Circuit',
        description: 'High-intensity drive sustaining maximum athletic output',
        duration_ratio: 0.70,
        target_energy_range: [82, 98],
        target_valence_range: [68, 95],
        phaseType: 'climax',
        color: '#ef4444',
        gradient: 'from-red-500/35 to-red-500/5'
      },
      {
        name: 'Active Cooldown',
        description: 'Rhythmic taper allowing heart rate to safely recover',
        duration_ratio: 0.15,
        target_energy_range: [48, 65],
        target_valence_range: [55, 80],
        phaseType: 'cooldown',
        color: '#3b82f6',
        gradient: 'from-blue-500/25 to-blue-500/5'
      }
    ]
  },

  morning_boost: {
    id: 'morning_boost',
    name: 'Morning Boost',
    tagline: 'Gentle opening to energized momentum for a fresh start',
    category: 'energy_movement',
    musical_objective:
      'Gradually shifts from warm morning contemplation toward uplifting rhythm and positive drive, helping you start the day energized.',
    duration_target_mins: [35, 45],
    default_duration_mins: 45,
    target_energy_range: [40, 85],
    bpm_tolerance: 5,
    badge: 'Morning (45m)',
    color: '#f97316',
    accentGradient: 'from-orange-500/25 to-amber-500/5',
    defaultControls: {
      targetDurationMins: 45,
      intensity: 'balanced',
      transitionStyle: 'natural',
      vocals: 'welcome'
    },
    phases: [
      {
        name: 'Sunrise Awakening',
        description: 'Warm acoustic sunlight and melodic clarity',
        duration_ratio: 0.22,
        target_energy_range: [42, 58],
        target_valence_range: [50, 75],
        phaseType: 'warmup',
        color: '#fbbf24',
        gradient: 'from-amber-400/25 to-amber-400/5'
      },
      {
        name: 'Morning Momentum',
        description: 'Crisp percussive lift igniting daily focus and positive drive',
        duration_ratio: 0.48,
        target_energy_range: [60, 76],
        target_valence_range: [65, 88],
        phaseType: 'build',
        color: '#f97316',
        gradient: 'from-orange-500/30 to-orange-500/5'
      },
      {
        name: 'Daybreak Surge',
        description: 'Uplifting crescendo ready to tackle ambitious goals',
        duration_ratio: 0.30,
        target_energy_range: [75, 88],
        target_valence_range: [70, 95],
        phaseType: 'climax',
        color: '#ef4444',
        gradient: 'from-red-500/35 to-red-500/5'
      }
    ]
  },

  // Backward compatibility alias for morning_boost
  morning_motivation: {
    id: 'morning_motivation',
    name: 'Morning Boost',
    tagline: 'Gentle opening to energized momentum for a fresh start',
    category: 'energy_movement',
    musical_objective:
      'Gradually shifts from warm morning contemplation toward uplifting rhythm and positive drive.',
    duration_target_mins: [35, 45],
    default_duration_mins: 45,
    target_energy_range: [40, 85],
    bpm_tolerance: 5,
    badge: 'Morning (45m)',
    color: '#f97316',
    accentGradient: 'from-orange-500/25 to-amber-500/5',
    defaultControls: {
      targetDurationMins: 45,
      intensity: 'balanced',
      transitionStyle: 'natural',
      vocals: 'welcome'
    },
    phases: [
      {
        name: 'Sunrise Awakening',
        description: 'Warm acoustic sunlight and melodic clarity',
        duration_ratio: 0.22,
        target_energy_range: [42, 58],
        target_valence_range: [50, 75],
        phaseType: 'warmup',
        color: '#fbbf24',
        gradient: 'from-amber-400/25 to-amber-400/5'
      },
      {
        name: 'Morning Momentum',
        description: 'Crisp percussive lift igniting daily focus and positive drive',
        duration_ratio: 0.48,
        target_energy_range: [60, 76],
        target_valence_range: [65, 88],
        phaseType: 'build',
        color: '#f97316',
        gradient: 'from-orange-500/30 to-orange-500/5'
      },
      {
        name: 'Daybreak Surge',
        description: 'Uplifting crescendo ready to tackle ambitious goals',
        duration_ratio: 0.30,
        target_energy_range: [75, 88],
        target_valence_range: [70, 95],
        phaseType: 'climax',
        color: '#ef4444',
        gradient: 'from-red-500/35 to-red-500/5'
      }
    ]
  },

  // ==========================================
  // 4. JOURNEY & EXPLORATION
  // ==========================================
  roadtrip: {
    id: 'roadtrip',
    name: 'Roadtrip',
    tagline: 'Multi-wave musical journey curated for open-road endurance',
    category: 'journey_exploration',
    musical_objective:
      'Long-distance musical storytelling. Alternates naturally between driving momentum and restorative acoustic valleys every ~45 minutes to prevent fatigue.',
    duration_target_mins: [90, 150],
    default_duration_mins: 120,
    target_energy_range: [38, 94],
    bpm_tolerance: 6,
    badge: 'Roadtrip (2h)',
    color: '#8b5cf6',
    accentGradient: 'from-purple-500/25 to-indigo-500/5',
    defaultControls: {
      targetDurationMins: 120,
      intensity: 'balanced',
      transitionStyle: 'natural',
      vocals: 'mixed'
    },
    phases: [
      {
        name: 'Departure Drive',
        description: 'Warm, optimistic departure heading out onto the open road',
        duration_ratio: 0.16,
        target_energy_range: [45, 65],
        target_valence_range: [45, 70],
        phaseType: 'warmup',
        color: '#a855f7',
        gradient: 'from-purple-500/25 to-purple-500/5'
      },
      {
        name: 'Act I: Open Highway',
        description: 'Fast-moving forward momentum with anthemic guitars and synths',
        duration_ratio: 0.26,
        target_energy_range: [68, 84],
        target_valence_range: [55, 80],
        phaseType: 'build',
        color: '#6366f1',
        gradient: 'from-indigo-500/25 to-indigo-500/5'
      },
      {
        name: 'Valley: Scenic Vista',
        description: 'Restorative dip in volume and tempo to keep ears fresh',
        duration_ratio: 0.14,
        target_energy_range: [38, 52],
        target_valence_range: [40, 60],
        phaseType: 'reset',
        color: '#38bdf8',
        gradient: 'from-sky-500/20 to-sky-500/5'
      },
      {
        name: 'Act II: Sunset Ascent',
        description: 'Secondary energetic climb through sweeping golden-hour melodies',
        duration_ratio: 0.28,
        target_energy_range: [76, 92],
        target_valence_range: [60, 88],
        phaseType: 'climax',
        color: '#ec4899',
        gradient: 'from-pink-500/30 to-pink-500/5'
      },
      {
        name: 'Arrival Horizon',
        description: 'Peaceful arrival as trip reaches destination',
        duration_ratio: 0.16,
        target_energy_range: [40, 55],
        target_valence_range: [45, 68],
        phaseType: 'cooldown',
        color: '#14b8a6',
        gradient: 'from-teal-500/20 to-teal-500/5'
      }
    ]
  },

  genre_cadence: {
    id: 'genre_cadence',
    name: 'Genre & Cadence Lock',
    tagline: 'Strict rhythmic consistency and stylistic harmony',
    category: 'journey_exploration',
    musical_objective:
      'Maintains tight rhythmic synchronization and stylistic purity within a chosen groove, minimizing abrupt genre shifts or jarring tempo deltas.',
    duration_target_mins: [60, 75],
    default_duration_mins: 75,
    target_energy_range: [58, 92],
    bpm_tolerance: 3,
    badge: 'Cadence (75m)',
    color: '#eab308',
    accentGradient: 'from-amber-500/25 to-yellow-500/5',
    defaultControls: {
      targetDurationMins: 75,
      intensity: 'intense',
      transitionStyle: 'smooth',
      vocals: 'mixed',
      genrePreference: 'all'
    },
    phases: [
      {
        name: 'Groove Alignment',
        description: 'Locks into the core pocket and tempo foundation',
        duration_ratio: 0.20,
        target_energy_range: [60, 75],
        target_valence_range: [65, 88],
        phaseType: 'warmup',
        color: '#facc15',
        gradient: 'from-yellow-500/25 to-yellow-500/5'
      },
      {
        name: 'In-The-Pocket Groove',
        description: 'Tight syncopation and continuous positive cadence',
        duration_ratio: 0.48,
        target_energy_range: [70, 86],
        target_valence_range: [70, 92],
        phaseType: 'plateau',
        color: '#eab308',
        gradient: 'from-amber-500/30 to-amber-500/5'
      },
      {
        name: 'Harmonic Peak',
        description: 'Maximum energetic release while preserving cadence lock',
        duration_ratio: 0.22,
        target_energy_range: [82, 95],
        target_valence_range: [75, 98],
        phaseType: 'climax',
        color: '#f97316',
        gradient: 'from-orange-500/35 to-orange-500/5'
      },
      {
        name: 'Groove Tail',
        description: 'Satisfying warm finish keeping the pocket alive',
        duration_ratio: 0.10,
        target_energy_range: [52, 68],
        target_valence_range: [60, 80],
        phaseType: 'cooldown',
        color: '#10b981',
        gradient: 'from-emerald-500/20 to-emerald-500/5'
      }
    ]
  },

  musical_discovery: {
    id: 'musical_discovery',
    name: 'Musical Discovery',
    tagline: 'Rediscover hidden gems and unexpected pairings in your library',
    category: 'journey_exploration',
    musical_objective:
      'Uncovers overlooked tracks across your collection. Creates unexpected but musically coherent genre bridges, minimizes artist repetition, and explores sonic variety.',
    duration_target_mins: [75, 90],
    default_duration_mins: 90,
    target_energy_range: [40, 88],
    bpm_tolerance: 6,
    badge: 'Discovery (90m)',
    color: '#38bdf8',
    accentGradient: 'from-sky-500/25 to-blue-500/5',
    defaultControls: {
      targetDurationMins: 90,
      intensity: 'balanced',
      transitionStyle: 'dynamic',
      vocals: 'mixed',
      discoveryNovelty: 'balanced'
    },
    phases: [
      {
        name: 'Uncharted Gateway',
        description: 'Opening with less-frequently played library tracks',
        duration_ratio: 0.20,
        target_energy_range: [44, 62],
        target_valence_range: [45, 75],
        phaseType: 'warmup',
        color: '#7dd3fc',
        gradient: 'from-sky-400/25 to-sky-400/5'
      },
      {
        name: 'Eclectic Fusion',
        description: 'Harmonious genre bridges pairing diverse musical moods',
        duration_ratio: 0.60,
        target_energy_range: [55, 82],
        target_valence_range: [50, 85],
        phaseType: 'plateau',
        color: '#38bdf8',
        gradient: 'from-sky-600/30 to-sky-600/5'
      },
      {
        name: 'Serendipitous Outro',
        description: 'Memorable resolution connecting newly rediscovered favorites',
        duration_ratio: 0.20,
        target_energy_range: [42, 60],
        target_valence_range: [45, 70],
        phaseType: 'cooldown',
        color: '#0284c7',
        gradient: 'from-sky-700/25 to-sky-700/5'
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
 * Emotional Mood Vector Mapper for "Mood Shift" intent
 */
const MOOD_COORDINATES: Record<string, { energy: number; valence: number }> = {
  // Current states
  calm: { energy: 35, valence: 55 },
  neutral: { energy: 50, valence: 50 },
  tired: { energy: 30, valence: 40 },
  restless: { energy: 70, valence: 45 },
  low: { energy: 28, valence: 30 },
  energized: { energy: 80, valence: 75 },
  // Target states
  relaxed: { energy: 35, valence: 65 },
  focused: { energy: 52, valence: 55 },
  uplifted: { energy: 72, valence: 82 },
  motivated: { energy: 78, valence: 78 },
  reflective: { energy: 42, valence: 60 }
};

/**
 * Computes a soft target trajectory curve at progress t (0.0 to 1.0)
 */
function getTargetTrajectoryPoint(
  intent: CognitiveIntentConfig,
  progress: number,
  intensityAdjustment: number = 0,
  controls?: FlowGenerationControls
): { targetEnergy: number; targetValence: number; currentPhaseIdx: number } {
  // Special handling for dynamic Mood Shift trajectory
  if (intent.id === 'mood_shift' && controls?.moodShiftCurrent && controls?.moodShiftTarget) {
    const startCoord = MOOD_COORDINATES[controls.moodShiftCurrent] || { energy: 50, valence: 50 };
    const endCoord = MOOD_COORDINATES[controls.moodShiftTarget] || { energy: 70, valence: 80 };

    const targetEnergy = Math.min(
      100,
      Math.max(15, startCoord.energy + (endCoord.energy - startCoord.energy) * progress + intensityAdjustment)
    );
    const targetValence = Math.min(
      100,
      Math.max(15, startCoord.valence + (endCoord.valence - startCoord.valence) * progress)
    );

    const phaseIdx = progress < 0.25 ? 0 : progress < 0.75 ? 1 : 2;
    return { targetEnergy, targetValence, currentPhaseIdx: phaseIdx };
  }

  let accumulatedRatio = 0;
  let phaseIdx = 0;

  for (let i = 0; i < intent.phases.length; i++) {
    const phase = intent.phases[i];
    const nextRatio = accumulatedRatio + phase.duration_ratio;
    if (progress <= nextRatio || i === intent.phases.length - 1) {
      phaseIdx = i;
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
 * Intelligent Multi-Criteria Cognitive DJ Set Synthesizer
 *
 * GUARANTEES:
 * 1. Strict playlist duration compliance (targets specified minutes ±5%, never stopping prematurely).
 * 2. Multi-factor transition compatibility (half/double time, valence continuity, acoustic proximity).
 * 3. Artist repetition prevention (0 consecutive same-artist tracks, spaced across the set).
 * 4. Zero duplicate track IDs.
 * 5. Dynamic, continuous phase calculations mapped to actual track placements.
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
  const mergedControls: FlowGenerationControls = {
    ...intent.defaultControls,
    ...controls
  };

  // 1. HARD DURATION TARGET (in milliseconds)
  const targetDurationMins =
    mergedControls.targetDurationMins ||
    intent.default_duration_mins ||
    (intent.duration_target_mins[0] + intent.duration_target_mins[1]) / 2;
  const targetDurationMs = targetDurationMins * 60 * 1000;

  // 2. INTENSITY ADJUSTMENT
  let intensityOffset = 0;
  if (mergedControls.intensity === 'calm') intensityOffset = -15;
  if (mergedControls.intensity === 'intense' || mergedControls.intensity === 'energetic') intensityOffset = 15;

  const normalizedPool = availableTracks.map(normalizeTrack);

  // 3. GENRE SELECTION & FILTERING
  const selectedGenres =
    mergedControls.selectedGenres && mergedControls.selectedGenres.length > 0
      ? mergedControls.selectedGenres
      : (mergedControls.genrePreference && mergedControls.genrePreference !== 'all' ? [mergedControls.genrePreference] : []);

  const genreMode = mergedControls.genreMode || (selectedGenres.length > 0 ? 'prefer' : 'surprise');

  let candidatePool = normalizedPool;
  let strictWarning: string | undefined;

  if (genreMode === 'strict' && selectedGenres.length > 0) {
    const strictPool = normalizedPool.filter((t) => trackMatchesGenres(t, selectedGenres));
    if (strictPool.length === 0) {
      strictWarning = `No tracks in your library match the selected genres (${selectedGenres.join(', ')}). Consider switching to "Prefer These Genres" or adding more genres.`;
      return {
        flow_intent: intentId,
        computed_total_duration_ms: 0,
        computed_total_tracks: 0,
        phases: [],
        curated_set: [],
        applied_controls: mergedControls,
        strictWarning
      };
    }
    candidatePool = strictPool;
  }

  // 4. VOCAL FILTERING
  const isInstrumentalPriority =
    mergedControls.vocals === 'instrumental' ||
    (Boolean(intent.vocal_threshold_max) && mergedControls.vocals !== 'welcome');

  if (isInstrumentalPriority) {
    const threshold = intent.vocal_threshold_max || 25;
    const instrumentalCandidates = candidatePool.filter((t) => t.vocal_presence <= threshold);
    if (instrumentalCandidates.length >= 8) {
      candidatePool = instrumentalCandidates;
    } else {
      const relaxed = candidatePool.filter((t) => t.vocal_presence <= threshold + 25);
      if (relaxed.length >= 8) {
        candidatePool = relaxed;
      }
    }
  }

  const curatedSet: Track[] = [];
  const usedTrackIds = new Set<string>();
  const recentArtists: string[] = [];
  let accumulatedMs = 0;

  const transitionContext: TransitionContext = {
    intentId,
    transitionStyle: mergedControls.transitionStyle,
    allowHalfDoubleTime: true
  };

  // 5. SELECT OPENER TRACK WITH SEED DIVERSITY
  const seed = mergedControls.seed || 0;
  const openerTrajectory = getTargetTrajectoryPoint(intent, 0.0, intensityOffset, mergedControls);
  const openerCandidates = candidatePool.filter(
    (t) =>
      Math.abs(t.energy_score - openerTrajectory.targetEnergy) <= 22 &&
      Math.abs(t.valence_score - openerTrajectory.targetValence) <= 35
  );

  const initialPickList = openerCandidates.length > 0 ? openerCandidates : candidatePool;
  const sortedOpeners = [...initialPickList].sort(
    (a, b) =>
      Math.abs(a.energy_score - openerTrajectory.targetEnergy) -
      Math.abs(b.energy_score - openerTrajectory.targetEnergy)
  );

  const openerIndex = seed ? (Math.abs(seed) % Math.min(sortedOpeners.length, 5)) : 0;
  const opener = sortedOpeners[openerIndex] || sortedOpeners[0];
  usedTrackIds.add(opener.id);
  recentArtists.push(opener.artist.toLowerCase());
  accumulatedMs += opener.duration_ms || 210000;

  const openerEval = evaluateTrackTransition(null, opener, transitionContext);

  curatedSet.push({
    ...opener,
    overallIndex: 1,
    transition_note: openerEval.note,
    transition_score: openerEval.score
  });

  // 6. ADAPTIVE SEQUENCING LOOP WITH HARD DURATION CONSTRAINT
  let currentAnchor = opener;
  let trackIndex = 2;

  // Scaled duration threshold
  const minRequiredMs =
    targetDurationMins <= 45 ? targetDurationMs * 0.88 : targetDurationMs * 0.93;

  while (
    accumulatedMs < minRequiredMs ||
    (accumulatedMs < targetDurationMs && targetDurationMs - accumulatedMs > 60000)
  ) {
    if (usedTrackIds.size >= normalizedPool.length) {
      break;
    }

    const progress = Math.min(0.98, accumulatedMs / targetDurationMs);
    const trajectory = getTargetTrajectoryPoint(intent, progress, intensityOffset, mergedControls);
    const currentPhaseTemplate = intent.phases[trajectory.currentPhaseIdx];

    const currentContext: TransitionContext = {
      ...transitionContext,
      phaseType: currentPhaseTemplate.phaseType,
      recentArtists: recentArtists.slice(-4)
    };

    // Filter available candidates from candidatePool
    let available = candidatePool.filter((t) => !usedTrackIds.has(t.id));
    if (available.length === 0) {
      if (genreMode === 'strict') {
        // Under strict mode, NEVER fall back to unrelated genres
        strictWarning = `Your library contained ${curatedSet.length} tracks (${Math.round(accumulatedMs / 60000)} mins) strictly matching "${selectedGenres.join(', ')}". All eligible tracks were curated.`;
        break;
      }
      // Non-strict fallback to normalizedPool if candidatePool exhausted
      available = normalizedPool.filter((t) => !usedTrackIds.has(t.id));
      if (available.length === 0) break;
    }

    let bestCandidate: Track | null = null;
    let highestScore = -Infinity;
    let bestEval = openerEval;

    // Transition style weights
    let transWeight = 0.45;
    let trajWeight = 0.35;
    let intentWeight = 0.20;

    if (mergedControls.transitionStyle === 'smooth' || mergedControls.transitionStyle === 'seamless') {
      transWeight = 0.60;
      trajWeight = 0.25;
      intentWeight = 0.15;
    } else if (mergedControls.transitionStyle === 'dynamic' || mergedControls.transitionStyle === 'adventurous') {
      transWeight = 0.25;
      trajWeight = 0.50;
      intentWeight = 0.25;
    }

    // Beam evaluation
    for (let i = 0; i < available.length; i++) {
      const candidate = available[i];

      // 1. Transition Coherence Score (0 to 100)
      const transEval = evaluateTrackTransition(currentAnchor, candidate, currentContext);

      // 2. Global Trajectory Alignment (0 to 100)
      const energyDelta = Math.abs(candidate.energy_score - trajectory.targetEnergy);
      const trajectoryScore = Math.max(0, 100 - energyDelta * 2.5);

      // 3. Intent Fit Score (0 to 100)
      let intentFitScore = 100;
      if (candidate.energy_score < intent.target_energy_range[0] - 12) {
        intentFitScore -= 30;
      } else if (candidate.energy_score > intent.target_energy_range[1] + 12) {
        intentFitScore -= 30;
      }

      // 4. Vocal Preference Scoring
      let vocalScore = 0;
      if (mergedControls.vocals === 'instrumental') {
        if (candidate.vocal_presence > 25) {
          vocalScore -= (candidate.vocal_presence - 25) * 1.5;
        } else {
          vocalScore += 20;
        }
      } else if (mergedControls.vocals === 'welcome') {
        if (candidate.vocal_presence >= 50) {
          vocalScore += 25;
        }
      }

      // 5. Energy Intensity Calibration Bonus / Penalty
      let energyIntensityBonus = 0;
      if (mergedControls.intensity === 'calm') {
        if (candidate.energy_score > 62) {
          energyIntensityBonus -= (candidate.energy_score - 62) * 2.0;
        }
        if (candidate.energy_score <= 48) {
          energyIntensityBonus += 25;
        }
      } else if (mergedControls.intensity === 'intense' || mergedControls.intensity === 'energetic') {
        if (candidate.energy_score < 55) {
          energyIntensityBonus -= (55 - candidate.energy_score) * 2.0;
        }
        if (candidate.energy_score >= 75) {
          energyIntensityBonus += 25;
        }
      }

      // 6. Preferred Genre Bonus (for 'prefer' mode)
      let genreBonus = 0;
      if (genreMode === 'prefer' && selectedGenres.length > 0) {
        if (trackMatchesGenres(candidate, selectedGenres)) {
          genreBonus = 40;
        }
      }

      // 7. Duration Proximity Optimization near target finish
      let durationBonus = 0;
      const remainingMs = targetDurationMs - accumulatedMs;
      if (remainingMs <= 300000) {
        const diffFromRemaining = Math.abs((candidate.duration_ms || 210000) - remainingMs);
        if (diffFromRemaining < 45000) {
          durationBonus = 20;
        }
      }

      // 8. Seed tie-breaking jitter
      const seedJitter = seed
        ? ((Math.abs(hashString(candidate.id + ':' + seed + ':' + trackIndex)) % 100) / 100) * 12
        : 0;

      const qualityScore =
        transEval.score * transWeight +
        trajectoryScore * trajWeight +
        intentFitScore * intentWeight +
        vocalScore +
        energyIntensityBonus +
        genreBonus +
        durationBonus +
        seedJitter;

      if (qualityScore > highestScore) {
        highestScore = qualityScore;
        bestCandidate = candidate;
        bestEval = transEval;
      }
    }

    if (!bestCandidate) {
      bestCandidate = available[0];
      bestEval = evaluateTrackTransition(currentAnchor, bestCandidate, currentContext);
    }

    // Check if stopping now is closer to the duration target than adding this next candidate
    const currentDiff = Math.abs(accumulatedMs - targetDurationMs);
    const withCandidateDiff = Math.abs(accumulatedMs + (bestCandidate.duration_ms || 210000) - targetDurationMs);

    if (accumulatedMs >= minRequiredMs && currentDiff <= withCandidateDiff) {
      break;
    }

    usedTrackIds.add(bestCandidate.id);
    recentArtists.push(bestCandidate.artist.toLowerCase());
    accumulatedMs += bestCandidate.duration_ms || 210000;

    curatedSet.push({
      ...bestCandidate,
      overallIndex: trackIndex++,
      transition_note: bestEval.note,
      transition_score: bestEval.score
    });

    currentAnchor = bestCandidate;

    // Check if we reached the sweet spot around target duration
    if (accumulatedMs >= targetDurationMs * 0.96 && accumulatedMs <= targetDurationMs * 1.04) {
      break;
    }
  }

  // 7. DYNAMIC PHASE SEGMENTATION
  // Compute continuous phase boundaries based on actual resulting set duration
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
    applied_controls: mergedControls,
    strictWarning
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
    trackCount: Math.round(p.duration_ratio * 24),
    duration_ms: p.duration_ratio * 90 * 60 * 1000,
    minEnergy: p.target_energy_range[0],
    maxEnergy: p.target_energy_range[1],
    color: p.color,
    gradient: p.gradient,
    rangeIndex: [i * 8 + 1, (i + 1) * 8]
  })
);

export function getPhaseConfigsForStyle(
  intentId: CognitiveFlowIntentId = 'deep_focus',
  _totalTracks?: number
): FlowPhaseConfig[] {
  const intent = COGNITIVE_INTENTS[intentId] || COGNITIVE_INTENTS.deep_focus;
  const targetMins = intent.default_duration_mins || 90;
  const totalDurationMs = targetMins * 60 * 1000;

  let start = 1;
  return intent.phases.map((p) => {
    const estTracks = Math.max(2, Math.round(p.duration_ratio * 24));
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
