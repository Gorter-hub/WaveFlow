import React, { useState, useEffect } from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { COGNITIVE_INTENTS } from '../algorithm/curveGenerator';
import {
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  CheckCircle2,
  Music,
  Clock,
  Zap,
  Lock,
  Edit3
} from 'lucide-react';

export const ExportModal: React.FC = () => {
  const {
    isExportModalOpen,
    setIsExportModalOpen,
    flowTracks,
    flowIntent,
    flowResult,
    status,
    errorMessage,
    exportedPlaylist,
    pendingPlaylist,
    exportToSpotify,
    user
  } = useWaveFlowStore();

  const intentConfig = COGNITIVE_INTENTS[flowIntent] || COGNITIVE_INTENTS.deep_focus;

  // Custom name state: default to intent name without prefix (the prefix "Flow | " is fixed)
  const [nameSuffix, setNameSuffix] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Sync default values when modal opens or intent changes
  useEffect(() => {
    if (isExportModalOpen) {
      setNameSuffix(intentConfig.name);
      setCustomDescription(
        `${intentConfig.tagline}. Calibrado por WaveFlow AI con arquitectura neuroacústica.`
      );
    }
  }, [isExportModalOpen, intentConfig]);

  if (!isExportModalOpen) return null;

  const isExporting = status.step === 'exporting';
  const isExported = status.step === 'exported' && Boolean(exportedPlaylist);

  const durationMins = Math.round(
    (flowResult?.computed_total_duration_ms ||
      flowTracks.reduce((acc, t) => acc + (t.duration_ms || 210000), 0)) / 60000
  );

  // Clean cleaned suffix (strips any accidentally typed 'Flow |' or 'Flow -')
  const cleanSuffix = nameSuffix
    .trim()
    .replace(/^(Flow\s*\|\s*|Flow\s*-\s*|WaveFlow:\s*)/i, '');
  const finalPlaylistName = `Flow | ${cleanSuffix || intentConfig.name}`;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExporting) return;
    await exportToSpotify(cleanSuffix || intentConfig.name, customDescription);
  };

  const handleClose = () => {
    if (isExporting) return;
    setIsExportModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Background Gradient */}
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ backgroundColor: intentConfig.color || '#1ed760' }}
        />

        {/* Modal Close Button */}
        <button
          onClick={handleClose}
          disabled={isExporting}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors disabled:opacity-40"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#1ed760]/15 border border-[#1ed760]/30 flex items-center justify-center text-[#1ed760] shrink-0 shadow-lg shadow-[#1ed760]/10">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.587 14.428a.627.627 0 0 1-.861.208c-2.358-1.441-5.327-1.767-8.825-.968a.627.627 0 1 1-.28-1.223c3.829-.875 7.119-.508 9.758 1.121.298.183.391.573.208.862zm1.226-2.724a.784.784 0 0 1-1.079.258c-2.7-1.66-6.816-2.14-10.01-1.171a.785.785 0 0 1-.466-1.5c3.649-1.107 8.2-.577 11.297 1.334.356.219.472.684.258 1.079zm.106-2.836C14.685 9.07 9.35 8.89 6.262 9.827a.942.942 0 1 1-.55-1.802c3.541-1.075 9.444-.863 13.208 1.37a.942.942 0 1 1-.999 1.603z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Exportar a Spotify</span>
              {user && (
                <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
                  @{user.display_name}
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Personaliza el nombre de tu playlist antes de enviarla a tu cuenta.
            </p>
          </div>
        </div>

        {/* Curated Set Overview Pill Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 mb-5 text-center text-xs">
          <div className="flex flex-col items-center justify-center p-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-spotify" />
              <span>Intención</span>
            </span>
            <span className="font-bold text-white text-xs mt-0.5 truncate max-w-[120px]">
              {intentConfig.name}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-1.5 border-x border-zinc-800">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
              <Music className="w-3 h-3 text-cyan-400" />
              <span>Canciones</span>
            </span>
            <span className="font-bold text-white text-xs mt-0.5 font-mono">
              {flowTracks.length} tracks
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Duración</span>
            </span>
            <span className="font-bold text-white text-xs mt-0.5 font-mono">
              ~{durationMins} min
            </span>
          </div>
        </div>

        {/* Retry Banner if pending playlist exists */}
        {pendingPlaylist && !isExported && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>
              Reintentando añadir canciones faltantes a la playlist creada: <strong>{pendingPlaylist.name}</strong>
            </span>
          </div>
        )}

        {/* SUCCESS CELEBRATION STATE */}
        {isExported && exportedPlaylist ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-spotify/20 border-2 border-spotify flex items-center justify-center mx-auto text-spotify shadow-xl shadow-spotify/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-lg font-black text-white">¡Playlist Exportada con Éxito!</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Tu playlist ya está disponible en tu biblioteca de Spotify con todas sus transiciones optimizadas.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-spotify/30 text-center">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Nombre en Spotify:
              </span>
              <span className="text-base font-extrabold text-spotify font-mono mt-0.5 block">
                {exportedPlaylist.name}
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={exportedPlaylist.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-spotify hover:bg-spotify-hover text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-spotify/25 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Abrir en Spotify</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-5 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* FORM STATE */
          <form onSubmit={handleExport} className="space-y-4">
            {/* Input with LOCKED "Flow | " prefix */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-spotify" />
                  <span>Nombre de la Playlist</span>
                </span>
                <span className="text-[10px] font-normal text-zinc-500">
                  Prefijo <strong className="text-spotify font-mono">Flow |</strong> fijo
                </span>
              </label>

              {/* Compound Input: [ Flow | ] [ User Custom Name ] */}
              <div className="flex items-center rounded-2xl bg-zinc-900 border border-zinc-800 focus-within:border-spotify focus-within:ring-2 focus-within:ring-spotify/30 overflow-hidden transition-all shadow-inner">
                {/* Immutable Left Prefix Pill */}
                <div className="flex items-center gap-1 px-3.5 py-3 bg-zinc-850 border-r border-zinc-800 text-spotify font-mono font-black text-sm select-none shrink-0">
                  <span>Flow |</span>
                </div>

                {/* Editable Suffix Field */}
                <input
                  type="text"
                  value={nameSuffix}
                  onChange={(e) => setNameSuffix(e.target.value)}
                  placeholder="Ej: Enfoque Nocturno, Carretera 90s, Ritmo Gym..."
                  disabled={isExporting}
                  className="flex-1 bg-transparent px-3 py-3 text-sm text-white placeholder-zinc-500 font-medium focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Real-Time Result Preview Pill */}
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-[11px] text-zinc-400">
                <span className="text-zinc-500">Se guardará como:</span>
                <strong className="text-white font-mono truncate">{finalPlaylistName}</strong>
              </div>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Descripción (opcional)
              </label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                disabled={isExporting}
                rows={2}
                placeholder="Descripción para tu playlist en Spotify..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-spotify focus:ring-1 focus:ring-spotify/30 resize-none transition-all"
              />
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Active Exporting Progress Bar */}
            {isExporting && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-spotify" />
                    <span>{status.message}</span>
                  </span>
                  <span className="text-spotify font-bold">{status.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-spotify to-emerald-400 transition-all duration-300 rounded-full"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Modal Bottom Action CTAs */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isExporting || flowTracks.length === 0}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl ${
                  isExporting
                    ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
                    : 'bg-spotify hover:bg-spotify-hover text-black hover:scale-105 active:scale-95 shadow-spotify/25 ring-2 ring-spotify/40'
                }`}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Exportando a Spotify...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.587 14.428a.627.627 0 0 1-.861.208c-2.358-1.441-5.327-1.767-8.825-.968a.627.627 0 1 1-.28-1.223c3.829-.875 7.119-.508 9.758 1.121.298.183.391.573.208.862zm1.226-2.724a.784.784 0 0 1-1.079.258c-2.7-1.66-6.816-2.14-10.01-1.171a.785.785 0 0 1-.466-1.5c3.649-1.107 8.2-.577 11.297 1.334.356.219.472.684.258 1.079zm.106-2.836C14.685 9.07 9.35 8.89 6.262 9.827a.942.942 0 1 1-.55-1.802c3.541-1.075 9.444-.863 13.208 1.37a.942.942 0 1 1-.999 1.603z" />
                    </svg>
                    <span>Confirmar y Exportar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
