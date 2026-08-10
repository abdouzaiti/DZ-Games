/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameConfig, GameMode } from '../../domain/gameConfig';

interface MatchSetupModalProps {
  currentConfig: GameConfig;
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (config: GameConfig) => void;
}

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  currentConfig,
  isOpen,
  onClose,
  onStartMatch,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(currentConfig.mode);
  const [targetScore, setTargetScore] = useState<number>(currentConfig.targetScore);

  if (!isOpen) return null;

  const handleStart = () => {
    let tilesPerPlayer = 7;
    let allowDrawFromStock = selectedMode === '1v1' || selectedMode === '3player_ffa';

    onStartMatch({
      mode: selectedMode,
      targetScore,
      tilesPerPlayer,
      allowDrawFromStock,
      ruleset: 'mostaganem',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1B1410]/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1B1410] border-2 border-[#3D322A] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-serif italic font-black text-[#D4A373] tracking-wide">
            Café Match Settings
          </h2>
          <p className="text-xs text-[#A98467]">
            Configure Algerian Mostaganem rules & table mode
          </p>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#A98467] block">
            Select Game Mode
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: '1v1', label: '1v1 Duel', sub: '2 Players • Pioche Draw' },
              { id: '2v2', label: '2v2 Teams', sub: '4 Players • Team Scoring' },
              { id: '3player_ffa', label: '3 Players', sub: '3-Player Free For All' },
              { id: '4player_ffa', label: '4 Players FFA', sub: '4-Player Solo Table' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMode(m.id as GameMode)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMode === m.id
                    ? 'bg-[#D4A373]/20 border-[#D4A373] text-[#FEFAE0] ring-1 ring-[#D4A373]'
                    : 'bg-[#2D241E] border-[#3D322A] text-[#A98467] hover:border-[#D4A373]/50'
                }`}
              >
                <div className="font-bold text-sm text-[#FEFAE0]">{m.label}</div>
                <div className="text-[11px] text-[#A98467]">{m.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target Score */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#A98467] block">
            Match Target Points
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[50, 100, 150, 200].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setTargetScore(score)}
                className={`py-2.5 rounded-xl font-black text-sm border transition-all cursor-pointer ${
                  targetScore === score
                    ? 'bg-[#D4A373] text-[#1B1410] border-[#FEFAE0] shadow-md ring-1 ring-[#FEFAE0]'
                    : 'bg-[#2D241E] border-[#3D322A] text-[#A98467] hover:border-[#D4A373]/50'
                }`}
              >
                {score} Pts
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-[#2D241E] hover:bg-[#3D322A] text-[#FEFAE0] font-bold rounded-xl text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="flex-1 py-3 bg-[#D4A373] hover:bg-[#A98467] text-[#1B1410] font-black rounded-xl text-sm uppercase tracking-wider shadow-lg cursor-pointer"
          >
            Start Match
          </button>
        </div>
      </div>
    </div>
  );
};
