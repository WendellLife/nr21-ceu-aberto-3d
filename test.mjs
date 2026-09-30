import assert from 'node:assert/strict';
import * as r from './dist/rules.mjs';
import {workerPhase,findRoute,walkableGrid} from './dist/crew.mjs';
import {staticObstacles,containerSlots,gatherSlots,doorOutside,doorInside,playerStart,roster,structures} from './dist/layout.mjs';
const IDS=['previsao','abrigo','agua','dds','epi','novato','pesado','alojamento','moradia','pocofossa','ibutg','pausa','sinais','socorro','tempo','interrompa','abrigoSeguro','contagem','libere','registro'];
const correctOf=o=>o.choices.find(c=>c.correct).id;
const pick=(s,c)=>{const n=r.answer(s,c);assert.equal(n.step,s.step+1,`Escolha ${c} deve avançar`);return n;};

// 1. Ordem e quantidade das etapas
assert.equal(r.objectives.length,20,'Vinte etapas');
assert.deepEqual(r.objectives.map(o=>o.id),IDS);
assert.equal(new Set(IDS).size,IDS.length,'Ids únicos');

// 2. Cada decisão: uma única resposta certa, três opções, feedback em todas
for(const o of r.objectives){
 assert.ok(o.title&&o.description&&o.tip,`${o.id}: título, descrição e dica`);
 if(!o.choices)continue;
 assert.equal(o.choices.length,3,`${o.id}: três opções`);
 assert.equal(o.choices.filter(c=>c.correct).length,1,`${o.id}: uma única correta`);
 assert.equal(new Set(o.choices.map(c=>c.id)).size,3,`${o.id}: ids das opções únicos`);
 for(const c of o.choices)assert.ok(c.label&&c.feedback&&c.feedback.length>25,`${o.id}/${c.id}: feedback didático`);
}

// 3. Referência normativa e origem (vigente, proposta ou boa prática) em todas as etapas
for(const o of r.objectives){
 assert.ok(o.refs?.length>=1,`${o.id}: referência`);
 for(const ref of o.refs){assert.ok(ref.norm&&ref.item,`${o.id}: norma e item`);assert.ok(r.KINDS[ref.kind],`${o.id}: origem válida`);}
 assert.ok(r.refSummary(o).every(x=>x.label&&x.status));
}
// Conteúdo de raios e tempestades nunca é apresentado como item vigente de NR.
for(const id of ['tempo','interrompa','abrigoSeguro','contagem','libere']){
 const o=r.objectives[r.indexOf(id)];
 assert.ok(o.refs.every(x=>x.kind!=='vigente'||(x.norm==='NR 21'&&x.item==='21.1')),`${id}: só o 21.1 (abrigo) é vigente aqui`);
 assert.ok(o.refs.some(x=>x.kind==='proposta'||x.kind==='pratica'),`${id}: marcado como proposta ou boa prática`);
}
for(const ref of r.objectives.flatMap(o=>o.refs).filter(x=>x.kind==='proposta'))assert.equal(ref.norm,'NR 21','Proposta só se refere à NR 21');
// Itens da NR 21 vigente citados existem no texto de 1999 (21.1 a 21.14)
const vig=r.objectives.flatMap(o=>o.refs).filter(x=>x.norm==='NR 21'&&x.kind==='vigente');
for(const x of vig){const n=x.item.match(/^21\.(\d+)/);assert.ok(n&&+n[1]>=1&&+n[1]<=14,`Item vigente inexistente: ${x.item}`);}
for(const id of ['alojamento','moradia','pocofossa'])assert.ok(r.objectives[r.indexOf(id)].refs.every(x=>x.kind==='vigente'&&x.norm==='NR 21'));

// 4. Fluxo completo com erros e sem erros
let s=r.initialState();
for(const o of r.objectives){
 if(o.id==='contagem'){
  assert.equal(r.interact(s,'contagem',{present:5}).step,s.step,'Contagem exige todos');
  assert.match(r.interact(s,'contagem',{present:5}).feedback,/5\/6/);
  s=r.interact(s,'contagem',{present:6});assert.equal(s.step,r.indexOf('contagem')+1);continue;}
 assert.equal(r.interact(s,o.id).step,s.step,'Decisão exige escolha');
 for(const c of o.choices.filter(c=>!c.correct)){const n=r.answer(s,c.id);assert.equal(n.step,s.step,'Erro não avança');assert.equal(n.errors,s.errors+1);assert.equal(n.feedback,c.feedback);s={...s,errors:n.errors};}
 s=pick(s,correctOf(o));
}
assert.equal(s.finished,true);assert.equal(s.completed.length,20);
assert.equal(s.errors,r.objectives.filter(o=>o.choices).length*2,'Dois erros por decisão');
// Etapas fora de ordem não avançam
assert.equal(r.interact(r.initialState(),'contagem',{present:6}).step,0);
assert.equal(r.answer(r.initialState(),'parar').step,0);

// 5. Linha do tempo: horário, calor e tempestade
assert.equal(r.weather(0).clock,'07:00');assert.equal(r.weather(19).clock,'17:00');
const clocks=r.objectives.map((_,i)=>r.weather(i).clock);assert.deepEqual([...clocks].sort(),clocks,'Horários crescentes');
const at=id=>r.weather(r.indexOf(id));
assert.ok(at('ibutg').ibutg>r.LIMITE_PESADO,'IBUTG da etapa passa do limite do serviço pesado');
assert.equal(at('ibutg').ibutg,29.4,'Coerente com o texto da decisão');
assert.ok(r.LIMITE_PESADO>r.NIVEL_ACAO_PESADO);assert.equal(r.TAXA_PESADO_W,414);
assert.equal(at('previsao').thunderDelay,null,'Sem raios pela manhã');
assert.equal(at('tempo').thunderDelay,11,'Coerente com o texto da decisão (11 s)');
assert.ok(at('interrompa').thunderDelay<at('tempo').thunderDelay&&at('abrigoSeguro').thunderDelay<at('interrompa').thunderDelay,'Raios se aproximam');
assert.ok(at('libere').thunderDelay>at('abrigoSeguro').thunderDelay,'Tempestade se afasta');
assert.equal(at('registro').thunderDelay,null);assert.equal(at('registro').rain,0);
assert.ok(at('abrigoSeguro').rain>=.8&&at('abrigoSeguro').dark>=.9,'Pico da tempestade');
assert.ok(at('pausa').sunHeat>at('previsao').sunHeat,'Sol mais forte ao meio-dia');
assert.equal(r.thunderDistance(11),3773);assert.equal(r.thunderDistance(3),1029);
assert.ok(r.inDangerRange(11)&&r.inDangerRange(30)&&!r.inDangerRange(31));

// 6. Fases da equipe
const upTo=id=>({...r.initialState(),completed:r.objectives.slice(0,r.indexOf(id)+1).map(o=>o.id)});
const s0=r.initialState();
assert.equal(workerPhase('novice',s0),'eager','Davi começa sem aclimatação');assert.equal(workerPhase('novice',upTo('novato')),'working');
assert.equal(workerPhase('novice',upTo('pausa')),'rest');assert.equal(workerPhase('novice',upTo('tempo')),'working');
assert.equal(workerPhase('tech',s0),'measure');assert.equal(workerPhase('tech',upTo('ibutg')),'working');
assert.equal(workerPhase('sick',upTo('ibutg')),'working');assert.equal(workerPhase('sick',upTo('pausa')),'weak','Cleiton passa mal depois do pico de calor');
assert.equal(workerPhase('sick',upTo('socorro')),'shade');
assert.equal(workerPhase('roller',upTo('previsao')),'working');assert.equal(workerPhase('roller',upTo('tempo')),'stubborn','Airton quer terminar a passada');
for(const role of ['roller','tech','sick','novice','driver','caretaker']){assert.equal(workerPhase(role,upTo('interrompa')),'gather',`${role} se reúne e espera a ordem`);assert.equal(workerPhase(role,upTo('abrigoSeguro')),'evacuate',`${role} vai ao container depois da decisão`);}
assert.equal(workerPhase('sick',upTo('libere')),'shade');assert.equal(workerPhase('roller',upTo('libere')),'working','Equipe volta ao serviço depois de liberada');

// 7. Planta: acessibilidade de todos os destinos e do abrigo seguro
const grid=walkableGrid(staticObstacles);
assert.ok(r.canMove(playerStart.x,playerStart.z,staticObstacles),'Início do jogador livre');
const reachable=(from,target,radius)=>{const route=findRoute(from,target,staticObstacles,grid);if(!route.length)return false;const end=route.at(-1);return Math.hypot(end.x-target.x,end.z-target.z)<=radius;};
const posOf=o=>o.who?roster.find(w=>w.name===o.who):o;
for(const o of r.objectives){const a=posOf(o);assert.ok(a,`${o.id}: âncora`);assert.ok(reachable(playerStart,a,o.r),`${o.id}: destino acessível (${a.x}, ${a.z})`);}
for(const w of roster){const p=w.exit||w;assert.ok(r.canMove(p.x,p.z,staticObstacles),`${w.name}: posição inicial (ou de desembarque) livre`);assert.ok(findRoute(p,doorInside,staticObstacles,grid).length,`${w.name}: rota até o container`);}
assert.equal(gatherSlots.length,r.team);for(const p of gatherSlots){assert.ok(r.canMove(p.x,p.z,staticObstacles),'Vaga de reunião livre');for(const w of roster)assert.ok(findRoute(w.exit||w,p,staticObstacles,grid).length,`${w.name}: rota até a reunião`);}
assert.equal(roster.length,r.team);assert.equal(containerSlots.length,r.team);
for(const p of containerSlots)assert.ok(r.canMove(p.x,p.z,staticObstacles),'Vaga dentro do container livre');
assert.ok(r.canMove(doorOutside.x,doorOutside.z,staticObstacles)&&r.canMove(doorInside.x,doorInside.z,staticObstacles),'Porta do container passável');
const toSlot=findRoute(playerStart,containerSlots[5],staticObstacles,grid);
assert.ok(toSlot.length&&Math.hypot(toSlot.at(-1).x-containerSlots[5].x,toSlot.at(-1).z-containerSlots[5].z)<.5,'Container entra-se pela porta');
assert.ok(toSlot.some(p=>Math.abs(p.x-13)<.9&&p.z>1.9&&p.z<2.6),'Rota passa pela porta');
assert.equal(r.canMove(10.5,2.2,staticObstacles),false,'Parede da frente do container bloqueia');
assert.equal(r.canMove(13,-.6,staticObstacles),false,'Parede dos fundos bloqueia');
assert.equal(r.canMove(-30,0,[]),false,'Limite do canteiro');
// Distâncias da moradia rural (NR 21, itens 21.10 e 21.13): fossa ≥ 15 m do poço e ≥ 10 m da casa, à jusante do poço (z maior = mais baixo).
{const d=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);const {well,cesspit,house}=structures;
 assert.ok(d(cesspit,well)>=15,'Fossa a no mínimo 15 m do poço');assert.ok(d(cesspit,house)>=10,'Fossa a no mínimo 10 m da casa');assert.ok(cesspit.z>well.z,'Fossa à jusante do poço');}
console.log('PASS: 20 etapas, uma resposta certa por decisão com feedback e referência, origem da norma, calor e tempestade, fases da equipe e acessibilidade dos destinos');
