// v1.2 survival controller: ordinary input only, never changes simulation state.
import {writeFile} from 'node:fs/promises';
import {createGame,step,distance} from '../src/game.mjs';
import {fuelOf,lightingCost} from '../src/lanterns.mjs';
let winning;const attempts=[];
for(const avoidance of[0,1,2]){for(const seed of[12,10,...Array.from({length:28},(_,i)=>i+1)]){
  const s=createGame(seed),frames=[];let last='';
  for(let t=0;t<14400&&!['won','lost'].includes(s.status);t++){
    const p=s.player,lit=s.lanterns.filter(l=>l.lit),off=s.lanterns.filter(l=>!l.lit),danger=s.shadows.filter(sh=>!['stunned','recoil','spawning'].includes(sh.state));
    const cost=o=>distance(o,p)+avoidance*danger.reduce((sum,sh)=>sum+Math.max(0,7-distance(o,sh))*2,0);
    const finalPhase=s.simTick>=180*60,prepared=s.lanterns.filter(l=>l.everLit).length>=3;
    const ready=off.filter(l=>lightingCost(l)-l.deposited<=p.inventory).sort((a,b)=>(a.everLit?0:1)-(b.everLit?0:1)||cost(a)-cost(b));
    let target;
    if(finalPhase){target=lit.length<3?ready[0]:null;if(!target&&p.inventory>0)target=lit.filter(l=>fuelOf(l)<35).sort((a,b)=>fuelOf(a)-fuelOf(b))[0];}
    else if(!prepared)target=ready[0];
    if(!target&&p.inventory<p.capacity)target=[...s.fireflies].sort((a,b)=>cost(a)-cost(b))[0];
    if(!target){const a=t*.006;target={x:Math.cos(a)*30,z:Math.sin(a)*30};}
    const d=distance(target,p);let dx=d>.2?(target.x-p.x)/d:0,dz=d>.2?(target.z-p.z)/d:0;
    if(avoidance)for(const sh of danger){const r=distance(sh,p);if(r<5&&r>.01){const strength=(5-r)/5*avoidance;dx+=(p.x-sh.x)/r*strength;dz+=(p.z-sh.z)/r*strength;}}
    const length=Math.max(1,Math.hypot(dx,dz));dx/=length;dz/=length;
    const interact=target.id?.startsWith('L')&&d<=1.9&&p.inventory>0&&(!target.lit||fuelOf(target)<90)&&!s.input.interact;
    const q={move:[dx,dz].map(v=>Math.round(v*1e6)/1e6),interact:!!interact,dash:p.dashCd===0&&p.dashTicks===0&&d>3&&!s.input.dash,
      pulse:!interact&&p.inventory>=3&&p.pulseCd===0&&danger.some(sh=>distance(p,sh)<4.5)&&!s.input.pulse};
    const json=JSON.stringify(q);if(json!==last){frames.push({tick:t,...q});last=json;}step(s,q);
  }
  attempts.push({seed,avoidance,status:s.status,reason:s.reason,ticks:s.tick,lit:s.lanterns.filter(l=>l.lit).length,lights:s.player.successfulLights,flames:s.player.health,score:s.score,carried:s.player.inventory});
  if(s.status==='won'){winning={seed,inputs:{frames},ticks:s.tick,score:s.score,flames:s.player.health,lit:s.lanterns.filter(l=>l.lit).length};break;}
}if(winning)break;}
if(!winning){console.log(JSON.stringify(attempts.sort((a,b)=>b.lit-a.lit||b.ticks-a.ticks).slice(0,10)));throw Error('No v1.2 default-world dawn victory found; never alter tuning to force a win');}
await writeFile('tests/scenarios/phase3-win.inputs.json',JSON.stringify(winning.inputs)+'\n');const{inputs,...meta}=winning;
await writeFile('tests/scenarios/phase3-win.meta.json',JSON.stringify(meta,null,2)+'\n');console.log(JSON.stringify(meta));
