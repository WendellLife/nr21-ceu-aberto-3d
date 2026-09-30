// Skeletal characters: a Mixamo-rigged base model (models/Xbot.glb) cloned per person, with motion-capture
// idle/walk/run blended by speed and procedural pose overlays for actions (carry, phone, cough, push, spray…).
// Any Mixamo-rigged GLB with clips named idle/walk/run can replace the base model without touching the game.
import * as T from './three.module.js';
import {GLTFLoader} from './addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton,retargetClip as skRetargetClip} from './addons/utils/SkeletonUtils.js';

export const CHARACTER_HEIGHT=1.8;
async function loadGLB(loader,url){
 if(url.startsWith('data:')){// Embedded model (single-file builds): decode in memory, no network request involved.
  const b=atob(url.slice(url.indexOf(',')+1));const bytes=new Uint8Array(b.length);for(let i=0;i<b.length;i++)bytes[i]=b.charCodeAt(i);
  return new Promise((res,rej)=>loader.parse(bytes.buffer,'',res,rej));}
 return loader.loadAsync(url);}
// Animation library (Mixamo clips) + realistic bodies (Mixamo-compatible skeletons). Clips are retargeted by bone name.
export async function loadCharacterBase(urls){
 const loader=new GLTFLoader();
 const [anim,male,female]=await Promise.all([loadGLB(loader,urls.anim),loadGLB(loader,urls.male),loadGLB(loader,urls.female)]);
 const base={clips:{},bodies:{male:male.scene,female:female.scene},scene:male.scene,retargeted:new Map()};
 for(const c of anim.animations)base.clips[c.name.toLowerCase()]=c;
 for(const [name,scene] of Object.entries(base.bodies)){const set={};for(const n of ['idle','walk','run']){if(base.clips[n])set[n]=retargetByDirection(base.clips[n],anim.scene,scene);}base.retargeted.set(name,set);}
 return base;
}
const stripPrefix=n=>n.replace(/^mixamorig:?/,'');
const RT_BONES=['Hips','Spine','Spine1','Spine2','Neck','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase','RightUpLeg','RightLeg','RightFoot','RightToeBase'];
const CHILD_OF={Hips:'Spine',Spine:'Spine1',Spine1:'Spine2',Spine2:'Neck',Neck:'Head',Head:'HeadTop_End',LeftShoulder:'LeftArm',LeftArm:'LeftForeArm',LeftForeArm:'LeftHand',LeftHand:'LeftHandMiddle1',RightShoulder:'RightArm',RightArm:'RightForeArm',RightForeArm:'RightHand',RightHand:'RightHandMiddle1',LeftUpLeg:'LeftLeg',LeftLeg:'LeftFoot',LeftFoot:'LeftToeBase',LeftToeBase:'LeftToe_End',RightUpLeg:'RightLeg',RightLeg:'RightFoot',RightFoot:'RightToeBase',RightToeBase:'RightToe_End'};
function boneMap(root){const m={};root.traverse(o=>{if(o.isBone)m[stripPrefix(o.name)]=o;});return m;}
// Direction-based retargeting: rigs may differ in rest pose (T/A) and in bone axis conventions, so each bone is
// aligned by the direction to its child in the rest pose, then driven by the source bone's world rotation each frame.
function retargetByDirection(clip,sourceRoot,targetRoot,fps=30){
 const S=boneMap(sourceRoot),Tb=boneMap(targetRoot);sourceRoot.updateMatrixWorld(true);targetRoot.updateMatrixWorld(true);
 const wq=b=>b.getWorldQuaternion(new T.Quaternion()),wp=b=>b.getWorldPosition(new T.Vector3());
 const dirOf=(map,n)=>{const b=map[n],c=map[CHILD_OF[n]];if(!b||!c)return null;return wp(c).sub(wp(b)).normalize();};
 const names=RT_BONES.filter(n=>S[n]&&Tb[n]);
 const restS={},restT={},align={};for(const n of names){restS[n]=wq(S[n]);restT[n]=wq(Tb[n]);const ds=dirOf(S,n),dt=dirOf(Tb,n);align[n]=(ds&&dt)?new T.Quaternion().setFromUnitVectors(dt,ds):new T.Quaternion();}
 const restLocalT={};for(const n of names)restLocalT[n]=Tb[n].quaternion.clone();
 const hipS=S.Hips,hipT=Tb.Hips;const hipRestS=wp(hipS),hipRestT=wp(hipT);const heightRatio=hipRestT.y/Math.max(1e-6,hipRestS.y);const hipParentInv=hipT.parent?hipT.parent.getWorldQuaternion(new T.Quaternion()).invert():new T.Quaternion();const hipRestLocalPos=hipT.position.clone();
 const mixer=new T.AnimationMixer(sourceRoot);const action=mixer.clipAction(clip);action.play();
 const frames=Math.max(2,Math.round(clip.duration*fps)+1),dt=clip.duration/(frames-1);
 const times=new Float32Array(frames),qv={},pv=new Float32Array(frames*3);for(const n of names)qv[n]=new Float32Array(frames*4);
 const q=new T.Quaternion(),pq=new T.Quaternion(),tmp=new T.Quaternion();
 for(let f=0;f<frames;f++){mixer.setTime(f*dt);sourceRoot.updateMatrixWorld(true);times[f]=f*dt;
  // Pose the target hierarchy in order so parent world rotations are current.
  for(const n of names){const b=Tb[n];const target=wq(S[n]).multiply(tmp.copy(restS[n]).invert()).multiply(align[n].clone().multiply(restT[n]));
   if(b.parent)b.parent.getWorldQuaternion(pq);else pq.identity();q.copy(pq).invert().multiply(target);b.quaternion.copy(q);b.updateMatrixWorld(true);
   qv[n].set([q.x,q.y,q.z,q.w],f*4);}
  const d=wp(hipS).sub(hipRestS).multiplyScalar(heightRatio).applyQuaternion(hipParentInv).add(hipRestLocalPos);pv.set([d.x,d.y,d.z],f*3);}
 // restore rest pose on the target template
 for(const n of names)Tb[n].quaternion.copy(restLocalT[n]);hipT.position.copy(hipRestLocalPos);targetRoot.updateMatrixWorld(true);mixer.stopAllAction();
 const tracks=names.map(n=>new T.QuaternionKeyframeTrack(Tb[n].name+'.quaternion',times,qv[n]));tracks.push(new T.VectorKeyframeTrack(hipT.name+'.position',times,pv));
 return new T.AnimationClip(clip.name,clip.duration,tracks);
}
const D=Math.PI/180;
// Pose overlays: per-bone Euler offsets (degrees, bone-local axes). Tuned visually on the Mixamo rig.
export const POSES={
 none:{},
 carry:{RightArm:[0,35,-10],RightForeArm:[0,75,0],LeftArm:[0,-45,15],LeftForeArm:[0,-60,0]},
 spray:{RightArm:[0,70,-10],RightForeArm:[0,30,0],LeftArm:[0,-75,10],LeftForeArm:[0,-40,0],Spine1:[8,0,0]},
 phone:{RightArm:[0,25,-15],RightForeArm:[0,135,0],Head:[0,0,10]},
 cough:{Spine1:[24,0,0],Head:[12,0,0],RightArm:[0,45,-10],RightForeArm:[0,120,0]},
 seated:{RightUpLeg:[-85,0,-6],LeftUpLeg:[-85,0,6],RightLeg:[85,0,0],LeftLeg:[85,0,0],Spine1:[6,0,0],RightArm:[0,25,-5],RightForeArm:[0,60,0],LeftArm:[0,-25,5],LeftForeArm:[0,-60,0]},
 wheel:{RightUpLeg:[-88,0,-6],LeftUpLeg:[-88,0,6],RightLeg:[88,0,0],LeftLeg:[88,0,0],Spine1:[4,0,0],RightArm:[0,20,-8],RightForeArm:[0,55,0],LeftArm:[0,-20,8],LeftForeArm:[0,-55,0]},
 type:{RightArm:[0,40,-10],RightForeArm:[0,60,0],LeftArm:[0,-40,10],LeftForeArm:[0,-60,0],Spine1:[8,0,0],Head:[10,0,0]},
 push:{RightArm:[0,60,-5],RightForeArm:[0,15,0],LeftArm:[0,-60,5],LeftForeArm:[0,-15,0],Spine1:[10,0,0]},
 reach:{RightArm:[0,80,-5],RightForeArm:[0,10,0],LeftArm:[0,-80,5],LeftForeArm:[0,-10,0],Spine1:[14,0,0]},
 wave:{RightArm:[0,30,-140],RightForeArm:[0,25,0]},
 repair:{Spine1:[26,0,0],Head:[10,0,0],RightArm:[0,55,-10],RightForeArm:[0,35,0],LeftArm:[0,-35,10],LeftForeArm:[0,-20,0]},
 inspect:{RightArm:[0,45,-10],RightForeArm:[0,70,0],LeftArm:[0,-45,10],LeftForeArm:[0,-70,0],Head:[16,0,0]},
 hose:{RightArm:[0,30,-20],RightForeArm:[0,45,0],LeftArm:[0,-15,20],LeftForeArm:[0,-15,0]},
 point:{RightArm:[0,85,0],RightForeArm:[0,5,0]},
 victim:{RightUpLeg:[-85,0,-6],LeftUpLeg:[-85,0,6],RightLeg:[85,0,0],LeftLeg:[85,0,0],Spine1:[24,0,0],Head:[12,0,0],RightArm:[0,45,-10],RightForeArm:[0,120,0],LeftArm:[0,-20,5],LeftForeArm:[0,-40,0]},
 pin:{RightArm:[0,30,-10],RightForeArm:[0,80,0],LeftArm:[0,-30,15],LeftForeArm:[0,-105,0],Spine1:[10,0,0],Head:[18,0,0]},
 aim:{RightArm:[0,55,-10],RightForeArm:[0,40,0],LeftArm:[0,-70,10],LeftForeArm:[0,-35,0],Spine1:[12,0,0],RightUpLeg:[-25,0,-4],LeftUpLeg:[-25,0,4],RightLeg:[40,0,0],LeftLeg:[40,0,0]},
 cones:{RightUpLeg:[-70,0,-8],LeftUpLeg:[-70,0,8],RightLeg:[100,0,0],LeftLeg:[100,0,0],Spine1:[30,0,0],RightArm:[0,70,-5],RightForeArm:[0,15,0],LeftArm:[0,-70,5],LeftForeArm:[0,-15,0]},
 crouch:{RightUpLeg:[-60,0,-8],LeftUpLeg:[-60,0,8],RightLeg:[95,0,0],LeftLeg:[95,0,0],Spine1:[18,0,0]}
};
// The pose table was authored on the mannequin rig; Mixamo-standard rigs (the realistic bodies) use other bone axes.
function convertPose(p){const o={};for(const b in p){const [x,y,z]=p[b];if(/^Right(Arm|ForeArm|Hand)$/.test(b))o[b]=[z,x,-y];else if(/^Left(Arm|ForeArm|Hand)$/.test(b))o[b]=[-z,x,-y];else if(/UpLeg|Leg$|Foot/.test(b))o[b]=[-x,y,-z];else o[b]=[x,y,z];}return o;}
const POSES_STD={};for(const k in POSES)POSES_STD[k]=convertPose(POSES[k]);
const BONES=['Hips','Spine','Spine1','Spine2','Neck','Head','RightArm','RightForeArm','RightHand','LeftArm','LeftForeArm','LeftHand','RightUpLeg','RightLeg','RightFoot','RightToeBase','LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase'];
const _q=new T.Quaternion(),_e=new T.Euler();
export function createCharacter(base,opts={}){
 const {body='male',surface='#4a5560',pants='#3a3f45',shoes=null,joints='#24292e',skin=null,tint='#ffffff',beard=false,cap=null,helmet='#e8aa21',helmetStripe=null,vest='#ed8b32',stripes='#e4e7d6',armband=null,gloves=null,boots='#2b2622',backLabel=null,glow=0,scale=1}=opts;
 const model=cloneSkeleton(base.bodies[body]||base.scene);model.scale.setScalar(scale);
 const bones={};model.traverse(o=>{if(o.isBone){const n=o.name.replace(/^mixamorig:?/,'');if(BONES.includes(n))bones[n]=o;}
  if(o.isSkinnedMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;const n=o.material.name||'';o.material=o.material.clone();const m=o.material;m.needsUpdate=true;
   if(/Joints/i.test(n)){m.color.set(skin||joints);}
   else if(/Skin|Wolf3D_Body|Eye|Teeth/i.test(n)){if(skin&&/Skin|Body/.test(n))m.color.set(skin);}
   else if(/Outfit_Top/i.test(n)){m.map=null;m.color.set(surface);m.roughness=.8;if(glow){m.emissive=new T.Color(surface);m.emissiveIntensity=glow;}}
   else if(/Outfit_Bottom/i.test(n)){m.map=null;m.color.set(pants);m.roughness=.85;}
   else if(/Footwear/i.test(n)){m.color.set(shoes||boots||'#2b2622');}
   else if(/Headwear/i.test(n)){o.visible=cap!==null?!!cap:!helmet;if(typeof cap==='string')m.color.set(cap);}
   else if(/Beard/i.test(n)){o.visible=beard;}
   else if(/Ch03|Beta_Surface|asdf/i.test(n)){m.color.set(tint);}
   else{m.color.set(surface);}
   m.roughness=Math.max(m.roughness??.7,.55);m.metalness=0;}});
 const group=new T.Group();group.add(model);
 // Equipment attached to bones: helmet, vest with reflective stripes, optional armband.
 const std=!!base.bodies[body];const bodyK=body==='female'?.82:1;const gear={};model.updateMatrixWorld(true);const _s=new T.Vector3();const bs=bones.Head?bones.Head.getWorldScale(_s).x/scale:1;const inv=1/bs;const gearScale=g=>{g.scale.setScalar(inv);};
 if(helmet&&bones.Head){const g=new T.Group();bones.Head.add(g);gearScale(g);const top=bones.Head.children.find(c=>/HeadTop/.test(c.name));if(top){g.position.copy(top.position).multiplyScalar(std?(body==='female'?.8:.55):.72);g.position.z+=(std?.01:.04)*bs;}else g.position.set(0,.16*bs,.03*bs);const shell=new T.Mesh(new T.SphereGeometry(.125*(body==='female'?.96:1.02),24,12,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({color:helmet,roughness:.35,metalness:.1}));shell.scale.set(1,.9,1.08);shell.castShadow=true;g.add(shell);const brim=new T.Mesh(new T.CylinderGeometry(.145,.145,.018,24),shell.material);brim.position.y=.004;g.add(brim);const peak=new T.Mesh(new T.BoxGeometry(.11,.012,.07),shell.material);peak.position.set(0,.004,.16);g.add(peak);if(helmetStripe){const st=new T.Mesh(new T.BoxGeometry(.04,.07,.2),new T.MeshStandardMaterial({color:helmetStripe,roughness:.3,emissive:helmetStripe,emissiveIntensity:.25}));st.position.set(0,.09,-.02);g.add(st);}gear.helmet=g;}
 if(vest&&bones.Spine1){const g=new T.Group();bones.Spine1.add(g);gearScale(g);g.position.set(0,(std?.03:.14)*bs,0);g.scale.multiplyScalar(bodyK);const v=new T.Mesh(new T.CylinderGeometry(.19,.205,.34,20,1,true),new T.MeshStandardMaterial({color:vest,roughness:.7,side:T.DoubleSide}));v.scale.z=.7;g.add(v);for(const y of [-.09,.07]){const s=new T.Mesh(new T.CylinderGeometry(.196,.2,.035,20,1,true),new T.MeshStandardMaterial({color:stripes,roughness:.3,emissive:stripes,emissiveIntensity:.15,side:T.DoubleSide}));s.scale.z=.7;s.position.y=y;g.add(s);}if(backLabel){const cv=document.createElement('canvas');cv.width=256;cv.height=96;const c=cv.getContext('2d');c.fillStyle=backLabel.bg||'#1d2427';c.fillRect(0,0,256,96);c.fillStyle=backLabel.fg||'#ffffff';c.font='bold 40px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(backLabel.text,128,50,236);const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;const lab=new T.Mesh(new T.PlaneGeometry(.24,.09),new T.MeshStandardMaterial({map:t,roughness:.6,emissiveMap:t,emissive:new T.Color('#ffffff'),emissiveIntensity:.12}));lab.position.set(0,-.01,-.145);lab.rotation.y=Math.PI;g.add(lab);}gear.vest=g;}
 // Gloves and boots: small shells on the hand and foot bones.
 for(const side of ['Right','Left']){const hand=bones[side+'Hand'];if(gloves&&hand){const gl=new T.Mesh(new T.CapsuleGeometry(.045,.07,4,10),new T.MeshStandardMaterial({color:gloves,roughness:.8}));gl.scale.setScalar(inv);gl.position.set(0,.07*bs,0);gl.castShadow=true;hand.add(gl);}
  const foot=bones[side+'Foot'];if(boots&&foot&&!/male|female/.test(body)){const toe=foot.children.find(c=>/ToeBase/.test(c.name));const b=new T.Mesh(new T.CapsuleGeometry(.055,.12,4,10),new T.MeshStandardMaterial({color:boots,roughness:.85}));b.scale.setScalar(inv);if(toe){b.position.copy(toe.position).multiplyScalar(.5);b.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),toe.position.clone().normalize());}b.castShadow=true;foot.add(b);}}
 if(armband&&bones.RightArm){const a=new T.Mesh(new T.CylinderGeometry(.062,.062,.07,16,1,true),new T.MeshStandardMaterial({color:armband,roughness:.6,side:T.DoubleSide}));a.scale.setScalar(inv);a.position.y=.13*bs;bones.RightArm.add(a);gear.armband=a;}
 // Animation: idle/walk/run blended by speed, in place (no root motion).
 const mixer=new T.AnimationMixer(model);const actions={};
 const clipSet=base.retargeted.get(base.bodies[body]?body:'male')||{};for(const n of ['idle','walk','run']){const c=clipSet[n];if(!c)continue;const a=mixer.clipAction(c);a.play();a.setEffectiveWeight(n==='idle'?1:0);actions[n]=a;}
 const st={pose:'none',poseW:0,prevPose:'none',speed:0,lean:0,time:Math.random()*3};
 const restQ={};
 const poseTable=base.bodies[body]?POSES_STD:POSES;
 function applyPose(name,weight){const p=poseTable[name];if(!p||weight<=0)return;for(const b in p){const bone=bones[b];if(!bone)continue;const [x,y,z]=p[b];_e.set(x*D*weight,y*D*weight,z*D*weight);_q.setFromEuler(_e);bone.quaternion.multiply(_q);}}
 const api={group,model,mixer,bones,gear,actions,state:st,
  setPose(name){if(name===st.pose)return;st.prevPose=st.pose;st.pose=name;st.poseW=0;},
  // speed in m/s; the walk/run clips are retimed to match the stride to the ground.
  update(dt,speed=0,extra={}){st.speed+=(speed-st.speed)*Math.min(1,dt*8);const s=st.speed;
   const wRun=T.MathUtils.clamp((s-2.6)/1.2,0,1),wWalk=T.MathUtils.clamp(s/.6,0,1)*(1-wRun),wIdle=1-Math.max(wWalk,wRun);
   if(actions.idle)actions.idle.setEffectiveWeight(wIdle);if(actions.walk){actions.walk.setEffectiveWeight(wWalk);actions.walk.setEffectiveTimeScale(T.MathUtils.clamp(s/1.5,.6,1.8));}if(actions.run){actions.run.setEffectiveWeight(wRun);actions.run.setEffectiveTimeScale(Math.max(.8,s/3.4));}
   mixer.update(dt);st.time+=dt;
   // Pose overlay with cross-fade from the previous pose.
   st.poseW=Math.min(1,st.poseW+dt*4);if(st.poseW<1)applyPose(st.prevPose,1-st.poseW);applyPose(st.pose,st.poseW);
   if(extra.bob&&(st.pose==='cough'||st.pose==='victim')){_e.set(Math.max(0,Math.sin(st.time*5))*.22,0,0);_q.setFromEuler(_e);bones.Spine1?.quaternion.multiply(_q);}
   if(extra.sweep){_e.set(0,extra.sweep,0);_q.setFromEuler(_e);bones.Spine1?.quaternion.multiply(_q);}
   if(extra.wave){_e.set(0,Math.sin(st.time*6)*.35,0);_q.setFromEuler(_e);bones.RightForeArm?.quaternion.multiply(_q);}
   if(extra.work){const k=Math.sin(st.time*(extra.work===2?7:3))*.18;_e.set(0,k,0);_q.setFromEuler(_e);bones.RightForeArm?.quaternion.multiply(_q);_e.set(0,-k,0);_q.setFromEuler(_e);bones.LeftForeArm?.quaternion.multiply(_q);}
   // Head turns toward a point of interest (world x/z), within a comfortable range.
   if(extra.lookAt&&bones.Head){const a=Math.atan2(extra.lookAt.x-group.position.x,extra.lookAt.z-group.position.z)-group.rotation.y;const rel=Math.atan2(Math.sin(a),Math.cos(a));const yaw=T.MathUtils.clamp(rel,-1.1,1.1)*.7;_e.set(0,yaw,0);_q.setFromEuler(_e);bones.Head.quaternion.multiply(_q);}
   // Seated poses drop the pelvis so the character sits at chair height.
   const DROP={seated:-.5,victim:-.5,wheel:-.42,crouch:-.25,aim:-.12,cones:-.32};const drop=DROP[st.pose]||0;model.position.y+=((drop*st.poseW+(DROP[st.prevPose]||0)*(1-st.poseW))-model.position.y)*Math.min(1,dt*6);
   // Lean into turns and acceleration for a more natural gait.
   const targetLean=extra.turn?T.MathUtils.clamp(-extra.turn*.35,-.12,.12):0;st.lean+=(targetLean-st.lean)*Math.min(1,dt*6);model.rotation.z=st.lean;}
 };
 api.setPose(opts.pose||'none');
 return api;
}
