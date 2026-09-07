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
        if(typeof window.StyleSaanRefreshRuntime==='function')window.StyleSaanRefreshRuntime(key,data);
        if(typeof window.StyleSaanRenderAll==='function')window.StyleSaanRenderAll();
        if(typeof window.loadAll==='function')window.loadAll();
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
    const email=document.getElementById('email'),password=document.getElementById('password'),msg=document.getElementById('loginMsg')||document.getElementById('msg'),login=document.getElementById('login'),dashboard=document.getElementById('dashboard')||document.getElementById('dash'),btn=document.getElementById('loginBtn'),logout=document.getElementById('logout');
    const show=ok=>{if(login)login.classList.toggle('hidden',ok);if(dashboard)dashboard.classList.toggle('hidden',!ok);if(ok&&typeof window.StyleSaanRenderAll==='function')window.StyleSaanRenderAll()};
    onAuthStateChanged(fb.auth,user=>show(!!user));
    if(btn)btn.onclick=async()=>{if(!email.value||!password.value){if(msg)msg.textContent='Email နဲ့ Password ဖြည့်ပါ။';return}if(msg)msg.textContent='ဝင်နေပါပြီ…';try{await signInWithEmailAndPassword(fb.auth,email.value.trim(),password.value);if(msg)msg.textContent=''}catch(e){if(msg)msg.textContent='Login မအောင်မြင်ပါ။ Firebase Authentication မှာ Email/Password ကိုစစ်ပါ။';console.error(e)}};
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

/* Style Saan runtime: keep the existing luxury UI, but always render customer data from the shared Firestore-backed cache. */
(function(){
  const K={products:'style-products',orders:'style-orders',cart:'style-cart',customer:'style-customer',reports:'style-reports'};
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d}catch{return d}};
  const products=()=>read(K.products,[]),orders=()=>read(K.orders,[]),cart=()=>read(K.cart,[]),reports=()=>read(K.reports,[]),customer=()=>localStorage.getItem(K.customer)||'';
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const money2=n=>typeof window.money==='function'?window.money(n):new Intl.NumberFormat('en-US').format(Number(n)||0)+' Ks';
  const esc2=s=>typeof window.esc==='function'?window.esc(s):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const img2=p=>typeof window.img==='function'?window.img(p):(p.image||'https://placehold.co/800x800/17130b/d8b35a?text=STYLE');
  const showToast=t=>typeof window.toast==='function'?window.toast(t):alert(t);
  const detailLinks=p=>(p.detailPhotos||p.details||[]).filter(Boolean);
  function freshCards(list){return list.map((p,i)=>`<article class="product-card reveal" style="--delay:${i*45}ms"><div class="product-photo-wrap"><img class="product-photo" src="${esc2(img2(p))}" alt="${esc2(p.name)}"></div><div class="product-info"><span class="product-center">${p.center==='wallet'?'WALLET':'FANCY'}</span><h3>${esc2(p.name)}</h3><strong>${money2(p.price)}</strong><small>${Number(p.stock||0)>0?'Stock '+Number(p.stock):'Out of Stock'}</small><a class="gold-outline" href="product.html?id=${encodeURIComponent(p.id)}">Show Photo / Order</a></div></article>`).join('')||'<div class="empty">ပစ္စည်းများ မရှိသေးပါ။</div>'}
  function renderHome(){if(typeof window.shell!=='function')return;window.shell('Shop Center',`<section class="flow-card intro-card hero-glow"><div class="hero-orbit"><span></span><span></span><span></span></div><img class="main-logo float-logo" src="https://lh3.googleusercontent.com/d/1bM_UNFnp1L8VyqSkPBIQwfUNdQX0-07J"><span class="eyebrow">WELCOME TO STYLE</span><h1>သင့် Style ကို<br><em>ရွေးချယ်ပါ</em></h1><p>Shop Center တစ်ခုရွေးပြီး သီးသန့် page နဲ့ ကြည့်နိုင်ပါတယ်။</p><label class="field-label">Customer Name</label><input id="customer" class="input" value="${esc2(customer())}" placeholder="နာမည် ရိုက်ထည့်ပါ..."><div class="center-grid compact"><a class="center-card reveal" href="wallet.html" onclick="rememberCustomer()"><span class="card-icon">◈</span><strong>Wallet Shop Center</strong><small>Wallet Collection</small><i>ဝင်မည် →</i></a><a class="center-card reveal" style="--delay:80ms" href="fancy.html" onclick="rememberCustomer()"><span class="card-icon">✦</span><strong>Fancy Shop Center</strong><small>Fancy Collection</small><i>ဝင်မည် →</i></a></div><div class="quick-centers"><a href="orders.html">⌁ Order Check</a><a href="reports.html">⚑ Report Center</a></div></section>`)}
  function renderCenter(c){if(typeof window.shell!=='function')return;const name=c==='wallet'?'Wallet Shop Center':'Fancy Shop Center';window.shell(name,`<div class="flow-card"><div class="filters"><a class="filter active" href="${c}.html">${c==='wallet'?'◈ Wallet':'✦ Fancy'}</a><a class="filter" href="shop.html">All Products</a><a class="filter" href="cart.html">Cart</a></div><div class="section-kicker">CURATED COLLECTION</div><div class="product-grid">${freshCards(products().filter(p=>p.center===c))}</div></div>`)}
  function renderProduct(){const p=products().find(x=>x.id===new URLSearchParams(location.search).get('id'));if(!p)return renderHome();if(typeof window.shell!=='function')return;const links=[p.image,...detailLinks(p)].filter(Boolean);window.shell('Product Detail',`<section class="flow-card product-detail-card"><div class="detail-images">${links.map(u=>`<img class="detail-reveal" src="${esc2(u)}" alt="${esc2(p.name)}">`).join('')||`<img src="${esc2(img2(p))}" alt="${esc2(p.name)}">`}</div><span class="eyebrow">${p.center==='wallet'?'WALLET':'FANCY'}</span><h2>${esc2(p.name)}</h2><div class="detail-price">${money2(p.price)}</div><p class="detail-note">${esc2(p.note||'Premium Style collection item.')}</p><div class="qty-row"><button onclick="changeQty(-1)">−</button><strong id="qty">1</strong><button onclick="changeQty(1)">+</button></div><button class="gold-outline" onclick="addCart('${esc2(p.id)}')">Add to Cart</button><button class="gold-btn pulse-btn" onclick="buyNow('${esc2(p.id)}')">Order Now →</button></section>`);window.currentProduct=p;window.currentQty=1}
  window.changeQty=function(n){const p=products().find(x=>x.id===window.currentProduct?.id);window.currentQty=Math.max(1,Math.min(Number(p?.stock||1),Number(window.currentQty||1)+n));const q=document.getElementById('qty');if(q)q.textContent=window.currentQty};
  window.addCart=function(id,qty){const list=cart(),p=products().find(x=>x.id===id);qty=Math.max(1,Number(qty||window.currentQty||1));if(!p)return;if(Number(p.stock||0)<=0)return showToast('ဒီပစ္စည်း Stock မရှိတော့ပါ။');const old=list.find(x=>x.id===id);if(old){if(old.qty+qty>p.stock)return showToast('Stock မလုံလောက်ပါ။');old.qty+=qty}else list.push({...p,qty});save(K.cart,list);showToast('Cart ထဲထည့်ပြီးပါပြီ ✦');if(typeof window.updateCount==='function')window.updateCount()};
  window.buyNow=function(id){window.addCart(id);location.href='cart.html'};
  window.rememberCustomer=function(){const e=document.getElementById('customer');if(e&&e.value.trim())localStorage.setItem(K.customer,e.value.trim())};
  function renderCart(){if(typeof window.shell!=='function')return;const list=cart(),sub=list.reduce((a,x)=>a+Number(x.price||0)*Number(x.qty||0),0);window.shell('Shopping Cart',`<section class="flow-card"><label class="field-label">Customer Name</label><input id="styleCartCustomer" class="input" value="${esc2(customer())}" placeholder="နာမည် ရိုက်ထည့်ပါ..." oninput="localStorage.setItem('style-customer',this.value)"><div id="cartList">${list.length?list.map(x=>`<div class="cart-row"><div><b>${esc2(x.name)}</b><small>${money2(x.price)} × ${x.qty}</small></div><div class="cart-actions"><button onclick="cartMinus('${esc2(x.id)}')">−</button><b>${x.qty}</b><button onclick="cartPlus('${esc2(x.id)}')">+</button><button class="remove" onclick="cartRemove('${esc2(x.id)}')">×</button></div></div>`).join(''):'<div class="empty">Cart ထဲမှာ ပစ္စည်းမရှိသေးပါ။</div>'}</div><div class="invoice"><div><span>Subtotal</span><b>${money2(sub)}</b></div><div class="invoice-total"><span>Total</span><b>${money2(sub)}</b></div></div>${list.length?'<button class="gold-btn" onclick="goCheckout()">Continue to Order →</button>':'<a class="gold-btn" href="shop.html">Shop Now →</a>'}</section>`)}
  window.goCheckout=function(){const n=(document.getElementById('styleCartCustomer')?.value||'').trim();if(!n)return showToast('Customer Name ဖြည့်ပါ။');localStorage.setItem(K.customer,n);location.href='checkout.html'};
  window.cartPlus=function(id){const list=cart(),x=list.find(a=>a.id===id),p=products().find(a=>a.id===id);if(x&&p&&x.qty<p.stock)x.qty++;else showToast('Stock မလုံလောက်ပါ။');save(K.cart,list);renderCart()};
  window.cartMinus=function(id){let list=cart(),x=list.find(a=>a.id===id);if(!x)return;x.qty--;if(x.qty<=0)list=list.filter(a=>a.id!==id);save(K.cart,list);renderCart()};
  window.cartRemove=function(id){save(K.cart,cart().filter(a=>a.id!==id));renderCart()};
  function renderCheckout(){const list=cart();if(!list.length)return location.href='cart.html';if(typeof window.shell!=='function')return;const sub=list.reduce((a,x)=>a+Number(x.price||0)*Number(x.qty||0),0),discount=sub>=10000?Math.floor(sub/10000)*500:0,total=sub-discount;window.shell('Checkout',`<section class="flow-card"><label class="field-label">Customer Name</label><input id="styleCustomerName" class="input" value="${esc2(customer())}" placeholder="နာမည် ရိုက်ထည့်ပါ..."><div class="invoice"><div><span>Subtotal</span><b>${money2(sub)}</b></div><div><span>Discount</span><b>-${money2(discount)}</b></div><div class="invoice-total"><span>Total</span><b>${money2(total)}</b></div></div><input id="phone" class="input" placeholder="ဖုန်းနံပါတ်"><select id="delivery" class="input"><option value="pickup">Pick-up လာယူမည်</option><option value="delivery">Delivery ပို့မည်</option></select><textarea id="address" class="input" placeholder="Delivery လိပ်စာ"></textarea><select id="payment" class="input"><option value="cash">Cash</option><option value="online">Online Payment</option></select><textarea id="note" class="input" placeholder="Order Note"></textarea><button class="gold-btn" onclick="submitOrder(${sub},${discount},${total})">Confirm Order ✓</button></section>`)}
  window.submitOrder=function(sub,discount,total){const name=(document.getElementById('styleCustomerName')?.value||'').trim();if(!name)return showToast('Customer Name ဖြည့်ပါ။');localStorage.setItem(K.customer,name);const list=cart(),delivery=document.getElementById('delivery')?.value||'pickup',phone=document.getElementById('phone')?.value.trim()||'',address=document.getElementById('address')?.value.trim()||'';if(delivery==='delivery'&&(!phone||!address))return showToast('Delivery အတွက် ဖုန်းနဲ့ လိပ်စာ ဖြည့်ပါ။');const payment=document.getElementById('payment')?.value||'cash';const code='ORD-'+Math.floor(1000+Math.random()*9000);const o={id:Date.now().toString(),orderCode:code,customerName:name,centerName:list[0]?.center==='wallet'?'Wallet Shop Center':list[0]?.center==='fancy'?'Fancy Shop Center':'Style Saan',center:list[0]?.center||'',items:list.map(x=>({id:x.id,name:x.name,price:x.price,qty:x.qty})),subtotal:Number(sub),discount:Number(discount),totalAmount:Number(total),total:Number(total),deliveryType:delivery,phone,address,paymentType:payment,note:document.getElementById('note')?.value.trim()||'မရှိပါ',status:'order စစ်ဆေးနေဆဲ',adminNote:'',createdAt:new Date().toISOString()};const os=orders();os.unshift(o);save(K.orders,os);const ps=products();list.forEach(x=>{const p=ps.find(a=>a.id===x.id);if(p)p.stock=Math.max(0,Number(p.stock||0)-Number(x.qty||0))});save(K.products,ps);save(K.cart,[]);location.href='success.html?code='+encodeURIComponent(code)};
  function renderSuccess(){const o=orders().find(x=>x.orderCode===new URLSearchParams(location.search).get('code'));if(typeof window.shell!=='function')return;window.shell('Order Received',`<section class="flow-card success-card"><div class="success-icon success-pop">✓</div><span class="eyebrow">ORDER RECEIVED</span><h2>Order တင်ပြီးပါပြီ</h2><p>Order Code</p><strong class="order-code">${esc2(o?.orderCode||'')}</strong><p>${esc2(o?.customerName||customer())}</p><p>Total: <b>${money2(o?.totalAmount)}</b></p><a class="gold-btn" href="orders.html">Order Status ကြည့်မည် →</a><a class="gold-outline" href="shop.html">Continue Shopping</a></section>`)}
  window.checkOrder=function(){const code=document.getElementById('code')?.value.trim(),o=orders().find(x=>x.orderCode===code),r=document.getElementById('result');if(!o)return showToast('Order Code မတွေ့ရှိပါ။');if(!r)return;r.className='checker-result reveal';r.innerHTML=`<span class="eyebrow">ORDER ${esc2(o.orderCode)}</span><h3>${esc2(o.customerName||'Customer')}</h3><span class="status-badge yellow">${esc2(o.status||'order စစ်ဆေးနေဆဲ')}</span><p>Shop Center: <b>${esc2(o.centerName||'Style Saan')}</b></p><p>Total: <b>${money2(o.totalAmount||o.total)}</b></p><p>Admin Note: ${esc2(o.adminNote||'မရှိပါ')}</p><p class="muted">${o.createdAt?new Date(o.createdAt).toLocaleString():''}</p>`};
  function renderOrders(){if(typeof window.shell!=='function')return;window.shell('Order Checker',`<section class="flow-card checker-card"><div class="feature-icon">⌁</div><span class="eyebrow">ORDER CENTER</span><h2>Order Status စစ်ဆေးရန်</h2><p>သင့် Order Code ထည့်ပြီး order ရဲ့ လက်ရှိအခြေအနေကို စစ်ဆေးနိုင်ပါတယ်။</p><input id="code" class="input" placeholder="Order Code (ဥပမာ ORD-1234)"><button class="gold-btn" onclick="checkOrder()">Check Order →</button><div id="result" class="hidden"></div></section>`)}
  window.StyleSaanRefreshRuntime=function(){const p=location.pathname.split('/').pop().toLowerCase();try{if(p==='index.html'||p==='')renderHome();else if(p==='shop.html')renderHome();else if(p==='wallet.html')renderCenter('wallet');else if(p==='fancy.html')renderCenter('fancy');else if(p==='product.html')renderProduct();else if(p==='cart.html')renderCart();else if(p==='checkout.html')renderCheckout();else if(p==='success.html')renderSuccess();else if(p==='orders.html')renderOrders()}catch(e){console.warn('[Style Saan] runtime render',e)}};
  window.addEventListener('style-saan-backend-ready',()=>setTimeout(window.StyleSaanRefreshRuntime,40));
  window.addEventListener('load',()=>setTimeout(window.StyleSaanRefreshRuntime,80));
})();