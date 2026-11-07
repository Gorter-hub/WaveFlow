import React, { useState } from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { formatDuration, getEnergyColor, getPhaseBadgeColor } from '../utils/formatters';
import {
  ExternalLink,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Share2,
  Music4
} from 'lucide-react';

export const BottomBar: React.FC = () => {
  const {
    activeTrack,
    status,
    flowTracks,
    exportToSpotify,
    exportedPlaylist,
    isMockMode
  } = useWaveFlowStore();

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const isExporting = status.step === 'exporting';
  const isReady = status.step === 'ready' || status.step === 'exported';
  const hasTracks = flowTracks.length > 0;

  const energyMeta = activeTrack ? getEnergyColor(activeTrack.energy) : null;
  const phaseColor = activeTrack?.phase ? getPhaseBadgeColor(activeTrack.phase) : '';

  return (
    <footer className="h-24 bg-zinc-950 border-t border-zinc-800/80 px-4 md:px-6 flex items-center justify-between gap-4 select-none z-40 relative">
      {/* LEFT: Currently Selected Track Preview */}
      <div className="flex items-center gap-3 w-1/4 min-w-[200px] max-w-[340px]">
        {activeTrack ? (
          <>
            <div className="relative group flex-shrink-0">
              {activeTrack.albumArt ? (
                <img
                  src={activeTrack.albumArt}
                  alt=""
                  className="w-14 h-14 rounded-md object-cover shadow-lg border border-zinc-800"
                />
              ) : (
                <div className="w-14 h-14 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-500">
                  <Music4 className="w-6 h-6" />
                </div>
              )}

              {/* Play/Pause overlay */}
              <button
                onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md text-white"
                title="Toggle visual preview"
              >
                {isPlayingPreview ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-white truncate">
                  {activeTrack.name}
                </p>
              </div>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {activeTrack.artist}
              </p>

              {/* Track Metadata Badges */}
              <div className="flex items-center gap-1.5 mt-1.5">
                {activeTrack.phase && (
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 rounded border font-medium ${phaseColor}`}
                  >
                    {activeTrack.phase}
                  </span>
                )}
                {energyMeta && (
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-semibold ${energyMeta.text} ${energyMeta.bg} border ${energyMeta.border}`}
                  >
                    {activeTrack.energy}% Energy
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 text-zinc-500">
            <div className="w-14 h-14 rounded-md bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-center">
              <Music4 className="w-5 h-5 text-zinc-600" />
            </div>
            <div className="text-xs">
              <p className="text-zinc-400 font-medium">No track selected</p>
              <p className="text-zinc-600">Select any track from the set</p>
            </div>
          </div>
        )}
      </div>

      {/* CENTER: Generation Status & Live Progress */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-xl px-2">
        <div className="flex items-center gap-2 mb-2">
          {status.step === 'idle' && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              <span>WaveFlow Engine Standby</span>
            </span>
          )}

          {(status.step === 'fetching' ||
            status.step === 'analyzing' ||
            status.step === 'sorting' ||
            status.step === 'exporting') && (
            <span className="flex items-center gap-2 text-xs font-medium text-spotify">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-spotify" />
              <span className="animate-pulse">{status.message}</span>
            </span>
          )}

          {status.step === 'ready' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{status.message}</span>
            </span>
          )}

          {status.step === 'exported' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-spotify">
              <CheckCircle2 className="w-4 h-4 text-spotify" />
              <span>{status.message}</span>
            </span>
          )}

          {status.step === 'error' && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{status.message}</span>
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md bg-zinc-800/80 rounded-full h-1.5 overflow-hidden relative shadow-inner">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              status.step === 'error'
                ? 'bg-rose-500'
                : status.step === 'ready' || status.step === 'exported'
                ? 'bg-spotify shadow-[0_0_8px_rgba(29,185,84,0.6)]'
                : 'bg-gradient-to-r from-emerald-500 via-spotify to-cyan-400'
            }`}
            style={{ width: `${Math.max(5, status.progress)}%` }}
          />
        </div>

        {/* Audio Wave Visualizer Simulation */}
        {isPlayingPreview && (
          <div className="flex items-center gap-0.5 mt-1.5 h-3">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-spotify rounded-full"
                style={{
                  height: `${Math.max(20, Math.sin(i * 0.8 + Date.now() / 200) * 100)}%`,
                  animation: `wave 0.8s ease-in-out infinite alternate ${i * 0.05}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Main Export to Spotify CTA */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px] max-w-[340px]">
        {/* Exported Result Link */}
        {exportedPlaylist && (
          <a
            href={exportedPlaylist.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors border border-zinc-700"
            title="Open playlist in Spotify"
          >
            <span>Open in Spotify</span>
            <ExternalLink className="w-3.5 h-3.5 text-spotify" />
          </a>
        )}

        {/* Main Export Button */}
        <button
          onClick={exportToSpotify}
          disabled={!hasTracks || isExporting}
          className={`relative group flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg ${
            !hasTracks || isExporting
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
              : 'bg-spotify hover:bg-spotify-hover text-black hover:scale-105 active:scale-95 shadow-spotify/25'
          }`}
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              {/* Spotify Icon */}
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.587 14.428a.627.627 0 0 1-.861.208c-2.358-1.441-5.327-1.767-8.825-.968a.627.627 0 1 1-.28-1.223c3.829-.875 7.119-.508 9.758 1.121.298.183.391.573.208.862zm1.226-2.724a.784.784 0 0 1-1.079.258c-2.7-1.66-6.816-2.14-10.01-1.171a.785.785 0 0 1-.466-1.5c3.649-1.107 8.2-.577 11.297 1.334.356.219.472.684.258 1.079zm.106-2.836C14.685 9.07 9.35 8.89 6.262 9.827a.942.942 0 1 1-.55-1.802c3.541-1.075 9.444-.863 13.208 1.37a.942.942 0 1 1-.999 1.603z" />
              </svg>
              <span>{exportedPlaylist ? 'Re-Export' : 'Export to Spotify'}</span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
};
