// Fuel is stored as integer sixtieths. Never round gameplay thresholds.
import {TUNING as T} from './tuning.mjs';
const MAX=T.fuel_max*60,LOW=T.low_fuel_threshold*60;
export const fuelOf=l=>l.lit?l.fuelUnits/60:0;
export const fuelOutput=l=>Math.round(fuelOf(l)*10)/10;
export const capacityOf=p=>Math.min(T.capacity_max,T.carry_capacity+2*p.successfulLights);
export const lightingCost=l=>l.everLit?T.relight_cost:T.lantern_cost;
export const isSafeLamp=l=>l.lit&&l.fuelUnits>=LOW;
export const acceptsLight=l=>!l.lit||l.fuelUnits<MAX;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function selectLantern(s){return s.lanterns.filter(l=>acceptsLight(l)&&distance(l,s.player)<=T.interact_radius).sort((a,b)=>distance(a,s.player)-distance(b,s.player)||(a.id<b.id?-1:a.id>b.id?1:0))[0]??null;}
export function tickFuel(s,emit){
  const active=new Map();
  for(const sh of s.shadows){const l=sh.state==='drain'?s.lanterns.find(l=>l.id===sh.targetLanternId&&l.lit&&distance(l,sh)<=2):null;
    if(l){const list=active.get(l)??[];list.push(sh);active.set(l,list);sh.drainTicks++;}else sh.drainTicks=0;
  }
  for(const l of s.lanterns)if(l.lit){const drainers=active.get(l)??[];l.fuelUnits=Math.max(0,l.fuelUnits-T.fuel_decay_per_s-T.drain_per_s*drainers.length);
    for(const sh of drainers)if(sh.drainTicks%60===0)emit(s,'fuel_drain',{lantern_id:l.id,shade_id:sh.id,fuel:fuelOutput(l)});
    if(l.fuelUnits===0){l.lit=false;l.deposited=0;l.everLit=true;emit(s,'lantern_out',{lantern_id:l.id});}
  }
}
export function interactLantern(s,emit){const p=s.player,l=selectLantern(s);if(!l||p.inventory===0)return;
  if(l.lit){const used=Math.min(p.inventory,Math.ceil((MAX-l.fuelUnits)/(T.fuel_per_mote*60)));if(used===0)return;
    p.inventory-=used;l.fuelUnits=Math.min(MAX,l.fuelUnits+used*T.fuel_per_mote*60);s.score+=used*T.score.per_mote;emit(s,'refuel',{lantern_id:l.id,amount:used,fuel:fuelOutput(l)});return;
  }
  const cost=lightingCost(l),amount=Math.min(p.inventory,cost-l.deposited);if(amount<=0)return;
  p.inventory-=amount;l.deposited+=amount;s.score+=amount*T.score.per_mote;emit(s,'deposit',{lantern_id:l.id,amount,deposited:l.deposited});
  if(l.deposited===cost){const relight=l.everLit;l.lit=true;l.fuelUnits=MAX;l.everLit=true;if(relight)l.relitCount++;p.successfulLights++;
    s.score+=relight?T.score.per_relight:T.score.per_lantern;emit(s,'lantern_lit',{lantern_id:l.id,relight});
  }
}
