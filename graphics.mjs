// Visual layer for the browser: quality presets, post-processing, procedural textures and particles.
// Everything is generated in code (no image downloads) and degrades gracefully on weaker devices.
import * as T from './three.module.js';
import {EffectComposer} from './addons/postprocessing/EffectComposer.js';
import {RenderPass} from './addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from './addons/postprocessing/UnrealBloomPass.js';
import {GTAOPass} from './addons/postprocessing/GTAOPass.js';
import {OutputPass} from './addons/postprocessing/OutputPass.js';
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
export function savedQuality(){try{const saved=localStorage.getItem('brigada-qualidade');if(saved==='auto'||QUALITY[saved])return saved;}catch{}return 'auto';}
export function defaultQuality(){return 'media';}
export function createRenderPipeline(renderer,scene,camera,sun){
 const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.3;
 let composer=null,bloom=null,ao=null,level=null;
 function build(){
  composer?.dispose?.();composer=null;bloom=null;ao=null;
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
  composer.addPass(new OutputPass());
 }
 const api={
  get level(){return level;},
  setLevel(l,persist=true){if(!QUALITY[l]||l===level)return;level=l;if(persist){try{localStorage.setItem('brigada-qualidade',l);}catch{}}build();},
  resize(){if(composer){composer.setSize(innerWidth,innerHeight);}renderer.setSize(innerWidth,innerHeight);},
  render(){if(composer)composer.render();else renderer.render(scene,camera);}
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
 return out;
}
// Round, soft-edged sprite textures for particles.
function radial(stops,size=128){const [c,g]=canvas(size);const gr=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);stops.forEach(([o,col])=>gr.addColorStop(o,col));g.fillStyle=gr;g.fillRect(0,0,size,size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
function cloud(size=128,seed=1){const [c,g]=canvas(size);const R=rand(seed);for(let i=0;i<22;i++){const x=size*(.25+R()*.5),y=size*(.25+R()*.5),r=size*(.12+R()*.2);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,size,size);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
export const particleTextures={
 flame:radial([[0,'rgba(255,255,235,1)'],[.25,'rgba(255,214,120,.95)'],[.55,'rgba(255,120,40,.55)'],[1,'rgba(255,60,10,0)']]),
 spark:radial([[0,'rgba(255,255,220,1)'],[.3,'rgba(255,190,90,.9)'],[1,'rgba(255,120,40,0)']],32),
 smoke:cloud(128,4),smoke2:cloud(128,9),
 water:radial([[0,'rgba(235,248,255,.95)'],[.5,'rgba(170,215,245,.5)'],[1,'rgba(150,200,240,0)']],64),
 glow:radial([[0,'rgba(255,255,255,1)'],[.4,'rgba(255,255,255,.35)'],[1,'rgba(255,255,255,0)']],64)
};
// Fire emitter: glowing flame sprites + sparks, keeps the {parts,light} shape the game expects.
export function createFire(scene,x,y,z,count,size){
 const parts=[],sparks=[];
 for(let i=0;i<count;i++){const m=new T.Sprite(new T.SpriteMaterial({map:particleTextures.flame,color:new T.Color(1.6,1.25,.9),transparent:true,depthWrite:false,blending:T.AdditiveBlending}));m.userData={phase:Math.random(),x:(Math.random()-.5)*.6,z:(Math.random()-.5)*.6,size:size*(2.6+Math.random()*1.6),spin:(Math.random()-.5)*2};scene.add(m);parts.push(m);}
 for(let i=0;i<Math.ceil(count*.6);i++){const m=new T.Sprite(new T.SpriteMaterial({map:particleTextures.spark,color:new T.Color(2,1.3,.6),transparent:true,depthWrite:false,blending:T.AdditiveBlending}));m.userData={phase:Math.random(),x:(Math.random()-.5)*.5,z:(Math.random()-.5)*.5,drift:(Math.random()-.5)*.6};scene.add(m);sparks.push(m);}
 const core=new T.Sprite(new T.SpriteMaterial({map:particleTextures.glow,color:new T.Color(1.4,.7,.25),transparent:true,depthWrite:false,blending:T.AdditiveBlending}));scene.add(core);
 const light=new T.PointLight('#ff8a2b',0,8,1.6);light.position.set(x,y+.8,z);scene.add(light);
 return {x,y,z,parts,sparks,core,light};
}
export function animateFireFx(f,on,scale,time){
 f.parts.forEach((m,i)=>{m.visible=on;if(!on)return;const u=m.userData,p=(time*1.25+u.phase)%1;const w=Math.sin(time*7+i)*.06*scale;m.position.set(f.x+u.x*scale*(1-p*.6)+w,f.y+p*1.15*scale,f.z+u.z*scale*(1-p*.6));const s=u.size*scale*(1-p*.65);m.scale.set(s*.8,s*1.25,1);m.material.rotation=u.spin*p;m.material.opacity=Math.min(1,(1-p)*1.4);m.material.color.setRGB(1.6,1.1-p*.5,.8-p*.7);});
 f.sparks.forEach((m,i)=>{m.visible=on;if(!on)return;const u=m.userData,p=(time*.8+u.phase)%1;m.position.set(f.x+u.x*scale+u.drift*p,f.y+.2+p*2.6*scale,f.z+u.z*scale+Math.sin(time*3+i)*.1*p);m.scale.setScalar(.07*(1-p)+.02);m.material.opacity=(1-p);});
 f.core.visible=on;if(on){f.core.position.set(f.x,f.y+.35*scale,f.z);f.core.scale.setScalar((1.6+Math.sin(time*9)*.12)*scale);f.core.material.opacity=.55;}
 f.light.intensity=on?(5+Math.sin(time*13)*1.2+Math.sin(time*7.3))*scale:0;
}
export function makeSmokeSprite(dark=true,seed=0){const m=new T.Sprite(new T.SpriteMaterial({map:seed%2?particleTextures.smoke:particleTextures.smoke2,color:dark?'#3c4246':'#c9d0d4',transparent:true,depthWrite:false,opacity:.3}));m.userData.spin=(Math.random()-.5)*.6;return m;}
export function makeSpraySprite(){return new T.Sprite(new T.SpriteMaterial({map:particleTextures.water,color:'#eefbff',transparent:true,depthWrite:false,opacity:.8}));}
// Emissive glow used for lamps, beacons and emergency lights (picked up by bloom).
export function glowSprite(color,size){const m=new T.Sprite(new T.SpriteMaterial({map:particleTextures.glow,color,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));m.scale.setScalar(size);return m;}
