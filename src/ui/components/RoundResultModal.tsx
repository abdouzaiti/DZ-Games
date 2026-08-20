/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameSnapshot } from '../../domain/gameState';
import { Loader2 } from 'lucide-react';

interface RoundResultModalProps {
  snapshot: GameSnapshot;
  onNextRound: () => void;
  onRestartMatch: () => void;
  isMultiplayer?: boolean;
  isHost?: boolean;
  language?: string;
}

const LOCAL_TRANSLATIONS: Record<string, any> = {
  dz: {
    roundFinished: 'خلاصت اليد',
    matchVictory: '🎉 ربحت البارتيا بالصحة! 🎉',
    wonMatchTeam: (team: number, score: number) => `الفرقة ${team} ربحت البارتيا بـ ${score} بوان!`,
    wonMatchPlayer: (name: string) => `الجوور ${name} ربح البارتيا!`,
    tieDescription: 'الطاولة تبلعت وتساويتو فالنقاط. زيرو بوان لكل واحد.',
    winnerAwarded: (name: string, points: number) => `الجوور ${name} دا +${points} بوان!`,
    remainingPips: 'الحبات لي بقاو في يدين الغاشي',
    pipsCount: (pips: number) => `${pips} بوان`,
    nextRound: 'اليد الجاية ←',
    startNewMatch: 'بارتيا جديدة',
    waitingForHostRound: 'رانا نستناو فمول الشومبرة يديماري اليد الجاية...',
    waitingForHostMatch: 'رانا نستناو فمول الشومبرة يديماري بارتيا جديدة...'
  },
  ar: {
    roundFinished: 'انتهت الجولة',
    matchVictory: '🎉 انتصار المباراة! 🎉',
    wonMatchTeam: (team: number, score: number) => `فاز الفريق ${team} بالمباراة بـ ${score} نقطة!`,
    wonMatchPlayer: (name: string) => `فاز ${name} بالمباراة!`,
    tieDescription: 'تعادل جميع اللاعبين في النقاط. تم منح 0 نقطة.',
    winnerAwarded: (name: string, points: number) => `سجل ${name} +${points} نقطة!`,
    remainingPips: 'النقاط المتبقية في نهاية الجولة',
    pipsCount: (pips: number) => `${pips} نقطة`,
    nextRound: 'الجولة التالية ←',
    startNewMatch: 'مباراة جديدة',
    waitingForHostRound: 'في انتظار منشئ الغرفة لبدء الجولة التالية...',
    waitingForHostMatch: 'في انتظار منشئ الغرفة لبدء مباراة جديدة...'
  },
  fr: {
    roundFinished: 'Manche Terminée',
    matchVictory: '🎉 VICTOIRE MATCH ! 🎉',
    wonMatchTeam: (team: number, score: number) => `L'équipe ${team} a gagné le match avec ${score} points !`,
    wonMatchPlayer: (name: string) => `${name} a gagné le match !`,
    tieDescription: 'Tous les joueurs ont un score égal. 0 point accordé.',
    winnerAwarded: (name: string, points: number) => `${name} a marqué +${points} points !`,
    remainingPips: 'Points restants en fin de manche',
    pipsCount: (pips: number) => `${pips} pts`,
    nextRound: 'Manche Suivante →',
    startNewMatch: 'Nouveau Match',
    waitingForHostRound: "En attente de l'hôte pour lancer la manche suivante...",
    waitingForHostMatch: "En attente de l'hôte pour lancer un nouveau match..."
  },
  en: {
    roundFinished: 'Round Finished',
    matchVictory: '🎉 MATCH VICTORY! 🎉',
    wonMatchTeam: (team: number, score: number) => `Team ${team} won the match with ${score} points!`,
    wonMatchPlayer: (name: string) => `${name} won the match!`,
    tieDescription: 'All players had equal pips in blocked game. 0 points awarded.',
    winnerAwarded: (name: string, points: number) => `${name} scored +${points} points!`,
    remainingPips: 'Remaining Pips at End of Round',
    pipsCount: (pips: number) => `${pips} pips`,
    nextRound: 'Next Round →',
    startNewMatch: 'Start New Match',
    waitingForHostRound: 'Waiting for host to start the next round...',
    waitingForHostMatch: 'Waiting for host to start a new match...'
  }
};

export const RoundResultModal: React.FC<RoundResultModalProps> = ({
  snapshot,
  onNextRound,
  onRestartMatch,
  isMultiplayer = false,
  isHost = true,
  language = 'fr',
}) => {
  const { roundStatus, latestResult, matchScores, players } = snapshot;

  if (roundStatus !== 'ROUND_ENDED_SORTIE' && roundStatus !== 'ROUND_ENDED_GHALLAQ' && roundStatus !== 'MATCH_ENDED') {
    return null;
  }

  const t = LOCAL_TRANSLATIONS[language] || LOCAL_TRANSLATIONS.fr;

  const isMatchEnded = roundStatus === 'MATCH_ENDED';
  const isSortie = latestResult?.reason === 'SORTIE';
  const isGhallaq = latestResult?.reason === 'GHALLAQ';
  const isEgalite = latestResult?.reason === 'EGALITE';

  let title = t.roundFinished;
  if (isMatchEnded) {
    title = t.matchVictory;
  } else if (isSortie) {
    title = (language === 'ar' || language === 'dz') ? '🔥 خروج! (انتهت اليد)' : language === 'fr' ? '🔥 SORTIE ! (Main Vide)' : '🔥 SORTIE! (Hand Cleared)';
  } else if (isGhallaq) {
    title = (language === 'ar' || language === 'dz') ? '🔒 غلاق! (طاولة مغلقة)' : language === 'fr' ? '🔒 GHALLAQ ! (Jeu Bloqué)' : '🔒 GHALLAQ! (Game Blocked)';
  } else if (isEgalite) {
    title = (language === 'ar' || language === 'dz') ? '🤝 تعادل (نقاط متساوية)' : language === 'fr' ? '🤝 ÉGALITÉ (Exacte)' : '🤝 EGALITÉ (Exact Tie)';
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
                ? t.wonMatchTeam(matchScores.matchWinnerTeamId + 1, matchScores.teamScores[matchScores.matchWinnerTeamId])
                : t.wonMatchPlayer(winnerName || '')}
            </p>
          ) : (
            <p className="text-sm font-semibold text-slate-200">
              {isEgalite
                ? t.tieDescription
                : t.winnerAwarded(winnerName || 'Winner', latestResult?.pointsAwarded ?? 0)}
            </p>
          )}
        </div>

        {/* Hand Pips Breakdown */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-blue-300">
            {t.remainingPips}
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
                    {t.pipsCount(pips)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons - Guest vs Host layout */}
        <div className="flex gap-3">
          {isMultiplayer && !isHost ? (
            <div className="w-full p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wide">
                  {isMatchEnded ? t.waitingForHostMatch : t.waitingForHostRound}
                </span>
              </div>
            </div>
          ) : isMatchEnded ? (
            <button
              type="button"
              onClick={onRestartMatch}
              className="w-full py-3.5 bg-white hover:bg-blue-50 text-blue-950 font-extrabold rounded-2xl shadow-lg border-2 border-blue-300 transition-all text-base uppercase tracking-wider cursor-pointer"
            >
              {t.startNewMatch}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextRound}
              className="w-full py-3.5 bg-white hover:bg-blue-50 text-blue-950 font-extrabold rounded-2xl shadow-lg border-2 border-blue-300 transition-all text-base uppercase tracking-wider cursor-pointer"
            >
              {t.nextRound}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
