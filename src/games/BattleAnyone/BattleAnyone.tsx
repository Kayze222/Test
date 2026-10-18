import React, { useState, useEffect, useRef } from 'react';
import { soundManager } from '../../utils/audio';
import { BattleEnemy, BattlePlayer, BattleItem, BattleAttack } from '../../types';
import { launchConfetti } from '../../utils/confetti';

const PRESET_ENEMIES = [
  {
    name: 'Walter White',
    sprite: '/walter_white.png',
    personality: 'Meth kingpin Heisenberg, calculated, ruthless, speaks of chemistry, empires, and knocking.',
  },
  {
    name: 'Adam Sandler',
    sprite: '/adam_sandler.png',
    personality: 'Eccentric comedy golf superstar, erratic yelling, references operas, gibberish, and gym shoes.',
  },
  {
    name: 'Invader Zim',
    sprite: '/zim_head.png',
    personality: 'Arrogant alien invader with megalomania, screaming about doomed human filth and the Irken Armada.',
  },
  {
    name: 'GIR with Tacos',
    sprite: '/gir.png',
    personality: 'Chaotic robot eating waffles and tacos, singing the doom song and dancing randomly.',
  },
];

const DEFAULT_ITEMS: BattleItem[] = [
  { id: 1, name: 'Healing Potion', description: 'Restores 30 HP', effect: 'heal', value: 30 },
  { id: 2, name: 'Defense Shield', description: 'Reduces incoming damage by 6', effect: 'defense', value: 6 },
  { id: 3, name: 'Power Boost', description: 'Increases attack damage by 8', effect: 'attack', value: 8 },
];

export const BattleAnyone: React.FC = () => {
  const [gameState, setGameState] = useState<'setup' | 'battle'>('setup');

  // Setup form states
  const [enemyName, setEnemyName] = useState('Walter White');
  const [enemyPersonality, setEnemyPersonality] = useState(PRESET_ENEMIES[0].personality);
  const [enemySprite, setEnemySprite] = useState<string>(PRESET_ENEMIES[0].sprite);
  const [enemyCustomHealth, setEnemyCustomHealth] = useState<string>('120');
  const [playerCustomHealth, setPlayerCustomHealth] = useState<string>('100');

  // Custom Item Form
  const [customItemName, setCustomItemName] = useState('');
  const [customItemType, setCustomItemType] = useState<'heal' | 'defense' | 'attack'>('heal');
  const [customItemValue, setCustomItemValue] = useState(15);
  const [inventory, setInventory] = useState<BattleItem[]>(DEFAULT_ITEMS);

  // Battle State
  const [enemy, setEnemy] = useState<BattleEnemy | null>(null);
  const [player, setPlayer] = useState<BattlePlayer>({
    name: 'You',
    maxHealth: 100,
    currentHealth: 100,
    avatar: null,
    inventory: DEFAULT_ITEMS,
  });

  const [currentDialogue, setCurrentDialogue] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dialogueQueue, setDialogueQueue] = useState<string[]>([]);
  const [battleEnd, setBattleEnd] = useState<'victory' | 'defeat' | null>(null);
  const [showEnemyHit, setShowEnemyHit] = useState(false);
  const [showPlayerHit, setShowPlayerHit] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttackOptions, setShowAttackOptions] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  const typingTimeoutRef = useRef<number | null>(null);

  // Switch music depending on game state
  useEffect(() => {
    if (gameState === 'battle') {
      soundManager.playMusic('undertale_battle');
    } else {
      soundManager.playMusic('undertale_menu');
    }

    return () => {
      soundManager.stopMusic();
    };
  }, [gameState]);

  // Handle enemy image upload
  const handleSpriteUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setEnemySprite(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate procedural enemy data based on personality & name
  const generateEnemyData = (name: string, personality: string, customHp: string): BattleEnemy => {
    const hp = parseInt(customHp) || 120;
    const lowerP = personality.toLowerCase();

    // Contextual dialogue & attacks matching personality
    const attacks: BattleAttack[] = [
      {
        name: lowerP.includes('meth') ? 'Fulminated Mercury' : lowerP.includes('alien') ? 'Laser Cannon' : 'Vicious Slam',
        type: 'damage',
        value: 16,
        description: `${name} unleashes a devastating attack!`,
        chance: 3,
      },
      {
        name: lowerP.includes('meth') ? 'Purity Analysis' : 'Defensive Wall',
        type: 'block',
        value: 8,
        description: `${name} prepares to deflect your incoming assault!`,
        chance: 2,
      },
      {
        name: lowerP.includes('taco') ? 'Snack Break' : 'Restorative Surge',
        type: 'heal',
        value: 20,
        description: `${name} repairs their vitals!`,
        chance: 2,
      },
      {
        name: lowerP.includes('empire') ? 'I Am The One Who Knocks' : 'Apocalyptic Blast',
        type: 'special',
        value: 28,
        description: `${name} activates their ultimate technique!`,
        chance: 1,
      },
    ];

    const dialogue = {
      intro: [
        `* ${name} blocks the path!`,
        `* You feel like you're going to have a chaotic time.`,
        `* "${personality.slice(0, 70)}..."`,
      ],
      attack: [
        `* ${name} readies their strike with cold determination!`,
        `* "${name}: You think you can overcome my power?"`,
        `* The battlefield vibrates with hostile intent.`,
        `* "${name}: Tread lightly."`,
      ],
      block: [
        `* ${name} calculates your move and raises a barrier!`,
        `* "${name}: Ineffective, child."`,
      ],
      heal: [
        `* ${name} recoups strength!`,
        `* "${name}: I am far from finished."`,
      ],
      special: [
        `* The air turns cold as ${name} charges maximum energy!`,
        `* "${name}: SAY MY NAME!"`,
      ],
      hit: [
        `* "${name}: Gack! Just a scratch!"`,
        `* ${name} stumbles backward, gritting their teeth.`,
        `* "${name}: You're tougher than you look..."`,
      ],
      victory: [
        `* "${name}: As predicted. Perfection."`,
        `* ${name} stands victorious over your fallen soul.`,
      ],
      defeat: [
        `* "${name}: Impossible... my calculations were... flawless..."`,
        `* ${name} collapses into static dust.`,
        `* You won the battle!`,
      ],
    };

    return {
      name,
      maxHealth: hp,
      currentHealth: hp,
      attacks,
      dialogue,
    };
  };

  // Typewriter effect
  const typeText = async (text: string) => {
    setIsTyping(true);
    setDisplayedText('');

    for (let i = 0; i < text.length; i++) {
      setDisplayedText((prev) => prev + text[i]);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }

    setIsTyping(false);
    await new Promise((resolve) => setTimeout(resolve, 700));
  };

  // Start battle
  const handleStartBattle = async () => {
    soundManager.play('click');
    const enemyData = generateEnemyData(enemyName, enemyPersonality, enemyCustomHealth);
    const pHealth = parseInt(playerCustomHealth) || 100;

    setEnemy(enemyData);
    setPlayer({
      name: 'You',
      maxHealth: pHealth,
      currentHealth: pHealth,
      avatar: null,
      inventory: [...inventory],
      damageReduction: 0,
      attackBoost: 0,
    });

    setBattleEnd(null);
    setGameState('battle');
    setIsProcessing(true);

    // Queue intro dialogue
    const queue = [...enemyData.dialogue.intro];
    setDialogueQueue(queue);

    // Advance first intro dialogues
    for (const line of queue) {
      setCurrentDialogue(line);
      await typeText(line);
    }
    setCurrentDialogue('');
    setDisplayedText('');
    setIsProcessing(false);
  };

  // Player attack action
  const handlePlayerAttack = async (type: 'quick' | 'heavy' | 'special' | 'defend') => {
    if (!enemy || isProcessing) return;
    setIsProcessing(true);
    setShowAttackOptions(false);

    let rawDamage = 0;
    let attackName = '';

    if (type === 'quick') {
      rawDamage = Math.floor(Math.random() * 10) + 8 + (player.attackBoost || 0);
      attackName = 'Quick Slash';
    } else if (type === 'heavy') {
      rawDamage = Math.floor(Math.random() * 16) + 14 + (player.attackBoost || 0);
      attackName = 'Heavy Smash';
    } else if (type === 'special') {
      rawDamage = Math.floor(Math.random() * 22) + 20 + (player.attackBoost || 0);
      attackName = 'Determined Burst';
    } else if (type === 'defend') {
      const heal = Math.min(15, player.maxHealth - player.currentHealth);
      setPlayer((prev) => ({
        ...prev,
        currentHealth: prev.currentHealth + heal,
        damageReduction: 10,
      }));
      setCurrentDialogue(`* You defend and recover ${heal} HP! Guard raised.`);
      await typeText(`* You defend and recover ${heal} HP! Guard raised.`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await handleEnemyTurn();
      setIsProcessing(false);
      return;
    }

    setCurrentDialogue(`* You attack with ${attackName}!`);
    await typeText(`* You attack with ${attackName}!`);

    // Check if enemy blocked
    let finalDamage = rawDamage;
    if (enemy.nextAttackBlocked) {
      finalDamage = Math.max(2, Math.floor(rawDamage * 0.4));
      setCurrentDialogue(`* ${enemy.name} blocked! Damage reduced to ${finalDamage}!`);
      await typeText(`* ${enemy.name} blocked! Damage reduced to ${finalDamage}!`);
    }

    soundManager.play('damage');
    setShowEnemyHit(true);
    setTimeout(() => setShowEnemyHit(false), 500);

    const newEnemyHp = Math.max(0, enemy.currentHealth - finalDamage);
    setEnemy((prev) => (prev ? { ...prev, currentHealth: newEnemyHp, nextAttackBlocked: false } : null));

    setCurrentDialogue(`* ${enemy.name} takes ${finalDamage} damage!`);
    await typeText(`* ${enemy.name} takes ${finalDamage} damage!`);

    // Enemy hit reaction
    if (newEnemyHp > 0 && enemy.dialogue.hit.length > 0) {
      const hitReaction =
        enemy.dialogue.hit[Math.floor(Math.random() * enemy.dialogue.hit.length)];
      setCurrentDialogue(hitReaction);
      await typeText(hitReaction);
    }

    // Check defeat
    if (newEnemyHp <= 0) {
      await handleBattleEnd('victory');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
    await handleEnemyTurn();
    setIsProcessing(false);
  };

  // Enemy turn
  const handleEnemyTurn = async () => {
    if (!enemy) return;
    setIsProcessing(true);

    const attack =
      enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)] || enemy.attacks[0];

    // Pick dialogue
    const attackDlg =
      attack.type === 'block'
        ? enemy.dialogue.block[0]
        : attack.type === 'heal'
        ? enemy.dialogue.heal[0]
        : attack.type === 'special'
        ? enemy.dialogue.special[0]
        : enemy.dialogue.attack[Math.floor(Math.random() * enemy.dialogue.attack.length)];

    if (attackDlg) {
      setCurrentDialogue(attackDlg);
      await typeText(attackDlg);
    }

    setCurrentDialogue(`* ${enemy.name} uses ${attack.name}!`);
    await typeText(`* ${enemy.name} uses ${attack.name}!`);

    if (attack.type === 'block') {
      setEnemy((prev) => (prev ? { ...prev, nextAttackBlocked: true } : null));
      setCurrentDialogue(`* ${enemy.name} is guarding against the next attack!`);
      await typeText(`* ${enemy.name} is guarding against the next attack!`);
    } else if (attack.type === 'heal') {
      const healAmount = Math.min(attack.value, enemy.maxHealth - enemy.currentHealth);
      setEnemy((prev) =>
        prev ? { ...prev, currentHealth: prev.currentHealth + healAmount } : null
      );
      setCurrentDialogue(`* ${enemy.name} recovered ${healAmount} HP!`);
      await typeText(`* ${enemy.name} recovered ${healAmount} HP!`);
    } else {
      // Damage or Special
      let damageTaken = attack.value;
      if (player.damageReduction && player.damageReduction > 0) {
        damageTaken = Math.max(1, damageTaken - player.damageReduction);
        setCurrentDialogue(`* Your shield absorbed ${player.damageReduction} damage!`);
        await typeText(`* Your shield absorbed ${player.damageReduction} damage!`);
        setPlayer((prev) => ({ ...prev, damageReduction: 0 }));
      }

      soundManager.play('damage');
      setShowPlayerHit(true);
      setTimeout(() => setShowPlayerHit(false), 500);

      const newPlayerHp = Math.max(0, player.currentHealth - damageTaken);
      setPlayer((prev) => ({ ...prev, currentHealth: newPlayerHp }));

      setCurrentDialogue(`* You took ${damageTaken} damage!`);
      await typeText(`* You took ${damageTaken} damage!`);

      if (newPlayerHp <= 0) {
        await handleBattleEnd('defeat');
        return;
      }
    }

    setCurrentDialogue('');
    setDisplayedText('');
    setIsProcessing(false);
  };

  // Use Item
  const handleUseItem = async (item: BattleItem, index: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowInventory(false);

    soundManager.play('button');
    setCurrentDialogue(`* You used ${item.name}!`);
    await typeText(`* You used ${item.name}!`);

    if (item.effect === 'heal') {
      const heal = Math.min(item.value, player.maxHealth - player.currentHealth);
      setPlayer((prev) => ({
        ...prev,
        currentHealth: prev.currentHealth + heal,
        inventory: prev.inventory.filter((_, i) => i !== index),
      }));
      setCurrentDialogue(`* Recovered ${heal} HP!`);
      await typeText(`* Recovered ${heal} HP!`);
    } else if (item.effect === 'defense') {
      setPlayer((prev) => ({
        ...prev,
        damageReduction: (prev.damageReduction || 0) + item.value,
        inventory: prev.inventory.filter((_, i) => i !== index),
      }));
      setCurrentDialogue(`* Defense fortified by ${item.value}!`);
      await typeText(`* Defense fortified by ${item.value}!`);
    } else if (item.effect === 'attack') {
      setPlayer((prev) => ({
        ...prev,
        attackBoost: (prev.attackBoost || 0) + item.value,
        inventory: prev.inventory.filter((_, i) => i !== index),
      }));
      setCurrentDialogue(`* Attack power surged by ${item.value}!`);
      await typeText(`* Attack power surged by ${item.value}!`);
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
    await handleEnemyTurn();
    setIsProcessing(false);
  };

  // End Battle
  const handleBattleEnd = async (result: 'victory' | 'defeat') => {
    setBattleEnd(result);
    soundManager.stopMusic();

    if (result === 'victory') {
      soundManager.play('success');
      launchConfetti();
      for (const line of enemy?.dialogue.defeat || ['* Victory!']) {
        setCurrentDialogue(line);
        await typeText(line);
      }
    } else {
      soundManager.play('fail');
      for (const line of enemy?.dialogue.victory || ['* Defeat...']) {
        setCurrentDialogue(line);
        await typeText(line);
      }
    }
  };

  // Create custom item
  const handleCreateCustomItem = () => {
    if (!customItemName.trim()) return;
    soundManager.play('buy');

    const newItem: BattleItem = {
      id: Date.now(),
      name: customItemName.trim().slice(0, 15),
      description:
        customItemType === 'heal'
          ? `Restores ${customItemValue} HP`
          : customItemType === 'defense'
          ? `Reduces next hit by ${customItemValue}`
          : `Boosts your attack damage by ${customItemValue}`,
      effect: customItemType,
      value: customItemValue,
    };

    setInventory((prev) => [...prev, newItem]);
    setCustomItemName('');
    setCustomItemValue(15);
  };

  const handleDeleteItem = (id: number) => {
    soundManager.play('click');
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center p-2 sm:p-6 font-undertale bg-[#000] text-white overflow-y-auto">
      {gameState === 'setup' ? (
        /* SETUP SCREEN */
        <div className="w-full max-w-3xl border-4 border-white p-6 bg-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          <h1 className="text-3xl text-center font-black mb-6 tracking-wider text-yellow-300">
            CREATE YOUR ENEMY
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Enemy Sprite Preview & Upload */}
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-600 bg-neutral-950 rounded">
              <div className="w-36 h-36 border-2 border-white flex items-center justify-center mb-3 bg-black overflow-hidden">
                <img
                  src={enemySprite}
                  alt="Enemy Sprite"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <label className="cursor-pointer px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-white text-xs uppercase font-bold tracking-wider rounded mb-3">
                Upload Enemy Sprite
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSpriteUpload}
                  className="hidden"
                />
              </label>

              {/* Quick Preset Selector */}
              <div className="w-full">
                <span className="text-[11px] text-gray-400 block mb-1 uppercase text-center">
                  Quick Select Presets:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_ENEMIES.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        soundManager.play('click');
                        setEnemyName(p.name);
                        setEnemyPersonality(p.personality);
                        setEnemySprite(p.sprite);
                      }}
                      className="px-2 py-1 bg-black border border-gray-700 hover:border-yellow-400 text-[10px] text-left truncate"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase text-gray-400 block mb-1">
                  Enemy Name:
                </label>
                <input
                  type="text"
                  value={enemyName}
                  onChange={(e) => setEnemyName(e.target.value)}
                  className="w-full p-2 bg-black border-2 border-white text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs uppercase text-gray-400 block mb-1">
                  Enemy Personality & Dialogue Tone:
                </label>
                <textarea
                  value={enemyPersonality}
                  onChange={(e) => setEnemyPersonality(e.target.value)}
                  rows={3}
                  className="w-full p-2 bg-black border-2 border-white text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] uppercase text-gray-400 block mb-1">
                    Enemy HP:
                  </label>
                  <input
                    type="number"
                    value={enemyCustomHealth}
                    onChange={(e) => setEnemyCustomHealth(e.target.value)}
                    className="w-full p-1.5 bg-black border border-white text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase text-gray-400 block mb-1">
                    Player HP:
                  </label>
                  <input
                    type="number"
                    value={playerCustomHealth}
                    onChange={(e) => setPlayerCustomHealth(e.target.value)}
                    className="w-full p-1.5 bg-black border border-white text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Items Creator */}
          <div className="border-t-2 border-gray-800 pt-4 mb-6">
            <h3 className="text-sm uppercase text-yellow-300 font-bold mb-2">
              Create Custom Battle Item:
            </h3>
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <input
                type="text"
                placeholder="Item Name (max 15 chars)"
                maxLength={15}
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                className="flex-1 min-w-[140px] p-2 bg-black border border-white text-xs"
              />
              <select
                value={customItemType}
                onChange={(e) => setCustomItemType(e.target.value as any)}
                className="p-2 bg-black border border-white text-xs text-white"
              >
                <option value="heal">Healing</option>
                <option value="defense">Defense</option>
                <option value="attack">Attack</option>
              </select>
              <input
                type="number"
                min={1}
                max={50}
                value={customItemValue}
                onChange={(e) => setCustomItemValue(Number(e.target.value))}
                className="w-16 p-2 bg-black border border-white text-xs text-center"
              />
              <button
                onClick={handleCreateCustomItem}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs uppercase"
              >
                + Add Item
              </button>
            </div>

            {/* Inventory preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-900 border border-gray-700 p-2 text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-yellow-300">{item.name}</span>
                    <span className="block text-[10px] text-gray-400">{item.description}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-500 hover:text-red-300 font-black px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Start Battle Button */}
          <button
            onClick={handleStartBattle}
            className="w-full py-4 bg-transparent hover:bg-yellow-400 border-4 border-white hover:border-yellow-400 text-white hover:text-black font-black text-2xl uppercase transition tracking-widest shadow-[0_0_15px_rgba(255,255,0,0.3)]"
          >
            ★ START BATTLE ★
          </button>
        </div>
      ) : (
        /* BATTLE ARENA SCREEN */
        <div className="w-full max-w-4xl border-4 border-white p-6 bg-black min-h-[550px] flex flex-col justify-between shadow-[0_0_25px_rgba(255,255,255,0.3)]">
          {/* Top: Enemy Showcase & Stats */}
          <div className="flex flex-col items-center justify-center mb-4">
            {/* Enemy Sprite with Shake on Hit */}
            <div
              className={`w-40 h-40 flex items-center justify-center mb-3 transition-transform ${
                showEnemyHit ? 'animate-shake filter invert' : ''
              }`}
            >
              <img
                src={enemySprite}
                alt={enemy?.name}
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_8px_white]"
              />
            </div>

            {/* Enemy Health Bar */}
            <div className="w-full max-w-sm text-center">
              <div className="flex justify-between text-sm font-bold mb-1">
                <span className="text-yellow-300 uppercase">{enemy?.name}</span>
                <span>
                  {enemy?.currentHealth} / {enemy?.maxHealth} HP
                </span>
              </div>
              <div className="w-full h-4 bg-red-950 border border-white rounded-none overflow-hidden">
                <div
                  style={{
                    width: `${Math.max(
                      0,
                      ((enemy?.currentHealth || 0) / (enemy?.maxHealth || 1)) * 100
                    )}%`,
                  }}
                  className="h-full bg-emerald-500 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Center: Dialogue Box */}
          <div className="border-4 border-white p-4 min-h-[110px] bg-black text-lg leading-relaxed flex items-center mb-4">
            <p className="w-full">
              {displayedText || currentDialogue || (
                <span className="text-gray-600 italic">* What will you do?</span>
              )}
              {isTyping && <span className="animate-pulse">_</span>}
            </p>
          </div>

          {/* Player Stats */}
          <div className="flex justify-between items-center text-sm font-bold border-b border-gray-700 pb-2 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-red-500 text-lg">❤</span>
              <span>{player.name}</span>
              <span className="text-yellow-300 text-xs">LV 1</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-yellow-300">HP</span>
              <div className="w-32 h-4 bg-red-900 border border-white overflow-hidden">
                <div
                  style={{
                    width: `${Math.max(
                      0,
                      (player.currentHealth / player.maxHealth) * 100
                    )}%`,
                  }}
                  className="h-full bg-yellow-400 transition-all duration-300"
                />
              </div>
              <span className="text-xs">
                {player.currentHealth} / {player.maxHealth}
              </span>
            </div>
          </div>

          {/* Action Menus */}
          {battleEnd ? (
            <div className="text-center py-4">
              <h2
                className={`text-4xl font-black mb-4 uppercase ${
                  battleEnd === 'victory' ? 'text-yellow-300' : 'text-red-600'
                }`}
              >
                {battleEnd === 'victory' ? '★ VICTORY! ★' : 'GAME OVER...'}
              </h2>
              <button
                onClick={() => {
                  soundManager.play('click');
                  setGameState('setup');
                }}
                className="px-8 py-3 bg-white text-black font-black text-xl hover:bg-yellow-400 uppercase tracking-wider"
              >
                Return to Setup
              </button>
            </div>
          ) : (
            <div>
              {/* Attack Submenu */}
              {showAttackOptions && !isProcessing && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <button
                    onClick={() => handlePlayerAttack('quick')}
                    className="p-2 border-2 border-white hover:border-yellow-400 hover:text-yellow-400 text-xs font-bold uppercase transition"
                  >
                    Quick Slash
                  </button>
                  <button
                    onClick={() => handlePlayerAttack('heavy')}
                    className="p-2 border-2 border-white hover:border-yellow-400 hover:text-yellow-400 text-xs font-bold uppercase transition"
                  >
                    Heavy Smash
                  </button>
                  <button
                    onClick={() => handlePlayerAttack('special')}
                    className="p-2 border-2 border-white hover:border-yellow-400 hover:text-yellow-400 text-xs font-bold uppercase transition"
                  >
                    Special Move
                  </button>
                  <button
                    onClick={() => handlePlayerAttack('defend')}
                    className="p-2 border-2 border-white hover:border-yellow-400 hover:text-yellow-400 text-xs font-bold uppercase transition"
                  >
                    Defend (+HP)
                  </button>
                </div>
              )}

              {/* Items Submenu */}
              {showInventory && !isProcessing && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {player.inventory.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => handleUseItem(item, idx)}
                      className="p-2 border-2 border-white hover:border-yellow-400 hover:text-yellow-400 text-left text-xs uppercase transition truncate"
                    >
                      {item.name} ({item.value})
                    </button>
                  ))}
                  {player.inventory.length === 0 && (
                    <div className="text-gray-500 text-xs italic col-span-3 text-center py-2">
                      No items remaining in backpack!
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Main Action Buttons: FIGHT, ITEMS, EXIT */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    soundManager.play('button');
                    setShowAttackOptions(!showAttackOptions);
                    setShowInventory(false);
                  }}
                  className={`py-3 border-4 font-black text-xl uppercase transition ${
                    showAttackOptions
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-white text-white hover:border-yellow-400 hover:text-yellow-400'
                  }`}
                >
                  ⚔ FIGHT
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    soundManager.play('button');
                    setShowInventory(!showInventory);
                    setShowAttackOptions(false);
                  }}
                  className={`py-3 border-4 font-black text-xl uppercase transition ${
                    showInventory
                      ? 'border-yellow-400 text-yellow-400'
                      : 'border-white text-white hover:border-yellow-400 hover:text-yellow-400'
                  }`}
                >
                  🎒 ITEM
                </button>

                <button
                  onClick={() => {
                    soundManager.play('click');
                    setGameState('setup');
                  }}
                  className="py-3 border-4 border-gray-600 text-gray-400 hover:text-white hover:border-white font-black text-xl uppercase transition"
                >
                  🏃 EXIT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
