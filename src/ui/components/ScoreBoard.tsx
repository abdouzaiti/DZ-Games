/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameSnapshot } from '../../domain/gameState';
import { Avatar } from './Avatar';
import leatherPouchImg from '../../assets/images/leather_domino_pouch_1786418367291.jpg';

interface ScoreBoardProps {
  snapshot: GameSnapshot;
  userAvatar?: string;
  onBackToLobby?: () => void;
  onSurrender?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onNewMatch?: () => void;
  language?: string;
  isMultiplayer?: boolean;
  canDraw?: boolean;
  onDraw?: () => void;
}

const PLAYER_THEMES = [
  { border: 'border-red-500', bg: 'bg-red-500/10', activeBg: 'bg-red-500/20 text-red-950', badge: 'bg-red-600', ring: 'ring-red-400' },
  { border: 'border-blue-500', bg: 'bg-blue-500/10', activeBg: 'bg-blue-500/20 text-blue-950', badge: 'bg-blue-600', ring: 'ring-blue-400' },
  { border: 'border-emerald-500', bg: 'bg-emerald-500/10', activeBg: 'bg-emerald-500/20 text-emerald-950', badge: 'bg-emerald-600', ring: 'ring-emerald-400' },
  { border: 'border-amber-500', bg: 'bg-amber-500/10', activeBg: 'bg-amber-500/20 text-amber-950', badge: 'bg-amber-600', ring: 'ring-amber-400' },
];

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  snapshot,
  userAvatar = '🇩🇿',
  onBackToLobby,
  onSurrender,
  onOpenProfile,
  onOpenSettings,
  onNewMatch,
  language = 'fr',
  isMultiplayer = false,
  canDraw = false,
  onDraw,
}) => {
  const { config, matchScores, roundNumber, stock, players, currentPlayerIndex } = snapshot;
  const is2v2 = config.mode === '2v2';
  const isAr = language === 'ar';

  const renderPlayerCard = (p: typeof players[0], indexInPlayers: number) => {
    const isActive = indexInPlayers === currentPlayerIndex;
    const score = is2v2
      ? matchScores.teamScores[p.teamId] || 0
      : matchScores.playerScores[p.id] || 0;
    const theme = PLAYER_THEMES[indexInPlayers % PLAYER_THEMES.length];

    return (
      <div
        key={p.id}
        className={`px-3 py-2 rounded-2xl border-2 transition-all flex items-center gap-2.5 shadow-sm ${
          isActive
            ? `bg-white text-slate-950 ${theme.border} shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-4 ${theme.ring} scale-105 z-20`
            : `bg-slate-900/90 text-slate-200 ${theme.border} opacity-85`
        }`}
      >
        {/* Player Avatar with Color Border */}
        <div className="relative shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden font-bold text-sm border-2 ${theme.border} ${isActive ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-100'}`}>
            <Avatar avatar={p.avatar || (p.isAI ? '🤖' : (indexInPlayers === 0 ? userAvatar : '👤'))} className="w-full h-full flex items-center justify-center" />
          </div>
          {isActive && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          )}
        </div>

        {/* Player Name & Color Indicator */}
        <div className="flex flex-col min-w-[60px] max-w-[100px]">
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${theme.badge}`} />
            <span className={`text-xs font-black truncate leading-tight ${isActive ? 'text-slate-950' : 'text-slate-100'}`}>
              {p.name}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400">
            {p.isAI ? (isAr ? 'ذكاء اصطناعي' : 'AI Bot') : (isAr ? 'لاعب' : 'Player')}
          </span>
        </div>

        {/* Score Badge */}
        <div className={`px-2 py-0.5 rounded-xl font-black text-xs flex items-center justify-center shadow-inner shrink-0 ${theme.badge} text-white`}>
          {score} pts
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-2 py-1.5 relative z-10 shrink-0">
      {/* Top Controls Bar */}
      <div className="w-full flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToLobby}
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors shadow"
            title="Lobby"
          >
            <span>🏠</span> <span>{isAr ? 'البهو' : 'Lobby'}</span>
          </button>

          <div className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-black">
            Round {roundNumber}
          </div>

          {isMultiplayer && onSurrender && snapshot.roundStatus !== 'MATCH_ENDED' && (
            <button
              type="button"
              onClick={onSurrender}
              className="px-3 py-1.5 rounded-xl bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-800/50 text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
              title="Surrender Match"
            >
              <span>🏳️</span> <span>Surrender</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Integrated Stock / Draw Pouch at Top */}
          {stock.length > 0 && (
            <button
              type="button"
              onClick={canDraw ? onDraw : undefined}
              disabled={!canDraw}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-extrabold transition-all ${
                canDraw
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 animate-pulse hover:bg-amber-500/30 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 cursor-not-allowed opacity-80'
              }`}
              title={canDraw ? 'Click to draw tile from stock' : 'Stock pile'}
            >
              <span className="text-sm">👝</span>
              <span>Stock: {stock.length}</span>
              {canDraw && <span className="text-[10px] bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded font-black uppercase">Draw</span>}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer transition-colors shadow"
            title="Profile"
          >
            <Avatar avatar={userAvatar} className="w-5 h-5 flex items-center justify-center text-xs" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center justify-center cursor-pointer transition-colors shadow"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Players List with Pics, Scores, and Colors at the Top Side */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 w-full relative z-10 px-2">
        {players.map((p, idx) => renderPlayerCard(p, idx))}
      </div>
    </div>
  );
};

