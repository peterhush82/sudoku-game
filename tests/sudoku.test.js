const assert = require('assert');
global.SudokuSolver = require('../js/sudoku-solver.js');
const { SudokuGenerator, DIFFICULTIES } = require('../js/sudoku-generator.js');

const known = [5,3,0,0,7,0,0,0,0,6,0,0,1,9,5,0,0,0,0,9,8,0,0,0,0,6,0,8,0,0,0,6,0,0,0,3,4,0,0,8,0,3,0,0,1,7,0,0,0,2,0,0,0,6,0,6,0,0,0,0,2,8,0,0,0,0,4,1,9,0,0,5,0,0,0,0,8,0,0,7,9];
const solved = SudokuSolver.solve(known);
assert(solved && solved.every(Boolean), 'solver should complete a valid puzzle');
assert.equal(SudokuSolver.countSolutions(known), 1, 'known puzzle should have one solution');

for (const level of Object.keys(DIFFICULTIES)) {
  const game = SudokuGenerator.generate(level);
  assert.equal(game.puzzle.length, 81);
  assert.equal(SudokuSolver.countSolutions(game.puzzle), 1, `${level} puzzle must be unique`);
  assert.deepEqual(SudokuSolver.solve(game.puzzle), game.solution, `${level} solution should match`);
}
console.log('Solver and all four difficulty generators passed.');

const GameRules = require('../js/game-rules.js');
assert(GameRules.isPeer(0, 8), 'cells in the same row are peers');
assert(GameRules.isPeer(0, 72), 'cells in the same column are peers');
assert(GameRules.isPeer(0, 20), 'cells in the same box are peers');
assert(!GameRules.isPeer(0, 40), 'unrelated cells are not peers');

const notes = Array.from({ length: 81 }, () => [1, 3, 7]);
const cleaned = GameRules.removePeerNotes(notes, 0, 7);
assert(!cleaned[8].includes(7) && !cleaned[72].includes(7) && !cleaned[20].includes(7), 'peer candidates should be removed');
assert(cleaned[40].includes(7), 'unrelated candidates should remain');
assert.equal(GameRules.digitCounts([1,1,2,9,9,9])[9], 3, 'digit counts include every placed value');
console.log('Highlight, candidate cleanup, and digit completion rules passed.');
