/* UI - HUD, diálogos, inventário, menus, minimapa */
const UI = {
  toast(msg, ms=2600){
    const el=document.getElementById('toast');
    el.textContent=msg; el.classList.add('show');
    clearTimeout(this._tt); this._tt=setTimeout(()=>el.classList.remove('show'), ms);
  },
  banner(msg, sub='', ms=2600){
    const b=document.getElementById('banner');
    b.querySelector('.b-title').textContent=msg;
    b.querySelector('.b-sub').textContent=sub;
    b.classList.add('show');
    clearTimeout(this._bt); this._bt=setTimeout(()=>b.classList.remove('show'), ms);
  },
  renderHUD(game){
    const p=game.player;
    document.getElementById('hp-fill').style.width=(100*p.hp/p.maxHp)+'%';
    document.getElementById('hp-text').textContent=Math.ceil(p.hp)+'/'+p.maxHp;
    document.getElementById('mp-fill').style.width=(100*p.mana/100)+'%';
    document.getElementById('mp-text').textContent=Math.floor(p.mana)+'/100';
    document.getElementById('score').textContent=game.score;
    document.getElementById('coins').textContent=p.coins;
    document.getElementById('region').textContent=game.maps[game.mapId].name;
    document.getElementById('objective').textContent='🎯 '+QuestSys.objective(game);
    document.getElementById('phase').textContent=QuestSys.phaseName(QuestSys.phase(game));
    const a=game.flags.artifacts;
    document.getElementById('art1').classList.toggle('got',!!a.cristal);
    document.getElementById('art2').classList.toggle('got',!!a.orbe);
    document.getElementById('art3').classList.toggle('got',!!a.espada);
    document.getElementById('pot-count').textContent='🧪 '+p.potions+' (Q)';
    document.getElementById('key-count').textContent='🗝️ '+p.keys;
  },
  renderDialog(game){
    const box=document.getElementById('dialog');
    const line=game.dialogLines[game.dialogIdx];
    if(!line){ box.classList.add('hidden'); game.dialogOpen=false; game.npcActive=null; return; }
    game.dialogOpen=true; box.classList.remove('hidden');
    document.getElementById('dlg-name').textContent=line.speaker;
    document.getElementById('dlg-face').textContent=line.emoji||'🙂';
    document.getElementById('dlg-text').textContent=line.text;
    const opts=document.getElementById('dlg-opts');
    opts.innerHTML='';
    if(line.opts && game.dialogIdx===game.dialogLines.length-1){
      line.opts.forEach(o=>{
        const b=document.createElement('button');
        b.className='dlg-btn'; b.textContent=o.label;
        b.onclick=(ev)=>{ev.stopPropagation(); game.chooseDialog(o.value);};
        opts.appendChild(b);
      });
      document.getElementById('dlg-hint').textContent='Escolha uma opção ⬆';
    } else {
      document.getElementById('dlg-hint').textContent='[E] ou clique para continuar…';
    }
  },
  renderInventory(game){
    const p=game.player, a=game.flags.artifacts;
    const items=[
      {i:'💎',n:'Cristal da Luz',d:a.cristal?'Brilha com aura dourada. Desbloqueia mecanismos antigos.':'Ainda não encontrado (Floresta).',q:a.cristal?'1':'—'},
      {i:'🔮',n:'Orbe das Águas',d:a.orbe?'Azul e mágico. Ativa mecanismos de água.':'Ainda não encontrado (Ruínas).',q:a.orbe?'1':'—'},
      {i:'🗡️',n:'Espada Ancestral',d:a.espada?'Lendária! Ataque 15 → 28.':'Ainda não encontrada (Castelo).',q:a.espada?'1':'—'},
      {i:'🧪',n:'Poção de Cura',d:'Restaura 50 de vida. Tecla Q para usar.',q:'x'+p.potions},
      {i:'🗝️',n:'Chave',d:'Abre portas e baús trancados do castelo.',q:'x'+p.keys},
      {i:'🪙',n:'Moedas',d:'Para comprar poções e chaves.',q:'x'+p.coins},
      {i:'🏺',n:'Tesouros',d:'Relíquias encontradas em baús secretos.',q:'x'+game.treasures},
      {i:'🧭',n:'Amuleto de Theo',d:game.flags.hasAmulet?'Amuleto recuperado! Devolva a Theo.':(game.flags.theoQuest?'Um goblin da floresta o guarda...':'—'),q:game.flags.hasAmulet?'1':'—'},
    ];
    document.getElementById('inv-items').innerHTML=items.map(o=>
      `<div class="inv-item"><div class="inv-ico">${o.i}</div><div><b>${o.n} ${o.q}</b><br><small>${o.d}</small></div></div>`).join('');
    document.getElementById('inv-stats').textContent=`Pontos ${game.score} • Abates ${game.kills} • Tesouros ${game.treasures} • Missões ${game.questsDone} • Tempo ${Math.floor(game.elapsed/60)}:${String(Math.floor(game.elapsed%60)).padStart(2,'0')}`;
  },
  showPause(game, v){
    document.getElementById('pause').classList.toggle('hidden',!v);
    if(v) this.renderInventory(game);
  },
  showDead(v){ document.getElementById('dead').classList.toggle('hidden',!v); },
  showWin(game){
    document.getElementById('win').classList.remove('hidden');
    const t=Math.floor(game.elapsed);
    document.getElementById('win-stats').innerHTML=
      `🏆 Pontuação total: <b>${game.score}</b><br>👹 Inimigos derrotados: <b>${game.kills}</b><br>💰 Tesouros: <b>${game.treasures}</b><br>📜 Missões concluídas: <b>${game.questsDone}</b><br>⏱️ Tempo de jogo: <b>${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}</b><br>💎 Artefatos: <b>${['💎','🔮','🗡️'].filter((_,i)=>[game.flags.artifacts.cristal,game.flags.artifacts.orbe,game.flags.artifacts.espada][i]).join(' ')||'—'}</b>`;
  }
};
