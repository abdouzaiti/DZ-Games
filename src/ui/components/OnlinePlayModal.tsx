/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Language, getTranslation } from '../translations';

interface OnlinePlayModalProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onPlayOfflineFallback: () => void;
}

export const OnlinePlayModal: React.FC<OnlinePlayModalProps> = ({
  isOpen,
  language,
  onClose,
  onPlayOfflineFallback,
}) => {
  if (!isOpen) return null;

  const t = getTranslation(language);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-blue-400/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative text-center">
        {/* Decorative Online Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-blue-50 border-2 border-blue-300 flex items-center justify-center text-4xl shadow-xl shadow-blue-500/10 relative">
          🌐
          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-md uppercase">
            {t.comingSoon}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="font-serif italic font-extrabold text-2xl text-white">
            {t.onlineTitle}
          </h2>
          <p className="text-xs text-blue-200 leading-relaxed max-w-sm mx-auto">
            {t.onlineDesc}
          </p>
        </div>

        {/* Online Lobby Rooms Preview */}
        <div className="space-y-2 text-left bg-slate-800/80 p-4 border border-slate-700 rounded-2xl">
          <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Salles en préparation 🇩🇿</span>
            <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-blue-200">
              Matchmaking
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between text-xs opacity-80">
              <div className="flex items-center gap-2">
                <span>☕</span>
                <span className="font-bold text-white">Café Mostaganem #1</span>
              </div>
              <span className="text-[10px] text-blue-400 font-mono">2/4 Joueurs</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between text-xs opacity-80">
              <div className="flex items-center gap-2">
                <span>🀁</span>
                <span className="font-bold text-white">Tournoi Sitta Sitta</span>
              </div>
              <span className="text-[10px] text-blue-400 font-mono">3/4 Joueurs</span>
            </div>
          </div>
        </div>

        {/* Actions - WHITE TRIGGER */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onPlayOfflineFallback();
            }}
            className="w-full py-3.5 bg-white hover:bg-blue-50 text-blue-950 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer border-2 border-blue-300 flex items-center justify-center gap-2"
          >
            <span>🤖 {t.playOffline}</span>
            <span>➔</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-700"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
