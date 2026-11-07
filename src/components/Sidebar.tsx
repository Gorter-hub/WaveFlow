import React from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { PHASE_CONFIGS } from '../algorithm/curveGenerator';
import {
  Home,
  Sliders,
  Library,
  Settings,
  LogOut,
  Radio,
  Flame,
  CheckCircle2,
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
    isMockMode
  } = useWaveFlowStore();

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
              DJ Set & Energy Curve
            </p>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'home'
                ? 'bg-zinc-800/80 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-spotify' : ''}`} />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('generate')}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'generate'
                ? 'bg-zinc-800/80 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Sliders className={`w-5 h-5 ${activeTab === 'generate' ? 'text-spotify' : ''}`} />
            <div className="flex items-center justify-between flex-1">
              <span>Generate Flow</span>
              {flowTracks.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-spotify/20 text-spotify border border-spotify/30">
                  {flowTracks.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'library'
                ? 'bg-zinc-800/80 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Library className={`w-5 h-5 ${activeTab === 'library' ? 'text-spotify' : ''}`} />
            <div className="flex items-center justify-between flex-1">
              <span>Liked Library</span>
              {likedTracks.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                  {likedTracks.length}
                </span>
              )}
            </div>
          </button>
        </nav>

        {/* Separator */}
        <div className="my-5 border-t border-zinc-800/70" />

        {/* DJ Flow Phase Filter Navigation */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Flow Phases (50)
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
                <span>All 6 Phases</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {flowTracks.length || 50}
              </span>
            </button>

            {PHASE_CONFIGS.map((phase) => {
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
            <span className="truncate">Demo / Offline Mode</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {/* User info */}
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.images?.[0]?.url ? (
              <img
                src={user.images[0].url}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-zinc-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                {user?.display_name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.display_name || 'Spotify User'}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {isMockMode ? 'Interactive Guest' : 'Connected'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
              title="Settings & API Keys"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-md hover:bg-zinc-800 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
