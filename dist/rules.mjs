// Regras da fase "Trabalhos a céu aberto" (NR 21), no mesmo padrão dos demais jogos da série.
// Cada objetivo traz as referências normativas em "refs". O campo "kind" diz de onde vem o conteúdo:
//  vigente  → texto em vigor (NR 21 de 1999, NR 9 Anexo 3, NR 6, NR 24, NR 1)
//  proposta → proposta de nova NR 21 submetida à Consulta Pública em 11/06/2025. NÃO está em vigor.
//  pratica  → boa prática técnica, que não é item de norma regulamentadora.
// "check:true" marca número de subitem que deve ser conferido no texto consolidado antes de usar em treinamento.
export const team = 6;
export const KINDS = {
 vigente:'Em vigor',
 proposta:'Proposta em consulta — ainda não vigente',
 pratica:'Boa prática — não é item de NR'
};
const nr21=(item,kind='vigente')=>({norm:'NR 21',item,kind});
const nr9=item=>({norm:'NR 9 • Anexo 3 (Calor)',item,kind:'vigente'});
export const objectives = [
 {id:'previsao',refs:[{norm:'NR 1',item:'1.5 (GRO/PGR)',kind:'vigente',check:true},nr21('21.2')],
  title:'Leia a previsão do dia',description:'No quadro de avisos da frente de trabalho, veja a previsão e o que o PGR manda fazer em dia de calor e de tempestade.',
  tip:'O PGR existe para antecipar os riscos. Previsão de calor forte e de tempestade entra no planejamento do turno, não na hora em que o problema chega.',x:2.2,z:-2.6,r:1.9,
  choices:[
   {id:'plano',correct:true,label:'“Calor forte até o meio da tarde e tempestade no fim do dia. Vou aplicar as medidas de calor do PGR e combinar hoje com a equipe o plano para a tempestade.”',feedback:'Risco antecipado: o turno começa com as medidas de calor e com o plano de tempestade combinado.'},
   {id:'normal',label:'“É dia de sol. Sigo o serviço normal e vejo a chuva quando ela chegar.”',feedback:'O PGR serve para antecipar. Esperar a tempestade chegar deixa a equipe sem plano no pior momento.'},
   {id:'outro',label:'“Previsão do tempo é coisa da meteorologia, não me diz respeito como encarregado.”',feedback:'O encarregado aplica o que o PGR define para o dia. Saber a previsão faz parte de organizar o turno.'}
  ]},
 {id:'abrigo',refs:[nr21('21.1'),nr21('21.3 — abrigos facilmente acessíveis','proposta')],
  title:'Confira o abrigo',description:'Vá até a tenda de vivência e confira se ela protege toda a equipe do sol e da chuva.',
  tip:'O item 21.1 exige abrigo, ainda que rústico, capaz de proteger os trabalhadores contra intempéries. Sombra para todos, perto da frente de trabalho.',x:6.5,z:1.4,r:2.6,
  choices:[
   {id:'todos',correct:true,label:'Tem sombra e bancos para toda a equipe, perto da frente de trabalho. Está de acordo: o abrigo pode ser rústico, mas precisa proteger todos.',feedback:'O abrigo atende: protege toda a equipe e está perto do serviço, como pede o item 21.1.'},
   {id:'metade',label:'Só há sombra para metade da turma. O resto se revezaria ou ficaria sob as árvores da beira da via.',feedback:'O item 21.1 pede abrigo capaz de proteger os trabalhadores, não parte deles. Amplie a cobertura ou os bancos.'},
   {id:'caminhao',label:'Pode usar a sombra do caminhão basculante como abrigo, que já está parado ali.',feedback:'Veículo de trabalho não é abrigo previsto e não acomoda a equipe. O abrigo precisa ser planejado para todos.'}
  ]},
 {id:'agua',refs:[nr9('3.1 (a)'),{norm:'NR 24',item:'24.9 (água para consumo humano)',kind:'vigente',check:true}],
  title:'Garanta a água potável',description:'No ponto de água, verifique a água da equipe para o dia de calor.',
  tip:'Acima do nível de ação, o empregador deve disponibilizar água fresca potável e incentivar a ingestão. Recipiente fechado, na sombra, perto da equipe.',x:.5,z:2.1,r:1.7,
  choices:[
   {id:'fresca',correct:true,label:'Água fresca e potável em garrafões fechados, na sombra, perto da equipe. Orientar a beber aos poucos, sem esperar sentir sede.',feedback:'Correto: água potável, fresca, fornecida pela empresa e com incentivo para beber ao longo do dia.'},
   {id:'balde',label:'Água do ponto de obra num balde aberto, com um copo comum para todos.',feedback:'A água precisa ser potável e protegida. Balde aberto e copo coletivo são fontes de contaminação.'},
   {id:'trazer',label:'Cada um traz a sua garrafa de casa, se quiser.',feedback:'Fornecer a água e incentivar o consumo é dever do empregador quando há exposição ao calor.'}
  ]},
 {id:'dds',refs:[nr9('2.1.1')],
  title:'Faça a orientação de início de turno',description:'Reúna a equipe na roda e faça a conversa de abertura do dia.',
  tip:'O Anexo 3 pede orientar sobre fatores de risco do calor, sinais e sintomas dos distúrbios, o dever de avisar cedo, medidas de prevenção e condutas de emergência.',x:-2,z:3.6,r:2.2,
  choices:[
   {id:'completa',correct:true,label:'Falar dos riscos do calor, dos sinais de mal-estar (tontura, cãibra, náusea, confusão), de avisar cedo e do que fazer, e combinar o plano de tempestade.',feedback:'Orientação completa: riscos, sinais, dever de avisar, condutas e situação de emergência.'},
   {id:'epi',label:'Só lembrar que todos devem usar o EPI e deixar o resto para cada um se cuidar.',feedback:'Faltam os sinais do calor, o dever de avisar e as condutas de emergência. EPI sozinho não basta.'},
   {id:'pular',label:'Dispensar a conversa hoje para ganhar tempo de produção.',feedback:'Orientar os trabalhadores faz parte da prevenção. A conversa leva poucos minutos e evita ocorrências.'}
  ]},
 {id:'epi',refs:[nr21('21.2'),{norm:'NR 6',item:'6.3 e 6.6.1',kind:'vigente',check:true},nr21('21.5 e 21.6 — protetor solar, óculos e vestimenta','proposta')],
  title:'Distribua proteção contra o sol',description:'Na bancada de EPI, escolha o que a equipe vai usar para o dia de sol forte.',
  tip:'A NR 21 vigente exige medidas especiais contra insolação excessiva (21.2). EPI é fornecido gratuitamente, adequado ao risco, com orientação de uso (NR 6). A proposta em consulta cita protetor solar, óculos e vestimenta com proteção UV.',x:2.5,z:4.8,r:1.8,
  choices:[
   {id:'completo',correct:true,label:'Fornecer boné com aba e protetor de nuca, óculos com proteção UV, protetor solar de FPS alto para reaplicar e camisa de manga longa leve, tudo gratuito e com orientação.',feedback:'Proteção adequada ao sol: cobre cabeça, nuca, olhos e pele, fornecida pela empresa e com orientação de uso.'},
   {id:'regata',label:'Deixar cada um usar o que preferir, inclusive regata e bermuda, porque o calor é grande.',feedback:'Pele exposta aumenta a insolação e as queimaduras. Roupa leve de manga longa protege melhor.'},
   {id:'comprar',label:'Avisar que protetor solar e óculos são por conta de quem quiser usar.',feedback:'EPI e medidas de proteção são fornecidos pelo empregador, sem custo para o trabalhador.'}
  ]},
 {id:'novato',who:'Davi',refs:[nr9('4.1 e 4.2'),{norm:'NHO 06 (Fundacentro)',item:'parâmetros de aclimatização',kind:'vigente'}],
  title:'Aclimatize o novato',description:'Davi começa hoje e quer mostrar serviço. Decida como ele entra na rotina de calor.',
  tip:'Acima do nível de ação, a aclimatização deve constar no PCMSO e seguir a NHO 06 ou outra referência técnica. Exposição gradual, não nenhuma e não total.',x:-6,z:4,r:2,
  choices:[
   {id:'gradual',correct:true,label:'Plano gradual: poucas horas de exposição e tarefas mais leves nos primeiros dias, aumentando aos poucos, conforme o PCMSO e a NHO 06.',feedback:'Aclimatização gradual: o corpo se adapta ao calor sem sobrecarga.'},
   {id:'total',label:'Ritmo total desde hoje: se ele quer mostrar serviço, é bom para a produção.',feedback:'Trabalhador não aclimatizado tem mais risco de sobrecarga térmica. O ritmo cheio no primeiro dia é perigoso.'},
   {id:'sombra',label:'Deixar Davi na sombra o dia todo até ele “se acostumar”.',feedback:'A aclimatização exige exposição gradual. Sem exposição nenhuma, o corpo não se adapta.'}
  ]},
 {id:'pesado',refs:[nr9('3.1 (b)')],
  title:'Programe o serviço pesado para o horário ameno',description:'Na prancheta de programação, reorganize as tarefas do dia.',
  tip:'Acima do nível de ação, programe os trabalhos mais pesados (acima de 414 W) preferencialmente nos períodos mais amenos, desde que não criem risco adicional.',x:-1.8,z:.1,r:1.8,
  choices:[
   {id:'manha',correct:true,label:'Compactação e assentamento de meio-fio (serviços pesados) logo cedo; tarefas leves, como conferência e sinalização, no início da tarde.',feedback:'Serviço pesado nas horas mais amenas e o leve no calor: menos carga térmica sem perder produção.'},
   {id:'meio',label:'Deixar o serviço pesado para o meio-dia, para adiantar enquanto o sol está forte.',feedback:'O meio-dia é o período mais quente. O serviço pesado deve ir para as horas amenas.'},
   {id:'cliente',label:'Manter a programação como o cliente mandou, sem mexer em nada.',feedback:'Quando não cria risco adicional, reprogramar é exatamente a medida preventiva prevista.'}
  ]},
 {id:'alojamento',refs:[nr21('21.3'),nr21('21.5')],
  title:'Confira o alojamento',description:'Parte da equipe vem de outra cidade e dorme no alojamento do canteiro. Faça a ronda da manhã.',
  tip:'A NR 21 exige alojamento com adequadas condições sanitárias (21.3) e locais de trabalho mantidos em condições sanitárias compatíveis (21.5). Os critérios detalhados estão em outras NR e em boa prática.',x:14.1,z:-8.3,r:2.2,
  choices:[
   {id:'condicoes',correct:true,label:'Dormitório limpo e ventilado, sanitário funcionando, água potável à disposição e lixo recolhido. Corrigir o que faltar antes de o pessoal voltar.',feedback:'Alojamento em condições sanitárias adequadas, e o entorno mantido limpo, como pedem os itens 21.3 e 21.5.'},
   {id:'teto',label:'Enquanto houver teto e cama, está bom. A limpeza fica por conta de quem dorme ali.',feedback:'O empregador responde pelas condições sanitárias do alojamento. Teto e cama não bastam.'},
   {id:'lixo',label:'O lixo e os restos de comida ao lado do alojamento podem ficar até sexta-feira, quando o caminhão passar.',feedback:'O local deve ser mantido em condições sanitárias compatíveis (21.5). Lixo acumulado atrai insetos e ratos.'}
  ]},
 {id:'moradia',refs:[nr21('21.6'),nr21('21.6.1'),nr21('21.7')],
  title:'Confira a moradia da família do Marcos',description:'Marcos é caseiro do canteiro e mora com a família na casinha do fundo. Chegou outra família e pediram para dividir a casa. Decida.',
  tip:'Quando o empregador fornece moradia ao empregado e à família, ela precisa de condições sanitárias adequadas (21.6). É vedada, em qualquer hipótese, a moradia coletiva da família (21.6.1). A moradia deve ter capacidade para os moradores, ventilação e luz direta e piso impermeável (21.7).',x:22.2,z:-.4,r:2.3,
  choices:[
   {id:'propria',correct:true,label:'Não dividir. Cada família tem a sua moradia, dimensionada para os moradores, ventilada, com piso impermeável, dormitório, cozinha e sanitário.',feedback:'Moradia individual por família, com os requisitos dos itens 21.6, 21.6.1, 21.7 e 21.12.'},
   {id:'dividir',label:'Liberar: as duas famílias dividem a casa por algumas semanas, o que resolve sem custo.',feedback:'É vedada, em qualquer hipótese, a moradia coletiva da família (21.6.1).'},
   {id:'um',label:'Aceitar a segunda família, mas em um único cômodo, para caber na casa.',feedback:'A moradia deve ter capacidade dimensionada para o número de moradores (21.7, a) e, no mínimo, dormitório, cozinha e sanitário (21.12).'}
  ]},
 {id:'pocofossa',refs:[nr21('21.10'),nr21('21.13'),nr21('21.14')],
  title:'Confira o poço e a fossa',description:'Na ronda, confira o poço que abastece a casa e onde estão a fossa e o sanitário.',
  tip:'O poço deve ser protegido contra contaminação (21.10). As fossas negras ficam a no mínimo 15 m do poço e 10 m da casa, em lugar livre de enchentes e à jusante do poço (21.13). Sanitários arejados, limpos e protegidos contra insetos, ratos e pragas (21.14).',x:25,z:-9.1,r:2.4,
  choices:[
   {id:'distancias',correct:true,label:'Poço com tampa e mureta; fossa a mais de 15 m do poço e 10 m da casa, morro abaixo do poço e fora de alagamento; sanitário arejado, limpo e com tela.',feedback:'Poço protegido e fossa bem posicionada: distâncias, nível do terreno e sanitário conforme 21.10, 21.13 e 21.14.'},
   {id:'perto',label:'A fossa pode ficar a uns 5 m do poço, para facilitar a tubulação e economizar obra.',feedback:'A fossa negra deve ficar a no mínimo 15 m do poço, à jusante dele. Perto demais contamina a água.'},
   {id:'aberto',label:'O poço pode ficar aberto, porque a tampa atrapalha puxar o balde.',feedback:'O poço precisa ser protegido contra a contaminação (21.10). Use tampa e mureta com acesso adequado.'}
  ]},
 {id:'ibutg',who:'Jéssica',refs:[nr9('2.4 e 2.4.2'),{norm:'NHO 06 (Fundacentro)',item:'IBUTG',kind:'vigente'},nr9('Quadros 1 e 2')],
  title:'Leia o IBUTG com a Jéssica',description:'A técnica de segurança mede o IBUTG no termômetro de globo. Interprete o resultado para a compactação, que é serviço pesado (cerca de 414 W).',
  tip:'Para trabalho pesado (414 W) e trabalhadores aclimatizados, o nível de ação é 23,0 °C IBUTG e o limite de exposição é 26,6 °C IBUTG. Acima do nível de ação, medidas preventivas; acima do limite, medidas corretivas.',x:4.4,z:-2.35,r:2.3,
  choices:[
   {id:'limite',correct:true,label:'IBUTG 29,4 °C passou do nível de ação (23,0) e do limite (26,6) para serviço pesado. Manter água e horários, e adotar medidas corretivas: alternar tarefas e garantir pausas em local ameno.',feedback:'Acima do limite, além das medidas preventivas entram as corretivas: adequar rotinas, alternar tarefas e garantir locais mais amenos para pausas.'},
   {id:'so',label:'Só preciso agir quando passar do limite de 26,6. O nível de ação é só um aviso.',feedback:'Ultrapassar o nível de ação já exige medidas preventivas, como água fresca e programação dos serviços mais pesados.'},
   {id:'termo',label:'Termômetro de parede marca 34 °C, então o resultado do globo não muda nada.',feedback:'O IBUTG considera temperatura, umidade, vento e calor radiante. Só a temperatura do ar não representa o calor sobre o corpo.'}
  ]},
 {id:'pausa',refs:[nr9('3.2.2 (b) e (c)'),nr9('3.1 (a)')],
  title:'Organize pausa, água e rodízio',description:'Passou do meio-dia. Organize a turma no abrigo para recuperar o corpo do calor.',
  tip:'Medidas corretivas: alternar operações de maior calor com outras de menor exposição e dar acesso a locais mais amenos que permitam pausas de recuperação térmica, mantendo a água à mão.',x:7.8,z:1.4,r:2.6,
  choices:[
   {id:'rodizio',correct:true,label:'Fazer rodízio entre tarefa pesada e leve, com pausas curtas e frequentes na sombra do abrigo, água por perto e gente observando os colegas.',feedback:'Rodízio e pausas de recuperação térmica em local ameno, com água à mão: medidas corretivas do item 3.2.2.'},
   {id:'almoco',label:'Manter o ritmo e fazer pausa apenas na hora do almoço, para não atrasar.',feedback:'Uma única pausa no dia não basta. Acima do limite, o rodízio e as pausas de recuperação têm de acontecer ao longo do turno.'},
   {id:'premio',label:'Dar um prêmio a quem produzir mais sem parar, para estimular a equipe.',feedback:'Premiar quem não para estimula esforço sem recuperação e aumenta o risco de mal-estar pelo calor.'}
  ]},
 {id:'sinais',who:'Cleiton',refs:[nr9('2.1.1 (b) e (c)')],
  title:'Reconheça os sinais no Cleiton',description:'Cleiton parou de trabalhar, está suado, pálido e diz que está tonto e enjoado. Decida o que isso significa.',
  tip:'Sinais como pele pálida e suada, tontura, náusea e fraqueza indicam distúrbio pelo calor. O trabalhador deve avisar cedo e o encarregado precisa agir na hora.',x:-9.3,z:-2.6,r:2.1,
  choices:[
   {id:'exaustao',correct:true,label:'São sinais de exaustão pelo calor. Interromper o serviço dele agora e levá-lo para a sombra.',feedback:'Sinais de exaustão pelo calor reconhecidos. O serviço dele para imediatamente.'},
   {id:'almoco',label:'Deve ser o almoço que caiu mal. Ele já melhora, pode voltar em dez minutos.',feedback:'Tontura, náusea, palidez e suor frio são sinais de calor e não se descartam como “almoço pesado”.'},
   {id:'agua',label:'Mandar beber água e voltar ao trabalho logo, para não perder o ritmo.',feedback:'Só água no ritmo de trabalho não resolve. Ele precisa parar, sair do sol e se resfriar.'}
  ]},
 {id:'socorro',who:'Cleiton',refs:[nr9('5.1')],
  title:'Socorra o Cleiton',description:'Cleiton está consciente, mas fraco. Decida o primeiro atendimento.',
  tip:'O procedimento de emergência para o calor prevê meios para o primeiro atendimento ou encaminhamento e informação a todos os envolvidos. Em dúvida, ligue 192 (SAMU) e siga a orientação.',x:-9.3,z:-2.6,r:2.1,
  choices:[
   {id:'sombra',correct:true,label:'Levar à sombra, deitar com as pernas elevadas, afrouxar a roupa, resfriar com água e vento, dar água em pequenos goles e ligar 192 para orientação. Não deixá-lo sozinho.',feedback:'Primeiro atendimento correto: afastar do calor, resfriar, hidratar aos poucos, acionar apoio e acompanhar.'},
   {id:'sol',label:'Deixá-lo sentado ao sol da frente de trabalho até passar a tontura.',feedback:'Ficar exposto ao calor piora o quadro. O primeiro passo é sair do sol e se resfriar.'},
   {id:'gelada',label:'Dar uma garrafa de bebida bem gelada de uma vez e mandá-lo voltar.',feedback:'Bebida em excesso e de uma vez pode causar vômito. Dê água em pequenos goles e mantenha o repouso.'}
  ]},
 {id:'tempo',refs:[nr21('21.7 — resposta a emergências (descargas atmosféricas e tempestades)','proposta'),{norm:'Regra dos 30 s / 30 min',item:'intervalo entre o clarão e o trovão',kind:'pratica'}],
  title:'O céu fecha: meça o raio',description:'À tarde, o céu escurece e há relâmpagos. Conte os segundos entre o clarão e o trovão no painel e decida.',
  tip:'Sons têm cerca de 343 m/s: cada 3 s de atraso são cerca de 1 km. Pela regra prática 30/30, trovão em até 30 s (cerca de 10 km) significa perigo: procure abrigo seguro e espere 30 min após o último trovão. Isso é boa prática, não item de NR.',x:2.2,z:-2.6,r:1.9,
  choices:[
   {id:'agora',correct:true,label:'Passaram-se 11 s entre clarão e trovão: o raio está a cerca de 3,8 km, dentro da faixa de perigo. Acionar o plano de tempestade agora.',feedback:'O raio já está dentro dos 10 km. O perigo começa antes da chuva: acionar o plano agora.'},
   {id:'longe',label:'Ainda está longe. Dá tempo de terminar o trecho que falta e só depois recolher.',feedback:'Um raio pode atingir a vários quilômetros da tempestade. Esperar “terminar o trecho” expõe a equipe.'},
   {id:'chuva',label:'Esperar a chuva começar para então parar, porque sem chuva não há tempestade.',feedback:'O risco de raio existe antes da chuva cair. A regra é o intervalo entre clarão e trovão.'}
  ]},
 {id:'interrompa',who:'Airton',refs:[nr21('21.7 — descargas atmosféricas','proposta'),{norm:'Boa prática',item:'afastar de máquinas, árvores e estruturas metálicas',kind:'pratica'}],
  title:'Interrompa o serviço e afaste a equipe',description:'Airton continua compactando no rolo e diz que falta só uma passada. A equipe está espalhada entre máquinas, uma árvore e a torre de luz.',
  tip:'Pare todos os serviços, desligue e estacione as máquinas, desça do equipamento e afaste a equipe de árvores isoladas, postes, torres e estruturas metálicas. Nada de abrigo improvisado embaixo de árvore.',x:-5.4,z:-5.8,r:2.6,
  choices:[
   {id:'parar',correct:true,label:'“Airton, desliga e desce agora. Todos param, máquinas desligadas e estacionadas, e saem de perto da árvore, da torre de luz e das ferragens.”',feedback:'Serviço interrompido, máquinas desligadas e equipe afastada dos pontos que atraem a descarga.'},
   {id:'passada',label:'“Faz só mais uma passada e desce, que falta pouco.”',feedback:'Máquina aberta em campo e operador no alto são alvos fáceis. Não há “mais uma passada” com raio por perto.'},
   {id:'arvore',label:'“Gente, protege a cabeça e se abriga debaixo da árvore grande, que dá sombra e cobre todo mundo.”',feedback:'Árvore isolada é um dos piores lugares durante raios. Afaste-se de árvores, postes e estruturas metálicas.'}
  ]},
 {id:'abrigoSeguro',refs:[nr21('21.1'),nr21('21.3 e 21.7','proposta'),{norm:'Boa prática',item:'abrigo seguro contra descargas atmosféricas',kind:'pratica'}],
  title:'Leve todos ao abrigo seguro',description:'A tenda protege do sol, mas não de raios. Conduza a equipe ao container de apoio, que é fechado, e entre por último.',
  tip:'Abrigo seguro contra raios é edificação fechada ou veículo fechado, não tenda aberta nem toldo de máquina. Dentro, evite encostar nas paredes metálicas e em condutores. O abrigo rústico do item 21.1 protege do sol e da chuva, mas não substitui um local seguro contra descargas.',x:13,z:.9,r:1.5,
  choices:[
   {id:'container',correct:true,label:'Ir ao container de apoio fechado, que é estrutura fechada; todos entram, ficam afastados das paredes metálicas e de aparelhos ligados.',feedback:'Abrigo fechado e seguro: a tenda protege do sol, o container protege da tempestade.'},
   {id:'tenda',label:'Ir à tenda de vivência, que fica mais perto e já tem bancos.',feedback:'A tenda é aberta e serve contra o sol. Ela não protege de raios.'},
   {id:'retro',label:'Ficar sob o toldo da retroescavadeira, que é coberto e tem cabine de ferro.',feedback:'Estrutura metálica aberta no campo não é abrigo seguro. Procure edificação ou veículo fechado.'}
  ]},
 {id:'contagem',refs:[nr21('21.7 — resposta a emergências','proposta'),{norm:'Boa prática',item:'conferir a equipe no abrigo',kind:'pratica'}],
  title:'Faça a contagem',description:'Com a prancheta, confira nome a nome quem está no container de apoio, incluindo o Cleiton.',
  tip:'Conte todos antes de dar a situação por controlada. Ninguém sai para buscar quem falta: a pessoa é localizada pelo grupo e ninguém volta ao campo durante a tempestade.',x:13,z:1.5,r:2},
 {id:'libere',who:'Jéssica',refs:[{norm:'Regra dos 30 s / 30 min',item:'esperar 30 min após o último trovão',kind:'pratica'}],
  title:'Aguarde e libere o retorno',description:'A chuva diminui e abre o sol. Jéssica pergunta quando liberar a equipe para voltar.',
  tip:'Espere cerca de 30 minutos sem trovão. Antes de liberar, confira piso molhado e escorregadio, poças, valetas alagadas e as máquinas.',x:12.3,z:.45,r:2.3,
  choices:[
   {id:'trinta',correct:true,label:'Esperar cerca de 30 minutos sem trovão. Depois conferir piso escorregadio, poças, valetas e máquinas e só então liberar a equipe.',feedback:'Retorno seguro: 30 minutos sem trovão e vistoria do canteiro antes de liberar.'},
   {id:'sol',label:'Voltou o sol, então já pode liberar todo mundo para o serviço.',feedback:'Raios podem cair mesmo com o tempo abrindo. Espere 30 minutos sem trovão.'},
   {id:'operadores',label:'Liberar só os operadores de máquina, que estão mais protegidos nas cabines.',feedback:'O risco de raio continua para todos. Máquinas e cabines abertas não são abrigo.'}
  ]},
 {id:'registro',refs:[{norm:'NR 1',item:'1.5 (GRO/PGR — revisão e melhoria das medidas)',kind:'vigente',check:true},{norm:'Boa prática',item:'investigar causas, sem buscar culpados',kind:'pratica'}],
  title:'Registre e revise o PGR',description:'Na prancheta do quadro de avisos, registre o que aconteceu no dia e as melhorias.',
  tip:'O GRO é um ciclo: registre a ocorrência, avalie a resposta e atualize o PGR. A investigação procura causas e melhorias, não culpados.',x:2.2,z:-2.6,r:1.9,
  choices:[
   {id:'revisar',correct:true,label:'Registrar calor e tempestade, a resposta da equipe e as melhorias: abrigo ampliado, horários, plano de tempestade, reforço de orientação e plano de aclimatização.',feedback:'Ciclo fechado: registro, avaliação da resposta e melhorias no PGR, sem culpar ninguém.'},
   {id:'nada',label:'Não precisa registrar nada, porque ninguém se machucou gravemente.',feedback:'Sem registro e revisão, o mesmo risco volta. Quase-acidentes também ensinam.'},
   {id:'culpa',label:'Advertir o Cleiton por ter passado mal e encerrar o assunto.',feedback:'Passar mal com o calor é sinal de falha na prevenção, não motivo de advertência. A investigação busca causas.'}
  ]}
];
export const indexOf = id => objectives.findIndex(o => o.id === id);
export const choiceObjectives = () => objectives.filter(o => o.choices);
export const refLabel = r => `${r.norm} • ${/^\d/.test(r.item)?'item ':''}${r.item}`;
// Linha de referência mostrada no painel. A origem (vigente, proposta, prática) sempre aparece.
export const refSummary = o => o.refs.map(r => ({label:refLabel(r),kind:r.kind,status:KINDS[r.kind],check:!!r.check}));
// Linha do tempo do dia. Cada etapa tem horário, temperatura do ar e IBUTG estimado da frente de trabalho.
const clock = ['07:00','07:10','07:20','07:30','07:45','08:00','08:15','08:45','09:00','09:15','10:30','12:10','13:00','13:10','15:30','15:40','15:50','16:05','16:40','17:00'];
const air =   [24,24,25,25,26,26,27,28,29,29,33,35,36,36,30,28,26,25,24,24];
const ibutg = [25.2,25.4,25.8,26.0,26.4,26.6,26.9,27.6,28.2,28.4,29.4,30.6,31.4,31.2,27.0,25.5,24.6,24.2,23.4,23.0];
export const NIVEL_ACAO_PESADO = 23.0, LIMITE_PESADO = 26.6, TAXA_PESADO_W = 414;
// Tempestade: atraso do trovão (s) por etapa; null = sem raios. "rain" e "wind" vão de 0 a 1; "sky" escurece o céu.
const storm = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,11,7,4,3,16,null];
const rain  = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,.05,.35,.8,1,.25,0];
const dark  = [0,0,0,0,0,0,0,0,0,0,0,.05,.05,.05,.55,.8,.95,1,.45,.05];
export function weather(step){
 const i=Math.max(0,Math.min(objectives.length-1,step));
 return {clock:clock[i],air:air[i],ibutg:ibutg[i],thunderDelay:storm[i],rain:rain[i],dark:dark[i],wind:Math.min(1,rain[i]*1.1+(i>=14?.15:0)),sunHeat:Math.max(0,1-dark[i]*1.2)*Math.min(1,(ibutg[i]-24)/8)};
}
export const thunderDistance = seconds => Math.round(343*seconds);
export const inDangerRange = seconds => seconds<=30;
export const initialState = () => ({step:0,feedback:'',errors:0,completed:[],finished:false});
export const done = (s,id) => s.completed.includes(id);
export const currentTarget = s => objectives[s.step];
function advance(s,next,id){
 next.completed=[...s.completed,id];next.step=s.step+1;next.finished=next.step===objectives.length;
 return next;
}
export function answer(s,choiceId){
 const o=objectives[s.step];const c=o?.choices?.find(x=>x.id===choiceId);if(!c)return s;
 if(!c.correct)return {...s,errors:s.errors+1,feedback:c.feedback};
 return advance(s,{...s,feedback:c.feedback},o.id);
}
// ctx.present: pessoas da equipe já dentro do container de apoio (calculado pelo cenário).
export function interact(s,id,ctx={}){
 const o=objectives[s.step];if(!o||o.id!==id)return s;
 if(o.choices)return {...s,feedback:'Escolha uma das opções.'};
 if(id==='contagem'){
  const n=ctx.present??0;
  if(n<team)return {...s,feedback:`Contagem: ${n}/${team}. Aguarde todos entrarem no container antes de confirmar.`};
  return advance(s,{...s,feedback:`Contagem confirmada: ${team}/${team} pessoas no abrigo seguro.`},id);
 }
 return advance(s,{...s,feedback:''},id);
}
// Áreas caminháveis: canteiro principal; estruturas entram como obstáculos {x,z,w,d}.
export function canMove(x,z,obstacles){
 const site=x>-20.5&&x<26.6&&z>-13.6&&z<13.4;
 return site&&!obstacles.some(o=>Math.abs(x-o.x)<o.w/2+.32&&Math.abs(z-o.z)<o.d/2+.32);
}
