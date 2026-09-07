(()=>{
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanUrl=x=>String(x||'').trim();

  async function getSongs(){
    let songs=[];
    try{songs=JSON.parse(localStorage.getItem('style-songs')||'[]').filter(x=>cleanUrl(x.url));}catch{}
    try{
      const fb=await window.StyleSaanFirebaseReady;
      const {collection,getDocs}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');
      const snap=await getDocs(collection(fb.db,'songs'));
      const remote=snap.docs.map(x=>({id:x.id,...x.data()})).filter(x=>cleanUrl(x.url));
      if(remote.length)songs=remote;
    }catch(e){console.warn('[Style Saan] Firebase songs unavailable',e)}
    return songs;
  }

  async function initMusic(){
    let b=document.querySelector('.style-music-bubble');
    let l=document.querySelector('.style-music-label');
    if(!b){b=document.createElement('button');b.className='style-music-bubble';b.type='button';b.textContent='♫';b.setAttribute('aria-label','Style Saan Music');document.body.appendChild(b)}
    if(!l){l=document.createElement('div');l.className='style-music-label';l.textContent='STYLE SAAN MUSIC';document.body.appendChild(l)}

    let modal=document.querySelector('.style-music-playlist');
    if(!modal){
      modal=document.createElement('div');modal.className='style-music-playlist';
      modal.innerHTML='<b>🎵 STYLE SAAN MUSIC</b><div class="style-song-list">Loading…</div>';
      document.body.appendChild(modal);
      Object.assign(modal.style,{position:'fixed',right:'18px',bottom:'88px',width:'min(290px,calc(100vw - 36px))',maxHeight:'320px',overflow:'auto',padding:'14px',border:'1px solid rgba(216,180,90,.35)',borderRadius:'18px',background:'rgba(16,14,11,.96)',backdropFilter:'blur(16px)',color:'#ead59a',zIndex:100000,display:'none',boxShadow:'0 20px 50px #000a'});
    }
    const list=modal.querySelector('.style-song-list');

    // Load before the first tap whenever possible.
    let songs=await getSongs();
    render();

    function render(){
      list.innerHTML=songs.length?songs.map((s,i)=>`<a href="${esc(cleanUrl(s.url))}" class="style-song-link" target="_blank" rel="noopener" style="display:block;margin-top:8px;padding:11px 12px;border-radius:12px;border:1px solid #4b3a20;background:#17130d;color:#fff;text-decoration:none;font-size:.82rem"><b>${i+1}. ${esc(s.name||'Song')}</b><br><small style="color:#a99b7b">Open song ↗</small></a>`).join(''):'<div style="padding-top:10px;color:#9f947c;font-size:.8rem">Admin က Chatbox.moe song link မထည့်ရသေးပါ။</div>';
    }

    // IMPORTANT: use location.assign instead of window.open for iPhone/Safari.
    // window.open after an async Firestore read can be blocked as a popup.
    b.onclick=async(e)=>{
      e.preventDefault();e.stopPropagation();
      b.disabled=true;
      try{
        // If Firebase was slow during page load, fetch the songs at tap time.
        if(!songs.length){
          l.textContent='LOADING MUSIC…';l.classList.add('show');
          songs=await getSongs();render();
        }
        if(songs.length===1){
          const url=cleanUrl(songs[0].url);
          if(url){
            b.classList.add('playing');
            l.textContent='OPENING MUSIC…';l.classList.add('show');
            // Direct navigation is allowed by mobile browsers and will actually open Chatbox.moe.
            location.assign(url);
            return;
          }
        }
        if(songs.length>1){
          modal.style.display=modal.style.display==='none'?'block':'none';
          b.classList.toggle('playing',modal.style.display==='block');
          l.textContent=modal.style.display==='block'?'SELECT A SONG':'STYLE SAAN MUSIC';
        }else{
          l.textContent='NO MUSIC LINK';
        }
        l.classList.add('show');
        clearTimeout(window.__styleMusicTimer);window.__styleMusicTimer=setTimeout(()=>l.classList.remove('show'),1800);
      }finally{b.disabled=false}
    };

    // Clicking a playlist item navigates directly too.
    list.addEventListener('click',e=>{
      const a=e.target.closest('.style-song-link');
      if(!a)return;
      e.preventDefault();
      const url=cleanUrl(a.getAttribute('href'));
      if(url)location.assign(url);
    });

    document.addEventListener('click',e=>{if(!modal.contains(e.target)&&e.target!==b){modal.style.display='none';b.classList.remove('playing')}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMusic);else initMusic();
})();