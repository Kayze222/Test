import React, { useState, useEffect } from 'react';
import {
  WeeklyPlaytimeData,
  getLeaderboard,
  formatPlaytime,
  getTimeUntilWeeklyReset,
  saveWeeklyData,
} from '../utils/playtime';
import { soundManager } from '../utils/audio';
import { Trophy, Clock, X, Edit2, Check, Award } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeklyData: WeeklyPlaytimeData;
  onUpdateUsername: (newUsername: string) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  weeklyData,
  onUpdateUsername,
}) => {
  const [resetTime, setResetTime] = useState(getTimeUntilWeeklyReset());
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(weeklyData.playerUsername);

  // Tick reset countdown every second
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setResetTime(getTimeUntilWeeklyReset());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const leaderboard = getLeaderboard(weeklyData);
  const playerRank = leaderboard.find((entry) => entry.isPlayer)?.rank || 1;

  const handleSaveName = () => {
    if (tempName.trim()) {
      soundManager.play('click');
      onUpdateUsername(tempName.trim().slice(0, 20));
      setEditingName(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          soundManager.play('click');
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          backgroundColor: '#16141a',
          border: '4px solid #00ff88',
          borderRadius: '16px',
          boxShadow: '0 0 30px rgba(0, 255, 136, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Comic Sans MS', cursive, sans-serif",
          color: '#fff',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '2px solid rgba(0, 255, 136, 0.4)',
            backgroundColor: '#0f0e13',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={28} color="#00ff88" />
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.6rem',
                  fontWeight: 'bold',
                  color: '#00ff88',
                  lineHeight: 1.1,
                }}
              >
                TOP ZIMMERS
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                Weekly Reset • Playtime Across Every Game
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.play('click');
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={26} color="#00ff88" />
          </button>
        </div>

        {/* Reset Countdown Bar */}
        <div
          style={{
            backgroundColor: '#0b0a0e',
            padding: '8px 16px',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            color: '#eab308',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} />
            <span>Weekly Cycle: {weeklyData.weekKey}</span>
          </span>
          <span style={{ fontWeight: 'bold' }}>
            Resets in: {resetTime.days}d {resetTime.hours}h {resetTime.minutes}m {resetTime.seconds}s
          </span>
        </div>

        {/* Player Status Card */}
        <div
          style={{
            margin: '14px 16px',
            padding: '12px 16px',
            backgroundColor: 'rgba(0, 255, 136, 0.08)',
            border: '2px solid #00ff88',
            borderRadius: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.2rem' }}>👾</span>
              {editingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    value={tempName}
                    maxLength={20}
                    onChange={(e) => setTempName(e.target.value)}
                    style={{
                      backgroundColor: '#000',
                      border: '1px solid #00ff88',
                      color: '#00ff88',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    style={{
                      backgroundColor: '#00ff88',
                      border: 'none',
                      color: '#000',
                      borderRadius: '4px',
                      padding: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>
                    {weeklyData.playerUsername}
                  </span>
                  <button
                    onClick={() => {
                      setTempName(weeklyData.playerUsername);
                      setEditingName(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', color: '#9dff00' }}>
              Your Rank: <strong>#{playerRank}</strong> • Total Playtime Score:{' '}
              <strong>{formatPlaytime(weeklyData.gamePlaytime.total)}</strong>
            </div>
          </div>

          {/* Breakdown badges */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.72rem' }}>
            <span style={{ padding: '2px 6px', backgroundColor: '#222', borderRadius: '4px', color: '#ff77ff' }}>
              Zim: {formatPlaytime(weeklyData.gamePlaytime.zimclicker)}
            </span>
            <span style={{ padding: '2px 6px', backgroundColor: '#222', borderRadius: '4px', color: '#77ff77' }}>
              Romanian: {formatPlaytime(weeklyData.gamePlaytime.romanian)}
            </span>
            <span style={{ padding: '2px 6px', backgroundColor: '#222', borderRadius: '4px', color: '#ff5555' }}>
              Battle: {formatPlaytime(weeklyData.gamePlaytime.battle)}
            </span>
            <span style={{ padding: '2px 6px', backgroundColor: '#222', borderRadius: '4px', color: '#ffaa33' }}>
              Blood: {formatPlaytime(weeklyData.gamePlaytime.bloodcircuit)}
            </span>
            <span style={{ padding: '2px 6px', backgroundColor: '#222', borderRadius: '4px', color: '#00ff88' }}>
              Zoblox: {formatPlaytime(weeklyData.gamePlaytime.zoblox || 0)}
            </span>
          </div>
        </div>

        {/* Leaderboard Table List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '45px 1fr 140px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              color: '#888',
              borderBottom: '1px solid #333',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            <span>Rank</span>
            <span>Zimmer</span>
            <span style={{ textAlign: 'right' }}>Playtime Score</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
            {leaderboard.map((entry) => {
              const isTop3 = entry.rank && entry.rank <= 3;
              const medal =
                entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;

              return (
                <div
                  key={entry.username}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '45px 1fr 140px',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: entry.isPlayer
                      ? 'rgba(0, 255, 136, 0.15)'
                      : isTop3
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.3)',
                    border: entry.isPlayer
                      ? '1px solid #00ff88'
                      : isTop3
                      ? '1px solid rgba(234, 179, 8, 0.4)'
                      : '1px solid transparent',
                    color: entry.isPlayer ? '#00ff88' : '#fff',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Rank */}
                  <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    {medal || `#${entry.rank}`}
                  </span>

                  {/* Zimmer name and title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{entry.avatar}</span>
                    <div>
                      <div
                        style={{
                          fontWeight: 'bold',
                          fontSize: '0.95rem',
                          color: entry.isPlayer ? '#00ff88' : '#fff',
                        }}
                      >
                        {entry.username} {entry.isPlayer && '(YOU)'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#888' }}>
                        {entry.title}
                      </div>
                    </div>
                  </div>

                  {/* Playtime Score */}
                  <div
                    style={{
                      textAlign: 'right',
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                      color: entry.isPlayer ? '#00ff88' : isTop3 ? '#facc15' : '#ccc',
                    }}
                  >
                    {formatPlaytime(entry.playtimeSeconds)}
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
