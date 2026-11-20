import {createServer} from 'node:http';import {readFile,writeFile} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';import {pathToFileURL} from 'node:url';
import {createLeaderboard,validateScore} from './leaderboard.mjs';
export function createGameServer({dataFile,webRoot=resolve('web'),sourceRoot=resolve('src')}={}){
  const board=createLeaderboard(dataFile),mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
  const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}).end(JSON.stringify(data));};
  return createServer(async(req,res)=>{try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/api/leaderboard'){
      if(req.method==='GET'){try{json(res,200,await board.read());}catch{json(res,500,{error:'Không đọc được bảng xếp hạng trên đĩa.'});}return;}
      if(req.method!=='POST'){json(res,405,{error:'Method not allowed'});return;}
      if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'Expected application/json'});return;}
      let body='',bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>4096){json(res,413,{error:'Request too large'});return;}body+=chunk.toString('utf8');}
      let value;try{value=validateScore(JSON.parse(body));}catch(e){json(res,400,{error:e.message});return;}
      try{json(res,201,await board.add(value));}catch{json(res,500,{error:'Không lưu được điểm. Bạn vẫn có thể tiếp tục chơi.'});}return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
    const base=pathname.startsWith('/src/')?sourceRoot:webRoot,relative=pathname.startsWith('/src/')?pathname.slice(5):pathname==='/'?'index.html':pathname.slice(1),file=resolve(base,relative);
    if(!file.startsWith(base+sep)||!mime[extname(file)]){res.writeHead(404).end('Not found');return;}
    const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)],'Cache-Control':'no-store'}).end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404).end('Not found');}});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{
  const args=process.argv.slice(2);if(args.length){if(args.length!==2||args[0]!=='--export-leaderboard')throw Error('Usage: node scripts/serve.mjs [--export-leaderboard out.json]');await writeFile(args[1],JSON.stringify(await createLeaderboard().read(),null,2)+'\n');}
  else{const server=createGameServer();server.on('error',e=>{console.error(e.message);process.exitCode=1;});server.listen(Number(process.env.PORT??3000),process.env.HOST??'127.0.0.1',()=>console.log(`Dao Den Long: http://localhost:${server.address().port}`));}
}catch(e){console.error(e.message);process.exitCode=1;}}
