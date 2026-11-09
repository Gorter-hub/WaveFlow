import React, { useMemo } from 'react';
import { Track } from '../types';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { getCamelotBadgeStyle, getCamelotKeyName } from '../algorithm/camelot';
import { getEnergyColor, formatDuration } from '../utils/formatters';
import {
  ArrowLeftRight,
  X,
  Activity,
  Sparkles,
  Music,
  CheckCircle2,
  Disc3
} from 'lucide-react';

interface SwapTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackIndex: number | null;
}

export const SwapTrackModal: React.FC<SwapTrackModalProps> = ({
  isOpen,
  onClose,
  trackIndex
}) => {
  const { flowTracks, getSwapCandidates, swapTrackInFlow } = useWaveFlowStore();

  const currentTrack = trackIndex !== null && trackIndex >= 0 ? flowTracks[trackIndex] : null;
  const prevTrack = trackIndex !== null && trackIndex > 0 ? flowTracks[trackIndex - 1] : null;
  const nextTrack =
    trackIndex !== null && trackIndex < flowTracks.length - 1 ? flowTracks[trackIndex + 1] : null;

  const candidates = useMemo(() => {
    if (trackIndex === null || trackIndex < 0) return [];
    return getSwapCandidates(trackIndex);
  }, [trackIndex, getSwapCandidates]);

  if (!isOpen || trackIndex === null || !currentTrack) return null;

  const currentCamelotStyle = getCamelotBadgeStyle(currentTrack.camelot_key);
  const currentEnergyMeta = getEnergyColor(currentTrack.energy_score ?? 50);

  const handleSelectCandidate = (candidateTrack: Track) => {
    swapTrackInFlow(trackIndex, candidateTrack);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-spotify/20 border border-spotify/30 flex items-center justify-center text-spotify shadow-md">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-spotify">
                  Harmonic Track Swap
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                  Track #{trackIndex + 1} of {flowTracks.length}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white">
                Replace in {currentTrack.phase || 'Current Phase'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Current Track Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Current Song to Replace
            </span>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {currentTrack.albumArt ? (
                  <img
                    src={currentTrack.albumArt}
                    alt=""
                    className="w-11 h-11 rounded-lg object-cover border border-zinc-800 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                    <Music className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{currentTrack.name}</h4>
                  <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
                </div>
              </div>

              {/* Acoustic Badges */}
              <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                {currentTrack.camelot_key && (
                  <span
                    className={`px-2 py-1 rounded-md border font-bold text-[11px] ${currentCamelotStyle.bg} ${currentCamelotStyle.text} ${currentCamelotStyle.border}`}
                    title={getCamelotKeyName(currentTrack.camelot_key)}
                  >
                    {currentTrack.camelot_key}
                  </span>
                )}
                <span className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-300 font-semibold text-[11px]">
                  {currentTrack.bpm} BPM
                </span>
                <span className={`px-2 py-1 rounded-md border font-bold text-[11px] ${currentEnergyMeta.bg} ${currentEnergyMeta.text} ${currentEnergyMeta.border}`}>
                  {currentTrack.energy_score}%
                </span>
              </div>
            </div>

            {/* Transition Context (Prev & Next) */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-400">
              <div className="truncate">
                <span className="text-zinc-500 mr-1.5">Previous:</span>
                <span className="text-zinc-300 font-sans">
                  {prevTrack ? `${prevTrack.name} (${prevTrack.camelot_key || '8A'}, ${prevTrack.bpm}BPM)` : 'Set Opener'}
                </span>
              </div>
              <div className="truncate text-right">
                <span className="text-zinc-500 mr-1.5">Next:</span>
                <span className="text-zinc-300 font-sans">
                  {nextTrack ? `${nextTrack.name} (${nextTrack.camelot_key || '8A'}, ${nextTrack.bpm}BPM)` : 'Set Closer'}
                </span>
              </div>
            </div>
          </div>

          {/* Candidate Replacements */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-spotify" />
                <span>Compatible Harmonic Candidates ({candidates.length})</span>
              </span>
              <span className="text-[10.5px] text-zinc-500">
                Ranked by Camelot wheel & tempo harmony
              </span>
            </div>

            {candidates.length === 0 ? (
              <div className="p-8 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-center text-zinc-500 text-xs">
                No alternative compatible tracks found in library matching this phase.
              </div>
            ) : (
              candidates.map((cand, idx) => {
                const camelotStyle = getCamelotBadgeStyle(cand.track.camelot_key);
                const energyMeta = getEnergyColor(cand.track.energy_score ?? 50);

                return (
                  <div
                    key={cand.track.id}
                    className="p-3.5 rounded-xl bg-zinc-950/70 hover:bg-zinc-800/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {cand.track.albumArt ? (
                        <img
                          src={cand.track.albumArt}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-zinc-800 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                          <Disc3 className="w-4 h-4" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-spotify transition-colors">
                            {cand.track.name}
                          </h5>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.2 rounded bg-spotify/20 border border-spotify/40 text-spotify text-[9px] font-black uppercase tracking-wider shrink-0">
                              Top Match
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-zinc-400 truncate mt-0.5">
                          {cand.track.artist}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate italic mt-0.5">
                          {cand.harmonicRelation}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Key, BPM, Match Score & Action Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span
                          className={`px-2 py-0.5 rounded border text-[11px] font-bold ${camelotStyle.bg} ${camelotStyle.text} ${camelotStyle.border}`}
                          title={getCamelotKeyName(cand.track.camelot_key!)}
                        >
                          {cand.track.camelot_key || '8A'}
                        </span>

                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] font-medium">
                          {cand.track.bpm} BPM
                        </span>

                        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${energyMeta.bg} ${energyMeta.text} ${energyMeta.border}`}>
                          {cand.track.energy_score}%
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10.5px]">
                          {cand.combinedScore}%
                        </span>
                      </div>

                      <button
                        onClick={() => handleSelectCandidate(cand.track)}
                        className="px-3.5 py-1.5 rounded-lg bg-spotify hover:bg-spotify-hover text-black font-extrabold text-xs transition-all hover:scale-105 active:scale-95 shadow-md shadow-spotify/20"
                      >
                        Swap
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
          <span>Swapping updates the local transition and SVG energy curve immediately.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
