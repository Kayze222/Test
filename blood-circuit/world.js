import * as T from './vendor/three.module.min.js';
import {CombatFX,starGeometry} from './combat-fx.js';
import {RetroRenderer} from './retro-renderer.js';
import {surface} from './arena-textures.js';
import {sourcedModel} from './sourced-models.js';
export {T};
const geometries={box:new T.BoxGeometry(1,1,1),sphere:new T.IcosahedronGeometry(1,0),oct:new T.OctahedronGeometry(1),cyl:new T.CylinderGeometry(1,1,1,8),cone:new T.ConeGeometry(1,1,5),ring:new T.TorusGeometry(1,.025,4,64),plane:new T.PlaneGeometry(1,1)};
const mats=new Map();
function mat(color,glow=false){const k=color+':'+glow;if(!mats.has(k))mats.set(k,glow?new T.MeshBasicMaterial({color}):new T.MeshLambertMaterial({color,flatShading:true}));return mats.get(k)}
export function mesh(shape,color,x=0,y=0,z=0,sx=1,sy=1,sz=1,glow=false){const m=new T.Mesh(geometries[shape],mat(color,glow));m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m}
export class World{
 constructor(container){
 this.renderer=new T.WebGLRenderer({antialias:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(1);this.renderer.setSize(innerWidth,innerHeight);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.setClearColor(0x150b0e);container.appendChild(this.renderer.domElement);this.canvas=this.renderer.domElement;
 this.scene=new T.Scene();this.scene.fog=new T.Fog(0x100d13,21,121);this.camera=new T.PerspectiveCamera(88,innerWidth/innerHeight,.06,210);this.camera.rotation.order='YXZ';this.scene.add(this.camera);
 this.scene.add(new T.HemisphereLight(0x8595a9,0x19070b,1.05));const dl=new T.DirectionalLight(0xc7d4cb,1.55);dl.position.set(5,20,10);this.scene.add(dl);const dl2=new T.DirectionalLight(0xa80e2e,1.85);dl2.position.set(-15,8,-20);this.scene.add(dl2);
 this.post=new RetroRenderer(this.renderer);this.viewScene=new T.Scene();this.viewCamera=new T.PerspectiveCamera(65,innerWidth/innerHeight,.02,8);this.viewScene.add(this.viewCamera);this.viewScene.add(new T.HemisphereLight(0xc5d7ff,0x281324,2.5));const weaponLight=new T.DirectionalLight(0xffe4c6,2.7);weaponLight.position.set(-1,2,2);this.viewScene.add(weaponLight);this.muzzleLight=new T.PointLight(0xffd579,0,4,2);this.viewScene.add(this.muzzleLight);this.effects=new CombatFX(this.scene,this.camera);this.reduced=false;this.muzzleTime=0;this.swapTime=0;this.activeWeapon=0;this.time=0;
 this.limit=51.6;this.flickerLights=[];this.watchers=[];this.colliders=[];this.ramps=[];this.pads=[{x:-19,z:9},{x:19,z:-9},{x:-39,z:-25},{x:39,z:25}];this.chests=[];this.fx=[];this.decals=[];this.buildArena();this.buildWeapons();
 window.addEventListener('resize',()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.viewCamera.aspect=innerWidth/innerHeight;this.viewCamera.updateProjectionMatrix();this.post.resize(innerWidth,innerHeight)})
 }
 add(shape,color,x,y,z,sx,sy,sz,glow=false,parent=this.scene){const m=mesh(shape,color,x,y,z,sx,sy,sz,glow);parent.add(m);return m}
 box(x,y,z,w,h,d,color=0x30272b,solid=false){const m=this.add('box',color,x,y,z,w,h,d);if(solid)this.colliders.push({x,z,w,d,h:y+h/2});return m}
 buildArena(){
 this.box(0,-.5,0,106,1,106,0x292529).material=surface('floor',26,26);this.box(0,-1.5,0,146,1,146,0x381019);
 for(let i=-52;i<=52;i+=4){this.box(i,.006,0,.025,.012,104,0x554347);this.box(0,.006,i,104,.012,.025,0x554347)}
 for(const z of [-53,53]){this.box(0,3,z,106,6,1.5,0x31262a).material=surface('wall',27,2);this.add('box',0xf14635,0,1.2,z-Math.sign(z)*.79,104,.06,.03,true);for(let x=-51;x<=51;x+=6){this.box(x,8,z,1.2,16,2.5,0x352f34);this.box(x,16,z,2,1,3,0x261e22);this.add('box',0x9f262a,x,6,z-Math.sign(z)*1.3,.13,9,.04,true)}}
 for(const x of [-53,53]){this.box(x,3,0,1.5,6,106,0x31262a).material=surface('wall',27,2);this.add('box',0xf14635,x-Math.sign(x)*.79,1.2,0,.03,.06,104,true);for(let z=-51;z<=51;z+=6){this.box(x,8,z,2.5,16,1.2,0x352f34);this.box(x,16,z,3,1,2,0x261e22)}}
 // Ribbed cathedral roof framing against the open sky.
 for(let z=-47;z<=47;z+=15.5){for(const s of [-1,1]){const rib=this.box(s*25.5,21.5,z,55,.55,.7,0x423039);rib.rotation.z=-s*.28}}
 // Raised blocks and pillars create readable cover and a vertical route.
 for(const x of [-11,11])for(const z of [-11,11]){this.box(x,2.3,z,2.2,4.6,2.2,0x463a3d,true).material=surface('metal',1,2);this.box(x,.2,z,3,.4,3,0x352a2d);this.box(x,4.7,z,3,.3,3,0x231b20);for(const s of [-1,1])this.add('box',0xe84c37,x+s*1.115,2.3,z,.03,3.8,.18,true);this.add('oct',0xe24631,x,5.6,z,.55,.9,.55,true)}
 this.box(-17,.65,-3,6,1.3,7,0x3c3536,true).material=surface('metal',3,3);this.box(17,.65,3,6,1.3,7,0x3c3536,true).material=surface('metal',3,3);for(const [x,z] of [[-17,-3],[17,3]])this.box(x,.9,z+3.51,6,.28,.02,0xbba85a).material=surface('hazard',6,1);
 for(const [x,z] of [[-17,-3],[17,3]])for(const s of [-1,1])this.add('box',0xcfad59,x,1.32,z+s*3.2,5.8,.03,.07,true);
 // Lava channels sit outside the playable floor.
 for(const s of [-1,1]){this.add('box',0xd62a20,s*58,-.9,0,5,.1,130,true);this.add('box',0xa11f1c,0,-.9,s*58,116,.1,5,true)}
 const seal=new T.Group();this.scene.add(seal);seal.position.set(0,.025,0);for(const size of [6.3,7,7.3]){let r=mesh('ring',0x7f3431,0,0,0,size,size,size,true);r.rotation.x=-Math.PI/2;seal.add(r)}for(let i=0;i<12;i++){const a=i*Math.PI/6;let m=mesh('box',0xb14433,Math.sin(a)*7,.02,Math.cos(a)*7,.12,.03,.55,true);m.rotation.y=a;seal.add(m)}
 // Suspended reactor, an arena landmark rather than an obstruction.
 this.reactor=new T.Group();this.reactor.position.set(0,12,0);this.scene.add(this.reactor);this.add('oct',0x3b272c,0,0,0,2,3.5,2,false,this.reactor);this.add('oct',0xff4c37,0,0,0,1,2.4,1,true,this.reactor);
 for(let i=0;i<3;i++){const r=mesh('ring',i===1?0xf54e38:0x883229,0,0,0,3.7+i*.5,3.7+i*.5,3.7+i*.5,true);r.rotation.set(Math.PI/3+i*.6,.4+i,0);this.reactor.add(r)}
 for(const x of [-4.4,4.4]){this.box(x,7.5,-52,1.2,15,2.5,0x55424a);this.add('box',0xe74432,x,7.5,-50.7,.13,13,.05,true)}this.box(0,14,-52,9,1.5,2.5,0x55424a);this.box(0,6.5,-52.1,7.8,13,.2,0x170f17);
 for(let i=0;i<6;i++)this.add('box',0x952622,-3.3+i*1.32,6.5,-51.9,.08,12,.05,true);
 this.sign('BLOOD//CIRCUIT',0,11.5,-50.6,9,1);
 for(const p of this.pads){const base=this.add('cyl',0x393d35,p.x,.06,p.z,2,.1,2);this.add('cyl',0xc1bd44,p.x,.12,p.z,1.55,.03,1.55,true);for(const radius of [1.7,2.1]){let r=this.add('ring',0xe5ff57,p.x,.15,p.z,radius,radius,radius,true);r.rotation.x=-Math.PI/2}this.add('cone',0xdce85c,p.x,.25,p.z,.4,.45,.4,true)}
 this.makeChest(0,17);this.makeChest(-19,-18);this.makeChest(19,18);this.makeChest(-40,37);this.makeChest(40,-37);this.makeChest(0,-41);this.makeChest(35,35);
 // Monumental back-wall silhouette and vertical light slots.
 for(const side of [-1,1]){for(let k=0;k<4;k++){const x=side*(7+k*3.5);this.box(x,7.8,-52.2,2.3,8,.3,0x080d1b);this.add('box',0xff3045,x,8,-51.95,.16,6,.04,true);const brace=this.box(x,12,-52,2.8,.22,.55,0x8f5b67);brace.rotation.z=side*.3}for(const z of [-39,-19,0,19,39]){this.box(side*52.05,3.3,z,.08,2.8,1.8,0x080b13);this.add('box',0xff8553,side*51.97,3.3,z,.03,2.5,.1,true)}}
 
 // Wide outer combat lanes, ramp-accessible decks and low cover: no invisible walls.
 for(const side of [-1,1]){
   const x=side*32;
   this.box(x,1.6,0,14,3.2,16,0x3d3a41,true).material=surface('metal',6,6);
   for(const zz of [-7.6,7.6])this.add('box',0xe54846,x,3.31,zz,13,.12,.15,true);
   for(const zz of [-4,4])this.add('box',0xffac49,x+side*6.6,4.2,zz,.13,1.5,.55,true);
   this.makeRamp(side*20.4,0,10,8,3.2,'x',side);
   this.box(side*42,.9,-16,3.4,1.8,8,0x35323a,true).material=surface('metal',2,4);
   for(const z of [-34,32]){
     this.box(side*31.7,2.6,z,2.2,5.2,2.2,0x4b3b40,true).material=surface('metal',1,2);
     this.add('oct',0xf24b38,side*31.7,5.6,z,.55,.8,.55,true);
   }
 }
 for(const side of [-1,1]){
    this.box(0,1.25,side*34,13,2.5,11,0x38333a,true).material=surface('metal',4,4);
    this.makeRamp(0,side*23.7,7,11,2.5,'z',side);
    for(const x of [-6,6])this.add('box',0xffb052,x,2.72,side*34,.09,.14,10.3,true);
 }
 for(const [x,z] of [[-42,-43],[42,43],[-6,-41],[7,43]]){
    const t=this.box(x,.5,z,4,1,4,0x303039,true);t.material=surface('metal',2,2);
    this.add('box',0xc13935,x,.98,z,3.8,.1,.1,true);
 }
 // Distinct side landmarks help orient the player at full running speed.
 for(const side of [-1,1]){const frame=this.box(side*49,10,0,1,20,14,0x3a303a);this.add('box',0xff3947,side*48.45,9,0,.05,13,.3,true);}


 // Hanging, asymmetrical body casts and sealed observation faces. Kept away
 // from the center so the arena remains readable during high-speed combat.
 const pylons=[[-47,-30],[-47,2],[-47,34],[47,-31],[47,4],[47,36],[-30,-48],[0,-49],[30,-48]];
 for(let i=0;i<pylons.length;i++){
   const [x,z]=pylons[i],height=8+(i%3)*2;
   const root=new T.Group();root.position.set(x,0,z);this.scene.add(root);
   this.add('box',0x0a0a11,0,height*.55,.0,.12,height,.12,false,root);
   const face=this.add('sphere',0xada8a2,0,height-2.6,-.42,.52,.75,.28,false,root);
   face.rotation.z=(i%3-1)*.15;
   this.add('box',0x171014,0,height-4.35,0,.54,2.8,.26,false,root);
   for(const s of [-1,1]){
     this.add('box',0x161014,s*.51,height-5.3,0,.16,3.8,.19,false,root).rotation.z=s*.15;
     this.add('sphere',0x8a181f,s*.16,height-2.63,-.68,.052,.028,.012,true,root);
   }
   this.watchers.push({root,face,phase:i*1.9});
 }
 // Slow red contamination lighting. Only these few lights update every frame.
 for(const [x,z] of [[-44,-44],[44,44],[-42,42],[42,-42]]){
   const light=new T.PointLight(0xb31527,1.5,16,2);
   light.position.set(x,4.8,z);this.scene.add(light);
   this.flickerLights.push({light,phase:Math.random()*9});
   this.add('box',0x9a1025,x,7.6,z,.2,4.4,.2,true);
 }
 // Streaked drain covers and red seepage near the outside lanes.
 for(let i=0;i<24;i++){
   const x=-45+(i*17)%91,z=-44+(i*29)%89;
   if(Math.abs(x)<12&&Math.abs(z)<12)continue;
   const stain=this.add('plane',0x2b070e,x,.015,z,2+(i%4),2.5+(i%3),1);
   stain.rotation.x=-Math.PI/2;stain.material=new T.MeshBasicMaterial({color:0x23070b,transparent:true,opacity:.44,depthWrite:false,side:T.DoubleSide});
 }
 this.ambient=[];for(let i=0;i<75;i++){let m=this.add('sphere',0x813a3a,(Math.random()-.5)*105,Math.random()*19,(Math.random()-.5)*105,.018,.06,.018,true);this.ambient.push(m)}
 }
 makeRamp(x,z,w,d,height,axis,sign){
  const incline=Math.atan2(height,axis==='x'?w:d);
  const length=Math.hypot(axis==='x'?w:d,height);
  const slab=this.add('box',0x45414a,x,height/2-.12,z,axis==='x'?length:w,.35,axis==='z'?length:d);
  if(axis==='x')slab.rotation.z=sign*incline;
  else slab.rotation.x=-sign*incline;
  slab.material=surface('metal',4,4);
  this.ramps.push({x,z,w,d,height,axis,sign});
  return slab;
 }
 rampHeight(x,z){let highest=-1;for(const r of this.ramps){if(Math.abs(x-r.x)<=r.w/2&&Math.abs(z-r.z)<=r.d/2){const axisPosition=r.axis==='x'?x-r.x:z-r.z;
   const span=r.axis==='x'?r.w:r.d;
   highest=Math.max(highest,Math.max(0,Math.min(r.height,(axisPosition*r.sign/span+.5)*r.height)));
  }}return highest;}
 sign(text,x,y,z,w,h,ry=0){const cv=document.createElement('canvas');cv.width=512;cv.height=128;const c=cv.getContext('2d'),tex=new T.CanvasTexture(cv);tex.magFilter=T.NearestFilter;const paint=()=>{c.clearRect?.(0,0,512,128);c.fillStyle='#d7bca2';c.font='64px "VCR OSD Mono", monospace';c.textAlign='center';c.fillText(text,256,87);tex.needsUpdate=true};paint();if(document.fonts)document.fonts.load('64px "VCR OSD Mono"').then(paint).catch(()=>{});const m=new T.Mesh(geometries.plane,new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide}));m.position.set(x,y,z);m.scale.set(w,h,1);m.rotation.y=ry;this.scene.add(m)}

 makeChest(x,z){const g=new T.Group();g.position.set(x,0,z);this.scene.add(g);const crate=sourcedModel('crate-wide');crate.scale.set(1.65,2.6,1.65);crate.rotation.y=Math.PI/2;crate.position.y=.08;g.add(crate);for(const dx of [-.62,.62])this.add('box',0xe5ff57,dx,.57,-.465,.09,.65,.025,true,g);this.add('oct',0xe5ff57,0,1.7,0,.25,.35,.25,true,g);this.chests.push({x,z,mesh:g,cooldown:0});return g}

 enemy(type,x,z,elite=false){const g=new T.Group();g.position.set(x,0,z);this.scene.add(g);let color=type==='runner'?0xa03637:type==='gunner'?0x5b6669:0x8b292d;
 if(type==='boss'){
 this.add('oct',0x5a272f,0,3.5,0,2.6,3.1,2,false,g);this.add('oct',0xff493e,0,3.5,-1.5,.85,1.2,.5,true,g);for(const s of [-1,1]){this.add('box',0x412b30,s*2.7,3.5,0,1.8,1.6,1.7,false,g);let horn=this.add('cone',0xcab19a,s*2.5,5.8,0,.5,3,.5,false,g);horn.rotation.z=-s*.4;this.add('sphere',0x70ffea,s*3.2,3.1,-.85,.35,.35,.35,true,g)}
 const ring=this.add('ring',0xfc4e37,0,3.5,0,3.6,3.6,3.6,true,g);ring.rotation.x=1.2;g.userData.ring=ring;
 }else if(type==='stalker'){
   // Almost-human: disproportionately long arms and a featureless mask.
   this.add('box',0x242025,0,2.6,0,.54,2.1,.39,false,g);
   this.add('sphere',0xc3bcb2,0,4.0,-.07,.49,.74,.4,false,g);
   this.add('box',0x111116,0,3.96,-.478,.37,.055,.025,false,g);
   for(const side of [-1,1]){
     this.add('sphere',0xe3e5d7,side*.18,4.04,-.45,.075,.08,.04,true,g);
     const arm=this.add('box',0x706965,side*.58,1.9,0,.15,2.9,.15,false,g);arm.rotation.z=side*.18;
     this.add('cone',0x8c7777,side*.92,.4,-.13,.23,.6,.23,false,g).rotation.z=Math.PI;
     this.add('box',0x332b31,side*.2,.78,0,.19,1.55,.23,false,g);
   }
   g.userData.stalkerHead=true;
 }else if(type==='skitter'){
   this.add('sphere',0x4a383d,0,.78,0,.95,.32,.9,false,g);
   this.add('sphere',0xc6b0a6,0,1.05,-.7,.48,.41,.36,false,g);
   this.add('box',0x9e1723,0,1.08,-1.04,.45,.065,.07,true,g);
   for(const s of [-1,1])for(let k=0;k<3;k++){
     const limb=this.add('box',0x77665c,s*(.85+k*.19),.44,(k-1)*.5,.13,.85,.13,false,g);
     limb.rotation.z=s*(.52+k*.12);
   }
 }else if(type==='chorister'){
   // Hovering inverted chapel bell, unsettling high contrast white "face".
   this.add('cone',0x484047,0,0,0,1.6,2.8,1.6,false,g).rotation.z=Math.PI;
   this.add('sphere',0xe2d9cd,0,.55,-.6,.44,.66,.25,false,g);
   for(const s of [-1,1])this.add('sphere',0xdc183d,s*.19,.57,-.84,.055,.13,.045,true,g);
   for(const rad of [1.65,1.87]){const halo=this.add('ring',0x9e2d3d,0,1.5,0,rad,rad,rad,true,g);halo.rotation.x=.2;g.userData.halo=halo}
   for(let k=-2;k<=2;k++)this.add('box',0x6e4c58,k*.39,-1.25,0,.075,2.1-(Math.abs(k)*.28),.075,false,g);
 }else if(type==='leech'){
   this.add('sphere',0x674447,0,.9,0,1.12,.64,.84,false,g);
   this.add('cone',0xbab0a6,0,1.1,-.75,.49,1,.49,false,g).rotation.x=-Math.PI*.42;
   this.add('sphere',0xb90d22,0,1.03,-1.17,.26,.17,.04,true,g);
   for(const s of [-1,1])for(let k=0;k<2;k++){
     const limb=this.add('box',0x78615b,s*.9,.47,(k-.5)*.94,.2,.86,.21,false,g);limb.rotation.z=s*.48;
   }
 }else if(type==='drone'){
 this.add('oct',0x784d55,0,0,0,1,.65,.8,false,g);this.add('sphere',0x56ead8,0,0,-.65,.22,.22,.16,true,g);for(const s of [-1,1]){let wing=this.add('box',0x3c383e,s*1.1,.12,0,1.1,.1,.4,false,g);wing.rotation.z=s*.28;this.add('box',0xff6048,s*1.45,.1,0,.06,.15,.5,true,g)}
 }else{
 this.add('box',color,0,1.45,0,.85,1.15,.5,false,g);this.add('oct',0x43363b,0,.82,0,.56,.4,.35,false,g);this.add('box',0xbbb0a0,0,2.3,0,.58,.65,.5,false,g);this.add('box',0xff5039,0,2.38,-.258,.43,.1,.02,true,g);this.add('box',0x2e2329,0,2.15,-.26,.29,.1,.02,false,g);this.add('box',0x5ff3d9,0,1.65,-.29,.22,.28,.08,true,g);
 const limbs=[];for(const s of [-1,1]){let leg=this.add('box',0x393239,s*.27,.45,0,.25,.85,.3,false,g);limbs.push(leg);let arm=this.add('box',color,s*.66,1.32,0,.25,1.25,.3,false,g);arm.rotation.z=s*.2;limbs.push(arm);if(type==='runner'){let blade=this.add('cone',0xbfb8a7,s*.7,.65,-.2,.15,.85,.15,false,g);blade.rotation.x=-.4}else this.add('box',0x232b2b,s*.65,1.1,-.32,.35,.42,.85,false,g)}g.userData.limbs=limbs;
 }
 if(type==='runner'||type==='gunner'){for(const side of [-1,1]){const shoulder=this.add('oct',type==='runner'?0xa84354:0x678eaf,side*.62,1.93,0,.44,.34,.38,false,g);shoulder.rotation.z=side*.2;for(let i=0;i<3;i++)this.add('box',0x171d2b,side*.18,1.25+i*.18,-.29,.25,.045,.025,false,g);this.add('box',0x7297b7,side*.28,.52,-.17,.2,.23,.08,false,g)}this.add('box',type==='runner'?0xff523f:0x5affef,0,1.65,-.325,.09,.3,.04,true,g)}
 if(elite){const crown=this.add('oct',0xffdf64,0,type==='boss'?7.6:type==='drone'?2:3.4,0,.34,.45,.34,true,g);crown.userData.eliteCrown=true;this.add('ring',0xffd349,0,type==='boss'?7:type==='drone'?1.5:2.9,0,.65,.65,.65,true,g);}
 const tell=this.add('oct',['runner','skitter','leech','stalker'].includes(type)?0xfec7a9:0x5dffe8,0,type==='boss'?6.7:type==='drone'||type==='chorister'?1.6:type==='stalker'?5.1:type==='skitter'||type==='leech'?1.8:3.1,0,.17,.17,.17,true,g);tell.visible=false;g.userData.tell=tell;g.traverse(m=>{if(m.isMesh)m.userData.baseMaterial=m.material});g.userData.type=type;g.userData.phase=Math.random()*6;return g}
 animateEnemy(e,t){const g=e.mesh;g.rotation.y=Math.atan2(e.targetX-g.position.x,e.targetZ-g.position.z)+Math.PI;const u=g.userData;if(u.limbs)u.limbs.forEach((m,i)=>m.rotation.x=Math.sin(t*8+u.phase+(i%2)*Math.PI)*.45);if(e.type==='stalker'){g.rotation.z=Math.sin(t*2.7+u.phase)*.035;g.position.y=Math.sin(t*1.7+u.phase)*.08;}if(e.type==='skitter')g.rotation.z=Math.sin(t*12+u.phase)*.045;if(e.type==='chorister'){g.rotation.z=Math.sin(t*2+u.phase)*.12;if(u.halo)u.halo.rotation.z=t*.4;}if(e.type==='leech')g.scale.x=1+Math.sin(t*5+u.phase)*.07;if(u.ring){u.ring.rotation.z=t*.6;g.position.y=Math.sin(t*2)*.15}if(u.tell){u.tell.visible=e.telegraph>0;u.tell.scale.setScalar(.2+Math.max(0,e.telegraph)*.3);u.tell.rotation.z=t*8}if(e.telegraph>0)g.scale.setScalar(1+Math.sin(t*28)*.035);else g.scale.setScalar(1);const hit=(u.flashUntil||0)>t;if(hit!==!!u.flashing){u.flashing=hit;g.traverse(m=>{if(m.isMesh)m.material=hit?mat(0xffffe8,true):m.userData.baseMaterial})}}
 projectile(x,y,z,friendly=false){const g=new T.Group();g.position.set(x,y,z);const c=friendly?0xe5ff57:0x65f5e3;g.add(mesh('sphere',c,0,0,0,.23,.23,.23,true));g.add(mesh('oct',0xffffff,0,0,0,.11,.11,.11,true));this.scene.add(g);return g}
 buildWeapons(){this.gunRoot=new T.Group();this.viewCamera.add(this.gunRoot);this.guns=[];
 for(let type=0;type<3;type++){const g=new T.Group();this.gunRoot.add(g);const accent=[0x78b9ff,0xffa054,0x5ae4d4][type];
 const imported=sourcedModel(['blaster-b','blaster-l','blaster-f'][type]);const scale=[2.15,2,1.25][type];imported.scale.setScalar(scale);imported.position.set(0,[-.1,-.09,-.04][type],[-.29,-.49,-.4][type]);g.add(imported);g.userData.model=imported;
 // Blue armored hand anchors the sourced weapon in first person.
 this.add('box',0x687e99,.025,-.28,.3,.23,.13,.28,false,g);this.add('box',0x253d69,.03,-.31,.48,.25,.22,.42,false,g);this.add('box',0x4f78b7,.03,-.19,.48,.22,.035,.3,false,g);
 g.userData.muzzle=new T.Vector3(0,.02,type===0?-.85:type===1?-1.04:-1.22);const flash=new T.Group();flash.position.copy(g.userData.muzzle);for(const [color,size,angle] of [[accent,.27,0],[0xfff6b3,.19,.4],[0xffffff,.1,0]]){const m=new T.Mesh(starGeometry(),new T.MeshBasicMaterial({color,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));m.scale.setScalar(size);m.rotation.z=angle;flash.add(m)}flash.visible=false;g.add(flash);g.userData.flash=flash;this.guns.push(g)}
 this.fist=new T.Group();this.viewCamera.add(this.fist);this.add('box',0x4a5552,0,0,0,.26,.22,.4,false,this.fist);this.add('box',0xe8ab78,0,.06,-.24,.3,.2,.15,false,this.fist);this.add('box',0xf2dbb0,0,.16,-.2,.29,.04,.2,false,this.fist);this.fist.visible=false;
 }
 setFX(settings){this.reduced=!!settings.reduced;this.effects.reduced=this.reduced;this.post.uniforms.reduced.value=this.reduced?1:0;this.post.uniforms.vhs.value=settings.crt?1:0}
 fireWeapon(index){this.activeWeapon=index;this.muzzleTime=index===1?.085:index===2?.12:.065;this.guns[index].userData.flash.rotation.z=Math.random()*6.28;this.post.uniforms.impact.value=Math.max(this.post.uniforms.impact.value,index===2?.5:.13)}
 muzzlePosition(index){this.viewScene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);const p=this.guns[index].localToWorld(this.guns[index].userData.muzzle.clone()).applyMatrix4(this.viewCamera.matrixWorldInverse);const view=this.viewCamera.projectionMatrix.elements,world=this.camera.projectionMatrix.elements;p.x*=view[0]/world[0];p.y*=view[5]/world[5];return p.applyMatrix4(this.camera.matrixWorld)}
 weaponPose(index,time,moving,recoil,parry,slide,strafe=0){if(index!==this.activeWeapon){this.swapTime=.15;this.activeWeapon=index}this.gunRoot.visible=true;this.guns.forEach((g,i)=>g.visible=i===index);const swap=this.swapTime/.15,weight=[1,1.3,.8][index];this.gunRoot.scale.setScalar(1.04);this.gunRoot.position.set(.39+Math.sin(time*10)*moving*.013,-.38+Math.abs(Math.cos(time*10))*moving*.015-(slide?.06:0)-swap*.22,-.65+recoil*.18*weight);this.gunRoot.rotation.set(recoil*.15*weight-swap*.25,-recoil*.04,-.045-Math.sin(time*10)*moving*.012+strafe*.02+recoil*.04);const pump=this.guns[index].userData.pump;if(pump)pump.position.z=-.53+Math.sin(Math.min(1,recoil/1.6)*Math.PI)*.18;this.fist.visible=parry>0;if(parry>0){const v=Math.sin(Math.min(1,parry/.35)*Math.PI);this.fist.position.set(-.4,-.33+v*.17,-.7-v*.44);this.fist.rotation.set(-.2-v*.3,0,-v*.2)}}
 tracer(from,to,color=0xffefb0,width=.025,duration=.085){return this.effects.beam(from,to,color,width,duration)}
 burst(pos,color,count=10,power=5){this.effects.burst(pos,color,count,power)}
 blood(pos){this.effects.blood(pos)}
 ring(pos,color,radius=1,duration=.4){this.effects.shock(pos,color,radius,duration)}
 impact(pos,color=0xffce89,size=.35){this.effects.impact(pos,color,size)}
 hitEnemy(e){e.mesh.userData.flashUntil=this.time+.065}
 parryBurst(pos){this.effects.parry(pos);this.post.uniforms.impact.value=1}
 explosion(pos,color=0xff5428,size=1){this.effects.explosion(pos,color,size);this.post.uniforms.impact.value=Math.max(this.post.uniforms.impact.value,.7)}
 updateFx(dt,time){this.time=time;this.reactor.rotation.y=time*.15;this.reactor.position.y=12+Math.sin(time*.8)*.25;for(let m of this.ambient){m.position.y+=dt*.3;if(m.position.y>22)m.position.y=0}for(const w of this.watchers){w.face.rotation.y=Math.sin(time*.4+w.phase)*.25;}for(const {light,phase} of this.flickerLights)light.intensity=.8+.36*Math.sin(time*1.6+phase)+.35*Math.sin(time*8.3+phase*2);for(const c of this.chests){c.mesh.children.at(-1).rotation.y=time;c.mesh.children.at(-1).position.y=1.7+Math.sin(time*2)*.12;c.mesh.visible=c.cooldown<=0;c.cooldown=Math.max(0,c.cooldown-dt)}this.effects.update(dt);this.muzzleTime=Math.max(0,this.muzzleTime-dt);this.swapTime=Math.max(0,this.swapTime-dt);for(let i=0;i<3;i++){const f=this.guns[i].userData.flash;f.visible=this.muzzleTime>0&&i===this.activeWeapon;f.scale.setScalar((i===1?1.8:i===2?1.3:1)*(.8+Math.random()*.4))}this.muzzleLight.intensity=this.muzzleTime>0?4:0;this.muzzleLight.position.set(.3,-.2,-1.3);this.post.uniforms.time.value=time;this.post.uniforms.impact.value=Math.max(0,this.post.uniforms.impact.value-dt*4)}
 clearFx(){this.effects.clear();this.muzzleTime=0;this.muzzleLight.intensity=0;for(const gun of this.guns)gun.userData.flash.visible=false;this.post.uniforms.impact.value=0;this.post.uniforms.damage.value=0;for(const c of this.chests){c.cooldown=0;c.mesh.visible=true}}
 menu(time){this.gunRoot.visible=false;this.fist.visible=false;this.camera.position.set(38+Math.sin(time*.06)*2,13,42);this.camera.lookAt(-10,6,0);this.camera.fov=65;this.camera.updateProjectionMatrix();this.updateFx(.016,time);this.render()}
 render(){this.post.render(this.scene,this.camera,this.viewScene,this.viewCamera,this.gunRoot.visible)}
}
