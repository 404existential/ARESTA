const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  primaryNav.classList.toggle('open', !isOpen);
});

primaryNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    primaryNav.classList.remove('open');
  });
});

document.querySelectorAll('.menu-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const category = tab.dataset.category;
    document.querySelectorAll('.menu-tab').forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
    });
    document.querySelectorAll('.dish-card').forEach((dish) => {
      dish.hidden = category !== 'all' && dish.dataset.category !== category;
    });
  });
});

const dateInput = document.querySelector('input[name="date"]');
const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dateInput.min = localToday;

document.querySelector('#reservation-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const formData = new FormData(form);
  const message = document.querySelector('#form-message');
  const date = new Date(`${formData.get('date')}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  message.textContent = `Thanks, ${formData.get('name')}! Your request for ${formData.get('guests')} on ${date} at ${formData.get('time')} is ready. This demo doesn't send bookings—please call (212) 555-0148 to confirm.`;
  message.focus?.();
});

document.querySelector('#year').textContent = new Date().getFullYear();
