import React, { useState } from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { useTargetSpline, GhostTrackNode } from '../hooks/useTargetSpline';
import { COGNITIVE_INTENTS } from '../algorithm/curveGenerator';
import { getCamelotBadgeStyle } from '../algorithm/camelot';
import {
  Activity,
  Sparkles,
  Clock,
  Layers,
  Zap,
  Music,
  Play,
  RotateCw,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Track } from '../types';

interface LiveWaveformPreviewProps {
  onSwapTrack?: (track: Track) => void;
}

export const LiveWaveformPreview: React.FC<LiveWaveformPreviewProps> = ({ onSwapTrack }) => {
  const {
    flowIntent,
    flowControls,
    flowTracks,
    activeTrack,
    setActiveTrack,
    status
  } = useWaveFlowStore();

  const [hoveredGhost, setHoveredGhost] = useState<GhostTrackNode | null>(null);
  const [hoveredResolvedTrack, setHoveredResolvedTrack] = useState<{
    track: Track;
    x: number;
    y: number;
    timeFormatted: string;
    index: number;
  } | null>(null);

  const activeIntentConfig = COGNITIVE_INTENTS[flowIntent] || COGNITIVE_INTENTS.deep_focus;

  // Real-time reactive spline calculation
  const spline = useTargetSpline({
    intentId: flowIntent,
    controls: flowControls,
    canvasWidth: 1000,
    canvasHeight: 250,
    padding: { top: 32, right: 36, bottom: 42, left: 52 }
  });

  const hasGeneratedTracks = flowTracks.length > 0;
  const isGenerating =
    status.step === 'fetching' ||
    status.step === 'analyzing' ||
    status.step === 'sorting';

  const bounds = spline.chartBounds;

  // Calculate resolved tracks coordinates along the spline for live overlay
  const totalTrackDurationMs = flowTracks.reduce((acc, t) => acc + (t.duration_ms || 210000), 0);
  let cumulativeMs = 0;

  const resolvedTrackNodes = flowTracks.map((track, idx) => {
    const trackMidpointMs = cumulativeMs + (track.duration_ms || 210000) / 2;
    cumulativeMs += track.duration_ms || 210000;
    const progress = totalTrackDurationMs > 0 ? trackMidpointMs / totalTrackDurationMs : idx / flowTracks.length;

    const x = bounds.padding.left + progress * bounds.plotWidth;
    const energy = track.energy_score ?? track.energy ?? 50;
    const y = bounds.padding.top + (1 - energy / 100) * bounds.plotHeight;

    const totalSeconds = Math.round(trackMidpointMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const timeFormatted = `${m}:${s < 10 ? '0' : ''}${s}`;

    return {
      track,
      x,
      y,
      energy,
      progress,
      timeFormatted,
      index: idx + 1
    };
  });

  // Calculate resolved actual path if tracks exist
  let resolvedPathD = '';
  if (resolvedTrackNodes.length > 1) {
    resolvedPathD = `M ${resolvedTrackNodes[0].x.toFixed(2)} ${resolvedTrackNodes[0].y.toFixed(2)}`;
    for (let i = 0; i < resolvedTrackNodes.length - 1; i++) {
      const p1 = resolvedTrackNodes[i];
      const p2 = resolvedTrackNodes[i + 1];
      const mx = (p1.x + p2.x) / 2;
      resolvedPathD += ` C ${mx.toFixed(2)} ${p1.y.toFixed(2)}, ${mx.toFixed(2)} ${p2.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
  }

  // Energy label markers for Y-axis
  const yMarkers = [
    { label: 'Peak (100%)', energy: 100 },
    { label: 'High (75%)', energy: 75 },
    { label: 'Mid (50%)', energy: 50 },
    { label: 'Low (25%)', energy: 25 }
  ];

  // Duration label markers for X-axis
  const xMarkers = [
    { pct: 0, label: '0:00' },
    { pct: 0.25, label: `${Math.round(spline.durationMins * 0.25)}m` },
    { pct: 0.5, label: `${Math.round(spline.durationMins * 0.5)}m` },
    { pct: 0.75, label: `${Math.round(spline.durationMins * 0.75)}m` },
    { pct: 1.0, label: `${spline.durationMins}m` }
  ];

  return (
    <div className="relative rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-2xl p-5 md:p-6 backdrop-blur-xl transition-all duration-300 group">
      {/* Dynamic Background Glow */}
      <div
        className="absolute -top-10 -left-10 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: activeIntentConfig.color }}
      />

      {/* Top Header Information Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800/70 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-inner transition-colors"
            style={{
              backgroundColor: `${activeIntentConfig.color}20`,
              borderColor: `${activeIntentConfig.color}40`,
              color: activeIntentConfig.color
            }}
          >
            <Activity className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-400">
                {hasGeneratedTracks ? 'Resolved Flow vs. Target Spline' : 'Target Waveform Simulation'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                {activeIntentConfig.name}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Live reactive Bezier spline reflecting intention, duration, intensity, and transition dynamics.
            </p>
          </div>
        </div>

        {/* Live Metrics Badges */}
        <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Clock className="w-3 h-3 text-spotify" />
            <span>{spline.durationMins} min target</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Music className="w-3 h-3 text-cyan-400" />
            <span>
              {hasGeneratedTracks
                ? `${flowTracks.length} tracks generated`
                : `~${spline.estimatedTracksCount} tracks`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>
              {spline.baselineEnergy}% → {spline.peakEnergy}% E
            </span>
          </div>

          <div className="px-2 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[10px] text-zinc-400 uppercase font-semibold">
            {flowControls.transitionStyle || 'natural'}
          </div>
        </div>
      </div>

      {/* Main SVG Interactive Waveform Canvas */}
      <div className="relative w-full overflow-hidden rounded-xl bg-zinc-950/90 border border-zinc-900 shadow-inner">
        <svg
          viewBox={`0 0 ${bounds.width} ${bounds.height}`}
          className="w-full h-auto select-none overflow-visible"
        >
          <defs>
            {/* Ambient Vertical Fill Gradient */}
            <linearGradient id="waveFillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeIntentConfig.color} stopOpacity="0.32" />
              <stop offset="60%" stopColor={activeIntentConfig.color} stopOpacity="0.08" />
              <stop offset="100%" stopColor="#09090b" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing Spline Stroke Gradient */}
            <linearGradient id="waveLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={activeIntentConfig.color} />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="splineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Background Phase Ribbons & Dividers */}
          {spline.phaseZones.map((phase, idx) => {
            const ribbonWidth = phase.endX - phase.startX;
            return (
              <g key={`ribbon-${idx}`}>
                <rect
                  x={phase.startX}
                  y={bounds.padding.top}
                  width={ribbonWidth}
                  height={bounds.plotHeight}
                  fill={phase.color}
                  fillOpacity={idx % 2 === 0 ? '0.04' : '0.07'}
                />

                {/* Vertical Phase Boundary Line */}
                {idx > 0 && (
                  <line
                    x1={phase.startX}
                    y1={bounds.padding.top}
                    x2={phase.startX}
                    y2={bounds.height - bounds.padding.bottom}
                    stroke="#27272a"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Phase Tag Pill inside SVG */}
                <g transform={`translate(${phase.startX + 8}, ${bounds.padding.top + 14})`}>
                  <rect
                    x="0"
                    y="0"
                    width={Math.min(ribbonWidth - 16, phase.name.length * 6.5 + 16)}
                    height="18"
                    rx="9"
                    fill="#18181b"
                    fillOpacity="0.8"
                    stroke={phase.color}
                    strokeOpacity="0.4"
                  />
                  <text
                    x="8"
                    y="12"
                    fill="#a1a1aa"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {phase.name}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 2. Horizontal Energy Grid Lines & Labels */}
          {yMarkers.map((marker) => {
            const y = bounds.padding.top + (1 - marker.energy / 100) * bounds.plotHeight;
            return (
              <g key={`y-${marker.energy}`}>
                <line
                  x1={bounds.padding.left}
                  y1={y}
                  x2={bounds.width - bounds.padding.right}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                <text
                  x={bounds.padding.left - 8}
                  y={y + 3.5}
                  fill="#71717a"
                  fontSize="9.5"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {marker.label}
                </text>
              </g>
            );
          })}

          {/* 3. X-Axis Time Progression Markers */}
          {xMarkers.map((marker, idx) => {
            const x = bounds.padding.left + marker.pct * bounds.plotWidth;
            return (
              <g key={`x-${idx}`}>
                <line
                  x1={x}
                  y1={bounds.height - bounds.padding.bottom}
                  x2={x}
                  y2={bounds.height - bounds.padding.bottom + 5}
                  stroke="#3f3f46"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={bounds.height - bounds.padding.bottom + 18}
                  fill="#71717a"
                  fontSize="10"
                  textAnchor={idx === 0 ? 'start' : idx === xMarkers.length - 1 ? 'end' : 'middle'}
                  fontFamily="monospace"
                >
                  {marker.label}
                </text>
              </g>
            );
          })}

          {/* 4. Closed Ambient Area Under Target Spline */}
          <path d={spline.fillPathD} fill="url(#waveFillGrad)" />

          {/* 5. Target Spline Main Stroke (Glowing Bezier Path) */}
          <path
            d={spline.pathD}
            fill="none"
            stroke="url(#waveLineGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#splineGlow)"
            className="transition-all duration-300"
          />

          {/* 6. Ghost Placeholder Nodes (Pre-generation) */}
          {!hasGeneratedTracks &&
            spline.ghostNodes.map((node) => {
              const isHovered = hoveredGhost?.index === node.index;
              return (
                <g
                  key={`ghost-${node.index}`}
                  className="cursor-pointer transition-transform"
                  onMouseEnter={() => setHoveredGhost(node)}
                  onMouseLeave={() => setHoveredGhost(null)}
                >
                  {/* Outer pulsating ring */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isHovered ? 8 : 4.5}
                    fill={node.phaseColor}
                    fillOpacity={isHovered ? '0.4' : '0.2'}
                    className="transition-all duration-150"
                  />
                  {/* Core node dot */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isHovered ? 4.5 : 2.5}
                    fill={isHovered ? '#ffffff' : node.phaseColor}
                    stroke="#09090b"
                    strokeWidth="1.5"
                    className="transition-all duration-150"
                  />
                </g>
              );
            })}

          {/* 7. Actual Resolved Flow Track Nodes & Trajectory Overlay (Post-generation) */}
          {hasGeneratedTracks && (
            <>
              {/* Resolved connecting curve */}
              {resolvedPathD && (
                <path
                  d={resolvedPathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.2"
                  strokeDasharray="6 3"
                  className="opacity-75"
                />
              )}

              {/* Resolved Track Nodes */}
              {resolvedTrackNodes.map((node) => {
                const isActive = activeTrack?.id === node.track.id;
                const isHovered = hoveredResolvedTrack?.track.id === node.track.id;
                const camelotBadge = getCamelotBadgeStyle(node.track.camelot_key);

                return (
                  <g
                    key={`resolved-${node.track.id}`}
                    className="cursor-pointer"
                    onClick={() => setActiveTrack(node.track)}
                    onMouseEnter={() =>
                      setHoveredResolvedTrack({
                        track: node.track,
                        x: node.x,
                        y: node.y,
                        timeFormatted: node.timeFormatted,
                        index: node.index
                      })
                    }
                    onMouseLeave={() => setHoveredResolvedTrack(null)}
                  >
                    {/* Active playing indicator aura */}
                    {isActive && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="12"
                        fill="#10b981"
                        fillOpacity="0.3"
                        className="animate-ping"
                      />
                    )}

                    {/* Outer node glow */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isHovered || isActive ? 7 : 5}
                      fill={camelotBadge.accent || '#10b981'}
                      fillOpacity={isHovered || isActive ? '0.9' : '0.6'}
                      stroke="#09090b"
                      strokeWidth="2"
                      className="transition-all duration-150"
                    />

                    {/* Inner core */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isHovered || isActive ? 3 : 2}
                      fill="#ffffff"
                    />
                  </g>
                );
              })}
            </>
          )}
        </svg>

        {/* Hover Tooltip Overlay for Ghost Node */}
        {hoveredGhost && !hasGeneratedTracks && (
          <div
            className="absolute pointer-events-none z-30 transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl bg-zinc-900/95 border border-zinc-700/80 shadow-2xl backdrop-blur-md text-xs text-white"
            style={{
              left: `${(hoveredGhost.x / bounds.width) * 100}%`,
              top: `${(hoveredGhost.y / bounds.height) * 100}%`
            }}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredGhost.phaseColor }} />
              <span>Track #{hoveredGhost.index} Estimation</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5 space-y-0.5">
              <div>Time: ~{hoveredGhost.timeFormatted} min</div>
              <div>Target Energy: {hoveredGhost.energy}%</div>
              <div>Phase: {hoveredGhost.phaseName}</div>
            </div>
          </div>
        )}

        {/* Hover Tooltip Overlay for Resolved Track */}
        {hoveredResolvedTrack && hasGeneratedTracks && (
          <div
            className="absolute pointer-events-none z-30 transform -translate-x-1/2 -translate-y-full mb-3 px-3.5 py-2.5 rounded-xl bg-zinc-900/95 border border-emerald-500/40 shadow-2xl backdrop-blur-md text-xs text-white min-w-[200px]"
            style={{
              left: `${(hoveredResolvedTrack.x / bounds.width) * 100}%`,
              top: `${(hoveredResolvedTrack.y / bounds.height) * 100}%`
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-emerald-400">
                #{hoveredResolvedTrack.index} · {hoveredResolvedTrack.timeFormatted}
              </span>
              {hoveredResolvedTrack.track.camelot_key && (() => {
                const badge = getCamelotBadgeStyle(hoveredResolvedTrack.track.camelot_key);
                return (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {hoveredResolvedTrack.track.camelot_key}
                  </span>
                );
              })()}
            </div>
            <div className="font-semibold text-white truncate max-w-[190px] mt-1">
              {hoveredResolvedTrack.track.name}
            </div>
            <div className="text-[11px] text-zinc-400 truncate max-w-[190px]">
              {hoveredResolvedTrack.track.artist}
            </div>
            <div className="flex items-center gap-3 text-[10.5px] font-mono text-zinc-400 mt-1.5 pt-1 border-t border-zinc-800">
              <span>Energy: {hoveredResolvedTrack.track.energy_score}%</span>
              <span>BPM: {Math.round(hoveredResolvedTrack.track.bpm || 124)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Trajectory Phases Flow Summary & Rationale */}
      <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Phases:</span>
          {spline.phaseZones.map((phase, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: phase.color }} />
              <span className="text-zinc-300 font-medium">{phase.name}</span>
              <span className="text-zinc-500 font-mono text-[10.5px]">
                ({Math.round((phase.endPct - phase.startPct) * 100)}%)
              </span>
              {idx < spline.phaseZones.length - 1 && <span className="text-zinc-700">→</span>}
            </div>
          ))}
        </div>

        <div className="text-[11px] text-zinc-500 italic flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>
            {hasGeneratedTracks
              ? 'Green dashed line shows actual curated track distribution matched to the curve.'
              : 'Ghost nodes indicate projected track placement across time & acoustic energy.'}
          </span>
        </div>
      </div>
    </div>
  );
};
