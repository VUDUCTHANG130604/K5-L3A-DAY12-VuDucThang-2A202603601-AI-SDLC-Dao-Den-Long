// Procedural original models. No network assets or renderer-only gameplay rules.
import {getMap,topHeight} from '/src/maps.mjs';
import {C} from './palette.mjs';
const vertex=`attribute vec3 aPosition,aNormal,aColor;attribute float aMaterial;
uniform mat4 uVP,uLightVP;uniform mat3 uRotation;uniform vec3 uPosition,uScale;
varying vec3 vNormal,vWorld,vColor;varying float vMaterial;varying vec4 vShadow;
void main(){vWorld=uRotation*(aPosition*uScale)+uPosition;vNormal=uRotation*(aNormal/uScale);vColor=aColor;vMaterial=aMaterial;vShadow=uLightVP*vec4(vWorld,1.);gl_Position=uVP*vec4(vWorld,1.);}`;
const fragment=`precision highp float;
uniform vec3 uColor,uEye,uLights[8];uniform float uGlow,uMaterial,uTime,uWarmth;uniform sampler2D uShadow;
varying vec3 vNormal,vWorld,vColor;varying float vMaterial;varying vec4 vShadow;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float unpackDepth(vec4 c){return dot(c,vec4(1./16777216.,1./65536.,1./256.,1.))*(255./256.);}
float shadow(vec3 n){vec3 p=vShadow.xyz/vShadow.w*.5+.5;if(p.x<0.||p.x>1.||p.y<0.||p.y>1.||p.z>1.)return 1.;float bias=max(.003*(1.-dot(n,normalize(vec3(-.6,1.,.4)))),.0015),v=0.;
for(int x=0;x<2;x++)for(int y=0;y<2;y++){float d=unpackDepth(texture2D(uShadow,p.xy+(vec2(float(x),float(y))-.5)/1024.));v+=p.z-bias<=d?1.:.25;}return v*.25;}
void main(){vec3 n=normalize(vNormal),base=uColor*vColor;float mat=uMaterial>=0.?uMaterial:vMaterial;
float grain=noise(vWorld.xz*9.)*.5+noise(vWorld.xz*35.)*.5;
if(mat>.5&&mat<1.5){base*=.78+.3*grain;float path=1.-smoothstep(.9,1.7,min(abs(vWorld.x),abs(vWorld.z)));base=mix(base,vec3(.25,.27,.19)*(.8+.25*grain),path*.75);}
if(mat>1.5&&mat<2.5){base*=.72+.35*noise(vec2(vWorld.y*2.,(vWorld.x+vWorld.z)*30.));}
if(mat>2.5&&mat<3.5){base*=.7+.5*noise(vWorld.xz*13.+vWorld.y*4.);}
if(mat>3.5&&mat<4.5){base*=.88+.16*noise(vWorld.xy*95.);}
vec3 eye=normalize(uEye-vWorld),key=normalize(vec3(-.6,1.,.4));float diffuse=max(dot(n,key),0.);vec3 illumination=vec3(.85,.9,1.)*uWarmth+vec3(.45,.48,.6)*diffuse*shadow(n);
for(int i=0;i<8;i++){vec3 delta=uLights[i]-vWorld;float d=length(delta),enabled=step(-50.,uLights[i].y),att=enabled*5./(1.+d*d*.4);illumination+=vec3(1.,.702,.278)*att*(.3+.7*max(dot(n,normalize(delta)),0.));}
vec3 color=base*illumination;
if(mat>5.5){float edge=pow(1.-max(dot(n,eye),0.),3.);color+=vec3(.478431,.235294,1.)*edge*.35;}
float spec=pow(max(dot(n,normalize(key+eye)),0.),mat>4.5?90.:28.);color+=spec*(mat>4.5?.48:.055)*shadow(n);
if(mat>4.5&&mat<5.5){float wave=sin(vWorld.x*.8+uTime*.6)*sin(vWorld.z*.7-uTime*.4);color=mix(color,vec3(.13,.27,.32),pow(1.-max(dot(n,eye),0.),3.));color+=vec3(.06,.10,.10)*wave;}
color=mix(color,base*1.5,uGlow);float fog=1.-exp(-pow(length(uEye-vWorld)*.01,2.));color=mix(color,vec3(.106,.137,.314),fog);color=color/(color+vec3(.6));gl_FragColor=vec4(pow(color,vec3(.85)),1.);}`;
const depthFragment=`precision highp float;void main(){vec4 c=fract(gl_FragCoord.z*vec4(16777216.,65536.,256.,1.));c-=c.xxyz*vec4(0.,1./256.,1./256.,1./256.);gl_FragColor=c*(256./255.);}`;
function multiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
const normalize=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function lookAt(eye,target){const z=normalize(eye.map((x,i)=>x-target[i])),x=normalize(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
function perspective(aspect){const f=1/Math.tan(Math.PI/7),n=.15,z=180;return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(z+n)/(n-z),-1,0,0,2*z*n/(n-z),0]);}
const ortho=r=>new Float32Array([1/r,0,0,0,0,1/r,0,0,0,0,-2/120,0,0,0,-1,1]);
function rotation(yaw=0,tilt=0){const c=Math.cos(yaw),s=Math.sin(yaw),a=Math.cos(tilt),b=Math.sin(tilt);return[c,0,-s,s*b,a,c*b,s*a,-b,c*a];}
const transform=(m,v)=>[m[0]*v[0]+m[3]*v[1]+m[6]*v[2],m[1]*v[0]+m[4]*v[1]+m[7]*v[2],m[2]*v[0]+m[5]*v[1]+m[8]*v[2]];
// Lathed profiles produce smooth curved bodies, turned timber, pottery and hats.
function lathe(profile,segments=24){const out=[];for(let j=0;j<profile.length-1;j++)for(let i=0;i<segments;i++){
  const [r0,y0]=profile[j],[r1,y1]=profile[j+1],a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments;
  const p=(r,y,t)=>[Math.cos(t)*r,y,Math.sin(t)*r],n=t=>normalize([Math.cos(t)*(y1-y0),r0-r1,Math.sin(t)*(y1-y0)]);
  for(const [r,y,t]of [[r0,y0,a],[r1,y1,a],[r1,y1,b],[r0,y0,a],[r1,y1,b],[r0,y0,b]])out.push(...p(r,y,t),...n(t));
}return out;}
function sphere(rows=16,segments=24){const profile=[];for(let i=0;i<=rows;i++){const a=-Math.PI/2+i*Math.PI/rows;profile.push([Math.max(.0001,Math.cos(a)),Math.sin(a)]);}return lathe(profile,segments);}
function cube(){const d=[];for(const [n,u,v]of [[[1,0,0],[0,1,0],[0,0,1]],[[-1,0,0],[0,0,1],[0,1,0]],[[0,1,0],[0,0,1],[1,0,0]],[[0,-1,0],[1,0,0],[0,0,1]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[0,1,0],[1,0,0]]])for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])d.push(...n.map((x,i)=>(x+u[i]*a+v[i]*b)*.5),...n);return d;}
const shapes={sphere:sphere(),orb:sphere(6,8),foliage:sphere(8,12),cube:cube(),cylinder:lathe([[0,-.5],[1,-.5],[1,.5],[0,.5]]),hat:lathe([[0,-.04],[1,-.04],[.96,.01],[.05,.63],[0,.64]],48),
  coat:lathe([[0,0],[.45,0],[.33,.75],[.25,.85],[0,.85]]),paper:lathe([[0,-.6],[.3,-.6],[.55,-.45],[.65,0],[.55,.45],[.3,.6],[0,.6]],32),rock:lathe([[0,-.4],[.7,-.4],[1,0],[.8,.5],[.25,.7],[0,.7]],9)};
function batch(){const values=[];return{values,add(mesh,p,scale,color,yaw=0,material=0,tilt=0){const r=rotation(yaw,tilt),data=typeof mesh==='string'?shapes[mesh]:mesh;for(let i=0;i<data.length;i+=6){const v=transform(r,data.slice(i,i+3).map((x,k)=>x*scale[k])),n=normalize(transform(r,data.slice(i+3,i+6).map((x,k)=>x/scale[k])));values.push(v[0]+p[0],v[1]+p[1],v[2]+p[2],...n,...color,material);}}};}
function makeEnvironment(night){const b=batch(),map=getMap(night),tri=[];
  const triangle=(a,c,d,n=[0,1,0])=>{for(const p of[a,c,d])tri.push(...p,...n);};
  function ring(cx,cz,inner,outer,y,start=0,end=Math.PI*2){for(let i=0;i<96;i++){const a=start+(end-start)*i/96,c=start+(end-start)*(i+1)/96,p=(r,t,h=y)=>[cx+Math.cos(t)*r,h,cz+Math.sin(t)*r];triangle(p(inner,a),p(outer,a),p(outer,c));triangle(p(inner,a),p(outer,c),p(inner,c));if(y>0){const n=[Math.cos(a),0,Math.sin(a)];triangle(p(outer,a,0),p(outer,a),p(outer,c),n);triangle(p(outer,a,0),p(outer,c),p(outer,c,0),n);const ni=n.map(v=>-v);triangle(p(inner,a,0),p(inner,c),p(inner,a),ni);triangle(p(inner,a,0),p(inner,c,0),p(inner,c),ni);}}}
  for(const island of map.islands){ring(island.x,island.z,0,island.radius,0);b.add('foliage',[island.x,-3,island.z],[island.radius+1,3,island.radius+1],C.sand,0,3);
    for(let i=0;i<50;i++){const a=i*2.399,r=island.radius-.2;b.add('rock',[island.x+Math.cos(a)*r,-.3,island.z+Math.sin(a)*r],[1,.8,1.1],C.sand,a,3);}
    for(let i=0;i<12;i++){const a=i*2.399,x=island.x+Math.cos(a)*(island.radius-4),z=island.z+Math.sin(a)*(island.radius-4);b.add('cylinder',[x,1.8,z],[.2,3.6,.2],C.wood,0,2);for(let k=0;k<3;k++){const q=a+k*2.1;b.add('foliage',[x+Math.cos(q),3.7+k*.25,z+Math.sin(q)],[1.5,1.1,1.4],C.grass);}}
    for(let i=0;i<600;i++){const a=i*2.399,r=Math.sqrt((i*17%601)/601)*(island.radius-1),x=island.x+Math.cos(a)*r,z=island.z+Math.sin(a)*r,y=(topHeight(night,x,z)??0)+.02;triangle([x-.04,y,z],[x+.04,y,z],[x+.12,y+.25,z+.04]);}
    for(let i=0;i<16;i++){const a=i*2.399,r=island.radius+7+(i%3)*4;b.add('foliage',[island.x+Math.cos(a)*r,-4,island.z+Math.sin(a)*r],[5,2,4],C.sea);}
  }
  if(night===2){for(let i=0;i<55;i++)b.add('cylinder',[26+i/3,-.07,0],[.09,4,.09],C.wood,0,2,Math.PI/2);for(const z of[-1.4,1.4])b.add('cube',[35,-.25,z],[18,.2,.18],C.wood,0,2);}
  if(night===3){ring(0,0,12,24,3,0,Math.PI);ring(0,0,0,8,6);
    for(const deg of map.ramps){const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a),p=(r,w,y)=>[r*c-w*s,y,r*s+w*c];triangle(p(30,-1.5,0),p(24,-1.5,3),p(24,1.5,3),normalize([c*.5,1,s*.5]));triangle(p(30,-1.5,0),p(24,1.5,3),p(30,1.5,0),normalize([c*.5,1,s*.5]));}
    b.add('cylinder',[0,10,0],[2,8,2],C.wood,0,2);b.add('hat',[0,14,0],[3,1.3,3],C.sand);b.add('paper',[0,12.6,0],[.9,1,.9],C.gold);
  }
  b.add(tri,[0,0,0],[1,1,1],C.grass,0,1);
  for(const pad of map.pads){b.add('cylinder',[pad.pos[0],pad.pos[1]+.02,pad.pos[2]],[1,.04,1],C.gold);b.add('cylinder',[pad.pos[0],pad.pos[1]+.045,pad.pos[2]],[.75,.02,.75],C.red);}
  return b.values;
}
function makeLantern(){const b=batch(),wood=C.wood,brass=C.gold;
  for(let i=0;i<3;i++)b.add('cylinder',[0,.08+i*.1,0],[1-i*.15,.12,1-i*.15],[.38,.37,.3],0,3);
  b.add('cylinder',[0,1.1,0],[.16,1.9,.16],wood,0,2);
  for(const y of [1.8,3.2])b.add('cylinder',[0,y,0],[.62,.11,.62],brass);
  b.add('hat',[0,3.22,0],[1,.7,1],[.12,.18,.18]);b.add('sphere',[0,3.74,0], [.09,.15,.09],brass);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;b.add('cylinder',[Math.cos(a)*.48,2.5,Math.sin(a)*.48],[.022,1.3,.022],wood,0,2);}
  b.add('cylinder',[0,1.53,0],[.03,.4,.03],brass);return b.values;
}
export function createRenderer(canvas){
  const gl=canvas.getContext('webgl',{antialias:false,alpha:false,powerPreference:'high-performance'});if(!gl)throw new Error('Cần trình duyệt hỗ trợ WebGL và tăng tốc đồ họa.');
  // Dithering corrupts RGBA-packed depth and causes checkerboard self-shadowing.
  gl.disable(gl.DITHER);
  function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  function program(fs){const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return{p,u:Object.fromEntries(['uVP','uLightVP','uRotation','uPosition','uScale','uColor','uGlow','uMaterial','uTime','uWarmth','uEye','uShadow','uLights[0]'].map(k=>[k,gl.getUniformLocation(p,k)])),a:Object.fromEntries(['aPosition','aNormal','aColor','aMaterial'].map(k=>[k,gl.getAttribLocation(p,k)]))};}
  const lit=program(fragment),depth=program(depthFragment),meshes={};
  function upload(name,values){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);meshes[name]={buffer,count:values.length/10};}
  for(const [name,data]of Object.entries(shapes)){const b=batch();b.add(data,[0,0,0],[1,1,1],[1,1,1]);upload(name,b.values);}
  upload('lantern',makeLantern());
  const shadow=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shadow);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1024,1024,0,gl.RGBA,gl.UNSIGNED_BYTE,null);for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.NEAREST);for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);
  const framebuffer=gl.createFramebuffer(),depthBuffer=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,depthBuffer);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,1024,1024);gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,shadow,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depthBuffer);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Không thể tạo bản đồ bóng đổ.');gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.enable(gl.DEPTH_TEST);
  let lightVP,camera=[0,0],viewYaw=.24,range=22,lastNight=0,lastVP;
  function execute(records,p,vp,time,lights,warmth){gl.useProgram(p.p);gl.uniformMatrix4fv(p.u.uVP,false,vp);gl.uniformMatrix4fv(p.u.uLightVP,false,lightVP);gl.uniform1f(p.u.uTime,time);gl.uniform1f(p.u.uWarmth,warmth);gl.uniform3fv(p.u['uLights[0]'],lights);gl.uniform1i(p.u.uShadow,0);
    for(const o of records){const m=meshes[o.mesh];gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);for(const[name,size,offset]of[['aPosition',3,0],['aNormal',3,12],['aColor',3,24],['aMaterial',1,36]]){const a=p.a[name];if(a>=0){gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,40,offset);}}
      gl.uniform3fv(p.u.uPosition,o.pos);gl.uniform3fv(p.u.uScale,o.scale);gl.uniformMatrix3fv(p.u.uRotation,false,rotation(o.yaw,o.tilt));gl.uniform3fv(p.u.uColor,o.color);gl.uniform1f(p.u.uMaterial,o.material);gl.uniform1f(p.u.uGlow,o.glow);gl.drawArrays(gl.TRIANGLES,0,m.count);
    }
  }
  return{setView(yaw,zoom){viewYaw=yaw;range=Math.max(10,Math.min(60,zoom));},project(point){if(!lastVP)return null;const v=[point.x,point.y,point.z,1],p=[0,0,0,0];for(let r=0;r<4;r++)for(let k=0;k<4;k++)p[r]+=lastVP[k*4+r]*v[k];return{x:p[0]/p[3],y:p[1]/p[3],visible:p[3]>0&&Math.abs(p[0])<p[3]&&Math.abs(p[1])<p[3]};},render(state,time){
    if(lastNight!==state.night){if(!meshes[`map${state.night}`])upload(`map${state.night}`,makeEnvironment(state.night));lastNight=state.night;camera=[state.player.x,state.player.z];const cx=state.night===2?35:0;lightVP=multiply(ortho(state.night===2?85:62),lookAt([cx-35,55,30],[cx,0,0]));}
    const ratio=Math.min(devicePixelRatio||1,1),w=Math.round(canvas.clientWidth*ratio),h=Math.round(canvas.clientHeight*ratio);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const p=state.player;camera[0]+=(p.x-camera[0])*.07;camera[1]+=(p.z-camera[1])*.07;
    const eye=[camera[0]+Math.sin(viewYaw)*range,range*.8+Math.max(0,p.y),camera[1]+Math.cos(viewYaw)*range],vp=multiply(perspective(w/h),lookAt(eye,[camera[0],Math.max(0,p.y)+.6,camera[1]])),records=[];lastVP=vp;
    const draw=(mesh,pos,scale,color,yaw=0,material=0,glow=0,tilt=0)=>records.push({mesh,pos,scale:typeof scale==='number'?[scale,scale,scale]:scale,color,yaw,material,glow,tilt});
    draw(`map${state.night}`,[0,0,0],[1,1,1],[1,1,1],0,-1);
    draw('cube',[0,-5.7,0],[600,.1,600],C.sea,0,5);
    const lights=[];
    for(const l of state.lanterns){draw('lantern',[l.x,l.y,l.z],[1,1,1],[1,1,1],0,-1);draw('paper',[l.x,l.y+2.5,l.z],[.85,1,.85],l.lit?C.lamp:C.unlit,0,4,l.lit?.9:0);if(l.lit)draw('orb',[l.x,l.y+2.5,l.z],.22,C.core,0,0,1);lights.push(l.x,l.lit?l.y+2.4:-100,l.z);
      if(l.lit)for(let i=0;i<3;i++){const a=i*2.094+time*.4;draw('orb',[l.x+Math.cos(a)*1.1,2+Math.sin(time+i)*.5,l.z+Math.sin(a)*1.1],.045,[1,.7,.22],0,0,1);}
    }
    for(const[i,f]of state.fireflies.entries()){const y=f.y+.65+Math.sin(time*2+i)*.18;draw('orb',[f.x,y,f.z],.09,C.mote,0,0,1);draw('orb',[f.x,y-.1,f.z],[.13,.015,.13],C.halo,0,0,.7);}
    for(const c of state.charms)if(c.available){draw('cube',[c.x,c.y+1+Math.sin(time*2)*.15,c.z],[.5,.8,.06],C.gold,time);draw('cube',[c.x,c.y+1+Math.sin(time*2)*.15,c.z+.04],[.4,.68,.06],C.red,time);}
    for(const d of state.drifters)if(d.state!=='removed'){for(let i=0;i<5;i++)draw('foliage',[d.x+Math.sin(time*4+i)*.3,d.y+i*.08,d.z+i*.35],[.23,.12,.6],C.drifter);}
    if(state.wind.warning||state.wind.active)for(let i=0;i<24;i++){const a=state.wind.dir_deg*Math.PI/180,t=(time*.7+i*.7)%12-6;draw('cube',[p.x+Math.cos(a)*t+Math.sin(i)*5,p.y+1+i%5*.4,p.z+Math.sin(a)*t+Math.cos(i)*5],[.12,.025,.25],C.gold,time+i);}
    for(const sh of state.shadows){const bob=Math.sin(time*3+sh.x)*.1,stunned=sh.state==='stunned';draw('sphere',[sh.x,sh.y+bob,sh.z],[.55,.85,.5],stunned?C.stunned:C.shade,0,6);for(let i=0;i<3;i++)draw('sphere',[sh.x+Math.sin(time*3+i)*.2,sh.y-.62,sh.z+i*.25],[.16,.1,.4],C.shade);const angle=Math.atan2(p.x-sh.x,p.z-sh.z);for(const side of[-1,1]){const ox=side*.17,oz=.43;draw('sphere',[sh.x+ox*Math.cos(angle)+oz*Math.sin(angle),sh.y+.25+bob,sh.z-ox*Math.sin(angle)+oz*Math.cos(angle)],[.075,.09,.045],stunned?[.5,.7,1]:C.rim,angle,0,1);}}
    // Mây: coat, sleeves, articulated limbs, sandals, face, woven conical hat.
    const characterStart=records.length;
    if(p.invulnerable<=0||Math.floor(time*12)%2===0){const yaw=p.facing,c=Math.cos(yaw),s=Math.sin(yaw),walk=p.moving?Math.sin(state.tick*.22):0,py=p.y??0;
      const local=(x,y,z)=>[p.x+x*c+z*s,py+y,p.z-x*s+z*c];
      for(const side of[-1,1]){const stride=walk*side*.24;draw('cylinder',local(side*.17,.39,stride),[.11,.58,.12],[.16,.2,.23],yaw,4,0,walk*side*.32);draw('sphere',local(side*.17,.1,stride+.08),[.13,.095,.22],[.17,.11,.075],yaw);draw('cylinder',local(side*.4,1.02,-stride*.6),[.11,.5,.12],C.coat,yaw,4,0,-walk*side*.25);draw('sphere',local(side*.42,.76,-stride*.6),[.095,.13,.09],[.65,.43,.27]);}
      draw('coat',local(0,.66,0),[.8,.9,.7],C.coat,yaw,4);draw('cylinder',local(0,.78,0),[.35,.08,.25],C.red,yaw,4);
      draw('cylinder',local(0,1.52,0),[.12,.22,.12],[.71,.49,.31]);draw('sphere',local(0,1.78,0),[.25,.31,.25],[.76,.54,.36],yaw);draw('sphere',local(0,1.86,-.1),[.26,.25,.19],[.06,.04,.035],yaw);
      for(const side of[-1,1]){draw('sphere',local(side*.1,1.82,.224),[.027,.037,.018],[.025,.024,.02],yaw);draw('sphere',local(side*.25,1.76,0),[.055,.08,.04],[.7,.46,.29],yaw);}
      draw('sphere',local(0,1.76,.255),[.047,.06,.04],[.72,.48,.3],yaw);
      draw('hat',local(0,2.03,0),[.65,.65,.65],[.66,.49,.24],yaw,2);
      for(let i=0;i<12;i++){const a=i*Math.PI/6;draw('cylinder',local(Math.cos(a)*.31,2.22,Math.sin(a)*.31),[.008,.46,.008],[.43,.31,.14],yaw-a,2,0,1.02);}
      const swing=Math.sin(time*3)*.07;draw('cylinder',local(.52,1.78,swing),[.014,.43,.014],[.22,.16,.09]);draw('paper',local(.52,1.43,swing),[.24,.29,.24],C.lamp,yaw,4,.9);for(const y of[1.25,1.61])draw('cylinder',local(.52,y,swing),[.09,.035,.09],[.3,.16,.07]);
    }
    const characterRecords=records.slice(characterStart);
    lights.push(p.x,1.5+(p.y??0),p.z);while(lights.length<24)lights.push(0,-100,0);
    if(p.pulseUntil>=state.simTick){const t=1-(p.pulseUntil-state.simTick)/45,r=.2+t*5;for(let i=0;i<32;i++){const a=i*Math.PI/16;draw('orb',[p.x+Math.cos(a)*r,.2,p.z+Math.sin(a)*r],[.06,.1,.06],[1,.73,.25],0,0,1);}}
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,null);gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.viewport(0,0,1024,1024);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);execute(records.filter(o=>o.material!==5&&o.glow<.8),depth,lightVP,time,lights,0);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.clearColor(...C.sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.bindTexture(gl.TEXTURE_2D,shadow);gl.useProgram(lit.p);gl.uniform3fv(lit.u.uEye,eye);execute(records,lit,vp,time,lights,.15+.55*state.lanterns.filter(l=>l.lit).length/state.lanterns.length);
    // Keep the prescribed ground-origin spawn visible below the raised central tier.
    if(state.night===3&&p.y<(topHeight(3,p.x,p.z)??0)-.1){gl.disable(gl.DEPTH_TEST);execute(characterRecords,lit,vp,time,lights,.15+.55*state.lanterns.filter(l=>l.lit).length/state.lanterns.length);gl.enable(gl.DEPTH_TEST);}
  }};
}
