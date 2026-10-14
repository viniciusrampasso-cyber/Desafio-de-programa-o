/* DATA - mapas, npcs, diálogos, definições de inimigos */
const TILE = 32;
const MAP_W = 30, MAP_H = 20;

function emptyGrid(fill=0){
  const g=[];
  for(let y=0;y<MAP_H;y++){ g.push(new Array(MAP_W).fill(fill)); }
  return g;
}
function border(g){
  for(let x=0;x<MAP_W;x++){ g[0][x]=1; g[MAP_H-1][x]=1; }
  for(let y=0;y<MAP_H;y++){ g[y][0]=1; g[y][MAP_W-1]=1; }
}
function rect(g,x0,y0,w,h,v=1){
  for(let y=y0;y<y0+h;y++) for(let x=x0;x<x0+w;x++)
    if(x>=0&&y>=0&&x<MAP_W&&y<MAP_H) g[y][x]=v;
}
// abre passagem na borda para portal
function gap(g,x,y){ if(x>=0&&y>=0&&x<MAP_W&&y<MAP_H) g[y][x]=0; }

function buildMaps(){
  // ---- ELDORIA ----
  const c=emptyGrid(0); border(c);
  rect(c,4,3,5,4,1);   // casa prefeito
  rect(c,18,3,6,4,1);  // loja
  rect(c,4,13,5,4,1);  // casa sábia
  rect(c,18,13,5,4,1); // casa
  rect(c,12,8,6,3,1);  // praça/fonte (obstáculo central parcial)
  gap(c,14,0); gap(c,15,0);       // saída norte -> floresta
  gap(c,29,9); gap(c,29,10);      // saída leste -> santuário (bloqueada até 3 artefatos)
  gap(c,14,19); gap(c,15,19);     // saída sul -> ruínas

  // ---- FLORESTA ----
  const f=emptyGrid(0); border(f);
  // árvores aleatórias fixas (determinísticas)
  const trees=[[3,3],[5,2],[7,4],[10,3],[13,2],[20,3],[24,4],[26,6],[4,8],[6,10],[8,12],[3,15],[10,15],[16,12],[22,10],[25,13],[27,16],[12,6],[17,5]];
  trees.forEach(([x,y])=>rect(f,x,y,2,2,1));
  // rio vertical com ponte
  for(let y=1;y<MAP_H-1;y++){ if(y===9||y===10) continue; f[y][14]=2; f[y][15]=2; }
  gap(f,14,19); gap(f,15,19); // volta sul -> eldoria
  gap(f,14,0); gap(f,15,0);   // norte -> castelo (requer cristal? não, requer passar guardião? liberado após cristal? vamos exigir cristal)
  // clareira do altar
  rect(f,12,2,6,2,0);

  // ---- RUINAS ----
  const r=emptyGrid(0); border(r);
  // labirinto de paredes
  rect(r,3,3,20,1,1); rect(r,3,3,1,8,1); rect(r,6,6,14,1,1);
  rect(r,10,6,1,6,1); rect(r,14,9,10,1,1); rect(r,20,4,1,6,1);
  rect(r,5,13,18,1,1); rect(r,5,13,1,4,1);
  // fosso água
  for(let x=4;x<26;x++){ r[16][x]=2; }
  // ponte
  r[16][13]=0; r[16][14]=0; r[16][15]=0;
  gap(r,14,0); gap(r,15,0); // norte -> eldoria
  // altar orbe no canto
  rect(r,24,2,4,3,0);

  // ---- CASTELO ----
  const k=emptyGrid(0); border(k);
  // corredores
  rect(k,2,2,26,1,1); rect(k,2,2,1,15,1); rect(k,27,2,1,15,1);
  rect(k,5,5,20,1,1); rect(k,5,5,1,8,1); rect(k,24,5,1,8,1);
  rect(k,8,9,14,1,1); rect(k,8,13,14,1,1);
  // porta do chefe (será verificada por flag de chaves)
  gap(k,14,19); gap(k,15,19); // sul -> floresta
  rect(k,12,2,6,3,0); // sala do trono/espada

  // ---- SANTUARIO ----
  const s=emptyGrid(0); border(s);
  rect(s,4,4,5,4,1); rect(s,21,4,5,4,1); rect(s,4,13,5,3,1); rect(s,21,13,5,3,1);
  gap(s,0,9); gap(s,0,10); // oeste -> eldoria
  rect(s,12,2,6,4,0); // arena final

  return {
    eldoria:{ id:'eldoria', name:'Cidade de Eldoria', grid:c, palette:'city',
      spawn:{x:14.5*32,y:14*32},
      portals:[
        {x:14,y:0,to:'floresta',sx:14.5,sy:17.5,req:null,label:'Floresta Encantada'},
        {x:14,y:19,to:'ruinas',sx:14.5,sy:1.5,req:null,label:'Ruínas Submersas'},
        {x:29,y:9,to:'santuario',sx:1.5,sy:9.5,req:'allArtifacts',label:'Santuário Final'},
        {x:29,y:10,to:'santuario',sx:1.5,sy:9.5,req:'allArtifacts',label:'Santuário Final'},
      ]},
    floresta:{ id:'floresta', name:'Floresta Encantada', grid:f, palette:'forest',
      spawn:{x:14.5*32,y:17.5*32},
      portals:[
        {x:14,y:19,to:'eldoria',sx:14.5,sy:1.5,req:null,label:'Eldoria'},
        {x:15,y:19,to:'eldoria',sx:14.5,sy:1.5,req:null,label:'Eldoria'},
        {x:14,y:0,to:'castelo',sx:14.5,sy:17.5,req:'cristal',label:'Castelo das Sombras'},
        {x:15,y:0,to:'castelo',sx:14.5,sy:17.5,req:'cristal',label:'Castelo das Sombras'},
      ]},
    ruinas:{ id:'ruinas', name:'Ruínas Submersas', grid:r, palette:'ruins',
      spawn:{x:14.5*32,y:1.5*32},
      portals:[ {x:14,y:0,to:'eldoria',sx:14.5,sy:17.5,req:null,label:'Eldoria'},
                {x:15,y:0,to:'eldoria',sx:14.5,sy:17.5,req:null,label:'Eldoria'} ]},
    castelo:{ id:'castelo', name:'Castelo das Sombras', grid:k, palette:'castle',
      spawn:{x:14.5*32,y:17.5*32},
      portals:[ {x:14,y:19,to:'floresta',sx:14.5,sy:1.5,req:null,label:'Floresta'},
                {x:15,y:19,to:'floresta',sx:14.5,sy:1.5,req:null,label:'Floresta'} ]},
    santuario:{ id:'santuario', name:'Santuário Final', grid:s, palette:'sanctum',
      spawn:{x:1.5*32,y:9.5*32},
      portals:[ {x:0,y:9,to:'eldoria',sx:27.5,sy:9.5,req:null,label:'Eldoria'},
                {x:0,y:10,to:'eldoria',sx:27.5,sy:9.5,req:null,label:'Eldoria'} ]},
  };
}

const ENEMY_DEFS = {
  slime:    { name:'Slime', hp:30, dmg:8,  speed:70,  range:220, score:50,  coins:[2,6],  color:'#4ade80', size:14 },
  goblin:   { name:'Goblin', hp:45, dmg:12, speed:110, range:260, score:50,  coins:[4,9],  color:'#a16207', size:14 },
  esqueleto:{ name:'Esqueleto', hp:60, dmg:15, speed:90,  range:240, score:50,  coins:[5,12], color:'#e5e7eb', size:15 },
  cultista: { name:'Cultista', hp:50, dmg:12, speed:60,  range:320, score:150, coins:[8,15], color:'#7c3aed', size:15, ranged:true },
  golem:    { name:'Guardião da Floresta', hp:220, dmg:18, speed:75, range:600, score:150, coins:[30,50], color:'#16a34a', size:24, boss:true },
  elementalho:{ name:'Guardião das Ruínas', hp:280, dmg:20, speed:80, range:600, score:150, coins:[30,50], color:'#0ea5e9', size:24, boss:true, ranged:true },
  cavaleiro:{ name:'Cavaleiro Sombrio', hp:350, dmg:24, speed:105, range:600, score:150, coins:[40,70], color:'#1f2937', size:26, boss:true },
  feiticeiro:{ name:'Malakar, o Feiticeiro', hp:600, dmg:22, speed:95, range:700, score:1000, coins:[100,150], color:'#991b1b', size:30, boss:true, ranged:true, final:true },
};

// spawns por mapa (tile coords)
function initialSpawns(){
  return {
    eldoria: [ {t:'slime',x:8,y:9},{t:'slime',x:22,y:10} ],
    floresta: [ {t:'slime',x:5,y:6},{t:'slime',x:22,y:6},{t:'goblin',x:8,y:14},{t:'goblin',x:20,y:15},{t:'esqueleto',x:10,y:8},{t:'cultista',x:24,y:8},{t:'golem',x:15,y:3.5,bossId:'golem'} ],
    ruinas: [ {t:'esqueleto',x:8,y:5},{t:'esqueleto',x:18,y:8},{t:'goblin',x:7,y:15},{t:'cultista',x:22,y:12},{t:'cultista',x:12,y:11},{t:'slime',x:16,y:14},{t:'elementalho',x:26,y:3,bossId:'elemental'} ],
    castelo: [ {t:'esqueleto',x:7,y:7},{t:'esqueleto',x:22,y:7},{t:'cultista',x:10,y:11},{t:'cultista',x:19,y:11},{t:'goblin',x:14,y:15},{t:'goblin',x:7,y:15},{t:'cavaleiro',x:15,y:3.5,bossId:'knight'} ],
    santuario: [ {t:'cultista',x:8,y:9},{t:'cultista',x:22,y:9},{t:'esqueleto',x:15,y:12},{t:'feiticeiro',x:15,y:4,bossId:'malakar'} ],
  };
}
