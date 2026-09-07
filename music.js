(()=>{
  function initMusic(){
    if(document.querySelector('.style-music-bubble')) return;
    const b=document.createElement('button');
    b.className='style-music-bubble';
    b.type='button';
    b.setAttribute('aria-label','Music');
    b.textContent='♫';
    const l=document.createElement('div');
    l.className='style-music-label';
    l.textContent='STYLE MUSIC';
    document.body.appendChild(l);
    document.body.appendChild(b);
    let ctx,osc,gain,playing=false,notes=[261.63,329.63,392,523.25,392,329.63],i=0,timer;
    function start(){
      ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();
      if(ctx.state==='suspended') ctx.resume();
      gain=ctx.createGain(); gain.gain.value=.035; gain.connect(ctx.destination);
      playing=true; b.classList.add('playing'); l.textContent='♫  MUSIC ON'; l.classList.add('show');
      clearInterval(timer);
      function beat(){
        if(!playing)return;
        osc=ctx.createOscillator(); osc.type='sine'; osc.frequency.value=notes[i++%notes.length];
        osc.connect(gain); osc.start(); osc.stop(ctx.currentTime+.42);
      }
      beat(); timer=setInterval(beat,700);
    }
    function stop(){
      playing=false; b.classList.remove('playing'); l.textContent='MUSIC OFF'; clearInterval(timer);
      if(gain) gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.18);
      setTimeout(()=>l.classList.remove('show'),700);
    }
    b.addEventListener('click',()=>playing?stop():start());
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initMusic); else initMusic();
})();