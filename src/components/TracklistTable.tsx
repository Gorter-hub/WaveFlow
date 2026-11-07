import React from 'react';
import { Track } from '../types';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { formatDuration, getEnergyColor } from '../utils/formatters';
import { Clock, Play, Pause, Volume2, Activity } from 'lucide-react';

interface TracklistTableProps {
  tracks: Track[];
  activeTrackId?: string;
  onSelectTrack?: (track: Track) => void;
  selectedPhaseFilter?: string;
}

export const TracklistTable: React.FC<TracklistTableProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  selectedPhaseFilter = 'all'
}) => {
  const { isPlaying, playTrack, activeTrack } = useWaveFlowStore();

  const currentActiveId = activeTrackId || activeTrack?.id;

  const displayedTracks = React.useMemo(() => {
    if (!selectedPhaseFilter || selectedPhaseFilter === 'all') {
      return tracks;
    }
    return tracks.filter((t) => t.phase === selectedPhaseFilter);
  }, [tracks, selectedPhaseFilter]);

  if (tracks.length === 0) {
    return (
      <div className="w-full py-16 text-center text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800/40">
        <p className="text-sm">No tracks in library yet. Click "Actualizar Biblioteca" to load your liked songs.</p>
      </div>
    );
  }

  const handleRowClick = (track: Track) => {
    if (onSelectTrack) onSelectTrack(track);
    playTrack(track);
  };

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="sticky top-0 z-10 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 text-xs font-medium text-zinc-400 grid grid-cols-[38px_minmax(220px,3fr)_minmax(130px,1.8fr)_130px_140px_70px] items-center gap-4 uppercase tracking-wider select-none">
        <div className="text-center font-mono">#</div>
        <div>Title & Artist</div>
        <div className="hidden md:block">BPM & Cadence</div>
        <div className="text-center">Energy Vector</div>
        <div className="hidden sm:block text-center">Mood & Profile</div>
        <div className="text-right flex justify-end pr-2">
          <Clock className="w-4 h-4 text-zinc-500" />
        </div>
      </div>

      {/* Track Rows */}
      <div className="divide-y divide-zinc-800/30">
        {displayedTracks.map((track, idx) => {
          const isActive = currentActiveId === track.id;
          const isThisTrackPlaying = isActive && isPlaying;
          const energyVal = track.energy_score ?? track.energy ?? 50;
          const bpmVal = track.bpm || 124;
          const energyMeta = getEnergyColor(energyVal);

          // Check if this row is the start of a new phase
          const isPhaseStart =
            (selectedPhaseFilter === 'all' || !selectedPhaseFilter) &&
            track.phase &&
            (idx === 0 || tracks[idx - 1]?.phase !== track.phase);

          return (
            <React.Fragment key={track.id}>
              {/* Dynamic Phase Header Divider */}
              {isPhaseStart && (
                <div className="px-4 py-2.5 bg-zinc-950/90 border-t border-b border-zinc-800/80 flex items-center justify-between text-xs font-semibold tracking-wider">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: energyMeta.accent }} />
                    <span className="text-zinc-100 uppercase tracking-widest font-black">{track.phase}</span>
                    <span className="text-zinc-500 text-[11px] font-normal font-mono">
                      (Begins #{track.overallIndex || idx + 1})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 font-mono">
                      Phase Focus
                    </span>
                  </div>
                </div>
              )}

              {/* Individual Track Row */}
              <div
                onClick={() => handleRowClick(track)}
                className={`group px-4 py-2.5 rounded-lg grid grid-cols-[38px_minmax(220px,3fr)_minmax(130px,1.8fr)_130px_140px_70px] items-center gap-4 cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-zinc-800/90 text-white shadow-md border-l-2 border-spotify'
                    : 'hover:bg-zinc-800/50 text-zinc-300'
                }`}
              >
                {/* 1-Click Fast Play / Pause Button in Table */}
                <div
                  className="text-center font-mono text-xs flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    playTrack(track);
                  }}
                  title={isThisTrackPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {isThisTrackPlaying ? (
                    <div className="relative flex items-center justify-center">
                      <Volume2 className="w-4 h-4 text-spotify group-hover:hidden animate-pulse" />
                      <Pause className="w-4 h-4 text-spotify hidden group-hover:block fill-current" />
                    </div>
                  ) : isActive ? (
                    <Play className="w-4 h-4 text-spotify fill-current" />
                  ) : (
                    <>
                      <span className="group-hover:hidden text-zinc-500">
                        {track.overallIndex || idx + 1}
                      </span>
                      <Play className="w-3.5 h-3.5 hidden group-hover:block text-spotify fill-current" />
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
                      className={`font-semibold text-sm truncate leading-tight ${
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

                {/* BPM & Cadence */}
                <div className="hidden md:flex flex-col text-xs font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5 text-zinc-200">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold">{bpmVal} BPM</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 truncate">
                    {track.vocal_presence !== undefined ? `${track.vocal_presence}% vocals` : track.album}
                  </span>
                </div>

                {/* Energy Score Pill & Bar */}
                <div className="flex items-center justify-center">
                  <div
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-mono font-medium ${energyMeta.bg} ${energyMeta.border} ${energyMeta.text}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: energyMeta.accent }} />
                    <span>{energyVal}%</span>
                    <div className="w-8 h-1.5 bg-black/40 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${energyVal}%`,
                          backgroundColor: energyMeta.accent
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mood & Transition */}
                <div className="hidden sm:flex flex-col items-center justify-center text-center">
                  <span className="text-[10.5px] font-mono text-zinc-300 px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800 whitespace-nowrap">
                    {track.mood_vibe || getValenceLabel(track.valence_score ?? track.valence)}
                  </span>
                  {track.transition_note ? (
                    <span className="text-[9.5px] text-cyan-400 font-mono mt-0.5 truncate max-w-[130px]">
                      {track.transition_note}
                    </span>
                  ) : (
                    <span className="text-[9px] text-zinc-500 font-mono mt-0.5">
                      Valence: {track.valence_score ?? track.valence ?? 50}%
                    </span>
                  )}
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

function getValenceLabel(valence?: number): string {
  if (valence === undefined) return 'Balanced';
  if (valence >= 75) return 'Euphoric';
  if (valence >= 55) return 'Uplifting';
  if (valence >= 40) return 'Neutral';
  return 'Deep/Dark';
}
