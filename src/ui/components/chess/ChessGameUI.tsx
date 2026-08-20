import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User, Bot, Crown, RotateCcw } from 'lucide-react';
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

interface ChessGameUIProps {
  settings: AppSettings;
  profile: UserProfile;
  mode: 'hvh' | 'hva';
  difficulty?: number;
  onExit: () => void;
}

export const ChessGameUI: React.FC<ChessGameUIProps> = ({
  settings,
  profile,
  mode,
  difficulty = 3,
  onExit,
}) => {
  const isAr = settings.language === 'ar';
  
  // Game State
  const [gameState, setGameState] = useState<ChessGameState>(() => new ChessEngine().getSnapshot());
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [promotionMove, setPromotionMove] = useState<Move | null>(null);

  // AI Instance
  const ai = useMemo(() => new ChessAI(difficulty), [difficulty]);

  // Derived properties
  const myColor: PieceColor = 'white'; // In PvE, user is always white for now
  const isMyTurn = mode === 'hvh' || gameState.turn === myColor;
  
  const legalMovesForSelected = useMemo(() => {
    if (!selectedPos || !isMyTurn || gameState.status !== 'active') return [];
    const allLegalMoves = ChessRulesEngine.getLegalMoves(gameState);
    return allLegalMoves.filter(m => m.from.row === selectedPos.row && m.from.col === selectedPos.col);
  }, [selectedPos, isMyTurn, gameState]);

  // Handle AI Turn
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

  const executeMove = (move: Move) => {
    audioController.playTileClick(settings.soundEffects); // Reusing tile sound for move
    const newState = ChessRulesEngine.executeMove(gameState, move);
    setGameState(newState);
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
          // Open promotion dialog
          setPromotionMove(move);
        } else {
          executeMove(move);
        }
      } else {
        // Deselect if clicking somewhere invalid
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

  const renderBoard = () => {
    const squares = [];
    const lastMove = gameState.moveHistory.length > 0 ? gameState.moveHistory[gameState.moveHistory.length - 1] : null;

    // Determine board orientation based on color (always face white up for now)
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
            }`}
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

            {/* Rank/File Labels (Optional, can add later) */}
          </div>
        );
      }
    }
    return squares;
  };

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
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 font-bold text-white text-sm">
          {mode === 'hvh' ? (isAr ? 'لاعب ضد لاعب' : 'Joueur vs Joueur') : (isAr ? 'ضد الكمبيوتر' : 'vs IA')}
        </div>
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
      </header>

      {/* GAME AREA */}
      <main className="relative z-10 flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-4">
        
        {/* Opponent Info */}
        <div className="w-full max-w-md flex justify-between items-center mb-4 px-2">
           <div className="flex items-center gap-2 text-slate-300">
             {mode === 'hva' ? <Bot className="w-6 h-6 text-slate-400" /> : <User className="w-6 h-6 text-slate-400" />}
             <span className="font-bold text-sm">
               {mode === 'hva' ? (isAr ? 'الكمبيوتر' : 'L\'Ordinateur') : (isAr ? 'اللاعب 2' : 'Joueur 2')}
             </span>
           </div>
           {/* Captured pieces could go here */}
        </div>

        {/* The Board */}
        <div className="w-full max-w-[400px] sm:max-w-md bg-slate-800 p-2 rounded-lg shadow-2xl border border-slate-700">
          <div className="grid grid-cols-8 grid-rows-8 gap-0 rounded overflow-hidden border-2 border-slate-900">
            {renderBoard()}
          </div>
        </div>

        {/* Player Info */}
        <div className="w-full max-w-md flex justify-between items-center mt-4 px-2">
           <div className="flex items-center gap-2 text-white">
             <User className="w-6 h-6 text-blue-400" />
             <span className="font-bold text-sm">{profile.name}</span>
           </div>
           {/* Captured pieces could go here */}
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
               <Crown className={`w-16 h-16 mb-4 ${gameState.winner === 'white' ? 'text-blue-400' : gameState.winner === 'black' ? 'text-purple-400' : 'text-slate-400'}`} />
               <h2 className="text-3xl font-black text-white mb-2">
                 {gameState.status === 'checkmate' 
                   ? (isAr ? 'كش مات!' : 'Échec et Mat!')
                   : (isAr ? 'تعادل' : 'Match Nul')}
               </h2>
               <p className="text-slate-300 mb-6 font-medium">
                 {gameState.status === 'checkmate'
                   ? (gameState.winner === myColor 
                       ? (isAr ? 'لقد فزت!' : 'Vous avez gagné!') 
                       : (isAr ? 'فاز الخصم' : 'L\'adversaire a gagné'))
                   : (isAr ? `السبب: ${gameState.drawReason}` : `Raison: ${gameState.drawReason}`)
                 }
               </p>
               <button
                 onClick={() => {
                   setGameState(new ChessEngine().getSnapshot());
                 }}
                 className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold text-lg transition-colors shadow-lg shadow-blue-900/50"
               >
                 {isAr ? 'العب مرة أخرى' : 'Rejouer'}
               </button>
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
