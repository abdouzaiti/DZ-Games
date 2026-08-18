/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Language, getTranslation } from '../translations';
import { authService, UserAccount } from '../../services/authService';
import { Avatar } from './Avatar';

export interface UserProfile {
  id?: string;
  name: string;
  avatar: string;
  hasPassword?: boolean;
}

export const AVATAR_OPTIONS = [
  { id: 'algeria', icon: '🇩🇿', label: 'Dz' },
  { id: 'cafe', icon: '☕', label: 'Café' },
  { id: 'king', icon: '👑', label: 'Roi' },
  { id: 'lion', icon: '🦁', label: 'Sbaa' },
  { id: 'domino', icon: '🀁', label: 'Domino' },
  { id: 'chechia', icon: '👳', label: 'Chechia' },
  { id: 'star', icon: '⭐', label: 'Star' },
  { id: 'trophy', icon: '🏆', label: 'Champion' },
  { id: 'player1', icon: '👤', label: 'Classic' },
  { id: 'ninja', icon: '🥷', label: 'Ninja' },
];

interface ProfileModalProps {
  isOpen: boolean;
  profile: UserProfile;
  language: Language;
  onSaveProfile: (newProfile: UserProfile) => void;
  onLogout?: () => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  language,
  onSaveProfile,
  onLogout,
  onClose,
}) => {
  const [name, setName] = useState<string>(profile.name);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(profile.avatar);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const t = getTranslation(language);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        const img = new Image();
        img.onload = () => {
          // Resize to a maximum of 160x160 pixels for fast rendering and ultra-low database weight
          const maxSize = 160;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Draw image on canvas
            ctx.drawImage(img, 0, 0, width, height);
            // Export as compressed JPEG (75% quality is visually indistinguishable but extremely lightweight)
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
            setSelectedAvatar(compressedDataUrl);
          } else {
            setSelectedAvatar(event.target.result as string);
          }
        };
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Joueur 1';
    
    // If username changed and we have a backend ID, we should ideally update it in backend too
    if (profile.id && finalName !== profile.name) {
      authService.updateUsername(profile.id, finalName).catch(console.error);
    }
    if (profile.id && selectedAvatar !== profile.avatar) {
      authService.updateAvatar(profile.id, selectedAvatar).catch(console.error);
    }

    onSaveProfile({
      ...profile,
      name: finalName,
      avatar: selectedAvatar,
    });
    onClose();
  };

  const handleUpdatePassword = async () => {
    if (!profile.id || !newPassword.trim()) return;
    setUpdatingPassword(true);
    setPasswordStatus('idle');
    try {
      await authService.updatePassword(profile.id, newPassword);
      setPasswordStatus('success');
      setNewPassword('');
      // Update local profile state to reflect it now has a password
      onSaveProfile({ ...profile, hasPassword: true });
    } catch (err) {
      setPasswordStatus('error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-blue-400/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center overflow-hidden text-2xl shadow-sm">
              <Avatar avatar={selectedAvatar} className="w-full h-full flex items-center justify-center text-2xl" />
            </div>
            <div>
              <h2 className="font-serif italic font-extrabold text-xl text-white">
                {t.profileTitle}
              </h2>
              <p className="text-xs text-blue-300">
                Compte: <span className="text-white font-bold">{profile.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Player Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-blue-300 block">
                {t.playerName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Amine, Karim..."
                maxLength={20}
                className="w-full bg-slate-800 border-2 border-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-2xl px-4 py-3 text-white font-bold text-base outline-none transition-all"
              />
            </div>

            {/* Profile Picture / Avatar Selector */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-300 block">
                  {t.chooseAvatar}
                </label>
                
                {/* Custom Image Upload Dropzone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging 
                      ? 'border-blue-400 bg-blue-500/10 scale-[1.01]' 
                      : 'border-slate-700 bg-slate-800/40 hover:border-blue-400/50 hover:bg-slate-800/60'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <span className="text-2xl">📸</span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Importer votre propre photo</p>
                    <p className="text-[10px] text-slate-400 font-medium">Glissez-déposez ou cliquez pour parcourir</p>
                  </div>
                </div>
              </div>

              {/* Emoji/Character Presets */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
                  Ou choisir un avatar classique
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AVATAR_OPTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedAvatar(item.icon)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        selectedAvatar === item.icon
                          ? 'bg-white text-blue-950 border-2 border-blue-400 ring-2 ring-blue-300/50 scale-105 shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-400/50'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-[9px] text-blue-300 font-semibold truncate max-w-full">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-white hover:bg-blue-50 text-blue-950 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg border-2 border-blue-300 transition-all cursor-pointer"
            >
              {t.save}
            </button>
          </form>

          {/* Security Section */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Sécurité du compte</h3>
            
            <div className="space-y-3 bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
              <label className="text-xs font-bold text-blue-300 block">
                {profile.hasPassword ? 'Changer le mot de passe' : 'Protéger par un mot de passe'}
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword || !newPassword.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  {updatingPassword ? '...' : 'Valider'}
                </button>
              </div>
              {passwordStatus === 'success' && <p className="text-[10px] text-green-400 font-bold">✓ Mot de passe mis à jour !</p>}
              {passwordStatus === 'error' && <p className="text-[10px] text-red-400 font-bold">✕ Échec de la mise à jour.</p>}
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-3 text-red-400 hover:bg-red-500/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
              >
                Se déconnecter
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

