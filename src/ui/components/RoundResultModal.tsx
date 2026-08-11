/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameSnapshot } from '../../domain/gameState';

interface RoundResultModalProps {
  snapshot: GameSnapshot;
  onNextRound: () => void;
  onRestartMatch: () => void;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({
  snapshot,
  onNextRound,
  onRestartMatch,
}) => {
  const { roundStatus, latestResult, matchScores, players, config } = snapshot;

  if (roundStatus !== 'ROUND_ENDED_SORTIE' && roundStatus !== 'ROUND_ENDED_GHALLAQ' && roundStatus !== 'MATCH_ENDED') {
    return null;
  }

  const isMatchEnded = roundStatus === 'MATCH_ENDED';
  const isSortie = latestResult?.reason === 'SORTIE';
  const isGhallaq = latestResult?.reason === 'GHALLAQ';
  const isEgalite = latestResult?.reason === 'EGALITE';

  let title = 'Round Finished';
  if (isMatchEnded) {
    title = '🎉 MATCH VICTORY! 🎉';
  } else if (isSortie) {
    title = '🔥 SORTIE! (Hand Cleared)';
  } else if (isGhallaq) {
    title = '🔒 GHALLAQ! (Game Blocked)';
  } else if (isEgalite) {
    title = '🤝 EGALITÉ (Exact Tie)';
  }

  const winnerName = latestResult?.winnerPlayerId
    ? players.find((p) => p.id === latestResult.winnerPlayerId)?.name
    : matchScores.matchWinnerPlayerId
    ? players.find((p) => p.id === matchScores.matchWinnerPlayerId)?.name
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-blue-400/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif italic font-black text-white tracking-wide">
            {title}
          </h2>
          {isMatchEnded ? (
            <p className="text-base font-bold text-blue-300">
              {matchScores.matchWinnerTeamId !== null
                ? `Team ${matchScores.matchWinnerTeamId + 1} won the match with ${matchScores.teamScores[matchScores.matchWinnerTeamId]} points!`
                : `${winnerName} won the match!`}
            </p>
          ) : (
            <p className="text-sm font-semibold text-slate-200">
              {isEgalite
                ? 'All players had equal pips in blocked game. 0 points awarded.'
                : `${winnerName || 'Winner'} scored +${latestResult?.pointsAwarded} points!`}
            </p>
          )}
        </div>

        {/* Hand Pips Breakdown */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-blue-300">
            Remaining Pips at End of Round
          </h4>
          <div className="space-y-2">
            {players.map((player) => {
              const pips = latestResult?.playerHandPipsAtEnd[player.id] ?? 0;
              const isWinner = player.id === latestResult?.winnerPlayerId;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-sm ${
                    isWinner ? 'bg-white text-blue-950 font-bold border-2 border-blue-400 shadow-md' : 'text-slate-300 bg-slate-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isWinner ? '👑' : '🀁'} {player.name}
                  </span>
                  <span className={`font-mono text-xs px-2 py-1 rounded font-black border ${isWinner ? 'bg-blue-100 text-blue-950 border-blue-300' : 'bg-slate-800 text-blue-300 border-slate-700'}`}>
                    {pips} pips
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons - WHITE TRIGGER */}
        <div className="flex gap-3">
          {isMatchEnded ? (
            <button
              type="button"
              onClick={onRestartMatch}
              className="w-full py-3.5 bg-white hover:bg-blue-50 text-blue-950 font-extrabold rounded-2xl shadow-lg border-2 border-blue-300 transition-all text-base uppercase tracking-wider cursor-pointer"
            >
              Start New Match
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextRound}
              className="w-full py-3.5 bg-white hover:bg-blue-50 text-blue-950 font-extrabold rounded-2xl shadow-lg border-2 border-blue-300 transition-all text-base uppercase tracking-wider cursor-pointer"
            >
              Next Round →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
