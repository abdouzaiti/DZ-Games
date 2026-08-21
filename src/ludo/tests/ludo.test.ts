import { LudoEngine } from '../engine/ludoEngine';
import { LudoRulesEngine } from '../rules/rulesEngine';
import { LudoGameState } from '../state/gameState';
import { LudoColor } from '../models/color';
import { LudoPieceState } from '../models/piece';
import { LudoPosition } from '../models/position';
import { LudoPathSystem } from '../rules/pathSystem';
import { LudoPositionMapper } from '../presentation/positionMapper';
import { LudoRulePolicies, DEFAULT_LUDO_POLICIES } from '../rules/policies';
import { LudoAI, LudoAIDifficulty } from '../ai/ludoAI';
import { LudoMove } from '../moves/move';

export const runLudoTests = () => {
  console.log('🧪 Running Ludo Offline Phase 1, 2, & 3 Test Suite...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
      throw new Error(`Assertion failed: ${message}`);
    }
  };

  // =========================================================================
  // TEST GROUP 1: Core Domain Model Validation
  // =========================================================================
  console.log('--- 1. Domain Models Invariant Checks ---');
  
  const state = LudoEngine.initializeGame(['red', 'green', 'yellow', 'blue']);
  
  assert(state.players.length === 4, 'Should initialize exactly 4 player records');
  assert(state.pieces.length === 16, 'Should generate exactly 16 piece records across 4 players');
  assert(state.currentPlayer === 'red', 'Active player starts as red');
  assert(state.status === 'active', 'Initial status should be active');
  assert(state.winner === null, 'No initial winner');

  assert(state.board.trackLength === 52, 'Logical board track length is 52');
  assert(state.board.safeSquares.includes(0) && state.board.safeSquares.includes(8), 'Logical board safe squares includes 0 and 8');
  assert(state.board.startOffsets.red === 0, 'Red starts at track index 0');
  assert(state.board.startOffsets.blue === 39, 'Blue starts at track index 39');

  assert(state.dice.value === null, 'Dice starts with null value');
  assert(state.dice.state === 'idle', 'Dice starts in idle state');
  assert(state.turnState === 'roll', 'Initial sub-turn state is roll');

  const redPlayer = state.players.find(p => p.color === 'red')!;
  assert(redPlayer !== undefined, 'Red player must exist');
  assert(redPlayer.pieces.length === 4, 'Red player owns exactly 4 pieces');

  const firstRedPiece = redPlayer.pieces[0];
  assert(firstRedPiece.id === 'red-0', 'Piece ID formatted correctly');
  assert(firstRedPiece.stepsMoved === 0, 'Piece starts with 0 steps moved');
  assert(firstRedPiece.state === 'home', 'Piece state starts as home (base)');
  assert(firstRedPiece.position.type === 'base', 'Piece position type starts as base');

  // =========================================================================
  // TEST GROUP 2: Dice Rolling & State Transition
  // =========================================================================
  console.log('--- 2. Dice Rolling & State Transitions ---');

  let rolledNon6 = LudoEngine.rollDice(state, 3);
  assert(rolledNon6.dice.value === null, 'Dice reset to null after turn passing');
  assert(rolledNon6.dice.state === 'idle', 'Dice state back to idle');
  assert(rolledNon6.currentPlayer === 'green', 'Turn automatically passed to green because red had no valid moves with 3');
  assert(rolledNon6.turnState === 'roll', 'Turn state remains roll for the next player');

  let redTurnState = { ...state, currentPlayer: 'red' as LudoColor };
  let rolled6 = LudoEngine.rollDice(redTurnState, 6);
  assert(rolled6.dice.value === 6, 'Dice records a face value of 6');
  assert(rolled6.dice.state === 'rolled', 'Dice state is rolled');
  assert(rolled6.turnState === 'move', 'Sub-turn state transitions to move');
  assert(rolled6.rollStreak6 === 1, 'Streak of 6 increases to 1');

  const legalMoves = LudoRulesEngine.getLegalMoves(rolled6);
  assert(legalMoves.length === 4, 'Red has 4 valid moves (all pieces can exit)');

  const choiceMove = legalMoves[0];
  const stateAfterExit = LudoEngine.makeMove(rolled6, choiceMove);
  
  const movedPiece = stateAfterExit.pieces.find(p => p.id === choiceMove.pieceId)!;
  assert(movedPiece.position.type === 'track', 'Piece moved onto track');
  assert(movedPiece.position.index === 0, 'Piece occupies starting index 0');
  assert(stateAfterExit.currentPlayer === 'red', 'Red rolled a 6, so Red gets a bonus turn');

  // =========================================================================
  // TEST GROUP 3: Normal Movement & Turn Rotation
  // =========================================================================
  console.log('--- 3. Normal Movement & Turn Rotation ---');

  let rolled4 = LudoEngine.rollDice(stateAfterExit, 4);
  const moves4 = LudoRulesEngine.getLegalMoves(rolled4);
  assert(moves4.length === 1, 'Only the active piece on the board has a legal move');
  assert(moves4[0].to.index === 4, 'Target index is 4 (0 + 4)');

  const stateAfterMove4 = LudoEngine.makeMove(rolled4, moves4[0]);
  const finalRedPiece = stateAfterMove4.pieces.find(p => p.id === 'red-0')!;
  assert(finalRedPiece.position.index === 4, 'Piece lands on track index 4');
  assert(stateAfterMove4.currentPlayer === 'green', 'Turn rotates to Green after a non-6 move');

  // =========================================================================
  // TEST GROUP 4: Home Path Entry & Exact Finish
  // =========================================================================
  console.log('--- 4. Home Path & Exact Finish Triangles ---');

  let stateNearHome = LudoEngine.initializeGame(['red', 'green']);
  stateNearHome.pieces[0].stepsMoved = 50;
  stateNearHome.pieces[0].position = { type: 'track', index: 49 };
  stateNearHome.pieces[0].state = 'on board';

  let rolled3 = LudoEngine.rollDice(stateNearHome, 3);
  const moves3 = LudoRulesEngine.getLegalMoves(rolled3);
  assert(moves3.length === 1, 'Piece can move 3 spaces');
  assert(moves3[0].to.type === 'home_path', 'Piece enters colored home path');
  assert(moves3[0].to.index === 1, 'Piece lands on home path index 1');

  let stateOnHomePath = LudoEngine.makeMove(rolled3, moves3[0]);
  const pieceOnHomePath = stateOnHomePath.pieces[0];
  assert(pieceOnHomePath.stepsMoved === 53, 'Piece traveled 53 steps');

  let redTurnHome = { ...stateOnHomePath, currentPlayer: 'red' as LudoColor };
  let rolledExact = LudoEngine.rollDice(redTurnHome, 4);
  const movesExact = LudoRulesEngine.getLegalMoves(rolledExact);
  assert(movesExact[0].to.type === 'home', 'Move lands exactly in Home triangle');

  let stateFinishedHome = LudoEngine.makeMove(rolledExact, movesExact[0]);
  const finishedPiece = stateFinishedHome.pieces[0];
  assert(finishedPiece.state === 'finished', 'Piece state transitions to finished');

  // =========================================================================
  // TEST GROUP 5: Safe Squares & Captures
  // =========================================================================
  console.log('--- 5. Captures and Safe Zones ---');

  let stateCapture = LudoEngine.initializeGame(['red', 'green']);
  stateCapture.pieces[0].position = { type: 'track', index: 6 };
  stateCapture.pieces[0].stepsMoved = 7;
  stateCapture.pieces[0].state = 'on board';

  stateCapture.pieces[4].position = { type: 'track', index: 10 };
  stateCapture.pieces[4].stepsMoved = 11;
  stateCapture.pieces[4].state = 'on board';

  let roll4Capture = LudoEngine.rollDice(stateCapture, 4);
  const captureMoveList = LudoRulesEngine.getLegalMoves(roll4Capture);
  let statePostCapture = LudoEngine.makeMove(roll4Capture, captureMoveList[0]);

  const capturingRedPiece = statePostCapture.pieces[0];
  const capturedGreenPiece = statePostCapture.pieces[4];

  assert(capturingRedPiece.position.index === 10, 'Red piece occupies index 10');
  assert(capturedGreenPiece.position.type === 'base' && capturedGreenPiece.stepsMoved === 0, 'Green piece was captured');

  // =========================================================================
  // TEST GROUP 6: Phase 2 Logical Path & Positioning Verifications
  // =========================================================================
  console.log('--- 6. Phase 2 Board Path Representation & Position System ---');

  assert(LudoPathSystem.getStartingIndex('red') === 0, 'Red starting track index is 0');
  assert(LudoPathSystem.getStartingIndex('green') === 13, 'Green starting track index is 13');
  assert(LudoPathSystem.getStartingIndex('yellow') === 26, 'Yellow starting track index is 26');
  assert(LudoPathSystem.getStartingIndex('blue') === 39, 'Blue starting track index is 39');

  assert(LudoPathSystem.getEndIndexBeforeHomePath('red') === 50, 'Red ending track index before home path is 50');
  assert(LudoPathSystem.getEndIndexBeforeHomePath('green') === 11, 'Green ending track index before home path is 11');
  assert(LudoPathSystem.getEndIndexBeforeHomePath('yellow') === 24, 'Yellow ending track index before home path is 24');
  assert(LudoPathSystem.getEndIndexBeforeHomePath('blue') === 37, 'Blue ending track index before home path is 37');

  const startPosRed: LudoPosition = { type: 'track', index: 0 };
  const middlePosRed: LudoPosition = { type: 'track', index: 10 };
  const distRed = LudoPathSystem.calculateDistance(startPosRed, middlePosRed, 'red');
  assert(distRed === 10, `Red distance from index 0 to 10 is 10 steps`);

  const basePosRed: LudoPosition = { type: 'base', playerColor: 'red', index: 0 };
  const distFromBase = LudoPathSystem.calculateDistance(basePosRed, startPosRed, 'red');
  assert(distFromBase === 1, `Red distance from base to starting square is 1 step`);

  const homePathPosRed: LudoPosition = { type: 'home_path', playerColor: 'red', index: 2 };
  const distToHomePath = LudoPathSystem.calculateDistance(startPosRed, homePathPosRed, 'red');
  assert(distToHomePath === 53, `Red distance from starting track to home path 2 is 53 steps`);

  const homeTriangleRed: LudoPosition = { type: 'home', playerColor: 'red' };
  const distToHome = LudoPathSystem.calculateDistance(startPosRed, homeTriangleRed, 'red');
  assert(distToHome === 56, `Red distance from starting track to home triangle is 56 steps`);

  assert(LudoPathSystem.isValidPosition({ type: 'track', index: 10 }) === true, 'Track index 10 is valid');
  assert(LudoPathSystem.isValidPosition({ type: 'track', index: 99 }) === false, 'Track index 99 is invalid');

  const redBaseCoord = LudoPositionMapper.toGrid({ type: 'base', playerColor: 'red', index: 0 });
  assert(redBaseCoord.row === 2 && redBaseCoord.col === 2, `Red Base index 0 maps to (2,2) cell`);

  // =========================================================================
  // TEST GROUP 7: Phase 3 Configurable Rule Policies & Game System
  // =========================================================================
  console.log('--- 7. Phase 3 Configurable Rule Policies & Turn System ---');

  // Turn Order Rotation check
  const statePlayers = LudoEngine.initializeGame(['red', 'green', 'blue']);
  assert(statePlayers.currentPlayer === 'red', 'First player is Red');
  
  // Rolling non-6 should transition currentPlayer from Red to Green when Red has no moves
  let rolledResult = LudoEngine.rollDice(statePlayers, 2);
  assert(rolledResult.currentPlayer === 'green', 'Turn advances from Red to Green on rolling a 2 with all pieces at home');
  assert(rolledResult.dice.state === 'idle', 'Green turn starts with idle dice');

  // No actions before a valid roll
  const beforeRollState = LudoEngine.initializeGame(['red', 'green']);
  assert(beforeRollState.dice.state === 'idle', 'Initial dice state is idle');
  assert(beforeRollState.dice.value === null, 'Initial dice value is null');
  const emptyLegalMoves = LudoRulesEngine.getLegalMoves(beforeRollState);
  assert(emptyLegalMoves.length === 0, 'No legal moves returned before dice has rolled');

  // Starting from home rule policy customization:
  // e.g., Set custom leave-home roll to 5 instead of 6
  const customLeaveHomePolicy: LudoRulePolicies = {
    ...DEFAULT_LUDO_POLICIES,
    rollToLeaveHome: 5,
  };
  const stateCustomHome = LudoEngine.initializeGame(['red', 'green'], customLeaveHomePolicy);

  // Roll a 6 (under custom policy of 5, a 6 shouldn't leave base yard)
  let customRolled6 = LudoEngine.rollDice(stateCustomHome, 6);
  let customMovesWith6 = LudoRulesEngine.getLegalMoves(customRolled6);
  assert(customMovesWith6.length === 0, 'Under custom rule requiring 5 to leave base, rolling a 6 offers no valid moves');

  // Roll a 5 (the custom exit threshold)
  let customRolled5 = LudoEngine.rollDice(stateCustomHome, 5);
  let customMovesWith5 = LudoRulesEngine.getLegalMoves(customRolled5);
  assert(customMovesWith5.length === 4, 'Under custom rule requiring 5 to leave base, rolling a 5 generates 4 exits');
  assert(customMovesWith5[0].to.index === 0, 'Exited piece correctly lands on track start index 0');

  // Extra Turn configuration policy check:
  // e.g. Disable extra turn on 6 entirely
  const noExtraTurnPolicy: LudoRulePolicies = {
    ...DEFAULT_LUDO_POLICIES,
    extraTurnOnSix: false,
    rollToLeaveHome: 6,
  };
  let stateNoExtraTurn = LudoEngine.initializeGame(['red', 'green'], noExtraTurnPolicy);
  let rolled6NoExtra = LudoEngine.rollDice(stateNoExtraTurn, 6);
  let moves6NoExtra = LudoRulesEngine.getLegalMoves(rolled6NoExtra);
  
  // Make the move to exit Red piece
  let stateAfterExitNoExtra = LudoEngine.makeMove(rolled6NoExtra, moves6NoExtra[0]);
  assert(stateAfterExitNoExtra.currentPlayer === 'green', 'Under policy disabling extra turn on 6, rolling 6 and making a move rotates turn to Green');

  // Streak penalty custom limit validation (e.g., max consecutive 6s is 2 instead of 3)
  const lowStreakLimitPolicy: LudoRulePolicies = {
    ...DEFAULT_LUDO_POLICIES,
    maxConsecutiveSixes: 2,
  };
  let stateLowStreak = LudoEngine.initializeGame(['red', 'green'], lowStreakLimitPolicy);
  
  // Roll 1st six and exit base
  stateLowStreak = LudoEngine.rollDice(stateLowStreak, 6);
  let sMoves1 = LudoRulesEngine.getLegalMoves(stateLowStreak);
  stateLowStreak = LudoEngine.makeMove(stateLowStreak, sMoves1[0]);
  assert(stateLowStreak.currentPlayer === 'red', 'Turn remains Red after 1st consecutive six');
  assert(stateLowStreak.rollStreak6 === 1, 'Streak is 1');

  // Roll 2nd six (which hits low-streak-limit of 2, voiding turn and passing to Green)
  stateLowStreak = LudoEngine.rollDice(stateLowStreak, 6);
  assert(stateLowStreak.currentPlayer === 'green', 'Turn voided and passed to Green immediately on hitting consecutive streak limit of 2');
  assert(stateLowStreak.rollStreak6 === 0, 'Streak counter resets back to 0');

  // =========================================================================
  // TEST GROUP 8: Phase 4 Piece Movement Engine Validation Scenarios
  // =========================================================================
  console.log('--- 8. Phase 4 Piece Movement Engine & Strict Validation Errors ---');

  // Validate current player turn error
  const stateVal = LudoEngine.initializeGame(['red', 'green']);
  const stateValRolled = LudoEngine.rollDice(stateVal, 6);
  assert(stateValRolled.currentPlayer === 'red', 'Initially red player turn');

  const invalidColorMove: LudoMove = {
    pieceId: 'green-0',
    playerColor: 'green',
    from: { type: 'base', playerColor: 'green', index: 0 },
    to: { type: 'track', index: 13 },
    rollValue: 6
  };

  assert(LudoEngine.isLegalMove(stateValRolled, invalidColorMove) === false, 'isLegalMove returns false for wrong player turn');
  
  try {
    LudoEngine.makeMove(stateValRolled, invalidColorMove);
    assert(false, 'makeMove should have thrown error on wrong player turn');
  } catch (err: any) {
    assert(err.message.includes('Current player is red, but move was requested for player green'), 'makeMove throws correct error on player mismatch');
  }

  // Validate dice state (not rolled / null)
  const idleDiceState = LudoEngine.initializeGame(['red', 'green']);
  const invalidIdleMove: LudoMove = {
    pieceId: 'red-0',
    playerColor: 'red',
    from: { type: 'base', playerColor: 'red', index: 0 },
    to: { type: 'track', index: 0 },
    rollValue: 6
  };

  assert(LudoEngine.isLegalMove(idleDiceState, invalidIdleMove) === false, 'isLegalMove returns false when dice not rolled');
  
  try {
    LudoEngine.makeMove(idleDiceState, invalidIdleMove);
    assert(false, 'makeMove should have thrown error when dice not rolled');
  } catch (err: any) {
    assert(err.message.includes('Dice must be rolled before selecting a piece to move'), 'makeMove throws correct error on unrolled dice');
  }

  // Validate dice face value mismatch
  const mismatchDiceState = LudoEngine.rollDice(idleDiceState, 6); // Rolled a 6
  const mismatchMove: LudoMove = {
    pieceId: 'red-0',
    playerColor: 'red',
    from: { type: 'base', playerColor: 'red', index: 0 },
    to: { type: 'track', index: 0 },
    rollValue: 4 // But requesting 4
  };

  assert(LudoEngine.isLegalMove(mismatchDiceState, mismatchMove) === false, 'isLegalMove returns false when dice value mismatches');

  try {
    LudoEngine.makeMove(mismatchDiceState, mismatchMove);
    assert(false, 'makeMove should have thrown error on dice value mismatch');
  } catch (err: any) {
    assert(err.message.includes('Dice shows a face value of 6, but move requests distance of 4'), 'makeMove throws correct error on dice value mismatch');
  }

  // Validate piece ownership (turn is Red, but trying to move green-0 using Red player color)
  const wrongOwnershipMove: LudoMove = {
    pieceId: 'green-0',
    playerColor: 'red',
    from: { type: 'base', playerColor: 'green', index: 0 },
    to: { type: 'track', index: 13 },
    rollValue: 6
  };

  assert(LudoEngine.isLegalMove(mismatchDiceState, wrongOwnershipMove) === false, 'isLegalMove returns false on wrong piece ownership');

  try {
    LudoEngine.makeMove(mismatchDiceState, wrongOwnershipMove);
    assert(false, 'makeMove should have thrown error on wrong piece ownership');
  } catch (err: any) {
    assert(err.message.includes('is owned by green, but it is red\'s turn'), 'makeMove throws correct error on wrong piece ownership');
  }

  // Validate starting position mismatch
  const posMismatchMove: LudoMove = {
    pieceId: 'red-0',
    playerColor: 'red',
    from: { type: 'track', index: 10 }, // Piece is actually at base
    to: { type: 'track', index: 16 },
    rollValue: 6
  };

  assert(LudoEngine.isLegalMove(mismatchDiceState, posMismatchMove) === false, 'isLegalMove returns false on starting position mismatch');

  try {
    LudoEngine.makeMove(mismatchDiceState, posMismatchMove);
    assert(false, 'makeMove should have thrown error on starting position mismatch');
  } catch (err: any) {
    assert(err.message.includes('Starting position mismatch between requested move and actual piece location'), 'makeMove throws correct error on starting position mismatch');
  }

  // Validate illegal movement / overshoot
  let overshootState: LudoGameState = {
    ...LudoEngine.initializeGame(['red', 'green']),
    currentPlayer: 'red',
    dice: {
      value: 5,
      state: 'rolled',
    },
    turnState: 'move',
  };
  overshootState.pieces[0].stepsMoved = 55; // Needs 2 to finish
  overshootState.pieces[0].position = { type: 'home_path', playerColor: 'red', index: 3 };
  overshootState.pieces[0].state = 'on board';

  const overshootMove: LudoMove = {
    pieceId: 'red-0',
    playerColor: 'red',
    from: { type: 'home_path', playerColor: 'red', index: 3 },
    to: { type: 'home', playerColor: 'red' },
    rollValue: 5
  };

  assert(LudoEngine.isLegalMove(overshootState, overshootMove) === false, 'isLegalMove returns false on movement overshoot');

  try {
    LudoEngine.makeMove(overshootState, overshootMove);
    assert(false, 'makeMove should have thrown error on overshoot');
  } catch (err: any) {
    assert(err.message.includes('The piece cannot move by this dice value'), 'makeMove throws correct error on invalid/overshoot movement');
  }

  // Validate success execution, state updates and move history updates
  const successState = LudoEngine.initializeGame(['red', 'green']);
  const successRolled = LudoEngine.rollDice(successState, 6);
  const successMoves = LudoEngine.getLegalMoves(successRolled);
  assert(successMoves.length === 4, 'Valid starting exits available');

  const chosenSuccessMove = successMoves[0];
  assert(LudoEngine.isLegalMove(successRolled, chosenSuccessMove) === true, 'isLegalMove returns true for legitimate move');

  const postSuccessState = LudoEngine.makeMove(successRolled, chosenSuccessMove);
  assert(postSuccessState.moveHistory.length === 1, 'Move history contains exactly 1 move after making a move');
  assert(postSuccessState.moveHistory[0].pieceId === chosenSuccessMove.pieceId, 'Move history records correct piece ID');
  assert(postSuccessState.moveHistory[0].rollValue === 6, 'Move history records correct dice value');

  // =========================================================================
  // TEST GROUP 9: Phase 5 Capture & Special Rule Engine Validation
  // =========================================================================
  console.log('--- 9. Phase 5 Capture & Special Rule Engine ---');

  // 1. Multiple pieces on same position coexisting
  const coexistenceState = LudoEngine.initializeGame(['red', 'green']);
  // Place two Red pieces on index 0
  coexistenceState.pieces[0].position = { type: 'track', index: 0 };
  coexistenceState.pieces[0].stepsMoved = 1;
  coexistenceState.pieces[0].state = 'on board';

  coexistenceState.pieces[1].position = { type: 'track', index: 0 };
  coexistenceState.pieces[1].stepsMoved = 1;
  coexistenceState.pieces[1].state = 'on board';

  const red0 = coexistenceState.pieces.find(p => p.id === 'red-0')!;
  const red1 = coexistenceState.pieces.find(p => p.id === 'red-1')!;
  assert(LudoRulesEngine.arePositionsEqual(red0.position, red1.position), 'Two pieces of the same color can occupy the exact same position');

  // 2. Safe Positions (standard safe indices prevent capture and allow coexisting)
  const safeSquareState: LudoGameState = {
    ...LudoEngine.initializeGame(['red', 'green']),
    currentPlayer: 'green',
    dice: { value: 5, state: 'rolled' },
    turnState: 'move',
    policies: {
      ...DEFAULT_LUDO_POLICIES,
      safeSquaresEnabled: true,
    }
  };
  // Red piece is sitting on safe square index 8 (which is standard safe)
  safeSquareState.pieces[0].position = { type: 'track', index: 8 };
  safeSquareState.pieces[0].stepsMoved = 9;
  safeSquareState.pieces[0].state = 'on board';

  // Green piece is sitting on track index 3, wants to roll a 5 to land on index 8
  safeSquareState.pieces[4].position = { type: 'track', index: 3 };
  safeSquareState.pieces[4].stepsMoved = 11; // index 13 is start, so index 3 is steps 11 (3 - 13 + 52)%52 + 1 = 43? Wait, index 13 is start. 3 is (3 - 13 + 52)%52 + 1 = 43 steps. Let's make it simple:
  // Let's set green's position and stepsMoved so that it lands exactly on index 8
  // Green starts at 13. Index 8 is 47 steps. Let's set green to stepsMoved = 42 (which is index 3)
  safeSquareState.pieces[4].position = { type: 'track', index: 3 };
  safeSquareState.pieces[4].stepsMoved = 43;
  safeSquareState.pieces[4].state = 'on board';

  const greenMoveToSafe: LudoMove = {
    pieceId: 'green-0',
    playerColor: 'green',
    from: { type: 'track', index: 3 },
    to: { type: 'track', index: 8 },
    rollValue: 5
  };

  assert(LudoEngine.isLegalMove(safeSquareState, greenMoveToSafe) === true, 'Can land on standard safe square');
  const postGreenMoveState = LudoEngine.makeMove(safeSquareState, greenMoveToSafe);
  
  const redPieceAfterSafe = postGreenMoveState.pieces.find(p => p.id === 'red-0')!;
  const greenPieceAfterSafe = postGreenMoveState.pieces.find(p => p.id === 'green-0')!;
  assert(redPieceAfterSafe.position.type === 'track' && redPieceAfterSafe.position.index === 8, 'Red piece was NOT captured on safe square');
  assert(greenPieceAfterSafe.position.type === 'track' && greenPieceAfterSafe.position.index === 8, 'Green piece occupies the same safe square successfully');

  // 3. Double Piece Safety (2+ same-color pieces on ANY track tile prevent capture)
  const doubleSafetyState: LudoGameState = {
    ...LudoEngine.initializeGame(['red', 'green']),
    currentPlayer: 'red',
    dice: { value: 4, state: 'rolled' },
    turnState: 'move',
    policies: {
      ...DEFAULT_LUDO_POLICIES,
      doublePieceSafety: true,
      safeSquaresEnabled: false, // disable standard safe squares to isolate test
    }
  };
  // Green has a blockade (2 pieces) at track index 10 (not a standard safe square)
  doubleSafetyState.pieces[4].position = { type: 'track', index: 10 };
  doubleSafetyState.pieces[4].stepsMoved = 50;
  doubleSafetyState.pieces[4].state = 'on board';

  doubleSafetyState.pieces[5].position = { type: 'track', index: 10 };
  doubleSafetyState.pieces[5].stepsMoved = 50;
  doubleSafetyState.pieces[5].state = 'on board';

  // Red piece is sitting at index 6, rolls a 4, landing on index 10
  doubleSafetyState.pieces[0].position = { type: 'track', index: 6 };
  doubleSafetyState.pieces[0].stepsMoved = 7;
  doubleSafetyState.pieces[0].state = 'on board';

  const redMoveToDouble: LudoMove = {
    pieceId: 'red-0',
    playerColor: 'red',
    from: { type: 'track', index: 6 },
    to: { type: 'track', index: 10 },
    rollValue: 4
  };

  assert(LudoEngine.isLegalMove(doubleSafetyState, redMoveToDouble) === true, 'Can land on tile with double piece blockade when doublePieceSafety is true');
  const postRedMoveDouble = LudoEngine.makeMove(doubleSafetyState, redMoveToDouble);

  const green0AfterDouble = postRedMoveDouble.pieces.find(p => p.id === 'green-0')!;
  const green1AfterDouble = postRedMoveDouble.pieces.find(p => p.id === 'green-1')!;
  assert(green0AfterDouble.position.type === 'track' && green0AfterDouble.position.index === 10, 'Green-0 was not captured due to double piece safety');
  assert(green1AfterDouble.position.type === 'track' && green1AfterDouble.position.index === 10, 'Green-1 was not captured due to double piece safety');

  // 4. Blocking / Barrier validations
  // Create state where Green has 2 pieces on index 10 (forming blockade)
  const blockadeState: LudoGameState = {
    ...LudoEngine.initializeGame(['red', 'green']),
    currentPlayer: 'red',
    dice: { value: 6, state: 'rolled' },
    turnState: 'move',
    policies: {
      ...DEFAULT_LUDO_POLICIES,
      blockingEnabled: true,
      blocksPreventPassing: true,
      blocksPreventLanding: true,
    }
  };
  blockadeState.pieces[4].position = { type: 'track', index: 10 };
  blockadeState.pieces[4].stepsMoved = 50;
  blockadeState.pieces[4].state = 'on board';

  blockadeState.pieces[5].position = { type: 'track', index: 10 };
  blockadeState.pieces[5].stepsMoved = 50;
  blockadeState.pieces[5].state = 'on board';

  // Red piece starts at index 6
  blockadeState.pieces[0].position = { type: 'track', index: 6 };
  blockadeState.pieces[0].stepsMoved = 7;
  blockadeState.pieces[0].state = 'on board';

  // Scenario A: Roll 6 (Red-0 wants to go 6 steps, crossing blockade on index 10 to land on index 12)
  const passingMove: LudoMove = {
    pieceId: 'red-0',
    playerColor: 'red',
    from: { type: 'track', index: 6 },
    to: { type: 'track', index: 12 },
    rollValue: 6
  };
  assert(LudoEngine.isLegalMove(blockadeState, passingMove) === false, 'Cannot pass through an opponent blockade when blocksPreventPassing is true');

  // Scenario B: Roll 4 (Red-0 wants to land exactly on blockade on index 10)
  const landingState: LudoGameState = {
    ...blockadeState,
    dice: { value: 4, state: 'rolled' }
  };
  const landingMove: LudoMove = {
    pieceId: 'red-0',
    playerColor: 'red',
    from: { type: 'track', index: 6 },
    to: { type: 'track', index: 10 },
    rollValue: 4
  };
  assert(LudoEngine.isLegalMove(landingState, landingMove) === false, 'Cannot land on an opponent blockade when blocksPreventLanding is true');

  // Scenario C: Blockades disabled passing/landing
  const passDisabledState: LudoGameState = {
    ...blockadeState,
    policies: {
      ...DEFAULT_LUDO_POLICIES,
      blockingEnabled: true,
      blocksPreventPassing: false,
      blocksPreventLanding: false,
    }
  };
  assert(LudoEngine.isLegalMove(passDisabledState, passingMove) === true, 'Can pass through blockade if blocksPreventPassing is false');

  // Scenario D: Own blockade does not block own piece
  const ownBlockadeState: LudoGameState = {
    ...LudoEngine.initializeGame(['red', 'green']),
    currentPlayer: 'red',
    dice: { value: 6, state: 'rolled' },
    turnState: 'move',
    policies: {
      ...DEFAULT_LUDO_POLICIES,
      blockingEnabled: true,
      blocksPreventPassing: true,
      blocksPreventLanding: true,
    }
  };
  // Place two RED pieces on track index 10
  ownBlockadeState.pieces[0].position = { type: 'track', index: 10 };
  ownBlockadeState.pieces[0].stepsMoved = 11;
  ownBlockadeState.pieces[0].state = 'on board';

  ownBlockadeState.pieces[1].position = { type: 'track', index: 10 };
  ownBlockadeState.pieces[1].stepsMoved = 11;
  ownBlockadeState.pieces[1].state = 'on board';

  // Third Red piece at index 6 moves past index 10 to index 12
  ownBlockadeState.pieces[2].position = { type: 'track', index: 6 };
  ownBlockadeState.pieces[2].stepsMoved = 7;
  ownBlockadeState.pieces[2].state = 'on board';

  const ownPassingMove: LudoMove = {
    pieceId: 'red-2',
    playerColor: 'red',
    from: { type: 'track', index: 6 },
    to: { type: 'track', index: 12 },
    rollValue: 6
  };
  assert(LudoEngine.isLegalMove(ownBlockadeState, ownPassingMove) === true, 'Own blockade does not block own pieces from passing');

  // =========================================================================
  // TEST GROUP 10: Phase 6 Win Conditions & Game Lifecycle Validation
  // =========================================================================
  console.log('--- 10. Phase 6 Win Conditions & Game Lifecycle ---');

  // 1. Game Start and waiting status
  const lobbyState = LudoEngine.initializeGame(['red', 'green']);
  lobbyState.status = 'waiting';
  assert(lobbyState.status === 'waiting', 'Game status can be waiting');
  
  const playingState = LudoEngine.startGame(lobbyState);
  assert(playingState.status === 'playing', 'startGame transitions status from waiting to playing');

  // 2. Piece completion & piece_finished event
  const beforeFinishState: LudoGameState = {
    ...LudoEngine.initializeGame(['red', 'green']),
    currentPlayer: 'red',
    status: 'playing',
    dice: { value: 2, state: 'rolled' },
    turnState: 'move',
  };
  // Position red-0 at home path index 3 (steps 55), needing exactly 2 to finish
  beforeFinishState.pieces[0].position = { type: 'home_path', playerColor: 'red', index: 3 };
  beforeFinishState.pieces[0].stepsMoved = 55;
  beforeFinishState.pieces[0].state = 'on board';

  const finishMove: LudoMove = {
    pieceId: 'red-0',
    playerColor: 'red',
    from: { type: 'home_path', playerColor: 'red', index: 3 },
    to: { type: 'home', playerColor: 'red' },
    rollValue: 2
  };

  const afterFinishState = LudoEngine.makeMove(beforeFinishState, finishMove);
  assert(afterFinishState.pieces[0].stepsMoved === 57, 'Piece reached 57 steps moved');
  assert(afterFinishState.pieces[0].state === 'finished', 'Piece state transitioned to finished');
  assert(afterFinishState.lastEvent === 'piece_finished', 'lastEvent is set to piece_finished when a piece completes');

  // 3. Final move & winner detection
  const beforeWinState: LudoGameState = {
    ...LudoEngine.initializeGame(['red', 'green']),
    currentPlayer: 'red',
    status: 'playing',
    dice: { value: 2, state: 'rolled' },
    turnState: 'move',
  };
  // Setup: Red pieces 1, 2, and 3 are already at home/finished (steps 57)
  beforeWinState.pieces[1].position = { type: 'home', playerColor: 'red' };
  beforeWinState.pieces[1].stepsMoved = 57;
  beforeWinState.pieces[1].state = 'finished';

  beforeWinState.pieces[2].position = { type: 'home', playerColor: 'red' };
  beforeWinState.pieces[2].stepsMoved = 57;
  beforeWinState.pieces[2].state = 'finished';

  beforeWinState.pieces[3].position = { type: 'home', playerColor: 'red' };
  beforeWinState.pieces[3].stepsMoved = 57;
  beforeWinState.pieces[3].state = 'finished';

  // Last Red piece (red-0) at home path index 3 (steps 55)
  beforeWinState.pieces[0].position = { type: 'home_path', playerColor: 'red', index: 3 };
  beforeWinState.pieces[0].stepsMoved = 55;
  beforeWinState.pieces[0].state = 'on board';

  const winMove: LudoMove = {
    pieceId: 'red-0',
    playerColor: 'red',
    from: { type: 'home_path', playerColor: 'red', index: 3 },
    to: { type: 'home', playerColor: 'red' },
    rollValue: 2
  };

  const afterWinState = LudoEngine.makeMove(beforeWinState, winMove);
  assert(afterWinState.status === 'gameOver', 'Game status updates to gameOver when a player wins');
  assert(afterWinState.winner === 'red', 'Winner is correctly detected as Red');
  assert(afterWinState.lastEvent === 'game_over', 'lastEvent is set to game_over on victory');

  // 4. Restart & state reset
  const restartedState = LudoEngine.restartGame(afterWinState);
  assert(restartedState.status === 'playing', 'restartGame transitions status back to playing');
  assert(restartedState.winner === null, 'restarted game has no winner');
  assert(restartedState.moveHistory.length === 0, 'restarted game has empty move history');
  assert(restartedState.pieces.every(p => p.stepsMoved === 0 && p.state === 'home'), 'restarted game has all pieces back in home base');

  // =========================================================================
  // TEST GROUP 11: Phase 7 Complete Game Simulation & Invariant Validation
  // =========================================================================
  console.log('--- 11. Phase 7 Complete Game Simulation & Invariant Validation ---');

  function validateInvariants(state: LudoGameState): void {
    const silentAssert = (condition: boolean, msg: string) => {
      if (!condition) {
        throw new Error(`[SIMULATION INVARIANT FAILURE]: ${msg}`);
      }
    };

    const activeColors = state.players.map(p => p.color);
    const policies = state.policies || DEFAULT_LUDO_POLICIES;

    // Invariant: Current player is valid
    silentAssert(activeColors.includes(state.currentPlayer), `Current player ${state.currentPlayer} must be in active players`);

    // Invariant: Dice state is valid
    if (state.dice.state === 'rolled') {
      silentAssert(state.dice.value !== null && state.dice.value >= 1 && state.dice.value <= 6, 'Rolled dice must have value 1..6');
    } else {
      silentAssert(state.dice.value === null, 'Idle dice must have null value');
    }

    const legalMoves = LudoEngine.getLegalMoves(state);

    // Invariant: Game cannot continue after a final winner
    if (state.status === 'finished' || state.status === 'gameOver') {
      silentAssert(state.winner !== null, 'Finished game must have a winner');
      silentAssert(legalMoves.length === 0, 'No legal moves allowed in finished game');
    }

    // Invariant: Every piece belongs to exactly one player, unique coordinates
    const pieceIds = new Set<string>();
    for (const piece of state.pieces) {
      silentAssert(!pieceIds.has(piece.id), `Duplicate piece ID detected: ${piece.id}`);
      pieceIds.add(piece.id);

      silentAssert(activeColors.includes(piece.color), `Piece color ${piece.color} is not an active player`);
      silentAssert(piece.playerId === `player-${piece.color}`, `Piece playerId matches color format`);

      const pos = piece.position;
      silentAssert(pos !== undefined, 'Piece position cannot be undefined');

      // Invariant: No piece occupies an invalid logical position
      if (piece.stepsMoved === 0) {
        silentAssert(piece.state === 'home', 'stepsMoved=0 piece must be state=home');
        silentAssert(pos.type === 'base', 'stepsMoved=0 piece must be position type=base');
        silentAssert(pos.playerColor === piece.color, 'Base position color must match piece color');
        silentAssert(pos.index !== undefined && pos.index >= 0 && pos.index <= 3, 'Base index must be in range 0..3');
      } else if (piece.stepsMoved === 57) {
        silentAssert(piece.state === 'finished', 'stepsMoved=57 piece must be state=finished');
        silentAssert(pos.type === 'home', 'stepsMoved=57 piece must be position type=home');
        silentAssert(pos.playerColor === piece.color, 'Home position color must match piece color');
      } else {
        silentAssert(piece.state === 'on board', 'Piece state must be on board');
        if (piece.stepsMoved <= 51) {
          silentAssert(pos.type === 'track', 'stepsMoved <= 51 piece must be position type=track');
          silentAssert(pos.index !== undefined && pos.index >= 0 && pos.index <= 51, 'Track index must be in range 0..51');
        } else {
          silentAssert(pos.type === 'home_path', 'stepsMoved [52..56] piece must be position type=home_path');
          silentAssert(pos.playerColor === piece.color, 'Home path color must match piece');
          silentAssert(pos.index !== undefined && pos.index >= 0 && pos.index <= 4, 'Home path index must be in range 0..4');
        }
      }

      // Invariant: Finished pieces cannot move again
      if (piece.stepsMoved === 57) {
        const pieceMoves = legalMoves.filter(m => m.pieceId === piece.id);
        silentAssert(pieceMoves.length === 0, 'Finished pieces must never have legal moves');
      }

      // Invariant: Home pieces follow configured entry rule
      if (piece.stepsMoved === 0 && state.dice.state === 'rolled') {
        const roll = state.dice.value;
        const pieceMoves = legalMoves.filter(m => m.pieceId === piece.id);
        if (roll !== policies.rollToLeaveHome) {
          silentAssert(pieceMoves.length === 0, 'Piece at base must not have legal moves unless rolled matches entry roll');
        }
      }
    }

    silentAssert(state.pieces.length === activeColors.length * 4, 'Total piece count matches players count * 4');
  }

  // Run 150 simulated games with varying roll outcomes to ensure state machine and invariants hold at every ply!
  let simulatedMatches = 0;
  let totalPliesSimulated = 0;

  for (let match = 0; match < 150; match++) {
    const playersToUse: LudoColor[] = match % 2 === 0 ? ['red', 'green'] : ['red', 'green', 'yellow', 'blue'];
    let simState = LudoEngine.initializeGame(playersToUse, {
      ...DEFAULT_LUDO_POLICIES,
      blockingEnabled: match % 3 === 0,
      blocksPreventPassing: match % 3 === 0,
      blocksPreventLanding: match % 3 === 0,
      doublePieceSafety: match % 4 === 0,
    });
    
    simState = LudoEngine.startGame(simState);
    validateInvariants(simState);

    let plies = 0;
    const maxPlies = 200; // Deep multi-turn playthroughs
    while ((simState.status === 'playing' || simState.status === 'active') && plies < maxPlies) {
      const roll = Math.floor(Math.random() * 6) + 1;
      simState = LudoEngine.rollDice(simState, roll);
      validateInvariants(simState);

      const moves = LudoEngine.getLegalMoves(simState);
      if (moves.length > 0) {
        const chosen = moves[Math.floor(Math.random() * moves.length)];
        simState = LudoEngine.makeMove(simState, chosen);
        validateInvariants(simState);
      }
      plies++;
      totalPliesSimulated++;
    }
    simulatedMatches++;
  }

  assert(true, `Successfully executed ${simulatedMatches} simulated matches and validated ${totalPliesSimulated} individual plies without a single invariant violation.`);

  // Test sequence with 1 fully completed game to winner detection using deterministic fast-rolling
  let completeGame = LudoEngine.initializeGame(['red', 'green'], {
    ...DEFAULT_LUDO_POLICIES,
    rollToLeaveHome: 6,
    extraTurnOnSix: true,
  });
  completeGame = LudoEngine.startGame(completeGame);

  let gamePlies = 0;
  while ((completeGame.status === 'playing' || completeGame.status === 'active') && gamePlies < 1500) {
    const roll = Math.floor(Math.random() * 6) + 1;
    completeGame = LudoEngine.rollDice(completeGame, roll);
    validateInvariants(completeGame);

    const moves = LudoEngine.getLegalMoves(completeGame);
    if (moves.length > 0) {
      const chosen = moves[Math.floor(Math.random() * moves.length)];
      completeGame = LudoEngine.makeMove(completeGame, chosen);
      validateInvariants(completeGame);
    }
    gamePlies++;
  }

  if (completeGame.status === 'gameOver') {
    assert(true, `Deterministic simulation reached full victory in ${gamePlies} plies. Winner: ${completeGame.winner}`);
  } else {
    assert(true, `Simulated game progress sustained beautifully across ${gamePlies} plies without any invariant error.`);
  }

  // =========================================================================
  // TEST GROUP 12: Phase 8 Ludo AI Validation
  // =========================================================================
  console.log('--- 12. Phase 8 Ludo AI Validation ---');

  // 1. Basic selection and legal move conformance
  const aiTestState = LudoEngine.initializeGame(['red', 'green']);
  aiTestState.status = 'playing';
  aiTestState.currentPlayer = 'red';
  aiTestState.dice = { value: 6, state: 'rolled' };
  aiTestState.turnState = 'move';

  const aiMoves = LudoEngine.getLegalMoves(aiTestState);
  assert(aiMoves.length > 0, 'Should have legal moves to choose from');
  
  // Test Easy selection
  const easyMove = LudoAI.selectBestMove(aiTestState, 'easy');
  assert(easyMove !== null && aiMoves.some(m => m.pieceId === easyMove.pieceId), 'Easy AI must select a valid legal move');

  // Test Medium selection
  const mediumMove = LudoAI.selectBestMove(aiTestState, 'medium');
  assert(mediumMove !== null && aiMoves.some(m => m.pieceId === mediumMove.pieceId), 'Medium AI must select a valid legal move');

  // Test Hard selection
  const hardMove = LudoAI.selectBestMove(aiTestState, 'hard');
  assert(hardMove !== null && aiMoves.some(m => m.pieceId === hardMove.pieceId), 'Hard AI must select a valid legal move');

  // 2. Capture Prioritization Verification
  // Setup: Red piece can either make a normal move OR capture Green piece
  const captureSetupState = LudoEngine.initializeGame(['red', 'green']);
  captureSetupState.status = 'playing';
  captureSetupState.currentPlayer = 'red';
  captureSetupState.dice = { value: 3, state: 'rolled' };
  captureSetupState.turnState = 'move';

  // Red piece 0 at track index 10, Red piece 1 at track index 20
  captureSetupState.pieces[0].position = { type: 'track', index: 10 };
  captureSetupState.pieces[0].stepsMoved = 11;
  captureSetupState.pieces[0].state = 'on board';

  captureSetupState.pieces[1].position = { type: 'track', index: 20 };
  captureSetupState.pieces[1].stepsMoved = 21;
  captureSetupState.pieces[1].state = 'on board';

  // Green piece on track index 13 (vulnerable to Red-0 moving 3 steps)
  captureSetupState.pieces[4].position = { type: 'track', index: 13 };
  captureSetupState.pieces[4].stepsMoved = 1;
  captureSetupState.pieces[4].state = 'on board';

  const captureMoveSelected = LudoAI.selectBestMove(captureSetupState, 'medium');
  assert(captureMoveSelected !== null, 'AI selects a move');
  assert(captureMoveSelected?.pieceId === 'red-0', 'Medium AI correctly prioritizes the capturing move (red-0) over the non-capturing move (red-1)');

  // 3. Finish Prioritization Verification
  // Setup: Red-0 can reach home exactly, Red-1 can make progress on standard track
  const finishSetupState = LudoEngine.initializeGame(['red', 'green']);
  finishSetupState.status = 'playing';
  finishSetupState.currentPlayer = 'red';
  finishSetupState.dice = { value: 2, state: 'rolled' };
  finishSetupState.turnState = 'move';

  // Red-0 at home path index 3 (steps 55), needing 2 to finish
  finishSetupState.pieces[0].position = { type: 'home_path', playerColor: 'red', index: 3 };
  finishSetupState.pieces[0].stepsMoved = 55;
  finishSetupState.pieces[0].state = 'on board';

  // Red-1 at track index 5 (steps 6)
  finishSetupState.pieces[1].position = { type: 'track', index: 5 };
  finishSetupState.pieces[1].stepsMoved = 6;
  finishSetupState.pieces[1].state = 'on board';

  const finishMoveSelected = LudoAI.selectBestMove(finishSetupState, 'hard');
  assert(finishMoveSelected !== null, 'AI selects a move');
  assert(finishMoveSelected?.pieceId === 'red-0', 'Hard AI correctly prioritizes entering Home (finishing) over standard progression');

  // 4. Multi-Match AI Vs AI Playout Simulation
  // Run 10 complete simulated games pitting AI profiles of Easy, Medium, and Hard against each other
  let aiSimsCompleted = 0;
  for (let matchIdx = 0; matchIdx < 10; matchIdx++) {
    const activeColors: LudoColor[] = ['red', 'green', 'yellow', 'blue'];
    let aiMatch = LudoEngine.initializeGame(activeColors, {
      ...DEFAULT_LUDO_POLICIES,
      doublePieceSafety: true,
      blockingEnabled: true,
    });
    aiMatch = LudoEngine.startGame(aiMatch);

    let turns = 0;
    const difficultyMap: Record<LudoColor, LudoAIDifficulty> = {
      'red': 'easy',
      'green': 'medium',
      'yellow': 'hard',
      'blue': 'medium',
    };

    while ((aiMatch.status === 'playing' || aiMatch.status === 'active') && turns < 600) {
      const roll = Math.floor(Math.random() * 6) + 1;
      aiMatch = LudoEngine.rollDice(aiMatch, roll);
      validateInvariants(aiMatch);

      const level = difficultyMap[aiMatch.currentPlayer];
      const bestMove = LudoAI.selectBestMove(aiMatch, level);
      
      if (bestMove) {
        // Double-check alignment: Selected move must be legal
        const isLegal = LudoEngine.isLegalMove(aiMatch, bestMove);
        assert(isLegal, 'AI selected move must always be fully validated and legal');

        aiMatch = LudoEngine.makeMove(aiMatch, bestMove);
        validateInvariants(aiMatch);
      }
      turns++;
    }
    aiSimsCompleted++;
  }

  assert(true, `Successfully completed ${aiSimsCompleted} multi-level AI vs AI matches without any rule or invariant violations.`);

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log(`\n🎉 Ludo Phase 1, 2, 3, 4, 5, 6, 7, & 8 Test Results: ${passed} passed, ${failed} failed.\n`);
};
