import {createBenchmark,stepBenchmarkScene,benchmarkCamera,frameStatistics} from '/src/benchmark.mjs';
import {createRenderer} from './renderer.mjs';
const params=new URLSearchParams(location.search),seed=Number(params.get('seed')??42),duration=Number(params.get('duration')??30),canvas=document.getElementById('world'),status=document.getElementById('bench-status');
window.benchDone=false;
try{
  const state=createBenchmark(seed),renderer=createRenderer(canvas);window.benchScene=state;let first,previous,accumulator=0,done=false,measureStart,measureEnd;const times=[];
  function frame(now){if(done)return;const elapsed=previous===undefined?0:(now-previous)/1000;accumulator+=Math.min(elapsed,.25);while(accumulator>=1/60){stepBenchmarkScene(state);accumulator-=1/60;}
    const seconds=first===undefined?0:(now-first)/1000,{eye,target}=benchmarkCamera(seconds);renderer.setCamera(eye,target);renderer.render(state,seconds);
    if(first===undefined){renderer.finish();first=performance.now();window.benchFirstFrameEpoch=performance.timeOrigin+first;measureStart=first+3000;measureEnd=measureStart+duration*1000;}
    else if(now>=measureStart&&now<measureEnd&&previous!==undefined)times.push(now-previous);
    previous=now;
    if(now>=measureEnd){done=true;window.benchResult={contract_version:'1.3',...frameStatistics(times),renderer:renderer.info(),scene:{shades:state.shadows.length,motes:state.fireflies.length,lit:state.lanterns.filter(l=>l.lit).length,player:[state.player.x,state.player.y,state.player.z]},warmup_s:3,measurement_s:duration};window.benchDone=true;status.textContent=`Đã đo ${times.length} khung hình · ${window.benchResult.avg_fps.toFixed(1)} FPS`;return;}
    status.textContent=seconds<3?'Khởi động 3 giây · 200 Bóng Mực / 100 đom đóm':`Đang đo ${Math.min(duration,seconds-3).toFixed(1)} / ${duration}s · 200 Bóng Mực / 100 đom đóm`;requestAnimationFrame(frame);
  }requestAnimationFrame(frame);
}catch(e){window.benchError=e.message;status.textContent=e.message;}
