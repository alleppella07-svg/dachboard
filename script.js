// ======= SUPABASE CONFIG =======
// ضع هنا بياناتك من Supabase أو اتركها فاضية وأضفها من لوحة التحكم
let SUPABASE_URL = localStorage.getItem('sb_url') || '';
let SUPABASE_KEY = localStorage.getItem('sb_key') || '';
let supabase = null;

function initSupabase() {
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log('✅ Supabase connected');
      return true;
    } catch (e) {
      console.warn('Supabase init failed:', e);
      return false;
    }
  }
  return false;
}

// ======= ADMIN =======
const ADMIN_PASS_KEY = 'soblex_admin_pass';
function getAdminPass() {
  return localStorage.getItem(ADMIN_PASS_KEY) || 'soblex2024';
}

// ======= LOADER + IP =======
async function getIP() {
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    const d = await r.json();
    return d.ip;
  } catch {
    try {
      const r2 = await fetch('https://api64.ipify.org?format=json');
      const d2 = await r2.json();
      return d2.ip;
    } catch {
      return 'غير متاح';
    }
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  initSupabase();

  // Get IP
  const ip = await getIP();
  document.getElementById('loader-ip').textContent = ip;
  document.getElementById('sidebar-ip').textContent = 'IP: ' + ip;

  // Hide loader after 2.5s
  setTimeout(() => {
    const loader = document.getElementById('loader');
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.5s';
    setTimeout(() => loader.style.display = 'none', 500);
  }, 2500);

  setupNav();
  setupMobile();
  setupModals();
  setupStars();
  loadAllPages();
  loadStats();
  loadAbout();
});

// ======= NAVIGATION =======
function setupNav() {
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      navigateTo(page);
      // Close mobile sidebar
      document.getElementById('sidebar').classList.remove('open');
    });
  });
}

function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  const link = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (link) link.classList.add('active');
}

// ======= MOBILE SIDEBAR =======
function setupMobile() {
  const btn = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  btn.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.getElementById('main-content').addEventListener('click', () => {
    sidebar.classList.remove('open');
  });
}

// ======= MODALS =======
function setupModals() {
  // Admin
  document.getElementById('open-admin-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('admin-overlay').classList.add('open');
  });
  document.getElementById('close-admin').addEventListener('click', () => {
    document.getElementById('admin-overlay').classList.remove('open');
  });
  document.getElementById('admin-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('admin-overlay'))
      document.getElementById('admin-overlay').classList.remove('open');
  });

  // Order
  document.getElementById('close-order').addEventListener('click', () => {
    document.getElementById('order-overlay').classList.remove('open');
  });

  // Review
  document.getElementById('close-review').addEventListener('click', () => {
    document.getElementById('review-overlay').classList.remove('open');
  });

  // Populate supabase settings
  document.getElementById('sb-url-input').value = SUPABASE_URL;
  document.getElementById('sb-key-input').value = SUPABASE_KEY;
}

// ======= ADMIN LOGIN =======
window.adminLogin = function() {
  const input = document.getElementById('admin-password-input').value;
  if (input === getAdminPass()) {
    document.getElementById('admin-login-view').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    loadAdminProducts();
    loadAdminOrders();
    loadAdminReviews();
    loadAdminSocials();
    const aboutText = localStorage.getItem('soblex_about') || '';
    document.getElementById('about-edit-text').value = aboutText;
  } else {
    document.getElementById('admin-login-error').textContent = '❌ كلمة المرور غلط';
  }
};

// ======= ADMIN TABS =======
window.adminTab = function(name) {
  document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('panel-' + name).style.display = 'block';
  event.target.classList.add('active');
};

// ======= PRODUCTS =======
async function getProducts(category = null) {
  if (!supabase) {
    // Fallback to localStorage
    const all = JSON.parse(localStorage.getItem('soblex_products') || '[]');
    return category ? all.filter(p => p.category === category) : all;
  }
  let query = supabase.from('products').select('*').eq('active', true);
  if (category) query = query.eq('category', category);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.warn(error);
    const all = JSON.parse(localStorage.getItem('soblex_products') || '[]');
    return category ? all.filter(p => p.category === category) : all;
  }
  return data || [];
}

async function getAllProducts() {
  if (!supabase) {
    return JSON.parse(localStorage.getItem('soblex_products') || '[]');
  }
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) return JSON.parse(localStorage.getItem('soblex_products') || '[]');
  return data || [];
}

function renderProducts(products, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';
  if (!products.length) return;
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-card-img">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" onerror="this.style.display='none'"/>` : '🎁'}
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-desc">${p.description || ''}</div>
        <div class="product-card-footer">
          <div class="product-card-price">${p.price}</div>
          <button class="btn-order" onclick="openOrder('${p.id}','${escape(p.name)}','${escape(p.price)}')">طلب</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

const categoryMap = {
  offers: 'grid-offers',
  discounts: 'grid-discounts',
  servers: 'grid-servers',
  boosts: 'grid-boosts',
  nitro9: 'grid-nitro9',
  gifts: 'grid-gifts',
  apps: 'grid-apps',
  wallets: 'grid-wallets',
  vouchers: 'grid-vouchers',
};

async function loadAllPages() {
  for (const [cat, gridId] of Object.entries(categoryMap)) {
    const products = await getProducts(cat);
    renderProducts(products, gridId);
  }
}

async function loadStats() {
  const products = await getAllProducts();
  document.getElementById('stat-products').textContent = products.length;

  if (supabase) {
    const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { count: reviewsCount } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
    document.getElementById('stat-orders').textContent = ordersCount || 0;
    document.getElementById('stat-reviews').textContent = reviewsCount || 0;
  } else {
    const orders = JSON.parse(localStorage.getItem('soblex_orders') || '[]');
    const reviews = JSON.parse(localStorage.getItem('soblex_reviews') || '[]');
    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-reviews').textContent = reviews.length;
  }
}

// ======= ADD PRODUCT =======
window.addProduct = async function() {
  const category = document.getElementById('prod-category').value;
  const name = document.getElementById('prod-name').value.trim();
  const price = document.getElementById('prod-price').value.trim();
  const description = document.getElementById('prod-desc').value.trim();
  const image = document.getElementById('prod-image').value.trim();

  if (!name || !price) { alert('الاسم والسعر مطلوبان'); return; }

  const product = {
    id: Date.now().toString(),
    category, name, price, description, image,
    active: true,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    const { error } = await supabase.from('products').insert([product]);
    if (error) { alert('خطأ في الإضافة: ' + error.message); return; }
  } else {
    const products = JSON.parse(localStorage.getItem('soblex_products') || '[]');
    products.unshift(product);
    localStorage.setItem('soblex_products', JSON.stringify(products));
  }

  // Clear form
  document.getElementById('prod-name').value = '';
  document.getElementById('prod-price').value = '';
  document.getElementById('prod-desc').value = '';
  document.getElementById('prod-image').value = '';

  alert('✅ تم إضافة المنتج');
  loadAdminProducts();
  loadAllPages();
  loadStats();
};

async function loadAdminProducts() {
  const products = await getAllProducts();
  const list = document.getElementById('admin-products-list');
  list.innerHTML = '';
  if (!products.length) {
    list.innerHTML = '<p style="color:var(--muted);font-size:0.85rem">لا توجد منتجات</p>';
    return;
  }
  products.forEach(p => {
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `
      <div class="admin-item-info">
        <div class="admin-item-title">${p.name}</div>
        <div class="admin-item-sub">${p.category} — ${p.price}</div>
      </div>
      <button class="btn-delete" onclick="deleteProduct('${p.id}')">حذف</button>
    `;
    list.appendChild(item);
  });
}

window.deleteProduct = async function(id) {
  if (!confirm('تأكيد الحذف؟')) return;
  if (supabase) {
    await supabase.from('products').delete().eq('id', id);
  } else {
    let products = JSON.parse(localStorage.getItem('soblex_products') || '[]');
    products = products.filter(p => p.id !== id);
    localStorage.setItem('soblex_products', JSON.stringify(products));
  }
  loadAdminProducts();
  loadAllPages();
  loadStats();
};

// ======= ORDERS =======
let currentOrderProduct = null;

window.openOrder = function(id, name, price) {
  currentOrderProduct = { id, name: unescape(name), price: unescape(price) };
  document.getElementById('order-product-info').innerHTML = `
    <div class="admin-item" style="margin-bottom:1rem">
      <div class="admin-item-info">
        <div class="admin-item-title">${unescape(name)}</div>
        <div class="admin-item-sub" style="color:var(--green)">${unescape(price)}</div>
      </div>
    </div>
  `;
  document.getElementById('order-overlay').classList.add('open');
};

window.submitOrder = async function() {
  const name = document.getElementById('order-name').value.trim();
  const discord = document.getElementById('order-discord').value.trim();
  const note = document.getElementById('order-note').value.trim();

  if (!name) { alert('الاسم مطلوب'); return; }

  const order = {
    id: Date.now().toString(),
    product_id: currentOrderProduct.id,
    product_name: currentOrderProduct.name,
    product_price: currentOrderProduct.price,
    customer_name: name,
    discord_id: discord,
    note: note,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  if (supabase) {
    const { error } = await supabase.from('orders').insert([order]);
    if (error) { alert('خطأ: ' + error.message); return; }
  } else {
    const orders = JSON.parse(localStorage.getItem('soblex_orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('soblex_orders', JSON.stringify(orders));
  }

  document.getElementById('order-name').value = '';
  document.getElementById('order-discord').value = '';
  document.getElementById('order-note').value = '';
  document.getElementById('order-overlay').classList.remove('open');
  alert('✅ تم إرسال طلبك! سيتم التواصل معك قريباً');
  loadStats();
};

async function loadAdminOrders() {
  let orders = [];
  if (supabase) {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    orders = data || [];
  } else {
    orders = JSON.parse(localStorage.getItem('soblex_orders') || '[]');
  }

  const list = document.getElementById('admin-orders-list');
  list.innerHTML = '';
  if (!orders.length) {
    list.innerHTML = '<p style="color:var(--muted);font-size:0.85rem">لا توجد طلبات</p>';
    return;
  }
  orders.forEach(o => {
    const item = document.createElement('div');
    item.className = 'admin-item';
    const date = new Date(o.created_at).toLocaleDateString('ar-SA');
    item.innerHTML = `
      <div class="admin-item-info">
        <div class="admin-item-title">${o.customer_name} — ${o.product_name}</div>
        <div class="admin-item-sub">السعر: ${o.product_price} | ديسكورد: ${o.discord_id || '—'} | ${date}</div>
        ${o.note ? `<div class="admin-item-sub">ملاحظة: ${o.note}</div>` : ''}
        <div class="admin-item-sub" style="color:${o.status==='done'?'var(--green)':'var(--yellow)'}">الحالة: ${o.status === 'done' ? '✅ منجز' : '⏳ قيد الانتظار'}</div>
      </div>
      <div style="display:flex;gap:5px;flex-direction:column">
        <button class="btn-delete" onclick="markOrderDone('${o.id}')">✅</button>
        <button class="btn-delete" onclick="deleteOrder('${o.id}')">حذف</button>
      </div>
    `;
    list.appendChild(item);
  });
}

window.markOrderDone = async function(id) {
  if (supabase) {
    await supabase.from('orders').update({ status: 'done' }).eq('id', id);
  } else {
    const orders = JSON.parse(localStorage.getItem('soblex_orders') || '[]');
    const i = orders.findIndex(o => o.id === id);
    if (i !== -1) orders[i].status = 'done';
    localStorage.setItem('soblex_orders', JSON.stringify(orders));
  }
  loadAdminOrders();
};

window.deleteOrder = async function(id) {
  if (!confirm('حذف الطلب؟')) return;
  if (supabase) {
    await supabase.from('orders').delete().eq('id', id);
  } else {
    let orders = JSON.parse(localStorage.getItem('soblex_orders') || '[]');
    orders = orders.filter(o => o.id !== id);
    localStorage.setItem('soblex_orders', JSON.stringify(orders));
  }
  loadAdminOrders();
};

// ======= REVIEWS =======
let selectedStars = 0;

function setupStars() {
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedStars = parseInt(star.getAttribute('data-v'));
      stars.forEach((s, i) => s.classList.toggle('active', i < selectedStars));
    });
  });
}

window.submitReview = async function() {
  const name = document.getElementById('review-name').value.trim();
  const text = document.getElementById('review-text').value.trim();
  if (!name || !selectedStars) { alert('الاسم والتقييم مطلوبان'); return; }

  const review = {
    id: Date.now().toString(),
    customer_name: name,
    rating: selectedStars,
    text: text,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    const { error } = await supabase.from('reviews').insert([review]);
    if (error) { alert('خطأ: ' + error.message); return; }
  } else {
    const reviews = JSON.parse(localStorage.getItem('soblex_reviews') || '[]');
    reviews.unshift(review);
    localStorage.setItem('soblex_reviews', JSON.stringify(reviews));
  }

  document.getElementById('review-name').value = '';
  document.getElementById('review-text').value = '';
  selectedStars = 0;
  document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
  document.getElementById('review-overlay').classList.remove('open');
  alert('✅ شكراً على تقييمك!');
  loadStats();
};

async function loadAdminReviews() {
  let reviews = [];
  if (supabase) {
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    reviews = data || [];
  } else {
    reviews = JSON.parse(localStorage.getItem('soblex_reviews') || '[]');
  }

  const list = document.getElementById('admin-reviews-list');
  list.innerHTML = '';
  if (!reviews.length) {
    list.innerHTML = '<p style="color:var(--muted);font-size:0.85rem">لا توجد تقييمات</p>';
    return;
  }
  reviews.forEach(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const item = document.createElement('div');
    item.className = 'admin-item';
    const date = new Date(r.created_at).toLocaleDateString('ar-SA');
    item.innerHTML = `
      <div class="admin-item-info">
        <div class="admin-item-title">${r.customer_name} <span style="color:var(--yellow)">${stars}</span></div>
        <div class="admin-item-sub">${r.text || '—'} | ${date}</div>
      </div>
      <button class="btn-delete" onclick="deleteReview('${r.id}')">حذف</button>
    `;
    list.appendChild(item);
  });
}

window.deleteReview = async function(id) {
  if (!confirm('حذف التقييم؟')) return;
  if (supabase) {
    await supabase.from('reviews').delete().eq('id', id);
  } else {
    let reviews = JSON.parse(localStorage.getItem('soblex_reviews') || '[]');
    reviews = reviews.filter(r => r.id !== id);
    localStorage.setItem('soblex_reviews', JSON.stringify(reviews));
  }
  loadAdminReviews();
};

// ======= ABOUT =======
async function loadAbout() {
  if (supabase) {
    const { data } = await supabase.from('settings').select('*').eq('key', 'about').single();
    if (data) {
      document.getElementById('about-text').textContent = data.value || 'لا يوجد تعريف حالياً';
      localStorage.setItem('soblex_about', data.value || '');
    }
    const { data: socials } = await supabase.from('socials').select('*').order('created_at', { ascending: true });
    renderSocials(socials || []);
  } else {
    const text = localStorage.getItem('soblex_about') || 'لا يوجد تعريف حالياً';
    document.getElementById('about-text').textContent = text;
    const socials = JSON.parse(localStorage.getItem('soblex_socials') || '[]');
    renderSocials(socials);
  }
}

function renderSocials(socials) {
  const grid = document.getElementById('socials-grid');
  grid.innerHTML = '';
  socials.forEach(s => {
    const a = document.createElement('a');
    a.className = 'social-btn';
    a.href = s.url;
    a.target = '_blank';
    a.innerHTML = `<span>${s.icon || '🔗'}</span> ${s.name}`;
    grid.appendChild(a);
  });
}

window.saveAbout = async function() {
  const text = document.getElementById('about-edit-text').value.trim();
  localStorage.setItem('soblex_about', text);

  if (supabase) {
    await supabase.from('settings').upsert({ key: 'about', value: text }, { onConflict: 'key' });
  }

  document.getElementById('about-text').textContent = text || 'لا يوجد تعريف حالياً';
  alert('✅ تم الحفظ');
};

// ======= SOCIALS =======
async function loadAdminSocials() {
  let socials = [];
  if (supabase) {
    const { data } = await supabase.from('socials').select('*').order('created_at', { ascending: true });
    socials = data || [];
  } else {
    socials = JSON.parse(localStorage.getItem('soblex_socials') || '[]');
  }

  const list = document.getElementById('socials-list');
  list.innerHTML = '';
  socials.forEach(s => {
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `
      <div class="admin-item-info">
        <div class="admin-item-title">${s.icon || ''} ${s.name}</div>
        <div class="admin-item-sub">${s.url}</div>
      </div>
      <button class="btn-delete" onclick="deleteSocial('${s.id}')">حذف</button>
    `;
    list.appendChild(item);
  });
}

window.addSocial = async function() {
  const name = document.getElementById('social-name').value.trim();
  const url = document.getElementById('social-url').value.trim();
  const icon = document.getElementById('social-icon').value.trim();
  if (!name || !url) { alert('الاسم والرابط مطلوبان'); return; }

  const social = { id: Date.now().toString(), name, url, icon, created_at: new Date().toISOString() };

  if (supabase) {
    const { error } = await supabase.from('socials').insert([social]);
    if (error) { alert('خطأ: ' + error.message); return; }
  } else {
    const socials = JSON.parse(localStorage.getItem('soblex_socials') || '[]');
    socials.push(social);
    localStorage.setItem('soblex_socials', JSON.stringify(socials));
  }

  document.getElementById('social-name').value = '';
  document.getElementById('social-url').value = '';
  document.getElementById('social-icon').value = '';
  loadAdminSocials();
  loadAbout();
};

window.deleteSocial = async function(id) {
  if (!confirm('حذف الرابط؟')) return;
  if (supabase) {
    await supabase.from('socials').delete().eq('id', id);
  } else {
    let socials = JSON.parse(localStorage.getItem('soblex_socials') || '[]');
    socials = socials.filter(s => s.id !== id);
    localStorage.setItem('soblex_socials', JSON.stringify(socials));
  }
  loadAdminSocials();
  loadAbout();
};

// ======= SETTINGS =======
window.changeAdminPass = function() {
  const newPass = document.getElementById('new-admin-pass').value.trim();
  if (!newPass || newPass.length < 4) { alert('كلمة المرور قصيرة جداً'); return; }
  localStorage.setItem(ADMIN_PASS_KEY, newPass);
  document.getElementById('new-admin-pass').value = '';
  alert('✅ تم تغيير كلمة المرور');
};

window.saveSupabaseConfig = function() {
  const url = document.getElementById('sb-url-input').value.trim();
  const key = document.getElementById('sb-key-input').value.trim();
  if (!url || !key) { alert('كلا الحقلين مطلوبان'); return; }
  localStorage.setItem('sb_url', url);
  localStorage.setItem('sb_key', key);
  SUPABASE_URL = url;
  SUPABASE_KEY = key;
  const ok = initSupabase();
  if (ok) {
    alert('✅ تم الحفظ والاتصال بـ Supabase');
    loadAllPages();
    loadStats();
    loadAbout();
  } else {
    alert('❌ فشل الاتصال، تأكد من البيانات');
  }
};

// ======= FLOATING REVIEW BTN =======
const floatBtn = document.createElement('button');
floatBtn.innerHTML = '⭐ أضف تقييم';
floatBtn.style.cssText = `
  position:fixed;bottom:2rem;left:2rem;
  background:var(--accent);color:#fff;border:none;
  padding:0.7rem 1.4rem;border-radius:99px;
  font-family:var(--font);font-size:0.85rem;
  cursor:pointer;z-index:300;box-shadow:0 4px 20px rgba(88,101,242,0.35);
  transition:all 0.2s;
`;
floatBtn.onmouseover = () => floatBtn.style.transform = 'scale(1.05)';
floatBtn.onmouseout = () => floatBtn.style.transform = 'scale(1)';
floatBtn.onclick = () => document.getElementById('review-overlay').classList.add('open');
document.body.appendChild(floatBtn);
