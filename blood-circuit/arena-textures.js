import * as T from './vendor/three.module.min.js';
function rng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
export function arenaTexture(type,rx=1,ry=1){const n=64,data=new Uint8Array(n*n*4),rand=rng(9123);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const p=(y*n+x)*4;let r,g,b;const noise=rand()*16-8;if(type==='floor'){const seam=x<2||y<2||x>61||y>61,bolt=(x===6||x===57)&&(y===6||y===57),grate=(x>20&&x<44&&y>5&&y<59&&y%5<2);let v=seam?20:grate?32:bolt?130:66+noise;r=v;g=v*.97;b=v*1.12}else if(type==='wall'){const mortar=y%16<2||(x+(Math.floor(y/16)%2)*32)%64<2;let v=mortar?23:70+noise;r=v*1.1;g=v*.8;b=v*.82}else if(type==='metal'){let v=x%16<2?25:80+noise;r=v*.9;g=v;b=v*1.2}else{const yellow=(x+y)%32<16;r=yellow?195:26;g=yellow?153:25;b=yellow?57:31}data[p]=r;data[p+1]=g;data[p+2]=b;data[p+3]=255}const tex=new T.DataTexture(data,n,n,T.RGBAFormat);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestMipmapNearestFilter;tex.generateMipmaps=true;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(rx,ry);tex.needsUpdate=true;return tex}

// CC0 ambientCG material albedos, optimized and delivered by Cloudinary.
// A missing map never prevents the arena from loading: the material starts with
// the original procedural atlas and swaps only after the image has loaded.
const sourcedAlbedo={
 floor:'https://res.cloudinary.com/ry48iesu/image/upload/c_scale,w_512,q_auto,f_jpg/v1792087522/blood-circuit/cc0-concrete034.jpg',
 wall:'https://res.cloudinary.com/ry48iesu/image/upload/c_scale,w_512,q_auto,f_jpg/v1792087545/blood-circuit/cc0-plaster001.jpg',
 metal:'https://res.cloudinary.com/ry48iesu/image/upload/c_scale,w_512,q_auto,f_jpg/v1792087549/blood-circuit/cc0-metal049a.jpg'
};
const imageCache=new Map();
const surfaceCache=new Map();
const loader=new T.TextureLoader();
function imageTexture(type){
 if(!sourcedAlbedo[type])return null;
 if(!imageCache.has(type)){
   const subscribers=[];
   const entry={texture:null,subscribers};imageCache.set(type,entry);
   loader.load(sourcedAlbedo[type],tex=>{
     // Downsample the large source to a PSX-friendly 384px in memory.
     // This prevents dozens of 2K copies from exhausting the GPU.
     const cv=document.createElement('canvas');cv.width=cv.height=384;
     const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=true;
     ctx.drawImage(tex.image,0,0,384,384);
     const small=new T.CanvasTexture(cv);small.colorSpace=T.SRGBColorSpace;
     entry.texture=small;
     tex.dispose();
     for(const apply of subscribers)apply(small);
     subscribers.length=0;
   },undefined,()=>{subscribers.length=0});
 }
 return imageCache.get(type);
}
export function surface(type,rx=1,ry=1){
 const key=`${type}/${rx}/${ry}`;
 if(surfaceCache.has(key))return surfaceCache.get(key);
 const procedural=arenaTexture(type,rx,ry);
 // Each surface gets its own sampler to avoid different walls changing one
 // shared texture's UV repetition (especially important on the huge floor).
 const mat=new T.MeshLambertMaterial({map:procedural,flatShading:true,
   color:type==='floor'?0x69616a:type==='wall'?0x51454e:type==='metal'?0x70747b:0xffffff});
 const source=imageTexture(type);
 if(source){
   const swap=base=>{
     const tex=base.clone();tex.wrapS=tex.wrapT=T.RepeatWrapping;
     tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestMipmapNearestFilter;
     tex.repeat.set(rx,ry);tex.needsUpdate=true;
     mat.map=tex;mat.needsUpdate=true;
   };
   if(source.texture)swap(source.texture);else source.subscribers.push(swap);
 }
 surfaceCache.set(key,mat);
 return mat;
}

