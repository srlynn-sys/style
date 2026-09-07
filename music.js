(()=>{
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanUrl=x=>String(x||'').trim();
  let audio=null,songs=[],current=-1,modal=null,list=null,bubble=null,label=null;
  async function getSongs(){
    let cached=[];try{cached=JSON.parse(localStorage.getItem('style-songs')||'[]').filter(x=>cleanUrl(x.url));}catch{}
    try{const fb=await window.StyleSaanFirebaseReady;const {collection,getDocs}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');const snap=await getDocs(collection(fb.db,'songs'));const remote=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>cleanUrl(x.url));if(remote.length)return remote;}catch(e){console.warn('[Style Saan] Firebase songs unavailable',e)}
    return cached;
  }
  function setLabel(text,temp=true){if(!label)return;label.textContent=text;label.classList.add('show');if(temp){clearTimeout(window.__styleMusicTimer);window.__styleMusicTimer=setTimeout(()=>label.classList.remove('show'),2600)}}
  function ensureAudio(){
    if(audio)return audio;
    audio=document.createElement('audio');audio.id='style-saan-audio';audio.preload='auto';audio.setAttribute('playsinline','');audio.setAttribute('crossorigin','anonymous');audio.style.display='none';document.body.appendChild(audio);
    audio.addEventListener('play',()=>{bubble?.classList.add('playing');if(bubble)bubble.textContent='🎶'});
    audio.addEventListener('pause',()=>{bubble?.classList.remove('playing');if(bubble)bubble.textContent='♫'});
    audio.addEventListener('ended',()=>{bubble?.classList.remove('playing');if(bubble)bubble.textContent='♫';if(songs.length>1)playSong((current+1)%songs.length)});
    audio.addEventListener('error',()=>{bubble?.classList.remove('playing');if(bubble)bubble.textContent='♫';setLabel('သီချင်းဖွင့်မရပါ — Song Link ကို Test လုပ်ပါ')});
    return audio;
  }
  function waitForAudio(a){return new Promise((resolve,reject)=>{if(a.readyState>=3)return resolve();const done=()=>{cleanup();resolve()};const fail=()=>{cleanup();reject(new Error('audio-load-failed'))};const timer=setTimeout(()=>{cleanup();reject(new Error('audio-timeout'))},7000);const cleanup=()=>{clearTimeout(timer);a.removeEventListener('canplay',done);a.removeEventListener('loadeddata',done);a.removeEventListener('error',fail)};a.addEventListener('canplay',done,{once:true});a.addEventListener('loadeddata',done,{once:true});a.addEventListener('error',fail,{once:true})})}
  async function playSong(index){
    songs=await getSongs();
    if(!songs.length){setLabel('ADMIN PANEL → Songs မှာ Song မရှိသေးပါ');return false}
    const song=songs[index],url=cleanUrl(song?.url);if(!url){setLabel('Song Link မရှိပါ');return false}
    current=index;const a=ensureAudio();
    try{
      a.pause();a.removeAttribute('src');a.src=url;a.load();setLabel('Loading '+(song.name||'STYLE SAAN MUSIC')+'…',false);await waitForAudio(a);await a.play();setLabel(song.name||'STYLE SAAN MUSIC',false);render();return true;
    }catch(e){console.warn('[Style Saan] audio playback failed',e,url);setLabel('သီချင်းမထွက်ပါ — Admin Songs မှာ ▶ Test Link လုပ်ပါ');return false}
  }
  function render(){if(!list)return;list.innerHTML=songs.length?songs.map((s,i)=>`<button type="button" class="style-song-link" data-index="${i}" style="display:block;width:100%;text-align:left;margin-top:8px;padding:11px 12px;border-radius:12px;border:1px solid #4b3a20;background:${i===current?'#2b2112':'#17130d'};color:#fff;font-size:.82rem;cursor:pointer"><b>${i===current?'🎶':'🎵'} ${esc(s.name||'Song')}</b><br><small style="color:#a99b7b">${i===current?'Playing…':'Play song'}</small></button>`).join(''):'<div style="padding-top:10px;color:#9f947c;font-size:.8rem">Admin Panel → Songs မှာ Chatbox.moe direct audio link ထည့်ပါ။</div>'}
  async function initMusic(){
    bubble=document.querySelector('.style-music-bubble');label=document.querySelector('.style-music-label');
    if(!bubble){bubble=document.createElement('button');bubble.className='style-music-bubble';bubble.type='button';bubble.textContent='♫';bubble.setAttribute('aria-label','Style Saan Music');document.body.appendChild(bubble)}
    if(!label){label=document.createElement('div');label.className='style-music-label';label.textContent='STYLE SAAN MUSIC';document.body.appendChild(label)}
    modal=document.querySelector('.style-music-playlist');
    if(!modal){modal=document.createElement('div');modal.className='style-music-playlist';modal.innerHTML='<b>🎵 STYLE SAAN MUSIC</b><div class="style-song-list">Loading…</div>';document.body.appendChild(modal);Object.assign(modal.style,{position:'fixed',right:'18px',bottom:'88px',width:'min(290px,calc(100vw - 36px))',maxHeight:'320px',overflow:'auto',padding:'14px',border:'1px solid rgba(216,180,90,.35)',borderRadius:'18px',background:'rgba(16,14,11,.96)',backdropFilter:'blur(16px)',color:'#ead59a',zIndex:100000,display:'none',boxShadow:'0 20px 50px #000a'})}
    list=modal.querySelector('.style-song-list');songs=await getSongs();render();ensureAudio();
    bubble.onclick=async e=>{e.preventDefault();e.stopPropagation();songs=await getSongs();render();if(!songs.length){setLabel('ADMIN PANEL → Songs မှာ Song မရှိသေးပါ');return}if(songs.length===1){if(audio&&!audio.paused&&current===0){audio.pause();setLabel('MUSIC PAUSED')}else await playSong(0);return}modal.style.display=modal.style.display==='none'?'block':'none';bubble.classList.toggle('playing',modal.style.display==='block'||(audio&&!audio.paused));setLabel(modal.style.display==='block'?'SELECT A SONG':'STYLE SAAN MUSIC')};
    list.addEventListener('click',async e=>{const btn=e.target.closest('.style-song-link');if(!btn)return;e.preventDefault();e.stopPropagation();modal.style.display='none';await playSong(Number(btn.dataset.index))});
    document.addEventListener('click',e=>{if(modal&&!modal.contains(e.target)&&e.target!==bubble){modal.style.display='none';if(audio?.paused)bubble.classList.remove('playing')}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMusic);else initMusic();
})();