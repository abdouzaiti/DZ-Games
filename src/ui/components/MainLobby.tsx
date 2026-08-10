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
      className="min-h-screen bg-[#1B1410] text-[#FEFAE0] flex flex-col justify-between p-4 sm:p-8 relative overflow-x-hidden selection:bg-[#D4A373] selection:text-[#1B1410]"
    >
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#3D322A_0%,_#1B1410_100%)] opacity-80 pointer-events-none" />
      <div className="absolute inset-4 sm:inset-6 border border-dashed border-[#D4A373]/20 rounded-3xl pointer-events-none" />

      {/* TOP BAR HEADER */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        {/* App Title & Branding */}
        <div className="flex items-center gap-3">
        </div>

        {/* Top Right SETTINGS Icon Trigger */}
        <button
          type="button"
          onClick={handleOpenSettings}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#2D241E] hover:bg-[#3D322A] active:scale-95 border-2 border-[#3D322A] hover:border-[#D4A373] flex items-center justify-center text-xl sm:text-2xl shadow-xl transition-all cursor-pointer group"
          title={t.settingsTitle}
        >
          <span className="transition-transform group-hover:rotate-45">⚙️</span>
        </button>
      </header>

      {/* CENTER GAMEPLAY TRIGGERS */}
      <main className="relative z-10 w-full max-w-3xl mx-auto my-auto py-8 sm:py-12 flex flex-col items-center justify-center space-y-6 sm:space-y-8 text-center">
        {/* TWO BIG GAMEPLAY TRIGGERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full px-2">
          {/* Trigger 1: Jouer en ligne */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenOnline}
            className="group relative bg-[#2D241E] hover:bg-[#322822] border-2 border-[#3D322A] hover:border-[#D4A373] p-6 sm:p-8 rounded-3xl text-left transition-all shadow-2xl cursor-pointer overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[220px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A373]/5 rounded-full blur-2xl group-hover:bg-[#D4A373]/15 transition-all pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#1B1410] border border-[#D4A373]/40 flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
                🌐
              </div>
              <span className="px-3 py-1 bg-[#CCD5AE] text-[#1B1410] text-[10px] font-black rounded-full uppercase tracking-wider shadow">
                Multijoueur
              </span>
            </div>

            <div className="mt-6 space-y-1">
              <h2 className="font-serif italic font-extrabold text-2xl sm:text-3xl text-[#FEFAE0] group-hover:text-[#D4A373] transition-colors flex items-center gap-2">
                <span>{t.playOnline}</span>
                <span className="text-xl transition-transform group-hover:translate-x-1">➔</span>
              </h2>
              <p className="text-xs text-[#A98467] leading-relaxed">
                {t.playOnlineSub}
              </p>
            </div>
          </motion.button>

          {/* Trigger 2: Hors ligne vs AI */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenOffline}
            className="group relative bg-gradient-to-br from-[#2D241E] to-[#3B2F27] border-2 border-[#D4A373] p-6 sm:p-8 rounded-3xl text-left transition-all shadow-2xl shadow-[#D4A373]/15 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[220px]"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4A373]/20 rounded-full blur-2xl group-hover:bg-[#D4A373]/30 transition-all pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#D4A373] text-[#1B1410] flex items-center justify-center text-3xl sm:text-4xl shadow-xl">
                🤖
              </div>
              <span className="px-3 py-1 bg-[#D4A373] text-[#1B1410] text-[10px] font-black rounded-full uppercase tracking-wider shadow">
                Prêt à Jouer
              </span>
            </div>

            <div className="mt-6 space-y-1">
              <h2 className="font-serif italic font-extrabold text-2xl sm:text-3xl text-[#FEFAE0] group-hover:text-[#D4A373] transition-colors flex items-center gap-2">
                <span>{t.playOffline}</span>
                <span className="text-xl transition-transform group-hover:translate-x-1">➔</span>
              </h2>
              <p className="text-xs text-[#CCD5AE] font-medium leading-relaxed">
                {t.playOfflineSub}
              </p>
            </div>
          </motion.button>
        </div>
      </main>

      {/* BOTTOM PLAYER IDENTITY CARD */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto py-2 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenProfile}
          className="group bg-[#2D241E] hover:bg-[#382D26] border-2 border-[#3D322A] hover:border-[#D4A373] px-5 py-3 rounded-2xl flex items-center gap-4 shadow-2xl transition-all cursor-pointer ring-1 ring-[#D4A373]/20"
          title="Cliquez pour modifier votre profil"
        >
          {/* Avatar Picture */}
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-[#1B1410] border-2 border-[#D4A373] flex items-center justify-center text-2xl shadow">
              {profile.avatar}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#CCD5AE] rounded-full border-2 border-[#1B1410] flex items-center justify-center text-[8px] font-black text-[#1B1410]">
              ✏️
            </span>
          </div>

          {/* Player Name & Tag */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-[#FEFAE0] group-hover:text-[#D4A373] transition-colors">
                {profile.name}
              </span>
              <span className="px-2 py-0.5 bg-[#D4A373]/20 text-[#D4A373] text-[10px] font-black rounded uppercase">
                {t.profileTitle}
              </span>
            </div>
            <p className="text-xs text-[#A98467] font-semibold mt-0.5">
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
