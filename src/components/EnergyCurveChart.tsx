import React, { useState, useMemo } from 'react';
import { Track, FlowPhaseConfig, CognitiveFlowIntentId } from '../types';
import { getPhaseConfigsForStyle, COGNITIVE_INTENTS } from '../algorithm/curveGenerator';
import { getEnergyColor, formatDuration } from '../utils/formatters';

interface EnergyCurveChartProps {
  tracks: Track[];
  activeTrackId?: string;
  onSelectTrack?: (track: Track) => void;
  selectedPhase?: string;
  intentId?: CognitiveFlowIntentId;
  phases?: FlowPhaseConfig[];
}

export const EnergyCurveChart: React.FC<EnergyCurveChartProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  selectedPhase,
  intentId = 'deep_focus',
  phases
}) => {
  const [hoveredTrack, setHoveredTrack] = useState<Track | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const phaseConfigs = useMemo(() => {
    if (phases && phases.length > 0) return phases;
    return getPhaseConfigsForStyle(intentId, tracks.length || 22);
  }, [phases, intentId, tracks.length]);

  const currentIntent = COGNITIVE_INTENTS[intentId] || COGNITIVE_INTENTS.deep_focus;

  // SVG dimensions & padding
  const width = 1000;
  const height = 280;
  const padding = { top: 40, right: 30, bottom: 45, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Compute coordinate points for the tracks
  const points = useMemo(() => {
    if (!tracks || tracks.length === 0) return [];

    const total = tracks.length;
    return tracks.map((track, i) => {
      const x = padding.left + (i / Math.max(1, total - 1)) * chartWidth;
      const energy = track.energy_score ?? track.energy ?? 50;
      const y = padding.top + chartHeight - (energy / 100) * chartHeight;
      return { x, y, track, index: i };
    });
  }, [tracks, chartWidth, chartHeight, padding.left, padding.top]);

  // Construct smooth Bezier curve path
  const { pathD, areaD } = useMemo(() => {
    if (points.length === 0) return { pathD: '', areaD: '' };
    if (points.length === 1) {
      const p = points[0];
      return { pathD: `M ${p.x} ${p.y}`, areaD: '' };
    }

    let d = `M ${points[0].x} ${points[0].y}`;

    // Smooth spline interpolation
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    // Area path for gradient fill
    const first = points[0];
    const last = points[points.length - 1];
    const bottomY = padding.top + chartHeight;
    const area = `${d} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;

    return { pathD: d, areaD: area };
  }, [points, padding.top, chartHeight]);

  // Phase region bands for background & phase headers
  const phaseRegions = useMemo(() => {
    if (tracks.length === 0 || phaseConfigs.length === 0) return [];
    let currentX = padding.left;
    const totalSetTracks = phaseConfigs.reduce((acc, p) => acc + p.trackCount, 0) || tracks.length;

    return phaseConfigs.map((phase) => {
      const phaseWidth = (phase.trackCount / Math.max(1, totalSetTracks)) * chartWidth;
      const region = {
        phase,
        x: currentX,
        width: phaseWidth,
        centerX: currentX + phaseWidth / 2
      };
      currentX += phaseWidth;
      return region;
    });
  }, [tracks.length, chartWidth, padding.left, phaseConfigs]);

  if (tracks.length === 0) {
    return (
      <div className="w-full h-64 bg-zinc-950/60 rounded-xl border border-zinc-800/60 flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-12 h-12 rounded-full border border-dashed border-zinc-700 flex items-center justify-center">
          <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <p className="text-sm font-medium">Click "Generate Flow" to synthesize the {currentIntent.name} neuroscience curve</p>
      </div>
    );
  }

  const totalDurationMs = tracks.reduce((acc, t) => acc + (t.duration_ms || 210000), 0);

  return (
    <div className="relative w-full bg-zinc-950/90 rounded-2xl border border-zinc-800/80 p-4 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Chart Header / Title & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: currentIntent.color }} />
          <h3 className="text-sm font-semibold text-zinc-200 tracking-wide uppercase">
            {currentIntent.name} Dynamic Arc
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            ({tracks.length} Tracks • {formatDuration(totalDurationMs)} • {phaseConfigs.length} Cognitive Phases)
          </span>
        </div>

        {/* Phase mini pills */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px]">
          {phaseConfigs.map((cfg) => {
            const isSelected = selectedPhase === cfg.name;
            return (
              <span
                key={cfg.name}
                className={`px-2 py-0.5 rounded-md border text-zinc-400 font-medium transition-colors ${
                  isSelected ? 'border-spotify text-spotify bg-spotify/10' : 'border-zinc-800 bg-zinc-900/50'
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: cfg.color }} />
                {cfg.name} ({cfg.minEnergy}-{cfg.maxEnergy}%)
              </span>
            );
          })}
        </div>
      </div>

      {/* SVG Viewport */}
      <div className="w-full overflow-x-auto select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[700px] overflow-visible"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top
            });
          }}
          onMouseLeave={() => {
            setHoveredTrack(null);
            setMousePos(null);
          }}
        >
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {phaseConfigs.map((p, idx) => {
                const offset = Math.round((idx / Math.max(1, phaseConfigs.length - 1)) * 100);
                return <stop key={p.name} offset={`${offset}%`} stopColor={p.color} stopOpacity="0.65" />;
              })}
            </linearGradient>

            <linearGradient id="areaFade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentIntent.color} stopOpacity="0.3" />
              <stop offset="70%" stopColor={currentIntent.color} stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Phase Background Shading & Vertical Dividers */}
          {phaseRegions.map((region, idx) => {
            const isHovered = hoveredTrack?.phase === region.phase.name;
            const isPhaseActive = selectedPhase === region.phase.name;
            return (
              <g key={region.phase.name}>
                <rect
                  x={region.x}
                  y={padding.top}
                  width={region.width}
                  height={chartHeight}
                  fill={isPhaseActive ? region.phase.color : 'transparent'}
                  fillOpacity={isPhaseActive ? 0.08 : (isHovered ? 0.04 : 0)}
                  className="transition-opacity duration-200"
                />

                {idx > 0 && (
                  <line
                    x1={region.x}
                    y1={padding.top - 10}
                    x2={region.x}
                    y2={padding.top + chartHeight}
                    stroke="#27272a"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                )}

                <text
                  x={region.centerX}
                  y={padding.top - 12}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-zinc-400 uppercase tracking-widest pointer-events-none"
                >
                  {region.phase.name}
                </text>
              </g>
            );
          })}

          {/* Energy Y-Axis Horizontal Gridlines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = padding.top + chartHeight - (val / 100) * chartHeight;
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth={val === 50 ? 1 : 0.5}
                  strokeDasharray={val === 50 ? '2 2' : undefined}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[9.5px] font-mono fill-zinc-600 select-none"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Shaded Area Under Curve */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#areaFade)"
              className="pointer-events-none transition-all duration-300"
            />
          )}

          {/* Main Spline Curve Path */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#curveGradient)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none transition-all duration-300"
              filter="url(#glow)"
            />
          )}

          {/* Hover Crosshair Vertical Line */}
          {hoveredTrack && (
            (() => {
              const pt = points.find((p) => p.track.id === hoveredTrack.id);
              if (!pt) return null;
              return (
                <line
                  x1={pt.x}
                  y1={padding.top}
                  x2={pt.x}
                  y2={padding.top + chartHeight}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  className="pointer-events-none opacity-60"
                />
              );
            })()
          )}

          {/* Data Points (Tracks) */}
          {points.map((pt) => {
            const isActive = pt.track.id === activeTrackId;
            const isHovered = pt.track.id === hoveredTrack?.id;
            const isCurrentPhase = selectedPhase ? pt.track.phase === selectedPhase : true;

            const energy = pt.track.energy_score ?? pt.track.energy ?? 50;
            const colorMeta = getEnergyColor(energy);

            return (
              <g
                key={pt.track.id}
                className="cursor-pointer group"
                onClick={() => onSelectTrack && onSelectTrack(pt.track)}
                onMouseEnter={() => setHoveredTrack(pt.track)}
              >
                {/* Invisible large hit target for easy mouse interactions */}
                <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />

                {/* Outer Glow Ring for Active/Playing or Hovered Track */}
                {(isActive || isHovered) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 8 : 6}
                    fill="none"
                    stroke={isActive ? '#1DB954' : '#ffffff'}
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                )}

                {/* Track Node Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 5 : isHovered ? 4.5 : 3.5}
                  fill={isActive ? '#1DB954' : colorMeta.accent}
                  stroke="#000000"
                  strokeWidth={1.5}
                  opacity={isCurrentPhase ? 1 : 0.25}
                  className="transition-all duration-150 group-hover:scale-125"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Tooltip Card */}
      {hoveredTrack && mousePos && (
        <div
          className="absolute z-30 pointer-events-none bg-zinc-900/95 border border-zinc-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[220px] transition-all duration-75 text-xs text-white"
          style={{
            left: Math.min(Math.max(mousePos.x + 10, 10), 750),
            top: Math.max(mousePos.y - 120, 10)
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getEnergyColor(hoveredTrack.energy_score ?? hoveredTrack.energy).accent }}
            />
            <span className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">
              #{hoveredTrack.overallIndex} • {hoveredTrack.phase}
            </span>
          </div>

          <div className="font-bold text-sm truncate text-white leading-tight">
            {hoveredTrack.name}
          </div>
          <div className="text-zinc-400 truncate text-[11px] mt-0.5">
            {hoveredTrack.artist}
          </div>

          <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="font-mono text-spotify font-semibold">
              ⚡ {hoveredTrack.energy_score ?? hoveredTrack.energy}% Energy
            </span>
            <span className="font-mono text-amber-300">
              {hoveredTrack.bpm} BPM
            </span>
            <span className="text-zinc-500 font-mono">
              {formatDuration(hoveredTrack.duration_ms)}
            </span>
          </div>
          {hoveredTrack.transition_note && (
            <div className="mt-1.5 text-[10px] text-cyan-400 font-mono truncate">
              {hoveredTrack.transition_note}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
