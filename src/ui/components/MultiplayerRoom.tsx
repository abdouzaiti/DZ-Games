import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, User, CheckCircle2, Play, ArrowLeft, Loader2 } from 'lucide-react';
import { multiplayerService, MatchRoom, PlayerSession } from '../../services/multiplayerService';
import { GameSnapshot } from '../../domain/gameState';
import { GameAction } from '../../domain/actions';
import { GameEngine } from '../../engine/game/gameEngine';
import { getDefaultConfig } from '../../domain/gameConfig';
import { Language, getTranslation } from '../translations';
import { UserProfile } from './ProfileModal';
import { AppSettings } from './SettingsModal';
import { GameBoard } from './GameBoard';
import { ScoreBoard } from './ScoreBoard';
import { PlayerRack } from './PlayerRack';
import { GameStock } from './GameStock';
import { TileShuffler } from './TileShuffler';
import { audioController } from '../utils/audio';
import { TurnManager } from '../../engine/turn/turnManager';
import { Tile } from '../../domain/tile';
import { MostaganemRulesEngine } from '../../engine/rules/mostaganemRules';
import { PlacementEnd } from '../../domain/board';

interface MultiplayerRoomProps {
  matchId: string;
  myPlayerId: string;
  settings: AppSettings;
  profile: UserProfile;
  onExit: () => void;
}

export const MultiplayerRoom: React.FC<MultiplayerRoomProps> = ({
  matchId,
  myPlayerId,
  settings,
  profile,
  onExit,
}) => {
  const [match, setMatch] = useState<MatchRoom | null>(null);
  const [players, setPlayers] = useState<PlayerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const t = getTranslation(settings.language);

  // Initialize engine locally to calculate valid moves etc.
  // Note: We sync the WHOLE snapshot via Supabase game_state.
  const engine = useMemo(() => new GameEngine(getDefaultConfig('1v1')), []);

  useEffect(() => {
    let matchSub: any;
    let playersSub: any;

    const init = async (retries = 3) => {
      try {
        setLoading(true);
        setError(null);

        // Fetch initial state
        const initialMatch = await multiplayerService.getMatch(matchId);
        const initialPlayers = await multiplayerService.getPlayers(matchId);
        
        if (!initialMatch) {
          if (retries > 0) {
            console.log(`Match not found, retrying... (${retries} attempts left)`);
            setTimeout(() => init(retries - 1), 1000);
            return;
          }
          throw new Error("Cette salle n'existe plus.");
        }

        setMatch(initialMatch);
        setPlayers(initialPlayers);

        // Subscribe to changes
        matchSub = multiplayerService.subscribeToMatch(matchId, (updatedMatch) => {
          setMatch(updatedMatch);
        });
        playersSub = multiplayerService.subscribeToPlayers(matchId, (updatedPlayers) => {
          setPlayers(updatedPlayers);
        });

        setLoading(false);
      } catch (err: any) {
        console.error('Failed to join multiplayer room', err);
        setError(err.message || "Erreur de connexion au serveur.");
        setLoading(false);
      }
    };

    init();

    return () => {
      if (matchSub) matchSub.unsubscribe();
      if (playersSub) playersSub.unsubscribe();
    };
  }, [matchId, onExit]);

  const me = players.find(p => p.id === myPlayerId);
  const isHost = match?.host_id === me?.user_id;
  const snapshot = match?.game_state;

  const handleStartGame = async () => {
    if (!isHost) return;
    
    // Config based on player count
    const mode = players.length === 4 ? '4player_ffa' : players.length === 3 ? '3player_ffa' : '1v1';
    const config = getDefaultConfig(mode);
    
    // Build initial state with real players
    const aiFlags = players.map(() => false);
    const playerNames = players.map(p => p.name);
    
    engine.dispatch({
      type: 'START_MATCH',
      config,
      playerNames,
      aiFlags
    });

    const initialState = engine.getSnapshot();
    await multiplayerService.startMatch(matchId, initialState);
    setIsShuffling(true);
  };

  const handleAction = async (action: GameAction) => {
    if (!snapshot) return;
    
    // We update the local engine, get new snapshot, then push to Supabase
    // This is "optimistic" and then synced
    engine.dispatch(action);
    const newSnapshot = engine.getSnapshot();
    await multiplayerService.updateGameState(matchId, newSnapshot);
  };

  // Sync local engine with incoming snapshots from Supabase
  useEffect(() => {
    if (snapshot) {
      // Internal hack to set engine state
      // (Normally we'd have a setSnapshot method)
      (engine as any).snapshot = snapshot;
      (engine as any).notifyListeners();
    }
  }, [snapshot, engine]);

  if (error) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">!</div>
        </div>
        <div className="space-y-2">
          <h2 className="text-white font-serif italic text-xl font-black">Oups ! Problème de connexion</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            {error}
          </p>
        </div>
        <button 
          onClick={onExit}
          className="px-8 py-3 bg-white text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-50 transition-colors"
        >
          Retour au menu
        </button>
      </div>
    );
  }

  if (loading || !match) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-blue-200 font-bold text-sm uppercase tracking-widest animate-pulse">
          Connection au café...
        </p>
      </div>
    );
  }

  // --- LOBBY VIEW ---
  if (match.status === 'lobby') {
    return (
      <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-6 space-y-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#1E3A8A_0%,_#0F172A_100%)] opacity-50" />
        
        <header className="relative z-10 w-full max-w-md flex items-center justify-between">
           <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
             <ArrowLeft className="text-white" />
           </button>
           <h1 className="text-white font-serif italic text-xl font-black">Lobby Multijoueur</h1>
           <div className="w-10" />
        </header>

        <div className="relative z-10 w-full max-w-md bg-slate-800/50 backdrop-blur-md border-2 border-slate-700 p-8 rounded-3xl shadow-2xl space-y-6 text-center">
          <div className="space-y-1">
            <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest">Code de la salle</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-mono font-black text-white tracking-widest">{match.code}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(match.code);
                  setNotification("Code copié !");
                  setTimeout(() => setNotification(null), 2000);
                }}
                className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.playersConnected}</span>
               <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{players.length} / 4</span>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               {players.map((p) => (
                 <motion.div 
                   key={p.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                     p.id === myPlayerId ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900 border-slate-700'
                   }`}
                 >
                   <div className="text-2xl">{p.avatar}</div>
                   <div className="text-[10px] font-black text-white truncate max-w-[80px]">{p.name}</div>
                   {p.is_ready ? (
                     <CheckCircle2 className="w-4 h-4 text-green-400" />
                   ) : (
                     <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                   )}
                 </motion.div>
               ))}
               {Array.from({ length: 4 - players.length }).map((_, i) => (
                 <div key={i} className="p-3 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center opacity-40">
                   <User className="w-5 h-5 text-slate-500" />
                 </div>
               ))}
             </div>
          </div>

          <div className="pt-4">
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={players.length < 2}
                className="w-full py-4 bg-white hover:bg-blue-50 disabled:bg-slate-700 disabled:text-slate-500 text-blue-900 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play fill="currentColor" size={16} />
                {t.startGame}
              </button>
            ) : (
              <div className="text-[10px] font-bold text-blue-300 uppercase animate-pulse">
                {t.waitingForPlayers}
              </div>
            )}
          </div>
        </div>

        {notification && (
           <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-10 px-4 py-2 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase shadow-lg"
           >
             {notification}
           </motion.div>
        )}
      </div>
    );
  }

  // --- GAME VIEW ---
  if (!snapshot) return null;

  const myIndex = me?.slot_index || 0;
  const isMyTurn = snapshot.currentPlayerIndex === myIndex && snapshot.roundStatus === 'PLAYING';
  const myPlayer = snapshot.players[myIndex];

  const handleTileSelect = (tile: Tile) => {
    if (!isMyTurn) return;
    const move = MostaganemRulesEngine.getValidMoves(myPlayer.hand, snapshot.board, snapshot.requiredOpeningTileId).find(m => m.tile.id === tile.id);
    if (!move) return;

    audioController.playTileClick(settings.soundEffects);
    
    if (snapshot.board.chain.length === 0 || move.validEnds.length === 1) {
      handleAction({
        type: 'PLAY_TILE',
        playerId: myPlayer.id,
        tileId: tile.id,
        end: move.validEnds[0] || 'LEFT'
      });
      setSelectedTile(null);
    } else {
      setSelectedTile(tile);
    }
  };

  const handlePlaceTile = (end: PlacementEnd) => {
    if (!selectedTile || !isMyTurn) return;
    handleAction({
      type: 'PLAY_TILE',
      playerId: myPlayer.id,
      tileId: selectedTile.id,
      end
    });
    setSelectedTile(null);
  };

  const validEndsForSelectedTile = selectedTile ? 
    MostaganemRulesEngine.getValidMoves(myPlayer.hand, snapshot.board, snapshot.requiredOpeningTileId)
      .find(m => m.tile.id === selectedTile.id)?.validEnds || [] 
    : [];

  const playableTileIds = MostaganemRulesEngine.getValidMoves(myPlayer.hand, snapshot.board, snapshot.requiredOpeningTileId).map(m => m.tile.id);
  const canDraw = isMyTurn && MostaganemRulesEngine.canPlayerDraw(myPlayer.hand, snapshot.board, snapshot.stock.length);
  const canPass = isMyTurn && MostaganemRulesEngine.canPlayerPass(myPlayer.hand, snapshot.board, snapshot.stock.length);

  return (
    <div className="h-[100dvh] w-full bg-slate-900 text-slate-100 flex flex-col font-sans overflow-hidden">
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto p-2 sm:p-4 flex flex-col justify-between overflow-hidden">
        <ScoreBoard
          snapshot={snapshot}
          userAvatar={profile.avatar}
          language={settings.language}
          onBackToLobby={onExit}
          onOpenProfile={() => {}}
          onOpenSettings={() => {}}
          onNewMatch={() => {}}
          isMultiplayer
        />

        <div className="relative flex-1 w-full flex flex-col justify-center overflow-hidden my-1">
          <GameBoard
            board={snapshot.board}
            selectedTileId={selectedTile?.id || null}
            validEndsForSelectedTile={validEndsForSelectedTile}
            onPlaceTile={handlePlaceTile}
          />

          {!isShuffling && (
            <GameStock
              stock={snapshot.stock}
              canDraw={canDraw}
              onDraw={() => {
                audioController.playTileClick(settings.soundEffects);
                handleAction({ type: 'DRAW_TILE', playerId: myPlayer.id });
              }}
              language={settings.language}
            />
          )}

          {isShuffling && (
            <div className="absolute inset-0 z-50 flex items-center justify-center">
              <TileShuffler
                language={settings.language}
                soundEffects={settings.soundEffects}
                vibration={settings.vibration}
                playerCount={snapshot.players.length}
                playerNames={snapshot.players.map(p => p.name)}
                playerAvatars={players.map(p => p.avatar)}
                humanHand={myPlayer.hand}
                allPlayersHands={snapshot.players.map(p => p.hand)}
                sachetStock={snapshot.stock}
                onComplete={() => setIsShuffling(false)}
                isHost={isHost}
              />
            </div>
          )}
        </div>

        {!isShuffling && (
          <div className="w-full">
            <PlayerRack
              player={myPlayer}
              userAvatar={profile.avatar}
              isCurrentTurn={isMyTurn}
              selectedTileId={selectedTile?.id || null}
              playableTileIds={playableTileIds}
              canDraw={canDraw}
              canPass={canPass}
              stockCount={snapshot.stock.length}
              onSelectTile={handleTileSelect}
              onPass={() => handleAction({ type: 'PASS_TURN', playerId: myPlayer.id })}
              language={settings.language}
            />
          </div>
        )}
      </main>
    </div>
  );
};
