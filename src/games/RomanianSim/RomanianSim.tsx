import React, { useState, useEffect } from 'react';
import { soundManager } from '../../utils/audio';
import { RomanianPart, RomanianState } from '../../types';
import { launchConfetti } from '../../utils/confetti';

const INITIAL_PARTS: RomanianPart[] = [
  { id: 'gpu', name: 'GPU', value: 1600, removed: false, prerequisites: [] },
  { id: 'ram1', name: 'RAM Stick 1', value: 100, removed: false, prerequisites: [] },
  { id: 'ram2', name: 'RAM Stick 2', value: 100, removed: false, prerequisites: [] },
  { id: 'cpu-cooler', name: 'CPU Cooler', value: 80, removed: false, prerequisites: [] },
  { id: 'ssd', name: 'M.2 SSD', value: 120, removed: false, prerequisites: [] },
  { id: 'cpu', name: 'Intel CPU', value: 500, removed: false, prerequisites: ['cpu-cooler'] },
  { id: 'motherboard', name: 'Motherboard', value: 300, removed: false, prerequisites: ['gpu', 'ram1', 'ram2', 'cpu', 'ssd'] },
  { id: 'psu', name: 'Modular PSU', value: 150, removed: false, prerequisites: ['crowbar'] },
];

const DEFAULT_STATE: RomanianState = {
  bankBalance: 0,
  upgrades: {
    timeBonus: 0,
    valueMultiplier: 1.0,
    hasCrowbar: false,
  },
};

export const RomanianSim: React.FC = () => {
  const [screen, setScreen] = useState<'start' | 'hub' | 'shop' | 'game' | 'end'>('start');
  const [gameState, setGameState] = useState<RomanianState>(DEFAULT_STATE);
  const [parts, setParts] = useState<RomanianPart[]>(INITIAL_PARTS);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentScore, setCurrentScore] = useState(0);
  const [endResult, setEndResult] = useState<{ victory: boolean; message: string; loot: number }>({
    victory: false,
    message: '',
    loot: 0,
  });
  const [shakingPart, setShakingPart] = useState<string | null>(null);

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('romanian_sim_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        setGameState({ ...DEFAULT_STATE, ...parsed });
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveState = (newState: RomanianState) => {
    setGameState(newState);
    localStorage.setItem('romanian_sim_state', JSON.stringify(newState));
  };

  // Timer loop during heist
  useEffect(() => {
    if (screen !== 'game') {
      soundManager.stopMusic();
      return;
    }

    soundManager.playMusic('romanian_bg');

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameOver(false, 'Busted! The police arrived and confiscated everything.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      soundManager.stopMusic();
    };
  }, [screen]);

  // Start new heist
  const handleStartHeist = () => {
    soundManager.play('click');
    const randomizedSeconds = Math.floor(Math.random() * 41) + 20 + gameState.upgrades.timeBonus;
    setTimeLeft(randomizedSeconds);
    setCurrentScore(0);
    setParts(INITIAL_PARTS.map((p) => ({ ...p, removed: false })));
    setScreen('game');
  };

  // Handle clicking a component
  const handlePartClick = (partId: string) => {
    const part = parts.find((p) => p.id === partId);
    if (!part || part.removed) return;

    // Check prerequisites
    const canRemove = part.prerequisites.every((prereq) => {
      if (prereq === 'crowbar') return gameState.upgrades.hasCrowbar;
      const prereqPart = parts.find((p) => p.id === prereq);
      return prereqPart?.removed;
    });

    if (canRemove) {
      soundManager.play('unscrew');
      const earned = Math.round(part.value * gameState.upgrades.valueMultiplier);
      const newScore = currentScore + earned;
      setCurrentScore(newScore);

      const nextParts = parts.map((p) => (p.id === partId ? { ...p, removed: true } : p));
      setParts(nextParts);

      // Check if all parts removed
      if (nextParts.every((p) => p.removed)) {
        handleGameOver(true, 'Full Rig Stripped! Legendary Heist Completed!');
      }
    } else {
      soundManager.play('fail');
      setShakingPart(partId);
      setTimeout(() => setShakingPart(null), 400);
    }
  };

  // Escape with current loot
  const handleEscape = () => {
    soundManager.play('click');
    handleGameOver(true, 'Escaped Safely with Stolen Hardware!');
  };

  // Finish game
  const handleGameOver = (victory: boolean, message: string) => {
    soundManager.stopMusic();
    if (victory) {
      soundManager.play('success');
      launchConfetti();
      const updatedBalance = gameState.bankBalance + currentScore;
      const updated = { ...gameState, bankBalance: updatedBalance };
      saveState(updated);
      setEndResult({ victory: true, message, loot: currentScore });
    } else {
      soundManager.play('fail');
      // On arrest, bank balance wiped
      const updated = { ...gameState, bankBalance: 0 };
      saveState(updated);
      setEndResult({ victory: false, message, loot: 0 });
    }
    setScreen('end');
  };

  // Shop item buy
  const handleBuyShopItem = (itemType: 'toolkit' | 'crowbar' | 'contact', price: number) => {
    if (gameState.bankBalance < price) {
      soundManager.play('fail');
      return;
    }

    soundManager.play('buy');
    const nextState = { ...gameState, bankBalance: gameState.bankBalance - price };

    if (itemType === 'toolkit') {
      nextState.upgrades.timeBonus += 5;
    } else if (itemType === 'crowbar') {
      nextState.upgrades.hasCrowbar = true;
    } else if (itemType === 'contact') {
      nextState.upgrades.valueMultiplier = Number(
        (nextState.upgrades.valueMultiplier + 0.1).toFixed(1)
      );
    }

    saveState(nextState);
  };

  const isCoolerRemoved = parts.find((p) => p.id === 'cpu-cooler')?.removed;

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center p-2 sm:p-6 font-vt323 text-green-400 overflow-y-auto"
      style={{
        backgroundImage: "url('/house_interior.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-5xl bg-black/90 p-4 sm:p-8 rounded-none sm:rounded-2xl backdrop-blur-md">
        {/* START SCREEN */}
        {screen === 'start' && (
          <div className="text-center py-8">
            <h1 className="text-5xl sm:text-7xl font-bold text-[#ff00ff] drop-shadow-[0_0_15px_#ff00ff] mb-2">
              ROMANIAN SIMULATOR
            </h1>
            <h2 className="text-3xl text-[#0f0] mb-4">COMPONENT CONQUEST</h2>
            <p className="text-2xl text-gray-300 max-w-lg mx-auto mb-8 font-mono">
              Break in, strip the PC components, and get out before the police timer hits zero!
            </p>
            <button
              onClick={() => {
                soundManager.play('click');
                setScreen('hub');
              }}
              className="px-8 py-4 bg-[#0f0] hover:bg-[#ff00ff] text-black hover:text-white text-3xl font-bold rounded-lg transition-all shadow-[0_0_15px_#0f0] hover:scale-105"
            >
              START YOUR CAREER
            </button>
          </div>
        )}

        {/* HIDEOUT HUB */}
        {screen === 'hub' && (
          <div className="text-center py-6">
            <h1 className="text-5xl font-bold text-[#ff00ff] mb-2">THE HIDEOUT</h1>
            <p className="text-3xl text-gray-200 mb-6 font-mono">
              Safehouse Bank Balance:{' '}
              <span className="text-[#0f0] font-black text-4xl">
                {gameState.bankBalance} Lei
              </span>
            </p>

            <div className="bg-black/60 border border-green-700/60 rounded-xl p-4 max-w-md mx-auto mb-8 text-left text-lg text-gray-300 font-mono space-y-1">
              <p>⏱️ Extra Heist Time: +{gameState.upgrades.timeBonus}s</p>
              <p>🪓 Crowbar Equipped: {gameState.upgrades.hasCrowbar ? 'YES (PSU Ready)' : 'NO'}</p>
              <p>💰 Value Multiplier: {gameState.upgrades.valueMultiplier}x</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={handleStartHeist}
                className="px-8 py-3 bg-[#0f0] hover:bg-[#00cc00] text-black text-2xl font-bold rounded-lg shadow-[0_0_15px_#0f0] transition hover:scale-105"
              >
                START NEW HEIST
              </button>
              <button
                onClick={() => {
                  soundManager.play('click');
                  setScreen('shop');
                }}
                className="px-8 py-3 bg-[#ff00ff] hover:bg-[#d000d0] text-white text-2xl font-bold rounded-lg shadow-[0_0_15px_#ff00ff] transition hover:scale-105"
              >
                VISIT SHADY SHOP
              </button>
            </div>
          </div>
        )}

        {/* SHADY SHOP */}
        {screen === 'shop' && (
          <div className="py-4">
            <div className="flex justify-between items-center border-b-2 border-[#0f0]/50 pb-3 mb-6">
              <h1 className="text-4xl font-bold text-[#ff00ff]">SHADY GOODS</h1>
              <p className="text-2xl font-mono text-[#0f0]">
                Wallet: {gameState.bankBalance} Lei
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Item 1: Toolkit */}
              <div className="bg-black/70 border border-green-500 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#0f0] mb-1">Advanced Toolkit</h3>
                  <p className="text-lg text-gray-300 font-mono mb-2">
                    Permanently adds +5s to heist timer. (Bought {gameState.upgrades.timeBonus / 5}/5 times)
                  </p>
                </div>
                <div>
                  <p className="text-xl text-yellow-300 font-bold mb-2">Cost: 500 Lei</p>
                  <button
                    disabled={
                      gameState.upgrades.timeBonus >= 25 || gameState.bankBalance < 500
                    }
                    onClick={() => handleBuyShopItem('toolkit', 500)}
                    className="w-full py-2 bg-[#0f0] hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-400 text-black font-bold text-xl rounded transition"
                  >
                    {gameState.upgrades.timeBonus >= 25 ? 'MAX OWNED' : 'BUY'}
                  </button>
                </div>
              </div>

              {/* Item 2: Crowbar */}
              <div className="bg-black/70 border border-green-500 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#0f0] mb-1">Heavy Crowbar</h3>
                  <p className="text-lg text-gray-300 font-mono mb-2">
                    Required to pry out the bulky PSU from the chassis. One-time purchase.
                  </p>
                </div>
                <div>
                  <p className="text-xl text-yellow-300 font-bold mb-2">Cost: 200 Lei</p>
                  <button
                    disabled={gameState.upgrades.hasCrowbar || gameState.bankBalance < 200}
                    onClick={() => handleBuyShopItem('crowbar', 200)}
                    className="w-full py-2 bg-[#0f0] hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-400 text-black font-bold text-xl rounded transition"
                  >
                    {gameState.upgrades.hasCrowbar ? 'OWNED' : 'BUY'}
                  </button>
                </div>
              </div>

              {/* Item 3: Shady Contact */}
              <div className="bg-black/70 border border-green-500 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#0f0] mb-1">Shady Contact</h3>
                  <p className="text-lg text-gray-300 font-mono mb-2">
                    Permanently boosts hardware resale value by +10%. (Bought {Math.round((gameState.upgrades.valueMultiplier - 1.0) * 10)}/3 times)
                  </p>
                </div>
                <div>
                  <p className="text-xl text-yellow-300 font-bold mb-2">Cost: 1000 Lei</p>
                  <button
                    disabled={
                      Math.round((gameState.upgrades.valueMultiplier - 1.0) * 10) >= 3 ||
                      gameState.bankBalance < 1000
                    }
                    onClick={() => handleBuyShopItem('contact', 1000)}
                    className="w-full py-2 bg-[#0f0] hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-400 text-black font-bold text-xl rounded transition"
                  >
                    {Math.round((gameState.upgrades.valueMultiplier - 1.0) * 10) >= 3
                      ? 'MAX OWNED'
                      : 'BUY'}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  soundManager.play('click');
                  setScreen('hub');
                }}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xl rounded border border-gray-600"
              >
                BACK TO HIDEOUT
              </button>
            </div>
          </div>
        )}

        {/* HEIST GAME SCREEN */}
        {screen === 'game' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Motherboard Disassembly Area */}
            <div className="md:col-span-8 bg-black/80 border-2 border-[#0f0] rounded-xl p-4 relative min-h-[460px] flex items-center justify-center overflow-hidden">
              {/* Motherboard base image */}
              <img
                src="/motherboard.png"
                alt="Motherboard"
                onClick={() => handlePartClick('motherboard')}
                className={`max-w-full max-h-[420px] object-contain cursor-pointer transition transform ${
                  parts.find((p) => p.id === 'motherboard')?.removed
                    ? 'opacity-20 scale-90 pointer-events-none'
                    : 'hover:brightness-110'
                } ${shakingPart === 'motherboard' ? 'animate-shake' : ''}`}
              />

              {/* Components overlaid */}
              {/* GPU */}
              {!parts.find((p) => p.id === 'gpu')?.removed && (
                <img
                  src="/gpu.png"
                  alt="GPU"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePartClick('gpu');
                  }}
                  className={`absolute top-[48%] left-[20%] w-[38%] object-contain cursor-pointer transition hover:scale-105 drop-shadow-[0_0_8px_#00ff00] ${
                    shakingPart === 'gpu' ? 'animate-shake' : ''
                  }`}
                />
              )}

              {/* CPU Cooler */}
              {!parts.find((p) => p.id === 'cpu-cooler')?.removed && (
                <img
                  src="/cpu-cooler.png"
                  alt="CPU Cooler"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePartClick('cpu-cooler');
                  }}
                  className={`absolute top-[20%] left-[30%] w-[26%] object-contain cursor-pointer transition hover:scale-105 drop-shadow-[0_0_8px_#00ff00] ${
                    shakingPart === 'cpu-cooler' ? 'animate-shake' : ''
                  }`}
                />
              )}

              {/* CPU (revealed after cooler removed) */}
              {isCoolerRemoved && !parts.find((p) => p.id === 'cpu')?.removed && (
                <img
                  src="/cpu.png"
                  alt="CPU"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePartClick('cpu');
                  }}
                  className={`absolute top-[28%] left-[38%] w-[12%] object-contain cursor-pointer transition hover:scale-105 drop-shadow-[0_0_8px_#ff00ff] animate-pulse ${
                    shakingPart === 'cpu' ? 'animate-shake' : ''
                  }`}
                />
              )}

              {/* RAM 1 */}
              {!parts.find((p) => p.id === 'ram1')?.removed && (
                <img
                  src="/ram.png"
                  alt="RAM 1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePartClick('ram1');
                  }}
                  className={`absolute top-[18%] left-[62%] w-[7%] object-contain cursor-pointer transition hover:scale-105 drop-shadow-[0_0_8px_#00ff00] ${
                    shakingPart === 'ram1' ? 'animate-shake' : ''
                  }`}
                />
              )}

              {/* RAM 2 */}
              {!parts.find((p) => p.id === 'ram2')?.removed && (
                <img
                  src="/ram.png"
                  alt="RAM 2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePartClick('ram2');
                  }}
                  className={`absolute top-[18%] left-[71%] w-[7%] object-contain cursor-pointer transition hover:scale-105 drop-shadow-[0_0_8px_#00ff00] ${
                    shakingPart === 'ram2' ? 'animate-shake' : ''
                  }`}
                />
              )}

              {/* SSD */}
              {!parts.find((p) => p.id === 'ssd')?.removed && (
                <img
                  src="/ssd.png"
                  alt="SSD"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePartClick('ssd');
                  }}
                  className={`absolute top-[68%] left-[58%] w-[18%] object-contain cursor-pointer transition hover:scale-105 drop-shadow-[0_0_8px_#00ff00] ${
                    shakingPart === 'ssd' ? 'animate-shake' : ''
                  }`}
                />
              )}

              {/* PSU */}
              {!parts.find((p) => p.id === 'psu')?.removed && (
                <img
                  src="/psu.png"
                  alt="PSU"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePartClick('psu');
                  }}
                  className={`absolute bottom-3 left-3 w-[26%] object-contain cursor-pointer transition hover:scale-105 drop-shadow-[0_0_8px_#00ff00] ${
                    shakingPart === 'psu' ? 'animate-shake' : ''
                  }`}
                />
              )}
            </div>

            {/* Right: Heist Info & Loot inventory */}
            <div className="md:col-span-4 bg-black/70 border border-[#0f0]/60 rounded-xl p-4 flex flex-col justify-between min-h-[460px]">
              <div>
                <div className="bg-red-950/60 border border-red-500 rounded p-2 text-center mb-4">
                  <span className="text-3xl font-black text-red-400">
                    TIME LEFT: {timeLeft}s
                  </span>
                </div>

                <div className="border border-green-500/50 rounded p-3 mb-4 max-h-48 overflow-y-auto">
                  <h3 className="text-xl font-bold text-yellow-300 border-b border-gray-700 pb-1 mb-2">
                    STOLEN HARDWARE
                  </h3>
                  <ul className="text-base font-mono space-y-1">
                    {parts
                      .filter((p) => p.removed)
                      .map((p) => (
                        <li key={p.id} className="text-green-300 flex justify-between">
                          <span>✔ {p.name}</span>
                          <span>+{Math.round(p.value * gameState.upgrades.valueMultiplier)} Lei</span>
                        </li>
                      ))}
                    {parts.every((p) => !p.removed) && (
                      <li className="text-gray-500 italic">No parts unscrewed yet</li>
                    )}
                  </ul>
                </div>

                <div className="bg-black/80 p-2 rounded border border-gray-700 text-center mb-4">
                  <span className="text-xl text-gray-300 font-mono">Current Loot Value:</span>
                  <div className="text-3xl font-black text-[#0f0]">{currentScore} Lei</div>
                </div>

                <div className="text-xs text-gray-400 font-mono mb-4 leading-relaxed bg-black/50 p-2 rounded">
                  <strong className="text-yellow-400 block mb-1">PC Builder In Reverse:</strong>
                  - Remove cooler before CPU.<br />
                  - Remove GPU, RAM, SSD, CPU before Motherboard.<br />
                  - Crowbar needed to pry PSU.
                </div>
              </div>

              <button
                onClick={handleEscape}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-2xl rounded-lg shadow-[0_0_15px_#eab308] uppercase transition transform active:scale-95"
              >
                ESCAPE NOW!
              </button>
            </div>
          </div>
        )}

        {/* END SCREEN */}
        {screen === 'end' && (
          <div className="text-center py-8">
            <h2
              className={`text-5xl font-black mb-3 ${
                endResult.victory ? 'text-[#0f0]' : 'text-red-500 animate-pulse'
              }`}
            >
              {endResult.message}
            </h2>
            <p className="text-3xl text-gray-200 mb-8 font-mono">
              Final Heist Payout: <span className="text-[#0f0] font-black">{endResult.loot} Lei</span>
            </p>
            <button
              onClick={() => {
                soundManager.play('click');
                setScreen('hub');
              }}
              className="px-8 py-3 bg-[#0f0] hover:bg-[#ff00ff] text-black hover:text-white text-3xl font-bold rounded-lg shadow-[0_0_15px_#0f0] transition hover:scale-105"
            >
              {endResult.victory ? 'BACK TO HIDEOUT' : 'RETRY CAREER'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
