/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GameConfig } from '../../domain/gameConfig';
import { Language, getTranslation } from '../translations';
import { AppSettings, SettingsModal } from './SettingsModal';
import { ProfileModal, UserProfile } from './ProfileModal';
import { OnlinePlayModal } from './OnlinePlayModal';
import { MatchSetupModal } from './MatchSetupModal';
import { audioController } from '../utils/audio';

interface MainLobbyProps {
  currentConfig: GameConfig;
  settings: AppSettings;
  profile: UserProfile;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onUpdateProfile: (newProfile: UserProfile) => void;
  onStartOfflineMatch: (config: GameConfig) => void;
}

export const MainLobby: React.FC<MainLobbyProps> = ({
  currentConfig,
  settings,
  profile,
  onUpdateSettings,
  onUpdateProfile,
  onStartOfflineMatch,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isOnlineOpen, setIsOnlineOpen] = useState<boolean>(false);
  const [isMatchSetupOpen, setIsMatchSetupOpen] = useState<boolean>(false);

  const t = getTranslation(settings.language);

  const handleOpenSettings = () => {
    audioController.playButtonClick(settings.soundEffects);
    audioController.triggerVibration(settings.vibration, 30);
    setIsSettingsOpen(true);
  };

  const handleOpenProfile = () => {
    audioController.playButtonClick(settings.soundEffects);
    audioController.triggerVibration(settings.vibration, 30);
    setIsProfileOpen(true);
  };

  const handleOpenOnline = () => {
    audioController.playButtonClick(settings.soundEffects);
    audioController.triggerVibration(settings.vibration, 40);
    setIsOnlineOpen(true);
  };

  const handleOpenOffline = () => {
    audioController.playButtonClick(settings.soundEffects);
    audioController.triggerVibration(settings.vibration, 40);
    setIsMatchSetupOpen(true);
  };

  return (
    <div
      dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-x-hidden selection:bg-blue-500 selection:text-white"
    >
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1E3A8A_0%,_#0F172A_100%)] opacity-85 pointer-events-none" />

      {/* TOP BAR HEADER */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        {/* App Title & Branding */}
        <div className="flex items-center gap-3">
          <img
            src="/mgc.png"
            alt="Mosta Domino Logo"
            className="w-10 h-10 object-contain rounded-xl border-2 border-blue-300 shadow-md bg-white p-1"
            referrerPolicy="no-referrer"
          />
          <span className="font-serif italic font-extrabold text-xl text-white tracking-wide drop-shadow-sm">
            Mosta Domino
          </span>
        </div>

        {/* Top Right SETTINGS Icon Trigger - WHITE TRIGGER */}
        <button
          type="button"
          onClick={handleOpenSettings}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white hover:bg-blue-50 active:scale-95 border-2 border-blue-200 hover:border-blue-400 flex items-center justify-center text-xl sm:text-2xl shadow-lg transition-all cursor-pointer group text-slate-800"
          title={t.settingsTitle}
        >
          <span className="transition-transform group-hover:rotate-45">⚙️</span>
        </button>
      </header>

      {/* CENTER GAMEPLAY TRIGGERS - WHITE CARDS */}
      <main className="relative z-10 w-full max-w-3xl mx-auto my-auto py-8 sm:py-12 flex flex-col items-center justify-center space-y-6 sm:space-y-8 text-center">
        {/* TWO BIG WHITE GAMEPLAY TRIGGERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full px-2">
          {/* Trigger 1: Jouer en ligne */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenOnline}
            className="group relative bg-white hover:bg-blue-50/80 border-2 border-blue-200 hover:border-blue-400 p-6 sm:p-8 rounded-3xl text-left transition-all shadow-2xl shadow-blue-900/30 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[220px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl sm:text-4xl shadow-sm">
                🌐
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-900 text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">
                Multijoueur
              </span>
            </div>

            <div className="mt-6 space-y-1">
              <h2 className="font-serif italic font-extrabold text-2xl sm:text-3xl text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                <span>{t.playOnline}</span>
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {t.playOnlineSub}
              </p>
            </div>
          </motion.button>

          {/* Trigger 2: Hors ligne vs AI */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenOffline}
            className="group relative bg-white hover:bg-blue-50/80 border-2 border-blue-300 hover:border-blue-500 p-6 sm:p-8 rounded-3xl text-left transition-all shadow-2xl shadow-blue-900/30 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[220px]"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-400/15 rounded-full blur-2xl group-hover:bg-blue-400/25 transition-all pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-md">
                🤖
              </div>
              <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">
                Prêt à Jouer
              </span>
            </div>

            <div className="mt-6 space-y-1">
              <h2 className="font-serif italic font-extrabold text-2xl sm:text-3xl text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                <span>{t.playOffline}</span>
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {t.playOfflineSub}
              </p>
            </div>
          </motion.button>
        </div>
      </main>

      {/* BOTTOM PLAYER IDENTITY CARD - WHITE TRIGGER */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto py-2 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenProfile}
          className="group bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-400 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-xl shadow-blue-950/20 transition-all cursor-pointer ring-1 ring-blue-100"
          title="Cliquez pour modifier votre profil"
        >
          {/* Avatar Picture */}
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border-2 border-blue-300 flex items-center justify-center text-2xl shadow-sm">
              {profile.avatar}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white">
              ✏️
            </span>
          </div>

          {/* Player Name & Tag */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900 group-hover:text-blue-700 transition-colors">
                {profile.name}
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-black rounded uppercase">
                {t.profileTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Cliquez pour changer le nom et la photo
            </p>
          </div>
        </motion.button>
      </footer>

      {/* MODALS */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        profile={profile}
        language={settings.language}
        onSaveProfile={onUpdateProfile}
        onClose={() => setIsProfileOpen(false)}
      />

      <OnlinePlayModal
        isOpen={isOnlineOpen}
        language={settings.language}
        onClose={() => setIsOnlineOpen(false)}
        onPlayOfflineFallback={() => {
          setIsOnlineOpen(false);
          setIsMatchSetupOpen(true);
        }}
      />

      <MatchSetupModal
        currentConfig={currentConfig}
        isOpen={isMatchSetupOpen}
        onClose={() => setIsMatchSetupOpen(false)}
        onStartMatch={(config) => {
          setIsMatchSetupOpen(false);
          onStartOfflineMatch(config);
        }}
      />
    </div>
  );
};
