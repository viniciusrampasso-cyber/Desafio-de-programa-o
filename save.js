/* SAVE - localStorage */
const SaveSys = {
  key: 'lenda3artefatos_save_v1',
  save(game){
    try{
      const d = {
        px: game.player.x, py: game.player.y, map: game.mapId,
        hp: game.player.hp, maxHp: game.player.maxHp, mana: game.player.mana,
        attack: game.player.attack, coins: game.player.coins,
        potions: game.player.potions, keys: game.player.keys,
        artifacts: game.flags.artifacts, flags: game.flags,
        score: game.score, kills: game.kills, treasures: game.treasures,
        questsDone: game.questsDone, elapsed: game.elapsed,
        killedBoss: game.killedBoss, openedChests: game.openedChests,
        solvedPuzzles: game.solvedPuzzles, boughtItems: game.boughtItems||{}
      };
      localStorage.setItem(this.key, JSON.stringify(d));
      return true;
    }catch(e){ return false; }
  },
  load(){
    try{
      const raw=localStorage.getItem(this.key);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(e){ return null; }
  },
  clear(){ try{localStorage.removeItem(this.key);}catch(e){} },
  has(){ try{return !!localStorage.getItem(this.key);}catch(e){return false;} }
};
