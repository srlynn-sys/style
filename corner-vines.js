(()=>{
  const CSS=`
    #styleCornerVines{position:fixed;inset:0;z-index:9990;pointer-events:none;overflow:hidden;display:block}
    #styleCornerVines .vine{position:absolute;width:210px;height:180px;opacity:0;animation:styleVineFade 10s ease-in-out infinite;filter:drop-shadow(0 0 9px rgba(216,180,90,.28))}
    #styleCornerVines svg{width:100%;height:100%;overflow:visible}
    #styleCornerVines path{fill:none;stroke:#cfae58;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
    #styleCornerVines .leaf{fill:#b88b32;stroke:#f0d88e;stroke-width:1}
    #styleCornerVines .flower{fill:#f0d98e;stroke:#fff3c7;stroke-width:1;filter:drop-shadow(0 0 6px rgba(255,224,135,.8))}
    #styleCornerVines .tl{top:-8px;left:-8px}.tr{top:-8px;right:-8px;transform:scaleX(-1);animation-delay:-2.5s!important}.bl{bottom:-8px;left:-8px;transform:scaleY(-1);animation-delay:-5s!important}.br{bottom:-8px;right:-8px;transform:scale(-1);animation-delay:-7.5s!important}
    @keyframes styleVineFade{0%,8%{opacity:0;transform:scale(.76)}18%,38%{opacity:.92;transform:scale(1)}50%,100%{opacity:0;transform:scale(.93)}}
    @media(max-width:600px){#styleCornerVines .vine{width:135px;height:120px}#styleCornerVines path{stroke-width:1.7}}
    @media(prefers-reduced-motion:reduce){#styleCornerVines .vine{animation:none!important;opacity:.3}}
  `;
  const svg=`<svg viewBox="0 0 210 180"><path d="M5 8C35 24 48 52 76 67S139 71 168 102c18 19 27 42 36 69"/><path d="M42 38c18-8 33-13 49-9"/><path d="M76 67c6-18 18-28 34-30"/><path d="M115 79c15-21 31-27 47-22"/><path d="M149 101c15-16 31-19 46-13"/><ellipse class="leaf" cx="48" cy="39" rx="9" ry="4" transform="rotate(-28 48 39)"/><ellipse class="leaf" cx="70" cy="55" rx="10" ry="4" transform="rotate(34 70 55)"/><ellipse class="leaf" cx="91" cy="46" rx="9" ry="4" transform="rotate(-24 91 46)"/><ellipse class="leaf" cx="128" cy="66" rx="10" ry="4" transform="rotate(28 128 66)"/><ellipse class="leaf" cx="151" cy="76" rx="9" ry="4" transform="rotate(-30 151 76)"/><ellipse class="leaf" cx="173" cy="92" rx="10" ry="4" transform="rotate(30 173 92)"/><circle class="flower" cx="91" cy="29" r="5"/><circle class="flower" cx="162" cy="57" r="5"/><circle class="flower" cx="195" cy="88" r="5"/><circle class="flower" cx="76" cy="67" r="3"/></svg>`;
  function mount(){
    if(!document.querySelector('.intro-card'))return false;
    if(!document.getElementById('styleCornerVines')){
      const s=document.createElement('style');s.id='styleCornerVinesStyle';s.textContent=CSS;document.head.appendChild(s);
      const layer=document.createElement('div');layer.id='styleCornerVines';layer.setAttribute('aria-hidden','true');
      ['tl','tr','bl','br'].forEach(c=>{const v=document.createElement('div');v.className='vine '+c;v.innerHTML=svg;layer.appendChild(v)});
      document.body.appendChild(layer);
    }
    return true;
  }
  const tryMount=()=>{if(mount())return;setTimeout(tryMount,120)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryMount,{once:true});else tryMount();
  new MutationObserver(()=>{if(document.querySelector('.intro-card')&&!document.getElementById('styleCornerVines'))mount()}).observe(document.documentElement,{childList:true,subtree:true});
})();