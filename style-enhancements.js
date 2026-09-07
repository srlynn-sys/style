/* Style Saan functional bridge: keep the premium UI, restore the practical Phoo-shop flow. */
(function(){
  const boot=()=>{
    const path=location.pathname.split('/').pop().toLowerCase();
    const rerender=()=>{try{
      if(path==='shop.html'&&typeof home==='function')home();
      else if(path==='wallet.html'&&typeof centerPage==='function')centerPage('wallet');
      else if(path==='fancy.html'&&typeof centerPage==='function')centerPage('fancy');
      else if(path==='cart.html'&&typeof cartPage==='function')cartPage();
      else if(path==='orders.html'&&typeof ordersPage==='function')ordersPage();
      else if(path==='reports.html'&&typeof reportsPage==='function')reportsPage();
    }catch(e){console.warn('[Style Saan] rerender',e)}};
    if(window.StyleSaanBackendReady)window.StyleSaanBackendReady.then(rerender);
    window.addEventListener('style-saan-backend-ready',rerender);
  };
  function checkoutEnhance(){
    if(!location.pathname.endsWith('checkout.html'))return;
    const add=()=>{
      const payment=document.getElementById('payment');if(!payment||document.getElementById('styleCustomerName'))return;
      const old=localStorage.getItem('style-customer')||'';
      const input=document.createElement('input');input.id='styleCustomerName';input.className='input';input.placeholder='Customer Name / နာမည်';input.value=old;payment.parentNode.insertBefore(input,payment);
      const oldSubmit=window.submitOrder;
      if(typeof oldSubmit==='function'&&!window.__styleSubmitWrapped){window.__styleSubmitWrapped=true;window.submitOrder=function(sub,discount,total){const name=document.getElementById('styleCustomerName')?.value.trim();if(!name){if(typeof toast==='function')toast('Customer Name ဖြည့်ပါ။');else alert('Customer Name ဖြည့်ပါ။');return}localStorage.setItem('style-customer',name);return oldSubmit(sub,discount,total)}}
    };
    add();new MutationObserver(add).observe(document.body,{childList:true,subtree:true});
  }
  window.addEventListener('DOMContentLoaded',()=>{boot();setTimeout(checkoutEnhance,100)});
})();