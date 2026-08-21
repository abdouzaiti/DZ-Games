import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LudoGameState } from '../../../ludo/state/gameState';
import { LudoEngine, LudoPlayerSetupConfig } from '../../../ludo/engine/ludoEngine';
import { LudoColor } from '../../../ludo/models/color';
import { LudoMove } from '../../../ludo/moves/move';
import { LudoPiece } from '../../../ludo/models/piece';
import { LudoAI, LudoAIDifficulty } from '../../../ludo/ai/ludoAI';
import { LudoPositionMapper, GridCoordinate, LUDO_GRID_TRACK } from '../../../ludo/presentation/positionMapper';
import { LudoRulesEngine } from '../../../ludo/rules/rulesEngine';
import { DEFAULT_LUDO_POLICIES, LudoRulePolicies } from '../../../ludo/rules/policies';
import { AppSettings } from '../SettingsModal';
import { UserProfile } from '../ProfileModal';
import { audioController } from '../../utils/audio';

interface LudoGameUIProps {
  profile: UserProfile;
  settings: AppSettings;
  onExit: () => void;
}

const DiceFace: React.FC<{ value: number }> = ({ value }) => {
  const dotPositions: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const dots = dotPositions[value] || [4];

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-[3px] w-9 h-9 p-[4px] bg-white rounded-lg shadow-inner border border-slate-200 pointer-events-none select-none">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {dots.includes(i) && (
            <div className="w-[6px] h-[6px] rounded-full bg-slate-950 shadow-sm" />
          )}
        </div>
      ))}
    </div>
  );
};

export const LudoGameUI: React.FC<LudoGameUIProps> = ({ profile, settings, onExit }) => {
  const isAr = settings.language === 'ar';

  // --- UI SCREEN STATE ---
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [gameState, setGameState] = useState<LudoGameState | null>(null);

  // --- LOBBY / SETUP OPTIONS ---
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [difficulty, setDifficulty] = useState<LudoAIDifficulty>('medium');
  const [rulePolicies, setRulePolicies] = useState<LudoRulePolicies>({
    ...DEFAULT_LUDO_POLICIES,
    doublePieceSafety: true,
    blockingEnabled: true,
  });

  // --- GAMEPLAY VISUAL STATE ---
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [hoveredPieceId, setHoveredPieceId] = useState<string | null>(null);
  const [tempDiceVal, setTempDiceVal] = useState<number>(1);
  const [lastLog, setLastLog] = useState<string>('');

  // Animation & Event Tracking states
  const [captureTargetCell, setCaptureTargetCell] = useState<{ row: number; col: number } | null>(null);
  const [enteredPieceId, setEnteredPieceId] = useState<string | null>(null);
  const [finishedPiece, setFinishedPiece] = useState<string | null>(null);
  const [transitionTurnColor, setTransitionTurnColor] = useState<LudoColor | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  const prevPiecesRef = useRef<LudoPiece[]>([]);

  // Auto-step timer reference for AIs
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Translate colors for badges
  const colorNames: Record<LudoColor, { en: string; ar: string; hex: string; bg: string; text: string; fill: string }> = {
    red: { en: 'Red', ar: 'الأحمر', hex: '#EF4444', bg: 'bg-red-500', text: 'text-red-500', fill: 'fill-red-500' },
    green: { en: 'Green', ar: 'الأخضر', hex: '#10B981', bg: 'bg-green-500', text: 'text-green-500', fill: 'fill-green-500' },
    yellow: { en: 'Yellow', ar: 'الأصفر', hex: '#F59E0B', bg: 'bg-amber-500', text: 'text-amber-500', fill: 'fill-amber-500' },
    blue: { en: 'Blue', ar: 'الأزرق', hex: '#3B82F6', bg: 'bg-blue-500', text: 'text-blue-500', fill: 'fill-blue-500' },
  };

  // Safe indexes in Ludo
  const safeIndices = [0, 8, 13, 21, 26, 34, 39, 47];

  // --- GAME LAUNCH ---
  const handleStartGame = () => {
    // Generate configurations
    // Player 1 is always the Human (Red)
    const configs: LudoPlayerSetupConfig[] = [
      { color: 'red', type: 'human' },
    ];

    const possibleColors: LudoColor[] = ['green', 'yellow', 'blue'];
    for (let i = 0; i < playerCount - 1; i++) {
      configs.push({
        color: possibleColors[i],
        type: 'ai',
      });
    }

    const initial = LudoEngine.initializeGame(configs, rulePolicies);
    const playingState = LudoEngine.startGame(initial);
    setGameState(playingState);
    setIsPlaying(true);
    setLastLog(isAr ? 'بدأت لعبة لودو جديدة! دور الأحمر (أنت)' : 'Nouvelle partie de Ludo lancée ! Tour du Rouge (Vous)');
    audioController.playButtonClick(settings.soundEffects);
  };

  // --- RESTART GAME ---
  const handleRestart = () => {
    if (!gameState) return;
    const restarted = LudoEngine.restartGame(gameState);
    setGameState(restarted);
    setSelectedPieceId(null);
    setIsRolling(false);
    setLastLog(isAr ? 'تم إعادة تشغيل اللعبة!' : 'Partie réinitialisée !');
    audioController.playButtonClick(settings.soundEffects);
  };

  // --- DICE ROLL ---
  const handleRollDice = () => {
    if (!gameState || isRolling) return;
    if (gameState.dice.state === 'rolled') return;

    // Only human can roll on human turn
    const activePlayer = gameState.players.find(p => p.color === gameState.currentPlayer);
    if (!activePlayer || activePlayer.type !== 'human') return;

    setIsRolling(true);
    audioController.playTileClick(settings.soundEffects);

    let rollCount = 0;
    const interval = setInterval(() => {
      setTempDiceVal(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount >= 8) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        const nextState = LudoEngine.rollDice(gameState, finalRoll);
        
        setIsRolling(false);
        setGameState(nextState);

        const activeColName = isAr ? colorNames[gameState.currentPlayer].ar : colorNames[gameState.currentPlayer].en;
        if (nextState.currentPlayer !== gameState.currentPlayer) {
          setLastLog(
            isAr
              ? `دحرجت ${finalRoll}. ليس لديك حركات قانونية! انتقل الدور إلى ${colorNames[nextState.currentPlayer].ar}`
              : `Roulé ${finalRoll}. Aucun mouvement possible ! Tour au ${colorNames[nextState.currentPlayer].en}`
          );
        } else {
          setLastLog(isAr ? `دحرجت ${finalRoll}! اختر قطعة لتحريكها.` : `Roulé ${finalRoll} ! Sélectionnez un pion.`);
        }
      }
    }, 80);
  };

  // --- MAKE PIECE MOVE ---
  const handleSelectPiece = (pieceId: string) => {
    if (!gameState || isRolling) return;
    if (gameState.dice.state !== 'rolled' || gameState.turnState !== 'move') return;

    const activePlayer = gameState.players.find(p => p.color === gameState.currentPlayer);
    if (!activePlayer || activePlayer.type !== 'human') return;

    const piece = gameState.pieces.find(p => p.id === pieceId);
    if (!piece || piece.color !== gameState.currentPlayer) return;

    const legalMoves = LudoEngine.getLegalMoves(gameState);
    const targetMove = legalMoves.find(m => m.pieceId === pieceId);

    if (!targetMove) {
      audioController.triggerVibration(settings.vibration, 40);
      return;
    }

    audioController.playTileClick(settings.soundEffects);
    
    // Perform move
    try {
      const nextState = LudoEngine.makeMove(gameState, targetMove);
      setGameState(nextState);
      setSelectedPieceId(null);

      // Check logs for capture
      const lastAction = nextState.moveHistory[nextState.moveHistory.length - 1];
      let moveMsg = '';
      if (lastAction) {
        const pColor = isAr ? colorNames[lastAction.playerColor].ar : colorNames[lastAction.playerColor].en;
        moveMsg = isAr 
          ? `حرك ${pColor} القطعة بقيمة ${lastAction.rollValue}`
          : `Le ${pColor} a déplacé un pion de ${lastAction.rollValue}`;
      }

      setLastLog(moveMsg);
    } catch (e: any) {
      console.error(e);
    }
  };

  // --- AI LOGIC TIMEOUT ---
  useEffect(() => {
    if (!isPlaying || !gameState || gameState.status === 'gameOver') return;

    const activePlayer = gameState.players.find(p => p.color === gameState.currentPlayer);
    if (!activePlayer || activePlayer.type !== 'ai') {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
      return;
    }

    // It's AI's turn!
    // 1. If AI needs to roll
    if (gameState.dice.state === 'idle' && gameState.turnState === 'roll' && !isRolling) {
      aiTimerRef.current = setTimeout(() => {
        setIsRolling(true);
        let rollCount = 0;
        const interval = setInterval(() => {
          setTempDiceVal(Math.floor(Math.random() * 6) + 1);
          rollCount++;
          if (rollCount >= 8) {
            clearInterval(interval);
            const finalRoll = Math.floor(Math.random() * 6) + 1;
            const rolledState = LudoEngine.rollDice(gameState, finalRoll);
            setIsRolling(false);
            setGameState(rolledState);

            const pColor = isAr ? colorNames[gameState.currentPlayer].ar : colorNames[gameState.currentPlayer].en;
            if (rolledState.currentPlayer !== gameState.currentPlayer) {
              setLastLog(
                isAr
                  ? `دحرج الكمبيوتر (${pColor}) ${finalRoll}. لا توجد حركات قانونية. دور التالي.`
                  : `L'IA (${pColor}) a roulé ${finalRoll}. Aucun mouvement. Tour suivant.`
              );
            } else {
              setLastLog(
                isAr
                  ? `دحرج الكمبيوتر (${pColor}) ${finalRoll}. يفكر في حركته...`
                  : `L'IA (${pColor}) a roulé ${finalRoll}. Réflexion...`
              );
            }
          }
        }, 70);
      }, 1000);
    }

    // 2. If AI rolled and needs to make a move
    if (gameState.dice.state === 'rolled' && gameState.turnState === 'move') {
      aiTimerRef.current = setTimeout(() => {
        const chosenMove = LudoAI.selectBestMove(gameState, difficulty);
        if (chosenMove) {
          const nextState = LudoEngine.makeMove(gameState, chosenMove);
          setGameState(nextState);

          const pColor = isAr ? colorNames[chosenMove.playerColor].ar : colorNames[chosenMove.playerColor].en;
          setLastLog(
            isAr
              ? `حرك الكمبيوتر (${pColor}) قطعة بقيمة ${chosenMove.rollValue}`
              : `L'IA (${pColor}) a déplacé un pion de ${chosenMove.rollValue}`
          );
        }
      }, 1200);
    }

    return () => {
      if (aiTimerRef.current) {
        clearTimeout(aiTimerRef.current);
      }
    };
  }, [isPlaying, gameState, isRolling, difficulty, isAr]);

  // --- STATE CHANGE MONITORING (CAPTURES, ENTERING, FINISHING) ---
  useEffect(() => {
    if (!gameState || !isPlaying) {
      prevPiecesRef.current = [];
      return;
    }

    const prevPieces = prevPiecesRef.current;
    if (prevPieces && prevPieces.length > 0) {
      gameState.pieces.forEach(p => {
        const prev = prevPieces.find(pv => pv.id === p.id);
        if (prev) {
          // 1. Capture detection: piece was on track, now returned to base
          if (prev.stepsMoved > 0 && p.stepsMoved === 0 && p.position.type === 'base') {
            // Find coordinates of the cell where capture occurred
            const grid = LudoPositionMapper.toGrid(prev.position);
            setCaptureTargetCell(grid);
            audioController.triggerVibration(settings.vibration, 80);
            setTimeout(() => setCaptureTargetCell(null), 1200);
          }

          // 2. Entering Board detection: steps went from 0 to > 0
          if (prev.stepsMoved === 0 && p.stepsMoved > 0) {
            setEnteredPieceId(p.id);
            setTimeout(() => setEnteredPieceId(null), 1200);
          }

          // 3. Reaching Home/Finish detection: steps reached 57
          if (prev.stepsMoved < 57 && p.stepsMoved === 57) {
            setFinishedPiece(p.id);
            // Trigger beautiful particle fountain from center
            const newParticles = Array.from({ length: 15 }).map((_, i) => ({
              id: Date.now() + i + Math.random(),
              x: (Math.random() - 0.5) * 220,
              y: (Math.random() - 0.5) * 220,
              delay: Math.random() * 0.4,
            }));
            setParticles(newParticles);
            setTimeout(() => {
              setFinishedPiece(null);
              setParticles([]);
            }, 2500);
          }
        }
      });
    }

    prevPiecesRef.current = gameState.pieces.map(p => ({
      ...p,
      position: { ...p.position },
    }));
  }, [gameState, isPlaying, settings.vibration]);

  // --- TURN CHANGED OVERLAY TRANSITION TRIGGER ---
  useEffect(() => {
    if (gameState && isPlaying && gameState.status !== 'gameOver') {
      setTransitionTurnColor(gameState.currentPlayer);
      const timer = setTimeout(() => {
        setTransitionTurnColor(null);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState?.currentPlayer, isPlaying]);

  // --- LEGAL MOVES COMPUTED ---
  const legalMovesMap = useMemo(() => {
    if (!gameState || gameState.dice.state !== 'rolled') return new Map<string, LudoMove>();
    const moves = LudoEngine.getLegalMoves(gameState);
    const map = new Map<string, LudoMove>();
    moves.forEach(m => {
      map.set(m.pieceId, m);
    });
    return map;
  }, [gameState]);

  // --- PIECE GROUPING FOR MULTIPLE PIECES ON SAME TILE ---
  const pieceGridGroups = useMemo(() => {
    if (!gameState) return {};
    const groups: Record<string, LudoPiece[]> = {};
    gameState.pieces.forEach(p => {
      const grid = LudoPositionMapper.toGrid(p.position);
      const key = `${grid.row}-${grid.col}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(p);
    });
    return groups;
  }, [gameState]);

  // --- COMPUTE WALK PATH & LANDING CELL FOR HOVERED/SELECTED PIECE ---
  const activeMovePath = useMemo(() => {
    const activePieceId = selectedPieceId || hoveredPieceId;
    if (!activePieceId || !gameState) return [];
    const move = legalMovesMap.get(activePieceId);
    if (!move) return [];

    const piece = gameState.pieces.find(p => p.id === activePieceId);
    if (!piece) return [];

    const pathCoords: GridCoordinate[] = [];
    const startSteps = piece.stepsMoved;
    const roll = move.rollValue;

    // Add each intermediate step grid coordinate
    for (let s = startSteps + 1; s <= startSteps + roll; s++) {
      const pos = LudoRulesEngine.getPositionFromSteps(piece.color, s);
      const grid = LudoPositionMapper.toGrid(pos);
      pathCoords.push(grid);
    }
    return pathCoords;
  }, [selectedPieceId, hoveredPieceId, gameState, legalMovesMap]);

  const destinationCell = useMemo(() => {
    if (activeMovePath.length === 0) return null;
    return activeMovePath[activeMovePath.length - 1];
  }, [activeMovePath]);

  // --- RENDERING TILES OR BASES IN 15x15 GRID ---
  const renderCell = (row: number, col: number) => {
    const key = `${row}-${col}`;
    const piecesAtTile = pieceGridGroups[key] || [];

    // 1. Determine background color or decoration
    let cellBg = 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
    let label = '';
    let isSafe = false;

    // Check if within Home zones (row 6..8, col 6..8)
    const isCenterHome = row >= 6 && row <= 8 && col >= 6 && col <= 8;

    // Define Track indexes
    const trackIndex = LUDO_GRID_TRACK.findIndex(cell => cell.row === row && cell.col === col);
    if (trackIndex !== -1) {
      isSafe = safeIndices.includes(trackIndex);
      if (isSafe) {
        cellBg = 'bg-slate-300 dark:bg-slate-600 border-slate-400';
        label = '⭐';
      }

      // Starting squares specific colored arrows
      if (trackIndex === 0) cellBg = 'bg-red-400 border-red-500 font-bold'; // Red start
      if (trackIndex === 13) cellBg = 'bg-emerald-400 border-emerald-500 font-bold'; // Green start
      if (trackIndex === 26) cellBg = 'bg-amber-400 border-amber-500 font-bold'; // Yellow start
      if (trackIndex === 39) cellBg = 'bg-blue-400 border-blue-500 font-bold'; // Blue start
    }

    // Home paths color assignments
    // Red home path: row 7, col 1..5
    if (row === 7 && col >= 1 && col <= 5) {
      cellBg = 'bg-red-500 border-red-600';
    }
    // Green home path: row 1..5, col 7
    if (col === 7 && row >= 1 && row <= 5) {
      cellBg = 'bg-emerald-500 border-emerald-600';
    }
    // Yellow home path: row 7, col 9..13
    if (row === 7 && col >= 9 && col <= 13) {
      cellBg = 'bg-amber-500 border-amber-600';
    }
    // Blue home path: row 9..13, col 7
    if (col === 7 && row >= 9 && row <= 13) {
      cellBg = 'bg-blue-500 border-blue-600';
    }

    // Outer quadrants / Yard color assignments
    const isTopLeftYard = row < 6 && col < 6;
    const isTopRightYard = row < 6 && col > 8;
    const isBottomRightYard = row > 8 && col > 8;
    const isBottomLeftYard = row > 8 && col < 6;

    if (isTopLeftYard) {
      cellBg = 'bg-red-50/50 dark:bg-red-950/20 border-red-200/50';
      if (row >= 1 && row <= 4 && col >= 1 && col <= 4) {
        cellBg = 'bg-red-500 border-red-600 shadow-md';
      }
    } else if (isTopRightYard) {
      cellBg = 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50';
      if (row >= 1 && row <= 4 && col >= 10 && col <= 13) {
        cellBg = 'bg-emerald-500 border-emerald-600 shadow-md';
      }
    } else if (isBottomRightYard) {
      cellBg = 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50';
      if (row >= 10 && row <= 13 && col >= 10 && col <= 13) {
        cellBg = 'bg-amber-500 border-amber-600 shadow-md';
      }
    } else if (isBottomLeftYard) {
      cellBg = 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50';
      if (row >= 10 && row <= 13 && col >= 1 && col <= 4) {
        cellBg = 'bg-blue-500 border-blue-600 shadow-md';
      }
    }

    // Inside Yard circle markings for pieces
    const isYardPoint = 
      (row === 2 && col === 2) || (row === 2 && col === 3) || (row === 3 && col === 2) || (row === 3 && col === 3) || // Red
      (row === 2 && col === 11) || (row === 2 && col === 12) || (row === 3 && col === 11) || (row === 3 && col === 12) || // Green
      (row === 11 && col === 11) || (row === 11 && col === 12) || (row === 12 && col === 11) || (row === 12 && col === 12) || // Yellow
      (row === 11 && col === 2) || (row === 11 && col === 3) || (row === 12 && col === 2) || (row === 12 && col === 3); // Blue

    if (isYardPoint) {
      cellBg = 'bg-white border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-center';
    }

    // Path & Destination & Capture calculations
    const isPathCell = activeMovePath.some(coord => coord.row === row && coord.col === col);
    const isDestCell = destinationCell && destinationCell.row === row && destinationCell.col === col;
    const isCaptureCell = captureTargetCell && captureTargetCell.row === row && captureTargetCell.col === col;

    // 2. Handle center home zone
    if (isCenterHome) {
      // Draw standard 4 colored triangles meeting in the center
      // Red left, Green top, Yellow right, Blue bottom
      let triangleBg = 'bg-slate-200 dark:bg-slate-700';
      if (row === 7 && col === 6) triangleBg = 'bg-red-500';
      if (row === 6 && col === 7) triangleBg = 'bg-emerald-500';
      if (row === 7 && col === 8) triangleBg = 'bg-amber-500';
      if (row === 8 && col === 7) triangleBg = 'bg-blue-500';
      if (row === 7 && col === 7) {
        triangleBg = 'bg-slate-800 flex items-center justify-center text-white text-[10px] font-black';
        return (
          <div
            id={`ludo-cell-${row}-${col}`}
            key={key}
            className={`${triangleBg} border border-slate-400 flex items-center justify-center relative`}
          >
            🏆
            {piecesAtTile.map((p, idx) => renderPiece(p, idx, piecesAtTile.length))}

            {/* Spark Confetti Celebration Particles */}
            <AnimatePresence>
              {particles.map(pt => (
                <motion.div
                  key={pt.id}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                  animate={{ x: pt.x, y: pt.y - 120, opacity: 0, scale: 1.6, rotate: 360 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.8, delay: pt.delay, ease: 'easeOut' }}
                  className="absolute text-yellow-400 text-lg pointer-events-none z-30"
                  style={{ left: 'calc(50% - 10px)', top: 'calc(50% - 10px)' }}
                >
                  ⭐
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        );
      }

      return (
        <div
          id={`ludo-cell-${row}-${col}`}
          key={key}
          className={`${triangleBg} border border-slate-400 flex items-center justify-center relative`}
        >
          {piecesAtTile.map((p, idx) => renderPiece(p, idx, piecesAtTile.length))}
        </div>
      );
    }

    return (
      <div
        id={`ludo-cell-${row}-${col}`}
        key={key}
        className={`${cellBg} border flex items-center justify-center relative aspect-square select-none overflow-hidden transition-all duration-300 ${
          isDestCell ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-950 border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.6)] scale-105 z-20' : ''
        }`}
      >
        {label && <span className="text-[10px] md:text-xs opacity-60 pointer-events-none">{label}</span>}
        
        {/* Intermediate walk path highlight dot */}
        {isPathCell && !isDestCell && (
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.5, 0.9, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="absolute w-2 h-2 rounded-full bg-yellow-400 pointer-events-none z-0 shadow-lg shadow-yellow-400/50"
          />
        )}

        {/* Capture Explosion Overlay */}
        {isCaptureCell && (
          <motion.div
            initial={{ scale: 0.3, opacity: 1 }}
            animate={{ scale: [1, 2.2], opacity: [1, 0] }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 bg-red-500/30 rounded-full flex items-center justify-center pointer-events-none z-30"
          >
            <span className="text-sm md:text-lg">💥</span>
          </motion.div>
        )}

        {piecesAtTile.map((p, idx) => renderPiece(p, idx, piecesAtTile.length))}
      </div>
    );
  };

  // --- PIECE RENDERER (STACKING & TAP SELECTION) ---
  const renderPiece = (piece: LudoPiece, index: number, total: number) => {
    const isSelectable = legalMovesMap.has(piece.id) && gameState?.currentPlayer === 'red';
    const isSelected = selectedPieceId === piece.id;
    const isEntered = enteredPieceId === piece.id;

    // Arrange position offsets when stacked
    let transformStyle = '';
    if (total > 1) {
      const angle = (index / total) * 2 * Math.PI;
      const offset = 8; // pixel shift for overlap
      const x = Math.cos(angle) * offset;
      const y = Math.sin(angle) * offset;
      transformStyle = `translate(${x}px, ${y}px)`;
    }

    const pieceColors: Record<LudoColor, { fill: string; border: string; glow: string }> = {
      red: { fill: 'bg-red-600 hover:bg-red-500', border: 'border-red-800', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.8)]' },
      green: { fill: 'bg-emerald-600 hover:bg-emerald-500', border: 'border-emerald-800', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.8)]' },
      yellow: { fill: 'bg-amber-500 hover:bg-amber-400', border: 'border-amber-700', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.8)]' },
      blue: { fill: 'bg-blue-600 hover:bg-blue-500', border: 'border-blue-800', glow: 'shadow-[0_0_12px_rgba(59,130,246,0.8)]' },
    };

    const style = pieceColors[piece.color];

    return (
      <div style={{ transform: transformStyle }} className="relative flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7">
        {/* Entering Board Pulse Aura */}
        {isEntered && (
          <motion.div
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{ scale: 2.3, opacity: 0 }}
            transition={{ duration: 0.8, repeat: 1 }}
            className="absolute -inset-2.5 rounded-full border-2 border-yellow-400 pointer-events-none z-0"
          />
        )}

        {/* Selected Highlight Aura */}
        {isSelected && (
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="absolute -inset-2 rounded-full border-2 border-dashed border-white pointer-events-none z-0"
          />
        )}

        <motion.button
          id={`ludo-piece-${piece.id}`}
          key={piece.id}
          layout
          layoutId={`piece-layout-${piece.id}`}
          transition={{ type: 'spring', stiffness: 180, damping: 18 }}
          type="button"
          onMouseEnter={() => isSelectable && setHoveredPieceId(piece.id)}
          onMouseLeave={() => setHoveredPieceId(null)}
          onClick={(e) => {
            e.stopPropagation();
            if (isSelectable) {
              if (selectedPieceId === piece.id) {
                // Confirm/make move if tapped again
                handleSelectPiece(piece.id);
              } else {
                setSelectedPieceId(piece.id);
                audioController.playTileClick(settings.soundEffects);
              }
            }
          }}
          className={`absolute z-10 w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 ${style.border} ${style.fill} flex items-center justify-center cursor-pointer shadow-md transition-all ${
            isSelectable 
              ? `${style.glow} scale-110 ring-2 ring-white ${isSelected ? 'animate-bounce' : 'animate-pulse'}` 
              : ''
          }`}
          whileHover={isSelectable ? { scale: 1.22 } : {}}
          whileTap={isSelectable ? { scale: 0.92 } : {}}
        >
          <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-white/40 border border-white/20 shadow-inner" />
        </motion.button>
      </div>
    );
  };

  // --- RENDER RECENT HISTORY OR ACTIVE CHAT STREAM ---
  const activeColorTheme = gameState ? colorNames[gameState.currentPlayer] : colorNames.red;

  return (
    <div className="min-h-[100dvh] w-full bg-[#0F172A] text-slate-100 font-sans flex flex-col relative overflow-y-auto">
      {/* BACKGROUND GRAPHIC */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1E3A8A_0%,_#0F172A_100%)] opacity-70 pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between px-4 py-4 shrink-0 border-b border-blue-900/40">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
        >
          <span>⬅️</span>
          <span>{isAr ? 'خروج' : 'Hub'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xl">🎲</span>
          <h1 className="text-md sm:text-lg font-black tracking-widest text-white">
            LUDO <span className="text-blue-400">OFFLINE</span>
          </h1>
        </div>

        {isPlaying && (
          <button
            type="button"
            onClick={handleRestart}
            className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-900/50 hover:bg-red-900/60 text-red-200 text-xs font-bold uppercase tracking-wider transition-colors"
          >
            {isAr ? 'إعادة' : 'Reset'}
          </button>
        )}
        {!isPlaying && <div className="w-12" />}
      </header>

      {/* MAIN SCREEN ROUTING */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto p-3 sm:p-6 flex flex-col items-center justify-center">
        {/* TURN SWITCH TRANSITION OVERLAY */}
        <AnimatePresence>
          {transitionTurnColor && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 25 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="absolute z-40 pointer-events-none inset-0 flex items-center justify-center"
            >
              <div className="px-6 py-3.5 rounded-2xl bg-slate-900/95 border-2 border-slate-700/60 shadow-[0_12px_32px_rgba(0,0,0,0.6)] text-center backdrop-blur-md flex items-center gap-3">
                <span className={`w-3.5 h-3.5 rounded-full ${colorNames[transitionTurnColor].bg} animate-ping`} />
                <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase text-white">
                  {isAr ? `دور ${colorNames[transitionTurnColor].ar}` : `Tour du ${colorNames[transitionTurnColor].en}`}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FULL GAME OVER CELEBRATORY OVERLAY */}
        <AnimatePresence>
          {gameState?.status === 'gameOver' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-[0_20px_50px_rgba(245,158,11,0.25)] relative overflow-hidden"
              >
                {/* Decorative drifting background stars */}
                <div className="absolute inset-0 pointer-events-none opacity-10">
                  <div className="absolute top-10 left-10 text-xl animate-bounce">⭐</div>
                  <div className="absolute bottom-12 right-12 text-2xl animate-pulse">⭐</div>
                  <div className="absolute top-1/2 right-8 text-lg animate-bounce delay-300">⭐</div>
                </div>

                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500 text-5xl mb-4"
                >
                  🏆
                </motion.div>

                <h2 className="text-2xl sm:text-3xl font-black text-amber-400 uppercase tracking-wider mb-2">
                  {isAr ? 'تهانينا الفوز!' : 'Victoire Éclatante !'}
                </h2>
                
                <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto">
                  {isAr 
                    ? 'لقد انتهت المباراة وتوج البطل الحقيقي باللقب بعد جولة استراتيجية رائعة!' 
                    : 'Le match est terminé et le champion a été couronné après une superbe performance !'}
                </p>

                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 mb-8 shadow-inner">
                  <span className={`w-4 h-4 rounded-full ${colorNames[gameState.winner || 'red'].bg} shadow-[0_0_8px_currentColor]`} />
                  <span className="font-black text-xs sm:text-sm uppercase text-white tracking-widest">
                    {isAr ? colorNames[gameState.winner || 'red'].ar : colorNames[gameState.winner || 'red'].en}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-colors"
                  >
                    {isAr ? 'العب مجدداً' : 'Rejouer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setGameState(null);
                    }}
                    className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-black text-xs uppercase tracking-wider transition-colors"
                  >
                    {isAr ? 'القائمة الرئيسية' : 'Menu Principal'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!isPlaying ? (
            // --- MATCH SETUP SCREEN ---
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900/90 border-2 border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(30,58,138,0.3)] backdrop-blur-md"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-950 border border-blue-400 text-3xl mb-3">
                  🎲
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  {isAr ? 'تخصيص مباراة لودو' : 'Configuration de Match Ludo'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr ? 'اختر عدد اللاعبين والقواعد لتبدأ اللعب فوراً' : 'Choisissez le nombre de joueurs et règles'}
                </p>
              </div>

              {/* 1. PLAYER COUNT */}
              <div className="mb-6">
                <label className="block text-xs font-black uppercase tracking-wider text-blue-300 mb-2">
                  {isAr ? 'عدد اللاعبين' : 'Nombre de Joueurs'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([2, 3, 4] as const).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPlayerCount(n)}
                      className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                        playerCount === n
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                          : 'bg-slate-800 border-slate-700/50 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {n} {isAr ? 'لاعبين' : 'Joueurs'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. DIFFICULTY */}
              <div className="mb-6">
                <label className="block text-xs font-black uppercase tracking-wider text-blue-300 mb-2">
                  {isAr ? 'صعوبة الذكاء الاصطناعي' : 'Difficulté de l\'IA'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map(diff => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all ${
                        difficulty === diff
                          ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                          : 'bg-slate-800 border-slate-700/50 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {diff === 'easy' ? (isAr ? 'سهل' : 'Facile') : diff === 'medium' ? (isAr ? 'متوسط' : 'Moyen') : (isAr ? 'صعب' : 'Difficile')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. POLICY TOGGLES */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    {isAr ? 'حماية القطع المزدوجة' : 'Sécurité Pièce Double'}
                  </span>
                  <input
                    type="checkbox"
                    checked={rulePolicies.doublePieceSafety}
                    onChange={(e) => setRulePolicies({ ...rulePolicies, doublePieceSafety: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    {isAr ? 'تفعيل الحواجز والمنع' : 'Hormis Blocus / Barrières'}
                  </span>
                  <input
                    type="checkbox"
                    checked={rulePolicies.blockingEnabled}
                    onChange={(e) => setRulePolicies({ ...rulePolicies, blockingEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    {isAr ? 'مربعات الأمان (النجمات)' : 'Zones de sécurité (Étoiles)'}
                  </span>
                  <input
                    type="checkbox"
                    checked={rulePolicies.safeSquaresEnabled}
                    onChange={(e) => setRulePolicies({ ...rulePolicies, safeSquaresEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* START BUTTON */}
              <button
                type="button"
                onClick={handleStartGame}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-b-4 border-indigo-800 font-extrabold text-xs uppercase tracking-wider text-white shadow-xl transition-all"
              >
                {isAr ? 'دخول اللعبة والبدء' : 'Lancer le Match'}
              </button>
            </motion.div>
          ) : (
            // --- MAIN INTERACTIVE LUDO BOARD & DICE PLATFORM ---
            <motion.div
              key="board"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="w-full flex flex-col lg:flex-row gap-6 items-center justify-center max-w-4xl"
            >
              {/* LUDO BOARD */}
              <div className="w-full max-w-[500px] aspect-square bg-slate-950 rounded-3xl p-2.5 sm:p-4 border-2 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="grid grid-cols-15 grid-rows-15 gap-[1px] w-full h-full bg-slate-400 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-400">
                  {Array.from({ length: 15 }).map((_, r) =>
                    Array.from({ length: 15 }).map((_, c) => renderCell(r, c))
                  )}
                </div>
              </div>

              {/* STATUS & CONTROLS CONTROL PANEL */}
              <div className="w-full max-w-[340px] flex flex-col gap-4 self-stretch justify-between">
                {/* GAME STATE HIGHLIGHT */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-md flex-1 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      {isAr ? 'الحالة الحالية' : 'Statut Actuel'}
                    </h3>

                    {gameState?.status === 'gameOver' ? (
                      <div className="text-amber-400 font-black text-sm uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                        👑 {isAr ? `الفائز: ${colorNames[gameState.winner || 'red'].ar}` : `Gagnant: ${colorNames[gameState.winner || 'red'].en}`}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full animate-ping ${activeColorTheme.bg}`} />
                        <span className="font-extrabold text-xs uppercase tracking-wider text-white">
                          {isAr ? `دور ${activeColorTheme.ar}` : `Tour du ${activeColorTheme.en}`}
                        </span>
                        {gameState?.currentPlayer === 'red' && (
                          <span className="px-1.5 py-0.5 bg-blue-900/80 text-[8px] font-black uppercase tracking-widest text-blue-200 rounded border border-blue-700/50">
                            {isAr ? 'أنت' : 'VOUS'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ACTIVE PIECES IN BASE STATUS */}
                  <div className="grid grid-cols-4 gap-1.5 my-3">
                    {gameState?.players.map(p => {
                      const finishedCount = gameState.pieces.filter(pc => pc.color === p.color && pc.state === 'finished').length;
                      const baseCount = gameState.pieces.filter(pc => pc.color === p.color && pc.position.type === 'base').length;
                      const theme = colorNames[p.color];
                      return (
                        <div key={p.color} className="bg-slate-950/60 border border-slate-800 rounded-xl p-1.5 text-center">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${theme.bg}`} />
                          <div className="text-[9px] text-slate-400 font-bold mt-1">
                            🏆 {finishedCount}/4
                          </div>
                          <div className="text-[8px] text-slate-500 font-medium">
                            Base: {baseCount}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* MINI LOG DISPLAY */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-2 text-[10px] text-slate-300 font-medium leading-relaxed italic shrink-0">
                    📢 {lastLog}
                  </div>
                </div>

                {/* DICE ROLLING CONTAINER */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-md flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      {isAr ? 'النرد اللعب' : 'Dé de Jeu'}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {gameState?.currentPlayer === 'red' && gameState?.dice.state === 'idle'
                        ? (isAr ? 'انقر على النرد للدحرجة' : 'Appuyez pour rouler')
                        : (isAr ? 'انتظر دورك...' : 'Attendez...')}
                    </p>
                  </div>

                  {/* DYNAMIC DICE */}
                  <motion.button
                    id="ludo-dice-roller"
                    type="button"
                    disabled={gameState?.currentPlayer !== 'red' || gameState?.dice.state === 'rolled' || isRolling}
                    onClick={handleRollDice}
                    className={`w-14 h-14 rounded-2xl bg-slate-800 border-2 flex items-center justify-center text-slate-900 shadow-xl transition-all ${
                      gameState?.currentPlayer === 'red' && gameState?.dice.state === 'idle' && !isRolling
                        ? 'border-yellow-400 cursor-pointer animate-pulse ring-2 ring-yellow-400/30'
                        : 'border-slate-700 opacity-90 cursor-not-allowed'
                    }`}
                    whileHover={gameState?.currentPlayer === 'red' && gameState?.dice.state === 'idle' ? { scale: 1.08 } : {}}
                    whileTap={gameState?.currentPlayer === 'red' && gameState?.dice.state === 'idle' ? { scale: 0.94 } : {}}
                  >
                    {isRolling ? (
                      <motion.div
                        animate={{ 
                          rotate: [0, 90, 180, 270, 360],
                          scale: [1, 1.2, 0.9, 1.15, 1],
                          y: [0, -8, 4, -3, 0]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 0.5, 
                          ease: 'easeInOut' 
                        }}
                      >
                        <DiceFace value={tempDiceVal} />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.8, rotate: -12 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      >
                        <DiceFace value={gameState?.dice.value !== null ? gameState?.dice.value : tempDiceVal} />
                      </motion.div>
                    )}
                  </motion.button>
                </div>

                {/* OVERLAY OF VICTORY OR RETURNING HOME */}
                {gameState?.status === 'gameOver' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-amber-500/20 border border-amber-500/30 rounded-3xl text-center shadow-lg"
                  >
                    <div className="text-amber-400 text-sm font-black mb-1">
                      🏆 {isAr ? 'انتهت اللعبة!' : 'Partie Terminée !'}
                    </div>
                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      {isAr
                        ? `لقد توج بطل اللعبة باللقب بعد جولات مثيرة!`
                        : `Le vainqueur a remporté la victoire finale !`}
                    </p>
                    <button
                      type="button"
                      onClick={handleRestart}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 border-b-2 border-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors"
                    >
                      {isAr ? 'العب مجدداً' : 'Rejouer'}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
