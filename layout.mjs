// Planta do canteiro: estruturas sólidas, posições iniciais e pontos de abrigo.
// Usada pelo cenário 3D (game.mjs) e pelos testes, para garantir que todo destino é alcançável.
export const W = {minX:-20.5,maxX:26.6,minZ:-13.6,maxZ:13.4};
// Container de apoio (abrigo seguro contra tempestade): interior x 10,1..15,9 e z -0,3..2,1; porta de 1,8 m na face sul.
export const container = {x:13,z:.9,w:6,d:2.6,door:{x:13,w:1.8,z:2.2}};
const wall = (x,z,w,d) => ({x,z,w,d});
export const structures = {
 containerBack:wall(13,-.4,6,.2),containerLeft:wall(10,.9,.2,2.6),containerRight:wall(16,.9,.2,2.6),
 containerFrontL:wall(11.05,2.2,2.1,.2),containerFrontR:wall(14.95,2.2,2.1,.2),
 tableAbrigo:wall(6.5,.35,1.8,.7),benchA:wall(4.6,2.5,2,.5),benchB:wall(8.4,2.5,2,.5),
 water:wall(.5,1.4,.8,.6),board:wall(2.2,-3.4,2.2,.3),globe:wall(4.4,-3.4,.5,.5),
 epi:wall(2.5,5.6,2.4,.8),prancheta:wall(-1.8,-.6,1,.5),
 trench:wall(-11.5,-3.75,9,1),pipes:wall(-17,-1.6,1.8,.9),
 roller:wall(-5.4,-6.2,3,1.6),truck:wall(-13,-9.6,5.6,2.4),backhoe:wall(-2.5,-9.6,3.6,2.2),lightTower:wall(-.5,-7.6,.8,.8),
 tree1:wall(-15.5,-.2,.9,.9),tree2:wall(19,6,.9,.9),
 lodging:wall(15,-11.2,8,3.2),house:wall(22.2,-3.6,4.4,4.2),well:wall(25,-10.5,1.2,1.2),cesspit:wall(22.5,10.5,1.6,1.6),latrine:wall(16.5,6.5,1.6,1.6)
};
export const staticObstacles = Object.values(structures);
// Um lugar para cada pessoa dentro do container, junto à parede dos fundos.
export const containerSlots = [10.8,11.7,12.6,13.5,14.4,15.3].map(x => ({x,z:.15}));
export const doorOutside = {x:13,z:3.2};
export const doorInside = {x:13,z:1.6};
export const playerStart = {x:1,z:6.4};
// Equipe: cada pessoa tem um papel que define suas fases (crew.mjs).
export const roster = [
 {name:'Airton',role:'Operador de rolo',phaseRole:'roller',x:-5.4,z:-6.2,angle:Math.PI/2,kind:'drive',exit:{x:-3,z:-6.2}},
 {name:'Jéssica',role:'Técnica de segurança',phaseRole:'tech',x:4.6,z:-2.45,angle:Math.PI,kind:'measure'},
 {name:'Cleiton',role:'Servente',phaseRole:'sick',x:-9.3,z:-2.5,angle:Math.PI,kind:'dig'},
 {name:'Davi',role:'Servente (novato)',phaseRole:'novice',x:-6,z:4,angle:-1,kind:'eager'},
 {name:'Rosana',role:'Motorista',phaseRole:'driver',x:-9.4,z:-8.7,angle:Math.PI*.5,kind:'wait'},
 {name:'Marcos',role:'Caseiro',phaseRole:'caretaker',x:21,z:.6,angle:Math.PI,kind:'sweep'}
];
