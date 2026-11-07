import React, { useState } from 'react';
import { useWaveFlowStore } from '../store/useWaveFlowStore';
import { getRedirectUri } from '../api/spotify';
import { X, Key, Copy, Check, ExternalLink, Shield } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { spotifyClientId, geminiApiKey, setCredentials } = useWaveFlowStore();

  const [clientIdInput, setClientIdInput] = useState(spotifyClientId);
  const [geminiKeyInput, setGeminiKeyInput] = useState(geminiApiKey);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const redirectUri = getRedirectUri();

  const handleCopyUri = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCredentials(clientIdInput, geminiKeyInput);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-spotify/10 text-spotify border border-spotify/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">WaveFlow API Settings</h3>
              <p className="text-xs text-zinc-400">Configure your personal Spotify & Gemini keys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Spotify Client ID */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Spotify Client ID
              </label>
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-spotify hover:underline inline-flex items-center gap-1"
              >
                <span>Spotify Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              placeholder="e.g. 7a9e2f416d8441..."
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-spotify rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-zinc-500">
              Required for live Spotify Liked Songs fetching & playlist export.
            </p>
          </div>

          {/* Redirect URI helper */}
          <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300">Spotify Redirect URI:</span>
              <button
                type="button"
                onClick={handleCopyUri}
                className="flex items-center gap-1 text-[11px] text-spotify hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-spotify" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy URI'}</span>
              </button>
            </div>
            <p className="font-mono text-[11px] text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800/80 truncate">
              {redirectUri}
            </p>
            <p className="text-[10px] text-zinc-500">
              Add this exact URI to your Spotify App's "Redirect URIs" in the Developer Dashboard.
            </p>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-spotify hover:underline inline-flex items-center gap-1"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-spotify rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-zinc-500">
              Used to calculate acoustic energy (0-100) & emotional valence. If empty, acoustic simulation is used.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-spotify hover:bg-spotify-hover text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              {saved ? 'Saved!' : 'Save Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
