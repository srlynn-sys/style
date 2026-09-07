(()=>{
  const CSS=`
    #styleCornerVines{position:fixed;inset:0;z-index:9990;pointer-events:none;overflow:hidden;display:block}
    #styleCornerVines .vine{position:absolute;width:240px;height:205px;opacity:0;filter:drop-shadow(0 0 10px rgba(216,180,90,.30))}
    #styleCornerVines svg{width:100%;height:100%;overflow:visible}
    #styleCornerVines path{fill:none;stroke:#cfae58;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
    #styleCornerVines .leaf{fill:#b88b32;stroke:#f0d88e;stroke-width:1}
    #styleCornerVines .flower{fill:#f0d98e;stroke:#fff3c7;stroke-width:1;filter:drop-shadow(0 0 6px rgba(255,224,135,.85))}
    #styleCornerVines .tl{top:-8px;left:-8px;animation:stylePairA 10s ease-in-out infinite}
    #styleCornerVines .br{bottom:-8px;right:-8px;transform:scale(-1);animation:stylePairA 10s ease-in-out infinite;animation-delay:-5s}
    #styleCornerVines .tr{top:-8px;right:-8px;transform:scaleX(-1);animation:stylePairB 10s ease-in-out infinite;animation-delay:-2.5s}
    #styleCornerVines .bl{bottom:-8px;left:-8px;transform:scaleY(-1);animation:stylePairB 10s ease-in-out infinite;animation-delay:-7.5s}
    @keyframes stylePairA{0%,8%{opacity:0;transform:scale(.76)}18%,38%{opacity:.96;transform:scale(1)}50%,100%{opacity:0;transform:scale(.93)}}
    @keyframes stylePairB{0%,8%{opacity:0;transform:scaleX(-1) scale(.76)}18%,38%{opacity:.96;transform:scaleX(-1) scale(1)}50%,100%{opacity:0;transform:scaleX(-1) scale(.93)}}
    #styleCornerVines .br{animation-name:stylePairAReverse}
    @keyframes stylePairAReverse{0%,8%{opacity:0;transform:scale(-.76)}18%,38%{opacity:.96;transform:scale(-1)}50%,100%{opacity:0;transform:scale(-.93)}}
    #styleCornerVines .bl{animation-name:stylePairBReverse}
    @keyframes stylePairBReverse{0%,8%{opacity:0;transform:scaleY(-1) scale(.76)}18%,38%{opacity:.96;transform:scaleY(-1) scale(1)}50%,100%{opacity:0;transform:scaleY(-1) scale(.93)}}
    @media(max-width:600px){#styleCornerVines .vine{width:155px;height:135px}#styleCornerVines path{stroke-width:1.7}}
    @media(prefers-reduced-motion:reduce){#styleCornerVines .vine{animation:none!important;opacity:.3}}
  `;
  const svg=`<svg viewBox="0 0 240 205"><path d="M5 8C38 22 48 55 78 69S145 72 178 105c20 20 34 47 54 88"/><path d="M43 39c19-10 36-14 53-9"/><path d="M78 69c7-20 20-31 38-34"/><path d="M119 82c16-22 34-29 52-23"/><path d="M158 106c16-18 34-22 51-14"/><ellipse class="leaf" cx="48" cy="40" rx="10" ry="4" transform="rotate(-28 48 40)"/><ellipse class="leaf" cx="70" cy="57" rx="11" ry="4" transform="rotate(34 70 57)"/><ellipse class="leaf" cx="94" cy="47" rx="10" ry="4" transform="rotate(-24 94 47)"/><ellipse class="leaf" cx="128" cy="68" rx="11" ry="4" transform="rotate(28 128 68)"/><ellipse class="leaf" cx="153" cy="79" rx="10" ry="4" transform="rotate(-30 153 79)"/><ellipse class="leaf" cx="180" cy="96" rx="11" ry="4" transform="rotate(30 180 96)"/><ellipse class="leaf" cx="202" cy="122" rx="10" ry="4" transform="rotate(-26 202 122)"/><circle class="flower" cx="92" cy="29" r="5.5"/><circle class="flower" cx="118" cy="48" r="4"/><circle class="flower" cx="165" cy="59" r="5.5"/><circle class="flower" cx="194" cy="91" r="5.5"/><circle class="flower" cx="78" cy="69" r="3.5"/><circle class="flower" cx="215" cy="128" r="4.5"/></svg>`;
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