/* QUESTS + SCORE */
const QuestSys = {
  objective(game){
    const a=game.flags.artifacts, f=game.flags;
    if(game.flags.victory) return 'Eldoria está salva! Fale com o prefeito. 🎉';
    if(game.mapId==='santuario' && a.cristal&&a.orbe&&a.espada) return 'Derrote Malakar no Santuário Final!';
    if(a.cristal&&a.orbe&&a.espada) return 'Volte a Eldoria e vá ao Santuário Final (leste da cidade).';
    if(!f.metMayor) return 'Fale com o Prefeito Aldric em Eldoria (casa N-O).';
    if(!f.metSage) return 'Fale com a Sábia Lyra (casa S-O) e depois explore.';
    if(!a.cristal) return 'Floresta Encantada (norte): resolva as runas e vença o Guardião.';
    if(!a.orbe) return 'Ruínas Submersas (sul): responda o enigma, pise as placas e vença o Guardião.';
    if(!a.espada) return 'Castelo das Sombras (norte da floresta): ache 2 chaves e vença o Cavaleiro.';
    return 'Reúna os artefatos.';
  },
  phase(game){
    const a=game.flags.artifacts;
    if(game.flags.victory) return 6;
    if(game.mapId==='santuario') return 5;
    if(a.cristal&&a.orbe) return 4;
    if(a.cristal) return 3;
    if(game.flags.metMayor) return 2;
    return 1;
  },
  phaseName(p){
    return ['','Fase 1 — O Chamado de Eldoria','Fase 2 — A Floresta Encantada','Fase 3 — As Ruínas Submersas','Fase 4 — O Castelo das Sombras','Fase 5 — O Santuário Final','Jogo Concluído'][p]||'';
  }
};

const ScoreSys = {
  add(game, pts, reason){
    game.score += pts;
    game.floaters.push({x:game.player.x, y:game.player.y-30, text:'+'+pts, t:0, color:'#facc15'});
    UI.toast('+'+pts+' pts — '+reason);
  }
};
