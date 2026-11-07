import React, { useState } from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { EnergyCurveChart } from './EnergyCurveChart';
import { TracklistTable } from './TracklistTable';
import { PHASE_CONFIGS } from '../algorithm/curveGenerator';
import { formatDuration } from '../utils/formatters';
import {
  Sparkles,
  Loader2,
  Play,
  RotateCw,
  Search,
  Music,
  Zap,
  BarChart2,
  Compass,
  ArrowRight
} from 'lucide-react';

interface MainViewProps {
  onOpenSettings: () => void;
}

export const MainView: React.FC<MainViewProps> = ({ onOpenSettings }) => {
  const {
    activeTab,
    setActiveTab,
    flowTracks,
    likedTracks,
    activeTrack,
    setActiveTrack,
    status,
    generateFlow,
    selectedPhaseFilter,
    setSelectedPhaseFilter,
    isMockMode,
    errorMessage,
    clearError
  } = useWaveFlowStore();

  const [searchQuery, setSearchQuery] = useState('');

  const isGenerating =
    status.step === 'fetching' ||
    status.step === 'analyzing' ||
    status.step === 'sorting';

  // Compute aggregated stats
  const totalDurationMs = flowTracks.reduce((acc, t) => acc + (t.duration_ms || 0), 0);
  const avgEnergy = flowTracks.length
    ? Math.round(flowTracks.reduce((acc, t) => acc + (t.energy || 50), 0) / flowTracks.length)
    : 0;
  const peakEnergy = flowTracks.length
    ? Math.max(...flowTracks.map((t) => t.energy || 0))
    : 0;

  // Filter for Library tab
  const filteredLibrary = likedTracks.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto bg-zinc-900 text-white relative flex flex-col h-[calc(100vh-6rem)]">
      {/* Dynamic Top Gradient: emerald/spotify green fading into zinc-900 */}
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
        {/* ==================== TAB 1: GENERATE FLOW (MAIN STUDIO) ==================== */}
        {activeTab === 'generate' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Hero / Header Card */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-2">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-spotify uppercase mb-2">
                  <Sparkles className="w-4 h-4 text-spotify" />
                  <span>AI-Curated Continuous Set</span>
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
                  Synthesizes your entire Liked Songs library into an emotional 50-track DJ set
                  calibrated across 6 acoustic energy phases using Gemini AI.
                </p>
              </div>

              {/* Generate Flow Primary Button */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={generateFlow}
                  disabled={isGenerating}
                  className={`w-full md:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all duration-200 shadow-xl ${
                    isGenerating
                      ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
                      : 'bg-spotify hover:bg-spotify-hover text-black hover:scale-105 active:scale-95 shadow-spotify/30'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-black" />
                      <span>Generating Flow ({status.progress}%)...</span>
                    </>
                  ) : flowTracks.length > 0 ? (
                    <>
                      <RotateCw className="w-5 h-5 text-black" />
                      <span>Re-Generate Flow</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 fill-current" />
                      <span>Generate Flow</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Metrics & Overview Pill Cards (when flow generated) */}
            {flowTracks.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Total Tracks
                  </span>
                  <div className="text-2xl font-black text-white mt-0.5 font-mono">
                    {flowTracks.length}
                  </div>
                  <span className="text-[10px] text-zinc-500">Selected from {likedTracks.length || 200} songs</span>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Set Run Time
                  </span>
                  <div className="text-2xl font-black text-white mt-0.5 font-mono">
                    {formatDuration(totalDurationMs)}
                  </div>
                  <span className="text-[10px] text-zinc-500">Continuous uninterrupted flow</span>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Average Energy
                  </span>
                  <div className="text-2xl font-black text-spotify mt-0.5 font-mono">
                    {avgEnergy}%
                  </div>
                  <span className="text-[10px] text-zinc-500">Calibrated by Gemini AI</span>
                </div>

                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
                  <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    Peak Climax
                  </span>
                  <div className="text-2xl font-black text-rose-400 mt-0.5 font-mono">
                    {peakEnergy}%
                  </div>
                  <span className="text-[10px] text-zinc-500">Phase 5 Crescendo</span>
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
                    All 50 Tracks
                  </button>

                  {PHASE_CONFIGS.map((phase) => {
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
                    ? 'Showing full 50-track set'
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

        {/* ==================== TAB 2: LIBRARY (200 LIKED SONGS) ==================== */}
        {activeTab === 'library' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Your Liked Library</h1>
                <p className="text-sm text-zinc-400 mt-1">
                  {likedTracks.length > 0
                    ? `${likedTracks.length} liked tracks loaded from your account pool`
                    : 'Click "Fetch Library" or "Generate Flow" to load your liked songs.'}
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tracks or artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-spotify transition-colors"
                />
              </div>
            </div>

            {likedTracks.length === 0 ? (
              <div className="p-12 text-center bg-zinc-950/50 rounded-2xl border border-zinc-800/60 space-y-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800/70 mx-auto flex items-center justify-center text-zinc-400">
                  <Music className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">No tracks loaded yet</h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  Load your 200 liked songs from Spotify or load demo tracks to explore the library.
                </p>
                <button
                  onClick={generateFlow}
                  className="px-6 py-2.5 rounded-full bg-spotify text-black font-bold text-xs uppercase tracking-wider hover:bg-spotify-hover transition-colors shadow-lg"
                >
                  Fetch & Generate Flow
                </button>
              </div>
            ) : (
              <div className="bg-zinc-950/60 rounded-2xl border border-zinc-800/70 p-2">
                <TracklistTable
                  tracks={filteredLibrary}
                  activeTrackId={activeTrack?.id}
                  onSelectTrack={setActiveTrack}
                  selectedPhaseFilter="all"
                />
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 3: HOME (CONCEPT & ARCHITECTURE) ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-8 max-w-5xl mx-auto py-4">
            {/* Concept Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/60 via-zinc-950 to-black border border-zinc-800 p-8 md:p-12">
              <div className="max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spotify/15 border border-spotify/30 text-spotify text-xs font-bold tracking-wider uppercase">
                  <Zap className="w-3.5 h-3.5" />
                  Acoustic Energy Curve Theory
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  Why Great DJ Sets Are Curved, Not Random.
                </h2>
                <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
                  Club fatigue happens when a playlist stays at 100% volume and energy for too long,
                  causing emotional numbing. WaveFlow mimics how master resident DJs construct
                  unforgettable nights: gradual warming, deliberate valleys for breath, followed by
                  blistering climaxes.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('generate')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-spotify text-black font-bold text-xs uppercase tracking-wider hover:bg-spotify-hover hover:scale-105 transition-all shadow-xl shadow-spotify/20"
                  >
                    <span>Launch Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 6 Phases Breakdown Grid */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-spotify" />
                The 6-Phase DJ Set Progression
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PHASE_CONFIGS.map((phase, idx) => (
                  <div
                    key={phase.name}
                    className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors space-y-2.5 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-500 font-bold">
                        PHASE 0{idx + 1}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: `${phase.color}20`,
                          color: phase.color,
                          borderColor: `${phase.color}40`,
                          borderWidth: '1px'
                        }}
                      >
                        {phase.minEnergy}-{phase.maxEnergy}% Energy
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: phase.color }}
                      />
                      {phase.name}
                    </h4>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {phase.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800/60">
                      <span>Allocation</span>
                      <span className="font-mono font-semibold text-zinc-300">
                        {phase.trackCount} Tracks ({phase.rangeIndex[0]}–{phase.rangeIndex[1]})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Architecture Card */}
            <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/70 space-y-3">
              <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                System Engineering
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-400">
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                  <p className="font-bold text-white mb-1">Spotify OAuth PKCE</p>
                  <p>SHA-256 base64url challenge flow fetching 200 personal liked songs safely on the client.</p>
                </div>
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                  <p className="font-bold text-white mb-1">Gemini AI Acoustics</p>
                  <p>Analyzes track strings and outputs deterministic JSON energy & valence scores.</p>
                </div>
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                  <p className="font-bold text-white mb-1">Direct Playlist Injection</p>
                  <p>Creates private Spotify playlist and inserts the 50 ordered tracks in a single click.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
