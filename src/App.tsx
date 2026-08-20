/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameAction } from './domain/actions';
import { PlacementEnd } from './domain/board';
import { GameConfig, getDefaultConfig } from './domain/gameConfig';
import { GameSnapshot } from './domain/gameState';
import { Tile } from './domain/tile';

import { GameEngine } from './engine/game/gameEngine';
import { MostaganemRulesEngine } from './engine/rules/mostaganemRules';
import { TurnManager } from './engine/turn/turnManager';
import { GameBoard } from './ui/components/GameBoard';
import { IntroScreen } from './ui/components/IntroScreen';
import { MainLobby } from './ui/components/MainLobby';
import { GamesHub } from './ui/components/GamesHub';
import { MatchSetupModal } from './ui/components/MatchSetupModal';
import { PlayerRack } from './ui/components/PlayerRack';
import { RoundResultModal } from './ui/components/RoundResultModal';
import { ScoreBoard } from './ui/components/ScoreBoard';
import { SettingsModal, AppSettings } from './ui/components/SettingsModal';
import { ProfileModal, UserProfile } from './ui/components/ProfileModal';
import { TileShuffler } from './ui/components/TileShuffler';
import { GameStock } from './ui/components/GameStock';
import { MultiplayerRoom } from './ui/components/MultiplayerRoom';
import { getTranslation } from './ui/translations';
import { audioController } from './ui/utils/audio';

import { AuthScreen } from './ui/components/AuthScreen';
import { UserAccount } from './services/authService';

import { ChessLobby } from './ui/components/chess/ChessLobby';
import { ChessGameUI } from './ui/components/chess/ChessGameUI';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [account, setAccount] = useState<UserAccount | null>(null);

  // Singleton instance of pure GameEngine
  const engine = useMemo(() => new GameEngine(getDefaultConfig('1v1')), []);

  const [activeView, setActiveView] = useState<'hub' | 'lobby' | 'game' | 'multiplayer' | 'chess_lobby' | 'chess_game'>('hub');
  const [matchId, setMatchId] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  // Chess specific state
  const [chessMode, setChessMode] = useState<'hvh' | 'hva'>('hva');
  const [chessDifficulty, setChessDifficulty] = useState<number>(3);

  // App Settings & User Profile State (with LocalStorage persistence)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('mostaganem_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback default
    }
    return {
      music: true,
      soundEffects: true,
      vibration: true,
      language: 'fr',
    };
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('mostaganem_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback default
    }
    return {
      name: 'Karim',
      avatar: '🇩🇿',
    };
  });

  const handleAuthenticated = (acc: UserAccount) => {
    setAccount(acc);
    setProfile({
      id: acc.id,
      name: acc.username,
      avatar: acc.avatar,
      hasPassword: acc.has_password,
    });
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('mgc_user');
    setIsAuthenticated(false);
    setAccount(null);
    setActiveView('hub');
  };

  const [snapshot, setSnapshot] = useState<GameSnapshot>(engine.getSnapshot());
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSettingsOpenInGame, setIsSettingsOpenInGame] = useState<boolean>(false);
  const [isProfileOpenInGame, setIsProfileOpenInGame] = useState<boolean>(false);
  const [isMatchSetupOpenInGame, setIsMatchSetupOpenInGame] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const prevHandLength = React.useRef<number>(0);

  const triggerNotification = (message: string) => {
    setNotification(message);
    audioController.triggerVibration(settings.vibration, 80);
    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      setNotification((prev) => (prev === message ? null : prev));
    }, 3500);
  };

  const t = getTranslation(settings.language);

  // Save settings & profile to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('mostaganem_settings', JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('mostaganem_profile', JSON.stringify(profile));
    } catch {
      // Ignore storage errors
    }
  }, [profile]);

  // Subscribe to pure GameEngine state changes
  useEffect(() => {
    const unsubscribe = engine.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
      if (newSnapshot.lastActionDescription) {
        setLogs((prev) => [...prev, newSnapshot.lastActionDescription!]);
      }
    });
    return () => unsubscribe();
  }, [engine]);

  // Handle AI turn automatically after short delay for café feel
  useEffect(() => {
    if (snapshot.roundStatus !== 'PLAYING') return;

    const activePlayer = TurnManager.getActivePlayer(snapshot.players, snapshot.currentPlayerIndex);
    if (activePlayer.isAI) {
      const timer = setTimeout(() => {
        engine.dispatch({ type: 'AI_STEP' });
        if (settings.soundEffects) {
          audioController.playTileClick(true);
        }
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [snapshot.roundStatus, snapshot.currentPlayerIndex, snapshot.players, engine, settings.soundEffects]);

  // Dispatch helper
  const handleDispatch = (action: GameAction) => {
    setSelectedTile(null);
    engine.dispatch(action);
  };

  const humanPlayer = snapshot.players[0] || { id: 'p0', name: 'You', hand: [], isHuman: true };
  const activePlayer = TurnManager.getActivePlayer(snapshot.players, snapshot.currentPlayerIndex) || humanPlayer;
  const isHumanTurn = (activePlayer?.id === humanPlayer?.id) && snapshot.roundStatus === 'PLAYING';

  // Compute playable tiles in human player's hand
  const validMoves = useMemo(() => {
    if (!isHumanTurn) return [];
    return MostaganemRulesEngine.getValidMoves(humanPlayer.hand, snapshot.board, snapshot.requiredOpeningTileId);
  }, [isHumanTurn, humanPlayer.hand, snapshot.board, snapshot.requiredOpeningTileId]);

  const playableTileIds = useMemo(() => {
    return validMoves.map((m) => m.tile.id);
  }, [validMoves]);

  // Initialize and track hand length to detect newly drawn tiles
  useEffect(() => {
    if (!humanPlayer) return;
    const currentLen = humanPlayer.hand.length;
    prevHandLength.current = currentLen;
  }, [humanPlayer?.hand]);

  // Compute valid ends for selected tile
  const validEndsForSelectedTile = useMemo((): PlacementEnd[] => {
    if (!selectedTile) return [];
    const move = validMoves.find((m) => m.tile.id === selectedTile.id);
    return move ? move.validEnds : [];
  }, [selectedTile, validMoves]);

  // Check if human player MUST draw or MUST pass
  const canDraw = isHumanTurn && MostaganemRulesEngine.canPlayerDraw(humanPlayer.hand, snapshot.board, snapshot.stock.length);
  const canPass = isHumanTurn && MostaganemRulesEngine.canPlayerPass(humanPlayer.hand, snapshot.board, snapshot.stock.length);

  const handleTileSelect = (tile: Tile) => {
    if (!isHumanTurn) return;

    const move = validMoves.find((m) => m.tile.id === tile.id);

    // If tile is not valid to play in current board state
    if (!move || move.validEnds.length === 0) {
      // Check if trying to start/open with another tile when a required opening tile is active
      if (snapshot.requiredOpeningTileId && tile.id !== snapshot.requiredOpeningTileId) {
        const parts = snapshot.requiredOpeningTileId.split('-');
        const tileLabel = parts.length === 2 ? `[${parts[0]}|${parts[1]}]` : 'Double-Six [6|6]';
        
        const isAr = settings.language === 'ar';
        const msg = isAr
          ? `يجب أن تبدأ بقطعة ${tileLabel} لفتح الجولة!`
          : `Ouverture requise : Vous devez commencer avec le Double ${tileLabel} !`;
          
        triggerNotification(msg);
      }
      return;
    }

    // Play tile audio/vibration feedback
    audioController.playTileClick(settings.soundEffects);
    audioController.triggerVibration(settings.vibration, 30);

    // If table is empty, playing it opens the round
    if (snapshot.board.chain.length === 0) {
      handleDispatch({
        type: 'PLAY_TILE',
        playerId: humanPlayer.id,
        tileId: tile.id,
        end: 'LEFT',
      });
      setSelectedTile(null);
      return;
    }

    // If tile has only ONE valid end to play (LEFT or RIGHT), play it automatically
    if (move.validEnds.length === 1) {
      handleDispatch({
        type: 'PLAY_TILE',
        playerId: humanPlayer.id,
        tileId: tile.id,
        end: move.validEnds[0],
      });
      setSelectedTile(null);
      return;
    }

    // If tile can be played on BOTH sides, select it so user can choose end
    if (selectedTile?.id === tile.id) {
      setSelectedTile(null);
    } else {
      setSelectedTile(tile);
    }
  };

  const handlePlaceTile = (end: PlacementEnd) => {
    if (!selectedTile || !isHumanTurn) return;
    audioController.playTileClick(settings.soundEffects);
    audioController.triggerVibration(settings.vibration, 30);
    handleDispatch({
      type: 'PLAY_TILE',
      playerId: humanPlayer.id,
      tileId: selectedTile.id,
      end,
    });
  };

  const handleStartMatch = (config: GameConfig) => {
    const playerCount = config.mode === '2v2' || config.mode === '4player_ffa' ? 4 : config.mode === '3player_ffa' ? 3 : 2;
    const defaultAiNames = ['Café Master 1', 'Partner AI', 'Café Master 2'];
    const playerNames = [profile.name, ...defaultAiNames.slice(0, playerCount - 1)];
    const playerAvatars = [profile.avatar, '🤖', '🤖', '🤖'].slice(0, playerCount);

    handleDispatch({
      type: 'START_MATCH',
      config,
      playerNames,
      playerAvatars,
    });
    setIsShuffling(true);
    setActiveView('game');
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    // Update player 0 name in active match snapshot if playing
    if (snapshot.players.length > 0) {
      const updatedPlayers = [...snapshot.players];
      updatedPlayers[0] = { ...updatedPlayers[0], name: newProfile.name };
      setSnapshot((prev) => ({ ...prev, players: updatedPlayers }));
    }
  };

  const handleJoinMatch = (id: string, pId: string) => {
    setMatchId(id);
    setMyPlayerId(pId);
    setActiveView('multiplayer');
  };

  // STEP 1: Authentication
  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  // STEP 1.5: Games Hub
  if (activeView === 'hub') {
    return (
      <GamesHub
        profile={profile}
        settings={settings}
        onSelectGame={(gameId) => {
          if (gameId === 'domino') setActiveView('lobby');
          if (gameId === 'chess') setActiveView('chess_lobby');
        }}
        onLogout={handleLogout}
      />
    );
  }

  // CHESS: Lobby
  if (activeView === 'chess_lobby') {
    return (
      <ChessLobby
        profile={profile}
        settings={settings}
        onStartMatch={(mode, difficulty) => {
          setChessMode(mode);
          if (difficulty) setChessDifficulty(difficulty);
          setActiveView('chess_game');
        }}
        onBack={() => setActiveView('hub')}
      />
    );
  }

  // CHESS: Game
  if (activeView === 'chess_game') {
    return (
      <ChessGameUI
        profile={profile}
        settings={settings}
        mode={chessMode}
        difficulty={chessDifficulty}
        onExit={() => setActiveView('chess_lobby')}
      />
    );
  }

  // STEP 2: Main Lobby
  if (activeView === 'lobby') {
    return (
      <MainLobby
        currentConfig={snapshot.config}
        settings={settings}
        profile={profile}
        onUpdateSettings={handleUpdateSettings}
        onUpdateProfile={handleUpdateProfile}
        onStartOfflineMatch={handleStartMatch}
        onJoinMatch={handleJoinMatch}
        onLogout={() => setActiveView('hub')}
      />
    );
  }

  // STEP 2.5: Multiplayer Room
  if (activeView === 'multiplayer' && matchId && myPlayerId) {
    return (
      <MultiplayerRoom
        matchId={matchId}
        myPlayerId={myPlayerId}
        settings={settings}
        profile={profile}
        onExit={() => setActiveView('lobby')}
      />
    );
  }

  // STEP 3: Active Game Table
  return (
    <div
      dir={settings.language === 'ar' ? 'rtl' : 'ltr'}
      className="h-[100dvh] w-full bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden selection:bg-blue-500 selection:text-white"
    >
      {/* Dynamic Toast / Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className="fixed top-6 left-1/2 z-50 px-5 py-3.5 bg-white text-slate-900 rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.4)] flex items-center gap-3 max-w-sm w-[90%] font-extrabold text-xs uppercase tracking-wider select-none border-2 border-blue-300"
          >
            <span className="text-sm">⚠️</span>
            <span className="flex-1 font-sans leading-relaxed text-blue-950">{notification}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-500 hover:text-slate-900 font-black text-[10px] px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Playing Area */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto p-2 sm:p-4 flex flex-col justify-between overflow-hidden">
        {/* Score Board Header with Integrated AI & Player Stats */}
        <ScoreBoard
          snapshot={snapshot}
          userAvatar={profile.avatar}
          language={settings.language}
          onBackToLobby={() => {
            audioController.playButtonClick(settings.soundEffects);
            setActiveView('lobby');
          }}
          onOpenProfile={() => setIsProfileOpenInGame(true)}
          onOpenSettings={() => setIsSettingsOpenInGame(true)}
          onNewMatch={() => setIsMatchSetupOpenInGame(true)}
        />

        {/* Center Game Board Container */}
        <div className="relative flex-1 w-full flex flex-col justify-center overflow-hidden my-1">
          <GameBoard
            board={snapshot.board}
            selectedTileId={selectedTile?.id || null}
            validEndsForSelectedTile={validEndsForSelectedTile}
            onPlaceTile={handlePlaceTile}
          />

          {/* Physical Tile Stock Pile on the Right */}
          {!isShuffling && (
            <GameStock
              stock={snapshot.stock}
              canDraw={canDraw}
              onDraw={() => {
                audioController.playTileClick(settings.soundEffects);
                handleDispatch({ type: 'DRAW_TILE', playerId: humanPlayer.id });
              }}
              language={settings.language}
            />
          )}

          {/* Interactive Manual Shuffle and Tile Pick Overlay */}
          {isShuffling && (
            <div className="absolute inset-0 z-50 flex items-center justify-center">
              <TileShuffler
                language={settings.language}
                soundEffects={settings.soundEffects}
                vibration={settings.vibration}
                playerCount={snapshot.players.length || 2}
                playerNames={snapshot.players.map((p) => p.name)}
                playerAvatars={snapshot.players.map((p) => p.avatar || '🤖')}
                humanHand={humanPlayer?.hand || []}
                allPlayersHands={snapshot.players.map((p) => p.hand)}
                sachetStock={snapshot.stock}
                onComplete={() => setIsShuffling(false)}
              />
            </div>
          )}
        </div>

        {/* Human Player Rack */}
        {!isShuffling && (
          <div className="w-full">
            <PlayerRack
              player={humanPlayer}
              userAvatar={profile.avatar}
              isCurrentTurn={isHumanTurn}
              selectedTileId={selectedTile?.id || null}
              playableTileIds={playableTileIds}
              canDraw={canDraw}
              canPass={canPass}
              stockCount={snapshot.stock.length}
              requiredOpeningTileId={snapshot.requiredOpeningTileId}
              logs={logs}
              onSelectTile={handleTileSelect}
              onPass={() => {
                audioController.playButtonClick(settings.soundEffects);
                handleDispatch({ type: 'PASS_TURN', playerId: humanPlayer.id });
              }}
              language={settings.language}
            />
          </div>
        )}
      </main>

      {/* Modals In Game */}
      <SettingsModal
        isOpen={isSettingsOpenInGame}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClose={() => setIsSettingsOpenInGame(false)}
      />

      <ProfileModal
        isOpen={isProfileOpenInGame}
        profile={profile}
        language={settings.language}
        onSaveProfile={handleUpdateProfile}
        onLogout={handleLogout}
        onClose={() => setIsProfileOpenInGame(false)}
      />

      <MatchSetupModal
        currentConfig={snapshot.config}
        isOpen={isMatchSetupOpenInGame}
        onClose={() => setIsMatchSetupOpenInGame(false)}
        onStartMatch={handleStartMatch}
      />

      <RoundResultModal
        snapshot={snapshot}
        onNextRound={() => {
          handleDispatch({ type: 'START_NEW_ROUND' });
          setIsShuffling(true);
        }}
        onRestartMatch={() => {
          handleDispatch({ type: 'RESTART_MATCH' });
          setIsShuffling(true);
        }}
      />
    </div>
  );
}
