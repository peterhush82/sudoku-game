const DIFFICULTIES = {
  beginner: { label: '初级', clues: 42, caption: '适合入门' },
  medium: { label: '中级', clues: 35, caption: '需要一定推理' },
  advanced: { label: '高级', clues: 29, caption: '需要较复杂逻辑' },
  expert: { label: '超难', clues: 25, caption: '适合有经验玩家' }
};

class SudokuGenerator {
  static generate(level = 'medium') {
    const config = DIFFICULTIES[level] || DIFFICULTIES.medium;
    // Randomized full solution, then symmetric clue removal with a uniqueness test.
    let solution = SudokuSolver.solve(Array(81).fill(0), true);
    let puzzle = solution.slice();
    const pairs = Array.from({length: 41}, (_, i) => i).sort(() => Math.random() - .5);
    for (const index of pairs) {
      if (puzzle.filter(Boolean).length <= config.clues) break;
      const mirror = 80 - index, oldA = puzzle[index], oldB = puzzle[mirror];
      puzzle[index] = puzzle[mirror] = 0;
      if (puzzle.filter(Boolean).length < config.clues || SudokuSolver.countSolutions(puzzle) !== 1) {
        puzzle[index] = oldA; puzzle[mirror] = oldB;
      }
    }
    // Some grids resist symmetric removal; finish one clue at a time while preserving uniqueness.
    const remaining = Array.from({length:81},(_,i)=>i).sort(()=>Math.random()-.5);
    for (const i of remaining) if (puzzle[i] && puzzle.filter(Boolean).length > config.clues) {
      const old = puzzle[i]; puzzle[i] = 0;
      if (SudokuSolver.countSolutions(puzzle) !== 1) puzzle[i] = old;
    }
    return { puzzle, solution, difficulty: level };
  }
}
if (typeof module !== 'undefined') module.exports = { SudokuGenerator, DIFFICULTIES };
