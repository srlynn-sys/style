(()=>{
  async function initMusic(){
    let b=document.querySelector('.style-music-bubble');
    let l=document.querySelector('.style-music-label');
    if(!b){b=document.createElement('button');b.className='style-music-bubble';b.type='button';b.textContent='♫';b.setAttribute('aria-label','Style Saan Music');document.body.appendChild(b)}
    if(!l){l=document.createElement('div');l.className='style-music-label';l.textContent='STYLE SAAN MUSIC';document.body.appendChild(l)}
    if(document.querySelector('.style-music-playlist'))return;
    const modal=document.createElement('div');modal.className='style-music-playlist';modal.innerHTML='<b>🎵 STYLE SAAN MUSIC</b><div class="style-song-list">Loading…</div>';
    document.body.appendChild(modal);
    Object.assign(modal.style,{position:'fixed',right:'18px',bottom:'88px',width:'min(290px,calc(100vw - 36px))',maxHeight:'320px',overflow:'auto',padding:'14px',border:'1px solid rgba(216,180,90,.35)',borderRadius:'18px',background:'rgba(16,14,11,.96)',backdropFilter:'blur(16px)',color:'#ead59a',zIndex:100000,display:'none',boxShadow:'0 20px 50px #000a'});
    const list=modal.querySelector('.style-song-list');
    let songs=[];
    try{
      const fb=await window.StyleSaanFirebaseReady;
      const {collection,getDocs}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');
      const snap=await getDocs(collection(fb.db,'songs'));
      songs=snap.docs.map(x=>x.data()).filter(x=>x.url);
    }catch(e){console.warn('[Style Saan] songs unavailable',e)}
    if(!songs.length){try{songs=JSON.parse(localStorage.getItem('style-songs')||'[]').filter(x=>x.url)}catch{songs=[]}}
    list.innerHTML=songs.length?songs.map((s,i)=>`<a href="${String(s.url).replace(/"/g,'&quot;')}" target="_blank" rel="noopener" style="display:block;margin-top:8px;padding:11px 12px;border-radius:12px;border:1px solid #4b3a20;background:#17130d;color:#fff;text-decoration:none;font-size:.82rem"><b>${i+1}. ${String(s.name||'Song').replace(/[<>]/g,'')}</b><br><small style="color:#a99b7b">Open song ↗</small></a>`).join(''):'<div style="padding-top:10px;color:#9f947c;font-size:.8rem">Admin က song link မထည့်ရသေးပါ။</div>';
    b.onclick=(e)=>{e.stopPropagation();modal.style.display=modal.style.display==='none'?'block':'none';b.classList.toggle('playing',modal.style.display==='block');l.textContent=modal.style.display==='block'?'SELECT A SONG':'STYLE SAAN MUSIC';l.classList.add('show');clearTimeout(window.__styleMusicTimer);window.__styleMusicTimer=setTimeout(()=>l.classList.remove('show'),1400)};
    document.addEventListener('click',e=>{if(!modal.contains(e.target)&&e.target!==b){modal.style.display='none';b.classList.remove('playing')}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMusic);else initMusic();
})();