import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, User, Bot } from 'lucide-react';
import { AppSettings } from '../SettingsModal';
import { UserProfile } from '../ProfileModal';
import { audioController } from '../../utils/audio';

interface ChessLobbyProps {
  settings: AppSettings;
  profile: UserProfile;
  onStartMatch: (mode: 'hvh' | 'hva', difficulty?: number) => void;
  onBack: () => void;
}

export const ChessLobby: React.FC<ChessLobbyProps> = ({
  settings,
  profile,
  onStartMatch,
  onBack,
}) => {
  const [selectedMode, setSelectedMode] = useState<'hvh' | 'hva'>('hva');
  const [difficulty, setDifficulty] = useState<number>(3); // 1 = Easy, 3 = Medium, 5 = Hard

  const isAr = settings.language === 'ar';

  const handleStart = () => {
    audioController.playButtonClick(settings.soundEffects);
    onStartMatch(selectedMode, selectedMode === 'hva' ? difficulty : undefined);
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="h-[100dvh] w-full bg-[#0F172A] flex flex-col relative overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1E3A8A_0%,_#0F172A_100%)] opacity-85 pointer-events-none" />

      {/* TOP BAR */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between py-4 px-4 sm:px-6 shrink-0">
        <button
          onClick={() => {
            audioController.playButtonClick(settings.soundEffects);
            onBack();
          }}
          className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="font-bold">{isAr ? 'رجوع' : 'Retour'}</span>
        </button>
        <div className="flex items-center gap-2">
           <span className="text-2xl">♟️</span>
           <span className="font-black text-xl text-white">{isAr ? 'شطرنج' : 'Échecs'}</span>
        </div>
        <div className="w-20" /> {/* Spacer */}
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-slate-800/80 border-2 border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm flex flex-col gap-6"
        >
          <h2 className="text-2xl font-black text-white text-center mb-2">
            {isAr ? 'إعدادات اللعبة' : 'Paramètres de Jeu'}
          </h2>

          <div className="flex flex-col gap-4">
            <h3 className="text-blue-200 font-bold text-sm uppercase tracking-wider">
              {isAr ? 'وضع اللعب' : 'Mode de Jeu'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedMode('hvh')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  selectedMode === 'hvh' 
                  ? 'bg-blue-600/30 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  <User className="w-6 h-6" />
                  <User className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm">{isAr ? 'لاعب ضد لاعب' : 'Joueur vs Joueur'}</span>
              </button>
              
              <button
                onClick={() => setSelectedMode('hva')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  selectedMode === 'hva' 
                  ? 'bg-blue-600/30 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="flex gap-2 mb-2">
                  <User className="w-6 h-6" />
                  <Bot className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm">{isAr ? 'لاعب ضد الكمبيوتر' : 'Joueur vs IA'}</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {selectedMode === 'hva' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                <h3 className="text-blue-200 font-bold text-sm uppercase tracking-wider mt-2">
                  {isAr ? 'صعوبة الذكاء الاصطناعي' : 'Difficulté de l\'IA'}
                </h3>
                
                <div className="flex justify-between gap-2">
                  {[
                    { val: 1, label: isAr ? 'سهل' : 'Facile' },
                    { val: 3, label: isAr ? 'متوسط' : 'Moyen' },
                    { val: 5, label: isAr ? 'صعب' : 'Difficile' },
                  ].map((d) => (
                    <button
                      key={d.val}
                      onClick={() => setDifficulty(d.val)}
                      className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                        difficulty === d.val
                        ? 'bg-green-600/30 border-green-400 text-white shadow-[0_0_15px_rgba(74,222,128,0.2)]'
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleStart}
            className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6 fill-current" />
            {isAr ? 'ابدأ اللعب' : 'Commencer'}
          </button>
        </motion.div>
      </main>
    </div>
  );
};
