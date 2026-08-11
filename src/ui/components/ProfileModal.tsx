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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-blue-400/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl shadow-sm">
              {selectedAvatar}
            </div>
            <div>
              <h2 className="font-serif italic font-extrabold text-xl text-white">
                {t.profileTitle}
              </h2>
              <p className="text-xs text-blue-300">
                Personnalisez votre identité de jeu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Player Name Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-300 block">
              {t.playerName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Amine, Karim..."
              maxLength={20}
              className="w-full bg-slate-800 border-2 border-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-2xl px-4 py-3 text-white font-bold text-base outline-none transition-all"
            />
          </div>

          {/* Profile Picture / Avatar Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-300 block">
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
                      ? 'bg-white text-blue-950 border-2 border-blue-400 ring-2 ring-blue-300/50 scale-105 shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-400/50'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[10px] text-blue-300 font-semibold truncate max-w-full">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button - WHITE TRIGGER */}
          <button
            type="submit"
            className="w-full py-3.5 bg-white hover:bg-blue-50 text-blue-950 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg border-2 border-blue-300 transition-all cursor-pointer"
          >
            {t.save}
          </button>
        </form>
      </div>
    </div>
  );
};
