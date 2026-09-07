/* Style Saan backend bridge: Firestore-backed products/orders/reports with localStorage fallback. */
(async function(){
  const maps={
    'style-products':'products',
    'style-orders':'orders',
    'style-reports':'reports',
    'style-songs':'songs'
  };
  try{
    const fb=await window.StyleSaanFirebaseReady;
    const {collection,doc,getDocs,setDoc,deleteDoc,onSnapshot}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');
    const {db}=fb;
    const busy=new Set();
    const arr=v=>{try{return JSON.parse(v||'[]')||[]}catch{return[]}};
    async function push(key,value){
      const col=maps[key]; if(!col||busy.has(key))return;
      busy.add(key);
      try{
        const next=arr(value), remote=await getDocs(collection(db,col)), ids=new Set(next.map(x=>String(x.id)));
        await Promise.all(remote.docs.filter(d=>!ids.has(String(d.id))).map(d=>deleteDoc(d.ref)));
        await Promise.all(next.filter(x=>x&&x.id!=null).map(x=>setDoc(doc(db,col,String(x.id)),x,{merge:true})));
      }finally{busy.delete(key)}
    }
    const originalSet=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      originalSet.call(this,key,value);
      if(this===localStorage&&maps[key])push(key,value).catch(console.error);
    };
    const originalRemove=Storage.prototype.removeItem;
    Storage.prototype.removeItem=function(key){
      originalRemove.call(this,key);
      if(this===localStorage&&maps[key])push(key,'[]').catch(console.error);
    };
    for(const [key,col] of Object.entries(maps)){
      const snap=await getDocs(collection(db,col));
      if(snap.empty){await push(key,localStorage.getItem(key)||'[]');}
      else{
        const data=snap.docs.map(d=>d.data());
        busy.add(key);originalSet.call(localStorage,key,JSON.stringify(data));busy.delete(key);
      }
      onSnapshot(collection(db,col),s=>{
        if(busy.has(key))return;
        const data=s.docs.map(d=>d.data());
        busy.add(key);originalSet.call(localStorage,key,JSON.stringify(data));busy.delete(key);
        if(typeof window.loadAll==='function')window.loadAll();
        if(location.pathname.endsWith('shop.html')||location.pathname.endsWith('wallet.html')||location.pathname.endsWith('fancy.html')){
          const p=location.pathname.split('/').pop();
          if(p==='shop.html'&&typeof window.home==='function')window.home();
          if(p==='wallet.html'&&typeof window.centerPage==='function')window.centerPage('wallet');
          if(p==='fancy.html'&&typeof window.centerPage==='function')window.centerPage('fancy');
        }
      });
    }
    window.StyleSaanBackend={db,collection,doc,getDocs,setDoc,deleteDoc};
    console.log('[Style Saan] Firebase backend connected');
  }catch(err){console.warn('[Style Saan] Firebase unavailable; local mode remains active.',err)}
})();

/* Upgrade the admin login to Firebase Email/Password when the page exposes the login controls. */
window.addEventListener('load',async()=>{
  if(!document.getElementById('loginBtn')||!window.StyleSaanFirebaseReady)return;
  try{
    const fb=await window.StyleSaanFirebaseReady;
    const {signInWithEmailAndPassword,onAuthStateChanged,signOut}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    const email=document.getElementById('email'),password=document.getElementById('password'),msg=document.getElementById('loginMsg'),login=document.getElementById('login'),dashboard=document.getElementById('dashboard'),btn=document.getElementById('loginBtn'),logout=document.getElementById('logout');
    const show=ok=>{if(login)login.classList.toggle('hidden',ok);if(dashboard)dashboard.classList.toggle('hidden',!ok);if(ok&&typeof loadAll==='function')loadAll()};
    onAuthStateChanged(fb.auth,user=>show(!!user));
    btn.onclick=async()=>{if(!email.value||!password.value){msg.textContent='Email နဲ့ Password ဖြည့်ပါ။';return}msg.textContent='ဝင်နေပါပြီ…';try{await signInWithEmailAndPassword(fb.auth,email.value.trim(),password.value)}catch(e){msg.textContent='Login မအောင်မြင်ပါ။ Firebase Authentication account ကိုစစ်ပါ။';console.error(e)}};
    if(logout)logout.onclick=()=>signOut(fb.auth).catch(console.error);
  }catch(e){console.warn('[Style Saan] Firebase Auth bridge unavailable',e)}
});
