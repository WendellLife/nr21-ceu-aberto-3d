# NR 21 • Trabalhos a céu aberto (jogo educativo 3D)

Jogo educativo da série de jogos de segurança do trabalho. Você é o **encarregado de uma frente de trabalho** de pavimentação e drenagem, em um dia de calor intenso que termina com uma **tempestade com raios**. Organize o turno, proteja a equipe do calor e do raio, socorra um colega e confira alojamento e moradia rural.

> **Conteúdo educativo.** Não substitui o treinamento prático nem a avaliação de um profissional de segurança do trabalho. Leia o [SAFETY-NOTES.md](SAFETY-NOTES.md).

## Como abrir

Requer Node.js 18 ou superior (ou Python 3).

- **Windows:** dê dois cliques em `INICIAR.cmd` e abra http://127.0.0.1:8765
- **Qualquer sistema:** `npm start` (ou `node server.mjs`) e abra http://127.0.0.1:8765
- **Hospedagem estática:** publique a pasta `dist/` como está. Não há build nem dependências npm. O Three.js 0.170.0 está em `dist/`.

## Controles

| Ação | Teclado | Celular |
|---|---|---|
| Mover | WASD ou setas | botões de seta na tela |
| Correr | Shift | — |
| Interagir | E | botão AÇÃO |
| Fontes e origem do conteúdo | botão **Fontes** | botão **Fontes** |
| Pausar | Esc ou botão Ⅱ | botão Ⅱ |

O losango verde é você. O losango azul e o alvo luminoso marcam o destino. O painel no canto superior direito mostra horário, temperatura, **IBUTG** (com o nível de ação e o limite do serviço pesado) e, na tempestade, a **contagem entre o relâmpago e o trovão**.

## Origem do conteúdo (muito importante)

Cada etapa mostra de onde vem o que é cobrado:

| Etiqueta | Significa |
|---|---|
| **Em vigor** | NR 21 vigente (Portaria MTb 3.214/1978, última alteração Portaria MTE 2.037/1999), NR 9 Anexo 3 (calor), NR 6, NR 24, NR 1 e NHO 06. |
| **Proposta em consulta, ainda não vigente** | Texto submetido à Consulta Pública em 11/06/2025. Só vale se for publicado no DOU. |
| **Boa prática, não é item de NR** | Procedimento técnico útil, como a regra dos 30 s / 30 min para raios. |

A NR 21 em vigor (itens 21.1 a 21.14) trata de abrigos, medidas contra insolação e calor, alojamento e moradia rural. **Ela não trata de raios, tempestades, pausas nem água potável.** Esses temas aparecem no jogo como proposta ou como boa prática, sempre identificados.

## Sequência das 20 etapas

| # | Etapa | Origem |
|---|---|---|
| 1 | Leia a previsão do dia | NR 1 item 1.5 (conferir subitem) • NR 21 item 21.2 |
| 2 | Confira o abrigo | NR 21 item 21.1 • proposta 21.3 |
| 3 | Garanta a água potável | NR 9 Anexo 3 item 3.1 (a) • NR 24 item 24.9 (conferir subitem) |
| 4 | Faça a orientação de início de turno | NR 9 Anexo 3 item 2.1.1 |
| 5 | Distribua proteção contra o sol | NR 21 item 21.2 • NR 6 itens 6.3 e 6.6.1 • proposta 21.5 e 21.6 |
| 6 | Aclimatize o novato | NR 9 Anexo 3 itens 4.1 e 4.2 • NHO 06 |
| 7 | Programe o serviço pesado para o horário ameno | NR 9 Anexo 3 item 3.1 (b) |
| 8 | Confira o alojamento | NR 21 itens 21.3 e 21.5 |
| 9 | Confira a moradia da família do Marcos | NR 21 itens 21.6, 21.6.1 e 21.7 |
| 10 | Confira o poço e a fossa | NR 21 itens 21.10, 21.13 e 21.14 |
| 11 | Leia o IBUTG com a Jéssica | NR 9 Anexo 3 itens 2.4 e 2.4.2 • NHO 06 • Quadros 1 e 2 |
| 12 | Organize pausa, água e rodízio | NR 9 Anexo 3 itens 3.2.2 (b) e (c) e 3.1 (a) |
| 13 | Reconheça os sinais no Cleiton | NR 9 Anexo 3 item 2.1.1 (b) e (c) |
| 14 | Socorra o Cleiton | NR 9 Anexo 3 item 5.1 |
| 15 | O céu fecha: meça o raio | proposta 21.7 • boa prática (30 s / 30 min) |
| 16 | Interrompa o serviço e afaste a equipe | proposta 21.7 • boa prática |
| 17 | Leve todos ao abrigo seguro | NR 21 item 21.1 • proposta 21.3 e 21.7 • boa prática |
| 18 | Faça a contagem | proposta 21.7 • boa prática |
| 19 | Aguarde e libere o retorno | boa prática (30 min sem trovão) |
| 20 | Registre e revise o PGR | NR 1 item 1.5 (conferir subitem) • boa prática |

Cada decisão tem três opções, uma única correta, e cada opção tem um feedback didático. Na etapa 18 (contagem), a ação é feita no próprio cenário, com a prancheta.

## Personagens

| Nome | Função | Papel no jogo |
|---|---|---|
| **Você** | Encarregado da frente | Jogador |
| **Airton** | Operador de rolo compactador | Experiente e teimoso: quer terminar a passada sob raios |
| **Jéssica** | Técnica de segurança | Mede o IBUTG e apoia a decisão |
| **Cleiton** | Servente | Sofre exaustão pelo calor |
| **Davi** | Servente novato | Primeiro dia, sem aclimatação |
| **Rosana** | Motorista do basculante | Espera a carga; abriga-se na tempestade |
| **Marcos** | Caseiro | Mora com a família no canteiro (moradia rural) |

## Cenário e efeitos

Canteiro de pavimentação e drenagem ao lado de uma via, com valeta aberta, rolo compactador, basculante, retroescavadeira, torre de luz, árvores isoladas, **tenda de vivência** (sombra real), ponto de água, bancada de EPI, quadro de avisos, termômetro de globo, **container de apoio fechado** (abrigo seguro contra raios), alojamento, moradia do caseiro, poço, fossa e sanitário.

Efeitos: sol forte com **ondulação do ar quente** (níveis Média e Alta) e brilho de sol em todos os níveis, **suor e cansaço** nos personagens, céu que escurece, vento nas árvores e na lona, **chuva**, **relâmpago com trovão atrasado**, poças e solo molhado.

## Gráficos

Qualidade **Auto / Baixa / Média / Alta**, escolhida pelo hardware e ajustada pelo desempenho (botão no topo). A ondulação do calor usa pós-processamento e só existe em Média e Alta. Em celulares a resolução é limitada para manter a fluidez.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `dist/index.html`, `dist/style.css` | Interface (mesma da série, com painel de clima e etiquetas de origem) |
| `dist/rules.mjs` | Regras puras e testáveis: etapas, decisões, referências, linha do tempo de calor e tempestade |
| `dist/crew.mjs` | Fases de cada trabalhador e busca de rotas |
| `dist/layout.mjs` | Planta do canteiro, posições e vagas de abrigo |
| `dist/scenery.mjs` | Cenário 3D estático |
| `dist/game.mjs` | Jogo: câmera, equipe, clima, HUD e diálogos |
| `dist/graphics.mjs` | Qualidade, pós-processamento, texturas, chuva, raio e suor |
| `dist/characters.mjs` | Personagens com esqueleto, animações e poses de ação |
| `dist/models/` | Modelos GLB dos personagens |
| `server.mjs`, `INICIAR.cmd` | Servidor local (127.0.0.1:8765) |
| `manifest.mjs` | Gera o `MANIFESTO-SHA256.json` (`npm run manifest`) |
| `test.mjs` | Testes em Node puro (`npm test`) |

## Testes

```
npm test
```

Cobrem: ordem das 20 etapas; uma única resposta certa por decisão, com feedback e referência; origem da norma em toda etapa; **conteúdo de raios nunca apresentado como item vigente**; itens da NR 21 vigente dentro de 21.1 a 21.14; coerência do texto com os números da linha do tempo (IBUTG 29,4 e trovão em 11 s); fases da equipe; acessibilidade de todos os destinos; passagem pela porta do container; distâncias de poço e fossa.
