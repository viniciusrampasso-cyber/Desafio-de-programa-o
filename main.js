/* MAIN - motor do jogo: mapa, jogador, colisões, interação, combate, fases */
const Game = {
  canvas:null, ctx:null, maps:null, mapId:'eldoria',
  player:null, enemies:[], eShots:[], pShots:[], pickups:[], particles:[], floaters:[],
  npcs:[], chests:[], puzzles:[], elapsed:0, score:0, kills:0, treasures:0, questsDone:0,
  flags:null, killedBoss:{}, openedChests:{}, solvedPuzzles:{}, farmCount:{},
  keys:{}, dialogOpen:false, dialogLines:[], dialogIdx:0, npcActive:null,
  paused:false, over:false, win:false, started:false, attackCd:0, potionCd:0, hurtT:0, stepT:0,
  cam:{x:0,y:0},

  newFlags(){ return { metMayor:false, metSage:false, theoQuest:false, hasAmulet:false, helpedTheo:false, theoRewarded:false,
    ruiRiddleDone:false, forestRunesOk:false, forestSeq:[], ruinsPlatesOk:false, ruinsSeq:[], victory:false,
    artifacts:{cristal:false,orbe:false,espada:false} }; },

  init(){
    this.canvas=document.getElementById('game'); this.ctx=this.canvas.getContext('2d');
    this.maps=buildMaps();
    this.reset(true);
    this.bind();
    AudioSys.init();
    requestAnimationFrame(t=>this.loop(t));
  },

  reset(fresh){
    this.flags=this.newFlags();
    this.player={ x:14.5*32, y:14*32, w:22,h:22, hp:100, maxHp:100, mana:100, attack:15,
      coins:30, potions:2, keys:0, dir:'down', moving:false, anim:0, atkAnim:0 };
    this.score=0; this.kills=0; this.treasures=0; this.questsDone=0; this.elapsed=0;
    this.killedBoss={}; this.openedChests={}; this.solvedPuzzles={}; this.farmCount={};
    this.eShots=[]; this.pShots=[]; this.pickups=[]; this.particles=[]; this.floaters=[];
    this.over=false; this.win=false; this.paused=false;
    this.mapId='eldoria';
    this.enterMap('eldoria', true);
  },

  applySave(d){
    this.flags=d.flags; this.killedBoss=d.killedBoss||{}; this.openedChests=d.openedChests||{};
    this.solvedPuzzles=d.solvedPuzzles||{};
    this.player.x=d.px; this.player.y=d.py; this.player.hp=d.hp; this.player.maxHp=d.maxHp;
    this.player.mana=d.mana; this.player.attack=d.attack; this.player.coins=d.coins;
    this.player.potions=d.potions; this.player.keys=d.keys;
    this.score=d.score; this.kills=d.kills; this.treasures=d.treasures;
    this.questsDone=d.questsDone; this.elapsed=d.elapsed||0;
    this.mapId=d.map; this.enterMap(d.map, true);
    this.player.x=d.px; this.player.y=d.py;
  },

  // ---------- MAPAS / ENTIDADES ----------
  enterMap(id, first){
    this.mapId=id;
    const m=this.maps[id];
    EnemySys.spawnFor(this, id);
    this.npcs=NPCSys.listFor(id);
    this.eShots=[]; this.pShots=[]; this.pickups=[]; this.particles=[];
    this.buildProps(id);
    if(!first){ AudioSys.sfx('door'); }
    AudioSys.startMusic(id);
    UI.banner(m.name, QuestSys.phaseName(QuestSys.phase(this)));
  },

  buildProps(id){
    this.chests=[]; this.puzzles=[];
    const T=n=>n*32;
    const chest=(cid,x,y,type)=>{ if(!this.openedChests[cid]) this.chests.push({cid,x:T(x),y:T(y),type}); };
    const rune=(rid,x,y,order)=>this.puzzles.push({kind:'runa',rid,x:T(x),y:T(y),order, active:false});
    const plate=(pid,x,y,order)=>this.puzzles.push({kind:'placa',pid,x:T(x),y:T(y),order, active:false});
    const altar=(aid,x,y,art)=>this.puzzles.push({kind:'altar',aid,x:T(x),y:T(y),art});
    if(id==='eldoria'){
      chest('eld1',11,7,'potion'); chest('eld2',22,12,'coins');
    }
    if(id==='floresta'){
      rune('r0',8,4,1); rune('r1',15,6,0); rune('r2',22,4,2); // ordem: r1,r0,r2
      chest('flo1',5,13,'potion'); chest('flo2',25,15,'treasure'); chest('flo3',18,11,'coins');
      altar('altC',15,2.5,'cristal');
    }
    if(id==='ruinas'){
      plate('p0',8,11,0); plate('p1',14,11,1); plate('p2',20,11,2);
      chest('rui1',4,5,'coins'); chest('rui2',22,14,'key'); chest('rui3',6,15,'treasure');
      altar('altO',26,2.5,'orbe');
    }
    if(id==='castelo'){
      chest('cas1',6,11,'key'); chest('cas2',23,11,'key'); chest('cas3',20,14,'treasure'); chest('cas4',9,14,'potion');
      altar('altE',15,3,'espada');
    }
    if(id==='santuario'){
      chest('san1',6,10,'potion'); chest('san2',23,10,'potion');
    }
    // esconder baús já abertos / puzzles resolvidos
    this.chests=this.chests.filter(c=>!this.openedChests[c.cid]);
    if(this.flags.forestRunesOk) this.puzzles.filter(p=>p.kind==='runa').forEach(p=>p.active=true);
    if(this.flags.ruinsPlatesOk) this.puzzles.filter(p=>p.kind==='placa').forEach(p=>p.active=true);
  },

  isSolidAt(px,py){
    const m=this.maps[this.mapId].grid;
    const tx=Math.floor(px/TILE), ty=Math.floor(py/TILE);
    if(tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return true;
    const t=m[ty][tx];
    return t===1||t===2;
  },
  tryMove(ent, dx, dy){
    const r=10;
    if(dx!==0){
      const nx=ent.x+dx;
      if(!this.isSolidAt(nx+Math.sign(dx)*r, ent.y-r) && !this.isSolidAt(nx+Math.sign(dx)*r, ent.y+r)
        && !this.isSolidAt(nx+Math.sign(dx)*r, ent.y)) ent.x=nx;
    }
    if(dy!==0){
      const ny=ent.y+dy;
      if(!this.isSolidAt(ent.x-r, ny+Math.sign(dy)*r) && !this.isSolidAt(ent.x+r, ny+Math.sign(dy)*r)
        && !this.isSolidAt(ent.x, ny+Math.sign(dy)*r)) ent.y=ny;
    }
    ent.x=Math.max(16,Math.min(MAP_W*32-16,ent.x));
    ent.y=Math.max(16,Math.min(MAP_H*32-16,ent.y));
  },

  // ---------- INPUT ----------
  bind(){
    window.addEventListener('keydown',e=>{
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      this.keys[e.key.toLowerCase()]=true;
      AudioSys.init(); AudioSys.resume();
      if(!this.started) return;
      if(e.key==='Escape'){
        if(this.dialogOpen){ this.closeDialog(); }
        else if(!this.over&&!this.win){ this.paused=!this.paused; UI.showPause(this,this.paused); }
      }
      if(e.key.toLowerCase()==='e'){ this.interactPressed(); }
      if(e.key.toLowerCase()==='i'){ this.paused=!this.paused; UI.showPause(this,this.paused); }
      if(e.key.toLowerCase()==='q'){ this.usePotion(); }
      if(e.key.toLowerCase()==='f'){ this.castFireball(); }
      if(e.key===' '){ this.melee(); }
    });
    window.addEventListener('keyup',e=>{ this.keys[e.key.toLowerCase()]=false; });
    this.canvas.addEventListener('click',()=>{ if(this.dialogOpen) this.interactPressed(); });
    document.getElementById('dialog').addEventListener('click',()=>this.interactPressed());
    // botões
    document.getElementById('btn-start').onclick=()=>{ AudioSys.init(); AudioSys.resume(); this.started=true;
      document.getElementById('intro').classList.add('hidden'); UI.banner('Cidade de Eldoria','Fase 1 — O Chamado de Eldoria'); AudioSys.sfx('quest'); };
    document.getElementById('btn-continue').onclick=()=>{ const d=SaveSys.load();
      AudioSys.init();
      if(d){ this.reset(false); this.applySave(d); }
      this.started=true; document.getElementById('intro').classList.add('hidden'); UI.toast('Progresso carregado!'); };
    if(!SaveSys.has()) document.getElementById('btn-continue').style.display='none';
    document.getElementById('btn-resume').onclick=()=>{ this.paused=false; UI.showPause(this,false); };
    document.getElementById('btn-save').onclick=()=>{ SaveSys.save(this)?UI.toast('Jogo salvo! 💾'):UI.toast('Falha ao salvar.'); };
    document.getElementById('btn-load').onclick=()=>{ const d=SaveSys.load(); if(d){ this.applySave(d); this.paused=false; UI.showPause(this,false); UI.toast('Progresso carregado!'); } else UI.toast('Nenhum save.'); };
    document.getElementById('btn-quit').onclick=()=>{ SaveSys.save(this); location.reload(); };
    document.getElementById('btn-retry').onclick=()=>this.respawn();
    document.getElementById('btn-again').onclick=()=>{ SaveSys.clear(); location.reload(); };
    document.getElementById('btn-close-inv').onclick=()=>{ this.paused=false; UI.showPause(this,false); };
    // touch
    const hold=(id,key)=>{
      const el=document.getElementById(id);
      const on=e=>{e.preventDefault(); AudioSys.init(); if(key==='E')this.interactPressed(); else if(key===' ')this.melee(); else if(key==='Q')this.usePotion(); else if(key==='F')this.castFireball(); else this.keys[key]=true;};
      const off=e=>{e.preventDefault(); this.keys[key]=false;};
      el.addEventListener('touchstart',on,{passive:false}); el.addEventListener('touchend',off); el.addEventListener('touchcancel',off);
      el.addEventListener('mousedown',on); el.addEventListener('mouseup',off);
    };
    hold('t-up','w'); hold('t-down','s'); hold('t-left','a'); hold('t-right','d');
    hold('t-atk',' '); hold('t-int','E'); hold('t-pot','Q'); hold('t-mag','F');
  },

  // ---------- AÇÕES ----------
  nearestInteract(){
    const p=this.player; let best=null,bd=46;
    const consider=(x,y,obj)=>{ const d=Math.hypot(p.x-x,p.y-y); if(d<bd){bd=d;best=obj;} };
    for(const n of this.npcs) consider(n.x,n.y,{type:'npc',npc:n});
    for(const c of this.chests) consider(c.x,c.y,{type:'chest',chest:c});
    for(const z of this.puzzles) consider(z.x,z.y,{type:'puzzle',pz:z});
    // portais por proximidade da borda
    const m=this.maps[this.mapId];
    for(const pt of m.portals){ consider(pt.x*32+16,pt.y*32+16,{type:'portal',portal:pt}); }
    return best;
  },

  interactPressed(){
    if(!this.started||this.paused||this.over||this.win) return;
    AudioSys.init();
    if(this.dialogOpen){
      const line=this.dialogLines[this.dialogIdx];
      if(line && line.opts && this.dialogIdx===this.dialogLines.length-1) return; // exige escolha
      this.dialogIdx++;
      if(this.dialogIdx>=this.dialogLines.length){
        // fim do diálogo: efeitos pós-diálogo
        const npc=this.npcActive;
        if(npc&&npc.id==='explorador'&&this.flags.theoQuest&&this.flags.hasAmulet&&!this.flags.theoRewarded){
          this.flags.theoRewarded=true; this.flags.helpedTheo=true;
          this.player.coins+=40; ScoreSys.add(this,250,'Missão secundária');
          this.questsDone++; AudioSys.sfx('coin'); UI.toast('Theo recompensou: +40 🪙');
        }
        this.closeDialog();
      } else { AudioSys.sfx('dialog'); UI.renderDialog(this); }
      return;
    }
    const it=this.nearestInteract();
    if(!it) return;
    if(it.type==='npc'){
      this.npcActive=it.npc;
      this.dialogLines=NPCSys.dialog(this,it.npc);
      this.dialogIdx=0; AudioSys.sfx('dialog'); UI.renderDialog(this);
    } else if(it.type==='chest'){ this.openChest(it.chest); }
    else if(it.type==='puzzle'){ this.triggerPuzzle(it.pz); }
    else if(it.type==='portal'){ this.usePortal(it.portal); }
  },
  chooseDialog(value){
    const npc=this.npcActive;
    if(NPCSys.choose(this,npc,value)) this.closeDialog();
  },
  closeDialog(){ this.dialogOpen=false; this.npcActive=null; document.getElementById('dialog').classList.add('hidden'); },

  openChest(c){
    this.openedChests[c.cid]=true;
    this.chests=this.chests.filter(x=>x!==c);
    AudioSys.sfx('chest'); this.burst(c.x,c.y,'#facc15',16);
    if(c.type==='potion'){ this.player.potions+=2; UI.toast('Baú: +2 poções 🧪'); }
    else if(c.type==='coins'){ const v=15+Math.floor(Math.random()*20); this.player.coins+=v; ScoreSys.add(this,20,'Moedas'); UI.toast(`Baú: +${v} moedas 🪙`); }
    else if(c.type==='key'){ this.player.keys++; UI.toast('Baú: +1 chave 🗝️'); }
    else if(c.type==='treasure'){ this.treasures++; ScoreSys.add(this,100,'Tesouro secreto'); UI.toast('Tesouro secreto! +100 pts 🏺'); AudioSys.sfx('artifact'); }
    SaveSys.save(this);
  },

  triggerPuzzle(pz){
    if(pz.kind==='runa'){
      if(this.flags.forestRunesOk){ UI.toast('A runa já pulsa em verde.'); return; }
      const seq=this.flags.forestSeq;
      // ordem correta por `order`: 0,1,2 corresponde a r1,r0,r2
      const expected=[ 'r1','r0','r2' ];
      seq.push(pz.rid);
      pz.active=true; AudioSys.sfx('dialog');
      // verifica prefixo
      for(let i=0;i<seq.length;i++){
        if(seq[i]!==expected[i]){
          this.flags.forestSeq=[]; this.puzzles.filter(p=>p.kind==='runa').forEach(p=>p.active=false);
          AudioSys.sfx('puzzle_bad'); UI.toast('Ordem errada! As runas se apagam... (dica: MEIO→OESTE→LESTE)'); return;
        }
      }
      if(seq.length===3){
        this.flags.forestRunesOk=true;
        ScoreSys.add(this,200,'Enigma das runas'); AudioSys.sfx('puzzle_ok');
        UI.banner('Runas ativadas!','O Guardião da Floresta despertou...'); AudioSys.sfx('boss');
        this.burst(pz.x,pz.y,'#4ade80',24); SaveSys.save(this);
      } else UI.toast(`Runa ${seq.length}/3 acesa...`);
    }
    else if(pz.kind==='placa'){
      if(this.flags.ruinsPlatesOk){ UI.toast('A placa já está afundada.'); return; }
      if(!this.flags.ruiRiddleDone){ UI.toast('Responda ao enigma do Guardião primeiro!'); AudioSys.sfx('error'); return; }
      const seq=this.flags.ruinsSeq, expected=['p0','p1','p2'];
      seq.push(pz.pid); pz.active=true; AudioSys.sfx('dialog');
      for(let i=0;i<seq.length;i++) if(seq[i]!==expected[i]){
        this.flags.ruinsSeq=[]; this.puzzles.filter(p=>p.kind==='placa').forEach(p=>p.active=false);
        AudioSys.sfx('puzzle_bad'); UI.toast('Ordem errada! (oeste → centro → leste)'); return;
      }
      if(seq.length===3){
        this.flags.ruinsPlatesOk=true;
        ScoreSys.add(this,200,'Mecanismo das placas'); AudioSys.sfx('puzzle_ok');
        UI.banner('Mecanismo ativado!','O Guardião das Ruínas despertou...'); AudioSys.sfx('boss');
        SaveSys.save(this);
      } else UI.toast(`Placa ${seq.length}/3 pressionada...`);
    }
    else if(pz.kind==='altar'){ this.tryAltar(pz); }
  },

  tryAltar(pz){
    const a=this.flags.artifacts;
    if(pz.art==='cristal'){
      if(a.cristal){ UI.toast('O altar descansa.'); return; }
      if(!this.flags.forestRunesOk){ UI.toast('O altar está adormecido. Ative as 3 runas!'); AudioSys.sfx('error'); return; }
      if(!this.killedBoss.golem){ UI.toast('O Guardião da Floresta protege o Cristal! Derrote-o!'); AudioSys.sfx('error'); return; }
      a.cristal=true; this.questsDone++;
      ScoreSys.add(this,500,'Cristal da Luz'); AudioSys.sfx('artifact');
      UI.banner('💎 Cristal da Luz obtido!','O Castelo das Sombras abriu-se ao norte da floresta.');
      this.burst(pz.x,pz.y,'#facc15',40); SaveSys.save(this);
    }
    if(pz.art==='orbe'){
      if(a.orbe){ UI.toast('O altar descansa.'); return; }
      if(!this.killedBoss.elemental){ UI.toast('O Guardião das Ruínas protege o Orbe!'); AudioSys.sfx('error'); return; }
      a.orbe=true; this.questsDone++;
      ScoreSys.add(this,500,'Orbe das Águas'); AudioSys.sfx('artifact');
      UI.banner('🔮 Orbe das Águas obtido!','Resta a Espada Ancestral no castelo.');
      this.burst(pz.x,pz.y,'#38bdf8',40); SaveSys.save(this);
    }
    if(pz.art==='espada'){
      if(a.espada){ UI.toast('O pedestal descansa.'); return; }
      if(!this.killedBoss.knight){ UI.toast('O Cavaleiro Sombrio protege a Espada! Derrote-o!'); AudioSys.sfx('error'); return; }
      if(this.player.keys<1){ UI.toast('O pedestal exige 1 chave 🗝️!'); AudioSys.sfx('error'); return; }
      this.player.keys--; a.espada=true; this.player.attack=28; this.questsDone++;
      ScoreSys.add(this,500,'Espada Ancestral'); AudioSys.sfx('artifact');
      UI.banner('🗡️ Espada Ancestral obtida!','Ataque 15 → 28! Volte a Eldoria e vá ao Santuário (leste).');
      this.burst(pz.x,pz.y,'#e879f9',40); SaveSys.save(this);
    }
  },

  usePortal(pt){
    // verifica requisito
    if(pt.req==='cristal' && !this.flags.artifacts.cristal){ UI.toast('Selado! É preciso o Cristal da Luz 💎.'); AudioSys.sfx('error'); return; }
    if(pt.req==='allArtifacts' && !(this.flags.artifacts.cristal&&this.flags.artifacts.orbe&&this.flags.artifacts.espada)){
      UI.toast('Selado! Reúna os 3 artefatos.'); AudioSys.sfx('error'); return; }
    this.enterMap(pt.to,false);
    this.player.x=pt.sx*32; this.player.y=pt.sy*32;
    SaveSys.save(this);
  },

  melee(){
    if(!this.started||this.paused||this.over||this.win||this.dialogOpen) return;
    if(this.attackCd>0) return;
    this.attackCd=0.35; this.player.atkAnim=0.2;
    AudioSys.sfx('hit');
    const p=this.player, reach=58;
    const ox={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[p.dir];
    const hx=p.x+ox[0]*reach*0.6, hy=p.y+ox[1]*reach*0.6;
    this.burst(hx,hy,'#fef08a',6);
    for(const e of this.enemies){
      if(e.dead) continue;
      if(e.bossId==='golem'&&!this.flags.forestRunesOk) continue;
      if(e.bossId==='elemental'&&!this.flags.ruinsPlatesOk) continue;
      if(Math.hypot(e.x-hx,e.y-hy)<reach*0.7+e.size*0.4) this.hitEnemy(e,p.attack,hx,hy);
    }
  },
  castFireball(){
    const p=this.player;
    if(!this.started||this.paused||this.over||this.win||this.dialogOpen) return;
    if(p.mana<20){ UI.toast('Mana insuficiente!'); AudioSys.sfx('error'); return; }
    p.mana-=20; AudioSys.sfx('shoot');
    const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[p.dir];
    this.pShots.push({x:p.x,y:p.y,vx:d[0]*320,vy:d[1]*320,dmg:25,t:1.5});
  },
  usePotion(){
    const p=this.player;
    if(!this.started||this.paused||this.over||this.win) return;
    if(this.potionCd>0||p.potions<=0||p.hp>=p.maxHp) return;
    p.potions--; p.hp=Math.min(p.maxHp,p.hp+50); this.potionCd=1;
    AudioSys.sfx('potion'); this.burst(p.x,p.y,'#4ade80',14); UI.toast('Poção usada: +50 ❤️');
  },

  hitEnemy(e,dmg,sx,sy){
    e.hp-=dmg; e.hitT=0.15;
    this.burst(e.x,e.y,'#fca5a5',8);
    const dx=e.x-sx, dy=e.y-sy, d=Math.hypot(dx,dy)||1;
    this.tryMove(e, dx/d*14, dy/d*14);
    if(e.hp<=0 && !e.dead){
      e.dead=true; this.kills++;
      AudioSys.sfx('kill'); this.burst(e.x,e.y,e.color,22);
      // recompensas
      const d0=ENEMY_DEFS[e.type];
      const coins=d0.coins[0]+Math.floor(Math.random()*(d0.coins[1]-d0.coins[0]));
      this.player.coins+=coins;
      this.floaters.push({x:e.x,y:e.y-24,text:'+'+coins+'🪙',t:0,color:'#fde68a'});
      // anti-farm: pontuação cheia só nas primeiras ocorrências
      const k=(this.farmCount[e.type]||0);
      this.farmCount[e.type]=k+1;
      const pts = e.boss? e.score : (k<8? e.score : 5);
      ScoreSys.add(this,pts, e.boss?('Chefe: '+e.name):('Inimigo: '+e.name));
      // drops
      if(Math.random()<0.18) this.pickups.push({x:e.x,y:e.y,kind:'potion',t:20});
      if(e.type==='goblin'&&this.flags.theoQuest&&!this.flags.hasAmulet&&this.mapId==='floresta'&&Math.random()<0.5){
        this.flags.hasAmulet=true; UI.toast('Amuleto de Theo recuperado! Devolva-o em Eldoria 🧭'); AudioSys.sfx('quest');
      }
      if(e.bossId){ this.killedBoss[e.bossId]=true; this.questsDone++; AudioSys.sfx('boss'); }
      if(e.bossId==='golem') UI.banner('Guardião derrotado!','Pegue o Cristal no altar ao norte 💎');
      if(e.bossId==='elemental') UI.banner('Guardião derrotado!','Pegue o Orbe no altar 🔮');
      if(e.bossId==='knight') UI.banner('Cavaleiro derrotado!','Pegue a Espada no pedestal (requer 1 🗝️) 🗡️');
      if(e.bossId==='malakar'){ this.victory(); }
      // remove após animação
      setTimeout(()=>{ this.enemies=this.enemies.filter(x=>x!==e); },50);
      SaveSys.save(this);
    } else AudioSys.sfx('hit');
  },

  damagePlayer(dmg,sx,sy){
    const p=this.player;
    if(this.over||this.win||this.hurtT>0) return;
    p.hp-=dmg; this.hurtT=0.6;
    AudioSys.sfx('hurt'); this.burst(p.x,p.y,'#ef4444',10);
    this.floaters.push({x:p.x,y:p.y-26,text:'-'+Math.round(dmg),t:0,color:'#f87171'});
    const dx=p.x-sx, dy=p.y-sy, d=Math.hypot(dx,dy)||1;
    this.tryMove(p, dx/d*16, dy/d*16);
    if(p.hp<=0){ p.hp=0; this.defeat(); }
  },

  defeat(){
    this.over=true; AudioSys.sfx('lose'); AudioSys.stopMusic();
    UI.showDead(true);
  },
  respawn(){
    UI.showDead(false); this.over=false;
    const s=this.maps[this.mapId].spawn;
    // se morreu para chefe, renasce na entrada do mapa
    this.player.x=s.x; this.player.y=s.y;
    this.player.hp=this.player.maxHp; this.player.mana=100;
    EnemySys.spawnFor(this,this.mapId);
    AudioSys.startMusic(this.mapId);
    UI.toast('Você se levantou... tente de novo! ❤️');
  },
  victory(){
    this.win=true; this.flags.victory=true; this.questsDone++;
    AudioSys.sfx('win'); AudioSys.stopMusic();
    UI.showWin(this); SaveSys.save(this);
  },

  burst(x,y,color,n){ for(let i=0;i<n;i++){ const a=Math.random()*6.28, s=40+Math.random()*120;
    this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:0.5,color}); } },

  // ---------- LOOP ----------
  last:0,
  loop(t){
    const dt=Math.min(0.05,(t-this.last)/1000||0.016); this.last=t;
    if(this.started&&!this.paused&&!this.over&&!this.win) this.update(dt);
    this.render();
    requestAnimationFrame(tt=>this.loop(tt));
  },

  update(dt){
    this.elapsed+=dt;
    const p=this.player, k=this.keys;
    // movimento
    let mx=0,my=0;
    if(k['w']||k['arrowup'])my-=1; if(k['s']||k['arrowdown'])my+=1;
    if(k['a']||k['arrowleft'])mx-=1; if(k['d']||k['arrowright'])mx+=1;
    if(this.dialogOpen){mx=0;my=0;}
    if(mx||my){
      const l=Math.hypot(mx,my); mx/=l; my/=l;
      if(Math.abs(mx)>Math.abs(my)) p.dir=mx>0?'right':'left'; else p.dir=my>0?'down':'up';
      this.tryMove(p,mx*190*dt,my*190*dt);
      p.moving=true; p.anim+=dt*8;
      this.stepT-=dt; if(this.stepT<=0){this.stepT=0.3; AudioSys.sfx('step');}
    } else p.moving=false;
    if(this.attackCd>0)this.attackCd-=dt;
    if(this.potionCd>0)this.potionCd-=dt;
    if(this.hurtT>0)this.hurtT-=dt;
    if(p.atkAnim>0)p.atkAnim-=dt;
    p.mana=Math.min(100,p.mana+10*dt);
    // checar portal por posição (encostar na borda com gap)
    const tx=Math.floor(p.x/TILE), ty=Math.floor(p.y/TILE);
    for(const pt of this.maps[this.mapId].portals){
      if(Math.abs(pt.x-tx)<=0.6&&Math.abs(pt.y-ty)<=0.6){ this.usePortal(pt); break; }
    }
    // pickups
    for(const pk of this.pickups){
      pk.t-=dt;
      if(Math.hypot(p.x-pk.x,p.y-pk.y)<24){
        if(pk.kind==='potion'){ p.potions++; UI.toast('+1 poção 🧪'); AudioSys.sfx('potion'); }
        pk.t=0;
      }
    }
    this.pickups=this.pickups.filter(pk=>pk.t>0);
    // partículas e floaters
    for(const q of this.particles){ q.x+=q.vx*dt; q.y+=q.vy*dt; q.t-=dt; }
    this.particles=this.particles.filter(q=>q.t>0);
    for(const fl of this.floaters){ fl.y-=30*dt; fl.t+=dt; }
    this.floaters=this.floaters.filter(fl=>fl.t<1.2);
    EnemySys.update(this,dt);
    UI.renderHUD(this);
  },

  // ---------- RENDER ----------
  render(){
    const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height;
    const p=this.player;
    // câmera
    this.cam.x=Math.max(0,Math.min(MAP_W*TILE-W, p.x-W/2));
    this.cam.y=Math.max(0,Math.min(MAP_H*TILE-H, p.y-H/2));
    const cx=this.cam.x, cy=this.cam.y;
    const pal={ city:['#3f6212','#4d7c0f'], forest:['#14532d','#166534'], ruins:['#1e3a5f','#274b73'], castle:['#3b3b4d','#46465a'], sanctum:['#4a2b6b','#5b3a80'] }[this.maps[this.mapId].palette];
    // fundo
    ctx.fillStyle='#0b0f1a'; ctx.fillRect(0,0,W,H);
    const g=this.maps[this.mapId].grid;
    const x0=Math.max(0,Math.floor(cx/TILE)), y0=Math.max(0,Math.floor(cy/TILE));
    const x1=Math.min(MAP_W-1,x0+W/TILE+1), y1=Math.min(MAP_H-1,y0+H/TILE+1);
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
      const t=g[ty][tx], X=tx*TILE-cx, Y=ty*TILE-cy;
      if(t===2){ // água
        ctx.fillStyle=`rgba(14,116,144,${0.85+0.15*Math.sin(this.elapsed*3+tx)})`; ctx.fillRect(X,Y,TILE,TILE);
        ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(X+((tx*7+this.elapsed*20)%32),Y+8,8,2);
      } else if(t===1){
        ctx.fillStyle=this.maps[this.mapId].palette==='forest'?'#14532d':'#27272a';
        ctx.fillRect(X,Y,TILE,TILE);
        // detalhe por bioma
        if(this.maps[this.mapId].palette==='forest'){ ctx.fillStyle='#22c55e'; ctx.beginPath(); ctx.arc(X+16,Y+14,12,0,7); ctx.fill();
          ctx.fillStyle='#15803d'; ctx.beginPath(); ctx.arc(X+11,Y+10,6,0,7); ctx.fill(); ctx.fillStyle='#5b3a1e'; ctx.fillRect(X+13,Y+18,6,10); }
        else if(this.maps[this.mapId].palette==='city'){ ctx.fillStyle='#a16207'; ctx.fillRect(X+2,Y+8,TILE-4,TILE-10);
          ctx.fillStyle='#78350f'; ctx.fillRect(X+4,Y+2,TILE-8,10); ctx.fillStyle='#fde68a'; ctx.fillRect(X+10,Y+14,12,10); }
        else if(this.maps[this.mapId].palette==='ruins'){ ctx.fillStyle='#475569'; ctx.fillRect(X+2,Y+2,TILE-4,TILE-4);
          ctx.fillStyle='#94a3b8'; ctx.fillRect(X+6,Y+6,TILE-12,4); }
        else if(this.maps[this.mapId].palette==='castle'){ ctx.fillStyle='#3f3f46'; ctx.fillRect(X,Y,TILE,TILE);
          ctx.fillStyle='#71717a'; ctx.fillRect(X+4,Y+4,TILE-8,TILE-8); }
        else { ctx.fillStyle='#6d28d9'; ctx.fillRect(X+3,Y+3,TILE-6,TILE-6); }
      } else {
        ctx.fillStyle=((tx+ty)%2===0)?pal[0]:pal[1]; ctx.fillRect(X,Y,TILE,TILE);
        if(this.maps[this.mapId].palette==='forest'&&(tx*13+ty*7)%11===0){ ctx.fillStyle='#16a34a'; ctx.fillRect(X+8,Y+8,5,8); }
        if(this.maps[this.mapId].palette==='ruins'&&(tx*5+ty*3)%13===0){ ctx.fillStyle='rgba(148,163,184,0.5)'; ctx.fillRect(X+10,Y+10,12,3); }
        if(this.maps[this.mapId].palette==='city'&&(tx===12||tx===17)&&ty>5&&ty<14){ ctx.fillStyle='#a8a29e'; ctx.fillRect(X,Y,TILE,TILE); }
      }
      ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.strokeRect(X+0.5,Y+0.5,TILE-1,TILE-1);
    }
    const draw=(x,y,fn)=>fn(x-cx,y-cy);
    // portais
    for(const pt of this.maps[this.mapId].portals){
      draw(pt.x*32+16,pt.y*32+16,(X,Y)=>{
        const locked=(pt.req==='cristal'&&!this.flags.artifacts.cristal)||(pt.req==='allArtifacts'&&!(this.flags.artifacts.cristal&&this.flags.artifacts.orbe&&this.flags.artifacts.espada));
        ctx.fillStyle=locked?'#52525b':'#facc15';
        ctx.globalAlpha=0.7+0.3*Math.sin(this.elapsed*4);
        ctx.beginPath(); ctx.arc(X,Y,14,0,7); ctx.fill(); ctx.globalAlpha=1;
        ctx.fillStyle='#000'; ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText(locked?'🔒':'➤',X,Y+5);
      });
    }
    // baús
    for(const c of this.chests) draw(c.x,c.y,(X,Y)=>{
      ctx.fillStyle='#92400e'; ctx.fillRect(X-13,Y-10,26,18);
      ctx.fillStyle='#fbbf24'; ctx.fillRect(X-13,Y-2,26,4); ctx.fillRect(X-2,Y-10,4,18);
      ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText('?',X,Y+4);
    });
    // puzzles
    for(const z of this.puzzles) draw(z.x,z.y,(X,Y)=>{
      if(z.kind==='runa'){ ctx.fillStyle=z.active?'#4ade80':'#57534e';
        ctx.beginPath(); ctx.arc(X,Y,13+Math.sin(this.elapsed*3)*1.5,0,7); ctx.fill();
        ctx.fillStyle='#fff'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(['O','M','L'][['r0','r1','r2'].indexOf(z.rid)]||'•',X,Y+5); }
      if(z.kind==='placa'){ ctx.fillStyle=z.active?'#38bdf8':'#78716c'; ctx.fillRect(X-13,Y-13,26,26);
        ctx.fillStyle='#fff'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(String(z.order+1),X,Y+5); }
      if(z.kind==='altar'){
        const got=(z.art==='cristal'&&this.flags.artifacts.cristal)||(z.art==='orbe'&&this.flags.artifacts.orbe)||(z.art==='espada'&&this.flags.artifacts.espada);
        const em=z.art==='cristal'?'💎':z.art==='orbe'?'🔮':'🗡️';
        ctx.font='30px sans-serif'; ctx.textAlign='center';
        ctx.shadowColor='#fff'; ctx.shadowBlur=got?0:16;
        ctx.fillText(got?'✨':em,X,Y+10); ctx.shadowBlur=0;
        if(!got){ ctx.fillStyle='#fff'; ctx.font='11px sans-serif'; ctx.fillText('[E]',X,Y+24); }
      }
    });
    // pickups
    for(const pk of this.pickups) draw(pk.x,pk.y,(X,Y)=>{
      ctx.font='18px sans-serif'; ctx.textAlign='center'; ctx.fillText('🧪',X,Y+6+Math.sin(this.elapsed*5)*3);
    });
    // npcs
    for(const n of this.npcs) draw(n.x,n.y,(X,Y)=>{
      const bob=Math.sin(this.elapsed*3+n.x)*2;
      ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(X,Y+12,12,4,0,0,7); ctx.fill();
      ctx.fillStyle=n.color; ctx.beginPath(); ctx.arc(X,Y+bob,13,0,7); ctx.fill();
      ctx.font='18px sans-serif'; ctx.textAlign='center'; ctx.fillText(n.emoji,X,Y+6+bob);
      ctx.fillStyle='#fff'; ctx.font='bold 10px sans-serif'; ctx.fillText(n.name.split(' ')[0],X,Y-16);
      ctx.fillStyle='#facc15'; ctx.font='12px sans-serif'; ctx.fillText('[E]',X,Y-28);
    });
    // inimigos
    for(const e of this.enemies){
      if(e.bossId==='golem'&&!this.flags.forestRunesOk){ // adormecido
        draw(e.x,e.y,(X,Y)=>{ ctx.globalAlpha=0.5; ctx.fillStyle='#365314'; ctx.beginPath(); ctx.arc(X,Y,20,0,7); ctx.fill();
          ctx.font='20px sans-serif'; ctx.textAlign='center'; ctx.fillText('🗿',X,Y+7); ctx.globalAlpha=1; });
        continue;
      }
      if(e.bossId==='elemental'&&!this.flags.ruinsPlatesOk){
        draw(e.x,e.y,(X,Y)=>{ ctx.globalAlpha=0.5; ctx.fillStyle='#0c4a6e'; ctx.beginPath(); ctx.arc(X,Y,20,0,7); ctx.fill();
          ctx.font='20px sans-serif'; ctx.textAlign='center'; ctx.fillText('💤',X,Y+7); ctx.globalAlpha=1; });
        continue;
      }
      draw(e.x,e.y,(X,Y)=>{
        const flash=e.hitT>0;
        ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(X,Y+e.size*0.8,e.size,e.size*0.3,0,0,7); ctx.fill();
        ctx.fillStyle=flash?'#fff':e.color; ctx.beginPath(); ctx.arc(X,Y,e.size,0,7); ctx.fill();
        const faces={slime:'🟢',goblin:'👺',esqueleto:'💀',cultista:'🔮',golem:'🗿',elementalho:'🌊',cavaleiro:'♞',feiticeiro:'🧛'};
        ctx.font=(e.boss?26:18)+'px sans-serif'; ctx.textAlign='center'; ctx.fillText(faces[e.type]||'👾',X,Y+ (e.boss?9:6));
        if(e.boss){ ctx.strokeStyle='#facc15'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(X,Y,e.size+4+Math.sin(this.elapsed*5)*2,0,7); ctx.stroke(); ctx.lineWidth=1; }
        // barra de vida
        ctx.fillStyle='#000'; ctx.fillRect(X-20,Y-e.size-14,40,6);
        ctx.fillStyle=e.boss?'#ef4444':'#4ade80'; ctx.fillRect(X-19,Y-e.size-13,38*(e.hp/e.maxHp),4);
        if(e.boss){ ctx.fillStyle='#fff'; ctx.font='bold 10px sans-serif'; ctx.fillText(e.name,X,Y-e.size-18); }
      });
    }
    // projéteis
    for(const s of [...this.eShots,...this.pShots]){ const X=s.x-cx,Y=s.y-cy;
      ctx.fillStyle=s.color||'#fff'; ctx.beginPath(); ctx.arc(X,Y,5,0,7); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(X-1,Y-1,2,0,7); ctx.fill(); }
    // partículas
    for(const q of this.particles){ ctx.globalAlpha=Math.max(0,q.t*2); ctx.fillStyle=q.color; ctx.fillRect(q.x-cx-2,q.y-cy-2,4,4); }
    ctx.globalAlpha=1;
    // jogador
    draw(p.x,p.y,(X,Y)=>{
      if(this.hurtT>0&&Math.floor(this.elapsed*12)%2===0) ctx.globalAlpha=0.5;
      ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(X,Y+12,11,4,0,0,7); ctx.fill();
      const bob=p.moving?Math.sin(p.anim)*2:0;
      ctx.fillStyle='#2563eb'; ctx.beginPath(); ctx.arc(X,Y+bob,13,0,7); ctx.fill();
      ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(X,Y-4+bob,7,0,7); ctx.fill();
      ctx.font='14px sans-serif'; ctx.textAlign='center'; ctx.fillText('🦸',X,Y+1+bob);
      // direção
      const d={up:[0,-10],down:[0,10],left:[-10,0],right:[10,0]}[p.dir];
      ctx.fillStyle='#fde68a'; ctx.fillRect(X+d[0]-2,Y+d[1]+bob-2,4,4);
      if(p.atkAnim>0){ ctx.strokeStyle='#fef08a'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(X,Y,26,this.elapsed*10,this.elapsed*10+2); ctx.stroke(); ctx.lineWidth=1; }
      if(this.flags.artifacts.espada){ ctx.strokeStyle='#e879f9'; ctx.beginPath(); ctx.arc(X,Y,16+Math.sin(this.elapsed*4)*2,0,7); ctx.stroke(); }
      ctx.globalAlpha=1;
    });
    // floaters
    ctx.font='bold 14px sans-serif'; ctx.textAlign='center';
    for(const fl of this.floaters){ ctx.globalAlpha=Math.max(0,1-fl.t); ctx.fillStyle=fl.color; ctx.fillText(fl.text,fl.x-cx,fl.y-cy); }
    ctx.globalAlpha=1;
    // prompt E
    const it=this.nearestInteract();
    if(it&&!this.dialogOpen&&this.started){ ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(p.x-cx-52,p.y-cy-52,104,20);
      ctx.fillStyle='#facc15'; ctx.font='12px sans-serif';
      const lbl=it.type==='npc'?'Falar [E]':it.type==='chest'?'Abrir [E]':it.type==='portal'?'Viajar [E]':'Usar [E]';
      ctx.fillText(lbl,p.x-cx,p.y-cy-38); }
    this.minimap(ctx,W,H);
  },

  minimap(ctx,W,H){
    const mw=150,mh=100,mx=W-mw-12,my2=52;
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(mx-4,my2-4,mw+8,mh+8);
    const g=this.maps[this.mapId].grid;
    const sx=mw/MAP_W, sy=mh/MAP_H;
    for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++){
      const t=g[y][x];
      ctx.fillStyle=t===1?'#52525b':t===2?'#0ea5e9':'#3f6212';
      ctx.fillRect(mx+x*sx,my2+y*sy,sx,sy);
    }
    ctx.fillStyle='#fff'; ctx.fillRect(mx+this.player.x/(MAP_W*32)*mw-2,my2+this.player.y/(MAP_H*32)*mh-2,4,4);
    ctx.fillStyle='#facc15'; ctx.font='10px sans-serif'; ctx.textAlign='left'; ctx.fillText(this.maps[this.mapId].name,mx,my2-8);
  }
};
window.Game=Game;
