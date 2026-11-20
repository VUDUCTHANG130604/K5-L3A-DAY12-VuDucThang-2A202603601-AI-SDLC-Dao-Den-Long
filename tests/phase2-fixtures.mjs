const clean={random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false};
export const fixtures={
  movement:{scenario:clean,inputs:{frames:[{tick:0,move:[0,1]},{tick:60,move:[0,0]}]},ticks:120},
  dash:{scenario:clean,inputs:{frames:[{tick:0,dash:true},{tick:12,dash:false}]},ticks:12},
  pause:{scenario:{...clean,player:{charm_ticks:100},motes:[{pos:[10,0,0],kind:'dropped',ttl_s:8}]},inputs:{frames:[{tick:0,pause:true},{tick:1,pause:false},{tick:100,pause:true}]},ticks:110},
  fall:{scenario:{...clean,player:{pos:[41,-11,0],carried:10,invuln_ticks:900}},ticks:61},
  pad2:{night:2,scenario:{...clean,player:{pos:[20,0,18]}},inputs:{frames:[{tick:0,move:[-1,0]}]},ticks:84},
  pad3:{night:3,scenario:{...clean,player:{pos:[0,3,13]}},ticks:60},
  ramp:{night:3,scenario:{...clean,player:{pos:[30*Math.cos(Math.PI/6),0,15]}},inputs:{frames:[{tick:0,move:[-Math.cos(Math.PI/6),-.5]}]},ticks:60},
  drifter:{night:2,scenario:{...clean,player:{carried:10,invuln_ticks:100},drifters:[{id:'D1',pos:[0,.8,0]}]},ticks:241},
  'drifter-drop':{night:2,scenario:{...clean,player:{carried:3},drifters:[{id:'D1',pos:[2,.8,0],state:'flee',stolen:3,state_ticks_left:240}]},inputs:{frames:[{tick:0,pulse:true}]},ticks:121},
  charm:{night:2,scenario:{...clean,charms:[{id:'C1',pos:[0,0,0]}]},inputs:{frames:[{tick:1,dash:true,move:[1,0]},{tick:13,move:[0,0],dash:false}]},ticks:2701},
  wind:{night:3,scenario:{...clean,wind_enabled:true,player:{pos:[35,0,0]}},ticks:2100},
  spawn:{night:2,scenario:{random_motes:true,random_shades:true,random_drifters:true,player:{invuln_ticks:10000}},ticks:3600},
  'timeout-1':{night:1,scenario:clean,ticks:18000},'timeout-2':{night:2,scenario:clean,ticks:19800},'timeout-3':{night:3,scenario:clean,ticks:21600}
};
for(const night of [1,2,3])fixtures[`win-${night}`]={night,scenario:{...clean,player:{carried:10},lanterns:Array.from({length:night+4},(_,i)=>({id:`L${i+1}`,lit:i>0,...(i===0?{pos:[0,0,0]}:{})}))},inputs:{frames:[{tick:0,interact:true}]},ticks:100};
