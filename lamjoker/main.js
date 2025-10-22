// main.js - fetch products, render, slider, detail add-to-cart + toast
const API_URL = "http://localhost:3000";
let PRODUCTS = []; // cache products (global)
window.PRODUCTS = PRODUCTS; // will reassign after fetch

// Escape HTML
function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// Normalize: remove diacritics + lowercase
function normalize(s = "") {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/* Product class */
class Product {
  constructor(obj) {
    Object.assign(this, obj);
    this.price = Number(this.price || 0);
  }
  priceText() {
    return new Intl.NumberFormat('vi-VN').format(this.price) + '₫';
  }
  toCardHTML() {
    return `
      <article class="product-card" data-id="${escapeHtml(this.id)}">
        ${this.hot ? '<div class="hot-badge">HOT</div>' : ''}
        <div class="thumb-wrap"><img src="${escapeHtml(this.image)}" alt="${escapeHtml(this.name)}"></div>
        <div class="product-info">
          <h3>${escapeHtml(this.name)}</h3>
          <p class="price">${this.priceText()}</p>
          <div class="action-inline">
            <span class="detail-label" onclick="location.href='detail.html?id=${this.id}'">Chi tiết</span>
            <button class="btn-add" data-id="${this.id}">Thêm vào giỏ</button>
          </div>
        </div>
      </article>
    `;
  }
  toDetailHTML() {
    return `
      <div class="detail-image"><img src="${escapeHtml(this.image)}" alt="${escapeHtml(this.name)}"></div>
      <div class="detail-info">
        <div>
          <h2>${escapeHtml(this.name)}</h2>
          <p class="price">${this.priceText()}</p>
          <p><b>Danh mục:</b> ${escapeHtml(this.category)}</p>
          <p>${escapeHtml(this.description)}</p>
        </div>
        <div class="detail-buttons">
          <button id="detail-add" class="btn-detail btn-addcart" data-id="${this.id}">Thêm vào giỏ hàng</button>
          <button class="btn-detail btn-back" onclick="history.back()">Quay lại</button>
        </div>
      </div>
    `;
  }
}

/* Fetch products */
async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error("Không tải được products");
    const data = await res.json();
    PRODUCTS = Array.isArray(data) ? data : [];
    window.PRODUCTS = PRODUCTS;
  } catch (err) {
    console.warn('Fetch products failed, fallback to localStorage or db.json file load');
    // fallback: try to read local db.json (if served statically)
    try {
      const res = await fetch('db.json');
      if (res.ok) {
        const d = await res.json();
        PRODUCTS = d.products || [];
        window.PRODUCTS = PRODUCTS;
      }
    } catch (e) {
      console.error('fallback load failed', e);
    }
  }
}

/* Render helper */
function renderGrid(targetId, items) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = items.map(i => new Product(i).toCardHTML()).join('');
}

/* Render sections: hot, laptop, phones */
function renderHomeSections() {
  const norm = s => normalize(s || '');
  renderGrid("product-hot", PRODUCTS.filter(p => !!p.hot));

  const laptopKeywords = ['laptop','macbook','dell','asus','hp','zenbook','xps'];
  const laptops = PRODUCTS.filter(p => {
    const t = `${norm(p.category)} ${norm(p.name)}`;
    return laptopKeywords.some(k => t.includes(k));
  });
  renderGrid("product-laptop", laptops);

  const phoneKeywords = ['dien thoai','dienthoai','dien','iphone','samsung','xiaomi','vivo','oppo','realme','phone','smartphone','mobile'];
  const phones = PRODUCTS.filter(p => {
    const t = `${norm(p.category)} ${norm(p.name)}`;
    return phoneKeywords.some(k => t.includes(k));
  });
  renderGrid("product-dienthoai", phones);
}

/* Render all products (product.html) */
function renderAllProducts() {
  renderGrid("all-product", PRODUCTS);
}

/* Detail page render */
async function renderDetailIfNeeded() {
  const detailDiv = document.getElementById('detail-product');
  if (!detailDiv) return;
  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    detailDiv.innerHTML = "<p>Sản phẩm không hợp lệ.</p>";
    return;
  }
  let p = PRODUCTS.find(x => String(x.id) === String(id));
  if (p) {
    detailDiv.innerHTML = new Product(p).toDetailHTML();
  } else {
    try {
      const res = await fetch(`${API_URL}/products/${id}`);
      if (!res.ok) throw new Error("Not found");
      p = await res.json();
      detailDiv.innerHTML = new Product(p).toDetailHTML();
    } catch (err) {
      console.error(err);
      detailDiv.innerHTML = "<p>Không thể tải sản phẩm.</p>";
    }
  }
}

/* Product page controls: search + sort */
function initProductPageControls() {
  const search = document.getElementById('search-input');
  const sort = document.getElementById('sort-price');
  const allProduct = document.getElementById('all-product');
  if (!allProduct) return;
  let dataset = [...PRODUCTS];
  const renderList = list => allProduct.innerHTML = list.map(i => new Product(i).toCardHTML()).join('');
  renderList(dataset);

  if (search) {
    search.addEventListener('input', e => {
      const q = normalize(e.target.value || '');
      renderList(dataset.filter(p => normalize(p.name).includes(q) || normalize(p.category).includes(q)));
    });
  }
  if (sort) {
    sort.addEventListener('change', e => {
      if (e.target.value === 'asc') dataset.sort((a, b) => a.price - b.price);
      else if (e.target.value === 'desc') dataset.sort((a, b) => b.price - a.price);
      renderList(dataset);
    });
  }
}

/* Carousel (banner) */
function initCarousel() {
  const carousel = document.getElementById('carousel');
  if (!carousel) return;
  const slides = Array.from(carousel.querySelectorAll('.slide'));
  const dotsWrap = document.getElementById('dots');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  let idx = 0, timer = null;

  slides.forEach((_, i) => {
    const b = document.createElement('button');
    if (i === 0) b.classList.add('active');
    b.addEventListener('click', () => go(i));
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.children);

  function update() {
    slides.forEach((s, i) => s.style.transform = `translateX(${-idx * 100}%)`);
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }
  function go(i) { idx = i % slides.length; update(); reset(); }
  function nextSlide() { idx = (idx + 1) % slides.length; update(); }
  function prevSlide() { idx = (idx - 1 + slides.length) % slides.length; update(); }

  if (next) next.addEventListener('click', () => { nextSlide(); reset(); });
  if (prev) prev.addEventListener('click', () => { prevSlide(); reset(); });

  function start() { timer = setInterval(() => { nextSlide(); }, 4500); }
  function reset() { if (timer) { clearInterval(timer); start(); } }

  carousel.addEventListener('mouseenter', () => { if (timer) clearInterval(timer); });
  carousel.addEventListener('mouseleave', () => start());

  update();
  start();
}

/* Toast helper */
function showToast(message = '', isError = false, duration = 1600) {
  if (!document) return;
  let toast = document.getElementById('site-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'site-toast';
    toast.style.position = 'fixed';
    toast.style.right = '20px';
    toast.style.bottom = '24px';
    toast.style.zIndex = 99999;
    toast.style.minWidth = '160px';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '8px';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 6px 18px rgba(2,6,12,0.18)';
    toast.style.color = '#fff';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.justifyContent = 'center';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s ease';
    document.body.appendChild(toast);
  }

  toast.style.background = isError ? '#ef4444' : '#16a34a';
  toast.textContent = message;
  toast.style.opacity = '1';

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
  }, duration);
}

/* Event delegation: handle Add-to-cart from list and detail */
document.addEventListener('click', async function(e) {
  const addBtn = e.target.closest && e.target.closest('.btn-add');
  if (addBtn) {
    const id = addBtn.getAttribute('data-id');
    if (!id) return;
    let product = PRODUCTS.find(p => String(p.id) === String(id));
    if (!product) {
      try {
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) throw new Error('Not found');
        product = await res.json();
      } catch (err) {
        console.error(err);
        showToast('Lỗi: không thể thêm sản phẩm', true);
        return;
      }
    }
    if (typeof cart !== 'undefined' && cart && typeof cart.add === 'function') {
      cart.add({ id: product.id, name: product.name, price: product.price, image: product.image });
      showToast('Đã thêm vào giỏ hàng ✔');
    } else {
      showToast('Lỗi: cart không khả dụng', true);
    }
    return;
  }

  const detailBtn = e.target.closest && e.target.closest('#detail-add');
  if (detailBtn) {
    const id = detailBtn.getAttribute('data-id');
    if (!id) return;
    const prevText = detailBtn.textContent;
    detailBtn.disabled = true;
    detailBtn.textContent = 'Đang thêm...';

    let product = PRODUCTS.find(p => String(p.id) === String(id));
    if (!product) {
      try {
        const res = await fetch(`${API_URL}/products/${id}`);
        if (!res.ok) throw new Error('Not found');
        product = await res.json();
      } catch (err) {
        console.error(err);
        showToast('Lỗi: không thể thêm sản phẩm', true);
        detailBtn.disabled = false;
        detailBtn.textContent = prevText;
        return;
      }
    }

    if (typeof cart !== 'undefined' && cart && typeof cart.add === 'function') {
      cart.add({ id: product.id, name: product.name, price: product.price, image: product.image });
      showToast('Đã thêm vào giỏ hàng ✔');
      detailBtn.textContent = 'Đã thêm ✓';
      setTimeout(() => {
        detailBtn.disabled = false;
        detailBtn.textContent = prevText;
      }, 1200);
    } else {
      showToast('Lỗi: cart không khả dụng', true);
      detailBtn.disabled = false;
      detailBtn.textContent = prevText;
    }
    return;
  }
});

/* Initialize everything on load */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await fetchProducts();
  } catch (err) {
    console.error("Lỗi fetch products:", err);
  }

  // render sections
  renderHomeSections();
  renderAllProducts();
  renderDetailIfNeeded();
  initProductPageControls();
  initCarousel();

  // update cart count if cart exists
  if (typeof cart !== 'undefined' && cart && typeof cart.updateCount === 'function') {
    cart.updateCount();
  }

  // If firebase is present, ensure auth state is forwarded to UI:
  if (typeof firebaseOnAuthStateChanged === 'function') {
    firebaseOnAuthStateChanged((user) => {
      // expose lightweight user object
      window._currentUser = user;
      // If there's a small UI in header, update it — product.html already listens via firebaseOnAuthStateChanged too.
    });
  } else {
    // no firebase loaded - ensure header shows logged-out UI
    window._currentUser = null;
  }
});
// === MỞ / ĐÓNG MODAL LOGIN ===
function openModal(formType) {
  document.getElementById("auth-modal").classList.remove("hidden");
  switchForm(formType);
}

function closeModal() {
  document.getElementById("auth-modal").classList.add("hidden");
}

function switchForm(formType) {
  document.getElementById("login-form").classList.toggle("hidden", formType !== "login");
  document.getElementById("register-form").classList.toggle("hidden", formType !== "register");
}
/* ====== TÌM KIẾM SẢN PHẨM ====== */
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('#searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', e => {
    const keyword = e.target.value.trim().toLowerCase();

    // Nếu ô tìm kiếm trống => hiển thị lại trang mặc định
    if (keyword === "") {
      renderHomeSections();
      return;
    }

    // Lọc sản phẩm theo tên hoặc loại
    const results = PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.category.toLowerCase().includes(keyword)
    );

    // Tạo giao diện kết quả
    const container = document.querySelector('.container');
    container.innerHTML = `
      <section class="section">
        <h2 class="section-title">Kết quả tìm kiếm: "${keyword}"</h2>
        <div class="product-grid">
          ${results.length > 0
            ? results.map(p => new Product(p).toCardHTML()).join('')
            : '<p style="padding:20px;color:#fff;">Không tìm thấy sản phẩm nào.</p>'
          }
        </div>
      </section>
    `;
  });
});
