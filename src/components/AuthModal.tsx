import React, { useState } from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { Radio, Sparkles, ArrowRight, Settings, Music, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  onOpenSettings: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onOpenSettings }) => {
  const { login, setMockMode, spotifyClientId, errorMessage } = useWaveFlowStore();
  const [showQuickConfig, setShowQuickConfig] = useState(!spotifyClientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl select-none">
      {/* Background ambient Spotify green glow */}
      <div className="absolute w-[500px] h-[500px] bg-spotify/15 rounded-full blur-[140px] pointer-events-none -translate-y-12" />

      {/* Main Auth Card */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800/90 rounded-3xl p-8 md:p-10 shadow-2xl text-center space-y-6 pt-12 pb-10">
        {/* Top-Right API Settings Button (Nunca tapado por insignias) */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all flex items-center gap-1.5 text-xs font-medium shadow-md group"
          title="Configurar credenciales API"
        >
          <Settings className="w-3.5 h-3.5 text-spotify group-hover:rotate-45 transition-transform" />
          <span>API Settings</span>
        </button>

        {/* App Logo */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-spotify to-emerald-400 flex items-center justify-center shadow-xl shadow-spotify/25">
          <Radio className="w-8 h-8 text-black stroke-[2.5]" />
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spotify/10 border border-spotify/30 text-spotify text-[11px] font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered DJ Architecture</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            WaveFlow
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed px-2">
            Curate your complete Liked Songs library into a continuous 50-track emotional set curve
            (Warm-up → Build → Peak → Valley → Climax → Outro).
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs text-left space-y-2">
            <p className="font-semibold">{errorMessage}</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-2.5 py-1 rounded bg-zinc-800 text-white font-medium hover:bg-zinc-700 text-[11px]"
              >
                Configure Client ID
              </button>
              <button
                type="button"
                onClick={() => setMockMode(true)}
                className="px-2.5 py-1 rounded bg-spotify/20 text-spotify border border-spotify/30 font-semibold hover:bg-spotify/30 text-[11px]"
              >
                Use Demo Mode Instead
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Main "Login with Spotify" button */}
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-spotify hover:bg-spotify-hover text-black font-extrabold text-sm uppercase tracking-wider transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-spotify/25"
          >
            {/* Spotify SVG Icon */}
            <svg className="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.587 14.428a.627.627 0 0 1-.861.208c-2.358-1.441-5.327-1.767-8.825-.968a.627.627 0 1 1-.28-1.223c3.829-.875 7.119-.508 9.758 1.121.298.183.391.573.208.862zm1.226-2.724a.784.784 0 0 1-1.079.258c-2.7-1.66-6.816-2.14-10.01-1.171a.785.785 0 0 1-.466-1.5c3.649-1.107 8.2-.577 11.297 1.334.356.219.472.684.258 1.079zm.106-2.836C14.685 9.07 9.35 8.89 6.262 9.827a.942.942 0 1 1-.55-1.802c3.541-1.075 9.444-.863 13.208 1.37a.942.942 0 1 1-.999 1.603z" />
            </svg>
            <span>Login with Spotify</span>
          </button>

          {/* Instant Demo Preview Button */}
          <button
            onClick={() => setMockMode(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all border border-zinc-800 hover:border-zinc-700"
          >
            <Sparkles className="w-4 h-4 text-spotify" />
            <span>Try Demo / Instant Preview</span>
          </button>
        </div>

        {/* Footer info & Settings link */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>OAuth 2.0 PKCE Safe</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>API Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
