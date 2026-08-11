/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Language, getTranslation } from '../translations';
import { multiplayerService } from '../../services/multiplayerService';
import { UserProfile } from './ProfileModal';
import { supabase } from '../../lib/supabase';

interface OnlinePlayModalProps {
  isOpen: boolean;
  language: Language;
  profile: UserProfile;
  onClose: () => void;
  onPlayOfflineFallback: () => void;
  onJoinMatch: (matchId: string, playerId: string) => void;
}

export const OnlinePlayModal: React.FC<OnlinePlayModalProps> = ({
  isOpen,
  language,
  profile,
  onClose,
  onPlayOfflineFallback,
  onJoinMatch,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = getTranslation(language);

  const generateUserId = () => {
    let id = localStorage.getItem('mostaganem_user_id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('mostaganem_user_id', id);
    }
    return id;
  };

  const handleCreateRoom = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const userId = generateUserId();
      const { match, player } = await multiplayerService.createMatch(userId, profile.name, profile.avatar);
      onJoinMatch(match.id, player.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode) return;
    setIsConnecting(true);
    setError(null);
    try {
      const userId = generateUserId();
      const { match, player } = await multiplayerService.joinMatch(roomCode, userId, profile.name, profile.avatar);
      onJoinMatch(match.id, player.id);
    } catch (err: any) {
      setError(err.message || t.invalidRoomCode);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-blue-400/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative text-center overflow-hidden">
        {/* Decorative Online Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-blue-50 border-2 border-blue-300 flex items-center justify-center text-4xl shadow-xl shadow-blue-500/10 relative">
          🌐
          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-md uppercase">
            V2 Online
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="font-serif italic font-extrabold text-2xl text-white">
            {t.onlineTitle}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${supabase ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {supabase ? 'Serveur Connecté' : 'Vérification...'}
            </p>
          </div>
          <p className="text-xs text-blue-200 leading-relaxed max-w-sm mx-auto">
            {supabase ? t.onlineDesc : 'Veuillez configurer vos clés Supabase dans les paramètres.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-[10px] font-bold uppercase tracking-wider">
            ⚠️ {error}
          </div>
        )}

        {/* Online Actions */}
        <div className="space-y-4 text-left">
          <div className="space-y-2">
            <button
              type="button"
              disabled={isConnecting}
              onClick={handleCreateRoom}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer border-2 border-blue-400 flex items-center justify-center gap-2"
            >
              {isConnecting ? '...' : `✨ ${t.createRoom}`}
            </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">OU</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder={t.enterRoomCode}
              maxLength={6}
              className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-3 text-white text-center font-mono text-xl tracking-[0.2em] focus:border-blue-500 outline-none transition-colors"
            />
            <button
              type="button"
              disabled={isConnecting || roomCode.length < 4}
              onClick={handleJoinRoom}
              className="w-full py-3 bg-white hover:bg-blue-50 disabled:bg-slate-300 text-blue-900 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer border-2 border-blue-200"
            >
              {isConnecting ? '...' : `🤝 ${t.joinRoom}`}
            </button>
          </div>
        </div>

        {/* Actions - Bottom */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onPlayOfflineFallback();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer border border-slate-700"
          >
            🤖 {t.playOffline}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
