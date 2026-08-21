/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LudoEngine } from '../engine/ludoEngine';
import { LudoRulesEngine } from '../rules/rulesEngine';
import { LudoGameState } from '../state/gameState';
import { LudoColor } from '../models/color';
import { LudoPiece } from '../models/piece';
import { LudoPositionMapper } from '../presentation/positionMapper';
import { LudoRulePolicies, DEFAULT_LUDO_POLICIES } from '../rules/policies';
import { LudoAI, LudoAIDifficulty } from '../ai/ludoAI';
import { LudoMove } from '../moves/move';

export interface StressQAResults {
  testsExecuted: number;
  passed: number;
  failed: number;
  simulatedGamesCompleted: number;
  totalTurnsExecuted: number;
  averageTurnsPerGame: number;
  avgAiMoveTimeMs: number;
}

export function runLudoStressQASuite(): StressQAResults {
  console.log('\n============================================================');
  console.log('🎲 MOSTA GAMES — LUDO OFFLINE V1: PHASE 11 QA & STRESS SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;
  let simulatedGames = 0;
  let totalTurns = 0;
  let aiMoveTimes: number[] = [];

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      passed++;
    } else {
      failed++;
      console.error(`  ❌ STRESS QA FAILURE: ${message}`);
      throw new Error(`Stress QA Assertion Failed: ${message}`);
    }
  };

  /**
   * Exhaustive GameState Invariant Validator.
   * Runs on every state change during thousands of simulation turns.
   */
  const validateDeepStateInvariants = (state: LudoGameState, context: string) => {
    const expectedPieceCount = state.players.length * 4;
    assert(state.pieces.length === expectedPieceCount, `Piece count must be exactly ${expectedPieceCount} at ${context}`);

    // Validate each player and their 4 pieces
    const colorPieceCounts: Record<LudoColor, number> = { red: 0, green: 0, yellow: 0, blue: 0 };

    for (const piece of state.pieces) {
      colorPieceCounts[piece.color]++;
      
      // Step bounds
      assert(piece.stepsMoved >= 0 && piece.stepsMoved <= 57, `Piece ${piece.id} stepsMoved out of bounds [0, 57]: ${piece.stepsMoved} at ${context}`);

      // State and Position mapping alignment
      if (piece.stepsMoved === 0) {
        assert(piece.position.type === 'base', `Piece ${piece.id} with 0 steps must be in base`);
        assert(piece.state === 'home', `Piece ${piece.id} with 0 steps must have state 'home'`);
      } else if (piece.stepsMoved >= 1 && piece.stepsMoved <= 51) {
        assert(piece.position.type === 'track', `Piece ${piece.id} with steps ${piece.stepsMoved} must be on track`);
        assert(piece.position.index >= 0 && piece.position.index <= 51, `Piece ${piece.id} track index must be [0, 51]`);
        assert(piece.state === 'on board', `Piece ${piece.id} on track must have state 'on board'`);
      } else if (piece.stepsMoved >= 52 && piece.stepsMoved <= 56) {
        assert(piece.position.type === 'home_path', `Piece ${piece.id} with steps ${piece.stepsMoved} must be in home_path`);
        assert(piece.position.playerColor === piece.color, `Piece ${piece.id} home path color mismatch`);
        assert(piece.position.index >= 0 && piece.position.index <= 4, `Piece ${piece.id} home path index must be [0, 4]`);
        assert(piece.state === 'on board', `Piece ${piece.id} in home path must have state 'on board'`);
      } else if (piece.stepsMoved === 57) {
        assert(piece.position.type === 'home', `Piece ${piece.id} with 57 steps must be at home goal`);
        assert(piece.state === 'finished', `Piece ${piece.id} with 57 steps must have state 'finished'`);
      }

      // UI Grid coordinate mapper integrity
      const grid = LudoPositionMapper.toGrid(piece.position);
      assert(grid.row >= 0 && grid.row <= 14 && grid.col >= 0 && grid.col <= 14, `Grid coordinate for ${piece.id} out of 15x15 bounds: (${grid.row}, ${grid.col})`);
    }

    for (const player of state.players) {
      assert(colorPieceCounts[player.color] === 4, `Player ${player.color} must have exactly 4 pieces`);
      assert(player.pieces.length === 4, `Player record ${player.color} must contain exactly 4 pieces`);
    }

    // Active player must be one of the registered players
    assert(state.players.some(p => p.color === state.currentPlayer), `Current player ${state.currentPlayer} must be in active players list`);

    // Winner verification
    if (state.winner !== null) {
      const winnerPieces = state.pieces.filter(p => p.color === state.winner);
      const allFinished = winnerPieces.every(p => p.stepsMoved === 57);
      assert(allFinished, `Winner ${state.winner} must have all 4 pieces finished (steps === 57)`);
      assert(state.status === 'gameOver' || state.status === 'finished' || state.status === 'playerWon', `Status must be a terminal game status when winner is set (got ${state.status})`);
    }
  };

  // =========================================================================
  // 1. DETERMINISTIC RULE ENGINE STRESS TESTS
  // =========================================================================
  console.log('--- 1. Deterministic Rule & Invariant Stress Tests ---');

  // 1.1 Triple 6 Rule Verification
  {
    let triple6State = LudoEngine.initializeGame(['red', 'green', 'yellow', 'blue'], {
      ...DEFAULT_LUDO_POLICIES,
      maxConsecutiveSixes: 3,
    });
    triple6State = LudoEngine.startGame(triple6State);

    // Roll 1: 6
    triple6State = LudoEngine.rollDice(triple6State, 6);
    assert(triple6State.rollStreak6 === 1, 'First 6 sets rollStreak6 to 1');
    assert(triple6State.currentPlayer === 'red', 'Player remains red after first 6');

    // Make move (exit piece)
    const moves1 = LudoRulesEngine.getLegalMoves(triple6State);
    triple6State = LudoEngine.makeMove(triple6State, moves1[0]);

    // Roll 2: 6
    triple6State = LudoEngine.rollDice(triple6State, 6);
    assert(triple6State.rollStreak6 === 2, 'Second 6 sets rollStreak6 to 2');
    assert(triple6State.currentPlayer === 'red', 'Player remains red after second 6');

    // Make move
    const moves2 = LudoRulesEngine.getLegalMoves(triple6State);
    triple6State = LudoEngine.makeMove(triple6State, moves2[0]);

    // Roll 3: 6 -> Triple 6 penalty triggers
    triple6State = LudoEngine.rollDice(triple6State, 6);
    assert(triple6State.rollStreak6 === 0, 'Triple 6 penalty resets rollStreak6 to 0');
    assert(triple6State.currentPlayer === 'green', 'Triple 6 penalty immediately transfers turn to next player (green)');
    assert(triple6State.dice.state === 'idle', 'Dice state resets to idle');
    console.log('  ✅ 1.1 Triple 6 penalty and turn forfeiture verified.');
  }

  // 1.2 Exact Home Entry & Overshoot Prevention
  {
    const homeEntryState = LudoEngine.initializeGame(['red', 'green']);
    homeEntryState.status = 'playing';
    homeEntryState.currentPlayer = 'red';
    
    // Position Red-0 at home path index 3 (stepsMoved = 55). Needs EXACTLY 2 to finish (57).
    homeEntryState.pieces[0].position = { type: 'home_path', playerColor: 'red', index: 3 };
    homeEntryState.pieces[0].stepsMoved = 55;
    homeEntryState.pieces[0].state = 'on board';

    // Rolling 3 would overshoot (55 + 3 = 58 > 57)
    const rolledOvershoot = LudoEngine.rollDice(homeEntryState, 3);
    const overshootMoves = LudoRulesEngine.getLegalMoves(rolledOvershoot);
    const piece0Overshoot = overshootMoves.find(m => m.pieceId === 'red-0');
    assert(piece0Overshoot === undefined, 'Roll of 3 must NOT allow piece at 55 to move (overshoot blocked)');

    // Rolling 2 lands exactly on 57
    const rolledExact = LudoEngine.rollDice(homeEntryState, 2);
    const exactMoves = LudoRulesEngine.getLegalMoves(rolledExact);
    const piece0Exact = exactMoves.find(m => m.pieceId === 'red-0');
    assert(piece0Exact !== undefined, 'Roll of 2 allows piece at 55 to finish exactly');
    assert(piece0Exact?.to.type === 'home', 'Move target is home');
    console.log('  ✅ 1.2 Exact roll home entry & overshoot prevention verified.');
  }

  // 1.3 Safe Cells & Immunity from Capture
  {
    const safeCellState = LudoEngine.initializeGame(['red', 'green']);
    safeCellState.status = 'playing';
    safeCellState.currentPlayer = 'red';

    // Place Green piece on a safe cell (index 8, safe square)
    safeCellState.pieces[4].position = { type: 'track', index: 8 };
    safeCellState.pieces[4].stepsMoved = 48; // Green started at 13, track index 8 is valid
    safeCellState.pieces[4].state = 'on board';

    // Place Red piece 2 steps away on track index 6
    safeCellState.pieces[0].position = { type: 'track', index: 6 };
    safeCellState.pieces[0].stepsMoved = 7;
    safeCellState.pieces[0].state = 'on board';

    // Red rolls 2 to land on index 8 (safe square)
    const rolledSafe = LudoEngine.rollDice(safeCellState, 2);
    const moveOnSafe = LudoRulesEngine.getLegalMoves(rolledSafe).find(m => m.pieceId === 'red-0')!;
    assert(moveOnSafe !== undefined, 'Red can legally move onto safe square');

    const stateAfterSafeMove = LudoEngine.makeMove(rolledSafe, moveOnSafe);
    const greenPiece = stateAfterSafeMove.pieces.find(p => p.id === 'green-0')!;
    assert(greenPiece.position.type === 'track' && greenPiece.position.index === 8, 'Green piece remains safely on index 8 alongside Red piece');
    console.log('  ✅ 1.3 Safe cell immunity and piece co-existence verified.');
  }

  // 1.4 Double-Piece Blockade & Passing Prevention
  {
    const blockadeState = LudoEngine.initializeGame(['red', 'green'], {
      ...DEFAULT_LUDO_POLICIES,
      blockingEnabled: true,
      doublePieceSafety: true,
    });
    blockadeState.status = 'playing';
    blockadeState.currentPlayer = 'red';

    // Green creates a blockade with 2 pieces on track index 10
    blockadeState.pieces[4].position = { type: 'track', index: 10 };
    blockadeState.pieces[4].stepsMoved = 50;
    blockadeState.pieces[4].state = 'on board';

    blockadeState.pieces[5].position = { type: 'track', index: 10 };
    blockadeState.pieces[5].stepsMoved = 50;
    blockadeState.pieces[5].state = 'on board';

    // Red piece at track index 8
    blockadeState.pieces[0].position = { type: 'track', index: 8 };
    blockadeState.pieces[0].stepsMoved = 9;
    blockadeState.pieces[0].state = 'on board';

    // Red rolls 4: needs to pass through index 10 (blockaded)
    const rolledBlock = LudoEngine.rollDice(blockadeState, 4);
    const movePastBlock = LudoRulesEngine.getLegalMoves(rolledBlock).find(m => m.pieceId === 'red-0');
    assert(movePastBlock === undefined, 'Red piece cannot leap over or land on double-piece blockade when blocking is enabled');
    console.log('  ✅ 1.4 Double-piece blockade blocking mechanics verified.');
  }

  // =========================================================================
  // 2. MASSIVE MONTE CARLO STRESS SIMULATION (1,000+ Full Games)
  // =========================================================================
  console.log('\n--- 2. Massive Monte Carlo Stress Simulation (1,000 Games) ---');
  
  const simulationConfigs: Array<{ name: string; players: LudoColor[]; difficulties: LudoAIDifficulty[] }> = [
    { name: '4-Player All Hard AI', players: ['red', 'green', 'yellow', 'blue'], difficulties: ['hard', 'hard', 'hard', 'hard'] },
    { name: '4-Player Mixed AI (Easy/Med/Hard)', players: ['red', 'green', 'yellow', 'blue'], difficulties: ['easy', 'medium', 'hard', 'medium'] },
    { name: '3-Player Tri-Color (Red/Green/Yellow)', players: ['red', 'green', 'yellow'], difficulties: ['medium', 'hard', 'medium'] },
    { name: '3-Player Tri-Color (Red/Yellow/Blue)', players: ['red', 'yellow', 'blue'], difficulties: ['hard', 'medium', 'hard'] },
    { name: '2-Player Diagonal (Red vs Yellow)', players: ['red', 'yellow'], difficulties: ['hard', 'hard'] },
    { name: '2-Player Adjacent (Red vs Green)', players: ['red', 'green'], difficulties: ['medium', 'hard'] },
    { name: '2-Player (Green vs Blue)', players: ['green', 'blue'], difficulties: ['easy', 'hard'] },
  ];

  const totalTargetGames = 1000;
  const gamesPerBatch = Math.floor(totalTargetGames / simulationConfigs.length);

  for (const cfg of simulationConfigs) {
    let batchWins: Record<LudoColor, number> = { red: 0, green: 0, yellow: 0, blue: 0 };

    for (let g = 0; g < gamesPerBatch; g++) {
      let match = LudoEngine.initializeGame(cfg.players, {
        ...DEFAULT_LUDO_POLICIES,
        doublePieceSafety: true,
        blockingEnabled: true,
        maxConsecutiveSixes: 3,
      });
      match = LudoEngine.startGame(match);
      validateDeepStateInvariants(match, `Game ${simulatedGames + 1} start`);

      let turnsInGame = 0;
      const maxTurns = 800; // Hard cutoff to detect pathological infinite loops

      while ((match.status === 'playing' || match.status === 'active') && turnsInGame < maxTurns) {
        // Roll dice
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        match = LudoEngine.rollDice(match, diceRoll);
        validateDeepStateInvariants(match, `Game ${simulatedGames + 1} after roll ${diceRoll}`);

        if (match.turnState === 'move' && match.dice.state === 'rolled') {
          const currentIdx = cfg.players.indexOf(match.currentPlayer);
          const diff = cfg.difficulties[currentIdx % cfg.difficulties.length];

          const t0 = performance.now();
          const selectedMove = LudoAI.selectBestMove(match, diff);
          const t1 = performance.now();
          aiMoveTimes.push(t1 - t0);

          if (selectedMove) {
            const isLegal = LudoEngine.isLegalMove(match, selectedMove);
            assert(isLegal, `AI (${diff}) selected illegal move for piece ${selectedMove.pieceId}`);

            match = LudoEngine.makeMove(match, selectedMove);
            validateDeepStateInvariants(match, `Game ${simulatedGames + 1} after move ${selectedMove.pieceId}`);
          }
        }

        turnsInGame++;
        totalTurns++;
      }

      assert(match.status === 'gameOver' || turnsInGame < maxTurns, `Game exceeded max turns without completing`);
      if (match.winner) {
        batchWins[match.winner]++;
      }
      simulatedGames++;
    }

    console.log(`  ✅ Config [${cfg.name}]: ${gamesPerBatch} games finished cleanly. Wins: ${JSON.stringify(batchWins)}`);
  }

  // =========================================================================
  // 3. HUMAN VS AI & RANDOM EXPLORATORY FUZZING (500 Games)
  // =========================================================================
  console.log('\n--- 3. Human vs AI & Exploratory Random Fuzzing (500 Games) ---');

  for (let fuzzGame = 0; fuzzGame < 500; fuzzGame++) {
    // Random player config
    const availableColors: LudoColor[] = ['red', 'green', 'yellow', 'blue'];
    const numPlayers = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
    const selectedPlayers = availableColors.slice(0, numPlayers);

    let match = LudoEngine.initializeGame(selectedPlayers);
    match = LudoEngine.startGame(match);

    let turns = 0;
    while ((match.status === 'playing' || match.status === 'active') && turns < 700) {
      const roll = Math.floor(Math.random() * 6) + 1;
      match = LudoEngine.rollDice(match, roll);
      validateDeepStateInvariants(match, `Fuzz Game ${fuzzGame} turn ${turns}`);

      if (match.turnState === 'move' && match.dice.state === 'rolled') {
        const legalMoves = LudoRulesEngine.getLegalMoves(match);
        if (legalMoves.length > 0) {
          // 50% chance AI best move, 50% chance random legal move (fuzz human actions)
          const move = Math.random() > 0.5 
            ? LudoAI.selectBestMove(match, 'hard')!
            : legalMoves[Math.floor(Math.random() * legalMoves.length)];

          assert(LudoEngine.isLegalMove(match, move), 'Fuzz move must be legal');
          match = LudoEngine.makeMove(match, move);
          validateDeepStateInvariants(match, `Fuzz Game ${fuzzGame} after move`);
        }
      }
      turns++;
      totalTurns++;
    }
    simulatedGames++;
  }
  console.log(`  ✅ 500 Human vs AI & Exploratory Fuzzing games executed with 100% invariant consistency.`);

  // =========================================================================
  // 4. RESTART CYCLES & LIFECYCLE MEMORY RECLAMATION
  // =========================================================================
  console.log('\n--- 4. Restart Cycles & Lifecycle Stability ---');

  for (let cycle = 0; cycle < 50; cycle++) {
    let state = LudoEngine.initializeGame(['red', 'green', 'yellow', 'blue']);
    state = LudoEngine.startGame(state);

    // Play 15 random moves
    for (let step = 0; step < 15; step++) {
      state = LudoEngine.rollDice(state, 6);
      const moves = LudoRulesEngine.getLegalMoves(state);
      if (moves.length > 0) {
        state = LudoEngine.makeMove(state, moves[0]);
      }
    }

    // Reset game state
    state = LudoEngine.resetGame(state);
    assert(state.status === 'playing' || state.status === 'active', 'Reset game status is active or playing');
    assert(state.winner === null, 'Reset game winner is null');
    assert(state.currentPlayer === 'red', 'Reset game current player is red');
    assert(state.pieces.every(p => p.stepsMoved === 0 && p.position.type === 'base'), 'All 16 pieces returned to base on restart');
  }
  console.log('  ✅ 50 successive Game Restart cycles verified without state leakage.');

  // =========================================================================
  // 5. PERFORMANCE METRICS & BENCHMARKING
  // =========================================================================
  const avgAiTime = aiMoveTimes.length > 0 
    ? aiMoveTimes.reduce((acc, v) => acc + v, 0) / aiMoveTimes.length 
    : 0;
  const avgTurns = totalTurns / simulatedGames;

  console.log('\n============================================================');
  console.log('📊 PERFORMANCE & STRESS QA BENCHMARKS:');
  console.log(`  • Total Games Simulated: ${simulatedGames}`);
  console.log(`  • Total Invariant Verification Checks: ${passed.toLocaleString()}`);
  console.log(`  • Total Game Turns Executed: ${totalTurns.toLocaleString()}`);
  console.log(`  • Average Turns Per Game: ${avgTurns.toFixed(1)}`);
  console.log(`  • Average AI Move Computation Time: ${avgAiTime.toFixed(4)} ms`);
  console.log('============================================================\n');

  return {
    testsExecuted: passed + failed,
    passed,
    failed,
    simulatedGamesCompleted: simulatedGames,
    totalTurnsExecuted: totalTurns,
    averageTurnsPerGame: avgTurns,
    avgAiMoveTimeMs: avgAiTime,
  };
}
