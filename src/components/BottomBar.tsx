import React, { useState, useRef, useEffect } from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { formatDuration, getEnergyColor, getPhaseBadgeColor } from '../utils/formatters';
import { djAudioSynth } from '../utils/audioSynth';
import { resolveTrackAudioPreview, prefetchUpcomingPreviews } from '../utils/audioResolver';
import {
  ExternalLink,
  Loader2,
  Sparkles,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music4,
  Activity
} from 'lucide-react';

export const BottomBar: React.FC = () => {
  const {
    activeTrack,
    isPlaying,
    togglePlay,
    skipNext,
    skipPrevious,
    status,
    flowTracks,
    exportToSpotify,
    exportedPlaylist,
    pendingPlaylist,
    setIsExportModalOpen
  } = useWaveFlowStore();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [hasRealAudio, setHasRealAudio] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<number | null>(null);

  const isExporting = status.step === 'exporting';
  const hasTracks = flowTracks.length > 0;

  // Global Keyboard shortcuts: Space = Play/Pause, ArrowRight = Next, ArrowLeft = Prev
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skipNext, skipPrevious]);

  // Real Audio Resolution & Playback
  useEffect(() => {
    let isCancelled = false;
    setCurrentTime(0);

    const playActiveAudio = async () => {
      if (!activeTrack) return;
      setIsLoadingAudio(true);

      try {
        // Resolve real authentic 30s studio audio recording with original vocals & instruments
        const audioUrl = await resolveTrackAudioPreview(activeTrack);
        if (isCancelled) return;

        if (audioUrl && audioRef.current) {
          setHasRealAudio(true);
          djAudioSynth.stop();
          if (synthTimerRef.current) {
            clearInterval(synthTimerRef.current);
            synthTimerRef.current = null;
          }

          audioRef.current.src = audioUrl;
          audioRef.current.load();
          await audioRef.current.play();
          setIsLoadingAudio(false);

          // Pre-fetch upcoming tracks in background
          prefetchUpcomingPreviews(flowTracks, (activeTrack.overallIndex || 1) - 1, 4);
          return;
        }
      } catch (err) {
        console.warn('Real audio resolution error, falling back:', err);
      }

      if (isCancelled) return;
      setIsLoadingAudio(false);

      // Fallback only if no preview exists online
      setHasRealAudio(false);
      if (audioRef.current) audioRef.current.pause();
      djAudioSynth.playTrackPreview(
        activeTrack.bpm || 124,
        activeTrack.energy_score || 50,
        activeTrack.valence_score || 50
      );

      // Advance timer for synthesized preview (30s)
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
      let sec = 0;
      synthTimerRef.current = window.setInterval(() => {
        sec += 1;
        setCurrentTime(sec);
        if (sec >= 30) {
          skipNext();
        }
      }, 1000);
    };

    if (isPlaying && activeTrack) {
      playActiveAudio();
    } else {
      setIsLoadingAudio(false);
      if (audioRef.current) audioRef.current.pause();
      djAudioSynth.stop();
      if (synthTimerRef.current) {
        clearInterval(synthTimerRef.current);
        synthTimerRef.current = null;
      }
    }

    return () => {
      isCancelled = true;
      if (synthTimerRef.current) {
        clearInterval(synthTimerRef.current);
        synthTimerRef.current = null;
      }
    };
  }, [isPlaying, activeTrack?.id, skipNext, flowTracks]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
    djAudioSynth.setMuted(next);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && hasRealAudio) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleAudioEnded = () => {
    // Continuous playback: automatically play the next track in set!
    skipNext();
  };

  const energyVal = activeTrack?.energy_score ?? activeTrack?.energy ?? 50;
  const energyMeta = activeTrack ? getEnergyColor(energyVal) : null;
  const phaseColor = activeTrack?.phase ? getPhaseBadgeColor(activeTrack.phase) : '';

  return (
    <>
      {/* HTML5 Audio Element for authentic 30s studio audio previews */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onError={() => {
          if (activeTrack && isPlaying) {
            setHasRealAudio(false);
            djAudioSynth.playTrackPreview(
              activeTrack.bpm || 124,
              activeTrack.energy_score || 50,
              activeTrack.valence_score || 50
            );
          }
        }}
        preload="auto"
      />

      {/* BOTTOM CONTROL DOCK */}
      <footer className="w-full h-24 bg-zinc-950 border-t border-zinc-800 px-4 md:px-6 flex items-center justify-between relative z-40 fixed bottom-0 left-0 right-0 shadow-[0_-10px_25px_rgba(0,0,0,0.7)] select-none">
        {/* LEFT: Currently Playing / Selected Track Info */}
        <div className="flex items-center gap-3 w-1/3 min-w-[200px] max-w-[340px]">
          {activeTrack ? (
            <>
              {/* Album Art with instant Play/Pause click */}
              <div
                className="relative group w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer shadow-md border border-zinc-800"
                onClick={togglePlay}
                title={isPlaying ? 'Pausar (Space)' : 'Reproducir Canción Real (Space)'}
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

                {/* Animated green playing dot */}
                {isPlaying && (
                  <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-spotify animate-ping" />
                )}
              </div>

              {/* Title, Artist & Real Audio Pill */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    onClick={togglePlay}
                    className="font-bold text-sm text-white truncate leading-tight hover:underline cursor-pointer"
                    title={activeTrack.name}
                  >
                    {activeTrack.name}
                  </p>
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

                {/* Audio Type Indicator & Phase Badge */}
                <div className="flex items-center gap-2 mt-1">
                  {activeTrack.phase && (
                    <span
                      className={`text-[9.5px] font-semibold px-2 py-0.2 rounded-full border ${phaseColor}`}
                    >
                      {activeTrack.phase}
                    </span>
                  )}

                  {hasRealAudio ? (
                    <span className="text-[9.5px] text-emerald-400 flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Audio Real (30s)
                    </span>
                  ) : (
                    <span
                      className="text-[9.5px] text-amber-400 flex items-center gap-1 font-mono"
                      title="Groove sintetizado al tempo de la canción"
                    >
                      <Activity className="w-3 h-3 text-amber-400" />
                      Groove {activeTrack.bpm || 124} BPM
                    </span>
                  )}

                  {/* Open in Spotify link */}
                  <a
                    href={`https://open.spotify.com/track/${activeTrack.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9.5px] text-zinc-500 hover:text-spotify flex items-center gap-0.5 ml-1"
                    title="Abrir canción completa en Spotify"
                  >
                    <span>Spotify</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
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

        {/* CENTER: Audio Player Controls (Back, Play/Pause, Next, Time Scrubber) */}
        <div className="flex flex-col items-center justify-center max-w-md w-full px-4">
          <div className="flex items-center gap-5 mb-1.5">
            {/* Mute button */}
            <button
              onClick={toggleMute}
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
              title={isMuted ? 'Desmutear' : 'Mutear'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* PREVIOUS TRACK BUTTON */}
            <button
              onClick={skipPrevious}
              disabled={!activeTrack}
              className={`p-2 text-zinc-300 hover:text-white transition-all ${
                activeTrack ? 'hover:scale-110 active:scale-90 cursor-pointer' : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Canción Anterior (← Flecha Izquierda)"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* PLAY / PAUSE BUTTON WITH LOADING SPINNER */}
            <button
              onClick={togglePlay}
              disabled={!activeTrack}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-xl ${
                activeTrack
                  ? 'bg-spotify hover:bg-spotify-hover text-black shadow-spotify/30 hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
              title={isPlaying ? 'Pausar (Barra Espaciadora)' : 'Reproducir Canción Real (Barra Espaciadora)'}
            >
              {isLoadingAudio ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current text-black" />
              ) : (
                <Play className="w-5 h-5 fill-current text-black ml-0.5" />
              )}
            </button>

            {/* NEXT TRACK BUTTON */}
            <button
              onClick={skipNext}
              disabled={!activeTrack}
              className={`p-2 text-zinc-300 hover:text-white transition-all ${
                activeTrack ? 'hover:scale-110 active:scale-90 cursor-pointer' : 'text-zinc-600 cursor-not-allowed'
              }`}
              title="Siguiente Canción (→ Flecha Derecha)"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Equalizer Waveform Animation when playing */}
            {isPlaying && (
              <div className="flex items-center gap-0.5 h-4 ml-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-spotify rounded-full"
                    style={{
                      height: `${Math.max(25, Math.sin(i * 1.2 + currentTime * 6) * 100)}%`,
                      animation: `wave 0.5s ease-in-out infinite alternate ${i * 0.08}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Time Scrubber Bar */}
          <div className="w-full flex items-center gap-2 max-w-sm">
            <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">
              0:{Math.floor(currentTime).toString().padStart(2, '0')}
            </span>

            <div className="flex-1 bg-zinc-800 rounded-full h-1 relative overflow-hidden group cursor-pointer">
              <div
                className={`h-full transition-all duration-200 rounded-full ${
                  isPlaying ? 'bg-spotify shadow-[0_0_6px_rgba(29,185,84,0.6)]' : 'bg-zinc-500'
                }`}
                style={{ width: `${Math.min(100, (currentTime / Math.max(1, duration)) * 100)}%` }}
              />
            </div>

            <span className="text-[10px] font-mono text-zinc-500 w-7">
              0:{Math.floor(duration).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* RIGHT: Export to Spotify CTA (Safely shifted away from bottom-right corner) */}
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
            onClick={() => setIsExportModalOpen(true)}
            disabled={!hasTracks || isExporting}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl ${
              !hasTracks || isExporting
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                : pendingPlaylist
                ? 'bg-amber-400 hover:bg-amber-300 text-black hover:scale-105 active:scale-95 shadow-amber-400/30'
                : 'bg-spotify hover:bg-spotify-hover text-black hover:scale-105 active:scale-95 shadow-spotify/30'
            }`}
            title={
              pendingPlaylist
                ? `Reintentar agregar canciones a la playlist "${pendingPlaylist.name}"`
                : 'Exportar set a Spotify'
            }
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>{pendingPlaylist ? 'Reintentando...' : 'Exportando...'}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.587 14.428a.627.627 0 0 1-.861.208c-2.358-1.441-5.327-1.767-8.825-.968a.627.627 0 1 1-.28-1.223c3.829-.875 7.119-.508 9.758 1.121.298.183.391.573.208.862zm1.226-2.724a.784.784 0 0 1-1.079.258c-2.7-1.66-6.816-2.14-10.01-1.171a.785.785 0 0 1-.466-1.5c3.649-1.107 8.2-.577 11.297 1.334.356.219.472.684.258 1.079zm.106-2.836C14.685 9.07 9.35 8.89 6.262 9.827a.942.942 0 1 1-.55-1.802c3.541-1.075 9.444-.863 13.208 1.37a.942.942 0 1 1-.999 1.603z" />
                </svg>
                <span>
                  {pendingPlaylist
                    ? 'Reintentar Exportar'
                    : exportedPlaylist
                    ? 'Re-Exportar'
                    : 'Export to Spotify'}
                </span>
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
