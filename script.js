let CFG = {siteName:'Store',tagline:'',currency:'₹',email:'',phone:'',address:'',hours:'',freeShippingAbove:999,shippingFee:49};
let PRODUCTS = [];
let cart = [];
try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) {}
const $ = (s) => document.querySelector(s);
const money = (n) => CFG.currency + Number(n).toLocaleString('en-IN');
const getP = (id) => PRODUCTS.find(p => p.id === Number(id));
const off = (p) => Math.round((1 - p.price / p.old) * 100);
const param = (k) => new URLSearchParams(location.search).get(k);
const CATICON = {'Electronics':'fa-plug','Accessories':'fa-glasses','Home & Kitchen':'fa-mug-hot','Fashion':'fa-shirt','Footwear':'fa-shoe-prints'};
const save = () => { try { localStorage.setItem('cart', JSON.stringify(cart)); } catch (e) {} renderCart(); };

async function init() {
  try { CFG = { ...CFG, ...(await (await fetch('config.json')).json()) }; } catch (e) {}
  try { PRODUCTS = await (await fetch('products.json')).json(); } catch (e) {}
  document.title = document.title ? document.title + ' | ' + CFG.siteName : CFG.siteName;
  const fill = (a, v) => document.querySelectorAll('[' + a + ']').forEach(e => e.textContent = v);
  fill('data-site-name', CFG.siteName); fill('data-tagline', CFG.tagline); fill('data-email', CFG.email);
  fill('data-phone', CFG.phone); fill('data-address', CFG.address); fill('data-hours', CFG.hours);
  fill('data-year', new Date().getFullYear()); fill('data-free', money(CFG.freeShippingAbove));
  document.querySelectorAll('[data-mailto]').forEach(e => e.href = 'mailto:' + CFG.email);
  injectDrawer();
  renderCart();
  renderPage();
}

function thumb(p) {
  return `<div class="thumb" style="background:linear-gradient(135deg,${p.color},${p.color}aa)"><i class="fa-solid ${p.icon}"></i>${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.remove()">` : ''}</div>`;
}
function card(p) {
  return `<div class="card"><span class="badge">${off(p)}% OFF</span>
    <a href="product.html?id=${p.id}">${thumb(p)}</a>
    <div class="body"><span class="cat-l">${p.category}</span>
      <h3><a href="product.html?id=${p.id}">${p.name}</a></h3><p>${p.short}</p>
      <div class="price"><b>${money(p.price)}</b><s>${money(p.old)}</s></div>
      <button class="btn" onclick="addToCart(${p.id})"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>
    </div></div>`;
}

function renderPage() {
  const set = (id, html) => { const e = $(id); if (e) e.innerHTML = html; };
  set('#featured', PRODUCTS.slice(0, 4).map(card).join(''));
  set('#deals', [...PRODUCTS].sort((a, b) => off(b) - off(a)).slice(0, 4).map(card).join(''));
  set('#recommended', PRODUCTS.slice(4, 8).map(card).join(''));
  const cats = [...new Set(PRODUCTS.map(p => p.category))];
  set('#categories', cats.map(c => `<a class="cat" href="shop.html?cat=${encodeURIComponent(c)}"><i class="fa-solid ${CATICON[c] || 'fa-tag'}"></i><b>${c}</b><small>${PRODUCTS.filter(p => p.category === c).length} products</small></a>`).join(''));
  if ($('#shopGrid')) renderShop(cats);
  if ($('#productDetail')) renderProduct();
  if ($('#cartPage')) renderCartPage();
  if ($('#checkoutPage')) renderCheckout();
}

function renderShop(cats) {
  const cat = param('cat') || '', q = (param('q') || '').toLowerCase(), sort = param('sort') || '';
  let list = PRODUCTS.filter(p => (!cat || p.category === cat) && (!q || (p.name + p.short + p.category).toLowerCase().includes(q)));
  if (sort === 'low') list.sort((a, b) => a.price - b.price);
  if (sort === 'high') list.sort((a, b) => b.price - a.price);
  if (sort === 'disc') list.sort((a, b) => off(b) - off(a));
  $('#filterList').innerHTML = `<a href="shop.html" class="${!cat ? 'on' : ''}">All products</a>` + cats.map(c => `<a href="shop.html?cat=${encodeURIComponent(c)}" class="${c === cat ? 'on' : ''}">${c}</a>`).join('');
  $('#resultCount').textContent = list.length + ' product' + (list.length === 1 ? '' : 's') + (cat ? ' in ' + cat : '') + (q ? ' for "' + param('q') + '"' : '');
  $('#sortSel').value = sort;
  $('#sortSel').onchange = (e) => { const u = new URL(location.href); u.searchParams.set('sort', e.target.value); location.href = u; };
  $('#shopGrid').innerHTML = list.length ? list.map(card).join('') : '<div class="empty" style="grid-column:1/-1">No products found. <a href="shop.html" style="color:#4f46e5">View all products</a></div>';
}

let pdQty = 1;
function renderProduct() {
  const p = getP(param('id'));
  if (!p) { $('#productDetail').innerHTML = '<div class="empty">Product not found. <a href="shop.html" style="color:#4f46e5">Back to shop</a></div>'; return; }
  document.title = p.name + ' | ' + CFG.siteName;
  $('#crumb').innerHTML = `<a href="index.html">Home</a> / <a href="shop.html?cat=${encodeURIComponent(p.category)}">${p.category}</a> / ${p.name}`;
  $('#productDetail').innerHTML = `
    <div style="position:relative"><span class="badge">${off(p)}% OFF</span>${thumb(p)}</div>
    <div>
      <span class="cat-l" style="color:#64748b;text-transform:uppercase;font-size:.8rem">${p.category}</span>
      <h1>${p.name}</h1>
      <div class="price"><b>${money(p.price)}</b><s>${money(p.old)}</s><span>Save ${money(p.old - p.price)}</span></div>
      <div class="hint">Inclusive of all taxes. SKU: ${p.sku}</div>
      <div class="stock"><i class="fa-solid fa-circle-check"></i> In stock</div>
      <p>${p.short}</p>
      <ul class="ticks">${p.features.map(f => `<li><i class="fa-solid fa-check"></i>${f}</li>`).join('')}</ul>
      <div class="qrow">
        <div class="qbox"><button onclick="pdChange(-1)">−</button><span id="pdQ">1</span><button onclick="pdChange(1)">+</button></div>
        <button class="btn" onclick="addToCart(${p.id},pdQty)"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>
        <button class="btn dark" onclick="buyNow(${p.id})">Buy Now</button>
      </div>
      <div class="delivery">
        <div><i class="fa-solid fa-truck-fast"></i> Delivery in 4-7 business days across India</div>
        <div><i class="fa-solid fa-rotate-left"></i> 7-day returns on unused items</div>
        <div><i class="fa-solid fa-shield-halved"></i> Order support by email and phone</div>
      </div>
    </div>`;
  $('#pdDesc').innerHTML = `<h2>Product description</h2><p>${p.description}</p>`;
  $('#pdSpecs').innerHTML = `<h2>Specifications</h2><table class="specs">${Object.entries(p.specs).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
  const rel = PRODUCTS.filter(x => x.id !== p.id && x.category === p.category);
  const more = PRODUCTS.filter(x => x.id !== p.id && x.category !== p.category);
  $('#related').innerHTML = [...rel, ...more].slice(0, 4).map(card).join('');
}
function pdChange(d) { pdQty = Math.max(1, Math.min(10, pdQty + d)); $('#pdQ').textContent = pdQty; }
function buyNow(id) { addToCart(id, pdQty, true); location.href = 'checkout.html'; }

function addToCart(id, n = 1, silent = false) {
  const it = cart.find(i => i.id === id);
  it ? it.qty += n : cart.push({ id, qty: n });
  save();
  if (!silent && !$('#drawer').classList.contains('on')) toggleCart();
}
function changeQty(id, d) {
  const it = cart.find(i => i.id === id); if (!it) return;
  it.qty += d; if (it.qty < 1) cart = cart.filter(i => i.id !== id);
  save();
}
function removeItem(id) { cart = cart.filter(i => i.id !== id); save(); }

function totals() {
  const sub = cart.reduce((s, i) => s + (getP(i.id)?.price || 0) * i.qty, 0);
  const ship = sub === 0 || sub >= CFG.freeShippingAbove ? 0 : CFG.shippingFee;
  return { sub, ship, total: sub + ship };
}
function totalsHTML(t) {
  return `<div class="row"><span>Subtotal</span><span>${money(t.sub)}</span></div>
    <div class="row"><span>Shipping</span><span>${t.ship ? money(t.ship) : 'Free'}</span></div>
    <div class="row total"><span>Total</span><span>${money(t.total)}</span></div>`;
}
function miniThumb(p) { return `<div class="mini" style="background:${p.color}"><i class="fa-solid ${p.icon}"></i>${p.image ? `<img src="${p.image}" alt="" onerror="this.remove()">` : ''}</div>`; }
function lineHTML(i, controls) {
  const p = getP(i.id); if (!p) return '';
  return `<div class="citem">${miniThumb(p)}
    <div class="info2"><b><a href="product.html?id=${p.id}">${p.name}</a></b><br><small>${money(p.price)}${controls ? '' : ' × ' + i.qty}</small></div>
    ${controls ? `<div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><span>${i.qty}</span><button onclick="changeQty(${p.id},1)">+</button></div>
    <b style="min-width:70px;text-align:right">${money(p.price * i.qty)}</b>
    <button class="x" onclick="removeItem(${p.id})" aria-label="Remove"><i class="fa-solid fa-trash"></i></button>` : `<b>${money(p.price * i.qty)}</b>`}
  </div>`;
}

function injectDrawer() {
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay" id="ov"></div>
  <aside class="drawer" id="drawer"><div class="dh"><b><i class="fa-solid fa-bag-shopping"></i> Your Cart</b><button class="x" id="closeCart" style="color:#0f172a;font-size:1.2rem"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="items" id="cartItems"></div><div class="foot" id="cartFoot"></div></aside>`);
  $('#ov').onclick = $('#closeCart').onclick = toggleCart;
  const b = $('#cartBtn'); if (b) b.onclick = toggleCart;
}
function toggleCart() { $('#drawer').classList.toggle('on'); $('#ov').classList.toggle('on'); }

function renderCart() {
  const c = $('#cartCount'); if (c) c.textContent = cart.reduce((s, i) => s + i.qty, 0);
  const box = $('#cartItems'); if (!box) return;
  const t = totals();
  box.innerHTML = cart.length ? cart.map(i => lineHTML(i, true)).join('') : '<div class="empty">Your cart is empty.</div>';
  $('#cartFoot').innerHTML = cart.length ? totalsHTML(t) + '<a class="btn block" href="checkout.html" style="margin-top:10px">Checkout</a><a class="btn light block" href="cart.html" style="margin-top:8px">View Cart</a>' : '';
  if ($('#cartPage')) renderCartPage();
  if ($('#checkoutPage')) renderCheckout();
}
function renderCartPage() {
  const t = totals();
  $('#cartLines').innerHTML = cart.length ? cart.map(i => lineHTML(i, true)).join('') : '<div class="empty">Your cart is empty. <a href="shop.html" style="color:#4f46e5">Continue shopping</a></div>';
  $('#cartTotals').innerHTML = totalsHTML(t) + (cart.length ? `<a class="btn block" href="checkout.html" style="margin-top:12px">Proceed to Checkout</a>` : '') +
    (t.sub && t.ship ? `<div class="hint">Add ${money(CFG.freeShippingAbove - t.sub)} more for free shipping.</div>` : '');
}
function renderCheckout() {
  const t = totals();
  $('#summaryItems').innerHTML = cart.length ? cart.map(i => lineHTML(i, false)).join('') : '<div class="empty">Your cart is empty. <a href="shop.html" style="color:#4f46e5">Continue shopping</a></div>';
  $('#summaryTotals').innerHTML = totalsHTML(t);
}

function placeOrder(e) {
  e.preventDefault();
  if (!cart.length) { alert('Your cart is empty.'); return; }
  const btn = $('#payBtn'), err = $('#err');
  err.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Please wait...';
  setTimeout(() => {
    err.style.display = 'block';
    err.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Something went wrong. Online payments are temporarily unavailable while we finish setting up our payment system. No payment has been taken and no order has been placed. Please try again later.';
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-lock"></i> Place Order';
    err.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 1800);
}

document.addEventListener('DOMContentLoaded', init);
