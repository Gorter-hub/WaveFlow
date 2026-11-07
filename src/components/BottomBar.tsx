import React, { useState, useRef, useEffect } from 'react';
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
  Volume2,
  VolumeX,
  Music4,
  Disc3,
  Radio
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

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [showEmbedPlayer, setShowEmbedPlayer] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isExporting = status.step === 'exporting';
  const hasTracks = flowTracks.length > 0;

  // Handle track changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);

      if (activeTrack?.preview_url) {
        audioRef.current.src = activeTrack.preview_url;
        audioRef.current.load();
      }
    }
  }, [activeTrack?.id, activeTrack?.preview_url]);

  const togglePlay = () => {
    if (!activeTrack) return;

    if (activeTrack.preview_url && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((e) => {
            console.warn('Playback error, toggling embed:', e);
            setShowEmbedPlayer(true);
          });
      }
    } else {
      setShowEmbedPlayer((prev) => !prev);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const energyVal = activeTrack?.energy_score ?? activeTrack?.energy ?? 50;
  const energyMeta = activeTrack ? getEnergyColor(energyVal) : null;
  const phaseColor = activeTrack?.phase ? getPhaseBadgeColor(activeTrack.phase) : '';

  return (
    <>
      {/* Hidden HTML5 Audio Element for 30s official Spotify previews */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onError={() => {
          setIsPlaying(false);
        }}
        preload="auto"
      />

      {/* Floating Spotify Interactive Embed Player (when preview_url is not restricted or toggled) */}
      {showEmbedPlayer && activeTrack && (
        <div className="fixed bottom-24 right-6 z-50 bg-zinc-950 border border-zinc-700/80 rounded-2xl shadow-2xl p-2 w-80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b border-zinc-800 text-xs">
            <span className="font-bold text-spotify flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>Spotify Mini Player</span>
            </span>
            <button
              onClick={() => setShowEmbedPlayer(false)}
              className="text-zinc-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-zinc-800"
            >
              ✕
            </button>
          </div>
          <iframe
            src={`https://open.spotify.com/embed/track/${activeTrack.id}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl shadow-inner"
          />
        </div>
      )}

      {/* BOTTOM CONTROL DOCK */}
      <footer className="w-full h-24 bg-zinc-950 border-t border-zinc-800 px-4 md:px-6 flex items-center justify-between relative z-40 fixed bottom-0 left-0 right-0 shadow-[0_-10px_25px_rgba(0,0,0,0.7)] select-none">
        {/* LEFT: Currently Playing / Selected Track Info */}
        <div className="flex items-center gap-3 w-1/3 min-w-[200px] max-w-[340px]">
          {activeTrack ? (
            <>
              {/* Album Art with play overlay */}
              <div
                className="relative group w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer shadow-md border border-zinc-800"
                onClick={togglePlay}
                title={
                  activeTrack.preview_url
                    ? isPlaying
                      ? 'Pausar preview'
                      : 'Reproducir preview de 30s'
                    : 'Abrir reproductor oficial de Spotify'
                }
              >
                {activeTrack.albumArt ? (
                  <img
                    src={activeTrack.albumArt}
                    alt={activeTrack.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                    <Music4 className="w-6 h-6" />
                  </div>
                )}

                {/* Hover Play/Pause Overlay */}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-spotify fill-current" />
                  ) : (
                    <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                  )}
                </div>

                {/* Spinning Disc badge when playing */}
                {isPlaying && (
                  <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-spotify animate-ping" />
                )}
              </div>

              {/* Title, Artist & Phase Badge */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-white truncate leading-tight hover:underline cursor-pointer">
                    {activeTrack.name}
                  </p>
                  {/* Energy Score Pill */}
                  {energyMeta && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${energyMeta.bg} ${energyMeta.border} ${energyMeta.text} flex-shrink-0`}
                    >
                      {energyVal}%
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {activeTrack.artist}
                </p>

                {/* Phase & Audio Indicator */}
                <div className="flex items-center gap-2 mt-1">
                  {activeTrack.phase && (
                    <span
                      className={`text-[9.5px] font-semibold px-2 py-0.2 rounded-full border ${phaseColor}`}
                    >
                      {activeTrack.phase}
                    </span>
                  )}

                  {activeTrack.preview_url ? (
                    <span className="text-[9.5px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Preview 30s
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowEmbedPlayer((p) => !p)}
                      className="text-[9.5px] text-zinc-400 hover:text-spotify underline flex items-center gap-1"
                    >
                      <Disc3 className="w-3 h-3" />
                      Embed Player
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-zinc-500">
              <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Music4 className="w-6 h-6 text-zinc-700" />
              </div>
              <div className="text-xs">
                <p className="font-medium text-zinc-400">No track selected</p>
                <p className="text-[11px] text-zinc-600">Select any track to preview</p>
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Audio Player Controls & AI Progress */}
        <div className="flex flex-col items-center justify-center max-w-md w-full px-4">
          {/* Controls: Play/Pause, Mute, Time */}
          <div className="flex items-center gap-4 mb-2">
            {activeTrack?.preview_url && (
              <button
                onClick={toggleMute}
                className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={togglePlay}
              disabled={!activeTrack}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                activeTrack
                  ? 'bg-white hover:bg-white/90 text-black shadow-lg hover:scale-105 active:scale-95'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current text-black" />
              ) : (
                <Play className="w-4 h-4 fill-current text-black ml-0.5" />
              )}
            </button>

            {activeTrack?.preview_url ? (
              <span className="text-[10px] font-mono text-zinc-400">
                {Math.floor(currentTime)}s / {Math.floor(duration)}s
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 font-medium">
                {activeTrack ? 'Preview vía Embed' : 'Listo'}
              </span>
            )}
          </div>

          {/* AI Status Message */}
          <div className="flex items-center gap-2 mb-1 text-[11px] font-medium text-zinc-400 truncate max-w-full">
            {status.step === 'idle' && (
              <span className="flex items-center gap-1.5 text-zinc-500">
                <span>{status.message}</span>
              </span>
            )}

            {(status.step === 'fetching' || status.step === 'analyzing' || status.step === 'sorting') && (
              <span className="flex items-center gap-1.5 text-spotify font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-spotify flex-shrink-0" />
                <span className="truncate">{status.message}</span>
              </span>
            )}

            {status.step === 'ready' && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{status.message}</span>
              </span>
            )}

            {status.step === 'exported' && (
              <span className="flex items-center gap-1.5 text-spotify font-bold truncate">
                <Sparkles className="w-3.5 h-3.5 text-spotify flex-shrink-0" />
                <span className="truncate">{status.message}</span>
              </span>
            )}

            {status.step === 'error' && (
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold truncate">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">{status.message}</span>
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-sm bg-zinc-800/80 rounded-full h-1.5 overflow-hidden relative shadow-inner">
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
        </div>

        {/* RIGHT: Export to Spotify CTA (Positioned safely away from the bottom-right corner) */}
        <div className="flex items-center justify-end gap-3 mr-44 sm:mr-48">
          {exportedPlaylist && (
            <a
              href={exportedPlaylist.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-spotify transition-colors border border-spotify/30 hover:scale-105"
              title="Abrir playlist en Spotify"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3.5 h-3.5 text-spotify" />
            </a>
          )}

          <button
            onClick={exportToSpotify}
            disabled={!hasTracks || isExporting}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl ${
              !hasTracks || isExporting
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                : 'bg-spotify hover:bg-spotify-hover text-black hover:scale-105 active:scale-95 shadow-spotify/30'
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.587 14.428a.627.627 0 0 1-.861.208c-2.358-1.441-5.327-1.767-8.825-.968a.627.627 0 1 1-.28-1.223c3.829-.875 7.119-.508 9.758 1.121.298.183.391.573.208.862zm1.226-2.724a.784.784 0 0 1-1.079.258c-2.7-1.66-6.816-2.14-10.01-1.171a.785.785 0 0 1-.466-1.5c3.649-1.107 8.2-.577 11.297 1.334.356.219.472.684.258 1.079zm.106-2.836C14.685 9.07 9.35 8.89 6.262 9.827a.942.942 0 1 1-.55-1.802c3.541-1.075 9.444-.863 13.208 1.37a.942.942 0 1 1-.999 1.603z" />
                </svg>
                <span>{exportedPlaylist ? 'Re-Exportar' : 'Export to Spotify'}</span>
              </>
            )}
          </button>
        </div>

        {/* Empty reserved corner buffer (guarantees Netlify floating badge cannot overlap any button) */}
        <div className="w-36 pointer-events-none" />
      </footer>
    </>
  );
};
