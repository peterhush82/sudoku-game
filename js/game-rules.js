/** Pure helpers shared by the UI and tests. */
const GameRules = {
  isPeer(a, b) {
    const ar = Math.floor(a / 9), ac = a % 9, br = Math.floor(b / 9), bc = b % 9;
    return ar === br || ac === bc || (Math.floor(ar / 3) === Math.floor(br / 3) && Math.floor(ac / 3) === Math.floor(bc / 3));
  },
  removePeerNotes(notes, index, number) {
    return notes.map((cellNotes, i) => this.isPeer(index, i) ? cellNotes.filter(n => n !== number) : cellNotes.slice());
  },
  digitCounts(values) {
    const counts = Array(10).fill(0);
    values.forEach(value => { if (value >= 1 && value <= 9) counts[value]++; });
    return counts;
  }
};
if (typeof module !== 'undefined') module.exports = GameRules;
