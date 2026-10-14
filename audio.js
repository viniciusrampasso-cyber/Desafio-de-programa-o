/* AudioSys - música ambiente + SFX via WebAudio (sem arquivos externos) */
const AudioSys = {
  ctx: null, musicTimer: null, enabled: true, musicOn: true,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ this.ctx=null; }
  },
  resume(){ if(this.ctx && this.ctx.state==='suspended') this.ctx.resume(); },
  beep(freq, dur=0.12, type='square', vol=0.15, slide=0){
    if(!this.ctx || !this.enabled) return;
    const t=this.ctx.currentTime;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide), t+dur);
    g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t+dur+0.02);
  },
  sfx(name){
    if(!this.ctx) return;
    const S=this.beep.bind(this);
    switch(name){
      case 'hit': S(220,0.1,'square',0.18,-120); break;
      case 'hurt': S(140,0.2,'sawtooth',0.2,-60); break;
      case 'kill': S(330,0.15,'square',0.16,-150); setTimeout(()=>S(520,0.15,'square',0.14),90); break;
      case 'coin': S(880,0.08,'square',0.12); setTimeout(()=>S(1320,0.12,'square',0.12),70); break;
      case 'chest': S(392,0.12,'triangle',0.2); setTimeout(()=>S(523,0.12,'triangle',0.2),110); setTimeout(()=>S(659,0.2,'triangle',0.2),220); break;
      case 'potion': S(520,0.2,'sine',0.2,200); break;
      case 'artifact': [523,659,784,1046].forEach((f,i)=>setTimeout(()=>S(f,0.25,'triangle',0.2),i*130)); break;
      case 'dialog': S(600,0.05,'square',0.07); break;
      case 'quest': [659,784,988].forEach((f,i)=>setTimeout(()=>S(f,0.18,'square',0.14),i*120)); break;
      case 'error': S(160,0.2,'sawtooth',0.15); break;
      case 'door': S(300,0.25,'sine',0.18,150); break;
      case 'shoot': S(700,0.1,'sawtooth',0.1,-300); break;
      case 'boss': S(110,0.5,'sawtooth',0.22,-40); setTimeout(()=>S(90,0.6,'sawtooth',0.2),300); break;
      case 'win': [523,659,784,1046,1318].forEach((f,i)=>setTimeout(()=>S(f,0.3,'triangle',0.18),i*160)); break;
      case 'lose': [400,340,280,200].forEach((f,i)=>setTimeout(()=>S(f,0.3,'sawtooth',0.15),i*180)); break;
      case 'step': S(200+Math.random()*60,0.04,'sine',0.04); break;
      case 'puzzle_ok': [784,988,1175].forEach((f,i)=>setTimeout(()=>S(f,0.15,'sine',0.16),i*100)); break;
      case 'puzzle_bad': S(220,0.25,'square',0.14,-80); break;
    }
  },
  startMusic(region){
    if(!this.ctx || !this.musicOn) return;
    this.stopMusic();
    const scales={ eldoria:[262,294,330,392,440], floresta:[330,392,440,494,587], ruinas:[220,262,294,330,392], castelo:[196,220,233,262,294], santuario:[440,523,659,784,880] };
    const notes=scales[region]||scales.eldoria;
    let i=0;
    this.musicTimer=setInterval(()=>{
      if(!this.musicOn||!this.ctx) return;
      const f=notes[i%notes.length];
      this.beep(f,0.35,'triangle',0.045);
      if(i%4===3) this.beep(f/2,0.5,'sine',0.05);
      i++;
    },420);
  },
  stopMusic(){ if(this.musicTimer){clearInterval(this.musicTimer); this.musicTimer=null;} }
};
