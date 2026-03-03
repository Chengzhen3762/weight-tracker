import React, { useState, useCallback, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import WeightTrend from './components/WeightTrend';
import AddWeightModal from './components/AddWeightModal';
import { useWeightData } from './hooks/useWeightData';
import { useNotifications } from './hooks/useNotifications';
import { useTheme } from './hooks/useTheme';
import type { WeightEntry } from './hooks/useWeightData';

type Screen = 'dashboard' | 'trend';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const App: React.FC = () => {
  const weightData = useWeightData();
  const notifHook = useNotifications(
    weightData.entries,
    weightData.goalWeight,
    weightData.weeklyChange,
    weightData.weeklyAvg,
    weightData.progressPct,
    weightData.isOnTrack,
  );
  const { isDark, toggleTheme } = useTheme();

  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'back'>('forward');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<WeightEntry | null>(null);

  // Install prompt
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowInstallBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setIsStandalone(true);
    }
    setInstallPrompt(null);
  };

  const navigateToTrend = useCallback(() => {
    setTransitionDirection('forward');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen('trend');
      setIsTransitioning(false);
    }, 50);
  }, []);

  const navigateBack = useCallback(() => {
    setTransitionDirection('back');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen('dashboard');
      setIsTransitioning(false);
    }, 50);
  }, []);

  const handleAddWeight = useCallback(() => {
    setEditEntry(null);
    setShowAddModal(true);
  }, []);

  const handleEditEntry = useCallback((entry: WeightEntry) => {
    setEditEntry(entry);
    setShowAddModal(true);
  }, []);

  const handleSave = useCallback((data: Omit<WeightEntry, 'id'>) => {
    weightData.addEntry(data);
  }, [weightData]);

  const handleUpdate = useCallback((id: string, data: Omit<WeightEntry, 'id'>) => {
    weightData.updateEntry(id, data);
  }, [weightData]);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-warm-bg">
      {/* Install Banner */}
      {showInstallBanner && !isStandalone && !isIOS && (
        <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center">
          <div className="w-full max-w-[430px] px-4 pt-3">
            <div className="bg-warm-card rounded-2xl shadow-lg border border-warm-border p-4 flex items-center gap-3 animate-fade-in-up">
              <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7-7 7 7"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">Install Weight Tracker</p>
                <p className="text-xs text-text-secondary mt-0.5">Add to home screen for the best experience</p>
              </div>
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-dark transition-colors flex-shrink-0"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="p-1 text-text-tertiary hover:text-text-secondary transition-colors flex-shrink-0"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        key={currentScreen}
        className={`w-full min-h-screen ${
          !isTransitioning
            ? transitionDirection === 'forward'
              ? 'animate-[slideIn_0.4s_cubic-bezier(0.32,0.72,0,1)_forwards]'
              : 'animate-[slideBack_0.4s_cubic-bezier(0.32,0.72,0,1)_forwards]'
            : 'opacity-0'
        }`}
        style={{ animationFillMode: 'forwards' }}
      >
        {currentScreen === 'dashboard' ? (
          <Dashboard
            data={weightData}
            notifHook={notifHook}
            onNavigateToTrend={navigateToTrend}
            onAddWeight={handleAddWeight}
            onEditEntry={handleEditEntry}
            isDark={isDark}
            toggleTheme={toggleTheme}
          />
        ) : (
          <WeightTrend data={weightData} onBack={navigateBack} />
        )}
      </div>

      {/* Add / Edit Weight Modal */}
      <AddWeightModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditEntry(null); }}
        onSave={handleSave}
        onUpdate={handleUpdate}
        editEntry={editEntry}
        lastWeight={weightData.latest?.weight}
      />

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideBack {
          from { transform: translateX(-40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export { App };
export default App;
