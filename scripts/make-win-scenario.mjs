// Search for a reproducible ordinary-input win; never edits game state.
import {writeFile} from 'node:fs/promises';
import {createGame,step,distance} from '../src/game.mjs';
let winning;
for(const avoidance of [0,1,2]){for(const seed of [12,...Array.from({length:24},(_,i)=>i+1)]){
  const s=createGame(seed),frames=[];let last='';
  for(let t=0;t<18000&&!['won','lost'].includes(s.status);t++){
    const p=s.player,lamps=s.lanterns.filter(l=>!l.lit),ready=lamps.filter(l=>10-l.deposited<=p.inventory),danger=s.shadows.filter(sh=>!['stunned','recoil','spawning'].includes(sh.state));
    const nearby=lamps.filter(l=>distance(l,p)<=1.9).sort((a,b)=>distance(a,p)-distance(b,p))[0];
    const cost=o=>distance(o,p)+avoidance*danger.reduce((sum,sh)=>sum+Math.max(0,7-distance(o,sh))*3,0);
    let target=ready.length?ready.sort((a,b)=>cost(a)-cost(b))[0]:[...s.fireflies].sort((a,b)=>cost(a)-cost(b))[0];
    if(!target)target=s.lanterns.filter(l=>l.lit).sort((a,b)=>distance(a,p)-distance(b,p))[0]??{x:0,z:0};
    const d=distance(target,p);let dx=d>.2?(target.x-p.x)/d:0,dz=d>.2?(target.z-p.z)/d:0;
    if(avoidance)for(const sh of danger){const r=distance(sh,p);if(r<5&&r>.01){const strength=(5-r)/5*avoidance;dx+=(p.x-sh.x)/r*strength;dz+=(p.z-sh.z)/r*strength;}}
    const r=Math.hypot(dx,dz);if(r>1){dx/=r;dz/=r;}
    const q={move:[dx,dz].map(v=>Math.round(v*1e6)/1e6),interact:!!nearby&&p.inventory>0&&!s.input.interact,dash:p.dashCd===0&&p.dashTicks===0&&d>3&&!s.input.dash,pulse:p.inventory>=3&&p.pulseCd===0&&danger.some(sh=>distance(p,sh)<4.5)&&!s.input.pulse};
    const json=JSON.stringify(q);if(json!==last){frames.push({tick:t,...q});last=json;}step(s,q);
  }
  if(s.status==='won'){winning={seed,inputs:{frames},ticks:s.tick,score:s.score,flames:s.player.health};break;}
}if(winning)break;}
if(!winning)throw Error('No default-world win found; do not claim a successful replay');
await writeFile('tests/scenarios/win.inputs.json',JSON.stringify(winning.inputs)+'\n');
await writeFile('tests/scenarios/win.meta.json',JSON.stringify({seed:winning.seed,ticks:winning.ticks,score:winning.score,flames:winning.flames},null,2)+'\n');
console.log(JSON.stringify({seed:winning.seed,ticks:winning.ticks,score:winning.score,flames:winning.flames}));
