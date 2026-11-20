import {createGame,step,timeLeft,distance,snapshot} from '/src/game.mjs';
import {fuelOf,selectLantern,lightingCost} from '/src/lanterns.mjs';
import {createCampaign,beginCampaign,playNight,recordNightResult,nextNight,retryNight,campaignMenu,NIGHT_INTROS} from '/src/campaign.mjs';
import {createRenderer} from './renderer.mjs';
import {loadSettings} from './settings.mjs';
import {settingsPanel} from './settings-panel.mjs';
import {createAudio} from './audio.mjs';
import {actionForCode,keyName} from './bindings.mjs';
import {appendScoreForm,loadLeaderboard} from './leaderboard-ui.mjs';
const $=id=>document.getElementById(id),keys=new Set(),campaign=createCampaign(),audio=createAudio();
let settings=loadSettings(),state=createGame(),mode='menu',previous=0,accumulator=0,cameraYaw=.24,cameraRange=24,dragging=false,lastCountdown=-1,renderer,lastSpawn=null;
function applySettings(value){settings=value;audio.setVolume(value.volume);document.body.classList.toggle('colorblind',value.colorblind);document.body.classList.toggle('large-text',value.largeText);document.body.classList.toggle('reduced-motion',value.reducedMotion);}
applySettings(settings);
export const readGameState=()=>snapshot(state);
export const readCampaign=()=>structuredClone(campaign);
// Read-only measured frame timings, excludes loading and paused/menu frames.
const frameTimes=[];export const readPerformance=()=>{const elapsedMs=frameTimes.reduce((a,b)=>a+b,0);return{frames:frameTimes.length,elapsedMs,averageFps:elapsedMs?1000*frameTimes.length/elapsedMs:0,width:$('world').width,height:$('world').height};};
try{renderer=createRenderer($('world'));}catch(e){$('error').hidden=false;$('error').textContent=e.message;}
for(let i=0;i<10;i++)$('slots').append(document.createElement('i'));
function screen(title,text,actions,eyebrow='ĐẢO ĐÈN LỒNG'){
  $('overlay').hidden=false;const box=$('overlay').firstElementChild;box.replaceChildren();
  for(const[tag,value]of[['p',eyebrow],['h2',title],['p',text]]){const e=document.createElement(tag);e.textContent=value;if(tag==='p'&&value===eyebrow)e.className='eyebrow';box.append(e);}
  for(const[label,action,id]of actions){const b=document.createElement('button');b.textContent=label;if(id)b.id=id;if(box.querySelectorAll('button').length===0)b.className='primary';b.addEventListener('click',action);box.append(b);}
}
function menu(){mode='menu';campaignMenu(campaign);audio.stop();keys.clear();document.body.classList.remove('paused');screen('Giữ ánh sáng tới bình minh.','Đèn có thể cạn dầu. Gom đom đóm để châm dầu, thắp lại đèn và giữ đủ ánh sáng khi Đêm kết thúc: Bến 3/5 · Cau 4/6 · Chuông 5/7.',[['Hành trình mới',()=>{beginCampaign(campaign);intro();},'new-game'],['Bảng xếp hạng',()=>{screen('Bảng xếp hạng','Top 10 trên máy này.',[['Về menu',menu]]);loadLeaderboard($('overlay').firstElementChild);}],['Cài đặt',()=>openSettings(menu)]]);}
function intro(){mode='intro';const n=NIGHT_INTROS[campaign.night-1];screen(n.name,n.words,[['Bắt đầu Đêm',start,'begin'],['Về menu',menu]],`ĐÊM ${campaign.night} / 3`);}
function start(){playNight(campaign);state=createGame(12,{},campaign.night);$('fuel-labels').replaceChildren();lastCountdown=-1;lastSpawn=null;frameTimes.length=0;audio.unlock().then(()=>audio.music(campaign.night)).catch(()=>{});resume();updateHUD();}
function resume(){mode='playing';campaign.phase='playing';keys.clear();accumulator=0;previous=performance.now();$('overlay').hidden=true;document.body.classList.remove('paused');$('pause').textContent='Tạm dừng';audio.music(campaign.night);}
function restart(){if(['menu','intro'].includes(mode))return;retryNight(campaign);intro();}
function openSettings(back){settingsPanel($('overlay').firstElementChild,back,applySettings);}
function showPause(){screen('Dừng chân một chút.','Ánh sáng sẽ chờ bạn trở lại.',[['Tiếp tục',()=>togglePause(),'resume'],['Chơi lại Đêm',restart],['Cài đặt',()=>openSettings(showPause)],['Về menu',menu]]);}
function togglePause(){
  if(!['playing','paused'].includes(mode))return;
  state.input.pause=false;step(state,{pause:true,move:[0,0],jump:false,dash:false,pulse:false,interact:false});
  if(state.status==='paused'){mode='paused';campaign.phase='paused';keys.clear();audio.stop();document.body.classList.add('paused');$('pause').textContent='Tiếp tục';showPause();}else resume();
}
function endNight(){mode='result';keys.clear();audio.stop();audio.effect(state.status);recordNightResult(campaign,state.status,state.score);
  screen(state.status==='won'?'Đã giữ sáng tới bình minh.':'Mây cần nghỉ ngơi.',`${state.status==='won'?'Đảo còn đủ đèn sáng.':state.reason==='dawn'?'Bình minh đến nhưng số đèn sáng chưa đủ.':'Ngọn Lửa đã tắt.'} Điểm Đêm này: ${state.score}. Tổng các Đêm đã thắng: ${campaign.totalScore}.`,state.status==='won'?[[campaign.night===3?'Đón Bình Minh':'Đón Đêm tiếp theo',()=>{nextNight(campaign);if(campaign.phase==='dawn'){mode='dawn';screen('Bình Minh',`Ba hòn đảo đã được giữ sáng. Tổng điểm hành trình: ${campaign.totalScore}.`,[['Hành trình mới',()=>{beginCampaign(campaign);intro();}],['Về menu',menu]],'TIẾNG CHUÔNG ĐÃ GỌI MẶT TRỜI');appendScoreForm($('overlay').firstElementChild,campaign,state.seed);}else intro();},'next-night'],['Về menu',menu]]:[['Chơi lại Đêm',restart,'retry-night'],['Về menu',menu]]);
if(state.status==='lost')appendScoreForm($('overlay').firstElementChild,campaign,state.seed);
}
function updateHUD(){
  const p=state.player;hotText('health','♥ '.repeat(p.health)+'♡ '.repeat(3-p.health));hotText('night',`Đêm ${state.night} · ${NIGHT_INTROS[state.night-1].name}`);hotText('lamps',`${state.lanterns.filter(l=>l.lit).length} / ${state.lanterns.length}`);hotText('score',String(state.score));hotText('flies',`${p.inventory} / ${p.capacity}`);
  while($('slots').children.length<p.capacity)$('slots').append(document.createElement('i'));while($('slots').children.length>p.capacity)$('slots').lastElementChild.remove();
  [...$('slots').children].forEach((e,i)=>e.classList.toggle('full',i<p.inventory));
  const seconds=Math.ceil(timeLeft(state));hotText('time',`${settings.colorblind&&seconds<=30?'⚠ ':''}${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`);$('time').classList.toggle('urgent',seconds<=30);
  hotText('dash',p.charmTicks>0?`${keyName(settings.bindings.dash)} · Lướt ∞`:p.dashCd>0?`Lướt · ${(p.dashCd/60).toFixed(1)} s`:`${keyName(settings.bindings.dash)} · Lướt`);$('dash').classList.toggle('waiting',p.dashCd>0&&p.charmTicks===0);
  hotText('pulse',p.pulseCd>0?`Tỏa sáng · ${(p.pulseCd/60).toFixed(1)} s`:`${keyName(settings.bindings.pulse)} · Tỏa sáng (3)`);$('pulse').classList.toggle('waiting',p.pulseCd>0);hotText('charm',p.charmTicks>0?`Bùa Gió · ${(p.charmTicks/60).toFixed(1)} s`:'');
  const lamp=selectLantern(state),interactKey=keyName(settings.bindings.interact);hotText('prompt',p.respawnTicks>0?`${settings.colorblind?'⚠ ':''}Mây đang trở về bến…`:lamp?(lamp.lit?`${settings.colorblind&&fuelOf(lamp)<30?'⚠ ':''}${interactKey} — Châm dầu (${fuelOf(lamp).toFixed(1)}/100)`: `${interactKey} — ${lamp.everLit?'Thắp lại':'Nạp ánh sáng'} (${lamp.deposited}/${lightingCost(lamp)})`):'');
  hotText('wind',state.wind.warning?'Lá báo gió · 2 giây nữa gió sẽ nổi!':state.wind.active?'Gió mạnh · giữ bước chân!':'');
  const nearest=state.lanterns.filter(l=>!l.lit).sort((a,b)=>distance(a,p)-distance(b,p))[0],projected=nearest&&renderer?.project({...nearest,y:nearest.y+2});$('direction').hidden=!projected||projected.visible;
  if(projected&&!projected.visible){$('arrow').style.transform=`rotate(${Math.atan2(projected.x,projected.y)*180/Math.PI}deg)`;hotText('distance',`${nearest.id} · ${Math.round(distance(nearest,p))} m`);}
  for(const l of state.lanterns){let label=$(`fuel-${l.id}`);if(!label){label=document.createElement('span');label.className='fuel-label';label.id=`fuel-${l.id}`;$('fuel-labels').append(label);}const pt=renderer?.project({...l,y:l.y+4.5});label.hidden=!l.lit||!pt?.visible;
    if(!label.hidden){const low=l.fuelUnits<1800,text=`${settings.colorblind&&low?'⚠ ':''}${l.id} · ${fuelOf(l).toFixed(1)}`;if(label.textContent!==text)label.textContent=text;label.classList.toggle('low',low);label.style.left=`${(pt.x+1)*canvas.clientWidth/2}px`;label.style.top=`${(1-pt.y)*canvas.clientHeight/2}px`;}
  }
  const alerts=[];if(state.wind.warning)alerts.push('⚠ Gió sắp thổi');if(seconds<=10)alerts.push(`⚠ Còn ${seconds} giây`);if(lastSpawn&&state.simTick<lastSpawn.until)alerts.push('Bóng Mực xuất hiện');const weak=state.lanterns.find(l=>l.lit&&l.fuelUnits<1800);if(weak)alerts.push(`⚠ ${weak.id} sắp cạn dầu`);hotText('status-caption',['playing','paused'].includes(mode)?alerts.join(' · '):'');
  const marker=$('shade-arrow');marker.hidden=!lastSpawn||state.simTick>=lastSpawn.until||!['playing','paused'].includes(mode);if(!marker.hidden){const point=renderer?.project(lastSpawn.point);if(point){let dx=point.x,dy=-point.y;if(point.behind){dx=-dx;dy=-dy;}const amount=Math.min((canvas.clientWidth/2-38)/Math.max(Math.abs(dx),.001),(canvas.clientHeight/2-55)/Math.max(Math.abs(dy),.001));marker.style.left=`${canvas.clientWidth/2+dx*amount}px`;marker.style.top=`${canvas.clientHeight/2+dy*amount}px`;marker.firstElementChild.style.transform=`rotate(${Math.atan2(dx,-dy)*180/Math.PI}deg)`;}}
  hotText('controls-hint',`${['forward','left','backward','right'].map(a=>keyName(settings.bindings[a])).join('')} Đi · ${keyName(settings.bindings.jump)} Nhảy · ${keyName(settings.bindings.dash)} Lướt · ${interactKey} Nạp · ${keyName(settings.bindings.pulse)} Sáng · ${keyName(settings.bindings.pause)} Dừng`);
}
function hotText(id,text){if($(id).textContent!==text)$(id).textContent=text;}
$('pause').addEventListener('click',togglePause);$('restart').addEventListener('click',restart);
window.addEventListener('keydown',e=>{const action=actionForCode(settings.bindings,e.code);if(!action)return;if(['INPUT','TEXTAREA'].includes(e.target?.tagName)&&mode!=='playing')return;e.preventDefault();if(action==='pause'&&!e.repeat)togglePause();else if(mode==='playing')keys.add(e.code);});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{if(mode==='playing')togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')togglePause();});
const canvas=$('world');canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{if(e.button===2){dragging=true;canvas.setPointerCapture(e.pointerId);}});canvas.addEventListener('pointermove',e=>{if(dragging)cameraYaw-=e.movementX*.005*settings.sensitivity;});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('lostpointercapture',()=>dragging=false);canvas.addEventListener('wheel',e=>{e.preventDefault();cameraRange=Math.max(10,Math.min(60,cameraRange+e.deltaY*.015));},{passive:false});
function held(action){return [...keys].some(code=>actionForCode(settings.bindings,code)===action);}
function frame(now){const raw=now-previous,elapsed=Math.min(raw/1000,.1);previous=now;if(mode==='playing'){
  if(raw>0){frameTimes.push(raw);if(frameTimes.length>1800)frameTimes.shift();}accumulator+=elapsed;
  while(accumulator>=1/60){const beforeGround=state.player.grounded,beforeWarning=state.wind.warning;
    step(state,{move:[Number(held('right'))-Number(held('left')),Number(held('backward'))-Number(held('forward'))],cam_yaw_deg:cameraYaw*180/Math.PI,jump:held('jump'),dash:held('dash'),pulse:held('pulse'),interact:held('interact'),pause:false});accumulator-=1/60;
    for(const event of state.events){audio.effect(event.name);if(event.name==='shade_spawned'){const shade=state.shadows.find(s=>s.id===event.data.id);lastSpawn={point:{...shade},until:state.simTick+180};}}if(beforeGround&&!state.player.grounded&&state.player.vy>0)audio.effect('jump');if(!beforeWarning&&state.wind.warning)audio.effect('wind_warning');
    const seconds=Math.ceil(timeLeft(state));if(seconds<=10&&seconds!==lastCountdown){lastCountdown=seconds;audio.effect('countdown');}
    if(['won','lost'].includes(state.status)){endNight();break;}
  }
}else if(mode==='paused'){
  accumulator+=elapsed;while(accumulator>=1/60){step(state,{pause:false});accumulator-=1/60;}
}
if(renderer){renderer.setView(cameraYaw,cameraRange);renderer.setColorblind(settings.colorblind);renderer.setReducedMotion(settings.reducedMotion);renderer.render(state,now/1000);updateHUD();}requestAnimationFrame(frame);}
menu();updateHUD();if(renderer)requestAnimationFrame(frame);
