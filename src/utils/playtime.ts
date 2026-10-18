import { ActiveView } from '../types';

export interface ZimmerLeaderboardEntry {
  rank?: number;
  username: string;
  playtimeSeconds: number; // score is counted by playtime
  title: string;
  isPlayer?: boolean;
  avatar: string;
}

export interface WeeklyPlaytimeData {
  weekKey: string; // e.g. "2026-W42"
  playerUsername: string;
  gamePlaytime: Record<ActiveView | 'total', number>; // in seconds
  rivals: ZimmerLeaderboardEntry[];
}

// Compute the ISO week string (e.g., "2026-W42") so resets happen weekly on Monday 00:00 UTC
export function getCurrentWeekKey(): string {
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// Compute time until next reset (next Monday 00:00 UTC)
export function getTimeUntilWeeklyReset(): { days: number; hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const nextMonday = new Date(now);
  const day = now.getUTCDay();
  const diffDays = ((8 - day) % 7) || 7; // days until next Monday
  nextMonday.setUTCDate(now.getUTCDate() + diffDays);
  nextMonday.setUTCHours(0, 0, 0, 0);

  const diffMs = Math.max(0, nextMonday.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

// Format seconds into readable hours, minutes, seconds
export function formatPlaytime(seconds: number): string {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h > 0) {
    return `${h}h ${m}m ${sec}s`;
  }
  if (m > 0) {
    return `${m}m ${sec}s`;
  }
  return `${sec}s`;
}

const DEFAULT_RIVALS: ZimmerLeaderboardEntry[] = [
  { username: 'irk_commander', playtimeSeconds: 15420, title: 'Supreme Irken Overlord', avatar: '👑' },
  { username: 'hardcore', playtimeSeconds: 12890, title: 'Basement Room Owner', avatar: '🦾' },
  { username: 'gir_tacos_99', playtimeSeconds: 9740, title: 'Waffle Inhaler', avatar: '🌮' },
  { username: 'walter_heisenberg', playtimeSeconds: 7850, title: 'Pure Blue Chemist', avatar: '⚗️' },
  { username: 'sandler_yeller', playtimeSeconds: 6120, title: 'Happy Gilmore Pro', avatar: '🏌️' },
  { username: 'romanian_psu_stealer', playtimeSeconds: 4890, title: 'Master Hardware Bandit', avatar: '🪛' },
  { username: 'blood_slayer_v1', playtimeSeconds: 3450, title: 'Circuit Decapitator', avatar: '🩸' },
  { username: 'skoodge_survivor', playtimeSeconds: 2100, title: 'Vero Slaver', avatar: '👽' },
  { username: 'john_pork_bonker', playtimeSeconds: 1240, title: 'Pig Disciplinarian', avatar: '🐷' },
];

const STORAGE_KEY = 'zornhub_weekly_playtime_v1';

export function loadWeeklyData(): WeeklyPlaytimeData {
  const currentWeek = getCurrentWeekKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: WeeklyPlaytimeData = JSON.parse(raw);
      // Cleanse any old personal names if present in local rivals or playerUsername
      if (parsed.rivals) {
        parsed.rivals = parsed.rivals.map((r) =>
          r.username.toLowerCase().includes('troy')
            ? { ...r, username: 'irk_commander' }
            : r
        );
      }
      if (parsed.playerUsername && parsed.playerUsername.toLowerCase().includes('troy')) {
        parsed.playerUsername = 'Basement_Zimmer';
      }
      // Check if week changed
      if (parsed.weekKey === currentWeek) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }

  // New week reset!
  const fresh: WeeklyPlaytimeData = {
    weekKey: currentWeek,
    playerUsername: 'Basement_Zimmer',
    gamePlaytime: {
      lobby: 0,
      zimclicker: 0,
      romanian: 0,
      battle: 0,
      bloodcircuit: 0,
      zoblox: 0,
      culturekill: 0,
      total: 0,
    },
    rivals: DEFAULT_RIVALS,
  };

  saveWeeklyData(fresh);
  return fresh;
}

export function saveWeeklyData(data: WeeklyPlaytimeData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota or disabled
  }
}

// Generate combined & sorted leaderboard
export function getLeaderboard(data: WeeklyPlaytimeData): ZimmerLeaderboardEntry[] {
  const playerEntry: ZimmerLeaderboardEntry = {
    username: data.playerUsername || 'You (Zimmer)',
    playtimeSeconds: data.gamePlaytime.total || 0,
    title: getTitleForPlaytime(data.gamePlaytime.total || 0),
    isPlayer: true,
    avatar: '👾',
  };

  const list = [...data.rivals, playerEntry].sort(
    (a, b) => b.playtimeSeconds - a.playtimeSeconds
  );

  return list.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

function getTitleForPlaytime(seconds: number): string {
  if (seconds >= 14400) return 'God of All Zimmers';
  if (seconds >= 7200) return 'Supreme Irken Invader';
  if (seconds >= 3600) return 'Master Hardware Thief';
  if (seconds >= 1800) return 'Seasoned Basement Dweller';
  if (seconds >= 600) return 'Dedicated Pervitin Sniffer';
  if (seconds >= 120) return 'Cadet Zimmer';
  return 'Unranked Rookie';
}
