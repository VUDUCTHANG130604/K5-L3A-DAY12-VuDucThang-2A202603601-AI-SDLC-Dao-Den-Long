import {mkdir,cp,readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';import {resolve,join} from 'node:path';
const root=resolve('dist/dao-den-long-v1.0.0');await mkdir(root,{recursive:true});
for(const path of ['src','web','scripts','tests','docs','skills','AGENTS.md','bench.json','soak.json','game.contract.json','package.json','README.md','CREDITS.md','LICENSE','CHANGELOG.md'])await cp(path,join(root,path),{recursive:true});
const zip=resolve('dist/dao-den-long-v1.0.0.zip');
const result=process.platform==='win32'?spawnSync('powershell',['-NoProfile','-Command','Compress-Archive -LiteralPath $env:DAO_PACKAGE_ROOT -DestinationPath $env:DAO_PACKAGE_ZIP -Force'],{env:{...process.env,DAO_PACKAGE_ROOT:root,DAO_PACKAGE_ZIP:zip},encoding:'utf8'}):spawnSync('zip',['-qr',zip,'dao-den-long-v1.0.0'],{cwd:resolve('dist'),encoding:'utf8'});
if(result.status!==0)throw Error(result.stderr||'ZIP failed');
const bytes=await readFile(zip),hash=createHash('sha256').update(bytes).digest('hex');await writeFile('dist/SHA256SUMS.txt',`${hash}  dao-den-long-v1.0.0.zip\n`);console.log(JSON.stringify({zip,bytes:(await stat(zip)).size,sha256:hash},null,2));
