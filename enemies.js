/* ENEMIES - spawn, IA, combate */
const EnemySys = {
  spawnFor(game, mapId){
    const list = (initialSpawns()[mapId]||[]);
    game.enemies = list.map((s,i)=>{
      // chefes já mortos não renascem
      if(s.bossId && game.killedBoss[s.bossId]) return null;
      // altar bloqueado: golem só aparece após runas; elemental após placas; knight após chaves? aparecem sempre mas artefato exige puzzle
      const d = ENEMY_DEFS[s.t];
      return {
        id: mapId+'_'+i+'_'+s.t, type:s.t, bossId:s.bossId||null,
        name:d.name, x:s.x*32, y:s.y*32, w:d.size*2, h:d.size*2,
        hp:d.hp, maxHp:d.hp, dmg:d.dmg, speed:d.speed, range:d.range,
        score:d.score, color:d.color, size:d.size, ranged:!!d.ranged,
        final:!!d.final, boss:!!d.boss,
        vx:0, vy:0, atkCd:0, shootCd:Math.random()*2, hitT:0, retreating:0, patrol:Math.random()*6.28,
        dead:false, scored:false
      };
    }).filter(Boolean);
  },

  update(game, dt){
    const p=game.player;
    for(const e of game.enemies){
      if(e.dead) continue;
      if(e.hitT>0) e.hitT-=dt;
      if(e.atkCd>0) e.atkCd-=dt;
      if(e.shootCd>0) e.shootCd-=dt;
      const dx=p.x-e.x, dy=p.y-e.y, dist=Math.hypot(dx,dy)||1;

      // chefes dormindo: golem/elemental/knight só acordam com puzzle completo (exceto malakar sempre ativo)
      if(e.bossId==='golem' && !game.flags.forestRunesOk) continue;
      if(e.bossId==='elemental' && !game.flags.ruinsPlatesOk) continue;

      let mx=0,my=0;
      if(e.type==='cultista'||e.final||e.bossId==='elemental'){
        // ranged: mantém distância ~180, atira
        if(dist<e.range){
          if(dist>220){ mx=dx/dist*e.speed; my=dy/dist*e.speed; }
          else if(dist<130){ mx=-dx/dist*e.speed; my=-dy/dist*e.speed; }
          if(e.shootCd<=0 && dist<380){
            game.eShots.push({x:e.x,y:e.y,vx:dx/dist*220,vy:dy/dist*220,dmg:e.dmg,t:3,color:'#c084fc'});
            AudioSys.sfx('shoot'); e.shootCd = e.final? 0.9 : 1.6;
            if(e.final){ // padrão radial do chefe final
              for(let k=0;k<6;k++){ const a=k*Math.PI/3+game.elapsed;
                game.eShots.push({x:e.x,y:e.y,vx:Math.cos(a)*180,vy:Math.sin(a)*180,dmg:14,t:3,color:'#f87171'}); }
            }
          }
        }
      } else if(e.type==='goblin'){
        if(dist<e.range){
          if(e.retreating>0){ e.retreating-=dt; mx=-dx/dist*e.speed; my=-dy/dist*e.speed; }
          else { mx=dx/dist*e.speed; my=dy/dist*e.speed; }
        }
      } else if(e.type==='esqueleto'){
        e.patrol+=dt;
        if(dist<e.range){ mx=dx/dist*e.speed; my=dy/dist*e.speed; }
        else { mx=Math.cos(e.patrol)*30; my=Math.sin(e.patrol)*30; }
      } else {
        if(dist<e.range){ mx=dx/dist*e.speed; my=dy/dist*e.speed; }
      }
      // cavaleiro sombrio: investidas
      if(e.bossId==='knight' && dist<400 && e.shootCd<=0){
        e.dashT=0.5; e.shootCd=3;
      }
      let sp=1;
      if(e.bossId==='knight' && e.dashT>0){ e.dashT-=dt; sp=3.2; }
      game.tryMove(e, mx*sp*dt, my*sp*dt);

      // contato causa dano
      if(dist < (e.size+14) && e.atkCd<=0 && !game.over){
        game.damagePlayer(e.dmg, e.x, e.y);
        e.atkCd=1.0;
        if(e.type==='goblin') e.retreating=0.7;
      }
    }
    // projéteis inimigos
    for(const s of game.eShots){
      s.x+=s.vx*dt; s.y+=s.vy*dt; s.t-=dt;
      if(game.isSolidAt(s.x,s.y)) s.t=0;
      const d=Math.hypot(p.x-s.x,p.y-s.y);
      if(d<16 && !game.over){ game.damagePlayer(s.dmg,s.x,s.y); s.t=0; }
    }
    game.eShots = game.eShots.filter(s=>s.t>0);
    // projéteis jogador (fireball)
    for(const s of game.pShots){
      s.x+=s.vx*dt; s.y+=s.vy*dt; s.t-=dt;
      if(game.isSolidAt(s.x,s.y)){ s.t=0; game.burst(s.x,s.y,'#fb923c',8); }
      for(const e of game.enemies){
        if(e.dead) continue;
        if(e.bossId==='golem' && !game.flags.forestRunesOk) continue;
        if(e.bossId==='elemental' && !game.flags.ruinsPlatesOk) continue;
        if(Math.hypot(e.x-s.x,e.y-s.y)<e.size+8){ game.hitEnemy(e, s.dmg, s.x, s.y); s.t=0; break; }
      }
    }
    game.pShots = game.pShots.filter(s=>s.t>0);
  }
};
