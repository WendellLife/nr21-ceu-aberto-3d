// Visual layer for the browser: quality presets, post-processing, procedural textures and particles.
// Everything is generated in code (no image downloads) and degrades gracefully on weaker devices.
import * as T from './three.module.js';
import {EffectComposer} from './addons/postprocessing/EffectComposer.js';
import {RenderPass} from './addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from './addons/postprocessing/UnrealBloomPass.js';
import {GTAOPass} from './addons/postprocessing/GTAOPass.js';
import {OutputPass} from './addons/postprocessing/OutputPass.js';
import {ShaderPass} from './addons/postprocessing/ShaderPass.js';
import {RoomEnvironment} from './addons/environments/RoomEnvironment.js';

// ---------- Quality presets ----------
export const QUALITY = {
 baixa:{label:'Baixa',pixelRatio:1,shadows:false,shadowSize:512,bloom:false,ao:false,soft:false},
 media:{label:'Média',pixelRatio:1.5,shadows:true,shadowSize:1024,bloom:true,ao:false,soft:false},
 alta:{label:'Alta',pixelRatio:2,shadows:true,shadowSize:2048,bloom:true,ao:false,soft:true}
};
// Hardware profile: GPU name, cores, memory, screen and input type give a starting level;
// the runtime FPS monitor in the game then moves it up or down while the setting is "Auto".
export function detectHardware(renderer){
 const gl=renderer.getContext();let gpu='';try{const ext=gl.getExtension('WEBGL_debug_renderer_info');gpu=ext?String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)):'';}catch{}
 const mobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||(matchMedia('(pointer:coarse)').matches&&innerWidth<1100);
 const cores=navigator.hardwareConcurrency||4,mem=navigator.deviceMemory||4,pixels=innerWidth*innerHeight*Math.min(devicePixelRatio,3);
 const g=gpu.toLowerCase();let score=2;
 if(/swiftshader|llvmpipe|software|basic render/.test(g))score=0;
 else if(/nvidia|geforce|rtx|gtx|radeon rx|radeon pro|arc a|apple m\d/.test(g))score=3;
 else if(/intel.*(iris|uhd 7|arc)|apple gpu|adreno 7|mali-g7\d\d|mali-g8|immortalis/.test(g))score=2;
 else if(/intel|adreno 6|mali-g5|mali-g6|mali-t|powervr|videocore/.test(g))score=1;
 if(mobile)score=Math.min(score,2);if(cores<=2||mem<=2)score=Math.min(score,1);if(pixels>4.5e6&&score>2)score=2;
 const level=score>=3?'alta':score===2?'media':'baixa';
 return {gpu,mobile,cores,mem,score,level};
}
export function savedQuality(){try{const saved=localStorage.getItem('nr21-qualidade');if(saved==='auto'||QUALITY[saved])return saved;}catch{}return 'auto';}
export function defaultQuality(){return 'media';}
export function createRenderPipeline(renderer,scene,camera,sun){
 const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.3;
 let composer=null,bloom=null,ao=null,level=null,heatPass=null,heat=0;
 // Ondulação do ar quente: deslocamento senoidal das linhas da imagem, mais forte perto do chão (parte de baixo da tela).
 const HeatShader={uniforms:{tDiffuse:{value:null},time:{value:0},amount:{value:0}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform sampler2D tDiffuse;uniform float time;uniform float amount;varying vec2 vUv;void main(){float band=smoothstep(.95,.15,vUv.y);float w=sin(vUv.y*95.+time*2.6)*.6+sin(vUv.y*41.-time*1.7+vUv.x*9.)*.4;vec2 uv=vUv+vec2(w*.0022*amount*band,0.);gl_FragColor=texture2D(tDiffuse,uv);}'};
 function build(){
  composer?.dispose?.();composer=null;bloom=null;ao=null;heatPass=null;
  const q={...QUALITY[level],level};
  renderer.setPixelRatio(Math.min(devicePixelRatio,q.pixelRatio));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=q.shadows;sun.castShadow=q.shadows;renderer.shadowMap.type=T.PCFSoftShadowMap;sun.shadow.radius=q.soft?5:3;
  if(sun.shadow.mapSize.x!==q.shadowSize){sun.shadow.mapSize.set(q.shadowSize,q.shadowSize);sun.shadow.map?.dispose();sun.shadow.map=null;}
  scene.traverse(m=>{if(m.material){const list=Array.isArray(m.material)?m.material:[m.material];list.forEach(x=>x.needsUpdate=true);}});
  if(!q.bloom&&!q.ao)return;
  composer=new EffectComposer(renderer,new T.WebGLRenderTarget(innerWidth,innerHeight,{type:T.HalfFloatType,samples:q.level==='alta'?4:2}));composer.setPixelRatio(Math.min(devicePixelRatio,q.pixelRatio));composer.setSize(innerWidth,innerHeight);
  composer.addPass(new RenderPass(scene,camera));
  if(q.ao){ao=new GTAOPass(scene,camera,innerWidth,innerHeight);ao.output=GTAOPass.OUTPUT.Default;ao.blendIntensity=.85;ao.updateGtaoMaterial({radius:.45,distanceExponent:1.4,thickness:1.2,scale:1,samples:12});ao.updatePdMaterial({lumaPhi:10,depthPhi:2,normalPhi:3,radius:6,rings:2,samples:12});composer.addPass(ao);}
  if(q.bloom){bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.16,.25,1.6);composer.addPass(bloom);}
  heatPass=new ShaderPass(HeatShader);heatPass.uniforms.amount.value=heat;composer.addPass(heatPass);
  composer.addPass(new OutputPass());
 }
 const api={
  get level(){return level;},
  setLevel(l,persist=true){if(!QUALITY[l]||l===level)return;level=l;if(persist){try{localStorage.setItem('nr21-qualidade',l);}catch{}}build();},
  resize(){if(composer){composer.setSize(innerWidth,innerHeight);}renderer.setSize(innerWidth,innerHeight);},
  // 0 a 1. Só existe nos níveis Média e Alta (pós-processamento); no nível Baixa o jogo usa o brilho do sol em CSS.
  setHeat(v){heat=v;if(heatPass)heatPass.uniforms.amount.value=v;},
  get hasHeatPass(){return !!heatPass;},
  render(time=0){if(heatPass)heatPass.uniforms.time.value=time;if(composer)composer.render();else renderer.render(scene,camera);}
 };
 return api;
}

// ---------- Procedural textures ----------
function canvas(w,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];}
function rand(seed){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
function tex(c,rx=1,ry=1,srgb=true){const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=4;if(srgb)t.colorSpace=T.SRGBColorSpace;return t;}
function speckle(g,w,h,n,alpha,r,seed){const R=rand(seed);for(let i=0;i<n;i++){const v=Math.floor(R()*255);g.fillStyle=`rgba(${v},${v},${v},${alpha*R()})`;g.fillRect(R()*w,R()*h,r*R()+1,r*R()+1);}}
// Normal map derived from a texture's brightness (Sobel), so flat surfaces catch the light like real relief.
function normalFrom(srcCanvas,strength=2.2){const w=srcCanvas.width,h=srcCanvas.height;const g=srcCanvas.getContext('2d');const d=g.getImageData(0,0,w,h).data;const [c,o]=canvas(w,h);const out=o.createImageData(w,h);const L=(x,y)=>{x=(x+w)%w;y=(y+h)%h;const i=(y*w+x)*4;return (d[i]*.299+d[i+1]*.587+d[i+2]*.114)/255;};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(L(x+1,y-1)+2*L(x+1,y)+L(x+1,y+1))-(L(x-1,y-1)+2*L(x-1,y)+L(x-1,y+1));const dy=(L(x-1,y+1)+2*L(x,y+1)+L(x+1,y+1))-(L(x-1,y-1)+2*L(x,y-1)+L(x+1,y-1));let nx=-dx*strength,ny=-dy*strength,nz=1;const len=Math.hypot(nx,ny,nz);nx/=len;ny/=len;nz/=len;const i=(y*w+x)*4;out.data[i]=(nx*.5+.5)*255;out.data[i+1]=(ny*.5+.5)*255;out.data[i+2]=(nz*.5+.5)*255;out.data[i+3]=255;}
 o.putImageData(out,0,0);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
export function makeTextures(){
 const out={};
 // Polished concrete slab with saw-cut joints and faint wear.
 {const [c,g]=canvas(512);g.fillStyle='#b9bebb';g.fillRect(0,0,512,512);speckle(g,512,512,9000,.18,2,7);const R=rand(3);for(let i=0;i<14;i++){const x=R()*512,y=R()*512,r=30+R()*90;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(90,96,98,.10)');gr.addColorStop(1,'rgba(90,96,98,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}g.strokeStyle='rgba(70,76,78,.55)';g.lineWidth=2;for(let i=0;i<=512;i+=256){g.beginPath();g.moveTo(i,0);g.lineTo(i,512);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(512,i);g.stroke();}out.concrete=tex(c,9,6);out.concreteN=normalFrom(c,1.6);out.concreteN.repeat.copy(out.concrete.repeat);}
 // Corrugated metal wall cladding.
 {const [c,g]=canvas(256);const gr=g.createLinearGradient(0,0,32,0);gr.addColorStop(0,'#c2c6c2');gr.addColorStop(.5,'#9ea3a0');gr.addColorStop(1,'#c2c6c2');g.fillStyle=gr;for(let x=0;x<256;x+=32){g.save();g.translate(x,0);g.fillRect(0,0,32,256);g.restore();}speckle(g,256,256,1600,.1,2,11);g.fillStyle='rgba(60,64,62,.35)';g.fillRect(0,126,256,3);out.wall=tex(c,3,1);out.wallN=normalFrom(c,3);out.wallN.repeat.copy(out.wall.repeat);}
 // Brushed / painted steel.
 {const [c,g]=canvas(256);g.fillStyle='#8f989c';g.fillRect(0,0,256,256);const R=rand(5);for(let i=0;i<500;i++){const y=R()*256;g.strokeStyle=`rgba(${R()<.5?255:30},${R()<.5?255:30},${R()<.5?255:30},.05)`;g.beginPath();g.moveTo(0,y);g.lineTo(256,y+R()*4-2);g.stroke();}out.metal=tex(c,1,1);}
 // Cardboard with packing tape.
 {const [c,g]=canvas(256);g.fillStyle='#c19a63';g.fillRect(0,0,256,256);speckle(g,256,256,2500,.12,2,19);g.fillStyle='rgba(120,86,44,.25)';for(let y=0;y<256;y+=6)g.fillRect(0,y,256,1);g.fillStyle='rgba(222,196,140,.85)';g.fillRect(108,0,40,256);g.fillStyle='rgba(60,40,20,.55)';g.font='bold 22px Arial';g.fillText('▲▲',20,60);g.fillText('FRÁGIL',150,220);out.cardboard=tex(c,1,1);out.cardboardN=normalFrom(c,1.4);}
 // Grass and asphalt for the surroundings.
 {const [c,g]=canvas(256);g.fillStyle='#5f7f4c';g.fillRect(0,0,256,256);const R=rand(23);for(let i=0;i<5000;i++){const v=R();g.fillStyle=v<.5?`rgba(40,70,30,${.3*R()})`:`rgba(150,190,110,${.25*R()})`;g.fillRect(R()*256,R()*256,1,2+R()*3);}out.grass=tex(c,40,40);}
 {const [c,g]=canvas(256);g.fillStyle='#3f4549';g.fillRect(0,0,256,256);speckle(g,256,256,7000,.22,2,31);out.asphalt=tex(c,2,14);out.asphaltN=normalFrom(c,1.2);out.asphaltN.repeat.copy(out.asphalt.repeat);}
 // Terra batida do canteiro, com pedrisco e marcas de pneu; e asfalto novo (base recém-compactada).
 {const [c,g]=canvas(256);g.fillStyle='#a8957a';g.fillRect(0,0,256,256);const R=rand(41);for(let i=0;i<60;i++){const x=R()*256,y=R()*256,r=16+R()*40;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,R()<.5?'rgba(120,90,55,.22)':'rgba(214,186,140,.2)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}speckle(g,256,256,4500,.3,2,43);out.dirt=tex(c,22,14);out.dirtN=normalFrom(c,1.8);out.dirtN.repeat.copy(out.dirt.repeat);}
 {const [c,g]=canvas(256);g.fillStyle='#23272a';g.fillRect(0,0,256,256);speckle(g,256,256,9000,.3,2,57);out.freshAsphalt=tex(c,4,3);out.freshAsphaltN=normalFrom(c,1.6);out.freshAsphaltN.repeat.copy(out.freshAsphalt.repeat);}
 return out;
}
// ---------- Partículas e clima ----------
function radial(stops,size=128){const [c,g]=canvas(size);const gr=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);stops.forEach(([o,col])=>gr.addColorStop(o,col));g.fillStyle=gr;g.fillRect(0,0,size,size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
export const particleTextures={
 glow:radial([[0,'rgba(255,255,255,1)'],[.4,'rgba(255,255,255,.35)'],[1,'rgba(255,255,255,0)']],64),
 drop:radial([[0,'rgba(230,245,255,.95)'],[.55,'rgba(190,225,250,.55)'],[1,'rgba(170,210,245,0)']],32),
 puff:radial([[0,'rgba(255,255,255,.55)'],[.6,'rgba(255,255,255,.18)'],[1,'rgba(255,255,255,0)']],64)
};
// Brilho emissivo para lâmpadas e sinalização (capturado pelo bloom).
export function glowSprite(color,size){const m=new T.Sprite(new T.SpriteMaterial({map:particleTextures.glow,color,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));m.scale.setScalar(size);return m;}
// Gotas de suor que escorrem da cabeça e do tronco de quem está cansado pelo calor.
export function makeSweat(parent,count=4){
 const drops=[];for(let i=0;i<count;i++){const m=new T.Sprite(new T.SpriteMaterial({map:particleTextures.drop,color:'#d9f1ff',transparent:true,depthWrite:false,opacity:0}));m.scale.setScalar(.06);m.userData={phase:i/count,dx:(i%2?1:-1)*(.05+Math.random()*.05)};parent.add(m);drops.push(m);}
 return {drops,update(time,level,top=1.75){drops.forEach((m,i)=>{const p=(time*(.45+level*.5)+m.userData.phase)%1;m.position.set(m.userData.dx,top-p*.55,.08);m.material.opacity=level>0?Math.min(1,level*1.4)*(1-p)*.9:0;m.scale.setScalar(.045+level*.03);});}};
}
// Chuva: riscos finos que caem inclinados pelo vento, em uma caixa que acompanha a câmera.
export function createRain(scene,count=2600){
 const pos=new Float32Array(count*6),seed=new Float32Array(count*3);
 for(let i=0;i<count;i++){seed[i*3]=Math.random();seed[i*3+1]=Math.random();seed[i*3+2]=Math.random();}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));
 const mat=new T.LineBasicMaterial({color:'#cfe2f2',transparent:true,opacity:.0,depthWrite:false});
 const lines=new T.LineSegments(geo,mat);lines.frustumCulled=false;lines.visible=false;scene.add(lines);
 return {lines,geo,pos,seed,count,t:0};
}
export function updateRain(r,dt,intensity,wind,center){
 r.lines.visible=intensity>.02;if(!r.lines.visible)return;
 r.t+=dt;const n=Math.floor(r.count*Math.min(1,intensity)),W=38,D=34,H=22,fall=26;
 r.geo.setDrawRange(0,n*2);r.lines.material.opacity=.15+.3*intensity;
 const lean=wind*5.5;
 for(let i=0;i<n;i++){
  const sx=r.seed[i*3],sy=r.seed[i*3+1],sz=r.seed[i*3+2];
  const y=H-((sy*H+r.t*(fall*(.85+sz*.3)))%H);
  const x=center.x+(sx-.5)*W+lean*(H-y)/fall;
  const z=center.z+(sz-.5)*D;
  const o=i*6;r.pos[o]=x;r.pos[o+1]=y;r.pos[o+2]=z;r.pos[o+3]=x-lean*.045;r.pos[o+4]=y+.55;r.pos[o+5]=z;
 }
 r.geo.attributes.position.needsUpdate=true;
}
// Relâmpago: traço irregular do céu ao solo, visível por instantes.
export function createBolt(scene){
 const pts=[];for(let i=0;i<14;i++)pts.push(new T.Vector3());
 const geo=new T.BufferGeometry().setFromPoints(pts);
 const line=new T.Line(geo,new T.LineBasicMaterial({color:new T.Color(2.4,2.4,3),transparent:true,opacity:0,toneMapped:false,depthWrite:false}));line.frustumCulled=false;scene.add(line);
 return {line,geo,t:0,on:0};
}
export function strikeBolt(b,x,z){
 const p=b.geo.attributes.position;let cx=x,cz=z;
 for(let i=0;i<14;i++){const k=i/13;const y=40*(1-k);cx+=(Math.random()-.5)*(i?2.6:0);cz+=(Math.random()-.5)*(i?1.6:0);p.setXYZ(i,cx,y,cz);}
 p.needsUpdate=true;b.on=.28;
}
export function updateBolt(b,dt){
 if(b.on>0){b.on-=dt;b.line.material.opacity=b.on>.16?1:b.on>.1?.15:b.on>.05?.85:.4*Math.max(0,b.on/.05);}else b.line.material.opacity=0;
}
