/* Style Saan customer bridge — Firebase order creation + live customer rendering. */
(function(){
  const cart=()=>{try{return JSON.parse(localStorage.getItem('style-cart')||'[]')}catch{return[]}};
  const toast2=t=>typeof window.toast==='function'?window.toast(t):alert(t);
  const money2=n=>typeof window.money==='function'?window.money(n):new Intl.NumberFormat('en-US').format(Number(n)||0)+' Ks';
  const esc2=s=>typeof window.esc==='function'?window.esc(s):String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));

  function paymentPanel(){
    if(document.getElementById('styleOnlinePaymentBox')) return;
    const payment=document.getElementById('payment');
    if(!payment) return;
    const box=document.createElement('div');
    box.id='styleOnlinePaymentBox';
    box.className='flow-card reveal';
    box.style.cssText='margin:16px 0;padding:18px;border:1px solid rgba(216,179,90,.35);background:rgba(216,179,90,.06);border-radius:18px;';
    box.innerHTML=`<div class="section-kicker">ONLINE PAYMENT</div>
      <p style="margin:6px 0 10px;color:#d8b35a;font-weight:700">ငွေလွှဲရန် အချက်အလက်</p>
      <div style="display:grid;gap:8px;margin-bottom:14px">
        <div><span style="opacity:.65">Phone Number</span><br><strong style="font-size:18px;letter-spacing:.4px">09782158964</strong></div>
        <div><span style="opacity:.65">Account Name</span><br><strong style="font-size:18px">Daw Khin Ma Ma</strong></div>
      </div>
      <p style="margin:0 0 12px;font-size:13px;opacity:.78">ငွေလွှဲပြီးပါက Payment Slip ကို အောက်မှာ တင်ပေးပါ။</p>
      <label class="field-label" for="stylePaymentSlip">Payment Slip *</label>
      <input id="stylePaymentSlip" class="input" type="file" accept="image/*" capture="environment">
      <div id="stylePaymentSlipPreview" style="margin-top:10px"></div>
      <p id="stylePaymentSlipStatus" style="margin:8px 0 0;font-size:13px;opacity:.78">Slip မတင်ရသေးပါ။</p>`;
    payment.insertAdjacentElement('afterend',box);
    payment.addEventListener('change',syncPaymentPanel);
    document.getElementById('stylePaymentSlip').addEventListener('change',handleSlip);
    syncPaymentPanel();
  }

  function syncPaymentPanel(){
    const payment=document.getElementById('payment'),box=document.getElementById('styleOnlinePaymentBox');
    if(!payment||!box)return;
    box.style.display=payment.value==='online'?'block':'none';
  }

  function handleSlip(ev){
    const file=ev.target.files?.[0],status=document.getElementById('stylePaymentSlipStatus'),preview=document.getElementById('stylePaymentSlipPreview');
    if(!file){window.StyleSaanPendingSlip='';if(status)status.textContent='Slip မတင်ရသေးပါ။';if(preview)preview.innerHTML='';return;}
    if(!file.type.startsWith('image/')){ev.target.value='';return toast2('Image payment slip ပဲ တင်ပေးပါ။');}
    if(file.size>12*1024*1024){ev.target.value='';return toast2('Payment Slip ပုံအရွယ်အစား 12MB အောက် ဖြစ်ရပါမယ်။');}
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const max=1100,scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
        window.StyleSaanPendingSlip=canvas.toDataURL('image/jpeg',.68);
        if(preview)preview.innerHTML='<img src="'+window.StyleSaanPendingSlip+'" alt="Payment Slip Preview" style="display:block;max-width:100%;max-height:320px;border-radius:14px;border:1px solid rgba(216,179,90,.35)">';
        if(status)status.textContent='Payment Slip တင်ပြီးပါပြီ ✓';
      };
      img.onerror=()=>toast2('Payment Slip ပုံကို ဖတ်မရပါ။');img.src=reader.result;
    };
    reader.onerror=()=>toast2('Payment Slip ဖတ်ရာမှာ အမှားဖြစ်နေပါတယ်။');reader.readAsDataURL(file);
  }

  window.StyleSaanSubmitOrder=async function(sub,discount,total){
    const name=(document.getElementById('styleCustomerName')?.value||'').trim();if(!name)return toast2('Customer Name ဖြည့်ပါ။');
    const items=cart();if(!items.length)return toast2('Cart ထဲမှာ ပစ္စည်းမရှိပါ။');
    const delivery=document.getElementById('delivery')?.value||'pickup',phone=(document.getElementById('phone')?.value||'').trim(),address=(document.getElementById('address')?.value||'').trim(),paymentType=document.getElementById('payment')?.value||'cash';
    if(delivery==='delivery'&&(!phone||!address))return toast2('Delivery အတွက် ဖုန်းနဲ့ လိပ်စာ ဖြည့်ပါ။');
    if(paymentType==='online'&&!window.StyleSaanPendingSlip)return toast2('Online Payment ရွေးထားပါတယ်။ Payment Slip တင်ပေးပါ။');
    try{
      const fb=await window.StyleSaanFirebaseReady;
      const {doc,setDoc}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');
      const code='ORD-'+Math.floor(1000+Math.random()*9000)+'-'+String(Date.now()).slice(-4);
      const order={id:code,orderCode:code,customerName:name,center:items[0]?.center||'',centerName:items[0]?.center==='wallet'?'Wallet Shop Center':items[0]?.center==='fancy'?'Fancy Shop Center':'Style Saan',items:items.map(x=>({id:String(x.id),name:x.name,price:Number(x.price||0),qty:Number(x.qty||0)})),subtotal:Number(sub||0),discount:Number(discount||0),totalAmount:Number(total||0),total:Number(total||0),deliveryType:delivery,phone,address,paymentType,note:(document.getElementById('note')?.value||'').trim()||'မရှိပါ',status:'order စစ်ဆေးနေဆဲ',adminNote:'',paymentSlipUrl:window.StyleSaanPendingSlip||'',slipImageUrl:window.StyleSaanPendingSlip||'',createdAt:new Date().toISOString()};
      await setDoc(doc(fb.db,'orders',code),order);
      localStorage.setItem('style-customer',name);localStorage.setItem('style-cart','[]');window.StyleSaanPendingSlip=null;location.href='success.html?code='+encodeURIComponent(code);
    }catch(e){console.error('[Style Saan] Firestore order create failed',e);toast2('Order တင်မရသေးပါ။ Internet connection နဲ့ Firebase ကိုစစ်ပြီး ပြန်ကြိုးစားပါ။')}
  };

  window.StyleSaanCheckOrder=async function(){const code=(document.getElementById('code')?.value||'').trim(),r=document.getElementById('result');if(!code)return toast2('Order Code ထည့်ပါ။');try{const fb=await window.StyleSaanFirebaseReady;const {doc,getDoc}=await import('https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js');const s=await getDoc(doc(fb.db,'orders',code));if(!s.exists()){if(r){r.className='checker-result reveal';r.innerHTML='<p>Order Code မတွေ့ရှိပါ။</p>'}return}const o=s.data();if(r){r.className='checker-result reveal';r.innerHTML='<span class="eyebrow">ORDER '+esc2(o.orderCode)+'</span><h3>'+esc2(o.customerName||'Customer')+'</h3><span class="status-badge yellow">'+esc2(o.status||'order စစ်ဆေးနေဆဲ')+'</span><p>Shop Center: <b>'+esc2(o.centerName||'Style Saan')+'</b></p><p>Total: <b>'+money2(o.totalAmount||o.total)+'</b></p><p>Admin Note: '+esc2(o.adminNote||'မရှိပါ')+'</p><p class="muted">'+(o.createdAt?new Date(o.createdAt).toLocaleString():'')+'</p>'}}catch(e){console.error(e);toast2('Order စစ်ဆေးရာတွင် အမှားဖြစ်နေပါတယ်။')}};

  function install(){window.submitOrder=window.StyleSaanSubmitOrder;window.checkOrder=window.StyleSaanCheckOrder;if(typeof window.StyleSaanRefreshRuntime==='function')window.StyleSaanRefreshRuntime();setTimeout(paymentPanel,80);setTimeout(paymentPanel,400);setTimeout(paymentPanel,1000)}
  window.addEventListener('style-saan-backend-ready',()=>setTimeout(install,80));window.addEventListener('load',()=>{setTimeout(install,250);setTimeout(install,900)})
})();