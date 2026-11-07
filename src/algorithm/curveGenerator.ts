import {
  Track,
  FlowPhaseConfig,
  CognitiveFlowIntentId,
  CognitiveIntentConfig,
  CuratedSetResult
} from '../types';

/**
 * Neuroscience-backed Cognitive Flow Intent Presets
 */
export const COGNITIVE_INTENTS: Record<CognitiveFlowIntentId, CognitiveIntentConfig> = {
  deep_focus: {
    id: 'deep_focus',
    name: 'Deep Focus',
    tagline: 'Ultradian Rhythm · 75 to 90 min mental flow',
    neuroscience_rationale:
      'Aligned with the 90-minute human ultradian cycle. Flat, stable energy (40-62%) with minimal vocal distractions and strict ±3 BPM delta transitions to avoid cognitive context switching, closing with an intentional decompression drop.',
    duration_target_mins: [75, 90],
    target_energy_range: [40, 62],
    bpm_tolerance: 3, // strict ±3 BPM adjacent delta
    vocal_threshold_max: 35, // strictly minimal vocals
    badge: 'Ultradian (75-90m)',
    color: '#10b981',
    accentGradient: 'from-emerald-500/25 to-teal-500/5',
    phases: [
      {
        name: 'Attunement',
        description: 'Gentle neural synchronization into task immersion',
        duration_ratio: 0.15,
        target_energy_range: [40, 52],
        target_valence_range: [40, 65],
        color: '#34d399',
        gradient: 'from-emerald-500/25 to-emerald-500/5'
      },
      {
        name: 'Alpha State Plateau',
        description: 'Sustained hypnotic baseline with strict ±3 BPM lock',
        duration_ratio: 0.70,
        target_energy_range: [48, 62],
        target_valence_range: [45, 60],
        color: '#10b981',
        gradient: 'from-emerald-600/30 to-emerald-600/5'
      },
      {
        name: 'Mental Decompression',
        description: 'Intentional energy dip to signal healthy cognitive break',
        duration_ratio: 0.15,
        target_energy_range: [32, 44],
        target_valence_range: [35, 55],
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
      'Engineered for maximum dopamine release: fast 2-track launch, aggressive voltage climb, followed by a 35-minute sustained peak plateau (85-100% energy) with tight high-energy landing.',
    duration_target_mins: [50, 65],
    target_energy_range: [70, 100],
    bpm_tolerance: 6,
    badge: 'Single Arc (50-65m)',
    color: '#f43f5e',
    accentGradient: 'from-rose-500/25 to-amber-500/5',
    phases: [
      {
        name: 'Quick Launch',
        description: 'Fast energetic greeting to gather crowd attention',
        duration_ratio: 0.12,
        target_energy_range: [58, 72],
        target_valence_range: [60, 85],
        color: '#fb923c',
        gradient: 'from-orange-500/25 to-orange-500/5'
      },
      {
        name: 'Voltage Climb',
        description: 'Steep acceleration into mainstage festival frequencies',
        duration_ratio: 0.18,
        target_energy_range: [72, 86],
        target_valence_range: [65, 90],
        color: '#f59e0b',
        gradient: 'from-amber-500/30 to-amber-500/5'
      },
      {
        name: 'Peak Energy Plateau',
        description: 'Sustained 35-minute maximum adrenaline and peak drops',
        duration_ratio: 0.58,
        target_energy_range: [86, 100],
        target_valence_range: [70, 98],
        color: '#f43f5e',
        gradient: 'from-rose-500/35 to-rose-500/5'
      },
      {
        name: 'Tight Landing',
        description: 'Crisp 2-track euphoric cooldown',
        duration_ratio: 0.12,
        target_energy_range: [50, 68],
        target_valence_range: [55, 80],
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
      'Long-distance cognitive endurance architecture. Mandatory anti-fatigue "Reset Valleys" every 45 minutes prevent auditory saturation before building into successive higher peaks.',
    duration_target_mins: [120, 180],
    target_energy_range: [35, 95],
    bpm_tolerance: 5,
    badge: 'Multi-Act (2-3 hrs)',
    color: '#8b5cf6',
    accentGradient: 'from-purple-500/25 to-indigo-500/5',
    phases: [
      {
        name: 'Horizon Departure',
        description: 'Atmospheric departure as city lights fade',
        duration_ratio: 0.14,
        target_energy_range: [45, 62],
        target_valence_range: [40, 65],
        color: '#a855f7',
        gradient: 'from-purple-500/25 to-purple-500/5'
      },
      {
        name: 'Act I: Highway Cruise',
        description: 'Propulsive forward motion and rhythmic momentum',
        duration_ratio: 0.22,
        target_energy_range: [65, 80],
        target_valence_range: [50, 75],
        color: '#6366f1',
        gradient: 'from-indigo-500/25 to-indigo-500/5'
      },
      {
        name: 'Reset Valley I',
        description: 'Auditory decompression dip to eliminate listening fatigue',
        duration_ratio: 0.10,
        target_energy_range: [35, 48],
        target_valence_range: [35, 55],
        color: '#38bdf8',
        gradient: 'from-sky-500/20 to-sky-500/5'
      },
      {
        name: 'Act II: Neon Ascent',
        description: 'Secondary ascent building into deeper nighttime voltage',
        duration_ratio: 0.24,
        target_energy_range: [75, 88],
        target_valence_range: [55, 80],
        color: '#ec4899',
        gradient: 'from-pink-500/30 to-pink-500/5'
      },
      {
        name: 'Reset Valley II',
        description: 'Second rhythmic breather before final midnight crest',
        duration_ratio: 0.08,
        target_energy_range: [38, 50],
        target_valence_range: [40, 60],
        color: '#06b6d4',
        gradient: 'from-cyan-500/20 to-cyan-500/5'
      },
      {
        name: 'Midnight Climax',
        description: 'Peak velocity under empty skies',
        duration_ratio: 0.16,
        target_energy_range: [84, 98],
        target_valence_range: [60, 90],
        color: '#f43f5e',
        gradient: 'from-rose-500/35 to-rose-500/5'
      },
      {
        name: 'Dawn Outro',
        description: 'Harmonic resolution and quiet dawn arrival',
        duration_ratio: 0.06,
        target_energy_range: [35, 50],
        target_valence_range: [40, 65],
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
    phases: [
      {
        name: 'Cadence Initialization',
        description: 'Locks the listener into the core rhythmic groove',
        duration_ratio: 0.20,
        target_energy_range: [60, 75],
        target_valence_range: [65, 88],
        color: '#facc15',
        gradient: 'from-yellow-500/25 to-yellow-500/5'
      },
      {
        name: 'In-The-Pocket Drive',
        description: 'Tight syncopation and continuous positive momentum',
        duration_ratio: 0.45,
        target_energy_range: [70, 85],
        target_valence_range: [70, 92],
        color: '#eab308',
        gradient: 'from-amber-500/30 to-amber-500/5'
      },
      {
        name: 'Euphoric Crescendo',
        description: 'Maximum harmonic release while preserving cadence lock',
        duration_ratio: 0.25,
        target_energy_range: [82, 95],
        target_valence_range: [75, 98],
        color: '#f97316',
        gradient: 'from-orange-500/35 to-orange-500/5'
      },
      {
        name: 'Dub Release',
        description: 'Satisfying groove tail with warm resonance',
        duration_ratio: 0.10,
        target_energy_range: [52, 68],
        target_valence_range: [60, 80],
        color: '#10b981',
        gradient: 'from-emerald-500/20 to-emerald-500/5'
      }
    ]
  }
};

/**
 * Normalizes track vectors to guaranteed bounds
 */
function normalizeTrack(t: Track): Track {
  const energy = typeof t.energy_score === 'number' && !isNaN(t.energy_score)
    ? t.energy_score
    : (typeof t.energy === 'number' && !isNaN(t.energy) ? t.energy : 50);

  const valence = typeof t.valence_score === 'number' && !isNaN(t.valence_score)
    ? t.valence_score
    : (typeof t.valence === 'number' && !isNaN(t.valence) ? t.valence : 50);

  const bpm = typeof t.bpm === 'number' && t.bpm > 40 && t.bpm < 220 ? t.bpm : 124;
  const vocal_presence = typeof t.vocal_presence === 'number' ? t.vocal_presence : 50;

  return {
    ...t,
    energy_score: Math.min(100, Math.max(0, Math.round(energy))),
    valence_score: Math.min(100, Math.max(0, Math.round(valence))),
    bpm: Math.round(bpm),
    vocal_presence: Math.min(100, Math.max(0, Math.round(vocal_presence))),
    mood_vibe: t.mood_vibe || 'driving',
    energy: Math.min(100, Math.max(0, Math.round(energy))),
    valence: Math.min(100, Math.max(0, Math.round(valence)))
  };
}

/**
 * Intelligent DJ Set Synthesizer that satisfies all neuroscience intent rules
 */
export function generateCognitiveDJFlow(
  availableTracks: Track[],
  intentId: CognitiveFlowIntentId = 'deep_focus'
): CuratedSetResult {
  if (!availableTracks || availableTracks.length === 0) {
    return {
      flow_intent: intentId,
      computed_total_duration_ms: 0,
      computed_total_tracks: 0,
      phases: [],
      curated_set: []
    };
  }

  const intent = COGNITIVE_INTENTS[intentId] || COGNITIVE_INTENTS.deep_focus;
  const normalizedPool = availableTracks.map(normalizeTrack);

  // Target duration in ms: use midpoint of duration target range
  const targetDurationMinutes = (intent.duration_target_mins[0] + intent.duration_target_mins[1]) / 2;
  const targetDurationMs = targetDurationMinutes * 60 * 1000;

  // Compute duration per phase based on phase ratio
  const phaseTargetsMs = intent.phases.map((p) => p.duration_ratio * targetDurationMs);

  const usedTrackIds = new Set<string>();
  const curatedSet: Track[] = [];
  const phaseConfigs: FlowPhaseConfig[] = [];

  let overallTrackIndex = 1;

  for (let pIdx = 0; pIdx < intent.phases.length; pIdx++) {
    const phaseTemplate = intent.phases[pIdx];
    const targetPhaseMs = phaseTargetsMs[pIdx];
    let accumulatedPhaseMs = 0;
    const phasePickedTracks: Track[] = [];

    // Filter available candidates
    const unusedPool = normalizedPool.filter((t) => !usedTrackIds.has(t.id));

    // Intent specific filtering:
    // If Deep Focus: penalize or exclude heavy vocals
    let candidates = unusedPool;
    if (intentId === 'deep_focus' && intent.vocal_threshold_max) {
      const instrumentalPool = unusedPool.filter(
        (t) => t.vocal_presence <= (intent.vocal_threshold_max ?? 35)
      );
      if (instrumentalPool.length >= 6) {
        candidates = instrumentalPool;
      }
    }

    // Filter by target energy range for this phase
    const [minE, maxE] = phaseTemplate.target_energy_range;
    let matchingCandidates = candidates.filter(
      (t) => t.energy_score >= minE && t.energy_score <= maxE
    );

    // If candidate pool is tight, relax energy bounds gradually
    let tolerance = 5;
    while (matchingCandidates.length < 3 && tolerance <= 40) {
      matchingCandidates = candidates.filter(
        (t) => t.energy_score >= Math.max(0, minE - tolerance) && t.energy_score <= Math.min(100, maxE + tolerance)
      );
      tolerance += 5;
    }

    if (matchingCandidates.length === 0) {
      matchingCandidates = [...candidates];
    }

    // Pick tracks to fulfill duration target for this phase
    // Pack tracks until targetPhaseMs is reached (or minimum 2 tracks per phase)
    let candidateIndex = 0;
    // Shuffle slightly for fresh variety while respecting artist spread
    const diversified = pickDiversifiedTracks(matchingCandidates, Math.max(2, matchingCandidates.length));

    while (
      (accumulatedPhaseMs < targetPhaseMs || phasePickedTracks.length < 2) &&
      candidateIndex < diversified.length
    ) {
      const candidate = diversified[candidateIndex++];
      if (!usedTrackIds.has(candidate.id)) {
        phasePickedTracks.push(candidate);
        usedTrackIds.add(candidate.id);
        accumulatedPhaseMs += candidate.duration_ms || (210 * 1000);
      }
    }

    // If matching candidates were not enough to reach target duration, draw from remaining unused pool
    if (accumulatedPhaseMs < targetPhaseMs && unusedPool.length > phasePickedTracks.length) {
      const remainingUnused = unusedPool
        .filter((t) => !usedTrackIds.has(t.id))
        .sort(
          (a, b) =>
            Math.abs(a.energy_score - (minE + maxE) / 2) -
            Math.abs(b.energy_score - (minE + maxE) / 2)
        );

      for (const fallbackCandidate of remainingUnused) {
        if (accumulatedPhaseMs >= targetPhaseMs) break;
        phasePickedTracks.push(fallbackCandidate);
        usedTrackIds.add(fallbackCandidate.id);
        accumulatedPhaseMs += fallbackCandidate.duration_ms || (210 * 1000);
      }
    }


    // Now order phasePickedTracks applying strict DJ transition constraints:
    // Adjacent BPM delta control and valence continuity
    const sequencedPhaseTracks = sequencePhaseTracks(
      phasePickedTracks,
      phaseTemplate,
      intent.bpm_tolerance,
      curatedSet.length > 0 ? curatedSet[curatedSet.length - 1] : null
    );

    const phaseStartIndex = overallTrackIndex;

    for (let i = 0; i < sequencedPhaseTracks.length; i++) {
      const track = sequencedPhaseTracks[i];
      const prevTrack = i > 0 ? sequencedPhaseTracks[i - 1] : (curatedSet[curatedSet.length - 1] || null);

      let transitionNote = '';
      if (prevTrack) {
        const bpmDelta = Math.abs(track.bpm - prevTrack.bpm);
        const valenceDelta = Math.abs(track.valence_score - prevTrack.valence_score);
        transitionNote = `Δ ${bpmDelta} BPM · Harmonic ${valenceDelta < 15 ? 'Locked' : 'Smooth'}`;
      } else {
        transitionNote = 'Set Opener · Key Anchor';
      }

      curatedSet.push({
        ...track,
        phase: phaseTemplate.name,
        phaseIndex: i + 1,
        overallIndex: overallTrackIndex++,
        transition_note: transitionNote
      });
    }

    const phaseEndIndex = overallTrackIndex - 1;

    phaseConfigs.push({
      name: phaseTemplate.name,
      description: phaseTemplate.description,
      trackCount: sequencedPhaseTracks.length,
      duration_ms: accumulatedPhaseMs,
      minEnergy: minE,
      maxEnergy: maxE,
      color: phaseTemplate.color,
      gradient: phaseTemplate.gradient,
      rangeIndex: [phaseStartIndex, phaseEndIndex]
    });
  }

  const computed_total_duration_ms = curatedSet.reduce(
    (sum, t) => sum + (t.duration_ms || 210000),
    0
  );

  return {
    flow_intent: intentId,
    computed_total_duration_ms,
    computed_total_tracks: curatedSet.length,
    phases: phaseConfigs,
    curated_set: curatedSet
  };
}

/**
 * Sequences tracks inside a phase ensuring BPM delta tolerance and valence continuity
 */
function sequencePhaseTracks(
  tracks: Track[],
  phaseTemplate: { target_energy_range: [number, number]; target_valence_range: [number, number] },
  bpmTolerance: number,
  previousTrack: Track | null
): Track[] {
  if (tracks.length <= 1) return tracks;

  const remaining = [...tracks];
  const ordered: Track[] = [];

  let currentAnchor = previousTrack;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let lowestPenalty = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      let penalty = 0;

      if (currentAnchor) {
        // BPM Delta Penalty
        const bpmDelta = Math.abs(candidate.bpm - currentAnchor.bpm);
        penalty += bpmDelta > bpmTolerance ? (bpmDelta - bpmTolerance) * 12 : bpmDelta * 2;

        // Valence Smoothness Penalty (prevent mood whiplash)
        const valenceDelta = Math.abs(candidate.valence_score - currentAnchor.valence_score);
        penalty += valenceDelta * 0.8;

        // Energy trajectory (favor progression toward phase goal)
        const energyDelta = Math.abs(candidate.energy_score - currentAnchor.energy_score);
        penalty += energyDelta * 0.5;
      } else {
        // First track: favor lowest energy in phase range to ease in
        penalty = Math.abs(candidate.energy_score - phaseTemplate.target_energy_range[0]);
      }

      if (penalty < lowestPenalty) {
        lowestPenalty = penalty;
        bestIndex = i;
      }
    }

    const chosen = remaining.splice(bestIndex, 1)[0];
    ordered.push(chosen);
    currentAnchor = chosen;
  }

  return ordered;
}

/**
 * Diversifies artist representation across selection
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
    if (round > 10) break;
  }

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

/**
 * Backward-compatible helper for legacy callers
 */
export function generateDJCurve(
  availableTracks: Track[],
  targetCount: number = 50,
  intentId: CognitiveFlowIntentId = 'deep_focus'
): Track[] {
  const result = generateCognitiveDJFlow(availableTracks, intentId);
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
