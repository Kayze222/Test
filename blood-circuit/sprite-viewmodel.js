// Classic FPS 2D weapon system with baked hand-and-weapon sprite frames.
// No WebGL arms, GLTFLoader, or independent bone grip offsets are involved.
const FRAMES = ['idle','shoot','recover','lower'];
const BASE = './assets/viewmodels/';
export class SpriteViewmodel {
 constructor(){
  this.canvas=document.createElement('canvas');
  this.canvas.id='sprite-viewmodel'; this.canvas.width=512;this.canvas.height=384;
  this.canvas.setAttribute('aria-hidden','true');
  Object.assign(this.canvas.style,{
   position:'fixed',bottom:'0',left:'50%',transform:'translateX(-50%)',
   width:'min(100vw, 54vh, 700px)',height:'auto',aspectRatio:'4 / 3',zIndex:'9',
   pointerEvents:'none',imageRendering:'pixelated',display:'none',
   filter:'drop-shadow(0 6px 10px rgba(0,0,0,.75))'
  });
  document.body.appendChild(this.canvas);
  this.ctx=this.canvas.getContext('2d',{alpha:true});
  this.ctx.imageSmoothingEnabled=false;
  this.images=new Map();
  for(let i=0;i<3;i++)for(const frame of FRAMES)this.load(`weapon${i}_${frame}`);
  for(const frame of ['idle','strike','recover'])this.load('fists_'+frame);
  this.weapon=0;this.previous=0;this.swapUntil=0;this.fireUntil=0;this.firingAt=0;this.parryUntil=0;this.reduced=false;
  this.visible=false;this.lastPoseTime=0;this.lastDraw='';
 }
 load(key){const img=new Image();img.decoding='async';img.src=`${BASE}${key}.png`;img.onload=()=>this.redrawLast();img.onerror=()=>console.warn('[BLOOD//CIRCUIT] Viewmodel sprite unavailable:',key);this.images.set(key,img)}
 redrawLast(){if(this.visible)this.pose(...(this.lastArgs||[this.weapon,0,0,0,0,false,0]))}
 setVisible(value){this.visible=!!value;this.canvas.style.display=this.visible?'block':'none';if(!value)this.ctx.clearRect(0,0,512,384)}
 fire(index){this.weapon=index;this.firingAt=performance.now();this.fireUntil=this.firingAt+([135,240,290][index]);}
 parry(){this.parryUntil=performance.now()+190}
 pose(index,time,moving,recoil,parry,slide,strafe=0){
  this.lastArgs=[index,time,moving,recoil,parry,slide,strafe];
  this.setVisible(true);
  const now=performance.now();
  if(index!==this.weapon){this.previous=this.weapon;this.weapon=index;this.swapUntil=now+180;}
  let key=`weapon${index}_idle`,switching=now<this.swapUntil,attacking=now<this.fireUntil;
  if(now<this.parryUntil)key='fists_strike';
  else if(attacking){const t=(now-this.firingAt)/([135,240,290][index]);key=`weapon${index}_${t<.50?'shoot':'recover'}`;}
  else if(switching){key=`weapon${now<this.swapUntil-100?this.previous:index}_lower`}
  // Animate the baked frames as a whole, keeping weapon AND hands perfectly aligned.
  const ctx=this.ctx;ctx.clearRect(0,0,512,384);
  const img=this.images.get(key)||this.images.get(`weapon${index}_idle`);
  const fallback=this.images.get(`weapon${index}_idle`);
  const draw=img?.complete&&img.naturalWidth?img:fallback?.complete&&fallback.naturalWidth?fallback:null;
  const t=this.reduced?0:time;
  const bob=this.reduced?0:moving*3.8;
  const x=this.reduced?0:Math.sin(t*10)*bob+strafe*3.4;
  const y=this.reduced?0:Math.abs(Math.cos(t*10))*bob+(slide?20:0);
  const kick=(attacking&&!this.reduced)?(1-(now-this.firingAt)/([135,240,290][index]))*8:Math.min(8,Math.max(0,recoil*4));
  const lower=switching?12*Math.sin(Math.PI*(1-Math.max(0,this.swapUntil-now)/180)):0;
  ctx.save();ctx.translate(256+x,192+y+kick+lower);
  ctx.rotate(this.reduced?0:Math.sin(t*6)*moving*.004-strafe*.009);
  if(draw){ctx.drawImage(draw,-256,-192,512,384)}
  else { // Non-fatal fallback while the transparent PNGs load.
   ctx.fillStyle='#303b45';ctx.fillRect(-22,80,44,145);ctx.fillStyle='#a66b4c';ctx.fillRect(-75,135,44,84);ctx.fillRect(30,135,44,84);
  }
  ctx.restore();this.lastDraw=key;
 }
}
