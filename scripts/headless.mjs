import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createGame,step,contractSnapshot,validateFrames,FormatError } from '../src/game.mjs';
export function simulate({seed=12,night=1,scenario={},inputs={frames:[]},ticks=0,snapshotEvery=10}={}){
  const frames=validateFrames(inputs),s=createGame(seed,scenario,night),rows=[contractSnapshot(s)];let cursor=0;
  for(let k=0;k<ticks&&!['won','lost'].includes(s.status);k++){
    const f=frames[cursor]?.tick===k?frames[cursor++]:{};const {tick,...patch}=f;step(s,patch);rows.push(...s.events);
    if(s.tick%snapshotEvery===0)rows.push(contractSnapshot(s));
  }
  if(rows.at(-1)?.type!=='snapshot'||rows.at(-1)?.tick!==s.tick)rows.push(contractSnapshot(s));
  rows.push({type:'end',ticks:s.tick,state:s.status,score:s.score});return rows;
}
export async function main(args){
  const options={},known=new Set(['seed','night','scenario','inputs','ticks','out','snapshot-every']);
  for(let i=0;i<args.length;i+=2){const key=args[i]?.slice(2);if(!args[i]?.startsWith('--')||!known.has(key)||options[key]!==undefined||args[i+1]===undefined)throw new Error('Usage: --seed <int> --night 1 [--scenario file] [--inputs file] --ticks <int> --out file [--snapshot-every int]');options[key]=args[i+1];}
  for(const k of ['seed','night','ticks','out'])if(options[k]===undefined)throw new Error(`missing --${k}`);
  const int=(key,fallback,min)=>{const value=options[key]??fallback;if(!/^-?\d+$/.test(String(value))||!Number.isSafeInteger(Number(value))||Number(value)<min)throw new Error(`invalid --${key}`);return Number(value);};
  const seed=int('seed',12,-Number.MAX_SAFE_INTEGER),night=int('night',1,1),ticks=int('ticks',0,0),snapshotEvery=int('snapshot-every',10,1);if(night>3)throw new Error('--night must be 1, 2 or 3');
  async function json(file,fallback){if(!file)return fallback;let source;try{source=await readFile(file,'utf8');}catch(e){throw new Error(`Cannot read ${file}: ${e.message}`);}try{return JSON.parse(source);}catch{throw new FormatError(`Invalid JSON: ${file}`);}}
  const scenario=await json(options.scenario,{}),inputs=await json(options.inputs,{frames:[]});
  const rows=simulate({seed,night,scenario,inputs,ticks,snapshotEvery});await writeFile(options.out,rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{await main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=e instanceof FormatError?2:1;}}
