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
    <div className="fixed inset-0 z-50 bg-[#1B1410] text-[#FEFAE0] flex flex-col justify-between overflow-y-auto selection:bg-[#D4A373] selection:text-[#1B1410] p-4 sm:p-8">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#3D322A_0%,_#1B1410_100%)] opacity-80 pointer-events-none" />
      <div className="absolute inset-6 border border-dashed border-[#D4A373]/20 rounded-3xl pointer-events-none" />

      {/* Top Header Branding */}
      <header className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#D4A373] flex items-center justify-center font-black text-[#1B1410] text-lg shadow-md">
            🀁
          </div>
          <span className="font-serif italic font-bold text-sm tracking-wide text-[#D4A373]">
            Café Mostaganem 🇩🇿
          </span>
        </div>
      </header>

      {/* Main Hero Card */}
      <main className="relative z-10 w-full max-w-3xl mx-auto my-auto py-8 flex flex-col items-center text-center space-y-6 sm:space-y-8">
        {/* Animated Icon & Title */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center space-y-3"
        >
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#2D241E] border-2 border-[#D4A373] flex items-center justify-center text-4xl sm:text-5xl shadow-2xl shadow-[#D4A373]/20">
              🀁
            </div>
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-[#CCD5AE] text-[#1B1410] text-[10px] font-black rounded-md uppercase tracking-wider shadow">
              V1 Offline
            </span>
          </div>

          <h1 className="font-serif italic font-extrabold text-3xl sm:text-5xl text-[#FEFAE0] tracking-tight leading-tight max-w-xl">
            Mostaganem Dominoes
          </h1>
          <p className="text-sm sm:text-base text-[#D4A373] font-medium max-w-lg">
            Experience authentic Algerian café domino rules with smart AI opponents, interactive snake table layouts, and classic scoring.
          </p>
        </motion.div>



        {/* Enter Trigger CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center space-y-3 pt-2"
        >
          <button
            type="button"
            onClick={onEnter}
            className="group px-8 py-4 bg-[#D4A373] hover:bg-[#A98467] active:scale-95 text-[#1B1410] font-extrabold text-base uppercase tracking-wider rounded-2xl shadow-2xl shadow-[#D4A373]/30 border-2 border-[#FEFAE0] flex items-center gap-3 cursor-pointer transition-all"
          >
            <span>Enter Café & Play</span>
            <span className="text-xl transition-transform group-hover:translate-x-1">➔</span>
          </button>
        </motion.div>
      </main>
    </div>
  );
};
