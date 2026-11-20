import {createGame,stepBenchmark} from './game.mjs';
import {seededRandom} from './random.mjs';
export function createBenchmark(seed=42){
  const rng=seededRandom(seed),s=createGame(seed,{random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,lanterns:[1,2,3].map(i=>({id:`L${i}`,lit:true,fuel:100}))});
  // Equal-area stratified disk distribution: exactly200 shades and100 motes.
  const point=(i,n)=>{const angle=i*2.399963229728653+rng()*.12,r=39*Math.sqrt((i+.5)/n);return{x:Math.cos(angle)*r,y:.8,z:Math.sin(angle)*r};};
  s.benchmark=true;s.shadows=Array.from({length:200},(_,i)=>({id:`S${i+1}`,...point(i,200),state:'wander',stateTicks:0,stunTicks:0,pushTicks:0,recoilTicks:0,pushDir:[1,0],ejectTicks:0,targetLanternId:null,drainTicks:0,heading:rng()*Math.PI*2}));
  s.fireflies=Array.from({length:100},(_,i)=>({id:`M${i+1}`,...point(i,100),y:0,kind:'random',ttl:0,collected:false,born:0}));return s;
}
export const stepBenchmarkScene=stepBenchmark;
export function benchmarkCamera(seconds){const a=seconds*Math.PI*2/15;return{eye:[30*Math.cos(a),15,30*Math.sin(a)],target:[0,0,0]};}
export function frameStatistics(times){
  if(!times.length||times.some(t=>!Number.isFinite(t)||t<=0))throw Error('Frame times must be positive');
  const sorted=[...times].sort((a,b)=>a-b),n=times.length,k=Math.max(1,Math.ceil(.01*n)),slow=sorted.slice(-k);
  return{avg_fps:1000*n/times.reduce((a,b)=>a+b,0),p1_low_fps:1000/(slow.reduce((a,b)=>a+b,0)/k),frame_ms_p95:sorted[Math.ceil(.95*n)-1],frames:n};
}
