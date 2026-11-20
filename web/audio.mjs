// Original synthesized music and effects. Audio starts only after user gesture.
export function createAudio(){
  let context,master,volume=.45,musicTimer,musicStep=0,night=1;
  function init(){if(!context){context=new AudioContext();master=context.createGain();master.gain.value=volume;master.connect(context.destination);}return context.resume();}
  function tone(frequency,duration=.15,type='sine',level=.12,delay=0){if(!context||context.state!=='running')return;const at=context.currentTime+delay,osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.value=frequency;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(gain);gain.connect(master);osc.start(at);osc.stop(at+duration+.03);}
  const effects={mote_picked:[880,1174],lantern_lit:[523,659,784],pulse:[196,392,784],player_hit:[146,98],jump:[330,494],dash:[220,660],won:[523,659,784,1046],lost:[294,247,196],shade_spawned:[92,110],countdown:[660],charm_picked:[784,988],drifter_steal:[294,220],wind_warning:[392,440]};
  function effect(name){const notes=effects[name]??[];notes.forEach((f,i)=>tone(f,.22,name==='player_hit'?'triangle':'sine',.12,i*.075));}
  function stop(){clearInterval(musicTimer);musicTimer=null;}
  function music(nextNight=1){night=nextNight;stop();const notes=[220,261.63,329.63,293.66,196,261.63,329.63,392];musicTimer=setInterval(()=>{const f=notes[musicStep++%notes.length]*[1,1,1.122,1.26][night];tone(f,.95,'sine',.035);tone(f/2,1.7,'sine',.025);},850);}
  return{unlock:init,effect,music,stop,setVolume(value){volume=value;if(master)master.gain.setTargetAtTime(value,context.currentTime,.03);}};
}
