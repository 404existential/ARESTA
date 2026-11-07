const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!open));
  menuToggle.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
  primaryNav.classList.toggle('open', !open);
});
primaryNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  primaryNav.classList.remove('open');
}));

document.querySelectorAll('.menu-tab').forEach((tab) => tab.addEventListener('click', () => {
  const category = tab.dataset.category;
  document.querySelectorAll('.menu-tab').forEach((item) => {
    const selected = item === tab;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-selected', String(selected));
  });
  document.querySelectorAll('.dish-card').forEach((dish) => { dish.hidden = category !== 'all' && dish.dataset.category !== category; });
}));

// Subtle reveal as sections enter view; content stays visible if motion is reduced or unsupported.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.intro-copy,.intro-photo,.section-heading,.gallery-item,.quote-copy,.visit-grid,.reservation-copy,.reservation-form').forEach((element) => {
    element.classList.add('reveal'); observer.observe(element);
  });
}

const dateInput = document.querySelector('input[name="date"]');
const now = new Date();
dateInput.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const cart = new Map();
const cartSummary = document.querySelector('#cart-summary');
const checkoutButton = document.querySelector('#checkout-button');
const orderMessage = document.querySelector('#order-message');
function renderCart() {
  const items = [...cart.values()];
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  cartSummary.textContent = count ? `${count} ${count === 1 ? 'item' : 'items'} selected · $${items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} before tax` : 'Your order is empty.';
  checkoutButton.disabled = count === 0;
}
document.querySelectorAll('.add-item').forEach((button) => button.addEventListener('click', () => {
  const card = button.closest('.dish-card');
  const id = button.dataset.item;
  const price = Number(card.querySelector('.dish-top>span').textContent.replace('$', ''));
  const current = cart.get(id);
  cart.set(id, { id, price, quantity: current ? current.quantity + 1 : 1 });
  button.innerHTML = `Added · ${cart.get(id).quantity} <span>+</span>`;
  orderMessage.textContent = '';
  renderCart();
}));
checkoutButton.addEventListener('click', async () => {
  checkoutButton.disabled = true;
  orderMessage.textContent = 'Preparing secure checkout…';
  try {
    const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [...cart.values()].map(({ id, quantity }) => ({ id, quantity })) }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Checkout could not be started.');
    window.location.assign(result.url);
  } catch (error) {
    orderMessage.textContent = `${error.message} Please call (212) 555-0148 to order.`;
    checkoutButton.disabled = false;
  }
});

const reservationForm = document.querySelector('#reservation-form');
reservationForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!reservationForm.reportValidity()) return;
  const submit = reservationForm.querySelector('button[type="submit"]');
  const message = document.querySelector('#form-message');
  submit.disabled = true;
  message.textContent = 'Sending your request…';
  const values = Object.fromEntries(new FormData(reservationForm));
  values.guests = Number(values.guests);
  try {
    const response = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to send request.');
    message.textContent = `Thank you, ${result.name}. Your reservation request has been received. Our team will contact you to confirm.`;
    reservationForm.reset();
  } catch (error) {
    message.textContent = `${error.message} Please call (212) 555-0148.`;
  } finally { submit.disabled = false; }
});

document.querySelector('#year').textContent = new Date().getFullYear();
