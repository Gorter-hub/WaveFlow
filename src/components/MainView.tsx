import React, { useState } from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { EnergyCurveChart } from './EnergyCurveChart';
import { TracklistTable } from './TracklistTable';
import { COGNITIVE_INTENTS } from '../algorithm/curveGenerator';
import { CognitiveFlowIntentId, IntentCategory } from '../types';
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
  Check,
  Sliders,
  Undo2,
  Music,
  Headphones
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
    cancelRefinement
  } = useWaveFlowStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IntentCategory | 'all'>('all');
  const [customGenreInput, setCustomGenreInput] = useState('');

  const isGenerating =
    status.step === 'fetching' ||
    status.step === 'analyzing' ||
    status.step === 'sorting';

  const isExporting = status.step === 'exporting';
  const hasGeneratedTracks = flowTracks.length > 0;

  // Extract top genres from curated set for the personal reveal
  const curatedGenres = Array.from(
    new Set(
      flowTracks
        .map((t) => t.genre_vibe || t.mood_vibe)
        .filter((g): g is string => Boolean(g && g.trim() && g !== 'balanced' && g !== 'all'))
    )
  ).slice(0, 5);

  // Common genres available in the user's liked library + standard genres
  const availableLibraryGenres = Array.from(
    new Set([
      'All Genres',
      ...likedTracks
        .map((t) => t.genre_vibe)
        .filter((g): g is string => Boolean(g && g.trim() && g !== 'balanced' && g !== 'all')),
      'Electronic',
      'Rock',
      'Indie',
      'Lo-Fi',
      'Ambient',
      'Acoustic',
      'Pop',
      'Jazz',
      'Ska'
    ])
  ).slice(0, 10);

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

  // Filter intentions by category (excluding the backward-compat alias in the grid)
  const uniqueIntents = Object.values(COGNITIVE_INTENTS).filter(
    (item, index, self) =>
      item.id !== 'morning_motivation' && self.findIndex((i) => i.id === item.id) === index
  );

  const displayedIntents = uniqueIntents.filter(
    (intent) => selectedCategory === 'all' || intent.category === selectedCategory
  );

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
            {/* Hero / Header Card with Prominent Action Buttons */}
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 pb-2">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-spotify uppercase mb-2">
                  <Sparkles className="w-4 h-4 text-spotify" />
                  <span>Adaptive Music Experience Builder</span>
                  {isMockMode && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                      Preview Mode
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                  WaveFlow DJ Studio
                </h1>
                <p className="text-sm md:text-base text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                  Choose a listening experience, fine-tune your parameters, and synthesize a complete, duration-calibrated playlist from your liked songs.
                </p>
              </div>

              {/* Action Buttons: Generate Flow + Top Export to Spotify + Sync */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Generate Playlist Primary Action */}
                <button
                  onClick={generateFlow}
                  disabled={isGenerating}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-black text-sm tracking-wide transition-all duration-200 shadow-xl ${
                    isGenerating
                      ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
                      : 'bg-spotify hover:bg-spotify-hover text-black hover:scale-105 active:scale-95 shadow-spotify/30 ring-2 ring-spotify/50'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-black" />
                      <span>Synthesizing ({status.progress}%)...</span>
                    </>
                  ) : hasGeneratedTracks ? (
                    <>
                      <RotateCw className="w-5 h-5 text-black" />
                      <span>Re-Generate Set ({flowControls.targetDurationMins || activeIntentConfig.default_duration_mins}m)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 fill-current" />
                      <span>Generate Playlist ({flowControls.targetDurationMins || activeIntentConfig.default_duration_mins}m)</span>
                    </>
                  )}
                </button>

                {/* Top Export Button */}
                <button
                  onClick={exportToSpotify}
                  disabled={!hasGeneratedTracks || isExporting}
                  className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl border ${
                    !hasGeneratedTracks || isExporting
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700/50'
                      : pendingPlaylist
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 hover:border-amber-400 hover:scale-105 shadow-amber-500/20'
                      : 'bg-zinc-950 hover:bg-zinc-900 text-spotify border-spotify/50 hover:border-spotify hover:scale-105 shadow-spotify/20'
                  }`}
                  title={
                    pendingPlaylist
                      ? `Reintentar agregar canciones a la playlist creada "${pendingPlaylist.name}"`
                      : 'Export this curated cognitive set to Spotify'
                  }
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-spotify" />
                      <span>{pendingPlaylist ? 'Reintentando...' : 'Exporting...'}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 fill-current text-spotify" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.587 14.428a.627.627 0 0 1-.861.208c-2.358-1.441-5.327-1.767-8.825-.968a.627.627 0 1 1-.28-1.223c3.829-.875 7.119-.508 9.758 1.121.298.183.391.573.208.862zm1.226-2.724a.784.784 0 0 1-1.079.258c-2.7-1.66-6.816-2.14-10.01-1.171a.785.785 0 0 1-.466-1.5c3.649-1.107 8.2-.577 11.297 1.334.356.219.472.684.258 1.079zm.106-2.836C14.685 9.07 9.35 8.89 6.262 9.827a.942.942 0 1 1-.55-1.802c3.541-1.075 9.444-.863 13.208 1.37a.942.942 0 1 1-.999 1.603z" />
                      </svg>
                      <span>
                        {pendingPlaylist
                          ? 'Retry Export to Spotify'
                          : exportedPlaylist
                          ? 'Re-Export to Spotify'
                          : 'Export to Spotify'}
                      </span>
                    </>
                  )}
                </button>

                {/* If already exported, show open link */}
                {exportedPlaylist && (
                  <a
                    href={exportedPlaylist.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-3.5 rounded-full bg-spotify/15 hover:bg-spotify/25 text-spotify font-bold text-xs border border-spotify/30 transition-all hover:scale-105"
                  >
                    <span>Open in Spotify</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {/* Sync / Update Library button */}
                <button
                  onClick={syncLibrary}
                  disabled={isSyncingLibrary || isGenerating}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white font-semibold text-xs transition-all border border-zinc-700 shadow-md"
                  title="Sincronizar biblioteca completa desde Spotify"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingLibrary ? 'animate-spin text-spotify' : ''}`} />
                  <span className="hidden sm:inline">
                    {isSyncingLibrary
                      ? 'Sincronizando...'
                      : likedTracks.length > 0
                      ? `Actualizar (${likedTracks.length})`
                      : 'Cargar Biblioteca'}
                  </span>
                </button>
              </div>
            </div>

            {/* =========================================================================
                AUTHORSHIP PROGRESSION STEPPER (Discovery → Creation → Ownership)
               ========================================================================= */}
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Step 1: Discovery */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    !hasGeneratedTracks
                      ? 'bg-spotify/10 border-spotify/40 shadow-sm'
                      : 'bg-zinc-900/40 border-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                        !hasGeneratedTracks
                          ? 'bg-spotify text-black'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      1
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Discovery
                    </span>
                  </div>
                  <p className="text-[11.5px] text-zinc-400 leading-snug">
                    Discover what you want to hear. Choose an emotional destination for your soundtrack.
                  </p>
                </div>

                {/* Step 2: Creation */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    !hasGeneratedTracks
                      ? 'bg-zinc-900/70 border-zinc-700/60'
                      : 'bg-zinc-900/40 border-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                        !hasGeneratedTracks
                          ? 'bg-zinc-700 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      2
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Creation
                    </span>
                  </div>
                  <p className="text-[11.5px] text-zinc-400 leading-snug">
                    Shape your soundscape. Every choice calibrates energy, transitions, and duration.
                  </p>
                </div>

                {/* Step 3: Ownership */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    hasGeneratedTracks
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                      : 'bg-zinc-900/40 border-zinc-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                        hasGeneratedTracks
                          ? 'bg-spotify text-black'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      3
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Ownership
                    </span>
                  </div>
                  <p className="text-[11.5px] text-zinc-400 leading-snug">
                    Your personal soundtrack. Curated by your choices, refined to your vision.
                  </p>
                </div>
              </div>
            </div>

            {/* =========================================================================
                STAGE 1: CHOOSE YOUR LISTENING EXPERIENCE (12 Core Intentions)
               ========================================================================= */}
            <div className="bg-zinc-950/85 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-spotify/20 border border-spotify/50 text-spotify text-[11px] font-black flex items-center justify-center">1</span>
                    <span>1. Discovery — Discover Your Soundtrack</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    What emotional space do you want to explore? Choose an intention to guide your musical journey.
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
                      onClick={() => setFlowIntent(intent.id)}
                      className={`text-left p-4 rounded-xl border transition-all relative group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-zinc-900 border-spotify shadow-xl shadow-spotify/15 ring-2 ring-spotify/80'
                          : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/90'
                      }`}
                    >
                      <div>
                        {/* Header Badge & Icon */}
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

                        {/* Title */}
                        <h4 className="text-base font-bold text-white group-hover:text-spotify transition-colors leading-snug">
                          {intent.name}
                        </h4>

                        {/* Tagline */}
                        <p className="text-[11.5px] text-zinc-400 mt-1 leading-snug">
                          {intent.tagline}
                        </p>

                        {/* Musical Objective */}
                        <p className="text-[10.5px] text-zinc-500 mt-2 line-clamp-2 italic">
                          "{intent.musical_objective}"
                        </p>
                      </div>

                      {/* Bottom Footer Info */}
                      <div className="mt-4 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10.5px] font-mono text-zinc-400">
                        <span>Default: {intent.default_duration_mins}m</span>
                        <span className="text-zinc-500">{intent.phases.length} Phases</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* =========================================================================
                STAGE 2: CREATION — SHAPE THE SOUNDSCAPE
               ========================================================================= */}
            <div className="bg-zinc-950/85 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-spotify/20 border border-spotify/50 text-spotify text-[11px] font-black flex items-center justify-center">2</span>
                    <span>2. Creation — Shape the Soundscape</span>
                    <span className="text-xs text-zinc-400 font-normal ml-2">
                      (Configured for <strong className="text-spotify">{activeIntentConfig.name}</strong>)
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Make this journey yours. Fine-tune duration, energy progression, transition flow, and vocals.
                  </p>
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  Target Set Duration: <strong className="text-spotify">{flowControls.targetDurationMins || activeIntentConfig.default_duration_mins} Minutes</strong>
                </div>
              </div>

              {/* 4 Primary Customization Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Control 1: Duration Selector */}
                <div className="space-y-2 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                  <label className="text-zinc-300 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-spotify" />
                      <span>Playlist Duration</span>
                    </span>
                    <span className="text-spotify font-mono font-bold">
                      {flowControls.targetDurationMins || activeIntentConfig.default_duration_mins}m
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[30, 45, 60, 90, 120, 180].map((dur) => (
                      <button
                        key={dur}
                        onClick={() => setFlowControls({ targetDurationMins: dur })}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all ${
                          (flowControls.targetDurationMins || activeIntentConfig.default_duration_mins) === dur
                            ? 'bg-spotify text-black shadow-md'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                        }`}
                      >
                        {dur}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Control 2: Energy Level */}
                <div className="space-y-2 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                  <label className="text-zinc-300 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      <span>Energy Level</span>
                    </span>
                    <span className="text-amber-400 capitalize font-mono">
                      {flowControls.intensity || 'balanced'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'calm', label: 'Calm' },
                      { id: 'balanced', label: 'Balanced' },
                      { id: 'intense', label: 'Intense' }
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => setFlowControls({ intensity: lvl.id as any })}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all ${
                          (flowControls.intensity || 'balanced') === lvl.id
                            ? 'bg-amber-400 text-black font-bold shadow-md'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Control 3: Transition Style */}
                <div className="space-y-2 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                  <label className="text-zinc-300 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Transition Style</span>
                    </span>
                    <span className="text-cyan-400 capitalize font-mono">
                      {flowControls.transitionStyle || 'natural'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'smooth', label: 'Smooth' },
                      { id: 'natural', label: 'Natural' },
                      { id: 'dynamic', label: 'Dynamic' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setFlowControls({ transitionStyle: style.id as any })}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all ${
                          (flowControls.transitionStyle || 'natural') === style.id
                            ? 'bg-cyan-400 text-black font-bold shadow-md'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Control 4: Vocal Presence */}
                <div className="space-y-2 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                  <label className="text-zinc-300 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Vocal Presence</span>
                    </span>
                    <span className="text-rose-400 capitalize font-mono">
                      {flowControls.vocals || 'mixed'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'instrumental', label: 'Instrumental' },
                      { id: 'mixed', label: 'Mixed' },
                      { id: 'welcome', label: 'Vocals OK' }
                    ].map((voc) => (
                      <button
                        key={voc.id}
                        onClick={() => setFlowControls({ vocals: voc.id as any })}
                        className={`py-1.5 px-1 rounded-lg text-[10.5px] font-semibold transition-all ${
                          (flowControls.vocals || 'mixed') === voc.id
                            ? 'bg-rose-400 text-black font-bold shadow-md'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                        }`}
                      >
                        {voc.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CONTEXTUAL CONTROLS (Shown ONLY when relevant) */}
              {/* Contextual Control: Mood Shift */}
              {flowIntent === 'mood_shift' && (
                <div className="p-4 rounded-xl bg-pink-950/25 border border-pink-500/30 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-pink-400" />
                      <span>Mood Shift Trajectory Planner</span>
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Guides emotional valence & arousal from start to target
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* How I feel now */}
                    <div>
                      <span className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                        How I feel right now:
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {(['calm', 'neutral', 'tired', 'restless', 'low', 'energized'] as const).map((mood) => (
                          <button
                            key={mood}
                            onClick={() => setFlowControls({ moodShiftCurrent: mood })}
                            className={`py-1.5 px-1 rounded-lg text-xs capitalize font-medium transition-all ${
                              flowControls.moodShiftCurrent === mood
                                ? 'bg-pink-500 text-white font-bold shadow-md'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            {mood}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* How I want to feel */}
                    <div>
                      <span className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                        How I want to feel:
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {(['relaxed', 'focused', 'uplifted', 'motivated', 'energized', 'reflective'] as const).map(
                          (target) => (
                            <button
                              key={target}
                              onClick={() => setFlowControls({ moodShiftTarget: target })}
                              className={`py-1.5 px-1 rounded-lg text-xs capitalize font-medium transition-all ${
                                flowControls.moodShiftTarget === target
                                  ? 'bg-emerald-500 text-black font-bold shadow-md'
                                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                              }`}
                            >
                              {target}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contextual Control: Genre & Cadence Lock */}
              {flowIntent === 'genre_cadence' && (
                <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-amber-300">Preferred Groove & Genre Focus</span>
                      <p className="text-[11px] text-zinc-400">Filter your library by preferred rhythmic style</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'All Grooves' },
                      { id: 'electronic', label: 'Electronic / House' },
                      { id: 'rock', label: 'Rock / Indie' },
                      { id: 'dub', label: 'Dub / Reggae' },
                      { id: 'acoustic', label: 'Acoustic / Jazz' }
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setFlowControls({ genrePreference: g.id })}
                        className={`py-1 px-2.5 rounded-md text-xs font-medium transition-all ${
                          (flowControls.genrePreference || 'all') === g.id
                            ? 'bg-amber-400 text-black font-bold'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contextual Control: Reading & Studying */}
              {flowIntent === 'reading_study' && (
                <div className="p-3.5 rounded-xl bg-teal-950/25 border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    <div>
                      <span className="text-xs font-bold text-teal-300">Study Task Specialization</span>
                      <p className="text-[11px] text-zinc-400">Optimizes acoustic texture according to cognitive load</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'reading', label: 'Reading & Retention' },
                      { id: 'writing', label: 'Writing & Drafting' },
                      { id: 'studying', label: 'Technical Study' }
                    ].map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setFlowControls({ studyTaskType: task.id as any })}
                        className={`py-1 px-3 rounded-md text-xs font-medium transition-all ${
                          (flowControls.studyTaskType || 'reading') === task.id
                            ? 'bg-teal-400 text-black font-bold'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {task.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contextual Control: Workout */}
              {flowIntent === 'workout' && (
                <div className="p-3.5 rounded-xl bg-red-950/25 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-red-400" />
                    <div>
                      <span className="text-xs font-bold text-red-300">Workout Cadence Profile</span>
                      <p className="text-[11px] text-zinc-400">Controls energy acceleration and tempo dynamics</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'sustained', label: 'Sustained High Drive' },
                      { id: 'intervals', label: 'HIIT / Intervals' },
                      { id: 'power', label: 'Power Climax' }
                    ].map((w) => (
                      <button
                        key={w.id}
                        onClick={() => setFlowControls({ workoutProfile: w.id as any })}
                        className={`py-1 px-3 rounded-md text-xs font-medium transition-all ${
                          (flowControls.workoutProfile || 'sustained') === w.id
                            ? 'bg-red-500 text-white font-bold'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contextual Control: Musical Discovery */}
              {flowIntent === 'musical_discovery' && (
                <div className="p-3.5 rounded-xl bg-sky-950/25 border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <div>
                      <span className="text-xs font-bold text-sky-300">Discovery Novelty Weight</span>
                      <p className="text-[11px] text-zinc-400">Balances between familiar favorites and overlooked library tracks</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'balanced', label: 'Balanced Discovery' },
                      { id: 'deep_cuts', label: 'Deep Library Cuts' },
                      { id: 'adventurous', label: 'Adventurous Bridges' }
                    ].map((disc) => (
                      <button
                        key={disc.id}
                        onClick={() => setFlowControls({ discoveryNovelty: disc.id as any })}
                        className={`py-1 px-3 rounded-md text-xs font-medium transition-all ${
                          (flowControls.discoveryNovelty || 'balanced') === disc.id
                            ? 'bg-sky-400 text-black font-bold'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {disc.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* =========================================================================
                STAGE 3: SYNTHESIZE — BRING YOUR SOUNDTRACK TO LIFE
               ========================================================================= */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-spotify/20 border border-spotify/50 text-spotify text-xs font-black flex items-center justify-center">3</span>
                <div>
                  <h4 className="text-sm font-bold text-white">3. Synthesize — Bring Your Soundtrack to Life</h4>
                  <p className="text-xs text-zinc-400">
                    Ready to curate <strong className="text-spotify">{flowControls.targetDurationMins || activeIntentConfig.default_duration_mins} minutes</strong> for {activeIntentConfig.name} from your {likedTracks.length} liked songs.
                  </p>
                </div>
              </div>

              <button
                onClick={generateFlow}
                disabled={isGenerating}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-black text-sm tracking-wide transition-all duration-200 shadow-xl ${
                  isGenerating
                    ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
                    : 'bg-spotify hover:bg-spotify-hover text-black hover:scale-105 active:scale-95 shadow-spotify/30'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                    <span>Synthesizing Set ({status.progress}%)...</span>
                  </>
                ) : hasGeneratedTracks ? (
                  <>
                    <RotateCw className="w-5 h-5 text-black" />
                    <span>Re-Synthesize Soundtrack</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 fill-current" />
                    <span>Synthesize My Flow</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>

            {/* =========================================================================
                MOMENT 3: OWNERSHIP — FINAL REVEAL & SATISFACTION REFLECTION
               ========================================================================= */}
            {hasGeneratedTracks && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Reveal Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
                  {/* Subtle Ambient Glow */}
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-6">
                    {/* Header with memorable reveal copy */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spotify/20 border border-spotify/40 text-spotify text-[11px] font-black uppercase tracking-wider mb-2.5">
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
                          <span>Personal Authorship</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                          You made this flow.
                        </h2>
                        <p className="text-sm sm:text-base text-emerald-300 font-medium mt-1">
                          Your taste. Your choices. Your soundtrack.
                        </p>
                      </div>

                      {/* Explicit Export Button (Ownership CTA) */}
                      <button
                        onClick={exportToSpotify}
                        disabled={isExporting}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl border shrink-0 ${
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
                            <span>Export Flow to Spotify</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Personalized Summary Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
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
                          Cadence & BPM locked
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
                          {flowControls.vocals === 'instrumental' ? 'Zero vocal distraction' : 'Lyrical presence'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                          Sonic Palette
                        </span>
                        <span className="text-xs font-bold text-violet-300 truncate block mt-0.5">
                          {flowControls.genrePreference && flowControls.genrePreference !== 'all'
                            ? flowControls.genrePreference
                            : curatedGenres.length > 0
                            ? curatedGenres.slice(0, 2).join(', ')
                            : 'Personal Blend'}
                        </span>
                        <span className="text-[10px] text-zinc-500 block truncate">
                          From {likedTracks.length} saved tracks
                        </span>
                      </div>
                    </div>

                    {/* Creative Attribution Note */}
                    <p className="text-xs text-zinc-400 italic">
                      This soundtrack was personally curated through your choices. WaveFlow acted as your intelligent assistant to ensure harmonic transitions and rhythmic continuity.
                    </p>

                    {/* Satisfaction Question & Actions */}
                    <div className="pt-5 border-t border-zinc-800/90">
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
                              onClick={startRefinement}
                              className="text-xs text-zinc-400 hover:text-white underline px-3 py-1.5 transition-colors"
                            >
                              Refine Parameters
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
                              onClick={startRefinement}
                              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all border ${
                                isRefining
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border-zinc-700'
                              }`}
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>Almost, let me refine it</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Refinement Suite: Non-destructive parameter adjustments */}
                {isRefining && (
                  <div className="bg-zinc-950/90 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-5 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Refine Without Restarting</h3>
                          <p className="text-xs text-zinc-400">
                            Tune specific parameters below. Your current playlist remains active and listening is uninterrupted.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {storedPreviousResult && (
                          <button
                            onClick={cancelRefinement}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all border border-zinc-700"
                            title="Revert any changes and keep your original flow"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>Keep Original Flow</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 6 Targeted Refinement Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      {/* Control 1: Intention Selection */}
                      <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2">
                        <label className="text-zinc-300 font-semibold flex items-center justify-between">
                          <span>1. Listening Intention</span>
                          <span className="text-spotify font-mono text-[11px]">{activeIntentConfig.badge}</span>
                        </label>
                        <select
                          value={flowIntent}
                          onChange={(e) => setFlowIntent(e.target.value as CognitiveFlowIntentId)}
                          className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-spotify"
                        >
                          {uniqueIntents.map((intent) => (
                            <option key={intent.id} value={intent.id}>
                              {intent.name} ({intent.badge})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Control 2: Duration */}
                      <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2">
                        <label className="text-zinc-300 font-semibold flex items-center justify-between">
                          <span>2. Playlist Duration</span>
                          <span className="text-spotify font-mono font-bold">
                            {flowControls.targetDurationMins || activeIntentConfig.default_duration_mins}m
                          </span>
                        </label>
                        <div className="grid grid-cols-6 gap-1">
                          {[30, 45, 60, 75, 90, 120].map((dur) => (
                            <button
                              key={dur}
                              onClick={() => setFlowControls({ targetDurationMins: dur })}
                              className={`py-1 rounded text-[11px] font-mono font-bold transition-all ${
                                (flowControls.targetDurationMins || activeIntentConfig.default_duration_mins) === dur
                                  ? 'bg-spotify text-black'
                                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                              }`}
                            >
                              {dur}m
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Control 3: Energy Level */}
                      <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2">
                        <label className="text-zinc-300 font-semibold flex items-center justify-between">
                          <span>3. Energy Level</span>
                          <span className="text-amber-400 capitalize font-mono">{flowControls.intensity || 'balanced'}</span>
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'calm', label: 'Calm (-8%)' },
                            { id: 'balanced', label: 'Balanced' },
                            { id: 'intense', label: 'Intense (+8%)' }
                          ].map((lvl) => (
                            <button
                              key={lvl.id}
                              onClick={() => setFlowControls({ intensity: lvl.id as any })}
                              className={`py-1.5 rounded text-[11px] font-semibold transition-all ${
                                (flowControls.intensity || 'balanced') === lvl.id
                                  ? 'bg-amber-400 text-black font-bold'
                                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                              }`}
                            >
                              {lvl.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Control 4: Transition Style */}
                      <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2">
                        <label className="text-zinc-300 font-semibold flex items-center justify-between">
                          <span>4. Transition Style</span>
                          <span className="text-cyan-400 capitalize font-mono">{flowControls.transitionStyle || 'natural'}</span>
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'smooth', label: 'Smooth' },
                            { id: 'natural', label: 'Natural' },
                            { id: 'dynamic', label: 'Dynamic' }
                          ].map((style) => (
                            <button
                              key={style.id}
                              onClick={() => setFlowControls({ transitionStyle: style.id as any })}
                              className={`py-1.5 rounded text-[11px] font-semibold transition-all ${
                                (flowControls.transitionStyle || 'natural') === style.id
                                  ? 'bg-cyan-400 text-black font-bold'
                                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                              }`}
                            >
                              {style.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Control 5: Vocal Presence */}
                      <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2">
                        <label className="text-zinc-300 font-semibold flex items-center justify-between">
                          <span>5. Vocal Presence</span>
                          <span className="text-rose-400 capitalize font-mono">{flowControls.vocals || 'mixed'}</span>
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'instrumental', label: 'Instrumental' },
                            { id: 'mixed', label: 'Mixed' },
                            { id: 'welcome', label: 'Vocal-Forward' }
                          ].map((voc) => (
                            <button
                              key={voc.id}
                              onClick={() => setFlowControls({ vocals: voc.id as any })}
                              className={`py-1.5 rounded text-[11px] font-semibold transition-all ${
                                (flowControls.vocals || 'mixed') === voc.id
                                  ? 'bg-rose-400 text-black font-bold'
                                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                              }`}
                            >
                              {voc.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Control 6: Preferred Genre Focus */}
                      <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2">
                        <label className="text-zinc-300 font-semibold flex items-center justify-between">
                          <span>6. Preferred Genre Focus</span>
                          <span className="text-violet-400 capitalize font-mono">
                            {flowControls.genrePreference && flowControls.genrePreference !== 'all'
                              ? flowControls.genrePreference
                              : 'All Genres'}
                          </span>
                        </label>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                          {availableLibraryGenres.slice(0, 7).map((genre) => {
                            const val = genre === 'All Genres' ? 'all' : genre.toLowerCase();
                            const isSelected = (flowControls.genrePreference || 'all').toLowerCase() === val;
                            return (
                              <button
                                key={genre}
                                onClick={() => {
                                  setCustomGenreInput('');
                                  setFlowControls({ genrePreference: val });
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                                  isSelected
                                    ? 'bg-violet-400 text-black font-bold'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                }`}
                              >
                                {genre}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="Or type custom genre (e.g. Ska, Funk)..."
                            value={customGenreInput}
                            onChange={(e) => {
                              setCustomGenreInput(e.target.value);
                              if (e.target.value.trim()) {
                                setFlowControls({ genrePreference: e.target.value.trim() });
                              }
                            }}
                            className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded px-2 py-1 text-[11px] placeholder:text-zinc-500 focus:outline-none focus:border-violet-400"
                          />
                          {customGenreInput && (
                            <button
                              onClick={() => {
                                setCustomGenreInput('');
                                setFlowControls({ genrePreference: 'all' });
                              }}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[10px]"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Refinement Action Submission */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <span className="text-xs text-zinc-400 italic">
                        Playback continues uninterrupted while your new flow synthesizes.
                      </span>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                          onClick={cancelRefinement}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all border border-zinc-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={generateFlow}
                          disabled={isGenerating}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-spotify hover:bg-spotify-hover text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 shadow-spotify/25"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-black" />
                              <span>Synthesizing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 fill-current" />
                              <span>Synthesize Refined Flow</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generated Set Metrics & Overview Cards */}
            {hasGeneratedTracks && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in duration-300">
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Actual Track Count
                  </span>
                  <div className="text-2xl font-black text-white mt-0.5 font-mono">
                    {flowTracks.length} tracks
                  </div>
                  <span className="text-[10px] text-zinc-500">100% unique, zero duplicates</span>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Actual Duration
                  </span>
                  <div className="text-2xl font-black text-spotify mt-0.5 font-mono">
                    {formatDuration(totalDurationMs)}
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    Target: {flowControls.targetDurationMins || activeIntentConfig.default_duration_mins}m (±5% compliance)
                  </span>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Mean Energy Vector
                  </span>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5 font-mono">
                    {avgEnergy}%
                  </div>
                  <span className="text-[10px] text-zinc-500">Smooth valence & BPM alignment</span>
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
            )}

            {/* SVG Energy Curve Visualization Chart */}
            <div className="space-y-2">
              <EnergyCurveChart
                tracks={flowTracks}
                activeTrackId={activeTrack?.id}
                onSelectTrack={setActiveTrack}
                selectedPhase={selectedPhaseFilter !== 'all' ? selectedPhaseFilter : undefined}
                intentId={flowIntent}
                phases={currentPhases}
              />
            </div>

            {/* Phase Filter Tabs */}
            {hasGeneratedTracks && (
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  <button
                    onClick={() => setSelectedPhaseFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selectedPhaseFilter === 'all'
                        ? 'bg-spotify text-black shadow-md'
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
                        <span className="text-[10px] opacity-75 font-mono">({phase.trackCount})</span>
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
            )}

            {/* Spotify Tracklist Table */}
            <div className="bg-zinc-950/60 rounded-2xl border border-zinc-800/70 p-2 shadow-2xl backdrop-blur-md">
              <TracklistTable
                tracks={flowTracks}
                activeTrackId={activeTrack?.id}
                onSelectTrack={setActiveTrack}
                selectedPhaseFilter={selectedPhaseFilter}
              />
            </div>
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
    </main>
  );
};
