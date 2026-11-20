import {spawnSync} from 'node:child_process';
import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {fixtures} from '../tests/phase3-fixtures.mjs';
import {createCampaign,beginCampaign,playNight,recordNightResult,nextNight,retryNight} from '../src/campaign.mjs';
const dir='docs/proof/phase-4';await mkdir(dir,{recursive:true});
for(const args of [['scripts/build.mjs'],['--test'],['scripts/make-win-scenario.mjs']]){const r=spawnSync(process.execPath,args,{encoding:'utf8'});process.stdout.write(r.stdout+r.stderr);if(args[0]==='--test')await writeFile(`${dir}/tests.txt`,r.stdout+r.stderr);if(r.status!==0)process.exit(r.status||1);}
const winMeta=JSON.parse(await readFile('tests/scenarios/phase3-win.meta.json','utf8'));fixtures['default-win']={seed:winMeta.seed,night:1,inputs:JSON.parse(await readFile('tests/scenarios/phase3-win.inputs.json','utf8')),ticks:14400};
const results={};
for(const[name,cfg]of Object.entries(fixtures)){
  const scenario=`${dir}/${name}.scenario.json`,inputs=`${dir}/${name}.inputs.json`,out=`${dir}/${name}.jsonl`,repeat=`${dir}/${name}.repeat.jsonl`;
  await writeFile(scenario,JSON.stringify(cfg.scenario??{})+'\n');await writeFile(inputs,JSON.stringify(cfg.inputs??{frames:[]})+'\n');
  const start=performance.now();for(const path of[out,repeat]){const r=spawnSync(process.execPath,['scripts/headless.mjs','--seed',String(cfg.seed??12),'--night',String(cfg.night??1),'--scenario',scenario,'--inputs',inputs,'--ticks',String(cfg.ticks),'--out',path],{encoding:'utf8',timeout:30000});assert.equal(r.status,0,r.stderr||r.error?.message);}
  const elapsedMs=performance.now()-start,a=await readFile(out,'utf8');assert.equal(a,await readFile(repeat,'utf8'));await unlink(repeat);const rows=a.trim().split('\n').map(JSON.parse),end=rows.at(-1);assert.equal(end.type,'end');
  const historical=JSON.parse('['+(await readFile(`docs/proof/phase-3/${name}.jsonl`,'utf8')).trim().split('\n').join(',')+']');
  assert.deepEqual(rows,historical,`${name}: Phase 3 gameplay regression`);
  if(name.startsWith('timeout')){assert.equal(end.ticks,cfg.ticks);assert.equal(end.state,'lost');assert.ok(elapsedMs<30000);}
  if(name.startsWith('win-'))assert.equal(end.state,'won');
  if(name==='default-win'){assert.equal(end.state,'won');assert.equal(end.ticks,winMeta.ticks);assert.equal(end.score,winMeta.score);}
  const event=event=>rows.find(e=>e.name===event);if(name==='dash')assert.ok(event('dash'));if(name==='pause'){assert.ok(event('paused'));assert.ok(event('resumed'));assert.equal(rows.at(-2).sim_tick,10);}if(name==='drifter')assert.ok(event('drifter_steal'));if(name==='drifter-drop')assert.ok(event('drifter_drop'));if(name==='charm')assert.ok(event('charm_picked'));if(name==='fall')assert.equal(event('player_hit').data.by,'fall');
  if(name==='spawn'){assert.equal(end.state,'playing');assert.equal(rows.at(-2).drifters.length,2);assert.equal(rows.at(-2).shades.length,8);}
  if(name==='charm'){assert.equal(rows.at(-2).charms[0].available,true);assert.equal(rows.at(-2).player.charm_s,0);}

  const final=rows.at(-2),lamp=final.lanterns[0];
  if(name==='fuel-expiry'){assert.equal(lamp.lit,false);assert.equal(event('lantern_out').tick,6000);}
  if(name==='fuel-pause'){assert.equal(final.sim_tick,1);assert.equal(final.state,'playing');}
  if(name==='refuel'){assert.equal(end.score,15);assert.equal(lamp.fuel,100);assert.equal(final.player.carried,7);}
  if(name==='relight'){assert.equal(end.score,65);assert.equal(final.player.capacity,12);assert.equal(lamp.relit_count,1);}
  if(name==='relight-cycle'){assert.equal(end.score,280);assert.equal(final.player.capacity,16);assert.equal(lamp.relit_count,2);assert.equal(rows.filter(r=>r.name==='lantern_out').length,2);}
  if(name==='drain-stack'){assert.equal(lamp.fuel,18);assert.equal(rows.filter(r=>r.name==='fuel_drain').length,2);}
  if(name==='drain-pulse')assert.equal(end.score,15);
  if(name==='safe-restore')assert.equal(final.player.flames,3);
  if(name==='no-early-win'){assert.equal(end.state,'playing');assert.ok(final.lanterns.every(l=>l.lit));}
  if(name==='dawn-extinguish'||name.startsWith('threshold-lost-'))assert.equal(end.state,'lost');
  if(name==='dawn-final-relight')assert.equal(event('game_over').data.reason,'dawn_survived');
  results[name]={...end,seed:cfg.seed??12,night:cfg.night??1,twoRunsMs:Math.round(elapsedMs)};console.log(`${name}: ${end.state}, tick ${end.ticks}, deterministic CLI bytes, ${Math.round(elapsedMs)}ms / two runs`);
}
const campaign=beginCampaign(createCampaign()),journey=[];
for(const night of[1,2,3]){playNight(campaign);if(night===2){recordNightResult(campaign,'lost',results['timeout-2'].score);assert.equal(campaign.night,2);journey.push(structuredClone(campaign));retryNight(campaign);playNight(campaign);}const result=results[`win-${night}`];recordNightResult(campaign,result.state,result.score);journey.push(structuredClone(campaign));nextNight(campaign);}
assert.equal(campaign.phase,'dawn');assert.equal(campaign.totalScore,[1,2,3].reduce((sum,n)=>sum+results[`win-${n}`].score,0));await writeFile(`${dir}/campaign.json`,JSON.stringify({source:'actual CLI scenario end scores; pre-lit test worlds',journey,final:campaign},null,2)+'\n');
const soakRun=spawnSync(process.execPath,['--expose-gc','--max-semi-space-size=1','scripts/soak.mjs','--seed','7','--nights','10','--out','soak.json'],{encoding:'utf8'});assert.equal(soakRun.status,0,soakRun.stderr);const soak=JSON.parse(await readFile('soak.json','utf8'));assert.equal(soak.crashes,0);assert.ok(soak.mem_end_mb<=1.2*soak.mem_start_mb,'soak RSS growth exceeds 20%');
await writeFile(`${dir}/verification.json`,JSON.stringify({generatedAt:new Date().toISOString(),contract:'1.3',node:process.version,platform:process.platform,testsPassed:true,phase3GameplayIdentical:true,results,soak,instructorHiddenTestsRun:false},null,2)+'\n');
