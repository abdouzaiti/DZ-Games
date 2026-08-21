/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runAllTests as runGameEngineTests } from './gameEngine.test';
import { runMostaganemRulesTests } from './mostaganemRules.test';
import { runBoardEngineTests } from './boardEngine.test';
import { runTurnAndDrawTests } from './turnAndDraw.test';
import { runRoundMatchLifecycleTests } from './roundMatchLifecycle.test';
import { runDominoAITests } from './dominoAI.test';
import { runQAStressTestSuite } from './qaStressTestSuite.test';
import { runPhase10QATests as runChessQATests } from '../chess/tests/phase10.test';
import { runLudoTests } from '../ludo/tests/ludo.test';
import { runLudoStressQASuite } from '../ludo/tests/ludoStressQA.test';

try {
  runGameEngineTests();
  runMostaganemRulesTests();
  runBoardEngineTests();
  runTurnAndDrawTests();
  runRoundMatchLifecycleTests();
  runDominoAITests();
  runQAStressTestSuite();
  runChessQATests();
  runLudoTests();
  runLudoStressQASuite();
  process.exit(0);
} catch (err) {
  console.error('❌ Test failed:', err);
  process.exit(1);
}

