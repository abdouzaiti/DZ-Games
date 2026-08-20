import React from 'react';
import { motion } from 'motion/react';
import { UserProfile } from './ProfileModal';
import { AppSettings } from './SettingsModal';

interface GamesHubProps {
  profile: UserProfile;
  settings: AppSettings;
  onSelectGame: (gameId: 'domino' | 'chess' | 'ludo') => void;
  onLogout: () => void;
}

export const GamesHub: React.FC<GamesHubProps> = ({ profile, settings, onSelectGame, onLogout }) => {
  const isAr = settings.language === 'ar';

  const games = [
    {
      id: 'domino' as const,
      title: isAr ? 'دومينو' : 'Domino',
      description: isAr ? 'العب الدومينو ضد الذكاء الاصطناعي أو أصدقائك.' : 'Jouez aux dominos contre l\'IA ou vos amis.',
      icon: '🀄',
      status: 'active',
    },
    {
      id: 'chess' as const,
      title: isAr ? 'شطرنج' : 'Chess',
      description: isAr ? 'قيد التطوير...' : 'En développement...',
      icon: '♟️',
      status: 'development',
    },
    {
      id: 'ludo' as const,
      title: isAr ? 'لودو' : 'Ludo',
      description: isAr ? 'قيد التطوير...' : 'En développement...',
      icon: '🎲',
      status: 'development',
    },
  ];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="h-[100dvh] w-full bg-[#0F172A] flex flex-col relative overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1E3A8A_0%,_#0F172A_100%)] opacity-85 pointer-events-none" />

      {/* TOP BAR HEADER */}
      <header className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-3 items-center py-4 px-4 sm:px-6 shrink-0">
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
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-900/50 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">{isAr ? 'خروج' : 'Déconnexion'}</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
        
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-900/40 border-2 border-blue-400 text-3xl mb-4 shadow-lg shadow-blue-900/50">
            {profile.avatar || '👤'}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 tracking-wide">
            {isAr ? `مرحباً، ${profile.name}` : `Bienvenue, ${profile.name}`}
          </h1>
          <p className="text-sm sm:text-base text-blue-200">
            {isAr ? 'اختر اللعبة التي تريد لعبها' : 'Choisissez le jeu auquel vous souhaitez jouer'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
          {games.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => game.status === 'active' ? onSelectGame(game.id) : null}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center transition-all ${
                game.status === 'active'
                  ? 'bg-slate-800/80 border-2 border-blue-400/40 hover:border-blue-300 hover:bg-slate-800 hover:-translate-y-2 cursor-pointer shadow-[0_8px_30px_rgba(30,58,138,0.2)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.3)]'
                  : 'bg-slate-900/60 border-2 border-slate-700/50 opacity-70 cursor-not-allowed grayscale-[30%]'
              }`}
            >
              <div className="text-5xl sm:text-6xl mb-4 drop-shadow-lg">
                {game.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">
                {game.description}
              </p>
              
              {game.status === 'development' ? (
                <div className="mt-auto inline-block px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-700">
                  {isAr ? 'قيد التطوير' : 'En Dév.'}
                </div>
              ) : (
                <div className="mt-auto inline-block px-4 py-1.5 bg-blue-600/20 text-blue-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                  {isAr ? 'العب الآن' : 'Jouer'}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};
