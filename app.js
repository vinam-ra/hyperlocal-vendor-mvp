const catalog=[
{id:'tomato',name:'Tomato',aliases:['tamatar'],unit:'kg',price:48,qty:12},
{id:'potato',name:'Potato',aliases:['aloo','alu'],unit:'kg',price:35,qty:15},
{id:'onion',name:'Onion',aliases:['pyaz','pyaaz'],unit:'kg',price:42,qty:10},
{id:'bhindi',name:'Bhindi',aliases:['okra'],unit:'kg',price:60,qty:0},
{id:'palak',name:'Palak',aliases:['spinach'],unit:'bunch',price:20,qty:8},
{id:'ginger',name:'Ginger',aliases:['adrak'],unit:'kg',price:160,qty:4},
{id:'coriander',name:'Coriander',aliases:['dhaniya'],unit:'bunch',price:15,qty:10},
{id:'chilli',name:'Green Chilli',aliases:['mirchi','hari mirch'],unit:'kg',price:90,qty:3},
{id:'lemon',name:'Lemon',aliases:['nimbu'],unit:'piece',price:8,qty:25}
];
let cart={};
function render(){items.innerHTML=catalog.map(x=>`<div class="row"><div><b>${x.name}</b><div class="muted">₹${x.price} / ${x.unit} · ${x.qty?x.qty+' available':'Sold out'}</div></div>${x.qty?`<input class="qty" type="number" min="0" max="${x.qty}" step="${x.unit==='kg'?'.25':'1'}" value="${cart[x.id]||0}" onchange="setQty('${x.id}',this.value)">`:'<span class="sold">Unavailable</span>'}</div>`).join('');renderCart()}
function setQty(id,v){v=Number(v)||0;v>0?cart[id]=v:delete cart[id];renderCart()}
function renderCart(){let t=0;let rows=Object.entries(cart).map(([id,q])=>{let x=catalog.find(y=>y.id===id),s=x.price*q;t+=s;return `<div class="row"><span>${x.name} × ${q} ${x.unit}</span><b>₹${s.toFixed(0)}</b></div>`});cartbox.innerHTML=rows.join('')||'Nothing added yet.';total.textContent='₹'+t.toFixed(0)}
function parseTyped(){let s=typed.value.toLowerCase();catalog.forEach(x=>{for(let n of [x.name.toLowerCase(),...x.aliases]){let pos=s.indexOf(n);if(pos>=0){let before=s.slice(Math.max(0,pos-20),pos),m=before.match(/(\d+(?:\.\d+)?)\s*(kg|kilo|g|gram)?\s*$/),q=m?Number(m[1]):1;if(m&&['g','gram'].includes(m[2]))q/=1000;if(x.qty)cart[x.id]=Math.min(q,x.qty);break}}});render()}
function placeOrder(){if(!Object.keys(cart).length)return msg.textContent='Add at least one item.';if(!name.value||!phone.value||!address.value)return msg.textContent='Please add name, mobile and address.';msg.textContent='Prototype order ready. Live Supabase order submission is the next connection step.'}
render();
