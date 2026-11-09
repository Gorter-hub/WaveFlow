/**
 * Computational Musicology: Camelot Harmonic Mixing Engine
 * Provides pitch class, mode, circle of fifths, and harmonic distance calculations.
 */

import { CamelotKey } from '../types';

export const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

// Pitch class to Camelot mapping for Major (Mode 1 -> 'B') and Minor (Mode 0 -> 'A')
const MAJOR_PITCH_TO_CAMELOT: Record<number, CamelotKey> = {
  0: '8B',   // C Major
  1: '3B',   // C# Major
  2: '10B',  // D Major
  3: '5B',   // Eb Major
  4: '12B',  // E Major
  5: '7B',   // F Major
  6: '2B',   // F# Major
  7: '9B',   // G Major
  8: '4B',   // Ab Major
  9: '11B',  // A Major
  10: '6B',  // Bb Major
  11: '1B'   // B Major
};

const MINOR_PITCH_TO_CAMELOT: Record<number, CamelotKey> = {
  0: '5A',   // C Minor
  1: '12A',  // C# Minor
  2: '7A',   // D Minor
  3: '2A',   // Eb Minor
  4: '9A',   // E Minor
  5: '4A',   // F Minor
  6: '11A',  // F# Minor
  7: '6A',   // G Minor
  8: '1A',   // Ab Minor
  9: '8A',   // A Minor
  10: '3A',  // Bb Minor
  11: '10A'  // B Minor
};

const CAMELOT_TO_KEY_NAME: Record<CamelotKey, string> = {
  '1A': 'G#m / Abm',
  '1B': 'B Maj',
  '2A': 'D#m / Ebm',
  '2B': 'F# / Gb Maj',
  '3A': 'A#m / Bbm',
  '3B': 'C# / Db Maj',
  '4A': 'Fm',
  '4B': 'G# / Ab Maj',
  '5A': 'Cm',
  '5B': 'D# / Eb Maj',
  '6A': 'Gm',
  '6B': 'A# / Bb Maj',
  '7A': 'Dm',
  '7B': 'F Maj',
  '8A': 'Am',
  '8B': 'C Maj',
  '9A': 'Em',
  '9B': 'G Maj',
  '10A': 'Bm',
  '10B': 'D Maj',
  '11A': 'F#m',
  '11B': 'A Maj',
  '12A': 'C#m',
  '12B': 'E Maj'
};

/**
 * Converts Pitch Class (0-11) and Mode (0=Minor, 1=Major) to Camelot Key
 */
export function pitchClassAndModeToCamelot(pitchClass: number, mode: 0 | 1): CamelotKey {
  const normPitch = ((pitchClass % 12) + 12) % 12;
  if (mode === 1) {
    return MAJOR_PITCH_TO_CAMELOT[normPitch] || '8B';
  } else {
    return MINOR_PITCH_TO_CAMELOT[normPitch] || '8A';
  }
}

/**
 * Returns human-readable musical key name for a Camelot key
 */
export function getCamelotKeyName(key: CamelotKey): string {
  return CAMELOT_TO_KEY_NAME[key] || key;
}

export type HarmonicRelation =
  | 'exact'
  | 'relative'
  | 'adjacent'
  | 'energy_boost'
  | 'diagonal'
  | 'two_step'
  | 'clash';

export interface CamelotCompatibilityResult {
  distance: number;
  relation: HarmonicRelation;
  cost: number; // 0 (best) to 1.0 (worst)
  score: number; // 0 to 100
  label: string;
}

/**
 * Calculates harmonic distance on the Camelot Wheel
 */
export function evaluateCamelotTransition(
  keyA: CamelotKey | undefined,
  keyB: CamelotKey | undefined
): CamelotCompatibilityResult {
  if (!keyA || !keyB) {
    return {
      distance: 0,
      relation: 'exact',
      cost: 0.15,
      score: 85,
      label: 'Harmonic Bridge'
    };
  }

  const numA = parseInt(keyA.slice(0, -1), 10);
  const letterA = keyA.slice(-1) as 'A' | 'B';

  const numB = parseInt(keyB.slice(0, -1), 10);
  const letterB = keyB.slice(-1) as 'A' | 'B';

  // Circular clock distance on the 12-hour wheel
  const directDiff = Math.abs(numA - numB);
  const circularDiff = Math.min(directDiff, 12 - directDiff);
  const forwardStep = (numB - numA + 12) % 12;

  // 1. Same letter (Major -> Major or Minor -> Minor)
  if (letterA === letterB) {
    if (circularDiff === 0) {
      return {
        distance: 0,
        relation: 'exact',
        cost: 0.0,
        score: 100,
        label: 'Tonal Lock (Exact Key)'
      };
    }
    if (circularDiff === 1) {
      return {
        distance: 1,
        relation: 'adjacent',
        cost: 0.08,
        score: 92,
        label: 'Adjacent Harmonic Blend (±1 Fifth)'
      };
    }
    // Energy Boost: +2 hours on the Camelot wheel (ascends one whole step musically, e.g., 8A -> 10A)
    if (forwardStep === 2) {
      return {
        distance: 2,
        relation: 'energy_boost',
        cost: 0.18,
        score: 82,
        label: 'Harmonic Energy Boost (+2 Semitones)'
      };
    }
    if (circularDiff === 2) {
      return {
        distance: 2,
        relation: 'two_step',
        cost: 0.35,
        score: 65,
        label: 'Two-Step Modulated Shift'
      };
    }
    // Clash
    const clashCost = Math.min(1.0, 0.45 + circularDiff * 0.1);
    return {
      distance: circularDiff,
      relation: 'clash',
      cost: clashCost,
      score: Math.max(10, Math.round((1 - clashCost) * 100)),
      label: `Harmonic Tension (Δ${circularDiff})`
    };
  }

  // 2. Different letter (Relative / Parallel major/minor switch)
  if (circularDiff === 0) {
    // Relative Major/Minor (e.g., 8A Am <-> 8B C Maj)
    return {
      distance: 0,
      relation: 'relative',
      cost: 0.05,
      score: 95,
      label: 'Relative Major/Minor (Parallel Mode)'
    };
  }

  if (circularDiff === 1) {
    // Diagonal mix (e.g. 8A -> 9B or 8B -> 7A)
    return {
      distance: 1,
      relation: 'diagonal',
      cost: 0.22,
      score: 78,
      label: 'Diagonal Mode Modulation'
    };
  }

  const clashCost = Math.min(1.0, 0.55 + circularDiff * 0.1);
  return {
    distance: circularDiff,
    relation: 'clash',
    cost: clashCost,
    score: Math.max(5, Math.round((1 - clashCost) * 100)),
    label: `Dissonant Key Jump (Δ${circularDiff} Mode Switch)`
  };
}

/**
 * Aesthetic color palette mapping for Camelot Keys in UI
 */
export function getCamelotBadgeStyle(key?: CamelotKey): {
  bg: string;
  text: string;
  border: string;
  accent: string;
} {
  if (!key) {
    return {
      bg: 'bg-zinc-800/80',
      text: 'text-zinc-400',
      border: 'border-zinc-700',
      accent: '#71717a'
    };
  }

  const num = parseInt(key.slice(0, -1), 10);
  const isMinor = key.endsWith('A');

  // Harmonic color wheel around 12 sectors
  const PALETTES: Record<number, { hex: string; bg: string; text: string; border: string }> = {
    1: { hex: '#ec4899', bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30' },
    2: { hex: '#f43f5e', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
    3: { hex: '#ef4444', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    4: { hex: '#f97316', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
    5: { hex: '#f59e0b', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    6: { hex: '#eab308', bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    7: { hex: '#84cc16', bg: 'bg-lime-500/15', text: 'text-lime-400', border: 'border-lime-500/30' },
    8: { hex: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    9: { hex: '#06b6d4', bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    10: { hex: '#3b82f6', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    11: { hex: '#6366f1', bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    12: { hex: '#a855f7', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' }
  };

  const palette = PALETTES[num] || PALETTES[8];

  return {
    bg: palette.bg,
    text: palette.text,
    border: isMinor ? `${palette.border} border-dashed` : palette.border,
    accent: palette.hex
  };
}
