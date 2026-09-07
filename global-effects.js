(()=>{
  const id='styleGlobalEffects';
  if(document.getElementById(id)) return;
  const css=`
    #styleGlobalEffects{position:fixed;inset:0;pointer-events:none;z-index:9990;overflow:hidden}
    #styleGlobalEffects .g-vine{position:absolute;width:220px;height:190px;opacity:0;filter:drop-shadow(0 0 10px rgba(216,180,90,.3));animation:gVine 10s ease-in-out infinite}
    #styleGlobalEffects .g-vine svg{width:100%;height:100%;overflow:visible}
    #styleGlobalEffects path{fill:none;stroke:#d8b45a;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
    #styleGlobalEffects .leaf{fill:#b88b32;stroke:#f2dc98;stroke-width:1}
    #styleGlobalEffects .flower{fill:#f2dc98;stroke:#fff5cf;stroke-width:1;filter:drop-shadow(0 0 7px rgba(255,224,135,.8))}
    #styleGlobalEffects .tl{top:-8px;left:-8px}.tr{top:-8px;right:-8px;transform:scaleX(-1);animation-delay:-2.5s!important}.bl{bottom:-8px;left:-8px;transform:scaleY(-1);animation-delay:-5s!important}.br{bottom:-8px;right:-8px;transform:scale(-1);animation-delay:-7.5s!important}
    @keyframes gVine{0%,8%{opacity:0;transform:scale(.78)}18%,38%{opacity:.94;transform:scale(1)}50%,100%{opacity:0;transform:scale(.92)}}
    @media(max-width:700px){#styleGlobalEffects .g-vine{width:140px;height:125px}#styleGlobalEffects path{stroke-width:1.7}}
    @media(min-width:701px){#styleGlobalEffects .g-vine{width:190px;height:165px}}
    @media(prefers-reduced-motion:reduce){#styleGlobalEffects .g-vine{animation:none!important;opacity:.28}}
    body{--style-motion-speed:1}
    .flow-card,.center-card,.product-card,.cart-row,.checker-card,.success-card,.feature-card{animation:styleCardIn .65s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--delay,0ms)}
    .product-photo,.detail-images img{transition:transform .55s cubic-bezier(.2,.8,.2,1),filter .55s ease}
    .product-card:hover .product-photo,.detail-images img:hover{transform:scale(1.035);filter:brightness(1.08)}
    .gold-btn,.gold-outline,.center-card,.filter,.style-music-bubble{transition:transform .25s ease,box-shadow .25s ease,filter .25s ease}
    .gold-btn:hover,.gold-outline:hover,.center-card:hover,.filter:hover{transform:translateY(-2px);filter:brightness(1.08)}
    @keyframes styleCardIn{from{opacity:0;transform:translateY(18px) scale(.985);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}
    @media(max-width:700px){.flow-card,.center-card,.product-card,.cart-row,.checker-card,.success-card,.feature-card{animation-duration:.5s}.product-card:hover .product-photo,.detail-images img:hover{transform:none}}
  `;
  const svg=`<svg viewBox="0 0 220 190"><path d="M5 8C36 24 50 54 79 70s63 4 91 35c18 20 28 46 39 73"/><path d="M45 40c18-8 34-13 50-9"/><path d="M79 70c7-18 19-29 35-31"/><path d="M119 82c15-21 32-28 48-23"/><path d="M153 105c15-16 32-20 48-14"/><ellipse class="leaf" cx="50" cy="40" rx="9" ry="4" transform="rotate(-28 50 40)"/><ellipse class="leaf" cx="73" cy="57" rx="10" ry="4" transform="rotate(34 73 57)"/><ellipse class="leaf" cx="95" cy="48" rx="9" ry="4" transform="rotate(-24 95 48)"/><ellipse class="leaf" cx="132" cy="69" rx="10" ry="4" transform="rotate(28 132 69)"/><ellipse class="leaf" cx="155" cy="80" rx="9" ry="4" transform="rotate(-30 155 80)"/><ellipse class="leaf" cx="178" cy="96" rx="10" ry="4" transform="rotate(30 178 96)"/><circle class="flower" cx="95" cy="31" r="5"/><circle class="flower" cx="166" cy="59" r="5"/><circle class="flower" cx="199" cy="91" r="5"/><circle class="flower" cx="79" cy="70" r="3"/></svg>`;
  function mount(){
    if(document.getElementById(id)) return;
    const s=document.createElement('style');s.id=id+'CSS';s.textContent=css;document.head.appendChild(s);
    const layer=document.createElement('div');layer.id=id;layer.setAttribute('aria-hidden','true');
    ['tl','tr','bl','br'].forEach(c=>{const v=document.createElement('div');v.className='g-vine '+c;v.innerHTML=svg;layer.appendChild(v)});
    document.body.appendChild(layer);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})();