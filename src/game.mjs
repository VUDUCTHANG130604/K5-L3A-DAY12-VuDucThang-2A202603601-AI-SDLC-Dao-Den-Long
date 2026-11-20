// One deterministic 60 Hz simulation shared by browser and contract CLI.
import {TUNING as T} from './tuning.mjs';
import {getMap,inBounds,groundBelow,topHeight,rampHeight,padAt,blockedByWall} from './maps.mjs';
export {TUNING} from './tuning.mjs';
export const RULES=Object.freeze({dt:1/60,speed:T.player_speed,pickupRadius:1,lightRadius:2,lanternCost:10,maxHealth:3,timeLimit:300});
export class FormatError extends Error{}
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v),num=v=>typeof v==='number'&&Number.isFinite(v),int=v=>Number.isSafeInteger(v)&&v>=0;
function check(ok,message){if(!ok)throw new FormatError(message);}
function pos(v){check(Array.isArray(v)&&v.length===3&&v.every(num),'pos must be three finite numbers');return{x:v[0],y:v[1],z:v[2]};}
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const direction=(a,b)=>{const d=distance(a,b);return d>1e-9?[(a.x-b.x)/d,(a.z-b.z)/d]:[1,0];};
const order=(a,b)=>a.id<b.id?-1:a.id>b.id?1:0;
const buttons=()=>({move:[0,0],cam_yaw_deg:0,jump:false,dash:false,interact:false,pulse:false,pause:false});
function random(s){let v=s.rng||1;v^=v<<13;v^=v>>>17;v^=v<<5;s.rng=v>>>0;return s.rng/4294967296;}
const pick=(s,list)=>list.length?list[Math.floor(random(s)*list.length)]:null;
function emit(s,name,data={}){s.events.push({type:'event',tick:s.tick,name,data});}
function aliases(p){p.invulnerable=p.invulnTicks/60;p.pulseCooldown=p.pulseCd/60;}
function mote(s,p,kind='random',ttl=0){return{id:`M${s.nextMote++}`,...p,kind,ttl,collected:false,born:s.simTick};}
function shade(s,p,id=`S${s.nextShade++}`){return{id,...p,state:'chase',stateTicks:0,stunTicks:0,pushTicks:0,recoilTicks:0,pushDir:[1,0],ejectTicks:0,heading:random(s)*Math.PI*2};}
function drifter(s,p,id=`D${s.nextDrifter++}`){return{id,...p,state:'idle',stolen:0,stateTicks:0,fleeDir:[1,0],heading:random(s)*Math.PI*2,born:s.simTick};}
export function createGame(seed=12,scenario={},night=1){
  check(Number.isSafeInteger(seed),'seed must be integer');check(obj(scenario),'scenario must be object');check([1,2,3].includes(night),'night must be 1, 2 or 3');const map=getMap(night);
  const s={seed,rng:seed>>>0||1,night,tick:0,simTick:0,status:'playing',reason:null,score:0,timeStart:T[`night${night}_duration_s`],started:false,
    input:buttons(),events:[],nextMote:1,nextShade:1,nextDrifter:1,windEnabled:true,wind:{active:false,dir_deg:0,warning:false},
    randomMotes:true,randomShades:true,randomDrifters:true,
    player:{x:0,y:0,z:0,vx:0,vy:0,vz:0,grounded:true,facing:0,moving:false,health:3,inventory:0,invulnTicks:0,dashCd:0,pulseCd:0,charmTicks:0,dashTicks:0,dashDir:[0,1],launch:null,respawnTicks:0,pulseUntil:-1},
    lanterns:map.lanterns.map(l=>({id:l.id,...pos(l.pos),lit:false,deposited:0})),fireflies:[],shadows:[],drifters:[],charms:map.charms.map(c=>({id:c.id,...pos(c.pos),available:true,respawnTicks:0}))};
  for(const [key,target]of [['random_motes','randomMotes'],['random_shades','randomShades'],['random_drifters','randomDrifters'],['wind_enabled','windEnabled']])if(key in scenario){check(typeof scenario[key]==='boolean',`${key} must be boolean`);s[target]=scenario[key];}
  if('player'in scenario){const v=scenario.player;check(obj(v),'player must be object');if('pos'in v){Object.assign(s.player,pos(v.pos));s.player.grounded=groundBelow(night,s.player.x,s.player.z,s.player.y)!==null&&Math.abs((groundBelow(night,s.player.x,s.player.z,s.player.y)??-999)-s.player.y)<1e-6;}
    for(const[k,t,max]of [['carried','inventory',10],['flames','health',3],['invuln_ticks','invulnTicks',Infinity],['dash_cd_ticks','dashCd',Infinity],['pulse_cd_ticks','pulseCd',Infinity],['charm_ticks','charmTicks',Infinity]])if(k in v){check(int(v[k])&&v[k]<=max,`invalid player.${k}`);s.player[t]=v[k];}}
  if('time_left_s'in scenario){check(num(scenario.time_left_s)&&scenario.time_left_s>=0,'invalid time_left_s');s.timeStart=scenario.time_left_s;}
  if('lanterns'in scenario){check(Array.isArray(scenario.lanterns),'lanterns must be array');const ids=new Set();for(const v of scenario.lanterns){check(obj(v),'invalid lantern');const l=s.lanterns.find(l=>l.id===v.id);check(l&&!ids.has(v.id),'unknown/duplicate lantern id');ids.add(v.id);if('pos'in v)Object.assign(l,pos(v.pos));if('deposited'in v){check(int(v.deposited)&&v.deposited<=10,'invalid deposited');l.deposited=v.deposited;}if('lit'in v){check(typeof v.lit==='boolean','lit must be boolean');l.lit=v.lit;}if(l.deposited===10)l.lit=true;if(l.lit)l.deposited=10;}}
  if('motes'in scenario){check(Array.isArray(scenario.motes),'motes must be array');s.fireflies=scenario.motes.map(v=>{if(Array.isArray(v))return mote(s,pos(v));check(obj(v),'invalid mote');if('ttl_s'in v&&v.ttl_s!==null)check(num(v.ttl_s)&&v.ttl_s>=0,'invalid ttl_s');const f=mote(s,pos(v.pos),v.kind??'random',v.kind==='dropped'?Math.round((v.ttl_s??8)*60):0);check(['random','dropped'].includes(f.kind),'invalid mote kind');if(v.id!==undefined){check(typeof v.id==='string'&&v.id.length>0,'invalid mote id');f.id=v.id;}return f;});}
  else if(s.randomMotes){const points=[...map.motePoints];for(let i=0;i<20;i++){const p=pick(s,points);points.splice(points.indexOf(p),1);s.fireflies.push(mote(s,pos(p)));}}
  if('shades'in scenario){check(Array.isArray(scenario.shades),'shades must be array');s.shadows=scenario.shades.map((v,i)=>{check(obj(v),'invalid shade');const sh=shade(s,pos(v.pos),v.id??`S${i+1}`);sh.state=v.state??'chase';check(['spawning','wander','chase','recoil','stunned'].includes(sh.state),'invalid shade state');if('state_ticks_left'in v)check(int(v.state_ticks_left),'invalid state_ticks_left');sh.stateTicks=v.state_ticks_left??0;if(sh.state==='stunned')sh.stunTicks=sh.stateTicks;if(sh.state==='recoil')sh.recoilTicks=sh.stateTicks;return sh;});s.nextShade=nextId(s.shadows,'S');}
  if('drifters'in scenario){check(Array.isArray(scenario.drifters),'drifters must be array');s.drifters=scenario.drifters.map((v,i)=>{check(obj(v),'invalid drifter');const d=drifter(s,pos(v.pos),v.id??`D${i+1}`);d.state=v.state??'idle';check(['idle','chase','flee','removed'].includes(d.state),'invalid drifter state');check(v.stolen===undefined||int(v.stolen),'invalid stolen');d.stolen=v.stolen??0;check(v.state_ticks_left===undefined||int(v.state_ticks_left),'invalid drifter timer');d.stateTicks=v.state_ticks_left??(d.state==='flee'?240:0);d.fleeDir=direction(d,s.player);return d;});s.nextDrifter=nextId(s.drifters,'D');}
  if('charms'in scenario){check(Array.isArray(scenario.charms),'charms must be array');s.charms=scenario.charms.map((v,i)=>{check(obj(v),'invalid charm');const fallback=map.charms.find(c=>c.id===v.id);check(v.pos||fallback,'charm requires pos');check(v.available===undefined||typeof v.available==='boolean','invalid available');check(v.respawn_ticks===undefined||int(v.respawn_ticks),'invalid respawn_ticks');check(v.respawn_s===undefined||num(v.respawn_s)&&v.respawn_s>=0,'invalid respawn_s');return{id:v.id??`C${i+1}`,...pos(v.pos??fallback.pos),available:v.available??true,respawnTicks:v.respawn_ticks??Math.round((v.respawn_s??(v.available===false?45:0))*60)};});}
  for(const list of [s.fireflies,s.shadows,s.drifters,s.charms]){check(list.every(v=>typeof v.id==='string'&&v.id.length>0),'invalid entity id');check(new Set(list.map(v=>v.id)).size===list.length,'duplicate entity id');}
  s.nextMote=nextId(s.fireflies,'M');aliases(s.player);return s;
}
function nextId(list,prefix){return Math.max(0,...list.map(v=>Number(v.id.startsWith(prefix)?v.id.slice(1):0)||0))+1;}
export function validateFrames(file){check(obj(file)&&Array.isArray(file.frames),'inputs must contain frames');let previous=-1;for(const f of file.frames){check(obj(f)&&int(f.tick)&&f.tick>previous,'frame ticks must strictly increase');previous=f.tick;if('move'in f)check(Array.isArray(f.move)&&f.move.length===2&&f.move.every(v=>num(v)&&Math.abs(v)<=1),'invalid move');if('cam_yaw_deg'in f)check(num(f.cam_yaw_deg),'invalid cam_yaw_deg');for(const k of ['jump','interact','pulse','dash','pause'])if(k in f)check(typeof f[k]==='boolean',`${k} must be boolean`);}return file.frames;}
export const timeLeft=s=>Math.max(0,s.timeStart-s.simTick/60);
function finish(s,state,reason){s.status=state;s.reason=reason;if(state==='won')s.score+=Math.floor(timeLeft(s))*2+s.player.health*50;emit(s,'game_over',{result:state,reason});}
function nearby(p,f,r=1){return distance(p,f)<=r&&Math.abs(p.y-f.y)<=1.5;}
function dropped(s,count,x,y,z,scatter=true){for(let i=0;i<count;i++){const a=random(s)*Math.PI*2,r=scatter?1.5+random(s):0;s.fireflies.push(mote(s,{x:x+Math.cos(a)*r,y,z:z+Math.sin(a)*r},'dropped',480));}}
function wind(s){const t=s.simTick,phase=t%1800;if(s.night!==3||!s.windEnabled){s.wind.active=false;s.wind.warning=false;return;}if(phase===1680)s.wind.dir_deg=random(s)*360;s.wind.warning=phase>=1680;s.wind.active=t>=1800&&phase<300;}
function movePlayer(s,input,previous){const p=s.player;if(p.respawnTicks>0||p.health<=0){p.vx=p.vy=p.vz=0;return;}
  let [x,z]=input.move,l=Math.max(1,Math.hypot(x,z));x/=l;z/=l;const a=(input.cam_yaw_deg%360)*Math.PI/180,dx=x*Math.cos(a)+z*Math.sin(a),dz=-x*Math.sin(a)+z*Math.cos(a);p.moving=Math.hypot(dx,dz)>0;
  if(p.moving)p.facing=Math.atan2(dx,dz);
  const pad=p.grounded?padAt(s.night,p.x,p.y,p.z):null;
  if(pad){const dir=pad.direction??direction({x:pad.target[0],z:pad.target[2]},p);p.launch=[dir[0]*pad.speed,dir[1]*pad.speed];p.vy=pad.vy;p.grounded=false;}
  else if(input.jump&&!previous.jump&&p.grounded){p.vy=7;p.grounded=false;}
  if(input.dash&&!previous.dash&&p.dashTicks===0&&(p.dashCd===0||p.charmTicks>0)){p.dashDir=p.moving?[dx/Math.hypot(dx,dz),dz/Math.hypot(dx,dz)]:[Math.sin(p.facing),Math.cos(p.facing)];p.dashTicks=12;p.dashCd=p.charmTicks>0?0:90;emit(s,'dash');}
  const speed=p.charmTicks>0?7.2:6;p.vx=p.launch?.[0]??dx*speed;p.vz=p.launch?.[1]??dz*speed;
  const old={x:p.x,y:p.y,z:p.z},dashing=p.dashTicks>0;
  if(dashing){p.vx=p.dashDir[0]*14;p.vz=p.dashDir[1]*14;p.dashTicks--;}
  if(s.wind.active){const a=s.wind.dir_deg*Math.PI/180;p.vx+=Math.cos(a)*2;p.vz+=Math.sin(a)*2;}
  const next={x:p.x+p.vx/60,y:p.y,z:p.z+p.vz/60};
  if(!blockedByWall(s.night,old,next)){p.x=next.x;p.z=next.z;}else{p.vx=p.vz=0;}
  const ramp=s.night===3?rampHeight(p.x,p.z):null,ground=groundBelow(s.night,p.x,p.z,old.y+.12);
  if(p.grounded&&ramp!==null&&Math.abs(ramp-old.y)<=.12)p.y=ramp;
  else if(p.grounded&&ground!==null&&Math.abs(ground-old.y)<.08)p.y=ground;
  else p.grounded=false;
  if(!p.grounded&&!dashing){p.vy-=20/60;const y=p.y+p.vy/60,floor=groundBelow(s.night,p.x,p.z,old.y);if(p.vy<=0&&floor!==null&&y<=floor){p.y=floor;p.vy=0;p.grounded=true;p.launch=null;}else p.y=y;}
  if(p.grounded)p.vy=0;
  if(p.y< -10){const lost=p.inventory;p.health--;p.inventory=0;p.respawnTicks=p.health>0?60:0;p.launch=null;p.dashTicks=0;p.vx=p.vy=p.vz=0;emit(s,'player_hit',{by:'fall',flames:p.health,dropped:0,lost});}
}
function safeZones(s){for(const sh of s.shadows){const l=s.lanterns.find(l=>l.lit&&distance(l,sh)<6-1e-8);if(l&&!sh.ejectTicks)sh.ejectTicks=30;}}
function enemyMove(s,sh,dx,dz){const oldGround=topHeight(s.night,sh.x,sh.z)??0,from={x:sh.x,y:sh.y-.8,z:sh.z},next={x:sh.x+dx,y:from.y,z:sh.z+dz};if(!inBounds(s.night,next.x,next.z)||blockedByWall(s.night,from,next))return;
  for(const l of s.lanterns)if(l.lit&&distance(sh,l)>=6-1e-8&&Math.hypot(next.x-l.x,next.z-l.z)<6){const [nx,nz]=direction(next,l);next.x=l.x+nx*6;next.z=l.z+nz*6;}
  sh.x=next.x;sh.z=next.z;sh.y+=(topHeight(s.night,sh.x,sh.z)??oldGround)-oldGround;
}
function pulse(s){const p=s.player;if(p.inventory<3||p.pulseCd>0||p.respawnTicks>0)return;p.inventory-=3;p.pulseCd=180;p.pulseUntil=s.simTick+45;const ids=[];
  const hit=sh=>Math.hypot(sh.x-p.x,sh.y-(p.y+.8),sh.z-p.z)<=5;
  for(const sh of s.shadows)if(hit(sh)){sh.state='stunned';sh.stunTicks=120;sh.pushTicks=15;sh.pushDir=direction(sh,p);ids.push(sh.id);s.score+=5;}
  for(const d of s.drifters)if(d.state!=='removed'&&hit(d)){if(d.state==='chase'){d.state='flee';d.stateTicks=240;d.fleeDir=direction(d,p);}else if(d.state==='flee'&&d.stolen>0){emit(s,'drifter_drop',{drifter_id:d.id,amount:d.stolen});dropped(s,d.stolen,d.x,Math.max(0,d.y-.8),d.z,false);d.stolen=0;d.stateTicks=120;}}
  emit(s,'pulse',{stunned_ids:ids});
}
function moveShades(s){const p=s.player;for(const sh of s.shadows){
  const pushed=sh.pushTicks>0;if(pushed){enemyMove(s,sh,sh.pushDir[0]*4/15,sh.pushDir[1]*4/15);sh.pushTicks--;sh.state='stunned';}
  if(sh.ejectTicks>0){const lamp=s.lanterns.find(l=>l.lit&&distance(l,sh)<6-1e-8);if(lamp){const d=distance(lamp,sh),dir=direction(sh,lamp),amount=(6-d)/sh.ejectTicks;sh.x+=dir[0]*amount;sh.z+=dir[1]*amount;sh.ejectTicks--;continue;}sh.ejectTicks=0;}
  if(pushed)continue;
  if(sh.stunTicks>0){sh.state='stunned';continue;}
  if(sh.state==='recoil'||sh.recoilTicks>0){sh.state=sh.recoilTicks>0?'recoil':'wander';enemyMove(s,sh,sh.pushDir[0]*2/60,sh.pushDir[1]*2/60);continue;}
  if(sh.state==='spawning'&&sh.stateTicks>0)continue;
  if(['stunned','spawning','recoil'].includes(sh.state))sh.state='wander';
  const d=distance(p,sh);if(d<=12)sh.state='chase';else if(d>18)sh.state='wander';const speed=s.night===3?4.5:4;
  if(sh.state==='chase'){if(d>0)enemyMove(s,sh,(p.x-sh.x)/d*Math.min(speed/60,d),(p.z-sh.z)/d*Math.min(speed/60,d));}
  else{const x=sh.x,z=sh.z;enemyMove(s,sh,Math.cos(sh.heading)*speed/60,Math.sin(sh.heading)*speed/60);if(x===sh.x&&z===sh.z)sh.heading+=Math.PI*.7;}
}}
function moveDrifters(s){const p=s.player;for(const d of s.drifters){if(d.state==='removed')continue;if(d.state==='flee'){if(d.stateTicks<=0){d.state='removed';d.stolen=0;continue;}d.x+=d.fleeDir[0]*7/60;d.z+=d.fleeDir[1]*7/60;continue;}
  d.state=p.inventory>=5&&distance(p,d)<=15?'chase':'idle';if(d.state==='chase'){const [x,z]=direction(p,d);d.x+=x*7/60;d.z+=z*7/60;}else{d.heading+=.01;d.x+=Math.cos(d.heading)*2/60;d.z+=Math.sin(d.heading)*2/60;}
}}
function collisions(s){const p=s.player;if(p.respawnTicks>0||p.health<=0)return;
  for(const d of [...s.drifters].sort(order))if(d.state==='chase'&&distance(p,d)<=1.2){const amount=Math.min(3,p.inventory);p.inventory-=amount;d.stolen=amount;d.state='flee';d.stateTicks=240;d.fleeDir=direction(d,p);emit(s,'drifter_steal',{drifter_id:d.id,amount,carried:p.inventory});}
  if(s.lanterns.some(l=>l.lit&&distance(p,l)<=6))return;
  if(p.invulnTicks>0)return;
  for(const sh of [...s.shadows].sort(order))if(!['spawning','stunned','recoil'].includes(sh.state)&&sh.ejectTicks===0&&distance(p,sh)<=1&&Math.abs(p.y-sh.y)<=1.5){p.health--;const n=Math.floor(p.inventory/2);p.inventory-=n;dropped(s,n,p.x,p.y,p.z);p.invulnTicks=90;sh.recoilTicks=60;sh.state='recoil';sh.pushDir=direction(sh,p);emit(s,'player_hit',{by:'shade',flames:p.health,dropped:n});break;}
}
function spawns(s){const map=getMap(s.night),t=s.simTick;
  if(s.randomMotes&&t%240===0&&s.fireflies.length<30){const free=map.motePoints.filter(v=>!s.fireflies.some(f=>f.kind==='random'&&Math.hypot(f.x-v[0],f.y-v[1],f.z-v[2])<.01));const p=pick(s,free);if(p)s.fireflies.push(mote(s,pos(p)));}
  const schedule=map.shadeSchedule;if(s.randomShades&&t>=schedule.first&&(t-schedule.first)%schedule.every===0){const count=t===schedule.first?2:1;for(let i=0;i<count&&s.shadows.length<schedule.limit;i++){const free=map.shadePoints.filter(v=>Math.hypot(v[0]-s.player.x,v[2]-s.player.z)>=15&&!s.lanterns.some(l=>l.lit&&Math.hypot(l.x-v[0],l.z-v[2])<6)&&!s.shadows.some(sh=>Math.hypot(sh.x-v[0],sh.z-v[2])<1));const p=pick(s,free);if(!p)break;const sh=shade(s,{x:p[0],y:p[1]+.8,z:p[2]});sh.state='spawning';s.shadows.push(sh);emit(s,'shade_spawned',{id:sh.id});}}
  if(s.night>1&&s.randomDrifters&&t%1200===0&&s.drifters.filter(d=>d.state!=='removed').length<2){const p=pick(s,map.shadePoints);s.drifters.push(drifter(s,{x:p[0],y:p[1]+.8,z:p[2]}));}
}
export function step(s,patch={}){
  if(['won','lost'].includes(s.status))return s;const prev=s.input,input={...prev,...patch};s.input=input;s.events=[];s.tick++;
  if(input.pause&&!prev.pause){s.status=s.status==='paused'?'playing':'paused';emit(s,s.status==='paused'?'paused':'resumed');}
  if(s.status==='paused')return s;
  s.simTick++;if(!s.started){s.started=true;emit(s,'night_start',{night:s.night});}
  const p=s.player;for(const k of ['invulnTicks','dashCd','pulseCd','charmTicks'])p[k]=Math.max(0,p[k]-1);
  if(p.respawnTicks>0&&--p.respawnTicks===0){Object.assign(p,{x:0,y:0,z:0,vx:0,vy:0,vz:0,grounded:true,invulnTicks:90});}
  for(const sh of s.shadows)for(const k of ['stateTicks','stunTicks','recoilTicks'])sh[k]=Math.max(0,sh[k]-1);
  for(const d of s.drifters)if(d.state==='flee')d.stateTicks=Math.max(0,d.stateTicks-1);
  s.fireflies=s.fireflies.filter(f=>f.kind!=='dropped'||--f.ttl>0);
  for(const c of s.charms)if(!c.available&&c.respawnTicks>0&&--c.respawnTicks===0)c.available=true;
  wind(s);movePlayer(s,input,prev);
  if(p.respawnTicks===0&&p.health>0){for(const f of s.fireflies)if(p.inventory<10&&nearby(p,f)){f.collected=true;p.inventory++;emit(s,'mote_picked',{carried:p.inventory});}s.fireflies=s.fireflies.filter(f=>!f.collected);
    for(const c of s.charms)if(c.available&&nearby(p,c)){c.available=false;c.respawnTicks=2700;p.charmTicks=600;p.dashCd=0;emit(s,'charm_picked',{charm_id:c.id,charm_ticks:600});}
    if(input.interact&&!prev.interact){const l=s.lanterns.filter(l=>!l.lit&&distance(p,l)<=2).sort((a,b)=>distance(p,a)-distance(p,b)||order(a,b))[0];if(l&&p.inventory>0){const amount=Math.min(p.inventory,10-l.deposited);p.inventory-=amount;l.deposited+=amount;s.score+=amount*10;emit(s,'deposit',{lantern_id:l.id,amount,deposited:l.deposited});if(l.deposited===10){l.lit=true;s.score+=100;emit(s,'lantern_lit',{lantern_id:l.id});}}}
  }
  safeZones(s);if(input.pulse&&!prev.pulse)pulse(s);moveShades(s);moveDrifters(s);collisions(s);spawns(s);aliases(p);
  if(p.health<=0)finish(s,'lost','no_flames');else if(s.lanterns.every(l=>l.lit))finish(s,'won','all_lit');else if(timeLeft(s)<=0)finish(s,'lost','dawn');return s;
}
export const snapshot=s=>JSON.parse(JSON.stringify(s));
const round=v=>Math.round(v*1000)/1000||0,position=v=>[round(v.x),round(v.y),round(v.z)];
export function contractSnapshot(s){const p=s.player;return{type:'snapshot',tick:s.tick,sim_tick:s.simTick,night:s.night,state:s.status,time_left_s:timeLeft(s),score:s.score,wind:{active:s.wind.active,dir_deg:s.wind.dir_deg},
  player:{pos:position(p),vel:[round(p.vx),round(p.vy),round(p.vz)],grounded:p.grounded,flames:p.health,carried:p.inventory,invuln:p.invulnTicks>0,dash_cd_s:p.dashCd/60,pulse_cd_s:p.pulseCd/60,charm_s:p.charmTicks/60},
  lanterns:s.lanterns.map(l=>({id:l.id,pos:position(l),lit:l.lit,deposited:l.deposited})),shades:s.shadows.map(sh=>({id:sh.id,pos:position(sh),state:sh.state})),
  motes_active:s.fireflies.length,motes:s.fireflies.map(f=>({id:f.id,pos:position(f),kind:f.kind,ttl_s:f.kind==='dropped'?f.ttl/60:null})),
  drifters:s.drifters.map(d=>({id:d.id,pos:position(d),state:d.state,stolen:d.stolen})),charms:s.charms.map(c=>({id:c.id,available:c.available,respawn_s:c.respawnTicks/60}))};}
