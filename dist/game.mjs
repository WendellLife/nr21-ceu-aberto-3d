import * as T from './three.module.js';
import {findRoute,walkableGrid,workerPhase} from './crew.mjs';
import {loadCharacterBase,createCharacter} from './characters.mjs';
import {createRenderPipeline,detectHardware,savedQuality,QUALITY,makeTextures,makeSweat,createRain,updateRain,createBolt,strikeBolt,updateBolt} from './graphics.mjs';
import {objectives,initialState,interact,answer,canMove,currentTarget,indexOf,refSummary,KINDS,weather,thunderDistance,inDangerRange,team,LIMITE_PESADO,NIVEL_ACAO_PESADO} from './rules.mjs';
import {staticObstacles,containerSlots,gatherSlots,playerStart,roster,structures,container} from './layout.mjs';
import {buildScenery} from './scenery.mjs';
const $=id=>document.getElementById(id);
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){$('loading').textContent='Não foi possível iniciar o 3D. Ative a aceleração gráfica do navegador e recarregue.';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;$('game').appendChild(renderer.domElement);$('loading').textContent='Carregando personagens…';
let charBase;try{charBase=await loadCharacterBase({anim:'models/Xbot.glb',male:'models/worker-m.glb',female:'models/worker-f.glb'});}catch(e){$('loading').textContent='Não foi possível carregar os personagens (pasta models). Verifique se ela foi publicada.';throw e;}$('loading').remove();
const scene=new T.Scene();scene.background=new T.Color('#b9d4e6');scene.fog=new T.Fog('#b9d4e6',45,95);
// Câmera em terceira pessoa a 45°, logo atrás e acima do encarregado.
const camera=new T.PerspectiveCamera(52,innerWidth/innerHeight,.1,220);const look=new T.Vector3(playerStart.x,0,playerStart.z);const camOffset=new T.Vector3(0,10.8,10.8);let camDist=1;
const hemi=new T.HemisphereLight(0xdcecff,0x7a6244,.85);scene.add(hemi);
const sun=new T.DirectionalLight(0xfff0cf,2.4);sun.position.set(-9,20,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-19,right:19,top:19,bottom:-19,near:1,far:80});sun.shadow.radius=4;sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun);scene.add(sun.target);
const fill=new T.DirectionalLight(0xb7dcff,1.1);fill.position.set(10,7,-4);scene.add(fill);
const TX=makeTextures();const SC=buildScenery(scene,TX);const {box,cyl,sphere,rod,mat}=SC;
const obstacles=[...staticObstacles];const grid=walkableGrid(obstacles);
const done=id=>state.completed.includes(id);
// Tudo o que fica entre a câmera e o jogador (ou o destino atual) fica translúcido.
const sceneryMeshes=[];scene.traverse(m=>{if(m.isMesh&&!(m.geometry.type==='PlaneGeometry'&&m.rotation.x!==0)&&m.geometry.type!=='CircleGeometry'){const b=new T.Box3().setFromObject(m);if(b.max.y>.6&&b.max.y-b.min.y>.12&&b.max.y-b.min.y<12)sceneryMeshes.push(m);}});
if(SC.tent)sceneryMeshes.push(SC.tent.roof);
const faded=new Map(),ray=new T.Raycaster();let fadeTick=0;
function updateSeeThrough(dt,points){if(++fadeTick%3===0){const hits=new Set();for(const p of points){const to=new T.Vector3(p.x,p.y,p.z),dir=to.clone().sub(camera.position),len=dir.length();ray.set(camera.position,dir.normalize());ray.far=len-.4;for(const h of ray.intersectObjects(sceneryMeshes,false))hits.add(h.object);}
 for(const m of hits)if(!faded.has(m)){m.material=m.material.clone();m.material.transparent=true;faded.set(m,{o:1,hit:true});}for(const [m,f] of faded)f.hit=hits.has(m);}
 for(const [m,f] of faded){f.o+=((f.hit?.22:1)-f.o)*Math.min(1,dt*8);m.material.opacity=f.o;m.material.depthWrite=f.o>.95;}}
// ---- Jogador: encarregado da frente de trabalho ----
const player=new T.Group();scene.add(player);player.position.set(playerStart.x,0,playerStart.z);
const playerChar=createCharacter(charBase,{body:'male',surface:'#2d6a4f',pants:'#2b3440',skin:'#d9a97a',helmet:'#f2f2ec',helmetStripe:'#2d6a4f',vest:'#ed8b32',stripes:'#f2f2ec',armband:'#2d6a4f',gloves:'#d8d2c0',boots:'#3a2a1f',backLabel:{text:'ENCARREGADO',bg:'#2d6a4f'},glow:.06});player.add(playerChar.group);
let playerMove={speed:0,turn:0},playerAction=null;
function navigationDiamond(color){const g=new T.Group();const mesh=new T.Mesh(new T.OctahedronGeometry(.32,0),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.65,flatShading:true,roughness:.28,toneMapped:false,depthTest:false}));mesh.scale.set(.82,1.65,.82);mesh.renderOrder=20;g.add(mesh);const outline=new T.LineSegments(new T.EdgesGeometry(mesh.geometry),new T.LineBasicMaterial({color:'#12322d',transparent:true,opacity:.7,depthTest:false}));outline.scale.copy(mesh.scale);outline.renderOrder=21;g.add(outline);return g;}
const ring=new T.Mesh(new T.RingGeometry(.44,.56,64),new T.MeshBasicMaterial({color:'#6fff59',side:T.DoubleSide,toneMapped:false,depthTest:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.055;ring.renderOrder=10;ring.visible=false;player.add(ring);
const playerDiamond=navigationDiamond('#66ff38');playerDiamond.scale.setScalar(.55);playerDiamond.position.y=2.3;player.add(playerDiamond);
const playerSweat=makeSweat(player,3);
const marker=new T.Group();scene.add(marker);const diamond=navigationDiamond('#25ddff');marker.add(diamond);
const targetRing=new T.Group();scene.add(targetRing);
function navigationRing(inner,outer,color,order){const r=new T.Mesh(new T.RingGeometry(inner,outer,64),new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:true,opacity:1,toneMapped:false,depthTest:false,depthWrite:false}));r.rotation.x=-Math.PI/2;r.renderOrder=order;targetRing.add(r);return r;}
navigationRing(.7,1.12,'#073547',9).material.opacity=.15;navigationRing(.78,.99,'#20deff',10).material.opacity=.38;navigationRing(.76,.80,'#ffffff',11).material.opacity=.3;const targetPulse=navigationRing(1.05,1.1,'#32dfff',9);
for(let i=0;i<4;i++){const arrow=new T.Mesh(new T.ConeGeometry(.16,.35,3),new T.MeshBasicMaterial({color:'#c2faff',depthTest:false,toneMapped:false}));const a=i*Math.PI/2;arrow.position.set(Math.cos(a)*.61,.03,Math.sin(a)*.61);arrow.rotation.z=Math.PI/2;arrow.rotation.y=-a;arrow.renderOrder=12;targetRing.add(arrow);}
const tether=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0,-2.4,0),new T.Vector3(0,-.6,0)]),new T.LineDashedMaterial({color:'#54eeff',dashSize:.13,gapSize:.12,transparent:true,opacity:.8,depthTest:false}));tether.computeLineDistances();marker.add(tether);
let state=initialState(),paused=false,muted=true,audio,rainGain,time=0,toastTimer,elapsed=0,finished=false,missionCollapsed=false;const keys=new Set();
// ---- Equipe: cada pessoa tem aparência e função próprias ----
const looks={
 Airton:{body:'male',surface:'#c8772b',pants:'#3b4a5a',shoes:'#2b2622',skin:'#8d5524',helmet:'#f2f2ec',vest:'#c8e02a',gloves:'#4b5563',backLabel:{text:'ASFALTO',bg:'#3a3f45'}},
 'Jéssica':{body:'female',surface:'#e9e4d6',pants:'#31455a',shoes:'#2b2622',skin:'#c68642',helmet:'#2f7fb8',vest:'#ed8b32',gloves:'#d8d2c0',backLabel:{text:'SEGURANÇA',bg:'#1f5f4a'}},
 Cleiton:{body:'male',surface:'#b0413e',pants:'#4a4f58',shoes:'#2b2622',skin:'#e0ac69',helmet:'#e8aa21',vest:'#ed8b32',gloves:'#6b5a3e',backLabel:{text:'OBRA',bg:'#3a3f45'}},
 Davi:{body:'male',surface:'#6f9bd1',pants:'#2f3a4a',shoes:'#f2f2ec',skin:'#f1c27d',helmet:'#ffffff',vest:'#ed8b32',gloves:'#d8d2c0',backLabel:{text:'NOVATO',bg:'#b0413e'}},
 Rosana:{body:'female',surface:'#4a7c59',pants:'#3a3f45',shoes:'#2b2622',skin:'#8d5524',helmet:'#e8aa21',vest:'#ed8b32',gloves:'#4b5563',backLabel:{text:'MOTORISTA',bg:'#3a3f45'}},
 Marcos:{body:'male',surface:'#8a6d4a',pants:'#4a3a2a',shoes:'#2b2622',skin:'#c68642',beard:true,helmet:null,cap:'#d8c48a',vest:null,gloves:'#3f4a55',backLabel:{text:'CASEIRO',bg:'#6b4f2a'}}
};
const tasks={Airton:'Compactando a base',Jéssica:'Monitorando o calor',Cleiton:'Abrindo a valeta',Davi:'Empurrando o carrinho',Rosana:'Aguardando a carga',Marcos:'Varrendo o quintal'};
const workPose={drive:'drive',measure:'inspect',dig:'repair',eager:'push',wait:'phone',sweep:'repair'};
const restSpot={x:4.6,z:1.85},shadeSpot={x:8.4,z:1.85};
const workers=roster.map((job,i)=>{
 const rig=new T.Group();rig.position.set(job.x,0,job.z);rig.rotation.y=job.angle;scene.add(rig);
 const char=createCharacter(charBase,{...looks[job.name]});rig.add(char.group);
 const prop=new T.Group();rig.add(prop);
 if(job.kind==='dig'){rod([.3,.2,.45],[.45,1.3,.3],.022,'#7a5a3a',prop);box(.22,.04,.3,'#9aa0a3',.3,.15,.5,prop,.4);}
 if(job.kind==='eager'){box(.6,.1,.9,'#8a8f94',0,.55,.85,prop);box(.5,.3,.6,'#b48a5a',0,.72,.85,prop);const w=cyl(.22,.22,.08,'#1d2427',0,.22,1.35,prop,14);w.rotation.z=Math.PI/2;}
 if(job.kind==='sweep')rod([.3,.05,.45],[.35,1.3,.3],.02,'#7a5a3a',prop);
 if(job.kind==='measure')box(.26,.04,.18,'#23282c',.05,1.08,.38,prop);
 const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=112;const tex=new T.CanvasTexture(labelCanvas);tex.colorSpace=T.SRGBColorSpace;const label=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false}));label.scale.set(2.6,.57,1);label.position.set(0,2.2,0);rig.add(label);
 const sweat=makeSweat(rig,4);
 return {rig,char,sweat,job,prop,label,labelCanvas,tex,labelText:'',start:{x:job.x,z:job.z},phase:null,route:[],stride:i,speed:job.name==='Cleiton'?1.7:2.4+i*.07,arrived:false,mounted:job.kind==='drive',sit:null};});
const byName=n=>workers.find(w=>w.job.name===n);
function setLabel(w,sub,color='#f5d777',bg='#142c39e8'){const text=sub+color;if(w.labelText===text)return;w.labelText=text;const c=w.labelCanvas.getContext('2d');c.clearRect(0,0,512,112);c.fillStyle=bg;c.fillRect(0,0,512,112);c.textAlign='center';c.fillStyle=color;c.font='bold 33px Arial';c.fillText(w.job.name+' · '+w.job.role,256,44);c.fillStyle='#ffffff';c.font='25px Arial';c.fillText(sub,256,84,490);w.tex.needsUpdate=true;}
const seatPos=()=>({x:SC.roller.group.position.x+.35,z:SC.roller.group.position.z});
function mountRoller(w){w.mounted=true;const p=seatPos();w.rig.position.set(p.x,.5,p.z);w.rig.rotation.y=Math.PI/2;}
function dismountRoller(w){if(!w.mounted)return;w.mounted=false;w.rig.position.set(w.job.exit.x,0,w.job.exit.z);}
function walkAlong(w,dt){let budget=w.speed*dt,moving=false;while(budget>0&&w.route.length){const p=w.route[0],dx=p.x-w.rig.position.x,dz=p.z-w.rig.position.z,d=Math.hypot(dx,dz);if(d<.01){w.route.shift();continue;}const advance=Math.min(budget,d);w.rig.position.x+=dx/d*advance;w.rig.position.z+=dz/d*advance;budget-=advance;const angle=Math.atan2(dx,dz);w.rig.rotation.y+=Math.atan2(Math.sin(angle-w.rig.rotation.y),Math.cos(angle-w.rig.rotation.y))*.25;moving=true;if(advance===d)w.route.shift();}return moving;}
const facePlayer=(w,k=.08)=>{const a=Math.atan2(player.position.x-w.rig.position.x,player.position.z-w.rig.position.z);w.rig.rotation.y+=Math.atan2(Math.sin(a-w.rig.rotation.y),Math.cos(a-w.rig.rotation.y))*k;};
function routeTo(w,p){w.route=findRoute(w.rig.position,p,obstacles,grid);}
function resetWorkers(){workers.forEach(w=>{w.rig.position.set(w.start.x,0,w.start.z);w.rig.rotation.y=w.job.angle;w.phase=null;w.route=[];w.arrived=false;w.sit=null;w.mounted=w.job.kind==='drive';if(w.mounted)mountRoller(w);w.char.setPose('none');});}
const workerIndex=w=>workers.indexOf(w);
function onPhaseChange(w,phase){
 w.phase=phase;w.arrived=false;w.route=[];w.sit=null;const i=workerIndex(w);
 if(phase==='gather'){dismountRoller(w);routeTo(w,gatherSlots[i]);}
 else if(phase==='evacuate'){dismountRoller(w);routeTo(w,containerSlots[i]);}
 else if(phase==='rest')routeTo(w,restSpot);
 else if(phase==='shade')routeTo(w,shadeSpot);
 else if(phase==='working'||phase==='eager'||phase==='stubborn'){
  if(w.job.kind==='drive'){if(!w.mounted)routeTo(w,w.job.exit);}
  else if(Math.hypot(w.rig.position.x-w.start.x,w.rig.position.z-w.start.z)>.6)routeTo(w,w.start);}
}
const labelOf=(w,phase)=>({
 working:[w.job.name==='Davi'?'Tarefa leve · se aclimatando':tasks[w.job.name]],eager:['Ritmo total no 1º dia','#ffb38a'],measure:['Medindo o IBUTG'],weak:['Tonto e enjoado · passando mal','#ffb38a'],
 shade:['Recuperando-se na sombra','#9ef0c0'],rest:['Pausa no abrigo · bebendo água','#9ef0c0'],stubborn:['“Falta só uma passada!”','#ff8f7a'],gather:['Aguardando sua ordem','#ffe07a'],
 evacuate:[w.arrived?'No container de apoio':'Indo ao abrigo seguro','#9ef0c0']}[phase]||[tasks[w.job.name]]);
const present=()=>workers.filter(w=>w.phase==='evacuate'&&w.arrived).length;
function updateWorkers(dt,wx){
 workers.forEach((w,i)=>{
  const phase=workerPhase(w.job.phaseRole,state);if(w.phase!==phase)onPhaseChange(w,phase);
  setLabel(w,...labelOf(w,phase));w.label.visible=!(phase==='evacuate'&&w.arrived)&&!(phase==='working'&&w.route.length===0&&false);
  w.stride+=dt;const t=w.stride;let pose='none',speed=0;const extra={};const stay=w.route.length===0;
  // Airton volta ao rolo depois de liberado.
  if(w.job.kind==='drive'&&!w.mounted&&stay&&(phase==='working'||phase==='stubborn'||phase==='eager'))mountRoller(w);
  const before=w.rig.rotation.y;
  if(w.mounted){const p=seatPos();w.rig.position.set(p.x,.5,p.z);w.rig.rotation.y=Math.PI/2;pose='drive';extra.work=1;}
  else{w.rig.position.y=w.sit?.y??0;
   if(phase==='working'||phase==='eager'||phase==='stubborn'||phase==='measure'){if(stay){pose=workPose[w.job.kind]||'none';extra.work=w.job.kind==='sweep'?2:1;if(w.job.kind==='eager'&&phase==='working')pose='repair';w.rig.rotation.y=w.job.angle+Math.sin(t*.8)*.06;}}
   else if(phase==='weak'){pose='slump';}
   else if(phase==='rest'&&stay){pose='drink';facePlayer(w,.04);}
   else if(phase==='shade'&&stay){if(!w.sit){w.rig.position.set(shadeSpot.x,0,2.45);w.rig.rotation.y=0;w.sit={y:0};}pose='seated';}
   else if(phase==='gather'&&stay){facePlayer(w);extra.lookAt=player.position;}
   else if(phase==='evacuate'&&stay){w.arrived=true;w.rig.rotation.y=Math.PI;pose='none';extra.lookAt=player.position;}}
  const moving=!w.mounted&&walkAlong(w,dt);extra.turn=(w.rig.rotation.y-before)/Math.max(dt,.001);if(moving){speed=w.speed;pose='none';}
  w.prop.visible=!w.mounted&&(phase==='working'||phase==='eager'||phase==='stubborn'||phase==='measure'||phase==='gather')&&!moving||(w.job.kind==='eager'&&phase!=='evacuate'&&phase!=='rest'&&!moving);
  w.char.setPose(pose);w.char.update(dt,speed,extra);
  // Suor: cresce com o calor do dia e com o esforço.
  const base=Math.max(0,wx.sunHeat-.25)*1.15;const level=Math.min(1,phase==='weak'?1:phase==='eager'?base+.35:phase==='evacuate'||phase==='gather'||wx.dark>.4?base*.35:phase==='shade'||phase==='rest'?base*.6:base*(w.job.kind==='measure'?.5:.9));
  w.sweat.update(time,level);});
 $('assembly-status').textContent=`CONTAINER DE APOIO · ${present()}/${team} PESSOAS`;
}
// ---- Clima e hora do dia ----
const skyDay=new T.Color('#b9d4e6'),skyNoon=new T.Color('#cfe0ea'),skyStorm=new T.Color('#2e3946'),tmp=new T.Color();
const W={dark:0,rain:0,wind:0,sunHeat:0,hour:7,wet:0};
const rain=createRain(scene,2600);const bolt=createBolt(scene);
let flash=0,nextStrike=0,thunder=null,lastStep=-1;
const hourOf=s=>{const [h,m]=s.split(':').map(Number);return h+m/60;};
function strike(wx){
 const dist=6+wx.thunderDelay*2.6;strikeBolt(bolt,player.position.x+(Math.random()-.5)*26,Math.max(-30,player.position.z-dist));
 flash=1;thunder={t0:time,delay:wx.thunderDelay,rumbled:false};
}
function thunderSound(delay){if(muted||!audio)return;const len=audio.sampleRate*2.6,b=audio.createBuffer(1,len,audio.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<len;i++){last=(last+.02*(Math.random()*2-1))/1.02;d[i]=last*6*Math.exp(-i/len*2.4);}const s=audio.createBufferSource();s.buffer=b;const f=audio.createBiquadFilter();f.type='lowpass';f.frequency.value=260;const g=audio.createGain();g.gain.value=delay<5?1.2:.6;s.connect(f).connect(g).connect(audio.destination);s.start();}
function updateWeather(dt){
 const wx=weather(state.step),k=Math.min(1,dt*.55);
 for(const key of ['dark','rain','wind','sunHeat'])W[key]+=(wx[key]-W[key])*k;W.hour+=(hourOf(wx.clock)-W.hour)*Math.min(1,dt*.8);W.wet+=(Math.min(1,wx.rain*1.3)-W.wet)*Math.min(1,dt*(wx.rain>W.wet?.5:.08));
 // Céu e luz: claro pela manhã, esbranquiçado ao meio-dia, cinza-chumbo na tempestade.
 tmp.copy(skyDay).lerp(skyNoon,Math.min(1,W.sunHeat*1.1)).lerp(skyStorm,W.dark);scene.background.copy(tmp);scene.fog.color.copy(tmp);scene.fog.near=45-W.dark*30;scene.fog.far=95-W.dark*50-W.rain*15;
 sun.intensity=2.5*(1-W.dark*.92)+flash*3;hemi.intensity=.85*(1-W.dark*.72)+.1+flash*1.6;fill.intensity=1.1*(1-W.dark)+flash*1.2;renderer.toneMappingExposure=.95-W.dark*.1+flash*.4;
 sun.color.setHSL(.11,.75-W.dark*.4,.88-W.dark*.15);
 const a=Math.PI*(W.hour-6)/12;sun.position.set(look.x-17*Math.cos(a),8+17*Math.sin(Math.max(.05,a>Math.PI?.05:a)),look.z+6);sun.target.position.set(look.x,0,look.z);
 // Solo: terra molhada escurece e fica brilhante; poças aparecem.
 for(const m of SC.groundMats){if(!m.userData.r0){m.userData.r0=m.roughness;m.userData.c0=m.color.clone();}m.roughness=m.userData.r0*(1-W.wet*.62);m.color.copy(m.userData.c0).multiplyScalar(1-W.wet*.3);}
 SC.puddles.forEach((p,i)=>{p.material.opacity=Math.max(0,Math.min(.8,(W.wet-.25-i*.03)*1.6));});
 updateRain(rain,dt,W.rain,W.wind,look);
 // Vento: árvores balançam e a lona da tenda ondula.
 SC.trees.forEach(t=>{t.foliage.rotation.z=Math.sin(time*1.4+t.seed)*(.012+W.wind*.09);t.foliage.rotation.x=Math.sin(time*1.1+t.seed*2)*(.008+W.wind*.05);});
 if(SC.tent){const p=SC.tent.geo.attributes.position,b=SC.tent.base,amp=.05+W.wind*.42;for(let i=0;i<p.count;i++){const x=b[i*3],y=b[i*3+1];p.setZ(i,Math.sin(x*1.1+y*.7+time*(2.2+W.wind*6))*amp*(.6+Math.abs(y)/4));}p.needsUpdate=true;SC.tent.geo.computeVertexNormals();}
 // Raios: só depois do aviso de tempestade; o atraso do trovão vem de rules.weather().
 if(state.step!==lastStep){lastStep=state.step;nextStrike=time+1.2;if(wx.thunderDelay==null)thunder=null;}
 if(wx.thunderDelay!=null&&time>=nextStrike){strike(wx);nextStrike=time+(wx.thunderDelay>10?9:6.5);}
 if(thunder&&!thunder.rumbled&&time>=thunder.t0+thunder.delay){thunder.rumbled=true;thunderSound(thunder.delay);}
 flash=Math.max(0,flash-dt*3.2);updateBolt(bolt,dt);$('flash').style.opacity=String(Math.min(.65,flash*.6));$('storm-dim').style.opacity=String(Math.min(.55,W.dark*.5));
 SC.containerLight.intensity=W.dark*3.2;
 if(rainGain)rainGain.gain.setTargetAtTime(muted||paused||finished?0:W.rain*.22,audio.currentTime,.3);
 return wx;
}
// Painel de clima no HUD.
const hud={clock:'',air:'',ibutg:'',sec:'',bar:-1};
{const a=(NIVEL_ACAO_PESADO-20)/14*100,l=(LIMITE_PESADO-20)/14*100;$('wx-mark-action').style.left=a+'%';$('wx-mark-limit').style.left=l+'%';$('wx-mark-action').previousElementSibling&&0;document.querySelector('.gauge').style.background=`linear-gradient(90deg,#57c48f 0 ${a}%,#f0c23f ${a}% ${l}%,#e5583c ${l}% 100%)`;}
function updateWxHud(wx){
 const ibutgTxt=wx.ibutg.toFixed(1).replace('.',','),clock=wx.clock,air=wx.air+' °C';
 if(hud.clock!==clock){hud.clock=clock;$('wx-clock').textContent=clock;}if(hud.air!==air){hud.air=air;$('wx-air').textContent=air;}
 if(hud.ibutg!==ibutgTxt){hud.ibutg=ibutgTxt;$('wx-ibutg').textContent=ibutgTxt;const pos=Math.max(0,Math.min(100,(wx.ibutg-20)/14*100));$('wx-bar').style.left=`calc(${pos}% - 2px)`;}
 const th=$('wx-thunder');const showThunder=wx.thunderDelay!=null&&thunder;th.hidden=!showThunder;
 if(showThunder){const counting=time<thunder.t0+thunder.delay;const sec=counting?Math.floor(time-thunder.t0):thunder.delay;const txt=counting?`${sec} s…`:`${sec} s`;if(hud.sec!==txt){hud.sec=txt;$('wx-sec').textContent=txt;$('wx-dist').textContent=counting?'contando o trovão':`≈ ${(thunderDistance(thunder.delay)/1000).toFixed(1).replace('.',',')} km${inDangerRange(thunder.delay)?' • PERIGO':''}`;}}
 const heat=Math.min(1,W.sunHeat);$('sun-glare').style.opacity=String(Math.min(.9,heat*.95));
 $('wx').style.borderTopColor=W.dark>.5?'#7fb2e5':wx.ibutg>LIMITE_PESADO?'#e5583c':wx.ibutg>NIVEL_ACAO_PESADO?'#ffb62e':'#57c48f';
}
// ---- Alvos, painel e diálogos ----
function anchorOf(o){if(!o)return null;if(o.who)return byName(o.who).rig.position;return {x:o.x,z:o.z};}
const reachOf=o=>o.r??(o.who?2:1.6);
const nearTarget=o=>{const a=anchorOf(o);return Math.hypot(player.position.x-a.x,player.position.z-a.z)<=reachOf(o);};
function unstick(){const p=player.position;if(canMove(p.x,p.z,obstacles))return;for(let r=.2;r<5;r+=.2)for(let a=0;a<24;a++){const x=p.x+Math.cos(a/24*Math.PI*2)*r,z=p.z+Math.sin(a/24*Math.PI*2)*r;if(canMove(x,z,obstacles)){p.x=x;p.z=z;return;}}}
const labelBounds={min:80,max:innerWidth-80};let camShiftX=0;
function updateLabelBounds(){const panel=document.querySelector('.mission').getBoundingClientRect();const ppu=innerHeight/(2*camOffset.length()*Math.tan(camera.fov*Math.PI/360));camShiftX=innerWidth<850||!panel.width?0:panel.left<innerWidth/2?-(panel.right+16)/2/ppu:(innerWidth-panel.left+16)/2/ppu;labelBounds.min=80;labelBounds.max=innerWidth-80;if(innerWidth>=700&&panel.width){if(panel.left<innerWidth/2)labelBounds.min=Math.min(innerWidth/2,panel.right+110);else labelBounds.max=Math.max(innerWidth/2,panel.left-110);}}
function updateMissionPanel(){const panel=document.querySelector('.mission');panel.classList.toggle('compact',missionCollapsed);$('mission-toggle').textContent=missionCollapsed?'+':'−';$('mission-toggle').setAttribute('aria-expanded',String(!missionCollapsed));$('mission-toggle').setAttribute('aria-label',missionCollapsed?'Expandir painel de missão':'Recolher painel de missão');requestAnimationFrame(updateLabelBounds);}
$('mission-toggle').onclick=()=>{missionCollapsed=!missionCollapsed;updateMissionPanel();};
document.querySelector('.progress').innerHTML=objectives.map(()=>'<i></i>').join('');
function escapeHTML(s){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);}
const chips=o=>refSummary(o).map(r=>`<span class="chip ${r.kind}${r.check?' check':''}">${escapeHTML(r.label)}<small>${r.status}</small></span>`).join('');
function notify(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5000);}
function updateHUD(){
 updateMissionPanel();const o=currentTarget(state);$('count').textContent=`${state.completed.length}/${objectives.length}`;$('number').textContent=String(Math.min(state.step+1,objectives.length)).padStart(2,'0');
 document.querySelectorAll('.progress i').forEach((e,i)=>{e.className=state.completed.includes(objectives[i].id)?'done':i===state.step?'active':'';});
 if(o){$('objective').textContent=o.title;$('description').textContent=o.description;$('tip').textContent=o.tip;$('refs').innerHTML=chips(o);$('target-label').textContent=o.title.toUpperCase();}
 const show=!!o&&!finished;marker.visible=show;targetRing.visible=show;$('target-label').hidden=!show;
 const storm=state.step>=indexOf('abrigoSeguro');$('assembly-status').hidden=!storm||finished;
 SC.board.draw({...weather(state.step),ibutg:weather(state.step).ibutg});
}
function openDialog(title,content,complete=false,cls=''){const d=document.querySelector('.dialog');d.classList.remove('ext-catalog','choice-dialog');if(cls)d.classList.add(cls);paused=true;keys.clear();$('dialog-title').textContent=title;$('dialog-content').innerHTML=content;$('resume').hidden=complete||!!cls;$('restart').hidden=!!cls;$('overlay').hidden=false;d.scrollTop=0;}
function closeDialog(){paused=false;$('overlay').hidden=true;}
function applyState(next){state=next;updateHUD();if(state.feedback)notify(state.feedback);
 if(state.finished){finished=true;openDialog('Turno encerrado.',`<div class="success-number">${state.completed.length} / ${objectives.length}</div><p>Você organizou o turno no calor, socorreu um colega, protegeu a equipe da tempestade, conferiu alojamento e moradia rural e fechou o ciclo do PGR.</p><p>Tempo: <strong>${Math.floor(elapsed/60)}min ${Math.floor(elapsed%60)}s</strong>. Decisões corrigidas: <strong>${state.errors}</strong>.</p><p>Lembre: a NR 21 em vigor é a de 1999. Itens marcados como <em>Proposta</em> ainda não estão em vigor, e os marcados como <em>Boa prática</em> não são item de NR. A simulação não substitui o treinamento prático nem a avaliação de um profissional de segurança do trabalho.</p>`,true);}}
function openChoice(){const o=currentTarget(state);if(!o?.choices)return;const order=[...o.choices].sort((a,b)=>((a.id.charCodeAt(0)*7+state.step*3+state.errors)%5)-((b.id.charCodeAt(0)*7+state.step*3+state.errors)%5));
 openDialog(o.title,`<button class="catalog-close" id="catalog-close">Voltar ao jogo ×</button><div class="refs">${chips(o)}</div><p>${o.description}</p><div class="choice-list">${order.map(c=>`<button class="choice" data-choice="${c.id}">${escapeHTML(c.label)}</button>`).join('')}</div><p class="feedback" id="choice-feedback" aria-live="polite"></p>`,false,'choice-dialog');
 $('catalog-close').onclick=closeDialog;
 document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{const next=answer(state,b.dataset.choice);if(next.step===state.step){state=next;b.classList.add('wrong');b.disabled=true;$('choice-feedback').textContent=next.feedback;return;}closeDialog();applyState(next);});}
$('rules-info').onclick=()=>{openDialog('Fontes e origem do conteúdo',`<button class="catalog-close" id="catalog-close">Voltar ao jogo ×</button><p>Cada etapa mostra de onde vem o que está sendo cobrado:</p><ul class="rules-list"><li><b><span class="chip vigente" style="display:inline-block">${KINDS.vigente}</span></b>NR 21 (Portaria MTb 3.214/1978, última alteração Portaria MTE 2.037/1999); NR 9 Anexo 3 — Calor (Portaria SEPRT 1.359/2019); NR 6; NR 24; NR 1; NHO 06 da Fundacentro.</li><li><b><span class="chip proposta" style="display:inline-block">${KINDS.proposta}</span></b>Texto submetido à Consulta Pública em 11/06/2025 (seções 21.3 a 21.8), com contribuições até 28/07/2025. Só passa a valer se for publicado no DOU.</li><li><b><span class="chip pratica" style="display:inline-block">${KINDS.pratica}</span></b>Procedimentos técnicos úteis, como a regra dos 30 s / 30 min para raios. Não são exigência de NR.</li></ul><p>A NR 21 vigente (21.1 a 21.14) cobre abrigos, medidas contra insolação e calor, alojamento e moradia rural. Raios, tempestades, pausas e água potável não constam dela.</p>`,false,'choice-dialog');$('catalog-close').onclick=closeDialog;};
function act(){if(paused||finished)return;const o=currentTarget(state);if(!o)return;
 if(!nearTarget(o)){notify('Aproxime-se do círculo azul para interagir.');return;}
 if(o.choices){openChoice();return;}
 const next=interact(state,o.id,{present:present()});
 if(next.step>state.step){playerAction={pose:'inspect',until:time+1.3};keys.clear();}
 applyState(next);}
function reset(){playerAction=null;clearTimeout(toastTimer);$('toast').classList.remove('show');$('toast').textContent='';state=initialState();missionCollapsed=false;resetWorkers();elapsed=0;finished=false;camDist=1;look.set(playerStart.x,0,playerStart.z);paused=false;player.position.set(playerStart.x,0,playerStart.z);player.rotation.y=0;thunder=null;lastStep=-1;$('overlay').hidden=true;keys.clear();updateHUD();}
function help(){openDialog('Trabalhos a céu aberto',`<p>Você é o encarregado da frente de trabalho de uma obra de pavimentação e drenagem. O dia começa quente e termina com uma tempestade. Organize o turno, proteja a equipe do calor e do raio, e confira alojamento e moradia rural conforme a NR 21.</p><ul><li><strong>WASD / setas</strong>: mover. <strong>Shift</strong>: correr.</li><li><strong>E / AÇÃO</strong>: interagir no marcador. A maioria das etapas pede uma decisão.</li><li><strong>Losango verde</strong>: você. <strong>Losango azul e alvo luminoso</strong>: destino.</li><li><strong>Painel de clima</strong> (canto superior direito): horário, temperatura, IBUTG e, na tempestade, a contagem entre o relâmpago e o trovão.</li><li><strong>Fontes</strong>: de onde vem cada conteúdo (em vigor, proposta ou boa prática).</li></ul><p>Conteúdo educativo. A NR 21 vigente é a de 1999; itens de proposta ou de boa prática vêm sempre identificados.</p>`);}
$('action').addEventListener('click',act);$('help').onclick=help;$('pause').onclick=()=>{if(paused&&!finished)closeDialog();else if(!finished)openDialog('Missão pausada','<p>Continue quando estiver pronto.</p>');};$('resume').onclick=closeDialog;$('restart').onclick=reset;
function ensureAudio(){if(audio)return;audio=new AudioContext();const len=audio.sampleRate*2,b=audio.createBuffer(1,len,audio.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;const s=audio.createBufferSource();s.buffer=b;s.loop=true;const f=audio.createBiquadFilter();f.type='bandpass';f.frequency.value=1800;f.Q.value=.5;rainGain=audio.createGain();rainGain.gain.value=0;s.connect(f).connect(rainGain).connect(audio.destination);s.start();}
$('sound').onclick=()=>{muted=!muted;ensureAudio();audio.resume();$('sound').textContent=muted?'Som: desligado':'Som: ligado';$('sound').setAttribute('aria-label',muted?'Ativar som':'Desativar som');};
addEventListener('keydown',e=>{if(e.target instanceof HTMLButtonElement&&['Enter',' '].includes(e.key))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','e',' '].includes(k))e.preventDefault();if(k==='e'&&!e.repeat)act();if(k==='escape'&&!finished){if(!$('overlay').hidden&&document.querySelector('.dialog').classList.length>2)closeDialog();else $('pause').click();}if(!paused)keys.add(k);});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();if(!paused&&!finished)openDialog('Missão pausada','<p>Continue quando estiver pronto.</p>');});document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden&&!paused&&!finished)openDialog('Missão pausada','<p>Continue quando estiver pronto.</p>');});
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key.toLowerCase());};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.key.toLowerCase());});
const hw=detectHardware(renderer);const gfx=createRenderPipeline(renderer,scene,camera,sun);let qualityMode=savedQuality();
gfx.setLevel(qualityMode==='auto'?hw.level:qualityMode,false);
if(hw.mobile)renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));
function syncQualityButton(){$('quality').textContent='Gráficos: '+(qualityMode==='auto'?'Auto · ':'')+QUALITY[gfx.level].label;}syncQualityButton();
$('quality').onclick=()=>{const order=['auto','baixa','media','alta'];qualityMode=order[(order.indexOf(qualityMode)+1)%4];try{localStorage.setItem('nr21-qualidade',qualityMode);}catch{}if(qualityMode==='auto'){gfx.setLevel(hw.level,false);fpsStable=0;}else gfx.setLevel(qualityMode);if(hw.mobile)renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));syncQualityButton();notify(qualityMode==='auto'?'Gráficos automáticos: o jogo ajusta a qualidade conforme o desempenho.':'Qualidade gráfica: '+QUALITY[gfx.level].label+'.');};
let fpsTime=0,fpsFrames=0,fpsStable=0,fpsStart=performance.now();
function resize(){camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<650?60:52;camera.updateProjectionMatrix();gfx?.resize();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));}addEventListener('resize',()=>{resize();updateLabelBounds();});resize();updateHUD();
// Setas no chão: mostram o caminho até o destino, contornando obstáculos, e somem ao chegar perto.
const guideMat=new T.MeshBasicMaterial({color:'#7dfcff',transparent:true,opacity:.9,depthTest:false,depthWrite:false,toneMapped:false,side:T.DoubleSide});
const guideGeo=(()=>{const s=new T.Shape();s.moveTo(0,.5);s.lineTo(.42,-.08);s.lineTo(.22,-.08);s.lineTo(0,.2);s.lineTo(-.22,-.08);s.lineTo(-.42,-.08);s.closePath();return new T.ShapeGeometry(s);})();
const GUIDE_STEP=1.8,guideArrows=[];for(let i=0;i<48;i++){const m=new T.Mesh(guideGeo,guideMat);m.rotation.x=-Math.PI/2;m.renderOrder=8;m.visible=false;scene.add(m);guideArrows.push(m);}
let guidePath=[],guideLen=[],guideTimer=0;
function refreshGuide(a,reach){const r=findRoute(player.position,a,obstacles,grid);guidePath=r;guideLen=[0];for(let i=1;i<r.length;i++)guideLen.push(guideLen[i-1]+Math.hypot(r[i].x-r[i-1].x,r[i].z-r[i-1].z));}
function updateGuide(dt,a,reach){
 guideTimer-=dt;if(a&&guideTimer<=0){guideTimer=.35;refreshGuide(a,reach);}
 const total=guideLen.at(-1)||0,stop=Math.max(0,total-reach*.75);let k=0;
 if(a&&guidePath.length>2&&!finished){const flow=(time*1.6)%GUIDE_STEP;let j=1;
  for(let s=flow+2.2;s<stop&&k<guideArrows.length;s+=GUIDE_STEP){while(j<guidePath.length-1&&guideLen[j]<s)j++;const p0=guidePath[j-1],p1=guidePath[j],seg=Math.max(1e-6,guideLen[j]-guideLen[j-1]),t=Math.min(1,Math.max(0,(s-guideLen[j-1])/seg));
   const x=p0.x+(p1.x-p0.x)*t,z=p0.z+(p1.z-p0.z)*t;let dx=p1.x-p0.x,dz=p1.z-p0.z;if(Math.hypot(dx,dz)<1e-4){const q=guidePath[Math.min(j+1,guidePath.length-1)];dx=q.x-p0.x;dz=q.z-p0.z;}
   const m=guideArrows[k++];m.visible=true;m.position.set(x,.09,z);m.rotation.set(-Math.PI/2,0,0);m.rotation.y=0;m.rotateOnWorldAxis(new T.Vector3(0,1,0),Math.atan2(-dx,-dz));const fade=Math.min(1,(s-2.2)/1.5,(stop-s)/1.5+.35);m.scale.setScalar(.85+.15*Math.sin(time*5-s));}}
 for(;k<guideArrows.length;k++)guideArrows[k].visible=false;
}
let last=performance.now();const v=new T.Vector3();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;
 if(!paused){time+=dt;elapsed+=dt;let sx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),sy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
  const n=(playerAction&&time<playerAction.until)?0:Math.hypot(sx,sy);
  if(n){sx/=n;sy/=n;const speed=keys.has('shift')?8.5:5.2;const dx=sx*speed*dt,dz=sy*speed*dt;if(canMove(player.position.x+dx,player.position.z,obstacles))player.position.x+=dx;if(canMove(player.position.x,player.position.z+dz,obstacles))player.position.z+=dz;const a=Math.atan2(dx,dz);const d=Math.atan2(Math.sin(a-player.rotation.y),Math.cos(a-player.rotation.y))*.22;player.rotation.y+=d;playerMove={speed,turn:d/Math.max(dt,.001)};}else playerMove={speed:0,turn:0};}
 unstick();const mobile=innerWidth<850;const tgt=currentTarget(state),tgtA=tgt&&!finished?anchorOf(tgt):null;
 const desired=new T.Vector3(player.position.x+(mobile?0:camShiftX*.6),0,player.position.z);
 if(tgtA){const dist=Math.hypot(tgtA.x-player.position.x,tgtA.z-player.position.z);const k=Math.min(.32,.12+Math.max(0,dist-5)*.028);desired.x+=(tgtA.x-desired.x)*k;desired.z+=(tgtA.z-desired.z)*k;}
 camDist+=((window.__nr21?.zoom||1)-camDist)*Math.min(1,dt*2);look.lerp(desired,Math.min(1,dt*7));camera.position.copy(look).addScaledVector(camOffset,camDist);camera.lookAt(look.x,look.y+.6,look.z);
 const seeThrough=[{x:player.position.x,y:1.4,z:player.position.z},{x:player.position.x,y:.45,z:player.position.z}];if(tgtA)seeThrough.push({x:tgtA.x,y:.9,z:tgtA.z});updateSeeThrough(dt,seeThrough);
 const wx=updateWeather(paused?0:dt);
 if(!paused||finished){updateWorkers(paused?0:dt,W);
  // Rolo compactador em movimento enquanto há serviço; para na interrupção.
  const rolling=!done('interrompa')&&!finished;const rg=SC.roller.group;const tx=-5.4+(rolling?Math.sin(time*.45)*2.4:0);const px=rg.position.x;rg.position.x+=(tx-rg.position.x)*Math.min(1,dt*3);if(dt>0)SC.roller.drums.forEach(d=>d.rotation.y-=(rg.position.x-px)/.72);}
 updateGuide(dt,tgtA,tgt?reachOf(tgt):1.6);
 updateWxHud(wx);
 const o=currentTarget(state);if(o&&!finished){const an=anchorOf(o);const personal=!!o.who;targetRing.position.set(an.x,.06,an.z);targetRing.scale.setScalar(personal?.85:Math.min(1.6,Math.max(1,reachOf(o)/1.6)));marker.position.set(an.x,(personal?2.95:2.7)+Math.sin(time*3)*.14,an.z);diamond.rotation.y=time*.7;const pulse=(time*.65)%1;targetPulse.scale.setScalar(1+pulse*.42);targetPulse.material.opacity=.28*(1-pulse);playerDiamond.position.y=2.3+Math.sin(time*2.7)*.06;playerDiamond.rotation.y=time*.6;v.copy(marker.position);v.y+=.7;v.project(camera);$('target-label').style.left=`${Math.max(labelBounds.min,Math.min(labelBounds.max,(v.x*.5+.5)*innerWidth))}px`;let ly=Math.max(innerWidth<600?330:110,Math.min(innerHeight-135,(-v.y*.5+.5)*innerHeight));const lx=Math.max(labelBounds.min,Math.min(labelBounds.max,(v.x*.5+.5)*innerWidth));const wr=$('wx').getBoundingClientRect(),lw=$('target-label').offsetWidth/2;if(lx+lw>wr.left-6&&lx-lw<wr.right+6&&ly>wr.top-10&&ly<wr.bottom+46)ly=wr.bottom+46;$('target-label').style.top=`${ly}px`;const near=nearTarget(o);$('action').classList.toggle('near',near);$('action-hint').textContent=near?'PRESSIONE PARA INTERAGIR':'SIGA O MARCADOR';}
 if(!paused){const la=tgtA&&playerMove.speed<.1?tgtA:null;const pose=(playerAction&&time<playerAction.until)?playerAction.pose:'none';playerChar.setPose(pose);playerChar.update(dt,playerMove.speed,{turn:playerMove.turn,lookAt:la});playerSweat.update(time,Math.max(0,W.sunHeat-.3)*.9,1.72);}
 fpsTime+=dt;fpsFrames++;if(fpsTime>4&&performance.now()-fpsStart>8000){const fps=fpsFrames/fpsTime;fpsTime=0;fpsFrames=0;
  if(qualityMode==='auto'&&!document.hidden){const order=['baixa','media','alta'],i=order.indexOf(gfx.level);
   if(fps<28&&i>0){gfx.setLevel(order[i-1],false);fpsStable=0;if(hw.mobile)renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));syncQualityButton();notify('Gráficos ajustados para '+QUALITY[gfx.level].label+' para manter o jogo fluido.');}
   else if(fps>56&&i<2&&!hw.mobile&&++fpsStable>=4){gfx.setLevel(order[i+1],false);fpsStable=0;syncQualityButton();}
   else if(fps<=56)fpsStable=0;}}
 gfx.setHeat(W.sunHeat*(1-W.dark));gfx.render(time);}
requestAnimationFrame(frame);
mountRoller(byName('Airton'));
// Gancho de teste (leitura do estado e avanço da etapa) usado pela verificação automática no navegador.
window.__nr21={get state(){return state;},get player(){return player.position;},get present(){return present();},zoom:1,get render(){return {...renderer.info.render,tex:renderer.info.memory.textures,geo:renderer.info.memory.geometries};},get heatPass(){return gfx.hasHeatPass;},get weather(){return {...W};},canMove:(x,z)=>canMove(x,z,obstacles),teleport:(x,z)=>player.position.set(x,0,z),anchor:()=>{const o=currentTarget(state);const a=o&&anchorOf(o);return a&&{x:a.x,z:a.z,r:reachOf(o)};},workers:()=>workers.map(w=>({name:w.job.name,phase:w.phase,x:w.rig.position.x,z:w.rig.position.z,arrived:w.arrived})),
 occluders(id){const i=indexOf(id),o=objectives[i],a=anchorOf(o);const cam=new T.Vector3(a.x,0,a.z).addScaledVector(camOffset,1);const res=[];for(const y of [.9,2.7]){const to=new T.Vector3(a.x,y,a.z),dir=to.clone().sub(cam),len=dir.length();const r=new T.Raycaster(cam,dir.normalize(),0,len-.3);r.camera=camera;for(const h of r.intersectObjects(scene.children,true)){const m=h.object;if(!m.isMesh||m.geometry.type==='PlaneGeometry'&&m.rotation.x!==0||m.geometry.type==='CircleGeometry'||!m.visible)continue;if(m.material.depthTest===false)continue;res.push({y,type:m.geometry.type,faded:sceneryMeshes.includes(m),x:+m.getWorldPosition(new T.Vector3()).x.toFixed(1),z:+m.getWorldPosition(new T.Vector3()).z.toFixed(1)});}}return res;},
 advance(){const o=currentTarget(state);if(!o||finished)return false;if(o.choices){const c=o.choices.find(x=>x.correct);applyState(answer(state,c.id));return true;}applyState(interact(state,o.id,{present:present()}));return true;}};
