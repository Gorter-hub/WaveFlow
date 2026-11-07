import React, { useState } from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { EnergyCurveChart } from './EnergyCurveChart';
import { TracklistTable } from './TracklistTable';
import { COGNITIVE_INTENTS } from '../algorithm/curveGenerator';
import { CognitiveFlowIntentId } from '../types';
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
  Activity
} from 'lucide-react';

interface MainViewProps {
  onOpenSettings: () => void;
}

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
    selectedPhaseFilter,
    setSelectedPhaseFilter,
    isMockMode,
    isSyncingLibrary,
    syncLibrary,
    flowIntent,
    setFlowIntent,
    currentPhases,
    errorMessage,
    clearError
  } = useWaveFlowStore();

  const [searchQuery, setSearchQuery] = useState('');

  const isGenerating =
    status.step === 'fetching' ||
    status.step === 'analyzing' ||
    status.step === 'sorting';

  const isExporting = status.step === 'exporting';
  const hasTracks = flowTracks.length > 0;

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

  const intentIcons: Record<CognitiveFlowIntentId, React.ReactNode> = {
    deep_focus: <Brain className="w-5 h-5 text-emerald-400" />,
    festival_explosive: <Flame className="w-5 h-5 text-rose-400" />,
    night_drive: <Moon className="w-5 h-5 text-purple-400" />,
    genre_cadence: <Zap className="w-5 h-5 text-amber-400" />
  };

  return (
    <main className="flex-1 overflow-y-auto bg-zinc-900 text-white relative flex flex-col h-[calc(100vh-6rem)]">
      {/* Dynamic Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-emerald-950/40 via-zinc-900/80 to-zinc-900 pointer-events-none" />

      {/* Error Banner */}
      {errorMessage && (
        <div className="relative z-20 m-4 mb-0 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center justify-between text-rose-300 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={clearError}
            className="text-rose-400 hover:text-white font-bold ml-4"
          >
            Dismiss
          </button>
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
                  <span>Cognitive Music Architecture</span>
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
                  Synthesizes your Liked Songs into a continuous neuroscience-calibrated DJ set.
                  Select your cognitive intent below to synthesize emotional arcs with strict BPM transition windows.
                </p>
              </div>

              {/* Action Buttons: Generate Flow + Top Export to Spotify + Sync */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {/* Generate / Re-Generate Flow Button */}
                <button
                  onClick={generateFlow}
                  disabled={isGenerating}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all duration-200 shadow-xl ${
                    isGenerating
                      ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
                      : 'bg-spotify hover:bg-spotify-hover text-black hover:scale-105 active:scale-95 shadow-spotify/30'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-black" />
                      <span>Synthesizing ({status.progress}%)...</span>
                    </>
                  ) : flowTracks.length > 0 ? (
                    <>
                      <RotateCw className="w-5 h-5 text-black" />
                      <span>Re-Synthesize Arc</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 fill-current" />
                      <span>Synthesize Flow</span>
                    </>
                  )}
                </button>

                {/* PROMINENT TOP EXPORT BUTTON (Never blocked by corner badges) */}
                <button
                  onClick={exportToSpotify}
                  disabled={!hasTracks || isExporting}
                  className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl border ${
                    !hasTracks || isExporting
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700/50'
                      : 'bg-zinc-950 hover:bg-zinc-900 text-spotify border-spotify/50 hover:border-spotify hover:scale-105 shadow-spotify/20'
                  }`}
                  title="Export this curated cognitive set to Spotify"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-spotify" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 fill-current text-spotify" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.587 14.428a.627.627 0 0 1-.861.208c-2.358-1.441-5.327-1.767-8.825-.968a.627.627 0 1 1-.28-1.223c3.829-.875 7.119-.508 9.758 1.121.298.183.391.573.208.862zm1.226-2.724a.784.784 0 0 1-1.079.258c-2.7-1.66-6.816-2.14-10.01-1.171a.785.785 0 0 1-.466-1.5c3.649-1.107 8.2-.577 11.297 1.334.356.219.472.684.258 1.079zm.106-2.836C14.685 9.07 9.35 8.89 6.262 9.827a.942.942 0 1 1-.55-1.802c3.541-1.075 9.444-.863 13.208 1.37a.942.942 0 1 1-.999 1.603z" />
                      </svg>
                      <span>{exportedPlaylist ? 'Re-Export to Spotify' : 'Export to Spotify'}</span>
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

            {/* Cognitive Intent Selector Cards (Replaces manual track counts) */}
            <div className="bg-zinc-950/85 border border-zinc-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-spotify" />
                    <span>Cognitive Flow Intent · Single-Click Selection</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Track count and pacing arc are automatically calculated via neuroscience models. No manual sliders required.
                  </p>
                </div>
                <div className="text-xs text-zinc-400 font-mono">
                  Pool: <span className="text-spotify font-bold">{likedTracks.length || 200} cached tracks</span>
                </div>
              </div>

              {/* 4 Cognitive Intent Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {(Object.values(COGNITIVE_INTENTS) as any[]).map((intent) => {
                  const isSelected = flowIntent === intent.id;
                  return (
                    <button
                      key={intent.id}
                      onClick={() => setFlowIntent(intent.id)}
                      className={`text-left p-4 rounded-xl border transition-all relative group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-zinc-900 border-spotify shadow-xl shadow-spotify/15 ring-1 ring-spotify'
                          : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/90'
                      }`}
                    >
                      <div>
                        {/* Header Badge & Icon */}
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            {intentIcons[intent.id as CognitiveFlowIntentId]}
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
                            <span className="w-2 h-2 rounded-full bg-spotify animate-ping" />
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="text-base font-bold text-white group-hover:text-spotify transition-colors leading-snug">
                          {intent.name}
                        </h4>

                        {/* Tagline */}
                        <p className="text-[11.5px] text-zinc-400 mt-1.5 leading-relaxed">
                          {intent.tagline}
                        </p>

                        {/* Neuroscience Rationale excerpt */}
                        <p className="text-[10px] text-zinc-500 mt-2 line-clamp-3 italic">
                          "{intent.neuroscience_rationale}"
                        </p>
                      </div>

                      {/* Bottom Footer Info */}
                      <div className="mt-4 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[10.5px] font-mono text-zinc-400">
                        <span>Tolerance: ±{intent.bpm_tolerance} BPM</span>
                        <span className="text-zinc-500">{intent.phases.length} Phases</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metrics & Overview Cards */}
            {flowTracks.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Calculated Tracks
                  </span>
                  <div className="text-2xl font-black text-white mt-0.5 font-mono">
                    {flowTracks.length}
                  </div>
                  <span className="text-[10px] text-zinc-500">Duration-packed synthesis</span>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Target Set Duration
                  </span>
                  <div className="text-2xl font-black text-spotify mt-0.5 font-mono">
                    {formatDuration(totalDurationMs)}
                  </div>
                  <span className="text-[10px] text-zinc-500">Unbroken cognitive continuity</span>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Mean Energy Vector
                  </span>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5 font-mono">
                    {avgEnergy}%
                  </div>
                  <span className="text-[10px] text-zinc-500">BPM transition smoothing</span>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Peak Crescendo
                  </span>
                  <div className="text-2xl font-black text-rose-400 mt-0.5 font-mono">
                    {peakEnergy}%
                  </div>
                  <span className="text-[10px] text-zinc-500">Dopamine arc climax</span>
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
            {flowTracks.length > 0 && (
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
