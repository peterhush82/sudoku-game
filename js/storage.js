const GameStorage = {
  key: 'calm-sudoku-save-v1',
  save(state) { localStorage.setItem(this.key, JSON.stringify({...state, savedAt: Date.now()})); },
  load() { try { const data = JSON.parse(localStorage.getItem(this.key)); return data?.puzzle?.length === 81 ? data : null; } catch { return null; } },
  clear() { localStorage.removeItem(this.key); }
};
