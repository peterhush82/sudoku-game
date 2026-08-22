class SudokuApp {
  constructor() {
    this.boardEl = document.querySelector('#board');
    this.selected = null;
    this.noteMode = false;
    this.transientError = null;
    this.timerId = null;
    this.buildStaticUI();
    this.bindEvents();
    const saved = GameStorage.load();
    saved ? this.restore(saved) : this.newGame('medium');
  }

  buildStaticUI() {
    for (let i = 0; i < 81; i++) {
      const button = document.createElement('button');
      button.className = 'cell'; button.dataset.index = i; button.setAttribute('role', 'gridcell');
      this.boardEl.append(button);
    }
    for (let number = 1; number <= 9; number++) {
      const button = document.createElement('button');
      button.dataset.number = number; button.innerHTML = `${number}<small></small>`;
      document.querySelector('#number-pad').append(button);
    }
    Object.entries(DIFFICULTIES).forEach(([key, difficulty]) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'difficulty-option'; button.dataset.level = key;
      button.innerHTML = `<b>${difficulty.label}</b><small>${difficulty.caption}</small>`;
      document.querySelector('#difficulty-options').append(button);
    });
  }

  bindEvents() {
    this.boardEl.addEventListener('click', event => {
      const cell = event.target.closest('.cell');
      if (cell && !this.paused) this.select(+cell.dataset.index);
    });
    document.querySelector('#number-pad').addEventListener('click', event => {
      const button = event.target.closest('[data-number]');
      if (button && !button.disabled) this.input(+button.dataset.number);
    });
    document.addEventListener('keydown', event => {
      if (document.querySelector('dialog[open]') || this.paused) return;
      if (/^[1-9]$/.test(event.key)) this.input(+event.key);
      if (['Backspace', 'Delete', '0'].includes(event.key)) this.erase();
      if (event.key.toLowerCase() === 'n') this.toggleNotes();
    });
    document.querySelector('#notes').onclick = () => this.toggleNotes();
    document.querySelector('#erase').onclick = () => this.erase();
    document.querySelector('#undo').onclick = () => this.undo();
    document.querySelector('#hint').onclick = () => this.hint();
    document.querySelector('#restart').onclick = () => this.restart();
    document.querySelector('#pause').onclick = () => this.togglePause();
    document.querySelector('#pause-overlay').onclick = () => this.togglePause();
    document.querySelector('#new-game').onclick = () => this.openNewDialog();
    document.querySelectorAll('.difficulty-option').forEach(button => button.onclick = () => this.chooseDifficulty(button.dataset.level));
    document.querySelector('#start-game').onclick = event => {
      event.preventDefault(); this.newGame(this.pendingDifficulty); document.querySelector('#new-dialog').close();
    };
    document.querySelector('#play-again').onclick = () => { document.querySelector('#complete-dialog').close(); this.openNewDialog(); };
    document.querySelector('#continue-game').onclick = () => document.querySelector('#mistake-dialog').close();
    document.querySelector('#restart-after-errors').onclick = () => { document.querySelector('#mistake-dialog').close(); this.restart(false); };
    window.addEventListener('beforeunload', () => this.save());
  }

  newGame(level) {
    const data = SudokuGenerator.generate(level);
    this.setup({ ...data, values: data.puzzle.slice(), notes: Array.from({ length: 81 }, () => []), mistakes: 0, elapsed: 0, history: [], completed: false, paused: false });
    this.toast('新题目已准备好');
  }

  setup(data) {
    Object.assign(this, data);
    this.selected = null; this.noteMode = false; this.transientError = null;
    document.querySelector('#notes').classList.remove('active');
    clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      if (!this.completed && !this.paused) { this.elapsed++; this.updateStatus(); if (this.elapsed % 5 === 0) this.save(); }
    }, 1000);
    this.render(); this.save();
  }

  restore(data) {
    data.notes = Array.from({ length: 81 }, (_, i) => Array.isArray(data.notes?.[i]) ? data.notes[i] : []);
    data.history = data.history || []; data.paused = Boolean(data.paused);
    if (data.savedAt && !data.completed && !data.paused) data.elapsed += Math.max(0, Math.floor((Date.now() - data.savedAt) / 1000));
    this.setup(data); this.toast(data.paused ? '游戏仍处于暂停状态' : '已继续上次的游戏');
  }

  select(index) { this.selected = index; this.render(); }
  snapshot() { return { values: this.values.slice(), notes: this.notes.map(notes => notes.slice()) }; }

  input(number) {
    const index = this.selected;
    if (index === null || this.puzzle[index] || this.completed || this.paused || this.transientError !== null || this.isDigitComplete(number)) return;
    if (this.noteMode && !this.values[index]) {
      this.history.push(this.snapshot());
      const position = this.notes[index].indexOf(number);
      position < 0 ? this.notes[index].push(number) : this.notes[index].splice(position, 1);
      this.notes[index].sort();
      this.afterAction(false); return;
    }
    if (number !== this.solution[index]) { this.showWrongInput(index); return; }
    this.history.push(this.snapshot());
    this.values[index] = number; this.notes[index] = [];
    this.notes = GameRules.removePeerNotes(this.notes, index, number);
    this.afterAction();
  }

  showWrongInput(index) {
    this.mistakes++; this.transientError = index; this.render(); this.save();
    this.toast('这个数字不正确，再想一想');
    clearTimeout(this.errorTimer);
    this.errorTimer = setTimeout(() => {
      this.transientError = null; this.render();
      if (this.mistakes === 3) document.querySelector('#mistake-dialog').showModal();
    }, 650);
  }

  erase() {
    const index = this.selected;
    if (index === null || this.puzzle[index] || this.paused || (!this.values[index] && !this.notes[index].length)) return;
    this.history.push(this.snapshot()); this.values[index] = 0; this.notes[index] = []; this.afterAction(false);
  }

  undo() {
    if (this.paused) return;
    const previous = this.history.pop(); if (!previous) return;
    this.values = previous.values; this.notes = previous.notes; this.afterAction(false);
  }

  hint() {
    if (this.completed || this.paused) return;
    const blanks = this.values.map((value, i) => value === this.solution[i] ? null : i).filter(i => i !== null);
    if (!blanks.length) return;
    const index = blanks[Math.floor(Math.random() * blanks.length)], number = this.solution[index];
    this.history.push(this.snapshot()); this.values[index] = number; this.notes[index] = [];
    this.notes = GameRules.removePeerNotes(this.notes, index, number);
    this.selected = index; this.afterAction(); this.toast('已为你填入一个正确数字');
  }

  toggleNotes() {
    if (this.paused || this.completed) return;
    this.noteMode = !this.noteMode;
    const button = document.querySelector('#notes');
    button.classList.toggle('active', this.noteMode); button.setAttribute('aria-pressed', this.noteMode);
    this.toast(this.noteMode ? '笔记模式已开启' : '笔记模式已关闭');
  }

  togglePause() {
    if (this.completed) return;
    this.paused = !this.paused; this.render(); this.save();
  }

  restart(confirmFirst = true) {
    if (confirmFirst && !confirm('确定要清空所有填写并重新计时吗？')) return;
    this.setup({ puzzle: this.puzzle, solution: this.solution, difficulty: this.difficulty, values: this.puzzle.slice(), notes: Array.from({ length: 81 }, () => []), mistakes: 0, elapsed: 0, history: [], completed: false, paused: false });
  }

  afterAction(check = true) {
    this.render(); this.save();
    if (check && this.values.every((value, i) => value === this.solution[i])) this.complete();
  }

  complete() {
    this.completed = true; clearInterval(this.timerId); GameStorage.clear();
    document.querySelector('#result-difficulty').textContent = DIFFICULTIES[this.difficulty].label;
    document.querySelector('#result-time').textContent = this.formatTime();
    document.querySelector('#result-mistakes').textContent = `${this.mistakes} 次`;
    document.querySelector('#complete-dialog').showModal();
  }

  isDigitComplete(number) { return GameRules.digitCounts(this.values)[number] >= 9; }

  render() {
    const selectedValue = this.selected === null ? 0 : this.values[this.selected];
    this.boardEl.querySelectorAll('.cell').forEach((cell, index) => {
      cell.className = 'cell';
      if (this.puzzle[index]) cell.classList.add('given');
      if (this.selected !== null && GameRules.isPeer(this.selected, index)) cell.classList.add('peer');
      if (selectedValue && this.values[index] === selectedValue && index !== this.selected) cell.classList.add('same');
      if (index === this.selected) cell.classList.add('selected');
      if (index === this.transientError) cell.classList.add('error');
      const noteMarkup = [1,2,3,4,5,6,7,8,9].map(number => `<i>${this.notes[index].includes(number) ? number : ''}</i>`).join('');
      cell.innerHTML = this.values[index] ? this.values[index] : this.notes[index].length ? `<span class="notes-grid">${noteMarkup}</span>` : '';
      cell.setAttribute('aria-label', `第 ${Math.floor(index / 9) + 1} 行第 ${index % 9 + 1} 列${this.values[index] ? `，数字 ${this.values[index]}` : ''}`);
    });
    const counts = GameRules.digitCounts(this.values);
    document.querySelectorAll('#number-pad button').forEach(button => {
      const number = +button.dataset.number, complete = counts[number] >= 9;
      button.disabled = complete || this.paused; button.classList.toggle('completed', complete);
      button.querySelector('small').textContent = complete ? '完成' : `${counts[number]}/9`;
    });
    document.querySelectorAll('.tools button').forEach(button => { button.disabled = this.paused; });
    document.querySelector('#undo').disabled = this.paused || !this.history.length;
    document.querySelector('#pause-overlay').classList.toggle('show', this.paused);
    document.querySelector('#pause').textContent = this.paused ? '继续' : '暂停';
    this.updateStatus();
  }

  updateStatus() {
    document.querySelector('#difficulty-label').textContent = DIFFICULTIES[this.difficulty].label;
    document.querySelector('#timer').textContent = this.formatTime();
    document.querySelector('#mistakes').textContent = this.mistakes;
  }

  formatTime() {
    const hours = Math.floor(this.elapsed / 3600), minutes = Math.floor(this.elapsed % 3600 / 60), seconds = this.elapsed % 60;
    return (hours ? `${hours.toString().padStart(2, '0')}:` : '') + [minutes, seconds].map(value => value.toString().padStart(2, '0')).join(':');
  }

  save() {
    if (!this.completed) GameStorage.save({ puzzle: this.puzzle, solution: this.solution, difficulty: this.difficulty, values: this.values, notes: this.notes, mistakes: this.mistakes, elapsed: this.elapsed, history: this.history, completed: this.completed, paused: this.paused });
  }

  openNewDialog() { this.chooseDifficulty(this.difficulty || 'medium'); document.querySelector('#new-dialog').showModal(); }
  chooseDifficulty(level) { this.pendingDifficulty = level; document.querySelectorAll('.difficulty-option').forEach(button => button.classList.toggle('selected', button.dataset.level === level)); }
  toast(message) { const element = document.querySelector('#toast'); element.textContent = message; element.classList.add('show'); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => element.classList.remove('show'), 1800); }
}

document.addEventListener('DOMContentLoaded', () => new SudokuApp());
