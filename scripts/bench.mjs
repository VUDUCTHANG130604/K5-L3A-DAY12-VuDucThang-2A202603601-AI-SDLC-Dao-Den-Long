import {writeFile} from 'node:fs/promises';import {performance} from 'node:perf_hooks';import os from 'node:os';import {pathToFileURL} from 'node:url';
import {createGameServer} from './serve.mjs';import {launchChrome} from './chrome.mjs';import {parseArgs,integer} from './args.mjs';
export async function runBench({seed=42,duration=30,headless=process.env.BENCH_HEADLESS==='1'}={}){
  const server=createGameServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{browser=await launchChrome({headless,vsyncOff:true});await browser.navigate(`http://127.0.0.1:${server.address().port}/bench.html?seed=${seed}&duration=${duration}`);
    const limit=Date.now()+(duration+30)*1000;let result;
    while(Date.now()<limit){const status=await browser.evaluate('({done:window.benchDone,error:window.benchError})');if(status.error)throw Error(status.error);if(status.done){result=await browser.evaluate('window.benchResult');break;}await new Promise(r=>setTimeout(r,250));}
    if(!result)throw Error('Benchmark did not complete');if(browser.errors.length)throw Error(browser.errors.join('\n'));
    const first=await browser.evaluate('window.benchFirstFrameEpoch');return{contract_version:'1.3',avg_fps:result.avg_fps,p1_low_fps:result.p1_low_fps,frame_ms_p95:result.frame_ms_p95,frames:result.frames,load_ms:Math.max(0,first-performance.timeOrigin),peak_mem_mb:null,vsync_off:true,renderer:`${result.renderer} / ${browser.version.product}`,os:`${os.platform()} ${os.release()} ${os.arch()}`};
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{const a=parseArgs(process.argv.slice(2),['seed','duration','out']);if(!a.out)throw Error('--out required');const result=await runBench({seed:integer(a.seed??42,'seed',-Number.MAX_SAFE_INTEGER),duration:integer(a.duration??30,'duration',1)});await writeFile(a.out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));}catch(e){console.error(e.message);process.exitCode=1;}}
