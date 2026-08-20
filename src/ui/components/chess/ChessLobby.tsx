import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, User, Bot, Globe, Loader2 } from 'lucide-react';
import { AppSettings } from '../SettingsModal';
import { UserProfile } from '../ProfileModal';
import { audioController } from '../../utils/audio';
import { multiplayerService } from '../../../services/multiplayerService';
import { supabase } from '../../../lib/supabase';

interface ChessLobbyProps {
  settings: AppSettings;
  profile: UserProfile;
  onStartMatch: (
    mode: 'hvh' | 'hva' | 'online',
    difficulty?: number,
    onlineParams?: { matchId: string; myPlayerId: string; isHost: boolean }
  ) => void;
  onBack: () => void;
}

export const ChessLobby: React.FC<ChessLobbyProps> = ({
  settings,
  profile,
  onStartMatch,
  onBack,
}) => {
  const [selectedMode, setSelectedMode] = useState<'hvh' | 'hva' | 'online'>('hva');
  const [difficulty, setDifficulty] = useState<number>(3); // 1 = Easy, 3 = Medium, 5 = Hard
  const [roomCode, setRoomCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAr = settings.language === 'ar';

  const generateUserId = () => {
    let id = localStorage.getItem('mostaganem_user_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('mostaganem_user_id', id);
    }
    return id;
  };

  const handleStart = async () => {
    audioController.playButtonClick(settings.soundEffects);
    if (selectedMode === 'online') {
      // Handled separately below
      return;
    }
    onStartMatch(selectedMode, selectedMode === 'hva' ? difficulty : undefined);
  };

  const handleCreateOnlineRoom = async () => {
    if (!supabase) {
      setError(isAr ? 'الرجاء تهيئة الاتصال بالخادم أولاً.' : 'Veuillez configurer la connexion au serveur dans les paramètres d\'abord.');
      return;
    }
    setIsConnecting(true);
    setError(null);
    audioController.playButtonClick(settings.soundEffects);
    try {
      const userId = generateUserId();
      const { match, player } = await multiplayerService.createMatch(userId, profile.name, profile.avatar, 'chess');
      onStartMatch('online', undefined, { matchId: match.id, myPlayerId: player.id, isHost: true });
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoinOnlineRoom = async () => {
    if (!supabase) {
      setError(isAr ? 'الرجاء تهيئة الاتصال بالخادم أولاً.' : 'Veuillez configurer la connexion au serveur.');
      return;
    }
    if (!roomCode) return;
    setIsConnecting(true);
    setError(null);
    audioController.playButtonClick(settings.soundEffects);
    try {
      const userId = generateUserId();
      const { match, player } = await multiplayerService.joinMatch(roomCode, userId, profile.name, profile.avatar);
      onStartMatch('online', undefined, { matchId: match.id, myPlayerId: player.id, isHost: false });
    } catch (err: any) {
      setError(err.message || (isAr ? 'رمز الغرفة غير صالح' : 'Code de salon invalide'));
    } finally {
      setIsConnecting(false);
    }
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
           <span className="font-black text-xl text-white">{isAr ? 'شطرنج أونلاين' : 'Échecs En Ligne'}</span>
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
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedMode('hvh')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                  selectedMode === 'hvh' 
                  ? 'bg-blue-600/30 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="flex gap-0.5 mb-2">
                  <User className="w-5 h-5" />
                  <User className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs truncate max-w-full">{isAr ? 'محلي' : 'Local'}</span>
              </button>
              
              <button
                onClick={() => setSelectedMode('hva')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                  selectedMode === 'hva' 
                  ? 'bg-blue-600/30 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  <User className="w-5 h-5" />
                  <Bot className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs truncate max-w-full">{isAr ? 'كمبيوتر' : 'IA'}</span>
              </button>

              <button
                onClick={() => setSelectedMode('online')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                  selectedMode === 'online' 
                  ? 'bg-blue-600/30 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs truncate max-w-full">{isAr ? 'أونلاين' : 'En Ligne'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-xs font-bold text-center">
              ⚠️ {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {selectedMode === 'hva' && (
              <motion.div
                key="difficulty-selector"
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

                <button
                  onClick={handleStart}
                  className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-6 h-6 fill-current" />
                  {isAr ? 'ابدأ اللعب' : 'Commencer'}
                </button>
              </motion.div>
            )}

            {selectedMode === 'hvh' && (
              <motion.div
                key="local-play"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <button
                  onClick={handleStart}
                  className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-6 h-6 fill-current" />
                  {isAr ? 'ابدأ اللعب المحلي' : 'Commencer Local'}
                </button>
              </motion.div>
            )}

            {selectedMode === 'online' && (
              <motion.div
                key="online-play"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                <div className="space-y-3">
                  <button
                    onClick={handleCreateOnlineRoom}
                    disabled={isConnecting}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black text-md uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      '✨ ' + (isAr ? 'إنشاء غرفة جديدة' : 'Créer un salon')
                    )}
                  </button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-700"></div>
                    <span className="flex-shrink mx-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {isAr ? 'أو' : 'OU'}
                    </span>
                    <div className="flex-grow border-t border-slate-700"></div>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder={isAr ? 'أدخل رمز الغرفة' : 'Entrez le code'}
                      maxLength={6}
                      className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-4 py-3 text-white text-center font-mono text-xl tracking-[0.2em] focus:border-blue-500 outline-none transition-colors"
                    />
                    <button
                      onClick={handleJoinOnlineRoom}
                      disabled={isConnecting || roomCode.length < 4}
                      className="w-full py-4 bg-white hover:bg-blue-50 disabled:bg-slate-700 disabled:text-slate-500 text-blue-900 font-black text-md uppercase tracking-wider rounded-2xl shadow-lg transition-all"
                    >
                      {isConnecting ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        '🤝 ' + (isAr ? 'انضمام إلى الغرفة' : 'Rejoindre le salon')
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};
