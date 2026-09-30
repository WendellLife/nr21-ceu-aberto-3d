import {canMove} from './rules.mjs';
import {W} from './layout.mjs';
// Fase de cada pessoa da equipe conforme o andamento do dia.
// working: rotina · eager: ritmo total sem aclimatação · measure: medindo o IBUTG · weak: passando mal pelo calor
// shade: recuperando-se na sombra · rest: pausa no abrigo · stubborn: quer terminar o serviço sob raios · gather: reunido à espera da ordem · evacuate: vai ao container
export function workerPhase(role,s){
 const d=id=>s.completed.includes(id);
 if(d('libere'))return role==='sick'?'shade':'working';
 if(d('abrigoSeguro'))return 'evacuate';
 if(d('interrompa'))return 'gather';
 if(role==='roller')return d('tempo')?'stubborn':'working';
 if(role==='tech')return d('ibutg')?'working':'measure';
 if(role==='sick'){if(!d('pausa'))return 'working';return d('socorro')?'shade':'weak';}
 if(role==='novice'){if(!d('novato'))return 'eager';return d('pausa')&&!d('tempo')?'rest':'working';}
 return 'working';
}
// Busca em grade (BFS com diagonais) entre dois pontos do canteiro, respeitando os obstáculos.
const SIZE=.4,COLS=Math.ceil((W.maxX-W.minX)/SIZE),ROWS=Math.ceil((W.maxZ-W.minZ)/SIZE);
const pointOf=i=>({x:W.minX+(i%COLS)*SIZE,z:W.minZ+Math.floor(i/COLS)*SIZE});
export function walkableGrid(obstacles){const a=new Uint8Array(COLS*ROWS);for(let i=0;i<a.length;i++){const p=pointOf(i);a[i]=canMove(p.x,p.z,obstacles)?1:0;}return a;}
export function findRoute(start,goal,obstacles,grid=walkableGrid(obstacles)){
 const key=(x,z)=>z*COLS+x;
 const nearest=p=>{let best=-1,dist=Infinity;for(let i=0;i<grid.length;i++){if(!grid[i])continue;const q=pointOf(i),d=(p.x-q.x)**2+(p.z-q.z)**2;if(d<dist){dist=d;best=i;}}return best;};
 const from=nearest(start),to=nearest(goal);if(from<0||to<0)return [];
 const previous=new Int32Array(grid.length).fill(-1),queue=[from];previous[from]=from;
 for(let head=0;head<queue.length&&previous[to]<0;head++){const id=queue[head],x=id%COLS,z=Math.floor(id/COLS);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nx>=COLS||nz<0||nz>=ROWS)continue;const next=key(nx,nz);if(!grid[next]||previous[next]>=0)continue;if(dx&&dz&&(!grid[key(x+dx,z)]||!grid[key(x,z+dz)]))continue;previous[next]=id;queue.push(next);}}
 if(previous[to]<0)return [];const route=[];for(let id=to;id!==from;id=previous[id])route.push(pointOf(id));route.push(pointOf(from));return route.reverse();
}
