// Cenário estático do canteiro, construído conforme layout.mjs: frente de trabalho, abrigo de vivência, container de apoio,
// alojamento, moradia rural, poço e fossa. Devolve as peças que o jogo anima (lona, rolo, árvores, poças, quadro de avisos).
import * as T from './three.module.js';
import {structures as S,container} from './layout.mjs';
import {glowSprite} from './graphics.mjs';
const d2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function buildScenery(scene,TX){
 const mats={};
 const mat=(c,metal=0,rough=.7)=>mats[c+'-'+metal+'-'+rough]??=new T.MeshStandardMaterial({color:c,metalness:metal,roughness:rough});
 const shadowed=(m,cast=true)=>{m.castShadow=cast;m.receiveShadow=true;return m;};
 const box=(w,h,d,c,x,y,z,parent=scene,metal=0)=>{const m=shadowed(new T.Mesh(new T.BoxGeometry(w,h,d),typeof c==='object'?c:mat(c,metal)));m.position.set(x,y,z);parent.add(m);return m;};
 const cyl=(r,rb,h,c,x,y,z,parent=scene,n=16)=>{const m=shadowed(new T.Mesh(new T.CylinderGeometry(r,rb,h,n),typeof c==='object'?c:mat(c,.2)));m.position.set(x,y,z);parent.add(m);return m;};
 const sphere=(r,c,x,y,z,parent=scene)=>{const m=shadowed(new T.Mesh(new T.SphereGeometry(r,16,12),mat(c)),true);m.position.set(x,y,z);parent.add(m);return m;};
 const rod=(a,b,r,c,parent=scene)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b);const m=cyl(r,r,av.distanceTo(bv),c,0,0,0,parent,10);m.position.copy(av.clone().add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return m;};
 function sign(text,w,h,x,y,z,bg='#173e31',fg='#ffffff',parent=scene,ry=0){
  const cv=document.createElement('canvas');cv.width=768;cv.height=Math.round(768*h/w);const g=cv.getContext('2d');
  g.fillStyle=bg;g.fillRect(0,0,cv.width,cv.height);g.strokeStyle=fg;g.lineWidth=6;g.strokeRect(12,12,cv.width-24,cv.height-24);
  g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';const lines=text.split('\n');g.font=`bold ${Math.min(110,cv.height/(lines.length+1))}px Arial`;
  lines.forEach((s,i)=>g.fillText(s,384,cv.height*(i+1)/(lines.length+1),714));
  const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tx,roughness:.8}));
  m.position.set(x,y,z);m.rotation.y=ry;parent.add(m);return m;}
 const out={trees:[],puddles:[],groundMats:[],signs:{}};
 // ---- Terreno: terra batida do canteiro, gramado em volta, via ao norte ----
 const dirtMat=new T.MeshStandardMaterial({map:TX.dirt,normalMap:TX.dirtN,normalScale:new T.Vector2(.6,.6),color:'#c9bfa9',roughness:.95});
 const slab=new T.Mesh(new T.BoxGeometry(49,.3,28.4),dirtMat);slab.position.set(3,-.15,0);slab.receiveShadow=true;scene.add(slab);
 const grassMat=new T.MeshStandardMaterial({map:TX.grass,roughness:1});
 const grass=new T.Mesh(new T.PlaneGeometry(240,240),grassMat);grass.rotation.x=-Math.PI/2;grass.position.y=-.32;grass.receiveShadow=true;scene.add(grass);
 const asphaltMat=new T.MeshStandardMaterial({map:TX.asphalt,normalMap:TX.asphaltN,normalScale:new T.Vector2(.6,.6),color:'#8d9498',roughness:.95});
 const road=new T.Mesh(new T.BoxGeometry(110,.3,5.4),asphaltMat);road.position.set(3,-.17,-16.9);road.receiveShadow=true;scene.add(road);
 for(let x=-46;x<54;x+=3)box(1.4,.02,.14,'#e9e2c8',x,-.015,-16.9);
 const freshMat=new T.MeshStandardMaterial({map:TX.freshAsphalt,normalMap:TX.freshAsphaltN,normalScale:new T.Vector2(.7,.7),color:'#9aa0a4',roughness:.9});
 const fresh=new T.Mesh(new T.BoxGeometry(15.5,.06,3.4),freshMat);fresh.position.set(-9.2,.02,-6.3);fresh.receiveShadow=true;scene.add(fresh);
 const base=new T.Mesh(new T.BoxGeometry(6,.05,3.4),new T.MeshStandardMaterial({color:'#6b6f70',roughness:1}));base.position.set(3.4,.015,-6.3);base.receiveShadow=true;scene.add(base);
 out.groundMats.push(dirtMat,asphaltMat,freshMat,grassMat);
 // Mureta e grade de proteção entre o canteiro e a via.
 for(let x=-19;x<=26;x+=3){rod([x,0,-13.75],[x,.9,-13.75],.045,'#9aa4a8');}rod([-19,.9,-13.75],[26.4,.9,-13.75],.05,'#b9c2c5');rod([-19,.55,-13.75],[26.4,.55,-13.75],.04,'#a2acb0');
 for(let x=-18;x<26;x+=4){const c=new T.Group();c.position.set(x,0,-13.2);scene.add(c);cyl(.04,.2,.5,'#f07a28',0,.26,0,c);cyl(.1,.12,.07,'#f4f1e6',0,.34,0,c);}
 // Poças: aparecem com a chuva.
 for(const [x,z,r] of [[-2,-1.2,1.1],[-9,1.5,1.3],[0,7.6,1.5],[6.5,5,1.2],[13,4.6,1.4],[17,-6.2,1.2],[-14,5,1.6],[8,-5,1.3],[21,1.6,1]]){
  const p=new T.Mesh(new T.CircleGeometry(r,28),new T.MeshStandardMaterial({color:'#51626d',roughness:.06,metalness:.35,transparent:true,opacity:0,depthWrite:false}));
  p.rotation.x=-Math.PI/2;p.position.set(x,.03,z);p.scale.set(1,.72,1);scene.add(p);out.puddles.push(p);}
 // ---- Frente de trabalho: valeta de drenagem, tubos, rolo, caminhão, retroescavadeira, torre de luz ----
 {const t=S.trench;box(t.w,.05,t.d,'#3a2c20',t.x,.01,t.z);box(t.w,.05,.34,'#c9a16b',t.x,.05,t.z-.66);box(t.w,.05,.34,'#c9a16b',t.x,.05,t.z+.66);
  for(const x of [-15.2,-11.5,-7.8]){const m=new T.Mesh(new T.ConeGeometry(.9,.55,14),mat('#b48a5a'));m.position.set(x,.27,t.z-1.2);m.castShadow=true;scene.add(m);}
  for(let x=-16;x<=-7;x+=1.8){const c=cyl(.45,.45,1.6,'#9aa0a3',x,.2,t.z+.05,scene,18);c.rotation.z=Math.PI/2;c.scale.set(1,1,1);}
  for(let x=-16.2;x<-6.5;x+=1.6){rod([x,0,t.z-.95],[x,.8,t.z-.95],.03,'#f07a28');}rod([-16.2,.8,t.z-.95],[-7,.8,t.z-.95],.03,'#f07a28');rod([-16.2,.5,t.z-.95],[-7,.5,t.z-.95],.02,'#e8e2d0');
  const p=S.pipes;for(let i=0;i<3;i++){const c=cyl(.3,.3,1.6,'#a6abad',p.x,.3+(i>1?.5:0),p.z+(i%2?.3:-.3)+(i>1?.3:0),scene,18);c.rotation.z=Math.PI/2;}
  sign('VALETA\nABERTA',1.3,.6,-11.5,1.1,-4.5,'#f0b429','#22262a');}
 const rollerGroup=new T.Group();rollerGroup.position.set(S.roller.x,0,S.roller.z);scene.add(rollerGroup);
 box(2.6,.7,1.2,'#e8aa21',0,.95,0,rollerGroup,.2);box(1.2,.8,1,'#d99a16',.35,1.6,0,rollerGroup);
 for(const x of [-.6,1.1])for(const z of [-.62,.62])box(.06,1.0,.06,'#2b3033',x+.1,2.1,z*.85,rollerGroup);
 box(1.6,.07,1.3,'#2b3033',.4,2.62,0,rollerGroup);box(.6,.5,.4,'#3a3f44',-1.1,1.55,0,rollerGroup);
 const drums=[];for(const x of [-1.2,1.15]){const c=cyl(.72,.72,1.5,'#9da4a8',x,.75,0,rollerGroup,22);c.rotation.x=Math.PI/2;drums.push(c);box(.3,.7,1.6,'#e8aa21',x,1.0,0,rollerGroup);}
 const seatSpot=new T.Object3D();seatSpot.position.set(.35,1.3,0);rollerGroup.add(seatSpot);
 sign('ROLO\nCOMPACTADOR',.9,.4,1.05,1.0,.61,'#23282c','#f5c948',rollerGroup);
 out.roller={group:rollerGroup,drums,seat:seatSpot};
 {const tk=S.truck;box(3.6,.4,2,'#2f3438',tk.x+.8,.75,tk.z,scene,.4);box(3.1,1.2,2.1,'#d78a1c',tk.x+.6,1.55,tk.z,scene,.3);box(1.8,1.6,2.1,'#e8aa21',tk.x-1.7,1.6,tk.z,scene,.3);box(.06,.7,1.8,'#9fd0e6',tk.x-2.6,1.95,tk.z,scene,.6);
  for(const x of [-3,-.2,1.9])for(const z of [-1.05,1.05]){const w=cyl(.45,.45,.3,'#1d2427',tk.x+x,.45,tk.z+z,scene,18);w.rotation.x=Math.PI/2;}
  sign('BASCULANTE',2,.4,tk.x+.6,1.7,tk.z+1.06,'#23282c','#f5c948');}
 {const b=S.backhoe;box(1.6,1.1,1.5,'#e8aa21',b.x+.4,1.05,b.z,scene,.3);box(1.0,1.0,1.4,'#d99a16',b.x+.5,1.9,b.z,scene,.3);box(2.6,.25,.3,'#d99a16',b.x-1.2,1.6,b.z,scene,.3);rod([b.x-2.3,1.9,b.z],[b.x-2.8,.6,b.z],.09,'#d99a16');box(.6,.3,.7,'#2b3033',b.x-2.9,.45,b.z,scene,.4);
  for(const x of [-.3,1.2])for(const z of [-.82,.82]){const w=cyl(.5,.5,.35,'#1d2427',b.x+x,.5,b.z+z,scene,18);w.rotation.x=Math.PI/2;}
  box(.2,.2,.2,'#2b3033',b.x+1.1,2.7,b.z,scene);}
 {const l=S.lightTower;rod([l.x,0,l.z],[l.x,6.2,l.z],.09,'#7f8a90');box(1.1,.5,.5,'#2d3339',l.x,6.4,l.z,scene,.4);for(const dx of [-.4,0,.4])box(.2,.3,.06,'#fffbe0',l.x+dx,6.4,l.z+.27);box(.9,.5,.9,'#d99a16',l.x,.25,l.z,scene,.3);out.signs.tower=l;}
 // ---- Árvores isoladas: uma delas junto à frente de trabalho ----
 function tree(x,z,s=1){const g=new T.Group();g.position.set(x,0,z);scene.add(g);cyl(.22*s,.3*s,3.2*s,'#5b4632',0,1.6*s,0,g,10);
  const foliage=new T.Group();foliage.position.y=3.1*s;g.add(foliage);for(const [dx,dy,dz,r,c] of [[0,.8,0,1.55,'#4f7a3f'],[.9,.1,.3,1.15,'#5a8845'],[-.9,.2,-.2,1.2,'#476f39'],[.1,1.7,.2,1.0,'#5f9148']])sphere(r*s,c,dx*s,dy*s,dz*s,foliage);
  out.trees.push({g,foliage,seed:Math.random()*6});return g;}
 tree(S.tree1.x,S.tree1.z,1.25);tree(S.tree2.x,S.tree2.z,1.1);sign('ÁRVORE ISOLADA\nNÃO SE ABRIGUE',1.5,.5,S.tree1.x+.9,1.3,S.tree1.z+.55,'#b02a1f','#fff');
 for(const [x,z,s] of [[-19,-9,1.2],[-19.5,9,1],[2,-14.6,1.5],[24,12,1.2],[-8,12.5,1],[26,-13.8,1.3],[-20,-1,1.1]])tree(x,z,s);
 // ---- Abrigo de vivência: tenda com bancos, mesa e sombra real ----
 const ax=6.5,az=1.2;
 for(const [dx,dz] of [[-3.2,-1.6],[3.2,-1.6],[-3.2,1.8],[3.2,1.8]])box(.12,2.8,.12,'#6b747a',ax+dx,1.4,az+dz,scene,.5);
 {const cv=document.createElement('canvas');cv.width=512;cv.height=256;const g=cv.getContext('2d');for(let i=0;i<8;i++){g.fillStyle=i%2?'#f3efe0':'#e57b2c';g.fillRect(i*64,0,64,256);}const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;
  const geo=new T.PlaneGeometry(6.9,4,14,8);const roof=new T.Mesh(geo,new T.MeshStandardMaterial({map:tx,roughness:.9,side:T.DoubleSide}));roof.rotation.x=-Math.PI/2;roof.position.set(ax,2.85,az);roof.castShadow=true;roof.receiveShadow=true;scene.add(roof);
  out.tent={roof,geo,base:Float32Array.from(geo.attributes.position.array),y:2.85};}
 box(S.tableAbrigo.w,.08,S.tableAbrigo.d,'#d8cfb7',S.tableAbrigo.x,.85,S.tableAbrigo.z);for(const dx of [-.8,.8])box(.08,.85,.6,'#5e666b',S.tableAbrigo.x+dx,.42,S.tableAbrigo.z);
 cyl(.17,.17,.45,'#3a8fcf',S.tableAbrigo.x-.4,1.12,S.tableAbrigo.z,scene,14);sign('PONTO DE APOIO\nNR 24',.9,.4,S.tableAbrigo.x+.4,1.15,S.tableAbrigo.z+.36,'#2f6f5a');
 for(const b of [S.benchA,S.benchB]){box(b.w,.08,b.d,'#9a7b52',b.x,.42,b.z);for(const dx of [-.8,.8])box(.08,.42,.4,'#5e666b',b.x+dx,.21,b.z);}
 sign('ABRIGO • SOMBRA E DESCANSO',3.6,.45,ax,3.15,az+2.05,'#2f6f5a','#fff');
 // ---- Ponto de água potável ----
 {const w=S.water;box(w.w,.9,w.d,'#6b747a',w.x,.45,w.z,scene,.4);for(const dx of [-.22,.22]){cyl(.2,.2,.5,'#6fb8ea',w.x+dx,1.15,w.z,scene,16);cyl(.08,.08,.08,'#f2f2ec',w.x+dx,1.43,w.z,scene,10);}cyl(.06,.06,.15,'#c9d1d4',w.x,.98,w.z+.34,scene,8);
  sign('ÁGUA POTÁVEL',1.3,.35,w.x,1.85,w.z+.05,'#1f5fa0');rod([w.x-.4,0,w.z-.3],[w.x-.4,1.75,w.z-.3],.03,'#7a858b');rod([w.x+.4,0,w.z-.3],[w.x+.4,1.75,w.z-.3],.03,'#7a858b');}
 // ---- Quadro de avisos (texto atualizado a cada etapa) ----
 {const b=S.board;rod([b.x-.9,0,b.z],[b.x-.9,2.5,b.z],.05,'#6b747a');rod([b.x+.9,0,b.z],[b.x+.9,2.5,b.z],.05,'#6b747a');
  const cv=document.createElement('canvas');cv.width=1024;cv.height=512;const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;
  const m=new T.Mesh(new T.PlaneGeometry(2.1,1.05),new T.MeshStandardMaterial({map:tex,roughness:.7,emissive:'#ffffff',emissiveMap:tex,emissiveIntensity:.35}));m.position.set(b.x,1.85,b.z+.17);scene.add(m);box(2.2,1.15,.08,'#3a4349',b.x,1.85,b.z+.1);
  out.board={draw(w){const g=cv.getContext('2d');g.fillStyle='#10303f';g.fillRect(0,0,1024,512);g.fillStyle='#f5c948';g.fillRect(0,0,1024,78);g.fillStyle='#10303f';g.font='bold 52px Arial';g.textAlign='left';g.fillText('QUADRO DE AVISOS • FRENTE DE TRABALHO',26,58);
   g.fillStyle='#ffffff';g.font='bold 60px Arial';g.fillText(w.clock+'   '+w.air+' °C',30,170);g.fillStyle=w.ibutg>26.6?'#ff8a6b':w.ibutg>23?'#ffd166':'#8ff0b8';g.fillText('IBUTG '+String(w.ibutg).replace('.',',')+' °C',30,250);
   g.fillStyle='#cfe3ee';g.font='38px Arial';g.fillText(w.dark>.4?'Tempestade com raios: siga o plano.':w.sunHeat>.6?'Calor forte: água, pausa e sombra.':'Previsão: calor forte e tempestade no fim do dia.',30,330);g.fillText('Plano de tempestade: abrigo fechado, máquinas desligadas.',30,390);g.fillText('Avise cedo se passar mal com o calor.',30,450);tex.needsUpdate=true;}};}
 // ---- Termômetro de globo (IBUTG) ----
 {const g=S.globe;for(const a of [0,2.1,4.2])rod([g.x,1.2,g.z],[g.x+Math.cos(a)*.35,0,g.z+Math.sin(a)*.35],.02,'#7a858b');sphere(.08,'#15181a',g.x,1.3,g.z);box(.3,.2,.12,'#2d3339',g.x+.3,1.1,g.z,scene,.3);box(.22,.1,.02,'#8ff0b8',g.x+.3,1.12,g.z+.07);sign('IBUTG',.5,.22,g.x,.45,g.z+.25,'#1f5360');}
 // ---- Bancada de EPI ----
 {const e=S.epi;box(e.w,.08,e.d,'#d8cfb7',e.x,.85,e.z);for(const dx of [-1,1])box(.08,.85,.7,'#5e666b',e.x+dx,.42,e.z);
  for(const dx of [-.9,-.45,0])cyl(.16,.2,.08,'#f2f2ec',e.x+dx,.94,e.z-.15,scene,14);for(const dx of [.45,.9])box(.22,.05,.1,'#23282c',e.x+dx,.92,e.z-.1);
  for(const dx of [-.6,.2])cyl(.07,.07,.2,'#f4f1e6',e.x+dx,1.02,e.z+.18,scene,10);box(.4,.06,.3,'#e8aa21',e.x+.8,.92,e.z+.2);sign('PROTEÇÃO CONTRA O SOL • EPI',2.2,.4,e.x,1.75,e.z-.1,'#8f5a10','#fff');rod([e.x-1.1,.8,e.z-.35],[e.x-1.1,1.9,e.z-.35],.03,'#7a858b');rod([e.x+1.1,.8,e.z-.35],[e.x+1.1,1.9,e.z-.35],.03,'#7a858b');}
 // ---- Prancheta de programação e roda de orientação ----
 {const p=S.prancheta;rod([p.x-.4,0,p.z],[p.x-.4,1.1,p.z],.03,'#6b747a');rod([p.x+.4,0,p.z],[p.x+.4,1.1,p.z],.03,'#6b747a');box(1.0,.6,.05,'#d8cfb7',p.x,1.3,p.z);sign('PROGRAMAÇÃO\nPESADO → MANHÃ',.9,.5,p.x,1.3,p.z+.04,'#2a4a5c');}
 {const ring=new T.Mesh(new T.RingGeometry(1.6,1.75,48),new T.MeshBasicMaterial({color:'#f5c948',side:T.DoubleSide,transparent:true,opacity:.7}));ring.rotation.x=-Math.PI/2;ring.position.set(-2,.04,3.6);scene.add(ring);sign('ORIENTAÇÃO DE INÍCIO DE TURNO',1.8,.3,-2,.04,3.6,'#2a4a5c','#fff').rotation.x=-Math.PI/2;}
 // ---- Container de apoio: abrigo seguro contra tempestade ----
 const cMat=new T.MeshStandardMaterial({map:TX.wall,normalMap:TX.wallN,normalScale:new T.Vector2(.8,.8),color:'#4f8f7a',roughness:.6,metalness:.3});
 for(const k of ['containerBack','containerLeft','containerRight','containerFrontL','containerFrontR']){const w=S[k];box(w.w,2.6,w.d,cMat,w.x,1.3,w.z);}
 box(6.3,.14,2.9,'#3f7a66',container.x,2.68,container.z,scene,.3);box(5.8,.05,2.5,'#9b7d57',container.x,.03,container.z);
 box(.14,2.6,.14,'#2f5f50',11.95,1.3,2.25);box(.14,2.6,.14,'#2f5f50',14.05,1.3,2.25);box(2.3,.14,.2,'#2f5f50',13,2.55,2.25);
 sign('ABRIGO SEGURO\nCONTAINER FECHADO',2.3,.75,13,2.95,2.32,'#1f5f4a','#fff');
 sign('PLANO DE TEMPESTADE:\nNÃO ENCOSTE NAS PAREDES',2.6,.42,13,.75,-.27,'#e8e2d0','#7a2b22');
 const interior=new T.PointLight('#ffe6b8',0,7,1.6);interior.position.set(13,2.3,.9);scene.add(interior);out.containerLight=interior;
 // ---- Alojamento (21.3) ----
 {const l=S.lodging;box(l.w,2.7,l.d,'#d9d2bf',l.x,1.35,l.z);box(l.w+.6,.16,l.d+.6,'#7d858b',l.x,2.78,l.z,scene,.3);
  box(1.0,2.1,.08,'#6a4f3a',14.1,1.05,l.z+l.d/2+.02);for(const x of [11.8,12.9,16.3,17.6])box(.9,.7,.06,'#7ea9c4',x,1.6,l.z+l.d/2+.03,scene,.5);
  sign('ALOJAMENTO',2.2,.5,15,3.25,l.z+l.d/2+.3,'#2a4a5c');box(.6,.75,.6,'#2f7a4d',11.3,.38,-8.7);sign('LIXO\nTAMPADO',.5,.3,11.3,.6,-8.39,'#2f7a4d');
  for(const x of [18.6])box(.4,.5,.5,'#c9d1d4',x,1.05,l.z+l.d/2+.3,scene,.5);}
 // ---- Moradia rural do caseiro (21.6 a 21.14) ----
 {const h=S.house;box(h.w,2.5,h.d,'#e8dcc4',h.x,1.25,h.z);
  for(const s of [-1,1]){const r=box(h.w+.8,.14,2.7,'#8a4b32',h.x,3.05,h.z+s*1.0);r.rotation.x=s*.52;}box(h.w,.1,h.d,'#b8ac94',h.x,2.5,h.z);
  box(.95,2.0,.08,'#6a4f3a',h.x,1.0,h.z+h.d/2+.02);for(const dx of [-1.5,1.5])box(.85,.8,.06,'#7ea9c4',h.x+dx,1.5,h.z+h.d/2+.03,scene,.5);box(1.6,.12,.6,'#9a8f80',h.x,.06,h.z+h.d/2+.3);
  sign('MORADIA • CASEIRO E FAMÍLIA',2.6,.4,h.x,3.0,h.z+h.d/2+.12,'#2a4a5c');box(.3,1.2,.3,'#8a8f94',h.x+1.4,3.4,h.z-.6);
  // roupa no varal
  rod([h.x-2.6,1.7,h.z+1],[h.x-2.6,1.7,h.z+2.8],.02,'#c9d1d4');for(let i=0;i<3;i++)box(.04,.4,.3,['#e57b2c','#f3efe0','#6fb8ea'][i],h.x-2.6,1.45,h.z+1.35+i*.5);}
 // ---- Poço (21.10), fossa (21.13) e sanitário (21.14) ----
 {const w=S.well;cyl(.62,.66,.75,'#9a8f80',w.x,.37,w.z,scene,20);cyl(.5,.5,.06,'#5e666b',w.x,.78,w.z,scene,20);rod([w.x-.6,.7,w.z],[w.x-.6,1.9,w.z],.05,'#6a4f3a');rod([w.x+.6,.7,w.z],[w.x+.6,1.9,w.z],.05,'#6a4f3a');box(1.6,.1,.9,'#8a4b32',w.x,2.0,w.z);
  sign('POÇO PROTEGIDO\nTAMPA E MURETA',1.4,.5,w.x,1.0,w.z+.74,'#1f5fa0');
  const c=S.cesspit;box(c.w,.14,c.d,'#9a9f9e',c.x,.08,c.z);cyl(.25,.25,.05,'#5e666b',c.x,.17,c.z,scene,12);rod([c.x+.6,.1,c.z-.5],[c.x+.6,1.8,c.z-.5],.04,'#7a858b');
  const dWell=Math.round(d2(c,w)),dHouse=Math.round(Math.hypot(c.x-S.house.x,c.z-(S.house.z+S.house.d/2)));
  sign(`FOSSA\n${dWell} m do poço • ${dHouse} m da casa`,2.4,.65,c.x,1.0,c.z+1.1,'#6a3a1f');
  sign('↓ JUSANTE\n(terreno desce)',1.5,.5,c.x-2.2,.04,c.z-1.6,'#6a3a1f','#fff').rotation.x=-Math.PI/2;
  const l=S.latrine;box(l.w,2.1,l.d,'#e8dcc4',l.x,1.05,l.z);box(l.w+.3,.1,l.d+.3,'#7d858b',l.x,2.15,l.z,scene,.3);box(.7,1.7,.06,'#6a4f3a',l.x,.85,l.z+l.d/2+.02);box(1.4,.3,.04,'#9fb5c2',l.x,1.95,l.z+l.d/2+.02);sign('SANITÁRIO',1.3,.3,l.x,2.45,l.z+l.d/2+.15,'#2a4a5c');}
 out.mats=mats;out.box=box;out.cyl=cyl;out.sphere=sphere;out.rod=rod;out.sign=sign;out.mat=mat;
 return out;
}
