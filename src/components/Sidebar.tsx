import React from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { COGNITIVE_INTENTS } from '../algorithm/curveGenerator';
import {
  Sliders,
  Library,
  Settings,
  LogOut,
  Radio,
  Sparkles,
  Zap
} from 'lucide-react';

interface SidebarProps {
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const {
    user,
    logout,
    activeTab,
    setActiveTab,
    selectedPhaseFilter,
    setSelectedPhaseFilter,
    flowTracks,
    likedTracks,
    isMockMode,
    currentPhases,
    flowIntent,
    startNewFlow
  } = useWaveFlowStore();

  const currentIntentConfig = COGNITIVE_INTENTS[flowIntent];

  return (
    <aside className="w-64 bg-black border-r border-zinc-800/80 flex flex-col justify-between flex-shrink-0 select-none z-30">
      {/* TOP SECTION: Logo & Nav */}
      <div className="p-5">
        {/* App Logo */}
        <div className="flex items-center gap-2.5 mb-7 px-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-spotify to-emerald-400 flex items-center justify-center shadow-lg shadow-spotify/20">
            <Radio className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none flex items-center gap-1">
              WaveFlow
              <span className="text-[10px] font-bold text-spotify uppercase tracking-widest bg-spotify/10 border border-spotify/30 px-1.5 py-0.2 rounded-full">
                AI
              </span>
            </h1>
            <p className="text-[10.5px] text-zinc-500 font-medium tracking-wide mt-0.5">
              Cognitive DJ Synthesis
            </p>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="space-y-1 mb-7">
          <button
            onClick={() => setActiveTab('generate')}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'generate'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Sliders className={`w-4 h-4 ${activeTab === 'generate' ? 'text-spotify' : ''}`} />
            <span>DJ Flow Studio</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('generate');
              startNewFlow();
            }}
            className="w-full flex items-center gap-3.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-spotify hover:bg-zinc-900/80 border border-zinc-800/60 transition-all group"
            title="Start a new playlist creation journey"
          >
            <Sparkles className="w-3.5 h-3.5 text-spotify group-hover:scale-110 transition-transform" />
            <span>+ Start New Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'library'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <span className="flex items-center gap-3.5">
              <Library className={`w-4 h-4 ${activeTab === 'library' ? 'text-spotify' : ''}`} />
              <span>Liked Library</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono font-medium">
              {likedTracks.length || 0}
            </span>
          </button>
        </nav>

        {/* Active Intent Arc Card */}
        <div className="mb-6 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              Active Intent
            </span>
            <span
              className="text-[9.5px] font-bold px-2 py-0.2 rounded-full border"
              style={{
                color: currentIntentConfig.color,
                borderColor: `${currentIntentConfig.color}40`,
                backgroundColor: `${currentIntentConfig.color}15`
              }}
            >
              {currentIntentConfig.badge}
            </span>
          </div>
          <div className="text-xs font-bold text-white truncate">
            {currentIntentConfig.name}
          </div>
          <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
            {currentIntentConfig.tagline}
          </p>
        </div>

        {/* Dynamic Cognitive Phases List */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Flow Phases ({currentPhases.length})
            </span>
            {selectedPhaseFilter !== 'all' && (
              <button
                onClick={() => setSelectedPhaseFilter('all')}
                className="text-[10px] text-spotify hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSelectedPhaseFilter('all')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedPhaseFilter === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-spotify" />
                <span>All {currentPhases.length} Phases</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {flowTracks.length || 0}
              </span>
            </button>

            {currentPhases.map((phase) => {
              const isSelected = selectedPhaseFilter === phase.name;
              return (
                <button
                  key={phase.name}
                  onClick={() => setSelectedPhaseFilter(phase.name)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: phase.color }}
                    />
                    <span className="truncate">{phase.name}</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {phase.trackCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: User Profile & Settings */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60">
        {/* Mock Mode notice badge */}
        {isMockMode && (
          <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">Demo / Preview Mode</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {/* User info */}
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.images?.[0]?.url ? (
              <img
                src={user.images[0].url}
                alt={user.display_name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-zinc-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 text-spotify font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user?.display_name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-200 truncate leading-none">
                {user?.display_name || 'Spotify Guest'}
              </p>
              <p className="text-[10px] text-zinc-500 truncate mt-1">
                {user?.product === 'premium' ? 'Spotify Premium' : 'Free Account'}
              </p>
            </div>
          </div>

          {/* Action buttons: Settings & Logout */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Settings & API Keys"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
