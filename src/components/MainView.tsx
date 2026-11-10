import React, { useState } from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { EnergyCurveChart } from './EnergyCurveChart';
import { TracklistTable } from './TracklistTable';
import { LiveWaveformPreview } from './LiveWaveformPreview';
import { GenreSelector } from './GenreSelector';
import { COGNITIVE_INTENTS } from '../algorithm/curveGenerator';
import { CognitiveFlowIntentId, IntentCategory } from '../types';
import { formatDuration } from '../utils/formatters';
import { getCamelotBadgeStyle } from '../algorithm/camelot';
import {
  Sparkles,
  Loader2,
  RotateCw,
  RefreshCw,
  Search,
  ExternalLink,
  Flame,
  Brain,
  Moon,
  Zap,
  Activity,
  Coffee,
  Palette,
  BookOpen,
  Sun,
  SlidersHorizontal,
  Clock,
  Volume2,
  Dumbbell,
  Heart,
  Compass,
  Radio,
  Layers,
  CheckCircle2,
  ArrowRight,
  Check,
  Sliders,
  AlertTriangle,
  Music,
  Plus,
  ListMusic,
  ChevronDown,
  ChevronUp,
  Disc3
} from 'lucide-react';

interface MainViewProps {
  onOpenSettings: () => void;
}

const CATEGORY_LABELS: Record<IntentCategory | 'all', { name: string; icon: React.ReactNode }> = {
  all: { name: 'All Experiences', icon: <Layers className="w-3.5 h-3.5" /> },
  focus_creativity: { name: 'Focus & Creativity', icon: <Brain className="w-3.5 h-3.5" /> },
  relaxation_emotion: { name: 'Relaxation & Emotion', icon: <Coffee className="w-3.5 h-3.5" /> },
  energy_movement: { name: 'Energy & Movement', icon: <Flame className="w-3.5 h-3.5" /> },
  journey_exploration: { name: 'Journey & Exploration', icon: <Compass className="w-3.5 h-3.5" /> }
};

const POPULAR_GENRES = [
  'Electronic',
  'Rock',
  'Indie',
  'Lo-Fi',
  'Ambient',
  'Acoustic',
  'Pop',
  'Jazz',
  'Ska',
  'Hip-Hop',
  'Metal',
  'Classical',
  'Latin',
  'Folk',
  'Reggae',
  'Punk'
];

export const MainView: React.FC<MainViewProps> = ({ onOpenSettings: _onOpenSettings }) => {
  const {
    activeTab,
    flowTracks,
    likedTracks,
    activeTrack,
    setActiveTrack,
    status,
    generateFlow,
    exportToSpotify,
    exportedPlaylist,
    pendingPlaylist,
    login,
    selectedPhaseFilter,
    setSelectedPhaseFilter,
    isMockMode,
    isSyncingLibrary,
    syncLibrary,
    flowIntent,
    setFlowIntent,
    flowControls,
    setFlowControls,
    currentPhases,
    errorMessage,
    clearError,
    flowFeedback,
    confirmFlowSatisfaction,
    isFineTuneOpen,
    setIsFineTuneOpen,
    startNewFlow,
    editMyFlow,
    regenerateThisFlow,
    flowResult,
    setIsExportModalOpen
  } = useWaveFlowStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IntentCategory | 'all'>('all');
  const [customGenreInput, setCustomGenreInput] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'tracklist' | 'journey' | 'insights'>('tracklist');

  const isGenerating =
    status.step === 'fetching' ||
    status.step === 'analyzing' ||
    status.step === 'sorting';

  const isExporting = status.step === 'exporting';
  const hasGeneratedTracks = flowTracks.length > 0;
  const isCreationMode = !hasGeneratedTracks || activeTab === 'generate';

  // Extract top genres from curated set for personal reveal
  const curatedGenres = Array.from(
    new Set(
      flowTracks
        .map((t) => t.genre_vibe || t.mood_vibe)
        .filter((g): g is string => Boolean(g && g.trim() && g !== 'balanced' && g !== 'all'))
    )
  ).slice(0, 5);

  // Combine library genres with popular palette
  const allAvailableGenres = Array.from(
    new Set([
      ...POPULAR_GENRES,
      ...likedTracks
        .map((t) => t.genre_vibe)
        .filter((g): g is string => Boolean(g && g.trim() && g !== 'balanced' && g !== 'all'))
    ])
  );

  // Compute aggregated stats
  const totalDurationMs = flowTracks.reduce((acc, t) => acc + (t.duration_ms || 210000), 0);
  const avgEnergy = flowTracks.length
    ? Math.round(
        flowTracks.reduce((acc, t) => acc + (t.energy_score ?? t.energy ?? 50), 0) /
          flowTracks.length
      )
    : 0;
  const peakEnergy = flowTracks.length
    ? Math.max(...flowTracks.map((t) => t.energy_score ?? t.energy ?? 0))
    : 0;

  // Filter for Library tab
  const filteredLibrary = likedTracks.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const intentIcons: Record<string, React.ReactNode> = {
    deep_focus: <Brain className="w-5 h-5 text-emerald-400" />,
    reading_study: <BookOpen className="w-5 h-5 text-teal-400" />,
    creative_flow: <Palette className="w-5 h-5 text-purple-400" />,
    relax_unwind: <Coffee className="w-5 h-5 text-cyan-400" />,
    mood_shift: <Heart className="w-5 h-5 text-pink-400" />,
    night_drive: <Moon className="w-5 h-5 text-indigo-400" />,
    festival_explosive: <Flame className="w-5 h-5 text-rose-400" />,
    workout: <Dumbbell className="w-5 h-5 text-red-400" />,
    morning_boost: <Sun className="w-5 h-5 text-orange-400" />,
    morning_motivation: <Sun className="w-5 h-5 text-orange-400" />,
    roadtrip: <Compass className="w-5 h-5 text-violet-400" />,
    genre_cadence: <Radio className="w-5 h-5 text-amber-400" />,
    musical_discovery: <Sparkles className="w-5 h-5 text-sky-400" />
  };

  const activeIntentConfig = COGNITIVE_INTENTS[flowIntent] || COGNITIVE_INTENTS.deep_focus;

  // Filter intentions by category (excluding backward-compat alias in the grid)
  const uniqueIntents = Object.values(COGNITIVE_INTENTS).filter(
    (item, index, self) =>
      item.id !== 'morning_motivation' && self.findIndex((i) => i.id === item.id) === index
  );

  const displayedIntents = uniqueIntents.filter(
    (intent) => selectedCategory === 'all' || intent.category === selectedCategory
  );

  const currentDurationMins = flowControls.targetDurationMins || activeIntentConfig.default_duration_mins || 60;
  const estimatedTracksCount = Math.round(currentDurationMins / 3.5);

  const selectedGenres = flowControls.selectedGenres || [];
  const genreMode = flowControls.genreMode || 'surprise';

  const handleToggleGenre = (genre: string) => {
    const exists = selectedGenres.includes(genre);
    const updated = exists
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];

    setFlowControls({
      selectedGenres: updated,
      genreMode: genreMode === 'surprise' && updated.length > 0 ? 'prefer' : genreMode
    });
  };

  const handleAddCustomGenre = () => {
    const trimmed = customGenreInput.trim();
    if (!trimmed) return;
    if (!selectedGenres.includes(trimmed)) {
      setFlowControls({
        selectedGenres: [...selectedGenres, trimmed],
        genreMode: genreMode === 'surprise' ? 'prefer' : genreMode
      });
    }
    setCustomGenreInput('');
  };

  const handlePromptStartNewFlow = () => {
    if (hasGeneratedTracks) {
      setShowResetModal(true);
    } else {
      startNewFlow();
    }
  };

  const handleConfirmReset = () => {
    setShowResetModal(false);
    startNewFlow();
  };

  return (
    <main className="flex-1 overflow-y-auto bg-zinc-900 text-white relative flex flex-col h-[calc(100vh-6rem)]">
      {/* Top Ambient Dynamic Gradient */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-emerald-950/40 via-zinc-900/80 to-zinc-900 pointer-events-none" />

      {/* Error Banner */}
      {errorMessage && (
        <div className="relative z-20 m-4 mb-0 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-300 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {(errorMessage.includes('403') ||
              errorMessage.toLowerCase().includes('permis') ||
              errorMessage.toLowerCase().includes('token')) && (
              <button
                onClick={() => login()}
                className="px-3 py-1.5 rounded-lg bg-spotify text-zinc-950 font-bold hover:bg-emerald-400 transition-colors text-xs flex items-center gap-1.5"
                title="Volver a autenticar en Spotify con todos los permisos requeridos"
              >
                <span>Reconectar Spotify</span>
              </button>
            )}
            <button
              onClick={clearError}
              className="text-rose-400 hover:text-white font-bold px-2 py-1 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 p-5 md:p-8 flex-1">
        {/* ==================== TAB 1: GENERATE FLOW (COGNITIVE DJ STUDIO) ==================== */}
        {activeTab === 'generate' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Navigation Header with Universal "Start New Flow" and Action Buttons */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-spotify uppercase mb-1">
                  <Sparkles className="w-4 h-4 text-spotify" />
                  <span>Neuroacoustic Curation Workstation</span>
                  {isMockMode && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                      Preview Mode
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                  <span>WaveFlow DJ Studio</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono font-normal hidden sm:inline">
                    Camelot Harmonic Engine
                  </span>
                </h1>
              </div>

              {/* Universal Header Actions */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <button
                  onClick={handlePromptStartNewFlow}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 hover:border-spotify/50 shadow-md transition-all hover:scale-105 active:scale-95 group"
                  title="Reset workspace and start a fresh playlist flow"
                >
                  <Sparkles className="w-4 h-4 text-spotify group-hover:scale-110 transition-transform" />
                  <span>Start New Flow</span>
                </button>

                {hasGeneratedTracks && (
                  <>
                    <button
                      onClick={() => setIsFineTuneOpen(!isFineTuneOpen)}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                        isFineTuneOpen
                          ? 'bg-spotify text-black border-spotify font-bold shadow-md shadow-spotify/20'
                          : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700'
                      }`}
                      title="Toggle the fine-tune parameter engine"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Fine-Tune</span>
                    </button>

                    <button
                      onClick={() => regenerateThisFlow()}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs border border-zinc-700 transition-all"
                      title="Generate a new set variation with identical settings"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-spotify' : ''}`} />
                      <span>Regenerate</span>
                    </button>
                  </>
                )}

                {/* Local-First IndexedDB Library Sync Button */}
                <button
                  onClick={syncLibrary}
                  disabled={isSyncingLibrary || isGenerating}
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white font-semibold text-xs transition-all border border-zinc-700 shadow-md"
                  title="Sincronizar biblioteca y actualizar vectores acústicos en IndexedDB"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLibrary ? 'animate-spin text-spotify' : ''}`} />
                  <span className="hidden sm:inline">
                    {isSyncingLibrary
                      ? 'Sincronizando...'
                      : likedTracks.length > 0
                      ? `Biblioteca (${likedTracks.length})`
                      : 'Cargar Biblioteca'}
                  </span>
                </button>
              </div>
            </div>

            {/* =========================================================================
                PART A: 1-CLICK EXPRESS FLOW INTERFACE
                (Zero friction: select experience -> 1-click synthesis, or expand fine-tuning)
               ========================================================================= */}
            {(!hasGeneratedTracks || isFineTuneOpen) && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* 1. Category Filter Pills */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                    {(Object.keys(CATEGORY_LABELS) as (IntentCategory | 'all')[]).map((catKey) => {
                      const isSelected = selectedCategory === catKey;
                      const catMeta = CATEGORY_LABELS[catKey];
                      return (
                        <button
                          key={catKey}
                          onClick={() => setSelectedCategory(catKey)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                            isSelected
                              ? 'bg-spotify text-black font-bold shadow-md'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          {catMeta.icon}
                          <span>{catMeta.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                    12 Neuroacoustic Intention Presets
                  </span>
                </div>

                {/* 2. Grid of Cognitive Intent Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {displayedIntents.map((intent) => {
                    const isSelected = flowIntent === intent.id;
                    return (
                      <button
                        key={intent.id}
                        onClick={() => {
                          setFlowIntent(intent.id);
                        }}
                        className={`text-left p-4 rounded-xl border transition-all relative group flex flex-col justify-between ${
                          isSelected
                            ? 'bg-zinc-900 border-spotify shadow-xl shadow-spotify/15 ring-2 ring-spotify/80 scale-[1.01]'
                            : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/90'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {intentIcons[intent.id]}
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  isSelected
                                    ? 'bg-spotify/20 text-spotify border-spotify/40'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}
                              >
                                {intent.badge}
                              </span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-spotify" />
                            )}
                          </div>

                          <h4 className="text-base font-bold text-white group-hover:text-spotify transition-colors leading-snug">
                            {intent.name}
                          </h4>

                          <p className="text-[11.5px] text-zinc-400 mt-1 leading-snug">
                            {intent.tagline}
                          </p>

                          <p className="text-[10.5px] text-zinc-500 mt-2 line-clamp-2 italic">
                            "{intent.musical_objective}"
                          </p>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10.5px] font-mono text-zinc-400">
                          <span className="text-spotify font-semibold">Preset: {intent.default_duration_mins}m</span>
                          <span className="text-zinc-500">{intent.phases.length} Phases</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 2.5. REACTIVE REAL-TIME TARGET WAVEFORM PREVIEW */}
                <LiveWaveformPreview />

                {/* 3. 1-CLICK EXPRESS ACTION BAR */}
                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-spotify/20 border border-spotify/40 flex items-center justify-center text-spotify shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          Selected: {activeIntentConfig.name}
                        </span>
                        <span className="text-xs px-2 py-0.2 rounded-full bg-spotify/15 text-spotify font-mono font-bold">
                          {currentDurationMins}m (~{estimatedTracksCount} tracks)
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Neuroacoustic sequencing with Camelot harmonic wheel & tempo ratio matching.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {/* Expand/Collapse Fine-Tune Engine */}
                    <button
                      onClick={() => setIsFineTuneOpen(!isFineTuneOpen)}
                      className={`px-4 py-3 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border ${
                        isFineTuneOpen
                          ? 'bg-zinc-800 text-white border-zinc-700'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-750'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-spotify" />
                      <span>{isFineTuneOpen ? 'Hide Controls' : 'Fine-Tune Engine'}</span>
                      {isFineTuneOpen ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                    </button>

                    {/* 1-CLICK EXPRESS SYNTHESIS CTA */}
                    <button
                      onClick={() => generateFlow()}
                      disabled={isGenerating}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl ${
                        isGenerating
                          ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
                          : 'bg-spotify hover:bg-spotify-hover text-black hover:scale-105 active:scale-95 shadow-spotify/30 ring-2 ring-spotify/50'
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>Synthesizing ({status.progress}%)...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 fill-current" />
                          <span>Generate Express Flow</span>
                          <ArrowRight className="w-4 h-4 ml-0.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* =========================================================================
                    EXPANDABLE "FINE-TUNE ENGINE"
                    (Revealed on demand for deep granular control: Genres, Energy, Flow, Voices, Duration)
                   ========================================================================= */}
                {isFineTuneOpen && (
                  <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl backdrop-blur-md space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-spotify" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Fine-Tune Engine — Granular Architectural Parameters
                        </h3>
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">
                        Target Set: <strong className="text-spotify">{currentDurationMins}m</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Control 1: Sound & Macro-Genre Filtering with Live Counts */}
                      <GenreSelector />

                      {/* Control 2: Energy & Trajectory Level */}
                      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-amber-400" />
                            <span>Energy & Acoustic Drive</span>
                          </span>
                          <span className="text-[11px] font-mono text-amber-400 font-semibold capitalize">
                            {flowControls.intensity || 'balanced'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'calm', label: 'Calm (-15%)' },
                            { id: 'balanced', label: 'Balanced' },
                            { id: 'intense', label: 'Intense (+15%)' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setFlowControls({ intensity: item.id as any })}
                              className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                                (flowControls.intensity || 'balanced') === item.id
                                  ? 'bg-amber-400 text-black shadow-md'
                                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        {/* Transition Style */}
                        <div className="pt-2 border-t border-zinc-800/80">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Transition Dynamics (Camelot & BPM)</span>
                            </span>
                            <span className="text-[11px] font-mono text-cyan-400 font-semibold capitalize">
                              {flowControls.transitionStyle || 'natural'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'smooth', label: 'Smooth (≤3 BPM)' },
                              { id: 'natural', label: 'Natural (±8 BPM)' },
                              { id: 'dynamic', label: 'Dynamic (±16 BPM)' }
                            ].map((style) => (
                              <button
                                key={style.id}
                                onClick={() => setFlowControls({ transitionStyle: style.id as any })}
                                className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                                  (flowControls.transitionStyle || 'natural') === style.id
                                    ? 'bg-cyan-400 text-black shadow-md'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                }`}
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Control 3: Voice Presence */}
                      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Vocal Presence & Lyrical Focus</span>
                          </span>
                          <span className="text-[11px] font-mono text-rose-400 font-semibold capitalize">
                            {flowControls.vocals || 'mixed'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'instrumental', label: 'Instrumental' },
                            { id: 'mixed', label: 'Mixed' },
                            { id: 'welcome', label: 'Vocals Welcome' }
                          ].map((voc) => (
                            <button
                              key={voc.id}
                              onClick={() => setFlowControls({ vocals: voc.id as any })}
                              className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                                (flowControls.vocals || 'mixed') === voc.id
                                  ? 'bg-rose-400 text-black shadow-md'
                                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                              }`}
                            >
                              {voc.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Control 4: Set Duration Chips */}
                      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-spotify" />
                            <span>Set Duration Packing (±5% compliance)</span>
                          </span>
                          <span className="text-[11px] font-mono text-spotify font-bold">
                            {currentDurationMins} Minutes
                          </span>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                          {[30, 45, 60, 75, 90, 120, 180].map((dur) => (
                            <button
                              key={dur}
                              onClick={() => setFlowControls({ targetDurationMins: dur })}
                              className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                                currentDurationMins === dur
                                  ? 'bg-spotify text-black shadow-md'
                                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                              }`}
                            >
                              {dur}m
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action button inside Fine-Tune Engine */}
                    <div className="flex items-center justify-end pt-2">
                      <button
                        onClick={() => generateFlow()}
                        disabled={isGenerating}
                        className="px-7 py-3 rounded-full bg-spotify hover:bg-spotify-hover text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 shadow-spotify/25 flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 fill-current" />
                        <span>Generate Custom Flow ({currentDurationMins}m)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                PART B: FINAL SCREEN (YOUR PLAYLIST)
                (Visible when hasGeneratedTracks)
               ========================================================================= */}
            {hasGeneratedTracks && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* 1. Strict Warning Banner (if library pool had limited matching tracks) */}
                {flowResult?.strictWarning && (
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2.5 backdrop-blur-md">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{flowResult.strictWarning}</span>
                  </div>
                )}

                {/* 2. Personal Authorship Reveal Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900/95 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
                  <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spotify/20 border border-spotify/40 text-spotify text-[11px] font-black uppercase tracking-wider mb-2">
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
                          <span>Personal Authorship</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                          Your Flow Is Ready.
                        </h2>
                        <p className="text-sm sm:text-base text-emerald-300 font-medium mt-1">
                          Your taste. Your choices. Your soundtrack.
                        </p>
                      </div>

                      {/* Primary Actions Suite */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Export to Spotify CTA */}
                        <button
                          onClick={() => setIsExportModalOpen(true)}
                          disabled={isExporting}
                          className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl border shrink-0 ${
                            isExporting
                              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700'
                              : 'bg-spotify hover:bg-spotify-hover text-black hover:scale-105 active:scale-95 shadow-spotify/25'
                          }`}
                          title="Export your curated soundtrack to Spotify"
                        >
                          {isExporting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-black" />
                              <span>Exporting...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.587 14.428a.627.627 0 0 1-.861.208c-2.358-1.441-5.327-1.767-8.825-.968a.627.627 0 1 1-.28-1.223c3.829-.875 7.119-.508 9.758 1.121.298.183.391.573.208.862zm1.226-2.724a.784.784 0 0 1-1.079.258c-2.7-1.66-6.816-2.14-10.01-1.171a.785.785 0 0 1-.466-1.5c3.649-1.107 8.2-.577 11.297 1.334.356.219.472.684.258 1.079zm.106-2.836C14.685 9.07 9.35 8.89 6.262 9.827a.942.942 0 1 1-.55-1.802c3.541-1.075 9.444-.863 13.208 1.37a.942.942 0 1 1-.999 1.603z" />
                              </svg>
                              <span>Export to Spotify</span>
                            </>
                          )}
                        </button>

                        {/* Open in Spotify (if already exported) */}
                        {exportedPlaylist && (
                          <a
                            href={exportedPlaylist.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-4 py-3 rounded-full bg-spotify/15 hover:bg-spotify/25 text-spotify font-bold text-xs border border-spotify/30 transition-all hover:scale-105"
                          >
                            <span>Open in Spotify</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Regenerate Set */}
                        <button
                          onClick={() => regenerateThisFlow()}
                          disabled={isGenerating}
                          className="flex items-center gap-1.5 px-4 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 transition-all hover:scale-105"
                          title="Regenerate this flow with a fresh seed"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                    </div>

                    {/* Personalized Reveal Badges */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                          Experience
                        </span>
                        <span className="text-xs font-bold text-white truncate block mt-0.5">
                          {activeIntentConfig.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 truncate block">
                          {activeIntentConfig.badge}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                          Duration
                        </span>
                        <span className="text-xs font-bold text-spotify font-mono block mt-0.5">
                          {formatDuration(totalDurationMs)}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          {flowTracks.length} tracks sequenced
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                          Energy & Intensity
                        </span>
                        <span className="text-xs font-bold text-amber-300 capitalize block mt-0.5">
                          {flowControls.intensity || 'balanced'} ({avgEnergy}%)
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          Peak {peakEnergy}% climax
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                          Transition Flow
                        </span>
                        <span className="text-xs font-bold text-cyan-300 capitalize block mt-0.5">
                          {flowControls.transitionStyle || 'natural'}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          Camelot & BPM locked
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                          Vocal Balance
                        </span>
                        <span className="text-xs font-bold text-rose-300 capitalize block mt-0.5">
                          {flowControls.vocals || 'mixed'}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          {flowControls.vocals === 'instrumental'
                            ? 'Zero distraction'
                            : 'Lyrical presence'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                          Sonic Palette
                        </span>
                        <span className="text-xs font-bold text-violet-300 truncate block mt-0.5">
                          {selectedGenres.length > 0
                            ? selectedGenres.slice(0, 2).join(', ')
                            : curatedGenres.length > 0
                            ? curatedGenres.slice(0, 2).join(', ')
                            : 'Personal Blend'}
                        </span>
                        <span className="text-[10px] text-zinc-500 block truncate">
                          From {likedTracks.length} saved tracks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Result Section Navigation Tabs (TRACKLIST IS THE DEFAULT TAB!) */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    {/* TAB 1: TRACKLIST (DEFAULT) */}
                    <button
                      onClick={() => setActiveResultTab('tracklist')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        activeResultTab === 'tracklist'
                          ? 'bg-spotify text-black shadow-lg shadow-spotify/20'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      <ListMusic className="w-4 h-4" />
                      <span>Tracklist ({flowTracks.length})</span>
                    </button>

                    {/* TAB 2: MUSIC JOURNEY (CHART) */}
                    <button
                      onClick={() => setActiveResultTab('journey')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        activeResultTab === 'journey'
                          ? 'bg-spotify text-black shadow-lg shadow-spotify/20'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                      <span>Music Journey</span>
                    </button>

                    {/* TAB 3: INSIGHTS & REFINEMENT */}
                    <button
                      onClick={() => setActiveResultTab('insights')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        activeResultTab === 'insights'
                          ? 'bg-spotify text-black shadow-lg shadow-spotify/20'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>Insights & Metrics</span>
                    </button>
                  </div>
                </div>

                {/* TAB CONTENT 1: TRACKLIST TABLE (DEFAULT VIEW) */}
                {activeResultTab === 'tracklist' && (
                  <div className="space-y-4">
                    {/* Phase Filter Quick Pills */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                        <button
                          onClick={() => setSelectedPhaseFilter('all')}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            selectedPhaseFilter === 'all'
                              ? 'bg-spotify text-black shadow-md font-bold'
                              : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 hover:text-white'
                          }`}
                        >
                          All {flowTracks.length} Tracks
                        </button>

                        {currentPhases.map((phase) => {
                          const isSelected = selectedPhaseFilter === phase.name;
                          return (
                            <button
                              key={phase.name}
                              onClick={() => setSelectedPhaseFilter(phase.name)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-zinc-100 text-black shadow-md font-bold'
                                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80 hover:text-white'
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: phase.color }}
                              />
                              <span>{phase.name}</span>
                              <span className="text-[10px] opacity-75 font-mono">
                                ({phase.trackCount})
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-xs text-zinc-400 font-mono">
                        {selectedPhaseFilter === 'all'
                          ? `Showing full set: ${flowTracks.length} tracks`
                          : `Filtered: ${selectedPhaseFilter}`}
                      </div>
                    </div>

                    {/* Spotify Sequenced Tracklist with In-Line Swapping & Camelot Keys */}
                    <div className="bg-zinc-950/70 rounded-2xl border border-zinc-800/80 p-2 shadow-2xl backdrop-blur-md">
                      <TracklistTable
                        tracks={flowTracks}
                        activeTrackId={activeTrack?.id}
                        onSelectTrack={setActiveTrack}
                        selectedPhaseFilter={selectedPhaseFilter}
                      />
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 2: MUSIC JOURNEY (CHART) */}
                {activeResultTab === 'journey' && (
                  <div className="space-y-5">
                    {/* Synchronized Real-Time Waveform & Resolved Overlay */}
                    <LiveWaveformPreview />

                    <div className="bg-zinc-950/70 rounded-2xl border border-zinc-800/80 p-5 shadow-2xl backdrop-blur-md">
                      <div className="mb-4">
                        <h3 className="text-base font-bold text-white">Neuroacoustic Energy Arc</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Visual trajectory showing energy progression, Camelot harmonic modulations, and phase climaxes.
                        </p>
                      </div>

                      <EnergyCurveChart
                        tracks={flowTracks}
                        activeTrackId={activeTrack?.id}
                        onSelectTrack={setActiveTrack}
                        selectedPhase={selectedPhaseFilter !== 'all' ? selectedPhaseFilter : undefined}
                        intentId={flowIntent}
                        phases={currentPhases}
                      />
                    </div>
                  </div>
                )}

                {/* TAB CONTENT 3: INSIGHTS & METRICS */}
                {activeResultTab === 'insights' && (
                  <div className="space-y-5">
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                          Actual Track Count
                        </span>
                        <div className="text-2xl font-black text-white mt-0.5 font-mono">
                          {flowTracks.length} tracks
                        </div>
                        <span className="text-[10px] text-zinc-500">100% unique sequence</span>
                      </div>

                      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                          Actual Duration
                        </span>
                        <div className="text-2xl font-black text-spotify mt-0.5 font-mono">
                          {formatDuration(totalDurationMs)}
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          Target: {currentDurationMins}m (±5% compliance)
                        </span>
                      </div>

                      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                          Mean Energy Vector
                        </span>
                        <div className="text-2xl font-black text-emerald-400 mt-0.5 font-mono">
                          {avgEnergy}%
                        </div>
                        <span className="text-[10px] text-zinc-500">Harmonic alignment</span>
                      </div>

                      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                          Peak Climax
                        </span>
                        <div className="text-2xl font-black text-rose-400 mt-0.5 font-mono">
                          {peakEnergy}%
                        </div>
                        <span className="text-[10px] text-zinc-500">Controlled trajectory crest</span>
                      </div>
                    </div>

                    {/* Satisfaction Confirmation */}
                    <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl">
                      {flowFeedback === 'confirmed' ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 animate-in fade-in duration-300">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-spotify shrink-0" />
                            <div>
                              <span className="text-sm font-bold text-white">This is your Flow.</span>
                              <p className="text-xs text-zinc-300 mt-0.5">
                                Satisfaction confirmed. Your soundtrack is ready to enjoy or export to Spotify.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setIsExportModalOpen(true)}
                              disabled={isExporting}
                              className="px-4 py-2 rounded-full bg-spotify hover:bg-spotify-hover text-black font-bold text-xs uppercase tracking-wider transition-all"
                            >
                              Export
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                          <div>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                              <span>Is this the flow you imagined?</span>
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Listen to the set, swap any individual track in-place, or adjust parameters.
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <button
                              onClick={confirmFlowSatisfaction}
                              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-spotify hover:bg-spotify-hover text-black font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md shadow-spotify/20"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Yes, this is my Flow</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: LIBRARY (CACHED LIKED SONGS) ==================== */}
        {activeTab === 'library' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
                  <span>Local-First Liked Library</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-spotify/15 text-spotify border border-spotify/30 font-mono font-normal">
                    {likedTracks.length} songs cached in IndexedDB
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Cached in browser IndexedDB (<code>waveflow_db</code>) with pre-computed acoustic vectors (BPM, Camelot Key, Energy, Valence).
                </p>
              </div>

              {/* Refresh / Re-Sync Library Button */}
              <button
                onClick={syncLibrary}
                disabled={isSyncingLibrary}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-spotify hover:bg-spotify-hover text-black font-bold text-xs shadow-lg transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingLibrary ? 'animate-spin' : ''}`} />
                <span>{isSyncingLibrary ? 'Sincronizando...' : 'Actualizar Biblioteca'}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks, artists or Camelot keys..."
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-spotify transition-colors"
              />
            </div>

            {/* Library Table with Camelot Keys */}
            <div className="bg-zinc-950/60 rounded-2xl border border-zinc-800/70 p-2 shadow-2xl backdrop-blur-md">
              <TracklistTable
                tracks={filteredLibrary}
                activeTrackId={activeTrack?.id}
                onSelectTrack={setActiveTrack}
                isLibraryView={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          RESET CONFIRMATION MODAL ("START NEW FLOW")
         ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-spotify">
              <div className="w-10 h-10 rounded-full bg-spotify/20 border border-spotify/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-spotify" />
              </div>
              <h3 className="text-lg font-black text-white">Start a New Flow?</h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Starting a new flow will reset your workspace and clear current unexported set results.
              <br /><br />
              Your synchronized Spotify library (<strong className="text-white">{likedTracks.length} saved songs in IndexedDB</strong>) and Spotify connection will remain active and ready.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-5 py-2 rounded-full bg-spotify hover:bg-spotify-hover text-black text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md shadow-spotify/20"
              >
                Start New Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
