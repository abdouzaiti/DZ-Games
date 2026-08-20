/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings } from 'lucide-react';
import { GameConfig } from '../../domain/gameConfig';
import { Language, getTranslation } from '../translations';
import { AppSettings, SettingsModal } from './SettingsModal';
import { ProfileModal, UserProfile } from './ProfileModal';
import { OnlinePlayModal } from './OnlinePlayModal';
import { MatchSetupModal } from './MatchSetupModal';
import { audioController } from '../utils/audio';
import { Avatar } from './Avatar';

interface MainLobbyProps {
  currentConfig: GameConfig;
  settings: AppSettings;
  profile: UserProfile;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onUpdateProfile: (newProfile: UserProfile) => void;
  onStartOfflineMatch: (config: GameConfig) => void;
  onJoinMatch: (matchId: string, playerId: string) => void;
  onLogout: () => void;
}

export const MainLobby: React.FC<MainLobbyProps> = ({
  currentConfig,
  settings,
  profile,
  onUpdateSettings,
  onUpdateProfile,
  onStartOfflineMatch,
  onJoinMatch,
  onLogout,
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
      className="h-[100dvh] w-full bg-slate-900 text-slate-100 flex flex-col justify-between p-3 sm:p-6 relative overflow-hidden selection:bg-blue-500 selection:text-white"
    >
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1E3A8A_0%,_#0F172A_100%)] opacity-85 pointer-events-none" />

      {/* TOP BAR HEADER */}
      <header className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-3 items-center py-2 sm:py-4 shrink-0">
        {/* Left Empty Area */}
        <div className="flex items-center justify-start"></div>

        {/* App Logo */}
        <div className="flex items-center justify-center">
          <img
            src="/mgc.png"
            alt="MOSTA GAMES CLUB Logo"
            className="h-16 sm:h-24 w-auto object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          {/* Home Button */}
          <button
            type="button"
            onClick={onLogout}
            className="p-2 sm:p-3 rounded-2xl text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            title="Retour à l'accueil"
          >
            <span className="text-xl sm:text-2xl leading-none">🏠</span>
          </button>

          {/* Settings Icon Trigger */}
          <button
            type="button"
            onClick={handleOpenSettings}
            className="p-2 sm:p-3 rounded-2xl text-white hover:text-blue-300 hover:bg-white/10 active:scale-95 transition-all cursor-pointer group flex items-center justify-center"
            title={t.settingsTitle}
          >
            <Settings className="w-6 h-6 sm:w-8 sm:h-8 transition-transform group-hover:rotate-45" />
          </button>
        </div>
      </header>

      {/* CENTER GAMEPLAY TRIGGERS - WHITE CARDS */}
      <main className="relative z-10 w-full max-w-3xl mx-auto my-auto flex-1 flex flex-col items-center justify-center space-y-4 sm:space-y-8 text-center py-2 sm:py-4">
        {/* TWO BIG WHITE GAMEPLAY TRIGGERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 w-full px-1">
          {/* Trigger 1: Jouer en ligne */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenOnline}
            className="group relative bg-white hover:bg-blue-50/80 border-2 border-blue-200 hover:border-blue-400 p-4 sm:p-8 rounded-2xl sm:rounded-3xl text-left transition-all shadow-xl shadow-blue-900/30 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[130px] sm:min-h-[200px]"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="text-3xl sm:text-4xl">
                🌐
              </span>
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-blue-100 text-blue-900 text-[9px] sm:text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">
                Multijoueur
              </span>
            </div>

            <div className="mt-2 sm:mt-6 space-y-0.5 sm:space-y-1">
              <h2 className="font-serif italic font-extrabold text-xl sm:text-3xl text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                <span>{t.playOnline}</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed">
                {t.playOnlineSub}
              </p>
            </div>
          </motion.button>

          {/* Trigger 2: Hors ligne vs AI */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenOffline}
            className="group relative bg-white hover:bg-blue-50/80 border-2 border-blue-300 hover:border-blue-500 p-4 sm:p-8 rounded-2xl sm:rounded-3xl text-left transition-all shadow-xl shadow-blue-900/30 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[130px] sm:min-h-[200px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/15 rounded-full blur-2xl group-hover:bg-blue-400/25 transition-all pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="text-3xl sm:text-4xl">
                🤖
              </span>
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-blue-600 text-white text-[9px] sm:text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm">
                Prêt à Jouer
              </span>
            </div>

            <div className="mt-2 sm:mt-6 space-y-0.5 sm:space-y-1">
              <h2 className="font-serif italic font-extrabold text-xl sm:text-3xl text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                <span>{t.playOffline}</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-relaxed">
                {t.playOfflineSub}
              </p>
            </div>
          </motion.button>
        </div>
      </main>

      {/* BOTTOM PLAYER IDENTITY CARD - WHITE TRIGGER */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto py-1 sm:py-2 flex justify-center shrink-0">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenProfile}
          className="group bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-400 px-4 py-2 sm:px-5 sm:py-3 rounded-2xl flex items-center gap-3 sm:gap-4 shadow-lg shadow-blue-950/20 transition-all cursor-pointer ring-1 ring-blue-100"
          title="Cliquez pour modifier votre profil"
        >
          {/* Avatar Picture */}
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 border-2 border-blue-300 flex items-center justify-center overflow-hidden text-xl sm:text-2xl shadow-sm">
              <Avatar avatar={profile.avatar} className="w-full h-full flex items-center justify-center" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-[7px] sm:text-[8px] font-black text-white">
              ✏️
            </span>
          </div>

          {/* Player Name & Tag */}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-blue-700 transition-colors">
                {profile.name}
              </span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-900 text-[9px] sm:text-[10px] font-black rounded uppercase">
                {t.profileTitle}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-0.5">
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
        profile={profile}
        onClose={() => setIsOnlineOpen(false)}
        onPlayOfflineFallback={() => {
          setIsOnlineOpen(false);
          setIsMatchSetupOpen(true);
        }}
        onJoinMatch={(id, pId) => {
          setIsOnlineOpen(false);
          onJoinMatch(id, pId);
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
