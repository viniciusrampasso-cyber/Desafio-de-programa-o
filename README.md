# ⚔️ A Lenda dos Três Artefatos

Jogo de aventura 2D completo em **HTML + CSS + JavaScript (Canvas)**, sem dependências externas. Salve Eldoria reunindo os 3 artefatos e derrotando Malakar.

## ▶ Como jogar

Opção 1 — abrir direto (duplo clique):
```
lenda-dos-tres-artefatos/index.html
```

Opção 2 — servidor local (recomendado):
```bash
cd lenda-dos-tres-artefatos
python3 -m http.server 8080
# abra http://localhost:8080
```

## 🎮 Controles

| Tecla | Ação |
|---|---|
| W A S D / setas | mover |
| Espaço | atacar (espada) |
| E | falar / abrir baú / usar runa, placa, altar, portal (clique também avança diálogo) |
| F | magia (🔥 20 mana) |
| Q | poção (+50 ❤️) |
| I | inventário / pausa |
| Esc | pausa / fechar diálogo |

📱 No celular aparecem D-pad + botões ⚔️ 🔥 E 🧪.

## 🗺️ Roteiro das 5 fases

1. **Eldoria** — fale com Prefeito Aldric (casa NO) e Sábia Lyra (casa SO). Compre poções com Bram. Theo pede o amuleto.
2. **Floresta (norte)** — runas na ordem **MEIO → OESTE → LESTE**, vença o Golem, pegue o 💎 **Cristal** no altar. Goblins dropam o amuleto de Theo (missão +250 pts).
3. **Ruínas (sul)** — responda o enigma do Guardião (**"o rio"**), pise as placas **1→2→3**, vença o Elemental, pegue o 🔮 **Orbe**.
4. **Castelo (norte da floresta, exige 💎)** — abra baús para 2 🗝️, vença o Cavaleiro Sombrio, use 1 🗝️ no pedestal e pegue a 🗡️ **Espada** (ataque 15→28).
5. **Santuário (leste de Eldoria, exige 3 artefatos)** — vença cultistas e **Malakar** (tiros radiais) → tela de vitória com score, abates, tesouros, missões e tempo.

## 📁 Arquitetura

```
index.html  css/style.css
js/audio.js      música + SFX sintetizados (WebAudio)
js/data.js       mapas 30×20, paletas, inimigos, spawns
js/save.js       save/load localStorage
js/quests.js     objetivos, fases, pontuação
js/npcs.js       7 NPCs + diálogos com escolhas
js/enemies.js    IA (persegue/recua/patrulha/ranged) + chefes
js/ui.js         HUD, diálogo, inventário, pausa, vitória/derrota
js/main.js       motor: loop, câmera, colisão, combate, puzzles, portais
```

## ✅ Sistemas implementados

- Colisão real por tile (paredes/água/árvores não atravessáveis), portais com requisitos.
- 8 tipos de inimigos (slime, goblin, esqueleto, cultista + 4 chefes), projéteis, knockback, HP bars, drops.
- Diálogos com retrato/nome/opções, que mudam com o progresso; loja funcional.
- Inventário (artefatos, poção, chave, moedas, tesouros, amuleto), HUD, minimapa, objetivo e fase.
- Pontuação anti-farm (respawn vale 5 pts), save automático + manual, telas de vitória/derrota, partículas, SFX/música por região.

Divirta-se, herói! 🏆
