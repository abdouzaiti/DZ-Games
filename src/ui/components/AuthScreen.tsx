import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { authService, UserAccount } from '../../services/authService';

interface AuthScreenProps {
  onAuthenticated: (account: UserAccount) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for saved session
  useEffect(() => {
    const saved = localStorage.getItem('mgc_user');
    if (saved) {
      try {
        const account = JSON.parse(saved);
        onAuthenticated(account);
      } catch (e) {
        localStorage.removeItem('mgc_user');
      }
    }
  }, [onAuthenticated]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const account = await authService.login(username, password);
      localStorage.setItem('mgc_user', JSON.stringify(account));
      onAuthenticated(account);
    } catch (err: any) {
      if (err.message === 'PASSWORD_REQUIRED') {
        setShowPassword(true);
        setError('Ce compte est sécurisé par un mot de passe.');
      } else if (err.message === 'INVALID_PASSWORD') {
        setError('Mot de passe incorrect.');
      } else {
        setError(err.message || 'Une erreur est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1E3A8A_0%,_#0F172A_100%)] opacity-80 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-slate-800/50 backdrop-blur-xl border-2 border-blue-400/30 rounded-3xl p-8 shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <img
            src="/mgc.png"
            alt="MGC Logo"
            className="w-32 h-32 mx-auto object-contain drop-shadow-xl"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-3xl font-serif italic font-black text-white">Mosta Games Club</h1>
          <p className="text-blue-300 text-sm">Entrez votre nom pour rejoindre le café</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-blue-400 ml-1">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Amine75"
                disabled={loading}
                className="w-full bg-slate-900/50 border-2 border-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-all disabled:opacity-50"
                required
              />
            </div>

            <AnimatePresence>
              {showPassword && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-xs font-bold uppercase tracking-widest text-blue-400 ml-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full bg-slate-900/50 border-2 border-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-2xl px-5 py-4 text-white font-bold outline-none transition-all"
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center font-medium"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-4 bg-white hover:bg-blue-50 text-blue-950 font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-blue-950/20 border-t-blue-950 rounded-full animate-spin" />
            ) : (
              <>
                <span>{showPassword ? 'Se connecter' : 'Rejoindre'}</span>
                <span className="text-xl">➔</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-slate-500 text-[10px] uppercase tracking-widest">
          En continuant, vous créez ou rejoignez un profil MGC
        </p>
      </motion.div>
    </div>
  );
};
