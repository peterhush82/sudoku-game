class SudokuApp {
  constructor() {
    this.boardEl = document.querySelector('#board'); this.selected = null; this.noteMode = false; this.timerId = null;
    this.buildStaticUI(); this.bindEvents();
    const saved = GameStorage.load(); saved ? this.restore(saved) : this.newGame('medium');
  }
  buildStaticUI() {
    for (let i=0;i<81;i++){const b=document.createElement('button');b.className='cell';b.dataset.index=i;b.setAttribute('role','gridcell');this.boardEl.append(b)}
    for(let n=1;n<=9;n++){const b=document.createElement('button');b.textContent=n;b.dataset.number=n;document.querySelector('#number-pad').append(b)}
    Object.entries(DIFFICULTIES).forEach(([key,d])=>{const b=document.createElement('button');b.type='button';b.className='difficulty-option';b.dataset.level=key;b.innerHTML=`<b>${d.label}</b><small>${d.caption}</small>`;document.querySelector('#difficulty-options').append(b)});
  }
  bindEvents() {
    this.boardEl.addEventListener('click',e=>{const c=e.target.closest('.cell');if(c)this.select(+c.dataset.index)});
    document.querySelector('#number-pad').addEventListener('click',e=>{if(e.target.dataset.number)this.input(+e.target.dataset.number)});
    document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;if(/^[1-9]$/.test(e.key))this.input(+e.key);if(['Backspace','Delete','0'].includes(e.key))this.erase();if(e.key.toLowerCase()==='n')this.toggleNotes()});
    document.querySelector('#notes').onclick=()=>this.toggleNotes(); document.querySelector('#erase').onclick=()=>this.erase(); document.querySelector('#undo').onclick=()=>this.undo();
    document.querySelector('#hint').onclick=()=>this.hint(); document.querySelector('#restart').onclick=()=>this.restart();
    document.querySelector('#new-game').onclick=()=>this.openNewDialog();
    document.querySelectorAll('.difficulty-option').forEach(b=>b.onclick=()=>this.chooseDifficulty(b.dataset.level));
    document.querySelector('#start-game').onclick=e=>{e.preventDefault();this.newGame(this.pendingDifficulty);document.querySelector('#new-dialog').close()};
    document.querySelector('#play-again').onclick=()=>{document.querySelector('#complete-dialog').close();this.openNewDialog()};
    window.addEventListener('beforeunload',()=>this.save());
  }
  newGame(level) { const data=SudokuGenerator.generate(level);this.setup({...data,values:data.puzzle.slice(),notes:Array.from({length:81},()=>[]),mistakes:0,elapsed:0,history:[],completed:false});this.toast('新题目已准备好'); }
  setup(data){Object.assign(this,data);this.selected=null;this.noteMode=false;clearInterval(this.timerId);this.timerId=setInterval(()=>{if(!this.completed){this.elapsed++;this.updateStatus();if(this.elapsed%5===0)this.save()}},1000);this.render();this.save()}
  restore(data){data.notes=(data.notes||[]).map(n=>Array.isArray(n)?n:[]);data.history=data.history||[];if(data.savedAt&&!data.completed)data.elapsed+=Math.max(0,Math.floor((Date.now()-data.savedAt)/1000));this.setup(data);this.toast('已继续上次的游戏')}
  select(i){this.selected=i;this.render()}
  snapshot(){return {values:this.values.slice(),notes:this.notes.map(n=>n.slice())}}
  input(n){const i=this.selected;if(i===null||this.puzzle[i]||this.completed)return;this.history.push(this.snapshot());if(this.noteMode&&!this.values[i]){const at=this.notes[i].indexOf(n);at<0?this.notes[i].push(n):this.notes[i].splice(at,1)}else{this.values[i]=n;this.notes[i]=[];if(n!==this.solution[i]){this.mistakes++;this.toast('这个数字不正确，再想一想')}}this.afterAction()}
  erase(){const i=this.selected;if(i===null||this.puzzle[i]||(!this.values[i]&&!this.notes[i].length))return;this.history.push(this.snapshot());this.values[i]=0;this.notes[i]=[];this.afterAction()}
  undo(){const previous=this.history.pop();if(!previous)return;this.values=previous.values;this.notes=previous.notes;this.afterAction(false)}
  hint(){if(this.completed)return;const blanks=this.values.map((v,i)=>v===this.solution[i]?null:i).filter(i=>i!==null);if(!blanks.length)return;const i=blanks[Math.floor(Math.random()*blanks.length)];this.history.push(this.snapshot());this.values[i]=this.solution[i];this.notes[i]=[];this.selected=i;this.afterAction();this.toast('已为你填入一个正确数字')}
  toggleNotes(){this.noteMode=!this.noteMode;document.querySelector('#notes').classList.toggle('active',this.noteMode);document.querySelector('#notes').setAttribute('aria-pressed',this.noteMode);this.toast(this.noteMode?'笔记模式已开启':'笔记模式已关闭')}
  restart(){if(!confirm('确定要清空所有填写并重新计时吗？'))return;this.setup({...this,puzzle:this.puzzle,solution:this.solution,difficulty:this.difficulty,values:this.puzzle.slice(),notes:Array.from({length:81},()=>[]),mistakes:0,elapsed:0,history:[],completed:false})}
  afterAction(check=true){this.render();this.save();if(check&&this.values.every((v,i)=>v===this.solution[i]))this.complete()}
  complete(){this.completed=true;clearInterval(this.timerId);GameStorage.clear();document.querySelector('#result-difficulty').textContent=DIFFICULTIES[this.difficulty].label;document.querySelector('#result-time').textContent=this.formatTime();document.querySelector('#result-mistakes').textContent=this.mistakes+' 次';document.querySelector('#complete-dialog').showModal()}
  render(){const selectedValue=this.selected===null?0:this.values[this.selected];this.boardEl.querySelectorAll('.cell').forEach((cell,i)=>{const r=Math.floor(i/9),c=i%9,sr=Math.floor((this.selected||0)/9),sc=(this.selected||0)%9,sameBox=Math.floor(r/3)===Math.floor(sr/3)&&Math.floor(c/3)===Math.floor(sc/3);cell.className='cell';if(this.puzzle[i])cell.classList.add('given');if(this.selected!==null&&(r===sr||c===sc||sameBox))cell.classList.add('peer');if(selectedValue&&this.values[i]===selectedValue)cell.classList.add('same');if(i===this.selected)cell.classList.add('selected');if(this.values[i]&&!this.puzzle[i]&&this.values[i]!==this.solution[i])cell.classList.add('error');cell.innerHTML=this.values[i]?this.values[i]:this.notes[i].length?`<span class="notes-grid">${[1,2,3,4,5,6,7,8,9].map(n=>`<i>${this.notes[i].includes(n)?n:''}</i>`).join('')}</span>`:'';cell.setAttribute('aria-label',`第 ${r+1} 行第 ${c+1} 列${this.values[i]?'，数字 '+this.values[i]:''}`)});this.updateStatus();document.querySelector('#undo').disabled=!this.history.length}
  updateStatus(){document.querySelector('#difficulty-label').textContent=DIFFICULTIES[this.difficulty].label;document.querySelector('#timer').textContent=this.formatTime();document.querySelector('#mistakes').textContent=this.mistakes}
  formatTime(){const h=Math.floor(this.elapsed/3600),m=Math.floor(this.elapsed%3600/60),s=this.elapsed%60;return(h?h.toString().padStart(2,'0')+':':'')+[m,s].map(v=>v.toString().padStart(2,'0')).join(':')}
  save(){if(!this.completed)GameStorage.save({puzzle:this.puzzle,solution:this.solution,difficulty:this.difficulty,values:this.values,notes:this.notes,mistakes:this.mistakes,elapsed:this.elapsed,history:this.history,completed:this.completed})}
  openNewDialog(){this.chooseDifficulty(this.difficulty||'medium');document.querySelector('#new-dialog').showModal()}
  chooseDifficulty(level){this.pendingDifficulty=level;document.querySelectorAll('.difficulty-option').forEach(b=>b.classList.toggle('selected',b.dataset.level===level))}
  toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.remove('show'),1800)}
}
document.addEventListener('DOMContentLoaded',()=>new SudokuApp());
