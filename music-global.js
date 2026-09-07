(()=>{
  if(window.__StyleSaanGlobalMusicV2)return;
  window.__StyleSaanGlobalMusicV2=true;
  let audio=null,songs=[],current=-1,modal=null,boundBubble=null;
  const clean=x=>String(x||'').trim();
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function loadSongs(){
    try{const fb=await window.StyleSaanFirebaseReady;const {collection,getDocs}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');const s=await getDocs(collection(fb.db,'songs'));songs=s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>clean(x.url));if(songs.length)return songs}catch(e){console.warn('[Style Saan] global songs load failed',e)}
    try{return JSON.parse(localStorage.getItem('style-songs')||'[]').filter(x=>clean(x.url))}catch{return[]}
  }
  function bubble(){return document.querySelector('#styleMusicBubble,.style-music-bubble')}
  function label(){return document.querySelector('#styleMusicLabel,.style-music-label')}
  function say(t){const l=label();if(!l)return;l.textContent=t;l.classList.add('show');clearTimeout(window.__styleGlobalMusicLabel);window.__styleGlobalMusicLabel=setTimeout(()=>l.classList.remove('show'),2600)}
  function ensureUI(){
    let b=bubble();
    if(!b){b=document.createElement('button');b.id='styleMusicBubble';b.className='style-music-bubble';b.type='button';b.textContent='♫';b.setAttribute('aria-label','Style Saan Music');document.body.appendChild(b)}
    let l=label();
    if(!l){l=document.createElement('div');l.id='styleMusicLabel';l.className='style-music-label';l.textContent='STYLE SAAN MUSIC';document.body.appendChild(l)}
    return b;
  }
  function audioEl(){
    if(audio&&audio.isConnected)return audio;
    if(audio)return audio;
    audio=document.createElement('audio');audio.id='style-saan-global-audio';audio.preload='auto';audio.setAttribute('playsinline','');audio.setAttribute('crossorigin','anonymous');audio.style.display='none';
    // Keep audio outside <body>. app.js rebuilds body during navigation; this keeps playback alive.
    document.documentElement.appendChild(audio);
    audio.onplay=()=>{const b=bubble();b?.classList.add('playing');if(b)b.textContent='🎶'};
    audio.onpause=()=>{const b=bubble();b?.classList.remove('playing');if(b)b.textContent='♫'};
    audio.onended=()=>{if(songs.length>1)play((current+1)%songs.length)};
    audio.onerror=()=>say('Song Link ကို Audio အဖြစ်ဖွင့်မရပါ');
    return audio;
  }
  async function play(i){
    songs=await loadSongs();
    if(!songs.length){say('ADMIN → Songs မှာ Song မရှိသေးပါ');return false}
    const s=songs[i],url=clean(s?.url);if(!url){say('Song Link မရှိပါ');return false}
    current=i;const a=audioEl();
    try{a.pause();a.src=url;a.load();say('Loading '+(s.name||'Song')+'…');await a.play();say(s.name||'STYLE SAAN MUSIC');return true}
    catch(e){console.warn('[Style Saan] global play failed',e,url);say('Song မဖွင့်နိုင်ပါ — Admin → Test Link စစ်ပါ');return false}
  }
  function ensureModal(){
    if(modal&&modal.isConnected)return;
    modal=document.createElement('div');modal.id='styleGlobalMusicModal';modal.innerHTML='<b>🎵 STYLE SAAN MUSIC</b><div class="style-global-song-list"></div>';document.body.appendChild(modal);
    const st=document.createElement('style');st.id='styleGlobalMusicStyle';
    st.textContent='#styleGlobalMusicModal{position:fixed;right:18px;bottom:88px;width:min(310px,calc(100vw - 36px));max-height:330px;overflow:auto;padding:14px;border:1px solid rgba(216,180,90,.4);border-radius:18px;background:rgba(12,10,8,.97);backdrop-filter:blur(16px);color:#ead59a;z-index:100001;display:none;box-shadow:0 20px 60px #000c}.style-global-song-list{display:grid;gap:7px;margin-top:10px}.style-global-song{display:block;width:100%;text-align:left;padding:11px;border-radius:12px;border:1px solid #4b3a20;background:#17130d;color:#fff}.style-global-song small{display:block;color:#a99b7b;margin-top:3px}.style-music-bubble{z-index:100002!important}';
    if(!document.getElementById('styleGlobalMusicStyle'))document.head.appendChild(st);
    modal.onclick=e=>{const x=e.target.closest('.style-global-song');if(x){modal.style.display='none';play(Number(x.dataset.i))}};
  }
  async function render(){ensureModal();songs=await loadSongs();modal.querySelector('.style-global-song-list').innerHTML=songs.map((s,i)=>`<button type="button" class="style-global-song" data-i="${i}"><b>${i===current?'🎶':'🎵'} ${esc(s.name||'Song')}</b><small>${i===current?'Playing':'Tap to play'}</small></button>`).join('')||'<small>Admin Panel → Songs မှာ Song ထည့်ပါ။</small>'}
  async function bind(){
    const b=ensureUI();ensureModal();audioEl();
    if(b===boundBubble)return;
    boundBubble=b;
    b.onclick=async e=>{e.preventDefault();e.stopPropagation();songs=await loadSongs();
      if(songs.length===1){if(audio&&!audio.paused){audio.pause();say('MUSIC PAUSED')}else await play(0);return}
      await render();modal.style.display=modal.style.display==='block'?'none':'block';
    };
    document.addEventListener('click',e=>{if(modal&&!modal.contains(e.target)&&e.target!==b)modal.style.display='none'},{capture:true});
  }
  async function init(){await bind()}
  window.addEventListener('load',init);
  window.addEventListener('style-saan-backend-ready',init);
  init();
  new MutationObserver(()=>{if(!bubble())bind()}).observe(document.documentElement,{childList:true,subtree:true});
})();