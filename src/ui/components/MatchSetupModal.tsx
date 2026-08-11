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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-blue-400/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-serif italic font-black text-white tracking-wide">
            Café Match Settings
          </h2>
          <p className="text-xs text-blue-300">
            Configure Algerian Mostaganem rules & table mode
          </p>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-blue-300 block">
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
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedMode === m.id
                    ? 'bg-white text-blue-950 border-2 border-blue-400 shadow-md ring-2 ring-blue-300/50'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-blue-400/50'
                }`}
              >
                <div className={`font-bold text-sm ${selectedMode === m.id ? 'text-blue-950' : 'text-white'}`}>{m.label}</div>
                <div className={`text-[11px] ${selectedMode === m.id ? 'text-blue-800' : 'text-slate-400'}`}>{m.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target Score */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-blue-300 block">
            Match Target Points
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[50, 100, 150, 200].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setTargetScore(score)}
                className={`py-2.5 rounded-2xl font-black text-sm border transition-all cursor-pointer ${
                  targetScore === score
                    ? 'bg-white text-blue-950 border-2 border-blue-400 shadow-md ring-2 ring-blue-300/50'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-blue-400/50'
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
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-sm cursor-pointer transition-colors border border-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="flex-1 py-3 bg-white hover:bg-blue-50 text-blue-950 font-extrabold rounded-2xl text-sm uppercase tracking-wider shadow-lg cursor-pointer border-2 border-blue-300 transition-all"
          >
            Start Match
          </button>
        </div>
      </div>
    </div>
  );
};
