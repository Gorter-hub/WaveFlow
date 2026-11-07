import { Track, FlowPhaseConfig, FlowPhaseName, FlowStyleId, FlowStylePreset } from '../types';

export const FLOW_STYLE_PRESETS: Record<FlowStyleId, FlowStylePreset> = {
  classic: {
    id: 'classic',
    name: 'Classic Journey',
    tagline: 'Viaje clásico con subida gradual, respiro y clímax',
    badge: 'Progresivo',
    description: 'La arquitectura estándar de los grandes DJs de club: calentamiento elegante, valle atmosférico y clímax eufórico.',
    phaseWeights: {
      'Warm-up': 20,
      'Build-up': 20,
      'Peak': 10,
      'Valley/Respiro': 14,
      'Climax': 26,
      'Outro': 10
    }
  },
  festival: {
    id: 'festival',
    name: 'Festival Explosivo',
    tagline: 'Pura adrenalina, drops gigantes y máxima energía',
    badge: 'Explosivo',
    description: 'Diseñado para romper la pista: entrada rápida a la energía alta, mínimo descanso y doble clímax masivo.',
    phaseWeights: {
      'Warm-up': 10,
      'Build-up': 18,
      'Peak': 16,
      'Valley/Respiro': 8,
      'Climax': 38,
      'Outro': 10
    },
    energyRanges: {
      'Warm-up': [50, 70],
      'Build-up': [70, 85],
      'Peak': [85, 100],
      'Valley/Respiro': [45, 65],
      'Climax': [88, 100],
      'Outro': [55, 75]
    }
  },
  deep: {
    id: 'deep',
    name: 'Deep & Instrumental',
    tagline: 'Grooves hipnóticos, atmósferas y melodías sutiles',
    badge: 'Introspectivo',
    description: 'Ideal para sets de noche profunda o viaje mental: warm-up prolongado y valle introspectivo sin estridencias.',
    phaseWeights: {
      'Warm-up': 28,
      'Build-up': 22,
      'Peak': 8,
      'Valley/Respiro': 24,
      'Climax': 12,
      'Outro': 6
    },
    energyRanges: {
      'Warm-up': [30, 50],
      'Build-up': [45, 65],
      'Peak': [65, 80],
      'Valley/Respiro': [25, 45],
      'Climax': [60, 80],
      'Outro': [30, 50]
    }
  },
  relentless: {
    id: 'relentless',
    name: 'Fast & Relentless',
    tagline: 'Velocidad constante, aceleración y cero bajones',
    badge: 'Sin Freno',
    description: 'Ritmo rápido y propulsivo sin freno: perfecto para cardio, entrenar o sesiones de club de alta velocidad.',
    phaseWeights: {
      'Warm-up': 10,
      'Build-up': 26,
      'Peak': 20,
      'Valley/Respiro': 6,
      'Climax': 32,
      'Outro': 6
    },
    energyRanges: {
      'Warm-up': [55, 70],
      'Build-up': [70, 85],
      'Peak': [85, 100],
      'Valley/Respiro': [60, 75],
      'Climax': [85, 100],
      'Outro': [50, 70]
    }
  }
};

function getDefaultEnergyRange(phase: FlowPhaseName): [number, number] {
  switch (phase) {
    case 'Warm-up':
      return [40, 60];
    case 'Build-up':
      return [61, 80];
    case 'Peak':
      return [81, 100];
    case 'Valley/Respiro':
      return [30, 50];
    case 'Climax':
      return [81, 100];
    case 'Outro':
      return [40, 60];
  }
}

/**
 * Computes phase configurations dynamically based on style preset and total track count
 */
export function getPhaseConfigsForStyle(
  styleId: FlowStyleId = 'classic',
  totalTracks: number = 50
): FlowPhaseConfig[] {
  const preset = FLOW_STYLE_PRESETS[styleId] || FLOW_STYLE_PRESETS.classic;
  const weights = preset.phaseWeights;
  const phaseNames: FlowPhaseName[] = [
    'Warm-up',
    'Build-up',
    'Peak',
    'Valley/Respiro',
    'Climax',
    'Outro'
  ];

  // Calculate proportional counts
  const counts = phaseNames.map((name) => Math.max(1, Math.round((weights[name] / 100) * totalTracks)));
  const currentSum = counts.reduce((a, b) => a + b, 0);
  const diff = totalTracks - currentSum;
  // Apply difference to Climax (index 4)
  counts[4] = Math.max(1, counts[4] + diff);

  const visualConfig: Record<FlowPhaseName, { color: string; gradient: string; desc: string }> = {
    'Warm-up': {
      color: '#34d399',
      gradient: 'from-emerald-500/25 to-emerald-500/5',
      desc: 'Sets the groove, easy entry into the set'
    },
    'Build-up': {
      color: '#1DB954',
      gradient: 'from-spotify/30 to-spotify/5',
      desc: 'Drives rhythmic tension and accelerates momentum'
    },
    'Peak': {
      color: '#fbbf24',
      gradient: 'from-amber-500/30 to-amber-500/5',
      desc: 'First high-voltage explosive crescendo'
    },
    'Valley/Respiro': {
      color: '#818cf8',
      gradient: 'from-indigo-500/25 to-indigo-500/5',
      desc: 'Atmospheric breakdown & psychological breathing room'
    },
    'Climax': {
      color: '#f43f5e',
      gradient: 'from-rose-500/35 to-rose-500/5',
      desc: 'The ultimate emotional & energetic peak of the night'
    },
    'Outro': {
      color: '#14b8a6',
      gradient: 'from-teal-500/25 to-teal-500/5',
      desc: 'Gentle deceleration, harmonious cooldown'
    }
  };

  let startIndex = 1;
  return phaseNames.map((name, i) => {
    const trackCount = counts[i];
    const energyRange = preset.energyRanges?.[name] || getDefaultEnergyRange(name);
    const cfg: FlowPhaseConfig = {
      name,
      description: visualConfig[name].desc,
      trackCount,
      minEnergy: energyRange[0],
      maxEnergy: energyRange[1],
      color: visualConfig[name].color,
      gradient: visualConfig[name].gradient,
      rangeIndex: [startIndex, startIndex + trackCount - 1]
    };
    startIndex += trackCount;
    return cfg;
  });
}

// Fallback constant for backwards compatibility
export const PHASE_CONFIGS: FlowPhaseConfig[] = getPhaseConfigsForStyle('classic', 50);

/**
 * Arranges tracks into the configurable DJ set curve
 * @param availableTracks Pool of tracks (from 50 to 1500+ tracks)
 * @param targetCount Desired playlist size (e.g. 25, 50, 75, 100)
 * @param styleId Chosen preset style ('classic' | 'festival' | 'deep' | 'relentless')
 */
export function generateDJCurve(
  availableTracks: Track[],
  targetCount: number = 50,
  styleId: FlowStyleId = 'classic'
): Track[] {
  if (!availableTracks || availableTracks.length === 0) {
    return [];
  }

  const effectiveCount = Math.min(targetCount, availableTracks.length);
  const phaseConfigs = getPhaseConfigsForStyle(styleId, effectiveCount);

  // Normalize scores
  const pool: Track[] = availableTracks.map((t) => ({
    ...t,
    energy: typeof t.energy === 'number' && !isNaN(t.energy) ? Math.min(100, Math.max(0, Math.round(t.energy))) : 50,
    valence: typeof t.valence === 'number' && !isNaN(t.valence) ? Math.min(100, Math.max(0, Math.round(t.valence))) : 50
  }));

  const usedTrackIds = new Set<string>();
  const finalSet: Track[] = [];

  for (const phase of phaseConfigs) {
    const needed = phase.trackCount;
    const unusedPool = pool.filter((t) => !usedTrackIds.has(t.id));

    // Candidates in exact range
    let candidates = unusedPool.filter(
      (t) => (t.energy ?? 50) >= phase.minEnergy && (t.energy ?? 50) <= phase.maxEnergy
    );

    // If pool has many tracks (e.g. 1500 songs), diversify artists so one artist doesn't dominate
    if (candidates.length > needed) {
      candidates = pickDiversifiedTracks(candidates, needed);
    }

    // Expand tolerance if not enough
    let tolerance = 5;
    while (candidates.length < needed && tolerance <= 50) {
      const lower = Math.max(0, phase.minEnergy - tolerance);
      const upper = Math.min(100, phase.maxEnergy + tolerance);
      candidates = unusedPool.filter((t) => (t.energy ?? 50) >= lower && (t.energy ?? 50) <= upper);
      tolerance += 5;
    }

    // Ultimate fallback if still short
    if (candidates.length < needed) {
      const targetMid = (phase.minEnergy + phase.maxEnergy) / 2;
      candidates = [...unusedPool].sort(
        (a, b) => Math.abs((a.energy ?? 50) - targetMid) - Math.abs((b.energy ?? 50) - targetMid)
      );
    }

    const phasePicked = candidates.slice(0, needed);
    const sortedPhase = sortPhaseForFlow(phasePicked, phase.name);

    for (let i = 0; i < sortedPhase.length; i++) {
      const track = sortedPhase[i];
      usedTrackIds.add(track.id);

      finalSet.push({
        ...track,
        phase: phase.name,
        phaseIndex: i + 1,
        overallIndex: finalSet.length + 1
      });
    }
  }

  return finalSet;
}

/**
 * When choosing among hundreds of songs, prioritizes artist diversity and natural spread
 */
function pickDiversifiedTracks(candidates: Track[], count: number): Track[] {
  const artistMap = new Map<string, Track[]>();
  for (const t of candidates) {
    const list = artistMap.get(t.artist) || [];
    list.push(t);
    artistMap.set(t.artist, list);
  }

  const selected: Track[] = [];
  const artists = Array.from(artistMap.keys());
  let round = 0;

  while (selected.length < count && artists.length > 0) {
    for (let i = 0; i < artists.length && selected.length < count; i++) {
      const artist = artists[i];
      const tracks = artistMap.get(artist) || [];
      if (tracks.length > round) {
        selected.push(tracks[round]);
      }
    }
    round++;
    if (round > 10) break; // safety
  }

  // If still need more, fill from remaining
  if (selected.length < count) {
    const selectedIds = new Set(selected.map((s) => s.id));
    for (const t of candidates) {
      if (!selectedIds.has(t.id)) {
        selected.push(t);
        if (selected.length === count) break;
      }
    }
  }

  return selected;
}

function sortPhaseForFlow(tracks: Track[], phaseName: FlowPhaseName): Track[] {
  const list = [...tracks];

  switch (phaseName) {
    case 'Warm-up':
      return list.sort((a, b) => (a.energy ?? 0) - (b.energy ?? 0));
    case 'Build-up':
      return list.sort((a, b) => (a.energy ?? 0) - (b.energy ?? 0));
    case 'Peak':
      return list.sort((a, b) => (a.energy ?? 0) - (b.energy ?? 0));
    case 'Valley/Respiro':
      const sortedByEnergyAsc = [...list].sort((a, b) => (a.energy ?? 0) - (b.energy ?? 0));
      const valleyResult: Track[] = [];
      let left = true;
      for (const t of sortedByEnergyAsc) {
        if (left) valleyResult.push(t);
        else valleyResult.unshift(t);
        left = !left;
      }
      return valleyResult;
    case 'Climax':
      return list.sort((a, b) => (a.energy ?? 0) - (b.energy ?? 0));
    case 'Outro':
      return list.sort((a, b) => (b.energy ?? 0) - (a.energy ?? 0));
    default:
      return list;
  }
}
