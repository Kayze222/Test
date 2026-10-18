export type ActiveView = 
  | 'lobby'
  | 'zimclicker'
  | 'romanian'
  | 'battle'
  | 'bloodcircuit'
  | 'zoblox'
  | 'culturekill';

export interface Upgrade {
  name: string;
  baseCost: number;
  pps: number;
  count: number;
  icon: string;
}

export interface CasinoStats {
  gambled: number;
  bestWin: number;
  bonks: number;
}

export interface RomanianPart {
  id: string;
  name: string;
  value: number;
  removed: boolean;
  prerequisites: string[];
}

export interface RomanianState {
  bankBalance: number;
  upgrades: {
    timeBonus: number;
    valueMultiplier: number;
    hasCrowbar: boolean;
  };
}

export interface BattleAttack {
  name: string;
  type: 'damage' | 'block' | 'heal' | 'special';
  value: number;
  description: string;
  chance?: number;
}

export interface BattleDialogue {
  intro: string[];
  attack: string[];
  block: string[];
  heal: string[];
  special: string[];
  hit: string[];
  victory: string[];
  defeat: string[];
}

export interface BattleEnemy {
  name: string;
  maxHealth: number;
  currentHealth: number;
  attacks: BattleAttack[];
  dialogue: BattleDialogue;
  nextAttackBlocked?: boolean;
}

export interface BattleItem {
  id: number;
  name: string;
  description: string;
  effect: 'heal' | 'defense' | 'attack';
  value: number;
}

export interface BattlePlayer {
  name: string;
  maxHealth: number;
  currentHealth: number;
  avatar: string | null;
  inventory: BattleItem[];
  damageReduction?: number | null;
  attackBoost?: number | null;
  nextAttackBlocked?: boolean;
}
