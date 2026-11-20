import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';import {dirname,resolve} from 'node:path';
export const NAME_PATTERN=/^[A-Za-z0-9_]{3,12}$/;
export function validateScore(value){if(!value||typeof value.name!=='string'||!NAME_PATTERN.test(value.name)||!Number.isSafeInteger(value.score)||value.score<0||!Number.isInteger(value.nights_won)||value.nights_won<0||value.nights_won>3||!Number.isSafeInteger(value.seed))throw Error('Tên cần3–12 ký tự A–Z,a–z,0–9,_; điểm và số Đêm phải hợp lệ.');return{name:value.name,score:value.score,nights_won:value.nights_won,seed:value.seed};}
export function rankEntries(entries){return [...entries].sort((a,b)=>b.score-a.score||Date.parse(a.achieved_at)-Date.parse(b.achieved_at)).slice(0,10);}
export function createLeaderboard(file=resolve(process.env.DAO_DATA_DIR??'.data','leaderboard.json')){
  let queue=Promise.resolve(),sequence=0;
  async function read(){let text;try{text=await readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')return{entries:[]};throw e;}
    const data=JSON.parse(text);if(!Array.isArray(data.entries))throw Error('Leaderboard file is invalid');for(const e of data.entries){validateScore(e);if(!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(e.achieved_at)||!Number.isFinite(Date.parse(e.achieved_at)))throw Error('Invalid achieved_at');}return{entries:rankEntries(data.entries)};
  }
  function add(value){const entry={...validateScore(value),achieved_at:new Date().toISOString()};const result=queue.then(async()=>{const data=await read();data.entries=rankEntries([...data.entries,entry]);await mkdir(dirname(file),{recursive:true});const tmp=`${file}.${process.pid}.${++sequence}.tmp`;await writeFile(tmp,JSON.stringify(data,null,2)+'\n');await rename(tmp,file);return data;});queue=result.catch(()=>{});return result;}
  return{read,add};
}
