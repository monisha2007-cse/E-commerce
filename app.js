/* ---------- LOCAL STORAGE HELPERS ---------- */
const ls = {
  get: (k) => {
    try { return JSON.parse(localStorage.getItem(k)); }
    catch { return null; }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  remove: (k) => localStorage.removeItem(k)
};

function createId(prefix = '') {
  return prefix + Math.floor(Math.random() * 900000 + 10000);
}

/* ---------- SEARCH FILTER (index.html) ---------- */
(function initSearch() {
  const searchBar = document.getElementById("searchBar");
  if (!searchBar) return;
  searchBar.addEventListener("input", () => {
    const q = searchBar.value.trim().toLowerCase();
    const products = document.querySelectorAll(".product-card");
    products.forEach(card => {
      const name = (card.querySelector("h3")?.innerText || "").toLowerCase();
      card.style.display = q === "" || name.includes(q) ? "" : "none";
    });
  });
})();

/* ---------- REGISTRATION & LOGIN ---------- */
(function initAuth() {
  const regForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showMessage(el, msg, isError = true) {
    if(!el) { alert(msg); return; }
    el.innerText = msg;
    el.style.color = isError ? "crimson" : "green";
  }

  if (regForm) {
    regForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = regForm.querySelector('input[name="name"]').value.trim();
      const email = regForm.querySelector('input[name="email"]').value.trim();
      const password = regForm.querySelector('input[name="password"]').value;
      const confirm = regForm.querySelector('input[name="confirmPassword"]').value;
      const feedbackEl = regForm.querySelector('.feedback');

      if(name.length < 3) return showMessage(feedbackEl, "Name must be at least 3 characters.");
      if(!validEmail(email)) return showMessage(feedbackEl, "Please enter a valid email.");
      if(password.length < 6) return showMessage(feedbackEl, "Password must be at least 6 characters.");
      if(password !== confirm) return showMessage(feedbackEl, "Passwords do not match.");

      const user = { id: createId('U'), name, email, password };
      ls.set('demo_user', user);
      showMessage(feedbackEl, "Registration successful. You can now login.", false);
      regForm.reset();
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[name="email"]').value.trim();
      const password = loginForm.querySelector('input[name="password"]').value;
      const feedbackEl = loginForm.querySelector('.feedback');

      const stored = ls.get('demo_user');
      if(!stored) return showMessage(feedbackEl, "No registered user found. Please register first.");
      if(email !== stored.email || password !== stored.password) return showMessage(feedbackEl, "Email or password incorrect.");

      showMessage(feedbackEl, `Welcome, ${stored.name}!`, false);
      loginForm.reset();
    });
  }
})();

/* ---------- WISHLIST ---------- */
(function initWishlist() {
  let wishlist = ls.get('wishlist') || [];

  function updateButton(btn, added) {
    if(added) btn.innerHTML = '<i class="fa fa-heart"></i> Remove from Wishlist';
    else btn.innerHTML = '<i class="fa fa-heart"></i> Add to Wishlist';
  }

  document.addEventListener('click', (e) => {
    // Add/Remove from Wishlist
    if(e.target.classList.contains('add-to-wishlist')){
      const btn = e.target;
      const card = btn.closest('.product-card');
      const name = card.querySelector('h3').innerText;
      const price = card.querySelector('p').innerText;
      const img = card.querySelector('img').src;

      const exists = wishlist.some(i => i.name === name);
      if(exists){
        wishlist = wishlist.filter(i => i.name !== name);
        btn.classList.remove('added');
        updateButton(btn, false);
      } else {
        wishlist.push({ id: createId('W'), name, price, image: img });
        btn.classList.add('added');
        updateButton(btn, true);
      }
      ls.set('wishlist', wishlist);
      if(document.getElementById('wishlistContainer')) renderWishlist();
    }

    // Remove button on wishlist page
    if(e.target.classList.contains('remove-wishlist')){
      const name = e.target.getAttribute('data-name');
      wishlist = wishlist.filter(i => i.name !== name);
      ls.set('wishlist', wishlist);
      renderWishlist();
      // update index buttons
      document.querySelectorAll('.product-card').forEach(card => {
        const pname = card.querySelector('h3')?.innerText;
        if(pname === name){
          const btn = card.querySelector('.add-to-wishlist');
          if(btn){ btn.classList.remove('added'); updateButton(btn, false); }
        }
      });
    }
  });

  window.renderWishlist = function renderWishlist(){
    const container = document.getElementById('wishlistContainer');
    if(!container) return;
    wishlist = ls.get('wishlist') || [];
    container.innerHTML = "";
    if(wishlist.length === 0) {
      container.innerHTML = "<p>Your wishlist is empty 💔</p>";
      return;
    }
    wishlist.forEach(item => {
      const div = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <h3>${item.name}</h3>
        <p>${item.price}</p>
        <button class="btn remove-wishlist" data-name="${item.name}">Remove</button>
      `;
      container.appendChild(div);
    });
  };

  if(document.getElementById('wishlistContainer')) renderWishlist();
})();

/* ---------- ORDERS ---------- */
(function initOrders(){
  function renderOrders(){
    const container = document.getElementById('ordersContainer');
    if(!container) return;
    let orders = ls.get('orders') || [];
    container.innerHTML = "";
    if(orders.length === 0){
      container.innerHTML = "<p>No orders placed yet.</p>";
      return;
    }
    orders.forEach(o => {
      const div = document.createElement('div');
      div.className = 'order-card';
      div.innerHTML = `
        <img src="${o.image}" alt="${o.name}">
        <h3>${o.name}</h3>
        <p>${o.price}</p>
        <small>Ordered on: ${o.date}</small>
        <button class="btn cancel-order" data-id="${o.id}">Cancel Order</button>
      `;
      container.appendChild(div);
    });
  }

  document.addEventListener('click', (e) => {
    // Place order
    if(e.target.classList.contains('add-to-orders') || e.target.classList.contains('add-to-cart') || e.target.classList.contains('order-now')){
      const btn = e.target;
      const card = btn.closest('.product-card');
      const name = card.querySelector('h3').innerText;
      const price = card.querySelector('p').innerText;
      const img = card.querySelector('img').src;
      let orders = ls.get('orders') || [];
      const order = { id: createId('O'), name, price, image: img, date: new Date().toLocaleString() };
      orders.push(order);
      ls.set('orders', orders);
      alert('Order placed! Order ID: ' + order.id);
      if(document.getElementById('ordersContainer')) renderOrders();
    }

    // Cancel order
    if(e.target.classList.contains('cancel-order')){
      const id = e.target.getAttribute('data-id');
      let orders = ls.get('orders') || [];
      orders = orders.filter(o => o.id !== id);
      ls.set('orders', orders);
      renderOrders();
      alert('Order canceled.');
    }
  });

  window.renderOrders = renderOrders;
  if(document.getElementById('ordersContainer')) renderOrders();
})();

/* ---------- REVIEWS ---------- */
(function initReviews(){
  const reviewForm = document.getElementById('reviewForm');
  const reviewList = document.getElementById('reviewList');

  if(!ls.get('reviews')){
    ls.set('reviews', [
      { id: createId('R'), name: 'Priya S', text: 'Amazing quality! Fast delivery. ⭐⭐⭐⭐⭐', date: new Date().toLocaleDateString() },
      { id: createId('R'), name: 'Arjun K', text: 'Great experience. Good support. ⭐⭐⭐⭐', date: new Date().toLocaleDateString() }
    ]);
  }

  function renderReviews(){
    if(!reviewList) return;
    const reviews = ls.get('reviews') || [];
    reviewList.innerHTML = reviews.map(r => `
      <div class="review">
        <h4>${r.name} <small style="color:#777">- ${r.date}</small></h4>
        <p>${r.text}</p>
      </div>
    `).join('');
  }

  if(reviewForm){
    reviewForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = reviewForm.querySelector('input[name="name"]').value.trim() || "Anonymous";
      const text = reviewForm.querySelector('textarea[name="comment"]').value.trim();
      if(!text) return alert('Please write a review/comment.');
      const reviews = ls.get('reviews') || [];
      reviews.unshift({ id: createId('R'), name, text, date: new Date().toLocaleDateString() });
      ls.set('reviews', reviews);
      reviewForm.reset();
      renderReviews();
    });
  }

  renderReviews();
})();

/* ---------- CUSTOMER CARE & REPORTING ---------- */
(function initReporting(){
  const contactForm = document.getElementById('contactForm');
  if(!contactForm) return;

  contactForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = contactForm.querySelector('input[type="email"]').value.trim();
    const message = contactForm.querySelector('textarea').value.trim();
    if(!email || !message) return alert('Please provide email and message.');
    const reports = ls.get('reports') || [];
    const id = createId('RPT');
    reports.unshift({ id, email, message, date: new Date().toLocaleString() });
    ls.set('reports', reports);

    const feedback = document.getElementById('report-feedback') || document.getElementById('contact-feedback');
    if(feedback){
      feedback.innerText = `Report submitted. Reference ID: ${id}`;
      feedback.style.color = 'green';
    } else {
      alert(`Report submitted. Reference ID: ${id}`);
    }
    contactForm.reset();
  });
})();

/* ---------- AUTO-RENDER ON DOM LOAD ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  if(typeof renderWishlist === 'function') renderWishlist();
  if(typeof renderOrders === 'function') renderOrders();
});
