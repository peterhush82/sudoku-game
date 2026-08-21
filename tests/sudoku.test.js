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
