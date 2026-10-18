import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../../utils/audio';
import { launchConfetti } from '../../utils/confetti';
import { Upgrade, CasinoStats } from '../../types';

const INITIAL_UPGRADES: Upgrade[] = [
  { name: 'vero slaves', baseCost: 15, pps: 0.1, count: 0, icon: '/minimoose.png' },
  { name: 'game advertisement', baseCost: 100, pps: 1, count: 0, icon: '/rubber_pig.png' },
  { name: 'shady connection', baseCost: 1100, pps: 8, count: 0, icon: '/voot_cruiser.png' },
  { name: 'scout', baseCost: 12000, pps: 47, count: 0, icon: '/irken_armada.png' },
  { name: 'music label', baseCost: 130000, pps: 260, count: 0, icon: '/the_tallest.png' },
  { name: 'waltuh white', baseCost: 1400000, pps: 1400, count: 0, icon: '/megadoomer.png' },
  { name: 'presidential backing', baseCost: 15000000, pps: 7800, count: 0, icon: '/white_house.png' },
  { name: 'adam sandlers approval', baseCost: 200000000, pps: 44000, count: 0, icon: '/adam_sandler.png' },
  { name: 'poland', baseCost: 3300000000, pps: 260000, count: 0, icon: '/poland.png' },
  { name: 'moon mission', baseCost: 51000000000, pps: 1600000, count: 0, icon: '/moon.png' },
  { name: 'nukes luscious ass', baseCost: 750000000000, pps: 10000000, count: 0, icon: '/nuke.png' },
];

const FLAVOR_TEXTS = [
  "I'm gonna sing the Doom Song now! Doom doom doom doom doom...",
  "Why is there bacon in the soap?!",
  "It's not stupid, it's advanced!",
  "Your head smells like a puppy!",
  "I made it myself with special seasoning!",
  "Invader's blood marches through my veins like giant radioactive rubber pants!",
  "You're not a scientist! You're a pastry chef!",
  "Squealing like a defective toaster!"
];

const SLOT1_ICONS = ['/gir.png', '/minimoose.png', '/rubber_pig.png', '/zim_head.png'];
const SLOT2_ICONS = ['/the_tallest.png', '/voot_cruiser.png', '/irken_armada.png', '/nuke.png'];
const WHEEL_PRIZES = [0, 0, 0.5, 0.5, 1, 1, 2, 8];

export const ZimClicker: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [flavorIndex, setFlavorIndex] = useState(0);
  const [clickParticles, setClickParticles] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Casino state
  const [casinoTab, setCasinoTab] = useState<'coin' | 'wheel' | 'crash' | 'bonk'>('coin');
  const [casinoStats, setCasinoStats] = useState<CasinoStats>({ gambled: 0, bestWin: 0, bonks: 0 });

  // Slot machines state
  const [slot1Reels, setSlot1Reels] = useState<string[]>([SLOT1_ICONS[0], SLOT1_ICONS[1], SLOT1_ICONS[2]]);
  const [slot1Spinning, setSlot1Spinning] = useState(false);
  const [slot1Message, setSlot1Message] = useState('');

  const [slot2Reels, setSlot2Reels] = useState<string[]>([SLOT2_ICONS[0], SLOT2_ICONS[1], SLOT2_ICONS[2]]);
  const [slot2Spinning, setSlot2Spinning] = useState(false);
  const [slot2Message, setSlot2Message] = useState('');

  // Minigame: Coin Flip
  const [coinBet, setCoinBet] = useState(100);
  const [coinSide, setCoinSide] = useState<'?' | 'h' | 't'>('?');
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [coinMessage, setCoinMessage] = useState('mr krabs');
  const [coinHistory, setCoinHistory] = useState<string[]>([]);

  // Minigame: Wheel
  const [wheelBet, setWheelBet] = useState(500);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelLabel, setWheelLabel] = useState('?');
  const [wheelMessage, setWheelMessage] = useState('it do not GAF');

  // Minigame: Crash
  const [crashBet, setCrashBet] = useState(250);
  const [crashState, setCrashState] = useState<{ active: boolean; multiplier: number; busted: boolean; startTime: number; bustAt: number } | null>(null);
  const [crashMessage, setCrashMessage] = useState('college fund');
  const crashRef = useRef<number | null>(null);

  // Minigame: Bonk Pig
  const [bonkActive, setBonkActive] = useState(false);
  const [bonkHits, setBonkHits] = useState(0);
  const [bonkTimeLeft, setBonkTimeLeft] = useState(10.0);
  const [bonkTarget, setBonkTarget] = useState<number | null>(null);
  const [bonkCooldownUntil, setBonkCooldownUntil] = useState<number>(0);
  const [bonkMessage, setBonkMessage] = useState('john pork is avoiding taxes');

  // Calculate PPS
  const pps = upgrades.reduce((sum, u) => sum + u.count * u.pps, 0);

  // Auto-generate points loop
  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      setScore((prev) => prev + pps / 10);
    }, 100);
    return () => clearInterval(interval);
  }, [started, pps]);

  // Flavor text rotation
  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      setFlavorIndex((prev) => (prev + 1) % FLAVOR_TEXTS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [started]);

  // Crash game animation frame
  useEffect(() => {
    if (!crashState || !crashState.active) {
      if (crashRef.current) cancelAnimationFrame(crashRef.current);
      return;
    }

    const tick = () => {
      const elapsed = (Date.now() - crashState.startTime) / 1000;
      const currentMult = 1 + 0.35 * elapsed + 0.055 * elapsed * elapsed;

      if (currentMult >= crashState.bustAt) {
        setCrashState((prev) => (prev ? { ...prev, active: false, busted: true, multiplier: prev.bustAt } : null));
        setCrashMessage(`crashed at ${crashState.bustAt.toFixed(2)}x. idiot tax collected`);
        soundManager.play('fail');
      } else {
        setCrashState((prev) => (prev ? { ...prev, multiplier: currentMult } : null));
        crashRef.current = requestAnimationFrame(tick);
      }
    };

    crashRef.current = requestAnimationFrame(tick);
    return () => {
      if (crashRef.current) cancelAnimationFrame(crashRef.current);
    };
  }, [crashState?.active, crashState?.startTime, crashState?.bustAt]);

  // Bonk game timer
  useEffect(() => {
    if (!bonkActive) return;

    const timer = setInterval(() => {
      setBonkTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(timer);
          setBonkActive(false);
          setBonkCooldownUntil(Date.now() + 20000);
          setBonkMessage(`${bonkHits} bonks. your government is very upset`);
          return 0;
        }
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => clearInterval(timer);
  }, [bonkActive, bonkHits]);

  // Format numbers nicely
  const formatNumber = (num: number) => {
    if (num < 1e6) return Math.floor(num).toLocaleString();
    if (num < 1e9) return (num / 1e6).toFixed(2) + 'M';
    if (num < 1e12) return (num / 1e9).toFixed(2) + 'B';
    if (num < 1e15) return (num / 1e12).toFixed(2) + 'T';
    return num.toExponential(2);
  };

  const calculateCost = (upgrade: Upgrade) => {
    return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.count));
  };

  // Click action
  const handleClickZim = (e: React.MouseEvent<HTMLDivElement>) => {
    soundManager.play('click');
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newParticle = {
      id: Date.now() + Math.random(),
      x,
      y,
      text: '+1',
    };
    setClickParticles((prev) => [...prev.slice(-10), newParticle]);
    setTimeout(() => {
      setClickParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 600);

    setScore((prev) => prev + 1);
  };

  // Buy upgrade
  const handleBuyUpgrade = (index: number) => {
    const upgrade = upgrades[index];
    const cost = calculateCost(upgrade);
    if (score >= cost) {
      soundManager.play('buy');
      setScore((prev) => prev - cost);
      setUpgrades((prev) =>
        prev.map((u, i) => (i === index ? { ...u, count: u.count + 1 } : u))
      );
    } else {
      soundManager.play('fail');
    }
  };

  // Save / Load / Reset
  const handleSave = () => {
    const saveData = {
      score,
      upgrades: upgrades.map((u) => ({ count: u.count })),
      casino: casinoStats,
    };
    localStorage.setItem('zimClickerSave', JSON.stringify(saveData));
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('zimClickerSave');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setScore(parsed.score || 0);
        if (Array.isArray(parsed.upgrades)) {
          setUpgrades((prev) =>
            prev.map((u, i) => ({
              ...u,
              count: parsed.upgrades[i]?.count || 0,
            }))
          );
        }
        if (parsed.casino) setCasinoStats(parsed.casino);
        setSaveStatus('Loaded!');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch {
        setSaveStatus('Load Failed');
      }
    } else {
      setSaveStatus('No Save Found');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to erase all your glorious progress for the Irken Empire?')) {
      localStorage.removeItem('zimClickerSave');
      setScore(0);
      setUpgrades(INITIAL_UPGRADES);
      setCasinoStats({ gambled: 0, bestWin: 0, bonks: 0 });
      setSaveStatus('Reset Complete');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // Slot machine 1 spin
  const handleSpinSlot1 = () => {
    const cost = 100;
    if (score < cost || slot1Spinning) {
      soundManager.play('fail');
      return;
    }
    setScore((prev) => prev - cost);
    setSlot1Spinning(true);
    setSlot1Message('Spinning...');
    soundManager.play('slots_spin');

    let count = 0;
    const interval = setInterval(() => {
      setSlot1Reels([
        SLOT1_ICONS[Math.floor(Math.random() * SLOT1_ICONS.length)],
        SLOT1_ICONS[Math.floor(Math.random() * SLOT1_ICONS.length)],
        SLOT1_ICONS[Math.floor(Math.random() * SLOT1_ICONS.length)],
      ]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const finalResults = [
          SLOT1_ICONS[Math.floor(Math.random() * SLOT1_ICONS.length)],
          SLOT1_ICONS[Math.floor(Math.random() * SLOT1_ICONS.length)],
          SLOT1_ICONS[Math.floor(Math.random() * SLOT1_ICONS.length)],
        ];
        setSlot1Reels(finalResults);
        setSlot1Spinning(false);

        if (finalResults[0] === finalResults[1] && finalResults[1] === finalResults[2]) {
          const win = cost * 20;
          setScore((prev) => prev + win);
          setSlot1Message(`TRIPLE WIN! +${formatNumber(win)}!`);
          soundManager.play('slots_win');
          launchConfetti();
        } else if (
          finalResults[0] === finalResults[1] ||
          finalResults[1] === finalResults[2] ||
          finalResults[0] === finalResults[2]
        ) {
          const win = cost * 3;
          setScore((prev) => prev + win);
          setSlot1Message(`DOUBLE! +${formatNumber(win)}.`);
          soundManager.play('success');
        } else {
          setSlot1Message('DEFEAT! Nothing for you!');
          soundManager.play('fail');
        }
      }
    }, 100);
  };

  // Slot machine 2 spin (Super Slots)
  const handleSpinSlot2 = () => {
    const cost = 10000;
    if (score < cost || slot2Spinning) {
      soundManager.play('fail');
      return;
    }
    setScore((prev) => prev - cost);
    setSlot2Spinning(true);
    setSlot2Message('Spinning...');
    soundManager.play('slots_spin');

    let count = 0;
    const interval = setInterval(() => {
      setSlot2Reels([
        SLOT2_ICONS[Math.floor(Math.random() * SLOT2_ICONS.length)],
        SLOT2_ICONS[Math.floor(Math.random() * SLOT2_ICONS.length)],
        SLOT2_ICONS[Math.floor(Math.random() * SLOT2_ICONS.length)],
      ]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const finalResults = [
          SLOT2_ICONS[Math.floor(Math.random() * SLOT2_ICONS.length)],
          SLOT2_ICONS[Math.floor(Math.random() * SLOT2_ICONS.length)],
          SLOT2_ICONS[Math.floor(Math.random() * SLOT2_ICONS.length)],
        ];
        setSlot2Reels(finalResults);
        setSlot2Spinning(false);

        if (finalResults[0] === finalResults[1] && finalResults[1] === finalResults[2]) {
          const win = cost * 50;
          setScore((prev) => prev + win);
          setSlot2Message(`SUPER TRIPLE WIN! +${formatNumber(win)}!`);
          soundManager.play('slots_win');
          launchConfetti({ particleCount: 200, spread: 120 });
        } else if (
          finalResults[0] === finalResults[1] ||
          finalResults[1] === finalResults[2] ||
          finalResults[0] === finalResults[2]
        ) {
          const win = cost * 5;
          setScore((prev) => prev + win);
          setSlot2Message(`SUPER DOUBLE! +${formatNumber(win)}.`);
          soundManager.play('success');
        } else {
          setSlot2Message('DEFEAT! Doom on your house!');
          soundManager.play('fail');
        }
      }
    }, 100);
  };

  // Coin flip
  const handleFlipCoin = (choice: 'heads' | 'tails') => {
    if (coinFlipping || score < coinBet || coinBet < 1) {
      soundManager.play('fail');
      return;
    }
    setScore((prev) => prev - coinBet);
    setCasinoStats((prev) => ({ ...prev, gambled: prev.gambled + coinBet }));
    setCoinFlipping(true);
    soundManager.play('click');

    setTimeout(() => {
      const wonSide = Math.random() < 0.5 ? 'heads' : 'tails';
      const won = choice === wonSide;
      setCoinSide(wonSide === 'heads' ? 'h' : 't');
      setCoinFlipping(false);

      if (won) {
        const prize = Math.floor(coinBet * 1.9);
        setScore((prev) => prev + prize);
        setCasinoStats((prev) => ({
          ...prev,
          bestWin: Math.max(prev.bestWin, prize),
        }));
        setCoinMessage(`correct. +${formatNumber(prize)}. genius behaviour`);
        soundManager.play('success');
        if (prize > 5000) launchConfetti();
      } else {
        setCoinMessage(`wrong. -${formatNumber(coinBet)}. the coin hates you`);
        soundManager.play('fail');
      }

      setCoinHistory((prev) => [wonSide === 'heads' ? 'H' : 'T', ...prev.slice(0, 9)]);
    }, 400);
  };

  // Spin Wheel
  const handleSpinWheel = () => {
    if (wheelSpinning || score < wheelBet || wheelBet < 1) {
      soundManager.play('fail');
      return;
    }
    setScore((prev) => prev - wheelBet);
    setCasinoStats((prev) => ({ ...prev, gambled: prev.gambled + wheelBet }));
    setWheelSpinning(true);
    setWheelMessage('the wheel is consulting its lawyer');
    soundManager.play('slots_spin');

    const winningIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const multiplier = WHEEL_PRIZES[winningIndex];
    const segment = 360 / WHEEL_PRIZES.length;
    const targetRot = wheelAngle + 1440 + winningIndex * segment;
    setWheelAngle(targetRot);

    setTimeout(() => {
      setWheelSpinning(false);
      setWheelLabel(`${multiplier}x`);
      const prize = Math.floor(wheelBet * multiplier);
      if (prize > 0) {
        setScore((prev) => prev + prize);
        setCasinoStats((prev) => ({
          ...prev,
          bestWin: Math.max(prev.bestWin, prize),
        }));
        setWheelMessage(`${multiplier}x. +${formatNumber(prize)} pervitins. suspicious`);
        soundManager.play('success');
        if (prize >= 5000) launchConfetti();
      } else {
        setWheelMessage('0x. the wheel has seized your assets');
        soundManager.play('fail');
      }
    }, 1500);
  };

  // Crash: Start
  const handleStartCrash = () => {
    if (crashState?.active || score < crashBet || crashBet < 1) {
      soundManager.play('fail');
      return;
    }
    setScore((prev) => prev - crashBet);
    setCasinoStats((prev) => ({ ...prev, gambled: prev.gambled + crashBet }));
    soundManager.play('slots_spin');

    const bustAt = Math.max(1.02, Math.min(30, 0.95 / (1 - Math.random())));
    setCrashState({
      active: true,
      multiplier: 1.0,
      busted: false,
      startTime: Date.now(),
      bustAt,
    });
    setCrashMessage('cash out. no pressure. absolutely no pressure');
  };

  // Crash: Cash Out
  const handleCashoutCrash = () => {
    if (!crashState || !crashState.active) return;
    const current = crashState.multiplier;
    const prize = Math.floor(crashBet * current);

    setCrashState((prev) => (prev ? { ...prev, active: false } : null));
    setScore((prev) => prev + prize);
    setCasinoStats((prev) => ({
      ...prev,
      bestWin: Math.max(prev.bestWin, prize),
    }));
    setCrashMessage(`escaped at ${current.toFixed(2)}x. +${formatNumber(prize)}`);
    soundManager.play('success');
    if (prize >= 5000) launchConfetti();
  };

  // Bonk: Start
  const handleStartBonk = () => {
    if (bonkActive || Date.now() < bonkCooldownUntil) return;
    setBonkActive(true);
    setBonkHits(0);
    setBonkTimeLeft(10.0);
    setBonkTarget(Math.floor(Math.random() * 9));
    setBonkMessage('he has committed tax fraud. get him');
    soundManager.play('slots_spin');
  };

  // Bonk: Hit
  const handleHitBonk = (index: number) => {
    if (!bonkActive || bonkTarget !== index) return;
    soundManager.play('click');
    const reward = 10 + Math.min(30, (bonkHits + 1) * 2);
    setScore((prev) => prev + reward);
    setBonkHits((prev) => prev + 1);
    setCasinoStats((prev) => ({ ...prev, bonks: prev.bonks + 1 }));
    setBonkTarget((prev) => ((prev ?? 0) + 1 + Math.floor(Math.random() * 8)) % 9);
  };

  if (!started) {
    return (
      <div
        className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center p-4 overflow-y-auto"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundColor: '#1a0321',
          backgroundRepeat: 'repeat',
          backgroundSize: '300px',
        }}
      >
        <div className="max-w-xl w-full text-center bg-[#1a0321]/95 border-4 border-[#ff00ff] rounded-2xl p-8 shadow-[0_0_30px_#ff00ff,inset_0_0_20px_#9dff00] neon-box">
          <h1 className="text-5xl font-black text-[#ff00ff] drop-shadow-[3px_3px_#00ffff] mb-4 uppercase tracking-wider font-orbitron">
            Zim Clicker
          </h1>
          <p className="text-xl text-[#00ffff] mb-6 italic">
            "waltuh, putcha dick away waltuh"
          </p>
          <button
            onClick={() => {
              soundManager.play('click');
              setStarted(true);
              handleLoad();
            }}
            className="px-8 py-4 bg-[#ff00ff] hover:bg-[#e000e0] text-white font-bold text-2xl rounded-xl shadow-[0_0_20px_#ff00ff] hover:scale-105 transition-all uppercase tracking-wide"
          >
            Start Zimming
          </button>
          <p className="text-sm text-[#9dff00] mt-6 font-mono tracking-wider">
            ★ FOR SUPER EARTH ★
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-50 overflow-y-auto p-2 sm:p-6 font-orbitron"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundColor: '#1a0321',
        backgroundRepeat: 'repeat',
        backgroundSize: '300px',
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 pb-10">
        {/* Left Column: Zim clicker & flavor */}
        <div className="lg:col-span-3 bg-[#1a0321]/90 border-2 border-[#ff00ff] rounded-2xl p-5 shadow-[0_0_20px_rgba(255,0,255,0.4)] flex flex-col items-center justify-between text-center min-h-[420px]">
          <div>
            <h2 className="text-lg font-bold text-[#ff00ff] mb-2 uppercase">IRKEN TARGET</h2>
            <div
              onClick={handleClickZim}
              className="relative cursor-pointer select-none group my-4 inline-block transition-transform active:scale-90 hover:scale-105"
            >
              <img
                src="/zim_head.png"
                alt="Click Zim!"
                className="w-48 h-48 object-contain drop-shadow-[0_0_15px_#ff00ff]"
              />
              {/* Floating particles */}
              {clickParticles.map((p) => (
                <div
                  key={p.id}
                  style={{ left: p.x, top: p.y }}
                  className="absolute pointer-events-none text-xl font-black text-[#ff00ff] drop-shadow-[1px_1px_#00ffff] animate-bounce"
                >
                  {p.text}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#00ffff] font-mono">CLICK TO EXTRACT PERVITIN</p>
          </div>

          <div className="w-full bg-black/60 border border-[#ff00ff]/50 rounded-xl p-3 mt-4 min-h-[80px] flex items-center justify-center">
            <p className="text-xs text-[#9dff00] italic font-mono">
              "{FLAVOR_TEXTS[flavorIndex]}"
            </p>
          </div>
        </div>

        {/* Middle Column: Stats, Slots, and Minigames */}
        <div className="lg:col-span-5 bg-[#1a0321]/90 border-2 border-[#ff00ff] rounded-2xl p-5 shadow-[0_0_20px_rgba(255,0,255,0.4)] flex flex-col gap-5">
          {/* Main Stats Header */}
          <div className="text-center border-b border-[#ff00ff]/30 pb-4">
            <h1 className="text-3xl font-black text-[#ff00ff] drop-shadow-[2px_2px_#00ffff]">
              ZIM CLICKER
            </h1>
            <div className="flex items-center justify-center gap-3 my-2">
              <img src="/pervitin_icon.png" alt="Pervitin" className="w-8 h-8 drop-shadow" />
              <span className="text-4xl font-extrabold text-[#9dff00]">
                {formatNumber(score)}
              </span>
            </div>
            <p className="text-xs text-[#00ffff] font-mono">
              {formatNumber(pps)} pervitins per second
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-black/60 hover:bg-black/90 border border-green-400 text-green-400 text-xs rounded transition"
              >
                Save Progress
              </button>
              <button
                onClick={handleLoad}
                className="px-3 py-1 bg-black/60 hover:bg-black/90 border border-cyan-400 text-cyan-400 text-xs rounded transition"
              >
                Load Progress
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1 bg-black/60 hover:bg-black/90 border border-red-500 text-red-400 text-xs rounded transition"
              >
                Reset
              </button>
            </div>
            {saveStatus && (
              <p className="text-[11px] text-yellow-300 font-mono mt-1 animate-pulse">
                {saveStatus}
              </p>
            )}
          </div>

          {/* Las Vegas Section */}
          <div className="bg-black/40 border border-pink-700/60 rounded-xl p-3">
            <h2 className="text-xl font-bold text-yellow-300 text-center mb-3">
              🎰 LAS VEGAS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* GIR's Slots */}
              <div className="bg-[#15021a] border border-[#ff00ff]/40 rounded-lg p-3 text-center flex flex-col justify-between">
                <h3 className="text-xs font-bold text-[#00ffff] mb-1">GIR'S SLOTS</h3>
                <div className="flex justify-center gap-1.5 bg-black/70 p-2 rounded border border-gray-800 my-2">
                  {slot1Reels.map((icon, i) => (
                    <img key={i} src={icon} alt="reel" className="w-9 h-9 object-contain" />
                  ))}
                </div>
                <button
                  onClick={handleSpinSlot1}
                  disabled={score < 100 || slot1Spinning}
                  className="w-full py-1.5 bg-[#ff00ff] hover:bg-[#d400d4] disabled:bg-gray-700 text-black font-bold text-xs rounded transition uppercase"
                >
                  {slot1Spinning ? '...' : 'Spin (100)'}
                </button>
                <p className="text-[10px] text-yellow-400 mt-1 min-h-[16px]">
                  {slot1Message}
                </p>
              </div>

              {/* Super Slots */}
              <div className="bg-[#15021a] border border-[#ff00ff]/40 rounded-lg p-3 text-center flex flex-col justify-between">
                <h3 className="text-xs font-bold text-yellow-300 mb-1">SUPER SLOTS OF DOOM</h3>
                <div className="flex justify-center gap-1.5 bg-black/70 p-2 rounded border border-gray-800 my-2">
                  {slot2Reels.map((icon, i) => (
                    <img key={i} src={icon} alt="reel" className="w-9 h-9 object-contain" />
                  ))}
                </div>
                <button
                  onClick={handleSpinSlot2}
                  disabled={score < 10000 || slot2Spinning}
                  className="w-full py-1.5 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-700 text-black font-bold text-xs rounded transition uppercase"
                >
                  {slot2Spinning ? '...' : 'Spin (10k)'}
                </button>
                <p className="text-[10px] text-yellow-400 mt-1 min-h-[16px]">
                  {slot2Message}
                </p>
              </div>
            </div>
          </div>

          {/* College Fund Drainer (4 Casino Modes) */}
          <div className="bg-black/50 border border-[#00ffff]/40 rounded-xl p-4">
            <div className="text-center mb-3">
              <h2 className="text-lg font-black text-[#00ffff] uppercase">
                COLLEGE FUND DRAINER
              </h2>
              <p className="text-[11px] text-gray-400 font-mono">four MORE gambling options</p>
            </div>

            {/* Casino Tabs */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {(['coin', 'wheel', 'crash', 'bonk'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    soundManager.play('click');
                    setCasinoTab(tab);
                  }}
                  className={`py-1 rounded text-[11px] font-bold uppercase transition ${
                    casinoTab === tab
                      ? 'bg-[#00ffff] text-black shadow-[0_0_10px_#00ffff]'
                      : 'bg-black/60 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {tab === 'crash' ? 'number up' : tab}
                </button>
              ))}
            </div>

            {/* Tab: Coin */}
            {casinoTab === 'coin' && (
              <div className="text-center flex flex-col items-center">
                <p className="text-xs text-gray-300 mb-2 font-mono">give head or eat tails</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-yellow-300">Bet:</span>
                  <input
                    type="number"
                    value={coinBet}
                    onChange={(e) => setCoinBet(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-2 py-1 bg-black border border-gray-600 rounded text-center text-xs text-white"
                  />
                  <button
                    onClick={() => setCoinBet(Math.floor(score))}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] rounded"
                  >
                    MAX
                  </button>
                </div>
                <div
                  className={`w-14 h-14 rounded-full border-2 border-yellow-400 bg-yellow-950 flex items-center justify-center text-xl font-black text-yellow-300 shadow-[0_0_15px_#eab308] my-2 ${
                    coinFlipping ? 'animate-coin-flip' : ''
                  }`}
                >
                  {coinSide}
                </div>
                <div className="flex gap-3 my-2">
                  <button
                    onClick={() => handleFlipCoin('heads')}
                    disabled={coinFlipping || score < coinBet}
                    className="px-4 py-1.5 bg-[#ff00ff] hover:bg-[#d000d0] disabled:bg-gray-700 text-black font-bold text-xs rounded uppercase"
                  >
                    HEADS
                  </button>
                  <button
                    onClick={() => handleFlipCoin('tails')}
                    disabled={coinFlipping || score < coinBet}
                    className="px-4 py-1.5 bg-[#00ffff] hover:bg-[#00d0d0] disabled:bg-gray-700 text-black font-bold text-xs rounded uppercase"
                  >
                    TAILS
                  </button>
                </div>
                <p className="text-xs text-yellow-300 font-mono mt-1 min-h-[18px]">
                  {coinMessage}
                </p>
                {coinHistory.length > 0 && (
                  <div className="flex gap-1 mt-2 text-[10px] font-mono text-gray-400">
                    <span>History:</span>
                    {coinHistory.map((s, i) => (
                      <span key={i} className="px-1 bg-black border border-gray-700 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Wheel */}
            {casinoTab === 'wheel' && (
              <div className="text-center flex flex-col items-center">
                <p className="text-xs text-gray-300 mb-2 font-mono">ALL ON 8X BABY</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-yellow-300">Bet:</span>
                  <input
                    type="number"
                    value={wheelBet}
                    onChange={(e) => setWheelBet(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-2 py-1 bg-black border border-gray-600 rounded text-center text-xs text-white"
                  />
                  <button
                    onClick={() => setWheelBet(Math.floor(score))}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] rounded"
                  >
                    MAX
                  </button>
                </div>
                <div className="relative w-32 h-32 my-2 flex items-center justify-center">
                  <div
                    style={{ transform: `rotate(${wheelAngle}deg)` }}
                    className="w-full h-full rounded-full border-4 border-[#ff00ff] bg-gradient-to-tr from-pink-900 via-purple-900 to-indigo-900 shadow-[0_0_20px_#ff00ff] transition-transform duration-[1500ms] flex items-center justify-center"
                  >
                    <span className="text-2xl font-black text-yellow-300 drop-shadow">
                      {wheelLabel}
                    </span>
                  </div>
                  <div className="absolute top-0 w-3 h-3 bg-yellow-400 rotate-45 transform -translate-y-1" />
                </div>
                <button
                  onClick={handleSpinWheel}
                  disabled={wheelSpinning || score < wheelBet}
                  className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-700 text-black font-bold text-xs rounded uppercase mt-2"
                >
                  {wheelSpinning ? 'Spinning...' : 'Spin The Square'}
                </button>
                <p className="text-xs text-yellow-300 font-mono mt-2 min-h-[18px]">
                  {wheelMessage}
                </p>
              </div>
            )}

            {/* Tab: Crash */}
            {casinoTab === 'crash' && (
              <div className="text-center flex flex-col items-center">
                <p className="text-xs text-gray-300 mb-2 font-mono">GOLDGOLDGOLDGOLD</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-yellow-300">Bet:</span>
                  <input
                    type="number"
                    value={crashBet}
                    onChange={(e) => setCrashBet(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-2 py-1 bg-black border border-gray-600 rounded text-center text-xs text-white"
                  />
                  <button
                    onClick={() => setCrashBet(Math.floor(score))}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[10px] rounded"
                  >
                    MAX
                  </button>
                </div>
                <div className="text-3xl font-black my-2">
                  <span
                    className={
                      crashState?.busted
                        ? 'text-red-500 animate-pulse'
                        : crashState?.active
                        ? 'text-[#00ff88]'
                        : 'text-white'
                    }
                  >
                    {crashState ? `${crashState.multiplier.toFixed(2)}x` : '1.00x'}
                  </span>
                </div>
                {/* Meter fill */}
                <div className="w-48 h-3 bg-black border border-gray-700 rounded-full overflow-hidden mb-3">
                  <div
                    style={{
                      width: `${Math.min(100, (((crashState?.multiplier || 1) - 1) / 9) * 100)}%`,
                    }}
                    className={`h-full transition-all ${
                      crashState?.busted ? 'bg-red-600' : 'bg-[#00ff88]'
                    }`}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleStartCrash}
                    disabled={Boolean(crashState?.active) || score < crashBet}
                    className="px-4 py-1.5 bg-[#00ff88] hover:bg-[#00cc6e] disabled:bg-gray-700 text-black font-bold text-xs rounded uppercase"
                  >
                    Send It
                  </button>
                  <button
                    onClick={handleCashoutCrash}
                    disabled={!crashState?.active}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white font-bold text-xs rounded uppercase"
                  >
                    Pussy Out
                  </button>
                </div>
                <p className="text-xs text-yellow-300 font-mono mt-2 min-h-[18px]">
                  {crashMessage}
                </p>
              </div>
            )}

            {/* Tab: Bonk Pig */}
            {casinoTab === 'bonk' && (
              <div className="text-center flex flex-col items-center">
                <p className="text-xs text-gray-300 mb-2 font-mono">man BEAT THAT MFER</p>
                <div className="flex justify-between w-full max-w-xs text-xs font-mono text-cyan-300 mb-2">
                  <span>Time: <strong>{bonkTimeLeft}</strong>s</span>
                  <span>Porks: <strong>{bonkHits}</strong></span>
                </div>
                <div className="grid grid-cols-3 gap-2 w-48 h-48 my-2">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleHitBonk(i)}
                      className={`rounded-lg border-2 flex items-center justify-center p-1 transition ${
                        bonkTarget === i && bonkActive
                          ? 'border-pink-500 bg-pink-900/60 shadow-[0_0_10px_#ff00ff]'
                          : 'border-gray-800 bg-black/60'
                      }`}
                    >
                      {bonkTarget === i && bonkActive && (
                        <img
                          src="/rubber_pig.png"
                          alt="John Pork"
                          className="w-10 h-10 object-contain animate-bounce"
                        />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleStartBonk}
                  disabled={bonkActive || Date.now() < bonkCooldownUntil}
                  className="px-4 py-1.5 bg-[#ff00ff] hover:bg-[#d000d0] disabled:bg-gray-700 text-black font-bold text-xs rounded uppercase mt-2"
                >
                  {bonkActive ? 'Pig Currently Loose' : 'Release John Pork'}
                </button>
                <p className="text-xs text-yellow-300 font-mono mt-2 min-h-[18px]">
                  {bonkMessage}
                </p>
              </div>
            )}

            <div className="flex justify-between text-[10px] text-gray-400 font-mono border-t border-gray-800 pt-2 mt-3">
              <span>Gambled: {formatNumber(casinoStats.gambled)}</span>
              <span>Best Zim: {formatNumber(casinoStats.bestWin)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: The Zlack Zlarket Upgrades */}
        <div className="lg:col-span-4 bg-[#1a0321]/90 border-2 border-[#ff00ff] rounded-2xl p-5 shadow-[0_0_20px_rgba(255,0,255,0.4)] flex flex-col">
          <h2 className="text-xl font-black text-[#ff00ff] drop-shadow-[2px_2px_#00ffff] text-center mb-3 uppercase">
            THE ZLACK ZLARKET
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[700px] pr-1">
            {upgrades.map((upgrade, idx) => {
              const cost = calculateCost(upgrade);
              const canAfford = score >= cost;
              return (
                <div
                  key={upgrade.name}
                  onClick={() => handleBuyUpgrade(idx)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                    canAfford
                      ? 'border-[#00ffff] bg-black/60 hover:bg-[#00ffff]/10 shadow-[0_0_8px_rgba(0,255,255,0.3)] hover:scale-[1.02]'
                      : 'border-gray-800 bg-black/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={upgrade.icon}
                      alt={upgrade.name}
                      className="w-10 h-10 object-contain rounded bg-black/60 p-1 border border-gray-700"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white capitalize">
                        {upgrade.name}
                      </h4>
                      <p className="text-[11px] text-[#9dff00] font-mono">
                        Cost: {formatNumber(cost)}
                      </p>
                      <p className="text-[10px] text-gray-400">+{upgrade.pps} PPS</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-[#00ffff]">
                      {upgrade.count}
                    </span>
                    <span className="block text-[9px] text-gray-500 uppercase">Owned</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
