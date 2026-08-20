import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User, Bot, Crown, RotateCcw, Copy, Check, Loader2 } from 'lucide-react';
import { AppSettings } from '../SettingsModal';
import { UserProfile } from '../ProfileModal';
import { audioController } from '../../utils/audio';

import { ChessEngine } from '../../../chess/engine/chessEngine';
import { ChessRulesEngine } from '../../../chess/rules/rulesEngine';
import { ChessGameState } from '../../../chess/state/gameState';
import { ChessAI } from '../../../chess/ai/chessAI';
import { Move } from '../../../chess/moves/move';
import { Position } from '../../../chess/models/position';
import { ChessPieceIcon } from './ChessPieceIcon';
import { PieceType, PieceColor } from '../../../chess/models/piece';

import { multiplayerService, PlayerSession, MatchRoom } from '../../../services/multiplayerService';
import { supabase } from '../../../lib/supabase';
import { Avatar } from '../Avatar';

interface ChessGameUIProps {
  settings: AppSettings;
  profile: UserProfile;
  mode: 'hvh' | 'hva' | 'online';
  difficulty?: number;
  matchId?: string | null;
  myPlayerId?: string | null;
  isHost?: boolean;
  onExit: () => void;
}

export const ChessGameUI: React.FC<ChessGameUIProps> = ({
  settings,
  profile,
  mode,
  difficulty = 3,
  matchId = null,
  myPlayerId = null,
  isHost = false,
  onExit,
}) => {
  const isAr = settings.language === 'ar';
  
  // Offline Game State
  const [gameState, setGameState] = useState<ChessGameState>(() => new ChessEngine().getSnapshot());
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [promotionMove, setPromotionMove] = useState<Move | null>(null);

  // Online Multiplayer States
  const [match, setMatch] = useState<MatchRoom | null>(null);
  const [players, setPlayers] = useState<PlayerSession[]>([]);
  const [loading, setLoading] = useState<boolean>(mode === 'online');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // AI Instance
  const ai = useMemo(() => new ChessAI(difficulty), [difficulty]);

  // Sync with online room if online
  useEffect(() => {
    if (mode !== 'online' || !matchId) return;

    let matchSub: any;
    let playersSub: any;

    const init = async (retries = 3) => {
      try {
        setLoading(true);
        setError(null);

        const initialMatch = await multiplayerService.getMatch(matchId);
        const initialPlayers = await multiplayerService.getPlayers(matchId);

        setMatch(initialMatch);
        setPlayers(initialPlayers);

        if (initialMatch?.game_state) {
          setGameState(initialMatch.game_state as ChessGameState);
        }

        matchSub = multiplayerService.subscribeToMatch(matchId, (updatedMatch) => {
          setMatch(updatedMatch);
          if (updatedMatch.game_state) {
            setGameState(updatedMatch.game_state as ChessGameState);
          }
        });

        playersSub = multiplayerService.subscribeToPlayers(matchId, (updatedPlayers) => {
          setPlayers(updatedPlayers);
        });

        setLoading(false);
      } catch (err: any) {
        console.error('Failed to join online chess room:', err);
        if (retries > 0) {
          setTimeout(() => init(retries - 1), 1000);
        } else {
          setError(err.message || (isAr ? 'خطأ في الاتصال بالخادم.' : 'Erreur de connexion au serveur.'));
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      if (matchSub) matchSub.unsubscribe();
      if (playersSub) playersSub.unsubscribe();
    };
  }, [mode, matchId, isAr]);

  // Derived Player Info
  const myPlayerSession = useMemo(() => {
    if (mode !== 'online') return null;
    return players.find(p => p.id === myPlayerId);
  }, [players, myPlayerId, mode]);

  const opponentPlayerSession = useMemo(() => {
    if (mode !== 'online') return null;
    return players.find(p => p.id !== myPlayerId);
  }, [players, myPlayerId, mode]);

  const myColor: PieceColor = useMemo(() => {
    if (mode !== 'online') return 'white';
    if (!myPlayerSession) return 'white';
    return myPlayerSession.slot_index === 0 ? 'white' : 'black';
  }, [myPlayerSession, mode]);

  const opponentColor: PieceColor = myColor === 'white' ? 'black' : 'white';

  const isMyTurn = useMemo(() => {
    if (gameState.status !== 'active') return false;
    if (mode === 'hvh') return true;
    return gameState.turn === myColor;
  }, [mode, gameState.turn, gameState.status, myColor]);
  
  const legalMovesForSelected = useMemo(() => {
    if (!selectedPos || !isMyTurn || gameState.status !== 'active') return [];
    const allLegalMoves = ChessRulesEngine.getLegalMoves(gameState);
    return allLegalMoves.filter(m => m.from.row === selectedPos.row && m.from.col === selectedPos.col);
  }, [selectedPos, isMyTurn, gameState]);

  // Handle AI Turn (Offline PvE)
  useEffect(() => {
    if (mode === 'hva' && gameState.turn !== myColor && gameState.status === 'active') {
      const timer = setTimeout(() => {
        const bestMove = ai.getBestMove(gameState);
        if (bestMove) {
          executeMove(bestMove);
        }
      }, 500); // slight delay for realism
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, mode, gameState.status, ai, myColor]);

  const executeMove = async (move: Move) => {
    audioController.playTileClick(settings.soundEffects); // Reusing tile sound for move
    const newState = ChessRulesEngine.executeMove(gameState, move);
    
    if (mode === 'online' && matchId) {
      try {
        await multiplayerService.updateGameState(matchId, newState);
      } catch (err) {
        console.error('Failed to upload move state:', err);
      }
    } else {
      setGameState(newState);
    }
    
    setSelectedPos(null);
    setPromotionMove(null);
  };

  const handleSquareClick = (row: number, col: number) => {
    if (!isMyTurn || gameState.status !== 'active' || promotionMove) return;

    const clickedPiece = gameState.board[row][col];
    const isFriendlyPiece = clickedPiece && clickedPiece.color === gameState.turn;

    // If clicking a friendly piece, select it
    if (isFriendlyPiece) {
       setSelectedPos({ row, col });
       audioController.playButtonClick(settings.soundEffects);
       return;
    }

    // If a piece is selected and clicking an empty square or enemy piece
    if (selectedPos) {
       const move = legalMovesForSelected.find(m => m.to.row === row && m.to.col === col);
       if (move) {
         if (move.type === 'promotion' || move.promotionTo) {
           setPromotionMove(move);
         } else {
           executeMove(move);
         }
       } else {
         setSelectedPos(null);
       }
    }
  };

  const handlePromotionSelect = (type: PieceType) => {
    if (promotionMove) {
      const finalMove = { ...promotionMove, promotionTo: type };
      executeMove(finalMove);
    }
  };

  const copyRoomCode = () => {
    if (match?.code) {
      navigator.clipboard.writeText(match.code);
      setCopied(true);
      audioController.playButtonClick(settings.soundEffects);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartOnlineMatch = async () => {
    audioController.playButtonClick(settings.soundEffects);
    const initialEngine = new ChessEngine();
    const initialState = initialEngine.getSnapshot();
    await multiplayerService.startMatch(matchId!, initialState);
  };

  const renderBoard = () => {
    const squares = [];
    const lastMove = gameState.moveHistory.length > 0 ? gameState.moveHistory[gameState.moveHistory.length - 1] : null;

    // Orient board according to player color
    const boardOrientation = myColor === 'white' ? 1 : -1;
    const rowIndices = boardOrientation === 1 ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
    const colIndices = boardOrientation === 1 ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];

    for (const r of rowIndices) {
      for (const c of colIndices) {
        const isLight = (r + c) % 2 === 0;
        const squareColorClass = isLight ? 'bg-slate-300' : 'bg-slate-600';
        
        const piece = gameState.board[r][c];
        const isSelected = selectedPos?.row === r && selectedPos?.col === c;
        const isLegalDest = legalMovesForSelected.some(m => m.to.row === r && m.to.col === c);
        const isLastMoveSquare = lastMove && ((lastMove.from.row === r && lastMove.from.col === c) || (lastMove.to.row === r && lastMove.to.col === c));
        
        const isCheck = piece && piece.type === 'king' && piece.color === gameState.turn && gameState.isCheck;

        squares.push(
          <div
            key={`${r}-${c}`}
            onClick={() => handleSquareClick(r, c)}
            className={`relative flex items-center justify-center w-full aspect-square ${squareColorClass} ${
              isSelected ? 'ring-4 ring-inset ring-yellow-400' : ''
            } ${
              isLastMoveSquare && !isSelected ? 'ring-2 ring-inset ring-blue-400/50' : ''
            } ${
              isCheck ? 'bg-red-500/80 ring-4 ring-inset ring-red-600' : ''
            } cursor-pointer transition-all duration-150`}
          >
            {/* Legal move indicator */}
            {isLegalDest && !piece && (
               <div className="absolute w-1/3 h-1/3 bg-black/20 rounded-full" />
            )}
            {isLegalDest && piece && (
               <div className="absolute w-full h-full border-4 border-black/20 rounded-full scale-90" />
            )}

            {/* Piece */}
            {piece && (
              <motion.div
                initial={false}
                animate={{ scale: isSelected ? 1.15 : 1 }}
                className="w-[85%] h-[85%] z-10"
              >
                <ChessPieceIcon type={piece.type} color={piece.color} className="w-full h-full" />
              </motion.div>
            )}
          </div>
        );
      }
    }
    return squares;
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-[#0F172A] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="font-bold">{isAr ? 'جاري تحميل الغرفة...' : 'Connexion au salon...'}</p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="h-[100dvh] w-full bg-[#0F172A] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-3xl max-w-sm">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-bold mb-2">{isAr ? 'خطأ في الاتصال' : 'Erreur de Connexion'}</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button
            onClick={onExit}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
          >
            {isAr ? 'رجوع' : 'Retour'}
          </button>
        </div>
      </div>
    );
  }

  // 3. Waiting Lobby (Online Mode only, before status is 'playing')
  if (mode === 'online' && match?.status === 'lobby') {
    const hasOpponent = players.length >= 2;
    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="h-[100dvh] w-full bg-[#0F172A] flex flex-col relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1E3A8A_0%,_#0F172A_100%)] opacity-85 pointer-events-none" />

        <header className="relative z-10 w-full max-w-2xl mx-auto flex items-center justify-between py-4 px-4 shrink-0 bg-slate-900/50">
          <button
            onClick={() => {
              audioController.playButtonClick(settings.soundEffects);
              onExit();
            }}
            className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-bold text-sm">{isAr ? 'مغادرة' : 'Quitter'}</span>
          </button>
          <span className="font-extrabold text-white text-sm">{isAr ? 'صالون الشطرنج' : 'Salon d\'Échecs'}</span>
          <div className="w-12" />
        </header>

        <main className="relative z-10 flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center p-6 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-slate-800/80 border-2 border-slate-700/50 rounded-3xl p-6 shadow-2xl backdrop-blur-sm flex flex-col gap-6"
          >
            <div className="text-center">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-1">
                {isAr ? 'رمز دعوة الغرفة' : 'Code d\'invitation'}
              </h2>
              <div className="flex items-center justify-center gap-3 bg-slate-900/80 px-6 py-4 rounded-2xl border border-slate-700">
                <span className="font-mono text-3xl font-black tracking-widest text-white">{match.code}</span>
                <button
                  onClick={copyRoomCode}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                  title="Copy Code"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'اللاعبون المتصلون' : 'Joueurs connectés'} ({players.length}/2)
              </h3>
              
              <div className="grid grid-cols-1 gap-2">
                {players.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center overflow-hidden">
                        <Avatar avatar={p.avatar} className="w-full h-full flex items-center justify-center" />
                      </div>
                      <div>
                        <span className="font-bold text-white block leading-tight">{p.name}</span>
                        <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">
                          {idx === 0 ? (isAr ? 'المنشئ (الأبيض)' : 'Hôte (Blancs)') : (isAr ? 'الخصم (الأسود)' : 'Invité (Noirs)')}
                        </span>
                      </div>
                    </div>
                    {idx === 0 ? (
                      <span className="text-xs bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-500/20">👑 Creator</span>
                    ) : (
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">🤝 Ready</span>
                    )}
                  </div>
                ))}
                
                {players.length < 2 && (
                  <div className="flex items-center justify-center p-6 border-2 border-dashed border-slate-700/50 rounded-xl text-slate-500 text-xs font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500 mr-2" />
                    {isAr ? 'في انتظار انضمام لاعب آخر...' : 'Attente d\'un autre joueur...'}
                  </div>
                )}
              </div>
            </div>

            {isHost ? (
              <button
                onClick={handleStartOnlineMatch}
                disabled={!hasOpponent}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-black text-lg uppercase tracking-wider rounded-2xl shadow-lg transition-all"
              >
                🚀 {isAr ? 'ابدأ المباراة' : 'Démarrer'}
              </button>
            ) : (
              <div className="p-4 bg-slate-900/50 rounded-xl text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2 border border-slate-800">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                {isAr ? 'في انتظار منشئ الغرفة لبدء اللعبة...' : 'En attente du créateur pour lancer la partie...'}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    );
  }

  // 4. Normal Playing Board View
  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="h-[100dvh] w-full bg-[#0F172A] flex flex-col relative overflow-hidden"
    >
      {/* TOP BAR */}
      <header className="relative z-10 w-full max-w-2xl mx-auto flex items-center justify-between py-4 px-4 shrink-0 bg-slate-900/50">
        <button
          onClick={() => {
            audioController.playButtonClick(settings.soundEffects);
            onExit();
          }}
          className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
          title={isAr ? 'مغادرة' : 'Quitter'}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm uppercase tracking-wide">
            {mode === 'hvh' && (isAr ? 'لاعب ضد لاعب' : 'Joueur vs Joueur')}
            {mode === 'hva' && (isAr ? 'ضد الكمبيوتر' : 'vs IA')}
            {mode === 'online' && (isAr ? 'مباراة أونلاين' : 'Match En Ligne')}
          </div>
          {mode === 'online' && match && (
            <button 
              onClick={copyRoomCode}
              className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold tracking-wider mt-0.5"
            >
              CODE: {match.code} {copied ? '✓' : '📋'}
            </button>
          )}
        </div>

        {mode !== 'online' ? (
          <button
            onClick={() => {
              setGameState(new ChessEngine().getSnapshot());
              setSelectedPos(null);
              setPromotionMove(null);
            }}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-full bg-slate-800"
            title="Restart Game"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9" /> // Spacer to balance layout
        )}
      </header>

      {/* GAME AREA */}
      <main className="relative z-10 flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-4">
        
        {/* Opponent Info (Top of Board) */}
        <div className="w-full max-w-[400px] sm:max-w-md flex justify-between items-center mb-3 px-1">
           <div className="flex items-center gap-2 text-slate-300">
             {mode === 'hva' ? (
               <>
                 <Bot className="w-8 h-8 text-slate-400 p-1 bg-slate-800 rounded-lg" />
                 <span className="font-bold text-sm">
                   {isAr ? 'الكمبيوتر' : 'L\'Ordinateur'}
                 </span>
               </>
             ) : mode === 'online' ? (
               <>
                 <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
                   {opponentPlayerSession ? (
                     <Avatar avatar={opponentPlayerSession.avatar} className="w-full h-full flex items-center justify-center" />
                   ) : (
                     <span className="text-lg">🤖</span>
                   )}
                 </div>
                 <span className="font-bold text-sm text-slate-200">
                   {opponentPlayerSession ? opponentPlayerSession.name : (isAr ? 'لاعب آخر' : 'Adversaire')}
                 </span>
               </>
             ) : (
               <>
                 <User className="w-8 h-8 text-purple-400 p-1 bg-slate-800 rounded-lg" />
                 <span className="font-bold text-sm">
                   {isAr ? 'اللاعب 2' : 'Joueur 2'}
                 </span>
               </>
             )}
           </div>

           {/* Turn indicator badge */}
           {gameState.turn === opponentColor && gameState.status === 'active' && (
             <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase tracking-widest px-2 py-0.5 rounded-full font-black animate-pulse">
               {isAr ? 'يفكر...' : 'En Turn'}
             </span>
           )}
        </div>

        {/* The Board */}
        <div className="w-full max-w-[400px] sm:max-w-md bg-slate-800 p-2 rounded-2xl shadow-2xl border-2 border-slate-700/50">
          <div className="grid grid-cols-8 grid-rows-8 gap-0 rounded-xl overflow-hidden border border-slate-900 shadow-inner">
            {renderBoard()}
          </div>
        </div>

        {/* Player Info (Bottom of Board) */}
        <div className="w-full max-w-[400px] sm:max-w-md flex justify-between items-center mt-3 px-1">
           <div className="flex items-center gap-2 text-white">
             <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden border border-blue-500/20">
               <Avatar avatar={profile.avatar} className="w-full h-full flex items-center justify-center" />
             </div>
             <div>
               <span className="font-bold text-sm text-slate-200 block leading-tight">{profile.name}</span>
               <span className="text-[10px] text-blue-400 font-bold uppercase">
                 {mode === 'online' ? (myColor === 'white' ? (isAr ? 'الأبيض' : 'BLANCS') : (isAr ? 'الأسود' : 'NOIRS')) : (isAr ? 'أنت' : 'VOUS')}
               </span>
             </div>
           </div>

           {/* Active Turn Indicator */}
           {gameState.turn === myColor && gameState.status === 'active' && (
             <span className="text-[10px] bg-blue-500/20 border border-blue-500/30 text-blue-400 uppercase tracking-widest px-2.5 py-1 rounded-full font-black animate-pulse">
               {isAr ? 'دورك' : 'À Vous'}
             </span>
           )}
        </div>
      </main>

      {/* STATUS OVERLAYS */}
      <AnimatePresence>
        {gameState.status !== 'active' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <div className="bg-slate-800 border-2 border-slate-600 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl max-w-sm w-full">
               <Crown className={`w-16 h-16 mb-4 ${gameState.winner === myColor ? 'text-amber-400' : gameState.winner ? 'text-slate-500' : 'text-slate-400'}`} />
               <h2 className="text-3xl font-black text-white mb-2">
                 {gameState.status === 'checkmate' 
                   ? (isAr ? 'كش مات!' : 'Échec et Mat!')
                   : (isAr ? 'تعادل' : 'Match Nul')}
               </h2>
               <p className="text-slate-300 mb-6 font-medium">
                 {gameState.status === 'checkmate'
                   ? (gameState.winner === myColor 
                       ? (isAr ? 'لقد فزت بالكامل!' : 'Vous avez gagné !') 
                       : (isAr ? 'فاز الخصم!' : 'L\'adversaire a gagné'))
                   : (isAr ? `السبب: ${gameState.drawReason}` : `Raison: ${gameState.drawReason}`)
                 }
               </p>
               {mode !== 'online' ? (
                 <button
                   onClick={() => {
                     setGameState(new ChessEngine().getSnapshot());
                     setSelectedPos(null);
                     setPromotionMove(null);
                   }}
                   className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold text-lg transition-colors shadow-lg shadow-blue-900/50"
                 >
                   {isAr ? 'العب مرة أخرى' : 'Rejouer'}
                 </button>
               ) : isHost ? (
                 <button
                   onClick={handleStartOnlineMatch}
                   className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold text-lg transition-colors shadow-lg"
                 >
                   {isAr ? 'العب مرة أخرى' : 'Rejouer'}
                 </button>
               ) : (
                 <p className="text-xs text-slate-500 italic mt-2">
                   {isAr ? 'في انتظار منشئ الغرفة لإعادة اللعب...' : 'Attente de l\'hôte pour relancer...'}
                 </p>
               )}
            </div>
          </motion.div>
        )}

        {/* Promotion Modal */}
        {promotionMove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <div className="bg-slate-800 border-2 border-slate-600 rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl">
               <h3 className="text-xl font-bold text-white mb-4">
                 {isAr ? 'ترقية البيدق' : 'Promotion du pion'}
               </h3>
               <div className="flex gap-2">
                 {(['queen', 'rook', 'bishop', 'knight'] as PieceType[]).map(type => (
                   <button
                     key={type}
                     onClick={() => handlePromotionSelect(type)}
                     className="w-16 h-16 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center transition-colors"
                   >
                     <ChessPieceIcon type={type} color={gameState.turn} className="w-12 h-12" />
                   </button>
                 ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
