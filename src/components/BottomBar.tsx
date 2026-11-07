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

    // If track has a direct 30s preview URL from Spotify
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
      // If no mp3 preview_url provided by Spotify, toggle compact Spotify embed
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

  const energyMeta = activeTrack ? getEnergyColor(activeTrack.energy) : null;
  const phaseColor = activeTrack?.phase ? getPhaseBadgeColor(activeTrack.phase) : '';

  return (
    <>
      {/* HTML5 Audio Element for 30s MP3 preview playback */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onError={() => setIsPlaying(false)}
      />

      {/* Expandable Compact Spotify Official Embed Player */}
      {showEmbedPlayer && activeTrack && (
        <div className="fixed bottom-24 left-4 z-50 w-80 md:w-96 bg-zinc-950 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden p-2 backdrop-blur-xl animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between px-2 pb-1.5 text-xs text-zinc-400">
            <span className="font-semibold flex items-center gap-1.5 text-spotify">
              <Disc3 className="w-3.5 h-3.5 animate-spin" />
              <span>Mini Reproductor Spotify</span>
            </span>
            <button
              onClick={() => setShowEmbedPlayer(false)}
              className="hover:text-white text-zinc-500 font-bold px-1"
            >
              ✕
            </button>
          </div>
          <iframe
            src={`https://open.spotify.com/embed/track/${activeTrack.id.replace('mock-track-', '37i9dQZF1DXcBWIGoYBM5M')}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl shadow"
          />
        </div>
      )}

      {/* Main Bottom Bar */}
      <footer className="h-24 bg-zinc-950 border-t border-zinc-800/80 px-4 md:px-8 flex items-center justify-between gap-4 select-none z-40 relative shadow-2xl">
        {/* LEFT: Currently Selected Track + Mini Player Controls */}
        <div className="flex items-center gap-3 w-1/3 min-w-[240px] max-w-[420px]">
          {activeTrack ? (
            <>
              {/* Album Art with interactive Play/Pause overlay */}
              <div className="relative group flex-shrink-0">
                {activeTrack.albumArt ? (
                  <img
                    src={activeTrack.albumArt}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover shadow-lg border border-zinc-800"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
                    <Music4 className="w-6 h-6" />
                  </div>
                )}

                {/* Big Play/Pause Button on artwork */}
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 bg-black/60 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg text-spotify hover:scale-105 active:scale-95 shadow-md"
                  title={isPlaying ? 'Pausar muestra' : 'Escuchar muestra de esta canción'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current text-spotify" />
                  ) : (
                    <Play className="w-6 h-6 fill-current text-white group-hover:text-spotify ml-0.5" />
                  )}
                </button>
              </div>

              {/* Title, Artist, & Controls */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white truncate">
                    {activeTrack.name}
                  </p>
                  {isPlaying && (
                    <span className="flex items-center gap-0.5 flex-shrink-0">
                      {[...Array(3)].map((_, i) => (
                        <span
                          key={i}
                          className="w-1 bg-spotify rounded-full animate-bounce"
                          style={{
                            height: '10px',
                            animationDelay: `${i * 0.15}s`
                          }}
                        />
                      ))}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">
                  {activeTrack.artist}
                </p>

                {/* Badges + Player Action pills */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {/* Phase badge */}
                  {activeTrack.phase && (
                    <span
                      className={`text-[9.5px] px-2 py-0.5 rounded-full border font-bold ${phaseColor}`}
                    >
                      {activeTrack.phase}
                    </span>
                  )}

                  {/* Energy pill */}
                  {energyMeta && (
                    <span
                      className={`text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold ${energyMeta.text} ${energyMeta.bg} border ${energyMeta.border}`}
                    >
                      {activeTrack.energy}% Energía
                    </span>
                  )}

                  {/* Escuchar / Embed Trigger */}
                  <button
                    onClick={togglePlay}
                    className="text-[10px] text-zinc-300 hover:text-white px-2 py-0.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center gap-1 transition-colors border border-zinc-700/60"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3 h-3 text-spotify" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 text-spotify" />
                        <span>Escuchar</span>
                      </>
                    )}
                  </button>

                  {/* Open on Spotify link */}
                  <a
                    href={`https://open.spotify.com/track/${activeTrack.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-500 hover:text-spotify transition-colors"
                    title="Abrir en Spotify"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-zinc-500">
              <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Music4 className="w-6 h-6 text-zinc-600" />
              </div>
              <div className="text-xs">
                <p className="text-zinc-400 font-semibold">Ninguna canción seleccionada</p>
                <p className="text-zinc-600">Haz clic en cualquier pista para escucharla</p>
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Status & Progress Engine */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-lg px-2">
          {/* Status Message */}
          <div className="flex items-center gap-2 mb-2">
            {status.step === 'idle' && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                <span>WaveFlow listo para mezclar</span>
              </span>
            )}

            {(status.step === 'fetching' ||
              status.step === 'analyzing' ||
              status.step === 'sorting' ||
              status.step === 'exporting') && (
              <span className="flex items-center gap-2 text-xs font-semibold text-spotify">
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

          {/* Equalizer animation when playing preview */}
          {isPlaying && (
            <div className="flex items-center gap-1 mt-2 h-3">
              {[...Array(18)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-spotify rounded-full"
                  style={{
                    height: `${Math.max(20, Math.sin(i * 0.7 + currentTime * 4) * 100)}%`,
                    animation: `wave 0.7s ease-in-out infinite alternate ${i * 0.04}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Export to Spotify CTA (Elevated above any corner badges) */}
        <div className="flex items-center justify-end gap-3 w-1/3 min-w-[200px] max-w-[380px] pr-28 md:pr-36" style={{ marginRight: "115px" }}>
          {/* Link to exported Spotify Playlist */}
          {exportedPlaylist && (
            <a
              href={exportedPlaylist.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-spotify transition-colors border border-spotify/30 hover:scale-105"
              title="Abrir playlist en Spotify"
            >
              <span>Abrir en Spotify</span>
              <ExternalLink className="w-3.5 h-3.5 text-spotify" />
            </a>
          )}

          {/* Main Export Button */}
          <button
            onClick={exportToSpotify}
            disabled={!hasTracks || isExporting}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl ${
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
      </footer>
    </>
  );
};
