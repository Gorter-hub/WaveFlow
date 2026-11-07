import { Track, FlowPhaseConfig, FlowPhaseName } from '../types';

export const PHASE_CONFIGS: FlowPhaseConfig[] = [
  {
    name: 'Warm-up',
    description: 'Sets the groove, easy entry into the set',
    trackCount: 10,
    minEnergy: 40,
    maxEnergy: 60,
    color: '#34d399',
    gradient: 'from-emerald-500/25 to-emerald-500/5',
    rangeIndex: [1, 10]
  },
  {
    name: 'Build-up',
    description: 'Drives rhythmic tension and accelerates momentum',
    trackCount: 10,
    minEnergy: 61,
    maxEnergy: 80,
    color: '#1DB954',
    gradient: 'from-spotify/30 to-spotify/5',
    rangeIndex: [11, 20]
  },
  {
    name: 'Peak',
    description: 'First high-voltage explosive crescendo',
    trackCount: 5,
    minEnergy: 81,
    maxEnergy: 100,
    color: '#fbbf24',
    gradient: 'from-amber-500/30 to-amber-500/5',
    rangeIndex: [21, 25]
  },
  {
    name: 'Valley/Respiro',
    description: 'Atmospheric breakdown & psychological breathing room',
    trackCount: 7,
    minEnergy: 30,
    maxEnergy: 50,
    color: '#818cf8',
    gradient: 'from-indigo-500/25 to-indigo-500/5',
    rangeIndex: [26, 32]
  },
  {
    name: 'Climax',
    description: 'The ultimate emotional & energetic peak of the night',
    trackCount: 13,
    minEnergy: 81,
    maxEnergy: 100,
    color: '#f43f5e',
    gradient: 'from-rose-500/35 to-rose-500/5',
    rangeIndex: [33, 45]
  },
  {
    name: 'Outro',
    description: 'Gentle deceleration, harmonious cooldown',
    trackCount: 5,
    minEnergy: 40,
    maxEnergy: 60,
    color: '#14b8a6',
    gradient: 'from-teal-500/25 to-teal-500/5',
    rangeIndex: [46, 50]
  }
];

/**
 * Arranges tracks into the 6-phase DJ set curve
 * @param availableTracks Pool of tracks with energy (0-100)
 * @returns Ordered array of exactly 50 tracks following the DJ Set curve
 */
export function generateDJCurve(availableTracks: Track[]): Track[] {
  if (!availableTracks || availableTracks.length === 0) {
    return [];
  }

  // Ensure every track has a defined energy score (fallback to 50 if missing)
  const pool: Track[] = availableTracks.map((t) => ({
    ...t,
    energy: typeof t.energy === 'number' && !isNaN(t.energy) ? Math.min(100, Math.max(0, Math.round(t.energy))) : 50,
    valence: typeof t.valence === 'number' && !isNaN(t.valence) ? Math.min(100, Math.max(0, Math.round(t.valence))) : 50
  }));

  const usedTrackIds = new Set<string>();
  const finalSet: Track[] = [];

  for (const phase of PHASE_CONFIGS) {
    const needed = phase.trackCount;
    const selectedForPhase: Track[] = [];

    // Filter available unused tracks
    let unusedPool = pool.filter((t) => !usedTrackIds.has(t.id));

    // Try finding tracks in exact range [minEnergy, maxEnergy]
    let candidates = unusedPool.filter(
      (t) => (t.energy ?? 50) >= phase.minEnergy && (t.energy ?? 50) <= phase.maxEnergy
    );

    // If we don't have enough tracks, expand the window progressively
    let tolerance = 5;
    while (candidates.length < needed && tolerance <= 50) {
      const lower = Math.max(0, phase.minEnergy - tolerance);
      const upper = Math.min(100, phase.maxEnergy + tolerance);
      candidates = unusedPool.filter((t) => (t.energy ?? 50) >= lower && (t.energy ?? 50) <= upper);
      tolerance += 5;
    }

    // If still not enough (extreme edge case with small pool), sort all unused by distance to midpoint
    if (candidates.length < needed) {
      const targetMid = (phase.minEnergy + phase.maxEnergy) / 2;
      candidates = [...unusedPool].sort(
        (a, b) => Math.abs((a.energy ?? 50) - targetMid) - Math.abs((b.energy ?? 50) - targetMid)
      );
    }

    // Pick candidates
    const phasePicked = candidates.slice(0, needed);

    // Sort tracks within the phase for fluid DJ flow
    const sortedPhase = sortPhaseForFlow(phasePicked, phase.name);

    for (let i = 0; i < sortedPhase.length; i++) {
      const track = sortedPhase[i];
      usedTrackIds.add(track.id);

      const overallIdx = finalSet.length + 1;
      finalSet.push({
        ...track,
        phase: phase.name,
        phaseIndex: i + 1,
        overallIndex: overallIdx
      });
    }
  }

  return finalSet;
}

/**
 * Sorts tracks within a phase to create realistic DJ micro-transitions
 */
function sortPhaseForFlow(tracks: Track[], phaseName: FlowPhaseName): Track[] {
  const list = [...tracks];

  switch (phaseName) {
    case 'Warm-up':
      // Ascending energy (40 -> 60)
      return list.sort((a, b) => (a.energy ?? 0) - (b.energy ?? 0));

    case 'Build-up':
      // Ascending energy (61 -> 80)
      return list.sort((a, b) => (a.energy ?? 0) - (b.energy ?? 0));

    case 'Peak':
      // Smooth curve: rises to highest then holds
      return list.sort((a, b) => (a.energy ?? 0) - (b.energy ?? 0));

    case 'Valley/Respiro':
      // Dip curve: drops to lowest energy mid-phase, then gentle recovery
      const sortedByEnergyAsc = [...list].sort((a, b) => (a.energy ?? 0) - (b.energy ?? 0));
      // Put lowest tracks in the center
      const valleyResult: Track[] = [];
      let left = true;
      for (const t of sortedByEnergyAsc) {
        if (left) {
          valleyResult.push(t);
        } else {
          valleyResult.unshift(t);
        }
        left = !left;
      }
      return valleyResult;

    case 'Climax':
      // Cresting wave: starts high, reaches epic peak (~98-100) around 2/3 mark, finishes massive
      const sortedClimax = [...list].sort((a, b) => (a.energy ?? 0) - (b.energy ?? 0));
      return sortedClimax;

    case 'Outro':
      // Decelerating cool-down (60 -> 40)
      return list.sort((a, b) => (b.energy ?? 0) - (a.energy ?? 0));

    default:
      return list;
  }
}
