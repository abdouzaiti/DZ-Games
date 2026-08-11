/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameSnapshot } from '../../domain/gameState';
import leatherPouchImg from '../../assets/images/leather_domino_pouch_1786418367291.jpg';

interface ScoreBoardProps {
  snapshot: GameSnapshot;
  userAvatar?: string;
  onBackToLobby?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onNewMatch?: () => void;
  language?: string;
  isMultiplayer?: boolean;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  snapshot,
  userAvatar = '🇩🇿',
  onBackToLobby,
  onOpenProfile,
  onOpenSettings,
  onNewMatch,
  language = 'fr',
  isMultiplayer = false,
}) => {
  const { config, matchScores, roundNumber, stock, players, currentPlayerIndex } = snapshot;
  const is2v2 = config.mode === '2v2';

  const humanPlayer = players[0];
  const aiPlayers = players.slice(1);

  const renderPlayerCard = (p: typeof players[0], indexInPlayers: number) => {
    const isActive = indexInPlayers === currentPlayerIndex;
    const score = is2v2
      ? matchScores.teamScores[p.teamId] || 0
      : matchScores.playerScores[p.id] || 0;

    return (
      <div
        key={p.id}
        className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-2 ${
          isActive
            ? 'bg-white text-slate-900 border-2 border-blue-400 shadow-md ring-2 ring-blue-300/50'
            : 'bg-slate-800/80 border-slate-700/80 text-slate-200'
        }`}
      >
        {/* Player Avatar */}
        <div className="relative shrink-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
            isActive ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-slate-900 text-blue-300 border border-slate-700'
          }`}>
            {p.isAI ? '🤖' : (indexInPlayers === 0 ? userAvatar : '👤')}
          </div>
        </div>

        {/* Player Name */}
        <div className="flex flex-col min-w-[50px] max-w-[80px]">
          <span className={`text-[11px] font-bold truncate leading-tight ${isActive ? 'text-slate-900' : 'text-slate-100'}`}>
            {p.name}
          </span>
        </div>

        {/* Score in a small circle */}
        <div className={`w-5.5 h-5.5 rounded-full font-black text-[10px] flex items-center justify-center shadow-sm shrink-0 ${
          isActive ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
        }`}>
          {score}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-1.5 py-1 relative z-10 shrink-0">
      {/* Top Controls Bar */}
      <div className="w-full flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onBackToLobby}
          className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>🏠</span> <span>Lobby</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenProfile}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center justify-center cursor-pointer transition-colors"
            title="Profile"
          >
            {userAvatar}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center justify-center cursor-pointer transition-colors"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Players list & Sachet arranged dynamically in a single row */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 w-full relative z-10">
        {humanPlayer && renderPlayerCard(humanPlayer, 0)}
        
        {/* Render other AI players */}
        <div className="flex items-center gap-1.5">
          {aiPlayers.map((p, idx) => renderPlayerCard(p, idx + 1))}
        </div>
      </div>
    </div>
  );
};
