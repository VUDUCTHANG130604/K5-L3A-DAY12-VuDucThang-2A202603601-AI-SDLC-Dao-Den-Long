// Explicit migration: unchanged v1.1 feature inputs remain regressions. Old early-win
// fixtures/time limits are replaced below, not silently skipped by the test runner.
import {fixtures as phase2} from './phase2-fixtures.mjs';
const clean={random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false};
export const fixtures=Object.fromEntries(['movement','dash','pause','fall','pad2','pad3','ramp','drifter','drifter-drop','charm','wind','spawn'].map(k=>[k,structuredClone(phase2[k])]));
Object.assign(fixtures,{
  'fuel-expiry':{scenario:{...clean,lanterns:[{id:'L1',lit:true}]},ticks:6001},
  'fuel-pause':{scenario:{...clean,lanterns:[{id:'L1',lit:true,fuel:20}]},inputs:{frames:[{tick:0,pause:true},{tick:1,pause:false},{tick:120,pause:true}]},ticks:121},
  refuel:{scenario:{...clean,player:{carried:10},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:80}]},inputs:{frames:[{tick:0,interact:true}]},ticks:1},
  relight:{scenario:{...clean,player:{carried:5},lanterns:[{id:'L1',pos:[0,0,0],ever_lit:true}]},inputs:{frames:[{tick:0,interact:true}]},ticks:1},
  'relight-cycle':{scenario:{...clean,player:{carried:10},motes:Array.from({length:20},()=>[0,0,0]),lanterns:[{id:'L1',pos:[0,0,0]}]},inputs:{frames:[{tick:0,interact:true},{tick:1,interact:false},{tick:6001,interact:true},{tick:6002,interact:false},{tick:12002,interact:true}]},ticks:12003},
  'drain-stack':{scenario:{...clean,player:{pos:[-20,0,-20]},lanterns:[{id:'L1',pos:[20,0,0],lit:true,fuel:29}],shades:[{id:'S1',pos:[20,.8,0],state:'drain',target_lantern_id:'L1'},{id:'S2',pos:[20,.8,1],state:'drain',target_lantern_id:'L1'}]},ticks:60},
  'drain-pulse':{scenario:{...clean,player:{pos:[17,0,0],carried:3},lanterns:[{id:'L1',pos:[20,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[20,.8,0],state:'drain',target_lantern_id:'L1'}]},inputs:{frames:[{tick:0,pulse:true}]},ticks:121},
  'safe-restore':{scenario:{...clean,player:{pos:[20,0,0],carried:2},lanterns:[{id:'L1',pos:[20,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[20,.8,0],state:'drain',target_lantern_id:'L1'}]},inputs:{frames:[{tick:0,interact:true}]},ticks:30},
  'no-early-win':{scenario:{...clean,lanterns:Array.from({length:5},(_,i)=>({id:`L${i+1}`,lit:true}))},ticks:60},
  'dawn-extinguish':{scenario:{...clean,time_left_s:1/60,lanterns:[{id:'L1',lit:true,fuel:1/60},{id:'L2',lit:true},{id:'L3',lit:true}]},ticks:1},
  'dawn-final-relight':{scenario:{...clean,time_left_s:1/60,player:{carried:5},lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:1/60},{id:'L2',lit:true},{id:'L3',lit:true}]},inputs:{frames:[{tick:0,interact:true}]},ticks:1}
});
for(const night of[1,2,3]){
  fixtures[`timeout-${night}`]={night,scenario:clean,ticks:(210+30*night)*60};
  fixtures[`win-${night}`]={night,scenario:{...clean,time_left_s:2,lanterns:Array.from({length:Math.ceil((night+4)*.6)},(_,i)=>({id:`L${i+1}`,lit:true,fuel:80}))},ticks:120};
  fixtures[`threshold-lost-${night}`]={night,scenario:{...clean,time_left_s:1/60,lanterns:Array.from({length:Math.ceil((night+4)*.6)-1},(_,i)=>({id:`L${i+1}`,lit:true}))},ticks:1};
}
