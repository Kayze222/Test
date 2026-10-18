import * as T from './vendor/three.module.min.js';
// The world is rendered at a modest resolution; DOM text stays full resolution.
export class RetroRenderer{
 constructor(renderer){this.renderer=renderer;this.target=new T.WebGLRenderTarget(1,1,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:true});this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-1,1,1,-1,0,1);this.uniforms={screen:{value:this.target.texture},resolution:{value:new T.Vector2(1,1)},time:{value:0},impact:{value:0},damage:{value:0},reduced:{value:0},vhs:{value:1}};this.material=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:this.uniforms,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,fragmentShader:`
 uniform sampler2D screen;uniform vec2 resolution;uniform float time;uniform float impact;uniform float damage;uniform float reduced;uniform float vhs;varying vec2 vUv;
 float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){vec2 uv=vUv;float frame=floor(time*24.0);float signal=vhs*(1.0-reduced);
 float band=pow(max(0.0,1.0-abs(uv.y-fract(time*.047))*75.0),2.0);
 float edge=smoothstep(.40,.50,abs(uv.y-.5));
 uv.x+=(noise(vec2(frame,floor(uv.y*resolution.y)))-.5)*(.00025+edge*.0025)*signal;
 uv.x+=band*sin(time*21.0)*.0012*signal;uv=clamp(uv,vec2(.002),vec2(.998));
 float split=(impact*.003*(1.0-reduced))+(vhs*.0011);vec3 col=texture2D(screen,uv).rgb;
 col.r=texture2D(screen,uv+vec2(split,0.0)).r;col.b=texture2D(screen,uv-vec2(split,0.0)).b;
 vec2 px=1.0/resolution;vec3 bloom=texture2D(screen,uv+vec2(px.x*2.0,0.0)).rgb+texture2D(screen,uv-vec2(px.x*2.0,0.0)).rgb+texture2D(screen,uv+vec2(0.0,px.y*2.0)).rgb+texture2D(screen,uv-vec2(0.0,px.y*2.0)).rgb;
 col+=max(bloom*.25-vec3(.65),vec3(0.0))*.2;col=(col-.04)*1.09+.04;
 float dither=fract(sin(dot(floor(uv*resolution),vec2(12.9898,78.233)))*43758.5453);
 col=floor(max(col,vec3(0.0))*64.0+dither*.55)/64.0;
 col=mix(col,col*.88+texture2D(screen,uv+vec2(-.0025,0.0)).rgb*.12,vhs);
 col+=(noise(floor(uv*resolution)+frame)-.5)*.022*vhs;col*=1.0-band*.035*signal;
 float vignette=length((uv-.5)*vec2(1.0,.8));col*=1.04-vignette*.14;
 col.r+=damage*vignette*.035;gl_FragColor=vec4(col,1.0);
 #include <colorspace_fragment>
 }`});this.scene.add(new T.Mesh(new T.PlaneGeometry(2,2),this.material));this.resize(innerWidth,innerHeight)}
 resize(w,h){const scale=Math.min(1,1152/w);const tw=Math.max(1,Math.round(w*scale)),th=Math.max(1,Math.round(h*scale));this.target.setSize(tw,th);this.uniforms.resolution.value.set(tw,th)}
 render(scene,camera,viewScene,viewCamera,showWeapon){const r=this.renderer;r.setRenderTarget(this.target);r.render(scene,camera);if(showWeapon){const old=r.autoClear;r.autoClear=false;r.clearDepth();r.render(viewScene,viewCamera);r.autoClear=old}r.setRenderTarget(null);r.render(this.scene,this.camera)}
}
