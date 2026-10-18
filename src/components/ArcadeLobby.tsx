import React from 'react';
import { ActiveView } from '../types';
import { soundManager } from '../utils/audio';
import { formatPlaytime, WeeklyPlaytimeData } from '../utils/playtime';

interface ArcadeLobbyProps {
  onSelectGame: (game: ActiveView) => void;
  onOpenLeaderboard: () => void;
  weeklyData: WeeklyPlaytimeData;
}

export const ArcadeLobby: React.FC<ArcadeLobbyProps> = ({
  onSelectGame,
  onOpenLeaderboard,
  weeklyData,
}) => {
  return (
    <div className="arcade-body">
      <div className="arcade-container">
        <h1>Zornhub Arcade</h1>
        <p>the original west korea basement games</p>

        {/* New Game: Gamblers Den highlighted in purple */}
        <a
          className="arcade-btn"
          href="https://gamblers-den-seven.vercel.app/"
          target="_blank"
          rel="noreferrer"
          onClick={() => soundManager.play('click')}
          style={{
            backgroundColor: '#9333ea',
            color: '#ffffff',
            boxShadow: '0 0 25px rgba(168, 85, 247, 0.8), 0 0 10px rgba(147, 51, 234, 0.5)',
            border: '2px solid #e9d5ff',
            marginBottom: '4px',
          }}
        >
          🎰 gamblers den 🎰{' '}
          <span
            style={{
              fontSize: '0.7em',
              backgroundColor: '#fae8ff',
              color: '#581c87',
              padding: '2px 8px',
              borderRadius: '6px',
              marginLeft: '8px',
              verticalAlign: 'middle',
              fontWeight: 900,
              textTransform: 'uppercase',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)',
            }}
          >
            NEW GAME
          </span>
        </a>

        <button
          className="arcade-btn"
          onClick={() => {
            soundManager.play('click');
            onSelectGame('bloodcircuit');
          }}
        >
          🎮 play BLOOD//CIRCUIT
        </button>

        <button
          className="arcade-btn"
          onClick={() => {
            soundManager.play('click');
            onSelectGame('zimclicker');
          }}
        >
          🎮 play pervitin clicker
        </button>

        <button
          className="arcade-btn"
          onClick={() => {
            soundManager.play('click');
            onSelectGame('romanian');
          }}
        >
          🎮 play romanian sim
        </button>

        <button
          className="arcade-btn"
          onClick={() => {
            soundManager.play('click');
            onSelectGame('battle');
          }}
        >
          ⚔️ play battle anyone
        </button>

        <button
          className="arcade-btn"
          onClick={() => {
            soundManager.play('click');
            onSelectGame('zoblox');
          }}
        >
          🧱 play zoblox
        </button>

        <button
          className="arcade-btn"
          onClick={() => {
            soundManager.play('click');
            onSelectGame('culturekill');
          }}
        >
          🔥 CULTUREKILL 🔥
        </button>

        <a
          className="arcade-btn"
          href="https://bonkrain-q7yq.bolt.host/"
          target="_blank"
          rel="noreferrer"
        >
          ❤️🔥WEST KOREA SIMULATOR!❤️🔥
        </a>

        <h2 style={{ marginTop: '40px', fontSize: '2em', color: '#00ff88', fontWeight: 'bold' }}>
          CHICKEN JOCKEY
        </h2>
        <div className="video-wrapper">
          <iframe
            src="https://vidsrc.xyz/embed/movie/tt3566834/"
            title="Chicken Jockey"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};
