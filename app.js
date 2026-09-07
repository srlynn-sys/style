const products=[
 {id:1,center:'wallet',name:'Premium Wallet Package',price:15000,icon:'◈'},
 {id:2,center:'wallet',name:'Digital Wallet Gift',price:25000,icon:'◇'},
 {id:3,center:'wallet',name:'Wallet Premium Plus',price:35000,icon:'◎'},
 {id:4,center:'fancy',name:'Fancy Collection One',price:18000,icon:'✦'},
 {id:5,center:'fancy',name:'Elegant Gift Set',price:28000,icon:'✧'},
 {id:6,center:'fancy',name:'Signature Fancy Set',price:45000,icon:'✺'}
];
let active='all',cart=JSON.parse(localStorage.getItem('style-cart')||'[]');
const $=s=>document.querySelector(s);const money=n=>new Intl.NumberFormat('en-US').format(n)+' MMK';
function render(){const list=products.filter(p=>active==='all'||p.center===active);$('#products').innerHTML=list.map(p=>`<article class="product"><div class="product-img">${p.icon}</div><div class="product-body"><small>${p.center==='wallet'?'Wallet Shop Center':'Fancy Shop Center'}</small><h3>${p.name}</h3><div class="price">${money(p.price)}</div><button class="add" data-add="${p.id}">Add to Cart</button></div></article>`).join('');$('#catalogTitle').textContent=active==='wallet'?'Wallet Products':active==='fancy'?'Fancy Products':'Featured Products';updateCart()}
function updateCart(){const count=cart.reduce((a,x)=>a+x.qty,0);$('#cartCount').textContent=count;$('#cartItems').innerHTML=cart.length?cart.map(x=>`<div class="cart-row"><div><strong>${x.name}</strong><br><small>${x.qty} × ${money(x.price)}</small></div><button class="remove" data-remove="${x.id}">Remove</button></div>`).join(''):'<p style="color:#777;text-align:center;padding:50px 0">Your cart is empty.</p>';$('#cartTotal').textContent=money(cart.reduce((a,x)=>a+x.price*x.qty,0));localStorage.setItem('style-cart',JSON.stringify(cart))}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function openDrawer(){ $('#drawer').classList.add('open');$('#overlay').classList.add('show') }function closePanels(){ $('#drawer').classList.remove('open');$('#cartPanel').classList.remove('open');$('#overlay').classList.remove('show') }
$('#products').addEventListener('click',e=>{const id=e.target.dataset.add;if(!id)return;const p=products.find(x=>x.id==id),old=cart.find(x=>x.id==p.id);old?old.qty++:cart.push({...p,qty:1});updateCart();toast('Added to cart ✦')});
$('#cartItems').addEventListener('click',e=>{const id=e.target.dataset.remove;if(id){cart=cart.filter(x=>x.id!=id);updateCart()}});
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');active=b.dataset.filter;render()}));
document.querySelectorAll('.center-card').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.center;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x.dataset.filter===active));render();$('#catalog').scrollIntoView({behavior:'smooth'})}));
$('#menuBtn').onclick=openDrawer;$('#closeDrawer').onclick=closePanels;$('#overlay').onclick=closePanels;$('#cartBtn').onclick=()=>{$('#cartPanel').classList.add('open');$('#overlay').classList.add('show')};$('#closeCart').onclick=closePanels;
$('#checkoutBtn').onclick=()=>toast(cart.length?'Order flow will connect to the new backend next.':'Add products first.');$('#searchBtn').onclick=()=>{const q=prompt('Search products');if(q){const found=products.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()));$('#products').innerHTML=found.map(p=>`<article class="product"><div class="product-img">${p.icon}</div><div class="product-body"><small>${p.center}</small><h3>${p.name}</h3><div class="price">${money(p.price)}</div><button class="add" data-add="${p.id}">Add to Cart</button></div></article>`).join('')||'<p style="color:#777">No products found.</p>'}};
render();