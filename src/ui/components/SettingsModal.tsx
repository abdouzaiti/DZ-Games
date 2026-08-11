/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Language, getTranslation } from '../translations';
import { audioController } from '../utils/audio';

export interface AppSettings {
  music: boolean;
  soundEffects: boolean;
  vibration: boolean;
  language: Language;
}

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  if (!isOpen) return null;

  const t = getTranslation(settings.language);

  const handleToggle = (key: 'music' | 'soundEffects' | 'vibration') => {
    const newValue = !settings[key];
    onUpdateSettings({ [key]: newValue });
    if (key === 'vibration' && newValue) {
      audioController.triggerVibration(true, 50);
    } else if (key === 'soundEffects' && newValue) {
      audioController.playButtonClick(true);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    onUpdateSettings({ language: lang });
    audioController.playButtonClick(settings.soundEffects);
    audioController.triggerVibration(settings.vibration, 30);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-blue-400/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-xl shadow-sm">
              ⚙️
            </div>
            <div>
              <h2 className="font-serif italic font-extrabold text-xl text-white">
                {t.settingsTitle}
              </h2>
              <p className="text-xs text-blue-300">
                Café Dominoes Mostaganem
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

        {/* Toggles List */}
        <div className="space-y-4">
          {/* Music Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎵</span>
              <div>
                <span className="font-bold text-sm text-white block">{t.music}</span>
                <span className="text-[11px] text-blue-300">Background ambience</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('music')}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                settings.music ? 'bg-blue-600 justify-end' : 'bg-slate-900 border border-slate-700 justify-start'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full shadow-md font-black text-[10px] flex items-center justify-center ${
                  settings.music ? 'bg-white text-blue-900' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {settings.music ? 'ON' : 'OFF'}
              </div>
            </button>
          </div>

          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔊</span>
              <div>
                <span className="font-bold text-sm text-white block">{t.soundEffects}</span>
                <span className="text-[11px] text-blue-300">Domino click & turn sounds</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('soundEffects')}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                settings.soundEffects ? 'bg-blue-600 justify-end' : 'bg-slate-900 border border-slate-700 justify-start'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full shadow-md font-black text-[10px] flex items-center justify-center ${
                  settings.soundEffects ? 'bg-white text-blue-900' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {settings.soundEffects ? 'ON' : 'OFF'}
              </div>
            </button>
          </div>

          {/* Vibration Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xl">📳</span>
              <div>
                <span className="font-bold text-sm text-white block">{t.vibration}</span>
                <span className="text-[11px] text-blue-300">Haptic feedback</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('vibration')}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                settings.vibration ? 'bg-blue-600 justify-end' : 'bg-slate-900 border border-slate-700 justify-start'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full shadow-md font-black text-[10px] flex items-center justify-center ${
                  settings.vibration ? 'bg-white text-blue-900' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {settings.vibration ? 'ON' : 'OFF'}
              </div>
            </button>
          </div>

          {/* Language Selector */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-blue-300 block">
              {t.language} / Language
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ar', label: 'العربية 🇩🇿' },
                { id: 'fr', label: 'Français 🇫🇷' },
                { id: 'en', label: 'English 🇬🇧' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => handleLanguageChange(lang.id as Language)}
                  className={`py-3 px-2 rounded-2xl text-xs font-extrabold border transition-all cursor-pointer ${
                    settings.language === lang.id
                      ? 'bg-white text-blue-950 border-2 border-blue-400 shadow-md ring-2 ring-blue-300/50'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-400/50'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Button - WHITE TRIGGER */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 bg-white hover:bg-blue-50 text-blue-950 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg border-2 border-blue-300 transition-all cursor-pointer"
        >
          {t.save}
        </button>
      </div>
    </div>
  );
};
