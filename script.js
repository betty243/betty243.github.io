let CFG = {siteName:'My Store',tagline:'',currency:'₹',email:'',phone:'',address:'',freeShippingAbove:999,shippingFee:49};
let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
const $ = (s) => document.querySelector(s);
const money = (n) => CFG.currency + n.toLocaleString('en-IN');
const save = () => { localStorage.setItem('cart', JSON.stringify(cart)); renderCart(); };

async function init() {
  try { CFG = { ...CFG, ...(await (await fetch('config.json')).json()) }; } catch (e) {}
  try { PRODUCTS = await (await fetch('products.json')).json(); } catch (e) {}
  document.title = document.title ? document.title + ' | ' + CFG.siteName : CFG.siteName;
  document.querySelectorAll('[data-site-name]').forEach(e => e.textContent = CFG.siteName);
  document.querySelectorAll('[data-tagline]').forEach(e => e.textContent = CFG.tagline);
  document.querySelectorAll('[data-email]').forEach(e => e.textContent = CFG.email);
  document.querySelectorAll('[data-phone]').forEach(e => e.textContent = CFG.phone);
  document.querySelectorAll('[data-address]').forEach(e => e.textContent = CFG.address);
  document.querySelectorAll('[data-year]').forEach(e => e.textContent = new Date().getFullYear());
  injectDrawer();
  renderProducts();
  renderCart();
  if ($('#checkoutPage')) renderCheckout();
}

function injectDrawer() {
  document.body.insertAdjacentHTML('beforeend', `
  <div class="overlay" id="ov"></div>
  <aside class="drawer" id="drawer">
    <header><b><i class="fa-solid fa-bag-shopping"></i> Your Cart</b><button class="x" id="closeCart" style="color:#111;font-size:1.2rem"><i class="fa-solid fa-xmark"></i></button></header>
    <div class="items" id="cartItems"></div>
    <div class="foot" id="cartFoot"></div>
  </aside>`);
  $('#ov').onclick = $('#closeCart').onclick = toggleCart;
  const b = $('#cartBtn'); if (b) b.onclick = toggleCart;
}
function toggleCart() { $('#drawer').classList.toggle('on'); $('#ov').classList.toggle('on'); }

function renderProducts() {
  const g = $('#products'); if (!g) return;
  g.innerHTML = PRODUCTS.map(p => `
    <div class="card">
      <div class="thumb" style="background:linear-gradient(135deg,${p.color},${p.color}99)"><i class="fa-solid ${p.icon}"></i></div>
      <div class="body">
        <h3>${p.name}</h3><p>${p.desc}</p>
        <div class="price"><b>${money(p.price)}</b><s>${money(p.old)}</s></div>
        <button class="btn" onclick="addToCart(${p.id})"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>
      </div>
    </div>`).join('');
}

function addToCart(id) {
  const it = cart.find(i => i.id === id);
  it ? it.qty++ : cart.push({ id, qty: 1 });
  save();
  if (!$('#drawer').classList.contains('on')) toggleCart();
}
function changeQty(id, d) {
  const it = cart.find(i => i.id === id); if (!it) return;
  it.qty += d; if (it.qty < 1) cart = cart.filter(i => i.id !== id);
  save();
}
function removeItem(id) { cart = cart.filter(i => i.id !== id); save(); }

function totals() {
  const sub = cart.reduce((s, i) => s + (PRODUCTS.find(p => p.id === i.id)?.price || 0) * i.qty, 0);
  const ship = sub === 0 || sub >= CFG.freeShippingAbove ? 0 : CFG.shippingFee;
  return { sub, ship, total: sub + ship };
}

function lineHTML(i, controls) {
  const p = PRODUCTS.find(x => x.id === i.id); if (!p) return '';
  return `<div class="item">
    <div class="mini" style="background:${p.color}"><i class="fa-solid ${p.icon}"></i></div>
    <div class="info"><b>${p.name}</b><br>${money(p.price)} ${controls ? '' : '× ' + i.qty}</div>
    ${controls ? `<div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><span>${i.qty}</span><button onclick="changeQty(${p.id},1)">+</button></div>
    <button class="x" onclick="removeItem(${p.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
  </div>`;
}

function renderCart() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const c = $('#cartCount'); if (c) c.textContent = count;
  const box = $('#cartItems'); if (!box) return;
  const t = totals();
  box.innerHTML = cart.length ? cart.map(i => lineHTML(i, true)).join('') : '<p style="text-align:center;color:#6b7280;margin-top:40px">Your cart is empty.</p>';
  $('#cartFoot').innerHTML = cart.length ? `
    <div class="row"><span>Subtotal</span><span>${money(t.sub)}</span></div>
    <div class="row"><span>Shipping</span><span>${t.ship ? money(t.ship) : 'Free'}</span></div>
    <div class="row total"><span>Total</span><span>${money(t.total)}</span></div>
    <a class="btn block" href="checkout.html" style="text-align:center;margin-top:10px">Checkout</a>` : '';
  if ($('#checkoutPage')) renderCheckout();
}

function renderCheckout() {
  const t = totals();
  $('#summaryItems').innerHTML = cart.length ? cart.map(i => lineHTML(i, false)).join('') : '<p>Your cart is empty. <a href="index.html#shop" style="color:#4f46e5">Continue shopping</a></p>';
  $('#summaryTotals').innerHTML = `
    <div class="row"><span>Subtotal</span><span>${money(t.sub)}</span></div>
    <div class="row"><span>Shipping</span><span>${t.ship ? money(t.ship) : 'Free'}</span></div>
    <div class="row total"><span>Total</span><span>${money(t.total)}</span></div>`;
}

function placeOrder(e) {
  e.preventDefault();
  if (!cart.length) { alert('Your cart is empty.'); return; }
  const btn = $('#payBtn'), err = $('#err');
  err.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing payment...';
  setTimeout(() => {
    err.style.display = 'block';
    err.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Something went wrong. Your payment could not be processed. Please try again.';
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-lock"></i> Pay Now';
    err.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 2200);
}

document.addEventListener('DOMContentLoaded', init);
