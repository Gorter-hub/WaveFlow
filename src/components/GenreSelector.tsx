import React, { useMemo } from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { MACRO_GENRES, MacroGenre, getMacroGenreCounts } from '../utils/genreTaxonomy';
import { Disc3, Check, Sparkles, Filter, ShieldAlert } from 'lucide-react';

interface GenreSelectorProps {
  compact?: boolean;
}

export const GenreSelector: React.FC<GenreSelectorProps> = ({ compact = false }) => {
  const { likedTracks, flowControls, setFlowControls } = useWaveFlowStore();

  const selectedGenres = flowControls.selectedGenres || [];
  const genreMode = flowControls.genreMode || (selectedGenres.length > 0 ? 'prefer' : 'surprise');

  // Compute live counts for each macro-genre physically present in the user's library
  const genreCounts = useMemo(() => {
    return getMacroGenreCounts(likedTracks);
  }, [likedTracks]);

  // Filter to show macro-genres that are present in user's library (count > 0)
  // or fall back to popular macro-genres if library is not yet loaded
  const availableGenres = useMemo(() => {
    const present = MACRO_GENRES.filter((g) => (genreCounts[g] || 0) > 0);
    if (present.length > 0) {
      // Sort by track count descending
      return present.sort((a, b) => (genreCounts[b] || 0) - (genreCounts[a] || 0));
    }
    return MACRO_GENRES;
  }, [genreCounts]);

  const handleToggleGenre = (genre: MacroGenre) => {
    const exists = selectedGenres.includes(genre);
    const updated = exists
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];

    setFlowControls({
      selectedGenres: updated,
      genreMode: genreMode === 'surprise' && updated.length > 0 ? 'prefer' : genreMode
    });
  };

  const handleSelectAllPresent = () => {
    setFlowControls({
      selectedGenres: [...availableGenres],
      genreMode: genreMode === 'surprise' ? 'prefer' : genreMode
    });
  };

  const handleClearAll = () => {
    setFlowControls({
      selectedGenres: [],
      genreMode: 'surprise'
    });
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-850 shadow-inner">
      {/* Header and Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-800/70">
        <div className="flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-spotify" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Taxonomía de Géneros
          </span>
          <span className="text-[10.5px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono">
            {likedTracks.length > 0 ? `${likedTracks.length} tracks analizados` : 'Biblioteca local'}
          </span>
        </div>

        {/* Mode Selector Buttons */}
        <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setFlowControls({ genreMode: 'surprise' })}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
              genreMode === 'surprise'
                ? 'bg-spotify text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Permite que el algoritmo explore libremente cualquier género de tu biblioteca"
          >
            Surprise Me
          </button>

          <button
            type="button"
            onClick={() => setFlowControls({ genreMode: 'prefer' })}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
              genreMode === 'prefer'
                ? 'bg-spotify text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Prioriza los géneros seleccionados con bonificación de afinidad (+35)"
          >
            Prefer (+35)
          </button>

          <button
            type="button"
            onClick={() => setFlowControls({ genreMode: 'strict' })}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
              genreMode === 'strict'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Filtro duro booleano no negociable: bloquea 100% cualquier pista no coincidente"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Strict Only</span>
          </button>
        </div>
      </div>

      {/* Mode Description Banner */}
      <div className="text-[11px] text-zinc-400 flex items-center justify-between">
        <span>
          {genreMode === 'surprise' && 'Exploración abierta: el setlist puede transicionar entre todos los géneros guardados.'}
          {genreMode === 'prefer' && 'Preferencia suave: se favorecen los géneros marcados manteniendo fluidez armónica.'}
          {genreMode === 'strict' && (
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 shrink-0" />
              <span>Compuerta Dura: NINGUNA canción fuera de los géneros seleccionados será evaluada.</span>
            </span>
          )}
        </span>

        {selectedGenres.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[10px] text-zinc-500 hover:text-rose-400 underline transition-colors shrink-0 ml-2"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Dynamic Macro-Genre Pills with Live Library Counts */}
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pt-1 pr-1">
        {availableGenres.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          const count = genreCounts[genre] || 0;

          return (
            <button
              key={genre}
              type="button"
              onClick={() => handleToggleGenre(genre)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                isSelected
                  ? genreMode === 'strict'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-md ring-1 ring-rose-500/40'
                    : 'bg-spotify text-black font-bold border-spotify shadow-md ring-1 ring-spotify/40'
                  : count > 0
                  ? 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white hover:bg-zinc-850'
                  : 'bg-zinc-900/40 text-zinc-500 border-zinc-800/40 opacity-60'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              <span>{genre}</span>
              {likedTracks.length > 0 && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? genreMode === 'strict'
                        ? 'bg-rose-500/30 text-rose-200'
                        : 'bg-black/25 text-black'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
