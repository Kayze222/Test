import React, { useState, useEffect, useRef } from 'react';
import { ActiveView } from './types';
import { ArcadeLobby } from './components/ArcadeLobby';
import { ZimClicker } from './games/ZimClicker/ZimClicker';
import { RomanianSim } from './games/RomanianSim/RomanianSim';
import { BattleAnyone } from './games/BattleAnyone/BattleAnyone';
import { BloodCircuit } from './games/BloodCircuit/BloodCircuit';
import { CultureKill } from './games/CultureKill/CultureKill';
import { Zoblox } from './games/Zoblox/Zoblox';
import { LeaderboardModal } from './components/LeaderboardModal';
import { soundManager } from './utils/audio';
import {
  WeeklyPlaytimeData,
  loadWeeklyData,
  saveWeeklyData,
  getCurrentWeekKey,
} from './utils/playtime';
import { Volume2, VolumeX } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ActiveView>('lobby');
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted());
  const [weeklyData, setWeeklyData] = useState<WeeklyPlaytimeData>(loadWeeklyData);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  const weeklyDataRef = useRef<WeeklyPlaytimeData>(weeklyData);
  weeklyDataRef.current = weeklyData;

  // Support browser Back/Forward tab navigation
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as ActiveView;
    if (['zimclicker', 'romanian', 'battle', 'bloodcircuit', 'zoblox', 'culturekill'].includes(hash)) {
      setCurrentView(hash);
    }

    const onPopState = (e: PopStateEvent) => {
      if (e.state?.view) {
        setCurrentView(e.state.view);
      } else {
        const h = window.location.hash.replace('#', '') as ActiveView;
        if (['zimclicker', 'romanian', 'battle', 'bloodcircuit', 'zoblox', 'culturekill'].includes(h)) {
          setCurrentView(h);
        } else {
          setCurrentView('lobby');
        }
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Background audio management
  useEffect(() => {
    if (currentView === 'lobby') {
      soundManager.playMusic('arcade_bg');
    } else if (currentView !== 'romanian' && currentView !== 'battle') {
      soundManager.stopMusic();
    }
  }, [currentView]);

  // Playtime Tracking Loop (ticks every second across any active game)
  useEffect(() => {
    let tickCount = 0;

    const interval = setInterval(() => {
      const currentWeek = getCurrentWeekKey();
      let current = weeklyDataRef.current;

      // Check if weekly reset has triggered
      if (current.weekKey !== currentWeek) {
        current = loadWeeklyData();
      }

      const activeGameKey = currentView;
      const prevGamePlaytime = current.gamePlaytime[activeGameKey] || 0;
      const prevTotal = current.gamePlaytime.total || 0;

      const updated: WeeklyPlaytimeData = {
        ...current,
        gamePlaytime: {
          ...current.gamePlaytime,
          [activeGameKey]: prevGamePlaytime + 1,
          total: prevTotal + 1,
        },
      };

      setWeeklyData(updated);

      tickCount++;
      if (tickCount % 5 === 0) {
        saveWeeklyData(updated);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      saveWeeklyData(weeklyDataRef.current);
    };
  }, [currentView]);

  const handleSelectView = (view: ActiveView) => {
    setCurrentView(view);
    if (view === 'lobby') {
      if (window.location.hash) {
        window.history.pushState(null, '', window.location.pathname);
      }
    } else {
      window.history.pushState({ view }, '', '#' + view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleUpdateUsername = (newUsername: string) => {
    const updated = {
      ...weeklyData,
      playerUsername: newUsername,
    };
    setWeeklyData(updated);
    saveWeeklyData(updated);
  };

  return (
    <div className="min-h-screen text-[#00ff88]">
      {/* Sound Mute Button Float (only in lobby to ensure 100% immersive fullscreen for games) */}
      {currentView === 'lobby' && (
        <button
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 9999,
            padding: '10px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            border: '2px solid #00ff88',
            color: '#00ff88',
            cursor: 'pointer',
          }}
        >
          {isMuted ? <VolumeX size={20} color="#ff4444" /> : <Volume2 size={20} color="#00ff88" />}
        </button>
      )}

      {/* Main Content Area */}
      <main>
        {currentView === 'lobby' && (
          <ArcadeLobby
            onSelectGame={handleSelectView}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            weeklyData={weeklyData}
          />
        )}
        {currentView === 'zimclicker' && <ZimClicker />}
        {currentView === 'romanian' && <RomanianSim />}
        {currentView === 'battle' && <BattleAnyone />}
        {currentView === 'bloodcircuit' && <BloodCircuit />}
        {currentView === 'zoblox' && <Zoblox />}
        {currentView === 'culturekill' && <CultureKill />}
      </main>

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        weeklyData={weeklyData}
        onUpdateUsername={handleUpdateUsername}
      />
    </div>
  );
};

export default App;
