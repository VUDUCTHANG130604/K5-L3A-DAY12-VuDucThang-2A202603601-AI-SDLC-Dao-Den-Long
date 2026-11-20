import {writeFile} from 'node:fs/promises';import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';import {createGame,step,TUNING} from '../src/game.mjs';
import {seededRandom} from '../src/random.mjs';import {parseArgs,integer} from './args.mjs';
export function runSoak(seed=7,nights=10){
  const start=performance.now();let state=createGame(seed,{},1);global.gc?.();const mem_start_mb=process.memoryUsage().rss/1048576,results=[],errors=[];let crashes=0;
  for(let i=0;i<nights;i++){
    const night=i%3+1,nightSeed=seed+i,rng=seededRandom(nightSeed);if(i>0)state=createGame(nightSeed,{},night);let move=[0,0];
    try{for(let tick=0;tick<TUNING[`night${night}_duration_s`]*60&&!['won','lost'].includes(state.status);tick++){
      if(tick%30===0){const a=rng()*Math.PI*2;move=[Math.cos(a),Math.sin(a)];}
      step(state,{move,jump:rng()<.05,dash:rng()<.03,pulse:rng()<.02,interact:rng()<.1,pause:false});
    }results.push(state.status);}catch(e){crashes++;errors.push({night:i,message:e.message});results.push('crashed');}
    // No snapshots/history retained across resets. Last reset is measured too.
    state=null;global.gc?.();
  }
  const last=(nights-1)%3+1;state=createGame(seed+nights-1,{},last);global.gc?.();
  const report={nights,crashes,results,mem_start_mb,mem_end_mb:process.memoryUsage().rss/1048576,duration_s:(performance.now()-start)/1000};if(errors.length)report.errors=errors;return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{const a=parseArgs(process.argv.slice(2),['seed','nights','out']);if(!a.out)throw Error('--out required');const r=runSoak(integer(a.seed??7,'seed',-Number.MAX_SAFE_INTEGER),integer(a.nights??10,'nights',1));await writeFile(a.out,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r));if(r.crashes>0)process.exitCode=1;}catch(e){console.error(e.message);process.exitCode=1;}}
