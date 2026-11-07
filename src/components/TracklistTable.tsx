import React from 'react';
import { Track } from '../types';
import { formatDuration, getEnergyColor, getPhaseBadgeColor } from '../utils/formatters';
import { Clock, Play, Volume2 } from 'lucide-react';

interface TracklistTableProps {
  tracks: Track[];
  activeTrackId?: string;
  onSelectTrack: (track: Track) => void;
  selectedPhaseFilter?: string;
}

export const TracklistTable: React.FC<TracklistTableProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  selectedPhaseFilter = 'all'
}) => {
  // Filter by phase if selected
  const displayedTracks = React.useMemo(() => {
    if (!selectedPhaseFilter || selectedPhaseFilter === 'all') {
      return tracks;
    }
    return tracks.filter((t) => t.phase === selectedPhaseFilter);
  }, [tracks, selectedPhaseFilter]);

  if (tracks.length === 0) {
    return (
      <div className="w-full py-16 text-center text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800/40">
        <p className="text-sm">No tracks in flow yet. Click "Generate Flow" above.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="sticky top-0 z-10 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 text-xs font-medium text-zinc-400 grid grid-cols-[36px_minmax(220px,3fr)_minmax(140px,2fr)_150px_110px_70px] items-center gap-4 uppercase tracking-wider select-none">
        <div className="text-center font-mono">#</div>
        <div>Title</div>
        <div className="hidden md:block">Album</div>
        <div className="text-center">Energy Score</div>
        <div className="hidden sm:block text-center">Mood / Vibe</div>
        <div className="text-right flex justify-end pr-2">
          <Clock className="w-4 h-4 text-zinc-500" />
        </div>
      </div>

      {/* Track Rows */}
      <div className="divide-y divide-zinc-800/30">
        {displayedTracks.map((track, idx) => {
          const isActive = activeTrackId === track.id;
          const energyMeta = getEnergyColor(track.energy);
          const phaseColor = getPhaseBadgeColor(track.phase);

          // Check if this row is the start of a new phase (for divider)
          const isPhaseStart =
            (selectedPhaseFilter === 'all' || !selectedPhaseFilter) &&
            (idx === 0 || tracks[idx - 1]?.phase !== track.phase);

          return (
            <React.Fragment key={track.id}>
              {/* Phase Header Divider */}
              {isPhaseStart && track.phase && (
                <div className="px-4 py-2 bg-zinc-950/80 border-t border-b border-zinc-800/60 flex items-center justify-between text-xs font-semibold tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: energyMeta.accent }} />
                    <span className="text-zinc-200 uppercase">{track.phase}</span>
                    <span className="text-zinc-500 text-[11px] font-normal font-mono">
                      (Tracks {getPhaseTrackRange(track.phase)})
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${phaseColor}`}>
                    {getPhaseEnergyTarget(track.phase)}
                  </span>
                </div>
              )}

              {/* Individual Track Row */}
              <div
                onClick={() => onSelectTrack(track)}
                className={`group px-4 py-2.5 rounded-lg grid grid-cols-[36px_minmax(220px,3fr)_minmax(140px,2fr)_150px_110px_70px] items-center gap-4 cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? 'bg-zinc-800/90 text-white shadow-inner'
                    : 'hover:bg-zinc-800/50 text-zinc-300'
                }`}
              >
                {/* Index / Play indicator */}
                <div className="text-center font-mono text-xs flex items-center justify-center">
                  {isActive ? (
                    <Volume2 className="w-4 h-4 text-spotify animate-pulse" />
                  ) : (
                    <>
                      <span className="group-hover:hidden text-zinc-500">
                        {track.overallIndex || idx + 1}
                      </span>
                      <Play className="w-3.5 h-3.5 hidden group-hover:block text-white" />
                    </>
                  )}
                </div>

                {/* Title & Artist */}
                <div className="flex items-center gap-3 min-w-0">
                  {track.albumArt ? (
                    <img
                      src={track.albumArt}
                      alt=""
                      className="w-10 h-10 rounded object-cover flex-shrink-0 shadow-sm border border-zinc-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-600">
                      ♪
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-medium text-sm truncate leading-tight ${
                        isActive ? 'text-spotify' : 'text-zinc-100 group-hover:text-white'
                      }`}
                    >
                      {track.name}
                    </p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Album */}
                <div className="hidden md:block text-xs text-zinc-400 truncate group-hover:text-zinc-300">
                  {track.album}
                </div>

                {/* Energy Score Pill & Bar */}
                <div className="flex items-center justify-center">
                  <div
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-mono font-medium ${energyMeta.bg} ${energyMeta.border} ${energyMeta.text}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: energyMeta.accent }} />
                    <span>{track.energy ?? 50}%</span>
                    {/* Mini bar */}
                    <div className="w-8 h-1.5 bg-black/40 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${track.energy ?? 50}%`,
                          backgroundColor: energyMeta.accent
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mood / Valence */}
                <div className="hidden sm:flex items-center justify-center">
                  <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-900/60 border border-zinc-800">
                    {getValenceLabel(track.valence)} ({track.valence ?? 50}%)
                  </span>
                </div>

                {/* Duration */}
                <div className="text-right text-xs font-mono text-zinc-400 pr-2">
                  {formatDuration(track.duration_ms)}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

function getPhaseTrackRange(phase?: string): string {
  switch (phase) {
    case 'Warm-up':
      return '1 – 10';
    case 'Build-up':
      return '11 – 20';
    case 'Peak':
      return '21 – 25';
    case 'Valley/Respiro':
      return '26 – 32';
    case 'Climax':
      return '33 – 45';
    case 'Outro':
      return '46 – 50';
    default:
      return '';
  }
}

function getPhaseEnergyTarget(phase?: string): string {
  switch (phase) {
    case 'Warm-up':
      return 'Target: 40-60 Energy';
    case 'Build-up':
      return 'Target: 61-80 Energy';
    case 'Peak':
      return 'Target: 81-100 Energy';
    case 'Valley/Respiro':
      return 'Target: 30-50 Energy';
    case 'Climax':
      return 'Target: 81-100 Energy';
    case 'Outro':
      return 'Target: 40-60 Energy';
    default:
      return '';
  }
}

function getValenceLabel(valence?: number): string {
  if (valence === undefined) return 'Balanced';
  if (valence >= 75) return 'Euphoric';
  if (valence >= 55) return 'Uplifting';
  if (valence >= 40) return 'Neutral';
  return 'Deep/Dark';
}
