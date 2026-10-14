/* NPCS + DIALOGUES */
const NPCSys = {
  // Retorna lista de NPCs por mapa (posições em tiles -> px no main)
  listFor(mapId){
    const T=n=>n*32;
    if(mapId==='eldoria') return [
      {id:'prefeito', name:'Prefeito Aldric', emoji:'🧔', color:'#f59e0b', x:T(6.5), y:T(6.5), w:24,h:24},
      {id:'sabia', name:'Sábia Lyra', emoji:'🧙', color:'#8b5cf6', x:T(6.5), y:T(15), w:24,h:24},
      {id:'comerciante', name:'Comerciante Bram', emoji:'🧑‍💼', color:'#10b981', x:T(21), y:T(6), w:24,h:24},
      {id:'explorador', name:'Explorador perdido Theo', emoji:'🧭', color:'#0ea5e9', x:T(24), y:T(15), w:24,h:24},
    ];
    if(mapId==='floresta') return [
      {id:'guardiaoFlor', name:'Guardião Sylvan', emoji:'🧝', color:'#22c55e', x:T(10), y:T(6), w:24,h:24},
    ];
    if(mapId==='ruinas') return [
      {id:'guardiaoRui', name:'Guardião das Profundezas', emoji:'🗿', color:'#38bdf8', x:T(8), y:T(9), w:26,h:26},
    ];
    if(mapId==='castelo') return [];
    if(mapId==='santuario') return [
      {id:'feiticeiro', name:'Malakar', emoji:'🧛', color:'#ef4444', x:T(15), y:T(4), w:34,h:34, evil:true},
    ];
    return [];
  },

  dialog(game, npc){
    const f=game.flags, a=f.artifacts;
    const D=(speaker,emoji,text,opts)=>({speaker,emoji,text,opts});
    switch(npc.id){
      case 'prefeito':
        if(f.victory) return [D(npc.name,'🧔','Você salvou Eldoria! A cidade cantará seu nome por gerações. Obrigado, herói! 🏆')];
        if(a.cristal&&a.orbe&&a.espada) return [D(npc.name,'🧔','Os três artefatos! O Santuário Final abriu-se a leste da cidade. Vá — Malakar espera. Que a luz o guie!')];
        if(!f.metMayor){ return [
          D(npc.name,'🧔','Viajante! Eldoria está condenada. Malakar, o feiticeiro, cobre nossa terra de sombras. Só os Três Artefatos podem detê-lo...',[{label:'Aceitar a missão',value:'yes'},{label:'Quem é Malakar?',value:'who'}]),
        ];}
        if(!a.cristal) return [D(npc.name,'🧔','O Cristal da Luz está na Floresta Encantada, ao norte. Fale com Sylvan, o guardião. Cuidado com slimes e goblins!')];
        if(!a.orbe) return [D(npc.name,'🧔','Você tem o Cristal! Agora desça às Ruínas Submersas, ao sul. O guardião testará sua mente.')];
        if(!a.espada) return [D(npc.name,'🧔','Dois artefatos! Resta a Espada Ancestral no Castelo das Sombras, ao norte da floresta. Leve poções!')];
        return [D(npc.name,'🧔','Vá ao Santuário Final a leste!')];
      case 'sabia':
        if(!f.metSage) return [
          D('Sábia Lyra','🧙','Os artefatos: Cristal da Luz (floresta), Orbe das Águas (ruínas) e Espada Ancestral (castelo). Cada um é guardado por um chefe.',[{label:'Entendi',value:'ok'},{label:'Dica da floresta?',value:'tip'}]),
        ];
        if(!a.cristal) return [D('Sábia Lyra','🧙','Na floresta há 3 runas antigas. Sylvan diz: "A ordem é: a do MEIO, depois a do OESTE, depois a do LESTE". Decore isso!')];
        if(!a.orbe) return [D('Sábia Lyra','🧙','Nas ruínas, o guardião perguntará: "O que corre sem pernas e canta sem voz?" Resposta: o RIO. E pise as placas na ordem 1-2-3.')];
        if(!a.espada) return [D('Sábia Lyra','🧙','No castelo há 2 chaves escondidas em baús. A Espada aumenta seu ataque de 15 para 28!')];
        return [D('Sábia Lyra','🧙','Os três reunidos... O Santuário leste aguarda. Acabe com Malakar!')];
      case 'comerciante':
        return [D('Comerciante Bram','🧑‍💼',`Bem-vindo! Poção (20🪙, cura 50) — você tem ${game.player.coins}🪙 e ${game.player.potions}🧪. Chave extra: 30🪙.`,[
          {label:'Comprar poção (20🪙)',value:'buy_potion'},
          {label:'Comprar chave (30🪙)',value:'buy_key'},
          {label:'Sair',value:'bye'}])];
      case 'explorador':
        if(!f.helpedTheo) return [D('Theo','🧭','Socorro! Perdi meu amuleto na floresta... um goblin o roubou! Traga-o de volta e lhe darei 40 moedas! (+250 pts)',[{label:'Vou ajudar!',value:'accept'},{label:'Depois',value:'bye'}])];
        if(f.helpedTheo && !f.theoRewarded) return [D('Theo','🧭','Você recuperou meu amuleto! Tome 40 moedas como prometido!')];
        return [D('Theo','🧭','Obrigado de novo! Dizem que há um tesouro secreto atrás da cachoeira da floresta... (procure o baú dourado)')];
      case 'guardiaoFlor':
        if(a.cristal) return [D('Sylvan','🧝','O Cristal escolheu você. A água das ruínas o aguarda...')];
        return [D('Sylvan','🧝','Para despertar o altar do Cristal, ative as 3 runas nesta ordem: MEIO → OESTE → LESTE. Depois o Guardião da Floresta despertará. Prove seu valor!')];
      case 'guardiaoRui':
        if(a.orbe) return [D('Guardião','🗿','O Orbe é seu. O castelo o aguarda...')];
        if(!f.ruiRiddleDone) return [D('Guardião','🗿','Responda para provar sabedoria: "Corro sem pernas, canto sem voz, e sem mim nada vive. O que sou?"',[
          {label:'O rio / a água',value:'rio'},
          {label:'O vento',value:'vento'},
          {label:'O fogo',value:'fogo'}])];
        return [D('Guardião','🗿','Agora pise as 3 placas de pedra em ordem (1→2→3, do oeste ao leste). Então meu irmão elemental virá testá-lo.')];
      case 'feiticeiro':
        return [D('Malakar','🧛','TOLO! Reuniu os três artefatos? Então venha morrer! Eldoria cairá em trevas eternas! HAHAHA!')];
    }
    return [D(npc.name,npc.emoji,'...')];
  },

  // Trata escolha de diálogo; retorna true se diálogo deve fechar
  choose(game, npc, value){
    const f=game.flags;
    if(npc.id==='prefeito' && !f.metMayor){
      if(value==='who'){
        game.dialogLines=[{speaker:'Prefeito Aldric',emoji:'🧔',text:'Malakar foi meu aprendiz... corrompido pela sede de poder. Selamos os artefatos para detê-lo. Agora só você pode reuni-los.'}];
        game.dialogIdx=0; UI.renderDialog(game); return false;
      }
      f.metMayor=true; game.questsDone++;
      ScoreSys.add(game,100,'Missão iniciada');
      AudioSys.sfx('quest'); UI.toast('Missão: fale com a Sábia Lyra');
      return true;
    }
    if(npc.id==='sabia' && !f.metSage){
      if(value==='tip'){ UI.toast('Dica: runas MEIO → OESTE → LESTE'); return true; }
      f.metSage=true; game.questsDone++;
      ScoreSys.add(game,100,'Sabedoria recebida');
      return true;
    }
    if(npc.id==='comerciante'){
      if(value==='buy_potion'){
        if(game.player.coins>=20){ game.player.coins-=20; game.player.potions++; AudioSys.sfx('coin'); UI.toast('Poção comprada! 🧪'); }
        else { AudioSys.sfx('error'); UI.toast('Moedas insuficientes!'); }
        return true;
      }
      if(value==='buy_key'){
        if(game.player.coins>=30){ game.player.coins-=30; game.player.keys++; AudioSys.sfx('coin'); UI.toast('Chave comprada! 🗝️'); }
        else { AudioSys.sfx('error'); UI.toast('Moedas insuficientes!'); }
        return true;
      }
      return true;
    }
    if(npc.id==='explorador'){
      if(value==='accept'){ f.theoQuest=true; UI.toast('Missão secundária: recupere o amuleto (derrote goblins na floresta)'); return true; }
      return true;
    }
    if(npc.id==='guardiaoRui' && !f.ruiRiddleDone){
      if(value==='rio'){
        f.ruiRiddleDone=true; game.questsDone++;
        ScoreSys.add(game,200,'Enigma resolvido');
        AudioSys.sfx('puzzle_ok');
        game.dialogLines=[{speaker:'Guardião',emoji:'🗿',text:'Correto! O RIO. Agora pise as placas 1→2→3!'}];
        game.dialogIdx=0; UI.renderDialog(game); return false;
      } else {
        AudioSys.sfx('puzzle_bad'); UI.toast('Resposta errada! Tente de novo.');
        return true;
      }
    }
    return true;
  }
};
