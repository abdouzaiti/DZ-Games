/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player } from '../../domain/player';

interface OpponentsBarProps {
  players: Player[];
  activePlayerIndex: number;
  humanPlayerId: string;
  is2v2: boolean;
}

export const OpponentsBar: React.FC<OpponentsBarProps> = ({
  players,
  activePlayerIndex,
  humanPlayerId,
  is2v2,
}) => {
  const opponents = players.filter((p) => p.id !== humanPlayerId);

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
      {opponents.map((player) => {
        const playerIndex = players.findIndex((p) => p.id === player.id);
        const isActive = playerIndex === activePlayerIndex;

        return (
          <div
            key={player.id}
            className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
              isActive
                ? 'bg-[#2D241E] border-[#D4A373] shadow-md ring-1 ring-[#D4A373]/50'
                : 'bg-[#1B1410]/70 border-[#3D322A]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#1B1410] border border-[#D4A373]/40 flex items-center justify-center font-bold text-[#D4A373] text-sm">
                {player.isAI ? '🤖' : '👤'}
              </div>
              <div>
                <div className="text-sm font-bold text-[#FEFAE0] flex items-center gap-1.5">
                  {player.name}
                  {is2v2 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                        player.teamId === 0
                          ? 'bg-[#CCD5AE]/20 text-[#CCD5AE] border border-[#CCD5AE]/40'
                          : 'bg-[#D4A373]/20 text-[#D4A373] border border-[#D4A373]/40'
                      }`}
                    >
                      Team {player.teamId + 1}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#A98467]">
                  {player.isAI ? 'Café AI' : 'Human'}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(player.hand.length, 7) }).map((_, i) => (
                  <div key={i} className="w-2.5 h-4 bg-[#1B1410] rounded-[2px] border border-[#3D322A]" />
                ))}
              </div>
              <span className="text-[11px] font-bold text-[#D4A373] mt-1">
                {player.hand.length} dominoes
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
