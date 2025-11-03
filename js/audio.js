window.ritualAudio=(function(){
  let ctx=null, master, droneOsc, pulseOsc, pulseGain, running=false;
  const BPM=66, interval=60/BPM; let timer=null;

  function init(){
    ctx=new(window.AudioContext||window.webkitAudioContext)();
    master=ctx.createGain();master.gain.value=0.35;master.connect(ctx.destination);

    droneOsc=ctx.createOscillator();droneOsc.type='sine';droneOsc.frequency.value=62;
    const droneGain=ctx.createGain();droneGain.gain.value=0.07;
    droneOsc.connect(droneGain).connect(master);droneOsc.start();

    pulseOsc=ctx.createOscillator();pulseOsc.type='sine';pulseOsc.frequency.value=48;
    pulseGain=ctx.createGain();pulseGain.gain.value=0;
    pulseOsc.connect(pulseGain).connect(master);pulseOsc.start();
  }
  function pulse(){
    const t=ctx.currentTime;
    pulseGain.gain.cancelScheduledValues(t);
    pulseGain.gain.setValueAtTime(0.001,t);
    pulseGain.gain.exponentialRampToValueAtTime(0.18,t+0.09);
    pulseGain.gain.exponentialRampToValueAtTime(0.0008,t+0.32);
    window.dispatchEvent(new CustomEvent("ritual:pulse",{detail:{time:t}}));
  }
  async function start(){
    if(running)return;
    if(!ctx)init();
    await ctx.resume();
    running=true;
    pulse();
    timer=setInterval(()=>{if(running)pulse();},interval*1000);
  }
  return{start};
})();
