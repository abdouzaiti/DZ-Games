/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Language, getTranslation } from '../translations';

export interface UserProfile {
  name: string;
  avatar: string; // Emoji avatar icon or picture
}

export const AVATAR_OPTIONS = [
  { id: 'algeria', icon: '🇩🇿', label: 'Dz' },
  { id: 'cafe', icon: '☕', label: 'Café' },
  { id: 'king', icon: '👑', label: 'Roi' },
  { id: 'lion', icon: '🦁', label: 'Sbaa' },
  { id: 'domino', icon: '🀁', label: 'Domino' },
  { id: 'chechia', icon: '👳', label: 'Chechia' },
  { id: 'star', icon: '⭐', label: 'Star' },
  { id: 'trophy', icon: '🏆', label: 'Champion' },
  { id: 'player1', icon: '👤', label: 'Classic' },
  { id: 'ninja', icon: '🥷', label: 'Ninja' },
];

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  language: Language;
  onSaveProfile: (newProfile: UserProfile) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  language,
  onSaveProfile,
  onClose,
}) => {
  const [name, setName] = useState<string>(profile.name);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(profile.avatar);

  if (!isOpen) return null;

  const t = getTranslation(language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Joueur 1';
    onSaveProfile({
      name: finalName,
      avatar: selectedAvatar,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1B1410]/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1B1410] border-2 border-[#3D322A] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#3D322A]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2D241E] border border-[#D4A373] flex items-center justify-center text-2xl shadow">
              {selectedAvatar}
            </div>
            <div>
              <h2 className="font-serif italic font-extrabold text-xl text-[#FEFAE0]">
                {t.profileTitle}
              </h2>
              <p className="text-xs text-[#A98467]">
                Personnalisez votre identité de jeu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2D241E] text-[#A98467] hover:text-[#FEFAE0] flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Player Name Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#A98467] block">
              {t.playerName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Amine, Karim..."
              maxLength={20}
              className="w-full bg-[#2D241E] border border-[#3D322A] focus:border-[#D4A373] focus:ring-1 focus:ring-[#D4A373] rounded-2xl px-4 py-3 text-[#FEFAE0] font-bold text-base outline-none transition-all"
            />
          </div>

          {/* Profile Picture / Avatar Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#A98467] block">
              {t.chooseAvatar}
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {AVATAR_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedAvatar(item.icon)}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    selectedAvatar === item.icon
                      ? 'bg-[#D4A373]/20 border-[#D4A373] ring-2 ring-[#D4A373] scale-105'
                      : 'bg-[#2D241E] border-[#3D322A] hover:border-[#D4A373]/50'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[10px] text-[#A98467] font-semibold truncate max-w-full">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#D4A373] hover:bg-[#A98467] text-[#1B1410] font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer pt-3"
          >
            {t.save}
          </button>
        </form>
      </div>
    </div>
  );
};
