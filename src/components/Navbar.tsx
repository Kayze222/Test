import React from 'react';
import { ActiveView } from '../types';
import { soundManager } from '../utils/audio';
import { Volume2, VolumeX, Home, Zap, ShieldAlert, Swords, Flame, Skull } from 'lucide-react';

interface NavbarProps {
  currentView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#15121b]/95 backdrop-blur border-b-2 border-[#00ff88]/40 shadow-[0_4px_20px_rgba(0,255,136,0.15)] px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <button
          onClick={() => {
            soundManager.play('click');
            onSelectView('lobby');
          }}
          className="flex items-center gap-2.5 text-left group transition transform hover:scale-105"
        >
          <img
            src="/brain_icon.png"
            alt="Zornhub Logo"
            className="w-8 h-8 rounded drop-shadow-[0_0_8px_#ff00ff]"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider text-[#00ff88] group-hover:text-[#ff00ff] transition-colors leading-none drop-shadow-[0_0_6px_#00ff88]">
              ZORNHUB <span className="text-yellow-400 text-sm font-bold tracking-normal uppercase">Arcade</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-mono">the original west korea basement games</p>
          </div>
        </button>

        {/* Navigation tabs */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => {
              soundManager.play('click');
              onSelectView('lobby');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'lobby'
                ? 'bg-[#00ff88] text-black shadow-[0_0_12px_#00ff88]'
                : 'bg-black/40 text-gray-300 hover:text-white hover:bg-white/10 border border-gray-700/50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>LOBBY</span>
          </button>

          <button
            onClick={() => {
              soundManager.play('click');
              onSelectView('zimclicker');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'zimclicker'
                ? 'bg-[#ff00ff] text-white shadow-[0_0_12px_#ff00ff]'
                : 'bg-black/40 text-pink-300 hover:text-white hover:bg-pink-900/30 border border-pink-700/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>ZIM CLICKER</span>
          </button>

          <button
            onClick={() => {
              soundManager.play('click');
              onSelectView('romanian');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'romanian'
                ? 'bg-[#00ff88] text-black shadow-[0_0_12px_#00ff88]'
                : 'bg-black/40 text-green-300 hover:text-white hover:bg-green-900/30 border border-green-700/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>ROMANIAN SIM</span>
          </button>

          <button
            onClick={() => {
              soundManager.play('click');
              onSelectView('battle');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'battle'
                ? 'bg-red-600 text-white shadow-[0_0_12px_red]'
                : 'bg-black/40 text-red-300 hover:text-white hover:bg-red-900/30 border border-red-700/50'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>BATTLE ANYONE</span>
          </button>

          <button
            onClick={() => {
              soundManager.play('click');
              onSelectView('bloodcircuit');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'bloodcircuit'
                ? 'bg-amber-500 text-black shadow-[0_0_12px_#f59e0b]'
                : 'bg-black/40 text-amber-300 hover:text-white hover:bg-amber-900/30 border border-amber-700/50'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            <span>BLOOD//CIRCUIT</span>
          </button>

          <button
            onClick={() => {
              soundManager.play('click');
              onSelectView('culturekill');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              currentView === 'culturekill'
                ? 'bg-orange-600 text-white shadow-[0_0_12px_orange]'
                : 'bg-black/40 text-orange-300 hover:text-white hover:bg-orange-900/30 border border-orange-700/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>CULTUREKILL</span>
          </button>
        </nav>

        {/* Audio controls */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className={`p-2 rounded-lg border transition-colors ${
            isMuted
              ? 'bg-red-950/40 border-red-700 text-red-400 hover:bg-red-900/50'
              : 'bg-emerald-950/40 border-emerald-700 text-emerald-400 hover:bg-emerald-900/50'
          }`}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};
