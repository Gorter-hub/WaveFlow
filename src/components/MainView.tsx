import React, { useState } from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { EnergyCurveChart } from './EnergyCurveChart';
import { TracklistTable } from './TracklistTable';
import { COGNITIVE_INTENTS } from '../algorithm/curveGenerator';
import { CognitiveFlowIntentId, IntentCategory, WizardStep } from '../types';
import { formatDuration } from '../utils/formatters';
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
  ArrowLeft,
  Check,
  Sliders,
  Undo2,
  AlertTriangle,
  Music,
  Plus,
  X,
  ListMusic
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
    isRefining,
    storedPreviousResult,
    confirmFlowSatisfaction,
    startRefinement,
    cancelRefinement,
    wizardStep,
    isWizardMode,
    setWizardStep,
    startNewFlow,
    editMyFlow,
    regenerateThisFlow,
    flowResult
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
  const isCreationWizardActive = isWizardMode || !hasGeneratedTracks;

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
    if (hasGeneratedTracks || wizardStep > 1) {
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
      {/* Dynamic Top Ambient Gradient */}
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

      {/* Main Content Sections Based on Tab */}
      <div className="relative z-10 p-6 md:p-8 flex-1">
        {/* ==================== TAB 1: GENERATE FLOW (COGNITIVE DJ STUDIO) ==================== */}
        {activeTab === 'generate' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Navigation Header with Universal "Start New Flow" and Action Buttons */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-spotify uppercase mb-1">
                  <Sparkles className="w-4 h-4 text-spotify" />
                  <span>Adaptive Music Experience Builder</span>
                  {isMockMode && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                      Preview Mode
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
                  WaveFlow DJ Studio
                </h1>
              </div>

              {/* Universal Header Actions */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                {/* 1. START NEW FLOW BUTTON (Always visible across wizard & results) */}
                <button
                  onClick={handlePromptStartNewFlow}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 hover:border-spotify/50 shadow-md transition-all hover:scale-105 active:scale-95 group"
                  title="Reset workspace and start a fresh playlist flow"
                >
                  <Sparkles className="w-4 h-4 text-spotify group-hover:scale-110 transition-transform" />
                  <span>Start New Flow</span>
                </button>

                {/* If on final results screen, show quick action shortcuts */}
                {!isCreationWizardActive && (
                  <>
                    <button
                      onClick={() => editMyFlow(7)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs border border-zinc-700 transition-all"
                      title="Return to wizard to adjust parameters"
                    >
                      <Sliders className="w-3.5 h-3.5 text-spotify" />
                      <span>Edit My Flow</span>
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

                {/* Sync / Update Library button */}
                <button
                  onClick={syncLibrary}
                  disabled={isSyncingLibrary || isGenerating}
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white font-semibold text-xs transition-all border border-zinc-700 shadow-md"
                  title="Sincronizar biblioteca completa desde Spotify"
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
                PART A: STEP-BY-STEP CREATION WIZARD (Visible when isCreationWizardActive)
                ONLY ONE STEP IS RENDERED AT A TIME!
               ========================================================================= */}
            {isCreationWizardActive ? (
              <div className="space-y-6">
                {/* 7-Step Progress Bar Indicator */}
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-spotify text-black font-black text-xs flex items-center justify-center">
                        {wizardStep}
                      </span>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-spotify">
                          Step {wizardStep} of 7
                        </span>
                        <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                          {wizardStep === 1 && 'Choose Your Experience'}
                          {wizardStep === 2 && 'Choose Your Sound (Genres)'}
                          {wizardStep === 3 && 'Shape Your Energy'}
                          {wizardStep === 4 && 'Define Your Flow (Transitions)'}
                          {wizardStep === 5 && 'Choose the Voices'}
                          {wizardStep === 6 && 'Set the Duration'}
                          {wizardStep === 7 && 'Review Your Journey'}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                        <button
                          key={s}
                          onClick={() => setWizardStep(s as WizardStep)}
                          className={`w-7 h-2 rounded-full transition-all ${
                            s === wizardStep
                              ? 'bg-spotify w-10'
                              : s < wizardStep
                              ? 'bg-emerald-500/60'
                              : 'bg-zinc-800'
                          }`}
                          title={`Jump to Step ${s}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* -------------------- STEP 1: CHOOSE YOUR EXPERIENCE -------------------- */}
                {wizardStep === 1 && (
                  <div className="bg-zinc-950/85 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-5 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">What emotional space do you want to explore?</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Choose an intention to guide pacing, trajectory, and harmonic arcs.
                        </p>
                      </div>

                      {/* Category Filter Tabs */}
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
                    </div>

                    {/* 12 Presets Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                      {displayedIntents.map((intent) => {
                        const isSelected = flowIntent === intent.id;
                        return (
                          <button
                            key={intent.id}
                            onClick={() => {
                              setFlowIntent(intent.id);
                              setFlowControls({
                                targetDurationMins: intent.default_duration_mins
                              });
                            }}
                            className={`text-left p-4 rounded-xl border transition-all relative group flex flex-col justify-between ${
                              isSelected
                                ? 'bg-zinc-900 border-spotify shadow-xl shadow-spotify/15 ring-2 ring-spotify/80'
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
                              <span>Default: {intent.default_duration_mins}m</span>
                              <span className="text-zinc-500">{intent.phases.length} Phases</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Step 1 Navigation Bar */}
                    <div className="flex items-center justify-end pt-4 border-t border-zinc-800/80">
                      <button
                        onClick={() => setWizardStep(2)}
                        className="flex items-center gap-2 px-7 py-3 rounded-full bg-spotify hover:bg-spotify-hover text-black font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-spotify/25"
                      >
                        <span>Continue to Sound</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* -------------------- STEP 2: CHOOSE YOUR SOUND (GENRES) -------------------- */}
                {wizardStep === 2 && (
                  <div className="bg-zinc-950/85 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-5 animate-in fade-in duration-300">
                    <div className="border-b border-zinc-800/80 pb-3">
                      <h3 className="text-lg font-bold text-white">Define the sonic palette for your playlist</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Choose how strictly your musical taste guides the track selection from your library.
                      </p>
                    </div>

                    {/* 3 Genre Mode Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <button
                        onClick={() => setFlowControls({ genreMode: 'surprise' })}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          genreMode === 'surprise'
                            ? 'bg-zinc-900 border-spotify shadow-lg ring-1 ring-spotify'
                            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-spotify uppercase tracking-wider">
                            Option A
                          </span>
                          {genreMode === 'surprise' && <CheckCircle2 className="w-4 h-4 text-spotify" />}
                        </div>
                        <h4 className="text-sm font-bold text-white">Surprise Me</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Draws freely from across all genres in your saved library, creating an eclectic, unpredictable mix.
                        </p>
                      </button>

                      <button
                        onClick={() => setFlowControls({ genreMode: 'prefer' })}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          genreMode === 'prefer'
                            ? 'bg-zinc-900 border-amber-400 shadow-lg ring-1 ring-amber-400'
                            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                            Option B (Recommended)
                          </span>
                          {genreMode === 'prefer' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                        </div>
                        <h4 className="text-sm font-bold text-white">Prefer These Genres</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Gives heavy priority (+40 bonus) to selected genres while blending naturally with complementary tracks.
                        </p>
                      </button>

                      <button
                        onClick={() => setFlowControls({ genreMode: 'strict' })}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          genreMode === 'strict'
                            ? 'bg-zinc-900 border-rose-400 shadow-lg ring-1 ring-rose-400'
                            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                            Option C
                          </span>
                          {genreMode === 'strict' && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                        </div>
                        <h4 className="text-sm font-bold text-white">Only These Genres</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Strict filtering: only tracks matching selected genres are allowed. Zero unwanted genres in your flow.
                        </p>
                      </button>
                    </div>

                    {/* Genre Tag Selection */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Select Genres ({selectedGenres.length} selected)
                        </span>
                        {selectedGenres.length > 0 && (
                          <button
                            onClick={() => setFlowControls({ selectedGenres: [] })}
                            className="text-[11px] text-zinc-500 hover:text-white underline"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Multi-select Pills */}
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                        {allAvailableGenres.map((genre) => {
                          const isSelected = selectedGenres.includes(genre);
                          return (
                            <button
                              key={genre}
                              onClick={() => handleToggleGenre(genre)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-spotify text-black font-bold shadow-md shadow-spotify/20'
                                  : 'bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-600'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              <span>{genre}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Genre Input */}
                      <div className="flex items-center gap-2 max-w-md pt-1">
                        <input
                          type="text"
                          value={customGenreInput}
                          onChange={(e) => setCustomGenreInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomGenre();
                            }
                          }}
                          placeholder="Add custom genre tag (e.g. Synthwave, Bossa Nova, Ska)..."
                          className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-spotify"
                        />
                        <button
                          onClick={handleAddCustomGenre}
                          disabled={!customGenreInput.trim()}
                          className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Step 2 Navigation Bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                      <button
                        onClick={() => setWizardStep(1)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>

                      <button
                        onClick={() => setWizardStep(3)}
                        className="flex items-center gap-2 px-7 py-3 rounded-full bg-spotify hover:bg-spotify-hover text-black font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-spotify/25"
                      >
                        <span>Continue to Energy</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* -------------------- STEP 3: SHAPE YOUR ENERGY -------------------- */}
                {wizardStep === 3 && (
                  <div className="bg-zinc-950/85 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-5 animate-in fade-in duration-300">
                    <div className="border-b border-zinc-800/80 pb-3">
                      <h3 className="text-lg font-bold text-white">How intense should this journey feel?</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Calibrate the baseline energy trajectory and acoustic drive.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          id: 'calm',
                          label: 'Calm',
                          tagline: 'Subdued & Peaceful (-15% Energy)',
                          desc: 'Keeps acoustic energy low and steady. Avoids harsh drops or intense peaks, fostering tranquility or deep reading.',
                          color: 'text-cyan-400',
                          border: 'border-cyan-500/40'
                        },
                        {
                          id: 'balanced',
                          label: 'Balanced',
                          tagline: 'Natural Ebb & Flow',
                          desc: 'Maintains authentic dynamic range and organic musical crests matching the native character of your saved tracks.',
                          color: 'text-amber-400',
                          border: 'border-amber-500/40'
                        },
                        {
                          id: 'intense',
                          label: 'Intense',
                          tagline: 'Driving & High-Voltage (+15% Energy)',
                          desc: 'Pushes high-octane rhythms and soaring climaxes. Ideal for workouts, high-focus bursts, and peak festival vibes.',
                          color: 'text-rose-400',
                          border: 'border-rose-500/40'
                        }
                      ].map((item) => {
                        const isSelected = (flowControls.intensity || 'balanced') === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setFlowControls({ intensity: item.id as any })}
                            className={`text-left p-5 rounded-xl border transition-all ${
                              isSelected
                                ? `bg-zinc-900 ${item.border} shadow-xl ring-2 ring-current ${item.color}`
                                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-xs font-black uppercase tracking-wider ${item.color}`}>
                                {item.label}
                              </span>
                              {isSelected && <CheckCircle2 className="w-5 h-5" />}
                            </div>
                            <h4 className="text-sm font-bold text-white">{item.tagline}</h4>
                            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{item.desc}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Step 3 Navigation Bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                      <button
                        onClick={() => setWizardStep(2)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>

                      <button
                        onClick={() => setWizardStep(4)}
                        className="flex items-center gap-2 px-7 py-3 rounded-full bg-spotify hover:bg-spotify-hover text-black font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-spotify/25"
                      >
                        <span>Continue to Flow</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* -------------------- STEP 4: DEFINE YOUR FLOW (TRANSITIONS) -------------------- */}
                {wizardStep === 4 && (
                  <div className="bg-zinc-950/85 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-5 animate-in fade-in duration-300">
                    <div className="border-b border-zinc-800/80 pb-3">
                      <h3 className="text-lg font-bold text-white">How should tracks connect and transition?</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Controls tempo tolerance windows (BPM) and harmonic continuity between consecutive songs.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          id: 'smooth',
                          label: 'Smooth Transition',
                          tagline: 'Strict Tempo Lock (±3 BPM)',
                          desc: 'Tight BPM continuity and gentle valence shifts. Minimizes jarring jumps to protect cognitive focus.',
                          color: 'text-emerald-400'
                        },
                        {
                          id: 'natural',
                          label: 'Natural Transition',
                          tagline: 'Organic Pacing (±8 BPM)',
                          desc: 'Flowing, comfortable transitions that allow reasonable tempo movement without losing the overall groove.',
                          color: 'text-cyan-400'
                        },
                        {
                          id: 'dynamic',
                          label: 'Dynamic Transition',
                          tagline: 'Contrast & Variety (±16 BPM)',
                          desc: 'Permits exciting energy jumps, dramatic tempo shifts, and bold drops for adventurous listening.',
                          color: 'text-violet-400'
                        }
                      ].map((item) => {
                        const isSelected = (flowControls.transitionStyle || 'natural') === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setFlowControls({ transitionStyle: item.id as any })}
                            className={`text-left p-5 rounded-xl border transition-all ${
                              isSelected
                                ? `bg-zinc-900 border-spotify shadow-xl ring-2 ring-spotify`
                                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-xs font-black uppercase tracking-wider ${item.color}`}>
                                {item.label}
                              </span>
                              {isSelected && <CheckCircle2 className="w-5 h-5 text-spotify" />}
                            </div>
                            <h4 className="text-sm font-bold text-white">{item.tagline}</h4>
                            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{item.desc}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Step 4 Navigation Bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                      <button
                        onClick={() => setWizardStep(3)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>

                      <button
                        onClick={() => setWizardStep(5)}
                        className="flex items-center gap-2 px-7 py-3 rounded-full bg-spotify hover:bg-spotify-hover text-black font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-spotify/25"
                      >
                        <span>Continue to Voices</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* -------------------- STEP 5: CHOOSE THE VOICES -------------------- */}
                {wizardStep === 5 && (
                  <div className="bg-zinc-950/85 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-5 animate-in fade-in duration-300">
                    <div className="border-b border-zinc-800/80 pb-3">
                      <h3 className="text-lg font-bold text-white">What vocal presence fits your session?</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Filter songs by lyrical content to minimize distraction or amplify vocal melodies.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          id: 'instrumental',
                          label: 'Mostly Instrumental',
                          tagline: 'Zero Vocal Distraction',
                          desc: 'Prioritizes beats, synthesizers, acoustic guitars, and ambient arrangements with minimal or no singing.',
                          color: 'text-indigo-400'
                        },
                        {
                          id: 'mixed',
                          label: 'Mixed',
                          tagline: 'Balanced Blend',
                          desc: 'A versatile combination of vocal anthems and instrumental grooves across the playlist progression.',
                          color: 'text-amber-400'
                        },
                        {
                          id: 'welcome',
                          label: 'Vocals Welcome',
                          tagline: 'Lyrical & Song-Driven',
                          desc: 'Emphasizes vocals, lead singers, hooks, and narrative tracks for immersive listening and sing-alongs.',
                          color: 'text-rose-400'
                        }
                      ].map((item) => {
                        const isSelected = (flowControls.vocals || 'mixed') === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setFlowControls({ vocals: item.id as any })}
                            className={`text-left p-5 rounded-xl border transition-all ${
                              isSelected
                                ? `bg-zinc-900 border-spotify shadow-xl ring-2 ring-spotify`
                                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-xs font-black uppercase tracking-wider ${item.color}`}>
                                {item.label}
                              </span>
                              {isSelected && <CheckCircle2 className="w-5 h-5 text-spotify" />}
                            </div>
                            <h4 className="text-sm font-bold text-white">{item.tagline}</h4>
                            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{item.desc}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Step 5 Navigation Bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                      <button
                        onClick={() => setWizardStep(4)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>

                      <button
                        onClick={() => setWizardStep(6)}
                        className="flex items-center gap-2 px-7 py-3 rounded-full bg-spotify hover:bg-spotify-hover text-black font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-spotify/25"
                      >
                        <span>Continue to Duration</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* -------------------- STEP 6: SET THE DURATION -------------------- */}
                {wizardStep === 6 && (
                  <div className="bg-zinc-950/85 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-5 animate-in fade-in duration-300">
                    <div className="border-b border-zinc-800/80 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-white">How long should this flow last?</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          WaveFlow precisely packs tracks to achieve your target duration within ±5% compliance.
                        </p>
                      </div>
                      <div className="text-xs font-mono text-spotify font-bold">
                        Target: {currentDurationMins}m (~{estimatedTracksCount} tracks)
                      </div>
                    </div>

                    {/* Duration Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                      {[30, 45, 60, 75, 90, 120, 180].map((mins) => {
                        const isSelected = currentDurationMins === mins;
                        return (
                          <button
                            key={mins}
                            onClick={() => setFlowControls({ targetDurationMins: mins })}
                            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-spotify text-black border-spotify font-bold shadow-lg shadow-spotify/20 scale-105'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            <span className="text-base font-black font-mono">{mins}m</span>
                            <span className="text-[10.5px] opacity-80 mt-0.5">
                              ~{Math.round(mins / 3.5)} tracks
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Contextual Fine-Tuning Module (if applicable to selected intent) */}
                    {flowIntent === 'mood_shift' && (
                      <div className="p-4 rounded-xl bg-pink-950/30 border border-pink-500/30 space-y-3">
                        <span className="text-xs font-bold text-pink-300 uppercase tracking-wider block">
                          Mood Shift Trajectory Planner
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-zinc-400 block mb-1.5">Where you are now:</span>
                            <div className="grid grid-cols-3 gap-1">
                              {(['calm', 'neutral', 'tired', 'restless', 'low', 'energized'] as const).map((m) => (
                                <button
                                  key={m}
                                  onClick={() => setFlowControls({ moodShiftCurrent: m })}
                                  className={`py-1 rounded text-xs capitalize ${
                                    flowControls.moodShiftCurrent === m
                                      ? 'bg-pink-500 text-white font-bold'
                                      : 'bg-zinc-800 text-zinc-300'
                                  }`}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-zinc-400 block mb-1.5">Where you want to be:</span>
                            <div className="grid grid-cols-3 gap-1">
                              {(['relaxed', 'focused', 'uplifted', 'motivated', 'energized', 'reflective'] as const).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => setFlowControls({ moodShiftTarget: t })}
                                  className={`py-1 rounded text-xs capitalize ${
                                    flowControls.moodShiftTarget === t
                                      ? 'bg-emerald-500 text-black font-bold'
                                      : 'bg-zinc-800 text-zinc-300'
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 6 Navigation Bar */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                      <button
                        onClick={() => setWizardStep(5)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>

                      <button
                        onClick={() => setWizardStep(7)}
                        className="flex items-center gap-2 px-7 py-3 rounded-full bg-spotify hover:bg-spotify-hover text-black font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-spotify/25"
                      >
                        <span>Review Your Journey</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* -------------------- STEP 7: REVIEW YOUR JOURNEY -------------------- */}
                {wizardStep === 7 && (
                  <div className="bg-zinc-950/85 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in duration-300">
                    <div className="border-b border-zinc-800/80 pb-3">
                      <h3 className="text-xl font-black text-white">Review Your Journey</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Your choices calibrate the neuroscience arc, track selection, and transition physics.
                      </p>
                    </div>

                    {/* Summary Matrix of 6 Choices */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {/* 1. Experience */}
                      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">
                              1. Experience
                            </span>
                            <button
                              onClick={() => setWizardStep(1)}
                              className="text-[11px] text-spotify hover:underline font-semibold"
                            >
                              Edit
                            </button>
                          </div>
                          <h4 className="text-base font-bold text-white">{activeIntentConfig.name}</h4>
                          <p className="text-xs text-zinc-400 mt-1">{activeIntentConfig.tagline}</p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 mt-3 block">
                          {activeIntentConfig.badge}
                        </span>
                      </div>

                      {/* 2. Sound / Genres */}
                      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">
                              2. Sound & Genres
                            </span>
                            <button
                              onClick={() => setWizardStep(2)}
                              className="text-[11px] text-spotify hover:underline font-semibold"
                            >
                              Edit
                            </button>
                          </div>
                          <h4 className="text-base font-bold text-white capitalize">
                            {genreMode === 'surprise' && 'Surprise Me (All Genres)'}
                            {genreMode === 'prefer' && 'Prefer Selected Genres'}
                            {genreMode === 'strict' && 'Strict Genre Lock'}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1 truncate">
                            {selectedGenres.length > 0
                              ? selectedGenres.join(', ')
                              : 'Drawing from all library styles'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 mt-3 block">
                          {selectedGenres.length} tags specified
                        </span>
                      </div>

                      {/* 3. Energy */}
                      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">
                              3. Energy Level
                            </span>
                            <button
                              onClick={() => setWizardStep(3)}
                              className="text-[11px] text-spotify hover:underline font-semibold"
                            >
                              Edit
                            </button>
                          </div>
                          <h4 className="text-base font-bold text-white capitalize">
                            {flowControls.intensity || 'balanced'}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1">
                            {flowControls.intensity === 'calm' && 'Subdued, peaceful low intensity'}
                            {flowControls.intensity === 'intense' && 'Driving, high-voltage momentum'}
                            {(!flowControls.intensity || flowControls.intensity === 'balanced') &&
                              'Natural dynamic ebb and flow'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 mt-3 block">
                          Calibrated trajectory
                        </span>
                      </div>

                      {/* 4. Flow */}
                      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">
                              4. Transition Style
                            </span>
                            <button
                              onClick={() => setWizardStep(4)}
                              className="text-[11px] text-spotify hover:underline font-semibold"
                            >
                              Edit
                            </button>
                          </div>
                          <h4 className="text-base font-bold text-white capitalize">
                            {flowControls.transitionStyle || 'natural'}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1">
                            {flowControls.transitionStyle === 'smooth' && 'Strict BPM delta (≤3 BPM)'}
                            {flowControls.transitionStyle === 'dynamic' && 'Contrast jumps (±16 BPM)'}
                            {(!flowControls.transitionStyle ||
                              flowControls.transitionStyle === 'natural') &&
                              'Flowing pacing (±8 BPM)'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 mt-3 block">
                          Harmonic cadence
                        </span>
                      </div>

                      {/* 5. Voices */}
                      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">
                              5. Vocal Presence
                            </span>
                            <button
                              onClick={() => setWizardStep(5)}
                              className="text-[11px] text-spotify hover:underline font-semibold"
                            >
                              Edit
                            </button>
                          </div>
                          <h4 className="text-base font-bold text-white capitalize">
                            {flowControls.vocals || 'mixed'}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1">
                            {flowControls.vocals === 'instrumental' && 'Minimal vocal distraction'}
                            {flowControls.vocals === 'welcome' && 'Vocal-forward lyrical focus'}
                            {(!flowControls.vocals || flowControls.vocals === 'mixed') &&
                              'Balanced instrumental & vocal mix'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 mt-3 block">
                          Cognitive filter
                        </span>
                      </div>

                      {/* 6. Duration */}
                      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">
                              6. Target Duration
                            </span>
                            <button
                              onClick={() => setWizardStep(6)}
                              className="text-[11px] text-spotify hover:underline font-semibold"
                            >
                              Edit
                            </button>
                          </div>
                          <h4 className="text-base font-bold text-spotify font-mono">
                            {currentDurationMins} Minutes
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1">
                            Packing approximately {estimatedTracksCount} tracks
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 mt-3 block">
                          ±5% strict duration compliance
                        </span>
                      </div>
                    </div>

                    {/* Step 7 Creation Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
                      <button
                        onClick={() => setWizardStep(6)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>

                      {/* PRIMARY SYNTHESIS CTA BUTTON */}
                      <button
                        onClick={() => generateFlow()}
                        disabled={isGenerating}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-9 py-4 rounded-full font-black text-sm tracking-wide transition-all duration-200 shadow-2xl ${
                          isGenerating
                            ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
                            : 'bg-spotify hover:bg-spotify-hover text-black hover:scale-105 active:scale-95 shadow-spotify/40 ring-2 ring-spotify/50'
                        }`}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-black" />
                            <span>Synthesizing ({status.progress}%)...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 fill-current" />
                            <span>Create My Playlist</span>
                            <ArrowRight className="w-5 h-5 ml-0.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* =========================================================================
                  PART B: FINAL SCREEN (YOUR PLAYLIST)
                  Visible when !isCreationWizardActive && hasGeneratedTracks
                 ========================================================================= */
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
                          onClick={exportToSpotify}
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

                        {/* Edit Flow */}
                        <button
                          onClick={() => editMyFlow(7)}
                          className="flex items-center gap-1.5 px-4 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider border border-zinc-700 transition-all hover:scale-105"
                          title="Review or adjust parameters in wizard"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Edit My Flow</span>
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
                          Harmonic cadence
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

                    {/* TAB 3: INSIGHTS & SATISFACTION */}
                    <button
                      onClick={() => setActiveResultTab('insights')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                        activeResultTab === 'insights'
                          ? 'bg-spotify text-black shadow-lg shadow-spotify/20'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>Insights & Refine</span>
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

                    {/* Spotify Sequenced Tracklist */}
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
                  <div className="space-y-4">
                    <div className="bg-zinc-950/70 rounded-2xl border border-zinc-800/80 p-5 shadow-2xl backdrop-blur-md">
                      <div className="mb-4">
                        <h3 className="text-base font-bold text-white">Neuroscience Energy Arc</h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Visual trajectory showing energy progression, harmonic transitions, and phase climaxes.
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

                {/* TAB CONTENT 3: INSIGHTS & REFINEMENT */}
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
                        <span className="text-[10px] text-zinc-500">Smooth valence alignment</span>
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

                    {/* Satisfaction Question & Actions */}
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
                              onClick={() => editMyFlow(7)}
                              className="text-xs text-zinc-400 hover:text-white underline px-3 py-1.5 transition-colors"
                            >
                              Edit Parameters
                            </button>
                            <button
                              onClick={exportToSpotify}
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
                              Listen to the set, explore the energy wave, or adjust any parameter to match your vision.
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

                            <button
                              onClick={() => editMyFlow(7)}
                              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all border border-zinc-700"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Adjust Parameters</span>
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
                  <span>Persistent Liked Library</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-spotify/15 text-spotify border border-spotify/30 font-mono font-normal">
                    {likedTracks.length} songs cached
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Your songs are permanently cached locally with pre-computed acoustic vectors (Energy, Valence, BPM, Vocals).
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
                placeholder="Search tracks or artists in your library..."
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-spotify transition-colors"
              />
            </div>

            {/* Library Table */}
            <div className="bg-zinc-950/60 rounded-2xl border border-zinc-800/70 p-2 shadow-2xl backdrop-blur-md">
              <TracklistTable
                tracks={filteredLibrary}
                activeTrackId={activeTrack?.id}
                onSelectTrack={setActiveTrack}
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
              Starting a new flow will reset your wizard configuration back to Step 1 and clear current unexported set results.
              <br /><br />
              Your synchronized Spotify library (<strong className="text-white">{likedTracks.length} saved songs</strong>) and Spotify account connection will remain ready.
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