class Cart {
  constructor(){
    try{ this.items = JSON.parse(localStorage.getItem('cart')) || []; }
    catch(e){ this.items = []; }
  }
  save(){ localStorage.setItem('cart', JSON.stringify(this.items)); this.updateCount(); if(document.getElementById('cart-container')) this.render('cart-container'); }
  updateCount(){ const el = document.getElementById('cart-count'); if(el) el.textContent = this.items.reduce((s,i)=>s+Number(i.qty||0),0); }
  add(product){
    const id = Number(product.id);
    const found = this.items.find(i=>Number(i.id)===id);
    if(found) found.qty = Number(found.qty||0)+1;
    else { this.items.push({ id:id, name:product.name, price:Number(product.price||0), image:product.image, qty:1 }); }
    this.save();
  }
  remove(id){
    id = Number(id);
    this.items = this.items.filter(i=>Number(i.id)!==id);
    this.save();
  }
  changeQty(id, qty){
    id = Number(id); qty = Number(qty);
    const it = this.items.find(i=>Number(i.id)===id);
    if(it){ it.qty = qty>0?qty:1; this.save(); }
  }
  clear(){ this.items = []; this.save(); }
  render(targetId){
    const container = document.getElementById(targetId); if(!container) return;
    if(!this.items || this.items.length===0){ container.innerHTML = '<p>Giỏ hàng trống!</p>'; const t = document.getElementById('cart-total'); if(t) t.textContent='0₫'; return; }
    container.innerHTML = this.items.map(it => `
      <div class="cart-item" data-id="${it.id}">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="${it.image}" alt="${it.name}">
          <div class="cart-item-info">
            <h4>${it.name}</h4>
            <p>Đơn giá: ${new Intl.NumberFormat('vi-VN').format(it.price)}₫</p>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
              <input class="cart-qty-input" data-id="${it.id}" type="number" min="1" value="${it.qty}" style="width:84px;padding:6px;border-radius:6px;border:1px solid #ddd;">
              <button class="btn-remove" data-id="${it.id}">Xóa</button>
            </div>
          </div>
        </div>
        <div class="cart-item-price">${new Intl.NumberFormat('vi-VN').format(it.price * it.qty)}₫</div>
      </div>
    `).join('');
    const total = this.items.reduce((s,i)=>s + Number(i.price) * Number(i.qty),0);
    const tEl = document.getElementById('cart-total'); if(tEl) tEl.textContent = new Intl.NumberFormat('vi-VN').format(total) + '₫';
  }
}

const cart = new Cart();
document.addEventListener('DOMContentLoaded', ()=>{
  cart.updateCount();
  if(document.getElementById('cart-container')) cart.render('cart-container');
});
document.addEventListener('click', e=>{
  const r = e.target.closest && e.target.closest('.btn-remove');
  if(r){ const id = r.getAttribute('data-id'); if(id) cart.remove(id); }
});
document.addEventListener('change', e=>{
  const inp = e.target.closest && e.target.closest('.cart-qty-input');
  if(inp){ const id = inp.getAttribute('data-id'); const val = Number(inp.value) || 1; if(id) cart.changeQty(id, val); }
});
