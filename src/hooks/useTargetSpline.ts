import { useMemo } from 'react';
import {
  CognitiveFlowIntentId,
  IntensityLevel,
  TransitionStyleOption,
  FlowGenerationControls
} from '../types';
import { COGNITIVE_INTENTS } from '../algorithm/curveGenerator';

export interface SplinePoint {
  x: number;
  y: number;
  pct: number; // 0 to 1
  energy: number; // 0 to 100
  timeMins: number;
  timeFormatted: string;
}

export interface SplinePhaseZone {
  name: string;
  description: string;
  startPct: number;
  endPct: number;
  startX: number;
  endX: number;
  color: string;
  gradient: string;
  targetEnergyRange: [number, number];
  phaseType?: string;
}

export interface GhostTrackNode {
  index: number;
  pct: number;
  x: number;
  y: number;
  energy: number;
  timeMins: number;
  timeFormatted: string;
  phaseName: string;
  phaseColor: string;
}

export interface TargetSplineParams {
  intentId: CognitiveFlowIntentId;
  intensity?: IntensityLevel;
  energyOffset?: number; // Explicit offset -15 to +15
  transitionStyle?: TransitionStyleOption;
  durationMins?: number;
  controls?: FlowGenerationControls;
  canvasWidth?: number;
  canvasHeight?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
}

export interface TargetSplineResult {
  pathD: string;
  fillPathD: string;
  points: SplinePoint[];
  phaseZones: SplinePhaseZone[];
  ghostNodes: GhostTrackNode[];
  baselineEnergy: number;
  peakEnergy: number;
  durationMins: number;
  estimatedTracksCount: number;
  chartBounds: {
    width: number;
    height: number;
    plotWidth: number;
    plotHeight: number;
    padding: { top: number; right: number; bottom: number; left: number };
  };
}

function formatMinutes(mins: number): string {
  const m = Math.floor(mins);
  const s = Math.round((mins - m) * 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Catmull-Rom to Cubic Bezier path generator
 */
function generateCubicBezierPath(points: { x: number; y: number }[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
}

/**
 * Hook to compute real-time reactive SVG spline paths, phase ribbons,
 * and ghost track positions for target neuroacoustic trajectories.
 */
export function useTargetSpline({
  intentId,
  intensity = 'balanced',
  energyOffset,
  transitionStyle = 'natural',
  durationMins,
  controls,
  canvasWidth = 1000,
  canvasHeight = 260,
  padding = { top: 32, right: 36, bottom: 42, left: 48 }
}: TargetSplineParams): TargetSplineResult {
  return useMemo(() => {
    const intent = COGNITIVE_INTENTS[intentId] || COGNITIVE_INTENTS.deep_focus;

    // 1. Resolve Duration
    const totalDuration =
      durationMins ||
      controls?.targetDurationMins ||
      intent.default_duration_mins ||
      (intent.duration_target_mins[0] + intent.duration_target_mins[1]) / 2;

    // 2. Resolve Energy Offset (-15 to +15)
    let calculatedOffset = 0;
    if (energyOffset !== undefined) {
      calculatedOffset = energyOffset;
    } else {
      const activeIntensity = controls?.intensity || intensity;
      if (activeIntensity === 'calm') calculatedOffset = -15;
      if (activeIntensity === 'intense' || activeIntensity === 'energetic') calculatedOffset = 15;
    }

    const plotWidth = canvasWidth - padding.left - padding.right;
    const plotHeight = canvasHeight - padding.top - padding.bottom;
    const baselineY = canvasHeight - padding.bottom;

    // 3. Define Phase Zones based on profile
    const phases = intent.phases;
    let accumulatedRatio = 0;
    const phaseZones: SplinePhaseZone[] = phases.map((phase) => {
      const startPct = accumulatedRatio;
      const endPct = accumulatedRatio + phase.duration_ratio;
      accumulatedRatio = endPct;

      const startX = padding.left + startPct * plotWidth;
      const endX = padding.left + endPct * plotWidth;

      return {
        name: phase.name,
        description: phase.description,
        startPct,
        endPct,
        startX,
        endX,
        color: phase.color,
        gradient: phase.gradient,
        targetEnergyRange: phase.target_energy_range,
        phaseType: phase.phaseType
      };
    });

    // 4. Sample Continuous Trajectory Points (e.g. 80 sample intervals)
    const SAMPLE_COUNT = 80;
    const rawPoints: { pct: number; energy: number; timeMins: number }[] = [];

    for (let i = 0; i <= SAMPLE_COUNT; i++) {
      const pct = i / SAMPLE_COUNT;
      const timeMins = pct * totalDuration;
      let energy = 50;

      // Profile-specific neuroacoustic equations
      if (intentId === 'deep_focus') {
        // Flat Alpha baseline (45–60% energy, ±2% variance), terminal decompression dip (-25%) in final 5%
        if (pct < 0.15) {
          // Warmup: 42% -> 52%
          const t = pct / 0.15;
          energy = 42 + 10 * Math.sin((t * Math.PI) / 2);
        } else if (pct < 0.95) {
          // Sustained flow: 52% with subtle harmonic ripple (±1.5%)
          const t = (pct - 0.15) / 0.80;
          energy = 52 + Math.sin(t * Math.PI * 4) * 1.8;
        } else {
          // Terminal decompression: final 5% dips by -25%
          const t = (pct - 0.95) / 0.05;
          energy = 52 - 22 * Math.sin((t * Math.PI) / 2);
        }
      } else if (intentId === 'festival_explosive') {
        // Party/Festival: 15% warmup ramp, sustained 85-100% plateau, 2-track landing (final 8%)
        if (pct < 0.15) {
          const t = pct / 0.15;
          energy = 60 + 28 * Math.sin((t * Math.PI) / 2); // 60 -> 88
        } else if (pct < 0.92) {
          const t = (pct - 0.15) / 0.77;
          // Sustained high plateau with pulsating micro-drops and builds
          energy = 90 + Math.sin(t * Math.PI * 8) * 6;
        } else {
          // 2-track landing
          const t = (pct - 0.92) / 0.08;
          energy = 90 - 25 * Math.sin((t * Math.PI) / 2);
        }
      } else if (intentId === 'night_drive' || intentId === 'roadtrip') {
        // Multi-crest sine waves featuring 15-minute "Reset Valleys" every 45 minutes
        // Total period = 60 minutes (45 min drive crest + 15 min valley)
        const cyclePeriodMins = 60;
        const minuteInCycle = timeMins % cyclePeriodMins;

        if (minuteInCycle < 45) {
          // Driving Crest: dynamic momentum ~65% - 78%
          const t = minuteInCycle / 45;
          energy = 64 + Math.sin(t * Math.PI) * 14;
        } else {
          // 15-minute Reset Valley: drop down to 42% - 48% to reset sensory fatigue
          const t = (minuteInCycle - 45) / 15;
          energy = 78 - 32 * Math.sin(t * Math.PI);
        }
      } else if (intentId === 'mood_shift') {
        // Linear or sigmoidal ramp from baseline valence/energy to target state
        const startE = controls?.moodShiftCurrent === 'tired' || controls?.moodShiftCurrent === 'low' ? 32 : 45;
        const targetE = controls?.moodShiftTarget === 'energized' ? 88 : controls?.moodShiftTarget === 'uplifted' ? 76 : 64;
        // Sigmoidal transition
        const k = 6;
        const sigmoid = 1 / (1 + Math.exp(-k * (pct - 0.5)));
        energy = startE + (targetE - startE) * sigmoid;
      } else if (intentId === 'workout') {
        // Stepped ramp into sustained peak with interval modulations
        if (pct < 0.15) {
          // Warmup 45 -> 72
          energy = 45 + 27 * (pct / 0.15);
        } else if (pct < 0.85) {
          // HIIT Intervals: alternating bursts (94%) and active rests (72%)
          const intervalCycle = Math.sin(pct * Math.PI * 12);
          energy = 82 + intervalCycle * 13;
        } else {
          // Cooldown
          const t = (pct - 0.85) / 0.15;
          energy = 80 - 40 * Math.sin((t * Math.PI) / 2);
        }
      } else {
        // Generic multi-phase interpolation from intent phases
        let localAccum = 0;
        let matched = false;
        for (let p = 0; p < phases.length; p++) {
          const ph = phases[p];
          const nextAccum = localAccum + ph.duration_ratio;
          if (pct <= nextAccum || p === phases.length - 1) {
            const t = Math.min(1, Math.max(0, (pct - localAccum) / Math.max(0.01, ph.duration_ratio)));
            const [minE, maxE] = ph.target_energy_range;
            // Smooth cosine interpolation between min and max
            energy = minE + (maxE - minE) * (0.5 - 0.5 * Math.cos(t * Math.PI));
            matched = true;
            break;
          }
          localAccum = nextAccum;
        }
        if (!matched) energy = 50;
      }

      // 5. Apply Energy Offset
      energy += calculatedOffset;

      // 6. Transition Style Modulation
      const style = controls?.transitionStyle || transitionStyle;
      if (style === 'dynamic' || style === 'adventurous') {
        // Add subtle harmonic ripple (±5%)
        energy += Math.sin(pct * Math.PI * 14) * 4.5;
      } else if (style === 'smooth' || style === 'seamless') {
        // Ultra-low variance: compress micro-swings
        energy = 50 + (energy - 50) * 0.88;
      }

      // Clamp between 8% and 98%
      energy = Math.max(8, Math.min(98, energy));

      rawPoints.push({ pct, energy, timeMins });
    }

    // 7. Map to Chart Coordinates
    const points: SplinePoint[] = rawPoints.map((p) => {
      const x = padding.left + p.pct * plotWidth;
      const y = padding.top + (1 - p.energy / 100) * plotHeight;
      return {
        x,
        y,
        pct: p.pct,
        energy: Math.round(p.energy),
        timeMins: p.timeMins,
        timeFormatted: formatMinutes(p.timeMins)
      };
    });

    // 8. Generate Bezier Spline SVG Path and Closed Gradient Fill
    const pathD = generateCubicBezierPath(points);
    const firstX = points[0].x.toFixed(2);
    const lastX = points[points.length - 1].x.toFixed(2);
    const fillPathD = `${pathD} L ${lastX} ${baselineY.toFixed(2)} L ${firstX} ${baselineY.toFixed(2)} Z`;

    // 9. Generate Ghost Placeholder Nodes (Estimated tracks distribution)
    const estimatedTracksCount = Math.max(8, Math.min(48, Math.round(totalDuration / 3.5)));
    const ghostNodes: GhostTrackNode[] = [];

    for (let k = 0; k < estimatedTracksCount; k++) {
      const pct = (k + 0.5) / estimatedTracksCount;
      const sampleIdx = Math.min(
        points.length - 1,
        Math.max(0, Math.round(pct * (points.length - 1)))
      );
      const sampled = points[sampleIdx];

      // Match phase
      const phase = phaseZones.find((z) => pct >= z.startPct && pct <= z.endPct) || phaseZones[0];

      ghostNodes.push({
        index: k + 1,
        pct,
        x: sampled.x,
        y: sampled.y,
        energy: sampled.energy,
        timeMins: pct * totalDuration,
        timeFormatted: formatMinutes(pct * totalDuration),
        phaseName: phase.name,
        phaseColor: phase.color
      });
    }

    const energies = points.map((p) => p.energy);
    const baselineEnergy = Math.min(...energies);
    const peakEnergy = Math.max(...energies);

    return {
      pathD,
      fillPathD,
      points,
      phaseZones,
      ghostNodes,
      baselineEnergy,
      peakEnergy,
      durationMins: totalDuration,
      estimatedTracksCount,
      chartBounds: {
        width: canvasWidth,
        height: canvasHeight,
        plotWidth,
        plotHeight,
        padding
      }
    };
  }, [
    intentId,
    intensity,
    energyOffset,
    transitionStyle,
    durationMins,
    controls,
    canvasWidth,
    canvasHeight,
    padding
  ]);
}
