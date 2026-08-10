/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameSnapshot } from '../../domain/gameState';

interface ScoreBoardProps {
  snapshot: GameSnapshot;
  userAvatar?: string;
  onBackToLobby?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onNewMatch?: () => void;
  canDraw?: boolean;
  onSachetClick?: () => void;
  language?: string;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  snapshot,
  userAvatar = '🇩🇿',
  onBackToLobby,
  onOpenProfile,
  onOpenSettings,
  onNewMatch,
  canDraw = false,
  onSachetClick,
  language = 'fr',
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
            ? 'bg-[#2D241E] border-[#D4A373] shadow-md ring-1 ring-[#D4A373]/30'
            : 'bg-[#2D241E]/40 border-[#3D322A]'
        }`}
      >
        {/* Player Avatar */}
        <div className="relative shrink-0">
          <div className="w-7 h-7 rounded-full bg-[#1B1410] border border-[#D4A373]/30 flex items-center justify-center font-bold text-[#D4A373] text-sm">
            {p.isAI ? '🤖' : userAvatar}
          </div>
        </div>

        {/* Player Name */}
        <div className="flex flex-col min-w-[50px] max-w-[80px]">
          <span className="text-[11px] font-bold text-[#FEFAE0] truncate leading-tight">
            {p.name}
          </span>
        </div>

        {/* Score in a small circle */}
        <div className="w-5.5 h-5.5 rounded-full bg-[#D4A373] text-[#1B1410] font-black text-[10px] flex items-center justify-center shadow-sm shrink-0">
          {score}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex items-center justify-center py-2 relative z-10">
      {/* Players list & Sachet arranged dynamically in a single row */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 w-full relative z-10">
        {humanPlayer && renderPlayerCard(humanPlayer, 0)}
        
        {/* Visual separator or VS on 1v1 */}
        {config.mode === '1v1' && (
          <span className="text-[10px] text-[#A98467] font-black px-1.5 uppercase tracking-widest select-none">
            vs
          </span>
        )}
        
        {/* Render other AI players */}
        <div className="flex items-center gap-2">
          {aiPlayers.map((p, idx) => renderPlayerCard(p, idx + 1))}
        </div>

        {/* Separator before sachet */}
        <div className="h-6 w-[1px] bg-[#3D322A] mx-1 sm:mx-2 shrink-0" />

        {/* Sachet de Dominos (Bag of tiles) */}
        <button
          type="button"
          onClick={onSachetClick}
          disabled={!canDraw}
          className={`flex items-center p-1.5 rounded-xl border transition-all select-none relative ${
            canDraw
              ? 'bg-[#D4A373]/20 border-[#D4A373] text-[#FEFAE0] cursor-pointer hover:bg-[#D4A373]/30 hover:scale-105 shadow-[0_0_15px_rgba(212,163,115,0.45)] ring-2 ring-[#D4A373]/30 animate-pulse'
              : 'bg-[#2D241E]/10 border-[#3D322A]/40 text-[#FEFAE0]/40 cursor-not-allowed opacity-50'
          }`}
          title={
            canDraw
              ? (language === 'ar' ? 'انقر للسحب من السلة' : 'Cliquez pour piocher du sachet')
              : (stock.length === 0 ? "Vide" : stock.length === 1 ? "1 domino" : `${stock.length} dominos`)
          }
        >
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-[#1B1410] text-lg border border-[#D4A373]/20 shadow">
            👝
            {stock.length > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[#1B1410] font-black text-[9px] shadow-sm ${canDraw ? 'bg-[#CCD5AE]' : 'bg-[#D4A373]'}`}>
                {stock.length}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
