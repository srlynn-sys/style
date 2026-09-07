/* Style Saan backend bridge: Firestore is the shared source of truth; localStorage is only a cache/fallback. */
(async function(){
  const maps={'style-products':'products','style-orders':'orders','style-reports':'reports','style-songs':'songs'};
  try{
    const fb=await window.StyleSaanFirebaseReady;
    const {collection,doc,getDocs,setDoc,onSnapshot}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');
    const {db}=fb;
    const originalSet=Storage.prototype.setItem;
    const originalRemove=Storage.prototype.removeItem;
    const queues={};
    const arr=v=>{try{return JSON.parse(v||'[]')||[]}catch{return[]}};
    const syncLocalToFirestore=(key,value)=>{
      const col=maps[key];if(!col)return Promise.resolve();
      queues[key]=(queues[key]||Promise.resolve()).then(async()=>{
        const next=arr(value);
        await Promise.all(next.filter(x=>x&&x.id!=null).map(x=>setDoc(doc(db,col,String(x.id)),x,{merge:true})));
      }).catch(console.error);
      return queues[key];
    };
    Storage.prototype.setItem=function(key,value){
      originalSet.call(this,key,value);
      if(this===localStorage&&maps[key])syncLocalToFirestore(key,value);
    };
    Storage.prototype.removeItem=function(key){
      originalRemove.call(this,key);
      /* Do not delete the cloud collection from a stale device cache. */
    };
    window.StyleSaanBackendReady=Promise.all(Object.entries(maps).map(async([key,col])=>{
      const snap=await getDocs(collection(db,col));
      if(!snap.empty){
        originalSet.call(localStorage,key,JSON.stringify(snap.docs.map(d=>d.data())));
      }else{
        await syncLocalToFirestore(key,localStorage.getItem(key)||'[]');
      }
      onSnapshot(collection(db,col),s=>{
        const data=s.docs.map(d=>d.data());
        originalSet.call(localStorage,key,JSON.stringify(data));
        if(typeof window.StyleSaanRenderAll==='function')window.StyleSaanRenderAll();
        if(typeof window.loadAll==='function')window.loadAll();
        if(location.pathname.endsWith('shop.html')&&typeof window.home==='function')window.home();
        if(location.pathname.endsWith('wallet.html')&&typeof window.centerPage==='function')window.centerPage('wallet');
        if(location.pathname.endsWith('fancy.html')&&typeof window.centerPage==='function')window.centerPage('fancy');
      });
    }));
    await window.StyleSaanBackendReady;
    window.StyleSaanBackend={db,collection,doc,getDocs,setDoc};
    window.dispatchEvent(new CustomEvent('style-saan-backend-ready'));
    console.log('[Style Saan] Firebase backend connected — cloud sync ready');
  }catch(err){
    window.StyleSaanBackendReady=Promise.resolve(false);
    console.warn('[Style Saan] Firebase unavailable; local mode remains active.',err);
  }
})();

/* Firebase Email/Password admin authentication. */
window.addEventListener('load',async()=>{
  if(!document.getElementById('loginBtn')||!window.StyleSaanFirebaseReady)return;
  try{
    const fb=await window.StyleSaanFirebaseReady;
    const {signInWithEmailAndPassword,onAuthStateChanged,signOut}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    const email=document.getElementById('email'),password=document.getElementById('password'),msg=document.getElementById('loginMsg'),login=document.getElementById('login'),dashboard=document.getElementById('dashboard'),btn=document.getElementById('loginBtn'),logout=document.getElementById('logout');
    const show=ok=>{if(login)login.classList.toggle('hidden',ok);if(dashboard)dashboard.classList.toggle('hidden',!ok);if(ok&&typeof window.StyleSaanRenderAll==='function')window.StyleSaanRenderAll()};
    onAuthStateChanged(fb.auth,user=>show(!!user));
    btn.onclick=async()=>{if(!email.value||!password.value){msg.textContent='Email နဲ့ Password ဖြည့်ပါ။';return}msg.textContent='ဝင်နေပါပြီ…';try{await signInWithEmailAndPassword(fb.auth,email.value.trim(),password.value);msg.textContent=''}catch(e){msg.textContent='Login မအောင်မြင်ပါ။ Firebase Authentication မှာ Email/Password ကိုစစ်ပါ။';console.error(e)}};
    if(logout)logout.onclick=()=>signOut(fb.auth).catch(console.error);
  }catch(e){console.warn('[Style Saan] Firebase Auth bridge unavailable',e)}
});

/* Free payment-slip upload: compress the image in the browser and attach it to the next order as slipImageUrl. */
(function(){
  const MAX_BYTES=780000;
  const compressImage=file=>new Promise((resolve,reject)=>{
    if(!file||!file.type.startsWith('image/'))return reject(new Error('Image file only'));
    const reader=new FileReader();
    reader.onload=()=>{const img=new Image();img.onload=()=>{const maxW=900,maxH=1200,scale=Math.min(1,maxW/img.width,maxH/img.height),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale)),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);let q=.78,data=c.toDataURL('image/jpeg',q);while(data.length>MAX_BYTES&&q>.42){q-=.07;data=c.toDataURL('image/jpeg',q)}if(data.length>MAX_BYTES)return reject(new Error('Slip image is too large'));resolve(data)};img.onerror=()=>reject(new Error('Cannot read image'));img.src=reader.result};reader.onerror=()=>reject(new Error('Cannot read file'));reader.readAsDataURL(file)
  });
  function setupSlip(){
    if(!location.pathname.endsWith('checkout.html')||document.getElementById('styleSlipInput'))return;
    const payment=document.getElementById('payment');if(!payment)return;
    const box=document.createElement('div');box.id='styleSlipBox';box.style.cssText='margin:12px 0;padding:14px;border:1px solid #c29a42;border-radius:16px;background:#15110b;color:#ead59a';
    box.innerHTML='<b>🧾 Payment Slip</b><div style="font-size:.78rem;opacity:.8;margin:6px 0">ငွေလွှဲပြီးရင် slip ပုံတင်ပါ။</div><input id="styleSlipInput" type="file" accept="image/*" style="width:100%"><div id="styleSlipMsg" style="font-size:.78rem;margin-top:6px"></div>';
    payment.parentNode.insertBefore(box,payment.nextSibling);
    const input=box.querySelector('#styleSlipInput'),msg=box.querySelector('#styleSlipMsg');
    input.onchange=async()=>{window.StyleSaanPendingSlip=null;if(!input.files[0])return;msg.textContent='Slip ပြင်ဆင်နေပါပြီ…';try{window.StyleSaanPendingSlip=await compressImage(input.files[0]);msg.textContent='✓ Slip အဆင်သင့်ဖြစ်ပါပြီ';msg.style.color='#9ddd8d'}catch(e){msg.textContent='Slip ပုံကြီးလွန်းပါတယ်။ ပိုသေးတဲ့ပုံရွေးပါ။';msg.style.color='#ff8d82'}};
    const originalSlipSet=Storage.prototype.setItem;
    if(!window.__styleSlipStorageHook){
      window.__styleSlipStorageHook=true;
      Storage.prototype.setItem=function(key,value){
        if(this===localStorage&&key==='style-orders'&&window.StyleSaanPendingSlip){
          try{const a=JSON.parse(value||'[]');if(a.length){const i=a.length-1;a[i].slipImageUrl=window.StyleSaanPendingSlip;a[i].paymentSlipUrl=window.StyleSaanPendingSlip;value=JSON.stringify(a)}window.StyleSaanPendingSlip=null}catch(e){console.error(e)}}
        return originalSlipSet.call(this,key,value)
      };
    }
  }
  window.addEventListener('load',()=>setTimeout(setupSlip,250));
  const observer=new MutationObserver(()=>setupSlip());
  window.addEventListener('load',()=>observer.observe(document.body,{childList:true,subtree:true}));
})();

/* Online payment account details. */
(function(){
  const PHONE='09782158964';
  const NAME='Daw Khin Ma Ma';
  const NOTE='မည်သည့် မှားလွှဲမူမျိုးကိုမဆို Style Saan မှ လက်မခံပါ။';
  function setupOnlinePayment(){
    if(!location.pathname.endsWith('checkout.html'))return;
    const payment=document.getElementById('payment');
    if(!payment||document.getElementById('styleOnlinePaymentInfo'))return;
    const box=document.createElement('div');
    box.id='styleOnlinePaymentInfo';
    box.style.cssText='display:none;margin:12px 0;padding:16px;border:1px solid rgba(216,180,90,.38);border-radius:18px;background:linear-gradient(145deg,#19130a,#0e0d0a);color:#ead59a;box-shadow:0 12px 30px rgba(0,0,0,.28)';
    box.innerHTML='<div style="font-size:.72rem;letter-spacing:.14em;color:#d8b45a;font-weight:800;margin-bottom:10px">ONLINE PAYMENT</div><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:7px"><span style="opacity:.72">Phone Number</span><strong style="font-size:1.08rem;letter-spacing:.04em;color:#fff">'+PHONE+'</strong></div><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px"><span style="opacity:.72">Name</span><strong style="color:#fff">'+NAME+'</strong></div><div style="padding:10px 12px;border-radius:12px;background:rgba(216,180,90,.08);border:1px solid rgba(216,180,90,.15);font-size:.8rem;line-height:1.55"><b style="color:#d8b45a">Note :</b> '+NOTE+'</div>';
    payment.parentNode.insertBefore(box,payment.nextSibling);
    const sync=()=>{box.style.display=payment.value==='online'?'block':'none'};
    payment.addEventListener('change',sync);
    sync();
  }
  window.addEventListener('load',()=>setTimeout(setupOnlinePayment,300));
  const observer=new MutationObserver(()=>setupOnlinePayment());
  window.addEventListener('load',()=>observer.observe(document.body,{childList:true,subtree:true}));
})();