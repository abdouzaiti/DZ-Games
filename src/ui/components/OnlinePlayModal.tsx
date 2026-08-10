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
    <div className="fixed inset-0 z-50 bg-[#1B1410]/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1B1410] border-2 border-[#3D322A] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative text-center">
        {/* Decorative Online Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-[#2D241E] border-2 border-[#D4A373] flex items-center justify-center text-4xl shadow-xl shadow-[#D4A373]/20 relative">
          🌐
          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#CCD5AE] text-[#1B1410] text-[10px] font-black rounded-md uppercase">
            {t.comingSoon}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="font-serif italic font-extrabold text-2xl text-[#FEFAE0]">
            {t.onlineTitle}
          </h2>
          <p className="text-xs text-[#A98467] leading-relaxed max-w-sm mx-auto">
            {t.onlineDesc}
          </p>
        </div>

        {/* Online Lobby Rooms Preview */}
        <div className="space-y-2 text-left bg-[#2D241E]/60 p-4 border border-[#3D322A] rounded-2xl">
          <div className="text-xs font-bold text-[#D4A373] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Salles en préparation 🇩🇿</span>
            <span className="text-[10px] bg-[#3D322A] px-2 py-0.5 rounded text-[#A98467]">
              Matchmaking
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 bg-[#1B1410] rounded-xl border border-[#3D322A] flex items-center justify-between text-xs opacity-60">
              <div className="flex items-center gap-2">
                <span>☕</span>
                <span className="font-bold text-[#FEFAE0]">Café Mostaganem #1</span>
              </div>
              <span className="text-[10px] text-[#CCD5AE] font-mono">2/4 Joueurs</span>
            </div>

            <div className="p-2.5 bg-[#1B1410] rounded-xl border border-[#3D322A] flex items-center justify-between text-xs opacity-60">
              <div className="flex items-center gap-2">
                <span>🀁</span>
                <span className="font-bold text-[#FEFAE0]">Tournoi Sitta Sitta</span>
              </div>
              <span className="text-[10px] text-[#D4A373] font-mono">3/4 Joueurs</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onPlayOfflineFallback();
            }}
            className="w-full py-3.5 bg-[#D4A373] hover:bg-[#A98467] text-[#1B1410] font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🤖 {t.playOffline}</span>
            <span>➔</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#2D241E] hover:bg-[#3D322A] text-[#A98467] hover:text-[#FEFAE0] font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
