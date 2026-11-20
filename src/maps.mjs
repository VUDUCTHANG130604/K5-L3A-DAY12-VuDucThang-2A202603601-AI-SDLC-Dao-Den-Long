// Phase 2 map geometry from the supplied ticket. Angles: +X towards +Z.
const ring=(count,radius,cx=0,cz=0,y=0,start=0,step=360/count)=>Array.from({length:count},(_,i)=>{
  const angle=(start+i*step)*Math.PI/180;return [cx+Math.cos(angle)*radius,y,cz+Math.sin(angle)*radius];
});
const lamps=positions=>positions.map((pos,i)=>({id:`L${i+1}`,pos}));
export const MAPS=Object.freeze({
  1:{night:1,name:'Đảo Bến',islands:[{x:0,z:0,radius:40}],bridge:null,pads:[],
    lanterns:lamps([[0,0,25],[23.8,0,7.7],[14.7,0,-20.2],[-14.7,0,-20.2],[-23.8,0,7.7]]),
    motePoints:[...ring(8,12),...ring(16,33)],shadePoints:ring(12,37,0,0,0,15),
    shadeSchedule:{first:300,every:480,limit:6},charms:[]},
  2:{night:2,name:'Đảo Cau',islands:[{x:0,z:0,radius:28},{x:70,z:0,radius:28}],bridge:{minX:26,maxX:44,minZ:-2,maxZ:2},
    pads:[{id:'P1',pos:[20,0,18],radius:1,vy:14,speed:24,target:[70,0,0]},
      {id:'P2',pos:[50,0,-18],radius:1,vy:14,speed:24,target:[0,0,0]}],
    lanterns:lamps([[0,0,20],[17,0,-10],[-17,0,-10],[70,0,20],[87,0,-10],[53,0,-10]]),
    motePoints:[...ring(4,10),...ring(8,22),...ring(4,10,70),...ring(8,22,70)],
    shadePoints:[...ring(8,26,0,0,0,22.5),...ring(8,26,70,0,0,22.5)],
    shadeSchedule:{first:300,every:420,limit:8},charms:[{id:'C1',pos:[35,0,0]}]},
  3:{night:3,name:'Đảo Chuông',islands:[{x:0,z:0,radius:45}],bridge:null,
    tiers:[{radius:8,height:6},{inner:12,outer:24,height:3,positiveZ:true}],ramps:[30,150],tower:{radius:2,base:6,height:8},
    pads:[{id:'P1',pos:[0,3,13],radius:1,vy:12,speed:8,direction:[0,-1]}],
    lanterns:lamps([[0,6,6],[18,3,10],[-18,3,10],[35,0,-10],[-35,0,-10],[20,0,-35],[-20,0,-35]]),
    motePoints:[...ring(18,34),...ring(8,18,0,0,3,20,20),...ring(4,5,0,0,6,45)],shadePoints:ring(16,43),
    shadeSchedule:{first:300,every:360,limit:10},charms:[{id:'C1',pos:[30,0,25]},{id:'C2',pos:[-30,0,25]}]}
});
export function getMap(night){const map=MAPS[night];if(!map)throw new RangeError('night must be 1, 2 or 3');return map;}
export function inBounds(night,x,z){const m=getMap(night),b=m.bridge;
  return m.islands.some(i=>Math.hypot(x-i.x,z-i.z)<=i.radius)||(!!b&&x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ);
}
export function rampHeight(x,z){
  for(const deg of MAPS[3].ramps){const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a),along=x*c+z*s,across=-x*s+z*c;
    if(Math.abs(across)<=1.5&&along>=24&&along<=30)return (30-along)/2;
  }return null;
}
export function surfacesAt(night,x,z){
  if(!inBounds(night,x,z))return [];
  const levels=[0];if(night===3){const r=Math.hypot(x,z),ramp=rampHeight(x,z);if(ramp!==null)levels.push(ramp);if(r>=12&&r<=24&&z>0)levels.push(3);if(r<=8)levels.push(6);}
  return [...new Set(levels)].sort((a,b)=>a-b);
}
export function groundBelow(night,x,z,feetY=Infinity){return surfacesAt(night,x,z).filter(y=>y<=feetY+1e-7).at(-1)??null;}
export function topHeight(night,x,z){return surfacesAt(night,x,z).at(-1)??null;}
export function padAt(night,x,y,z){return getMap(night).pads.find(p=>Math.hypot(x-p.pos[0],z-p.pos[2])<=p.radius&&Math.abs(y-p.pos[1])<.08)??null;}
export function blockedByWall(night,from,to){
  if(night!==3)return false;
  const r=Math.hypot(to.x,to.z),oldR=Math.hypot(from.x,from.z);
  if(to.y>=6&&to.y<14&&r<2&&oldR>=2)return true;
  const next=topHeight(night,to.x,to.z),previous=topHeight(night,from.x,from.z);
  if(next===null)return false;
  // Enter ramps continuously; vertical ledges require feet above their top.
  if(rampHeight(to.x,to.z)!==null&&from.y>=Math.min(previous??0,next)-.1&&next-from.y<=.2)return false;
  return next>from.y+.08&&next>(previous??0)+.2;
}
