import React, { useEffect, useState } from 'react';
import { useWaveFlowStore } from './store/useWaveFlowStore';
import { Sidebar } from './components/Sidebar';
import { MainView } from './components/MainView';
import { BottomBar } from './components/BottomBar';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const {
    init,
    isAuthenticated,
    isAuthLoading,
    handleAuthCallback
  } = useWaveFlowStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Handle initialization and OAuth callback on mount
  useEffect(() => {
    const handleInitAndCallback = async () => {
      // 1. Check if callback code is in URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (code) {
        // Clean URL query params to prevent re-trigger on refresh
        window.history.replaceState({}, document.title, window.location.pathname.replace('/callback', '') || '/');
        await handleAuthCallback(code);
      } else if (error) {
        console.error('Spotify Auth error from callback:', error);
        window.history.replaceState({}, document.title, window.location.pathname.replace('/callback', '') || '/');
      } else {
        await init();
      }
    };

    handleInitAndCallback();
  }, [init, handleAuthCallback]);

  // Loading spinner during initial session restore
  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-zinc-400 gap-4 select-none">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-zinc-800 border-t-spotify animate-spin" />
        </div>
        <div className="text-xs font-semibold tracking-wider uppercase text-zinc-500">
          Initializing WaveFlow...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* 3-Pane Structure: Sidebar (Left) + Main View (Center) */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
        <MainView onOpenSettings={() => setIsSettingsOpen(true)} />
      </div>

      {/* Bottom Bar: Player Replacement, Status, Export Button */}
      <BottomBar />

      {/* Unauthenticated State Modal */}
      {!isAuthenticated && (
        <AuthModal onOpenSettings={() => setIsSettingsOpen(true)} />
      )}

      {/* API Key Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
