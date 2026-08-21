/** Backtracking solver used both for generation and uniqueness checks. */
class SudokuSolver {
  static candidates(board, index) {
    if (board[index]) return [];
    const row = Math.floor(index / 9), col = index % 9, used = new Set();
    for (let i = 0; i < 9; i++) { used.add(board[row * 9 + i]); used.add(board[i * 9 + col]); }
    const boxRow = Math.floor(row / 3) * 3, boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) for (let c = boxCol; c < boxCol + 3; c++) used.add(board[r * 9 + c]);
    return [1,2,3,4,5,6,7,8,9].filter(n => !used.has(n));
  }

  static solve(input, randomize = false, stats = null) {
    const board = input.slice();
    const search = () => {
      let best = -1, choices = null;
      for (let i = 0; i < 81; i++) if (!board[i]) {
        const options = this.candidates(board, i);
        if (!options.length) return false;
        if (!choices || options.length < choices.length) { best = i; choices = options; if (options.length === 1) break; }
      }
      if (best < 0) return true;
      if (randomize) choices.sort(() => Math.random() - .5);
      if (stats) { stats.nodes++; if (choices.length > 1) stats.branches++; }
      for (const n of choices) { board[best] = n; if (search()) return true; board[best] = 0; if (stats) stats.backtracks++; }
      return false;
    };
    return search() ? board : null;
  }

  static countSolutions(input, limit = 2) {
    const board = input.slice(); let count = 0;
    const search = () => {
      if (count >= limit) return;
      let best = -1, choices = null;
      for (let i = 0; i < 81; i++) if (!board[i]) {
        const opts = this.candidates(board, i);
        if (!opts.length) return;
        if (!choices || opts.length < choices.length) { best = i; choices = opts; }
      }
      if (best < 0) { count++; return; }
      for (const n of choices) { board[best] = n; search(); board[best] = 0; }
    };
    search(); return count;
  }
}
if (typeof module !== 'undefined') module.exports = SudokuSolver;
