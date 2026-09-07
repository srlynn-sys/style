/* Style Saan backend bridge: Firestore-backed products/orders/reports with localStorage fallback. */
(async function(){
  const maps={'style-products':'products','style-orders':'orders','style-reports':'reports','style-songs':'songs'};
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
        const next=arr(value),remote=await getDocs(collection(db,col)),ids=new Set(next.map(x=>String(x.id)));
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

/* Firebase Email/Password admin authentication. */
window.addEventListener('load',async()=>{
  if(!document.getElementById('loginBtn')||!window.StyleSaanFirebaseReady)return;
  try{
    const fb=await window.StyleSaanFirebaseReady;
    const {signInWithEmailAndPassword,onAuthStateChanged,signOut}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js');
    const email=document.getElementById('email'),password=document.getElementById('password'),msg=document.getElementById('loginMsg'),login=document.getElementById('login'),dashboard=document.getElementById('dashboard'),btn=document.getElementById('loginBtn'),logout=document.getElementById('logout');
    const show=ok=>{if(login)login.classList.toggle('hidden',ok);if(dashboard)dashboard.classList.toggle('hidden',!ok);if(ok&&typeof window.loadAll==='function')window.loadAll()};
    onAuthStateChanged(fb.auth,user=>show(!!user));
    btn.onclick=async()=>{if(!email.value||!password.value){msg.textContent='Email နဲ့ Password ဖြည့်ပါ။';return}msg.textContent='ဝင်နေပါပြီ…';try{await signInWithEmailAndPassword(fb.auth,email.value.trim(),password.value);msg.textContent=''}catch(e){msg.textContent='Login မအောင်မြင်ပါ။ Firebase Authentication မှာ Email/Password ကိုစစ်ပါ။';console.error(e)}};
    if(logout)logout.onclick=()=>signOut(fb.auth).catch(console.error);
  }catch(e){console.warn('[Style Saan] Firebase Auth bridge unavailable',e)}
});

/* Free payment-slip upload: compress the image in the browser and attach it to the next order as slipImageUrl. This avoids a paid Storage dependency. */
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
    const originalSet=Storage.prototype.setItem;
    if(!window.__styleSlipStorageHook){
      window.__styleSlipStorageHook=true;
      Storage.prototype.setItem=function(key,value){
        if(this===localStorage&&key==='style-orders'&&window.StyleSaanPendingSlip){
          try{const a=JSON.parse(value||'[]');if(a.length){const i=a.length-1;a[i].slipImageUrl=window.StyleSaanPendingSlip;a[i].paymentSlipUrl=window.StyleSaanPendingSlip;value=JSON.stringify(a)}window.StyleSaanPendingSlip=null}catch(e){console.error(e)}}
        return originalSet.call(this,key,value)
      };
    }
  }
  window.addEventListener('load',()=>setTimeout(setupSlip,250));
  const observer=new MutationObserver(()=>setupSlip());
  window.addEventListener('load',()=>observer.observe(document.body,{childList:true,subtree:true}));
})();
