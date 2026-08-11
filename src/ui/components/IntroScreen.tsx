/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface IntroScreenProps {
  onEnter: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onEnter }) => {
  // Allow pressing "Enter" key to start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col justify-between overflow-hidden h-[100dvh] w-full p-4 sm:p-6 selection:bg-blue-500 selection:text-white">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1E3A8A_0%,_#0F172A_100%)] opacity-80 pointer-events-none" />

      {/* Main Hero Card */}
      <main className="relative z-10 w-full max-w-2xl mx-auto my-auto flex-1 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6">
        {/* Animated Icon & Title */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center space-y-3"
        >
          <div className="relative">
            <img
              src="/mgc.png"
              alt="MOSTA GAMES CLUB Logo"
              className="w-36 h-36 sm:w-56 sm:h-56 max-h-[30vh] object-contain filter drop-shadow-[0_10px_20px_rgba(59,130,246,0.3)]"
              referrerPolicy="no-referrer"
            />
          </div>

          <p className="text-xs sm:text-sm text-blue-200 font-medium max-w-md px-2 leading-relaxed">
            Experience authentic Algerian café domino rules with smart AI opponents, interactive snake table layouts, and classic scoring.
          </p>
        </motion.div>

        {/* Enter Trigger CTA - WHITE TRIGGER */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center pt-2"
        >
          <button
            type="button"
            onClick={onEnter}
            className="group px-6 py-3.5 sm:px-8 sm:py-4 bg-white hover:bg-blue-50 active:scale-95 text-blue-950 font-extrabold text-sm sm:text-base uppercase tracking-wider rounded-2xl shadow-2xl shadow-blue-500/25 border-2 border-blue-200 flex items-center gap-2.5 cursor-pointer transition-all hover:border-blue-300"
          >
            <span>Enter Café & Play</span>
            <span className="text-lg sm:text-xl text-blue-600 transition-transform group-hover:translate-x-1">➔</span>
          </button>
        </motion.div>
      </main>
    </div>
  );
};
