import React, { useState, useMemo } from 'react';
import { Track, FlowPhaseConfig, FlowStyleId } from '../types';
import { getPhaseConfigsForStyle } from '../algorithm/curveGenerator';
import { getEnergyColor } from '../utils/formatters';

interface EnergyCurveChartProps {
  tracks: Track[];
  activeTrackId?: string;
  onSelectTrack?: (track: Track) => void;
  selectedPhase?: string;
  styleId?: FlowStyleId;
}

export const EnergyCurveChart: React.FC<EnergyCurveChartProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  selectedPhase,
  styleId = 'classic'
}) => {
  const [hoveredTrack, setHoveredTrack] = useState<Track | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const phaseConfigs = useMemo(
    () => getPhaseConfigsForStyle(styleId, tracks.length || 50),
    [styleId, tracks.length]
  );

  // SVG dimensions & padding
  const width = 1000;
  const height = 280;
  const padding = { top: 40, right: 30, bottom: 45, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Compute coordinate points for the 50 tracks
  const points = useMemo(() => {
    if (!tracks || tracks.length === 0) return [];

    const total = tracks.length;
    return tracks.map((track, i) => {
      // X distributes evenly from left to right
      const x = padding.left + (i / Math.max(1, total - 1)) * chartWidth;
      // Y: Energy 0 is bottom, Energy 100 is top
      const energy = track.energy ?? 50;
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
    if (tracks.length === 0) return [];
    let currentX = padding.left;

    return phaseConfigs.map((phase) => {
      const phaseWidth = (phase.trackCount / tracks.length) * chartWidth;
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
        <p className="text-sm font-medium">Click "Generate Flow" to calculate the 6-phase energy curve</p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-zinc-950/90 rounded-2xl border border-zinc-800/80 p-4 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Chart Header / Title & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-spotify animate-pulse" />
          <h3 className="text-sm font-semibold text-zinc-200 tracking-wide uppercase">
            DJ Energy Dynamics Curve
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            ({tracks.length} Tracks • 6 Flow Phases)
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
                {cfg.name} ({cfg.minEnergy}-{cfg.maxEnergy})
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
            {/* Energy Curve Area Gradient */}
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />    {/* Warm-up */}
              <stop offset="25%" stopColor="#1DB954" stopOpacity="0.55" />   {/* Build-up */}
              <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.65" />   {/* Peak */}
              <stop offset="60%" stopColor="#818cf8" stopOpacity="0.35" />   {/* Valley */}
              <stop offset="85%" stopColor="#f43f5e" stopOpacity="0.75" />   {/* Climax */}
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.45" />  {/* Outro */}
            </linearGradient>

            <linearGradient id="areaFade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1DB954" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#1DB954" stopOpacity="0.05" />
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
                {/* Phase background zone */}
                <rect
                  x={region.x}
                  y={padding.top}
                  width={region.width}
                  height={chartHeight}
                  fill={isPhaseActive ? region.phase.color : 'transparent'}
                  fillOpacity={isPhaseActive ? 0.08 : (isHovered ? 0.04 : 0)}
                  className="transition-opacity duration-200"
                />

                {/* Vertical Phase Divider */}
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

                {/* Phase Label at Top */}
                <text
                  x={region.centerX}
                  y={padding.top - 12}
                  textAnchor="middle"
                  fill={isPhaseActive ? region.phase.color : '#a1a1aa'}
                  fontSize={10}
                  fontWeight={isPhaseActive ? '700' : '500'}
                  letterSpacing="0.05em"
                >
                  {region.phase.name.toUpperCase()}
                </text>

                {/* Target Energy Range */}
                <text
                  x={region.centerX}
                  y={padding.top - 2}
                  textAnchor="middle"
                  fill="#71717a"
                  fontSize={8.5}
                  fontFamily="monospace"
                >
                  ({region.phase.minEnergy}-{region.phase.maxEnergy}%)
                </text>
              </g>
            );
          })}

          {/* Horizontal Gridlines & Y-Axis Energy Labels */}
          {[100, 80, 60, 40, 20].map((val) => {
            const y = padding.top + chartHeight - (val / 100) * chartHeight;
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth={0.8}
                  strokeDasharray={val === 50 || val === 80 ? 'none' : '2 4'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize={9.5}
                  fontFamily="monospace"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Area Fill Under Curve */}
          <path d={areaD} fill="url(#areaFade)" />

          {/* Main Spline Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#curveGradient)"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Track Data Points */}
          {points.map((pt) => {
            const isHovered = hoveredTrack?.id === pt.track.id;
            const isActive = activeTrackId === pt.track.id;
            const energyClr = getEnergyColor(pt.track.energy).accent;

            return (
              <g
                key={pt.track.id}
                className="cursor-pointer group"
                onClick={() => onSelectTrack && onSelectTrack(pt.track)}
                onMouseEnter={() => setHoveredTrack(pt.track)}
              >
                {/* Outer halo when active or hovered */}
                {(isActive || isHovered) && (
                  <circle
                    cx={pt.x}
                    y={pt.y}
                    r={isActive ? 9 : 7}
                    fill={energyClr}
                    fillOpacity={0.3}
                    className="animate-ping"
                  />
                )}

                {/* Main point circle */}
                <circle
                  cx={pt.x}
                  y={pt.y}
                  r={isActive ? 6 : isHovered ? 5.5 : 3}
                  fill={isActive ? '#ffffff' : energyClr}
                  stroke={isActive ? energyClr : '#121212'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className="transition-all duration-150"
                />

                {/* Track Number below x-axis for milestone tracks */}
                {(pt.index === 0 ||
                  pt.index === 9 ||
                  pt.index === 19 ||
                  pt.index === 24 ||
                  pt.index === 31 ||
                  pt.index === 44 ||
                  pt.index === 49) && (
                  <text
                    x={pt.x}
                    y={padding.top + chartHeight + 18}
                    textAnchor="middle"
                    fill="#71717a"
                    fontSize={9}
                    fontFamily="monospace"
                  >
                    #{pt.index + 1}
                  </text>
                )}
              </g>
            );
          })}

          {/* X Axis Baseline */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="#3f3f46"
            strokeWidth={1}
          />

          {/* X-Axis bottom label */}
          <text
            x={width / 2}
            y={padding.top + chartHeight + 34}
            textAnchor="middle"
            fill="#71717a"
            fontSize={10}
            letterSpacing="0.05em"
          >
            SET PROGRESSION (TRACKS 1 — 50)
          </text>
        </svg>
      </div>

      {/* Floating Interactive Tooltip */}
      {hoveredTrack && (
        <div
          className="absolute z-30 pointer-events-none bg-zinc-900/95 border border-zinc-700/80 rounded-lg p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3 transition-transform duration-75 text-xs max-w-xs"
          style={{
            left: mousePos ? Math.min(mousePos.x + 15, 600) : '50%',
            top: mousePos ? Math.max(mousePos.y - 75, 10) : '20%'
          }}
        >
          {hoveredTrack.albumArt && (
            <img
              src={hoveredTrack.albumArt}
              alt=""
              className="w-10 h-10 rounded object-cover shadow border border-zinc-800"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                #{hoveredTrack.overallIndex || '?'}
              </span>
              <span className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider">
                {hoveredTrack.phase}
              </span>
            </div>
            <p className="font-semibold text-white truncate leading-tight mt-0.5">
              {hoveredTrack.name}
            </p>
            <p className="text-zinc-400 truncate text-[11px]">{hoveredTrack.artist}</p>
          </div>
          <div className="text-right pl-2 border-l border-zinc-800">
            <div className="text-sm font-bold text-spotify font-mono">
              {hoveredTrack.energy}%
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Energy</div>
          </div>
        </div>
      )}
    </div>
  );
};
