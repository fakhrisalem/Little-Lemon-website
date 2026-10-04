const ALL_TIMES = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '17:00',
  '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
];

function closeNav() {
  const nav = document.getElementById('site-nav');
  const toggle = document.getElementById('nav-toggle');
  nav?.classList.remove('is-open');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', 'Open navigation');
}

function showPage(pageName) {
  const page = document.getElementById(`page-${pageName}`);
  if (!page) return;

  document.querySelectorAll('.page').forEach((item) => item.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach((item) => item.classList.remove('active'));
  page.classList.add('active');
  document.getElementById(`nav-${pageName}`)?.classList.add('active');
  closeNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showSection(sectionId) {
  if (!document.getElementById('page-home')?.classList.contains('active')) {
    showPage('home');
  }
  document.querySelectorAll('.nav-link').forEach((item) => item.classList.remove('active'));
  if (sectionId === 'drinks') document.getElementById('nav-menu')?.classList.add('active');
  if (sectionId === 'story') document.getElementById('nav-story')?.classList.add('active');
  closeNav();
  window.setTimeout(() => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 40);
}

function seededRng(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
}

function dateToSeed(date) {
  return date.split('').reduce((total, character) => total + character.charCodeAt(0), 0) * 31;
}

function getMinDate() {
  return new Date().toISOString().split('T')[0];
}

function getMaxDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  return date.toISOString().split('T')[0];
}

function onDateChange() {
  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  if (!dateInput || !timeInput) return;

  const value = dateInput.value;
  dateInput.min = getMinDate();
  dateInput.max = getMaxDate();
  timeInput.innerHTML = '<option value="">Loading times…</option>';
  timeInput.disabled = true;

  window.setTimeout(() => {
    if (!value) {
      timeInput.innerHTML = '<option value="">Select a date first</option>';
      document.getElementById('time-hint').textContent = 'Available slots load after selecting a date';
      return;
    }

    const random = seededRng(dateToSeed(value));
    const available = ALL_TIMES.filter(() => random() > 0.35);
    const slots = available.length >= 2 ? available : ALL_TIMES.slice(0, 8);
    timeInput.innerHTML = '<option value="">— Select a time —</option>'
      + slots.map((slot) => `<option value="${slot}">${slot}</option>`).join('');
    timeInput.disabled = false;
    document.getElementById('time-hint').textContent = `${slots.length} slots available`;
    validateField('date');
  }, 250);
}

const VALIDATORS = {
  date(value) {
    if (!value) return 'Please select a date.';
    const selected = new Date(`${value}T00:00:00`);
    const today = new Date(`${getMinDate()}T00:00:00`);
    const maximum = new Date(`${getMaxDate()}T00:00:00`);
    if (selected < today) return 'Date must be today or in the future.';
    if (selected > maximum) return 'Reservations up to 6 months in advance only.';
    return '';
  },
  time(value) { return value ? '' : 'Please select a time slot.'; },
  guests(value) {
    const count = Number(value);
    if (!value && value !== 0) return 'Please enter guest count.';
    if (!Number.isInteger(count) || count < 1) return 'At least 1 guest required.';
    if (count > 20) return 'For parties over 20, please call us.';
    return '';
  },
  occasion(value) { return value ? '' : 'Please select an occasion.'; },
  name(value) {
    if (!value || !value.trim()) return 'Please enter your full name.';
    if (value.trim().length < 2) return 'Name must be at least 2 characters.';
    return '';
  },
  email(value) {
    if (!value || !value.trim()) return 'Please enter your email.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Please enter a valid email.';
  },
  phone(value) {
    if (!value || !value.trim()) return '';
    return /^[\d\s\-+().]{7,20}$/.test(value.trim()) ? '' : 'Please enter a valid phone number.';
  },
};

function setFieldState(fieldId, error) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-err`);
  if (!field || !errorElement) return;

  if (error) {
    field.classList.add('err');
    field.setAttribute('aria-invalid', 'true');
    errorElement.style.display = 'flex';
    errorElement.textContent = `⚠ ${error}`;
  } else {
    field.classList.remove('err');
    field.setAttribute('aria-invalid', 'false');
    errorElement.style.display = 'none';
  }
}

function validateField(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field || !VALIDATORS[fieldId]) return true;
  const error = VALIDATORS[fieldId](field.value);
  setFieldState(fieldId, error);
  return !error;
}

function validateAll() {
  const fields = ['date', 'time', 'guests', 'occasion', 'name', 'email', 'phone'];
  let valid = true;
  fields.forEach((field) => {
    if (!validateField(field)) valid = false;
  });
  return valid;
}

function selectSeating(chip) {
  document.querySelectorAll('.chip').forEach((item) => {
    item.classList.remove('sel');
    item.setAttribute('aria-checked', 'false');
  });
  chip.classList.add('sel');
  chip.setAttribute('aria-checked', 'true');
}

function chipKey(event, chip) {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    selectSeating(chip);
  }
}

function updateCharCount() {
  const request = document.getElementById('special');
  const count = document.getElementById('char-count');
  if (request && count) count.textContent = 500 - request.value.length;
}

function submitForm(event) {
  event.preventDefault();
  if (!validateAll()) {
    document.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  const button = document.getElementById('submit-btn');
  const serverError = document.getElementById('server-err');
  button.disabled = true;
  button.innerHTML = '<span class="spinner" aria-hidden="true"></span>Confirming Reservation…';
  button.setAttribute('aria-busy', 'true');
  serverError.style.display = 'none';

  window.setTimeout(() => {
    if (Math.random() > 0.05) {
      const booking = {
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        guests: document.getElementById('guests').value,
        occasion: document.getElementById('occasion').value,
        seating: document.querySelector('.chip.sel')?.textContent || 'Indoor',
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        special: document.getElementById('special').value,
      };
      showConfirmation(booking);
      return;
    }

    serverError.style.display = 'block';
    serverError.textContent = '⚠ Booking failed. Please try a different time or date.';
    button.disabled = false;
    button.innerHTML = 'Reserve My Table';
    button.setAttribute('aria-busy', 'false');
  }, 550);
}

function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function showConfirmation(booking) {
  document.getElementById('conf-num').textContent = `LL-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  document.getElementById('conf-email').textContent = booking.email;
  const details = [
    ['📅 Date', formatDate(booking.date)],
    ['🕐 Time', booking.time],
    ['👥 Guests', `${booking.guests} ${booking.guests === '1' ? 'person' : 'people'}`],
    ['🎉 Occasion', booking.occasion],
    ['🪑 Seating', booking.seating],
    ['👤 Name', booking.name],
    ['✉️ Email', booking.email],
    booking.phone ? ['📞 Phone', booking.phone] : null,
    booking.special ? ['📝 Special Requests', booking.special, 'full'] : null,
  ].filter(Boolean);
  const list = document.getElementById('conf-details');
  list.replaceChildren();

  details.forEach(([label, value, className]) => {
    const item = document.createElement('div');
    item.className = `det${className ? ` ${className}` : ''}`;
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    item.append(term, description);
    list.append(item);
  });
  showPage('confirm');
}

function newReservation() {
  const form = document.getElementById('booking-form');
  if (!form) return;
  form.reset();
  document.getElementById('time').innerHTML = '<option value="">Select a date first</option>';
  document.getElementById('time').disabled = true;
  document.getElementById('time-hint').textContent = 'Available slots load after selecting a date';
  document.getElementById('char-count').textContent = '500';
  document.getElementById('server-err').style.display = 'none';
  document.querySelectorAll('.err-msg').forEach((item) => { item.style.display = 'none'; });
  document.querySelectorAll('[aria-invalid]').forEach((item) => { item.setAttribute('aria-invalid', 'false'); });
  document.querySelectorAll('.err').forEach((item) => item.classList.remove('err'));
  const button = document.getElementById('submit-btn');
  button.disabled = false;
  button.innerHTML = 'Reserve My Table';
  button.setAttribute('aria-busy', 'false');
  document.querySelectorAll('.chip').forEach((chip, index) => {
    chip.classList.toggle('sel', index === 0);
    chip.setAttribute('aria-checked', index === 0 ? 'true' : 'false');
  });
  const dateInput = document.getElementById('date');
  dateInput.min = getMinDate();
  dateInput.max = getMaxDate();
  showPage('booking');
}

function setupMenuFilters() {
  const filters = document.querySelectorAll('[data-filter]');
  const products = document.querySelectorAll('.product-card[data-category]');
  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const category = filter.dataset.filter;
      filters.forEach((button) => {
        const selected = button === filter;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      products.forEach((product) => {
        product.hidden = category !== 'all' && product.dataset.category !== category;
      });
    });
  });
}

const cart = new Map();
let toastTimer;

function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

function showToast(message) {
  const toast = document.getElementById('cart-toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function updateCartCount() {
  const count = [...cart.values()].reduce((total, item) => total + item.quantity, 0);
  document.getElementById('cart-count').textContent = String(count);
  document.getElementById('cart-toggle').setAttribute('aria-label', `Open your drink bag, ${count} ${count === 1 ? 'item' : 'items'}`);
}

function addToCart(button) {
  const name = button.dataset.name;
  const price = Number(button.dataset.price);
  if (!name || !Number.isFinite(price)) return;
  const current = cart.get(name);
  cart.set(name, { name, price, quantity: (current?.quantity || 0) + 1 });
  updateCartCount();
  showToast(`${name} added to your bag`);
}

function changeCartQuantity(name, delta) {
  const item = cart.get(name);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart.delete(name);
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const summary = document.getElementById('cart-summary');
  const entries = [...cart.values()];
  container.replaceChildren();
  summary.hidden = entries.length === 0;

  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'cart-empty';
    empty.textContent = 'Your bag is still empty. Find a sip you love and add it here.';
    container.append(empty);
    document.getElementById('cart-subtotal').textContent = '$0.00';
    updateCartCount();
    return;
  }

  let subtotal = 0;
  entries.forEach((item) => {
    subtotal += item.price * item.quantity;
    const row = document.createElement('div');
    row.className = 'cart-row';
    const name = document.createElement('span');
    name.className = 'cart-row-name';
    name.textContent = item.name;
    const price = document.createElement('span');
    price.className = 'cart-row-price';
    price.textContent = formatPrice(item.price * item.quantity);
    const controls = document.createElement('div');
    controls.className = 'cart-row-controls';

    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', `Remove one ${item.name}`);
    minus.addEventListener('click', () => changeCartQuantity(item.name, -1));
    const quantity = document.createElement('span');
    quantity.textContent = String(item.quantity);
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', `Add one ${item.name}`);
    plus.addEventListener('click', () => changeCartQuantity(item.name, 1));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'cart-remove';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      cart.delete(item.name);
      renderCart();
    });
    controls.append(minus, quantity, plus, remove);
    row.append(name, price, controls);
    container.append(row);
  });

  document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
  updateCartCount();
}

function openCart() {
  const overlay = document.getElementById('cart-overlay');
  overlay.hidden = false;
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-open');
  renderCart();
  document.getElementById('cart-close').focus();
}

function closeCart() {
  const overlay = document.getElementById('cart-overlay');
  if (overlay.hidden) return;
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cart-open');
  document.getElementById('cart-toggle').focus();
}

function setupNavigationAndCart() {
  const toggle = document.getElementById('nav-toggle');
  toggle?.addEventListener('click', () => {
    const nav = document.getElementById('site-nav');
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    nav.classList.toggle('is-open', !expanded);
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  });

  document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
    button.addEventListener('click', () => addToCart(button));
  });
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', (event) => {
    if (event.target.id === 'cart-overlay') closeCart();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCart();
      closeNav();
    }
  });
}

const CONTACT_VALIDATORS = {
  'c-name': (v) => (!v.trim() ? 'Please enter your full name.' : v.trim().length < 2 ? 'Name must be at least 2 characters.' : ''),
  'c-email': (v) => (!v.trim() ? 'Please enter your email.' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email.'),
  'c-phone': (v) => (!v.trim() || /^[\d\s\-+().]{7,20}$/.test(v.trim()) ? '' : 'Please enter a valid phone number.'),
  'c-subject': (v) => (v ? '' : 'Please select a topic.'),
  'c-message': (v) => (!v.trim() ? 'Please write a message.' : v.trim().length < 10 ? 'Message must be at least 10 characters.' : ''),
};

function validateContact(id) {
  const field = document.getElementById(id);
  if (!field) return true;
  const error = CONTACT_VALIDATORS[id](field.value);
  setFieldState(id, error);
  return !error;
}

function updateContactCount() {
  document.getElementById('c-count').textContent = 1000 - document.getElementById('c-message').value.length;
}

function submitContact(event) {
  event.preventDefault();
  let valid = true;
  Object.keys(CONTACT_VALIDATORS).forEach((id) => { if (!validateContact(id)) valid = false; });
  if (!valid) {
    document.querySelector('#contact-form [aria-invalid="true"]')?.focus();
    return;
  }
  const button = document.getElementById('contact-btn');
  button.disabled = true;
  button.innerHTML = '<span class="spinner" aria-hidden="true"></span>Sending…';
  window.setTimeout(() => {
    document.getElementById('contact-sent-name').textContent = document.getElementById('c-name').value.trim();
    document.getElementById('contact-sent-email').textContent = document.getElementById('c-email').value.trim();
    document.getElementById('contact-form-wrap').hidden = true;
    document.getElementById('contact-success').hidden = false;
    button.disabled = false;
    button.textContent = 'Send Message';
  }, 500);
}

function newMessage() {
  document.getElementById('contact-form').reset();
  document.querySelectorAll('#contact-form .err-msg').forEach((item) => { item.style.display = 'none'; });
  document.querySelectorAll('#contact-form .err').forEach((item) => item.classList.remove('err'));
  document.querySelectorAll('#contact-form [aria-invalid]').forEach((item) => item.setAttribute('aria-invalid', 'false'));
  document.getElementById('c-count').textContent = '1000';
  document.getElementById('contact-success').hidden = true;
  document.getElementById('contact-form-wrap').hidden = false;
}

const dateInput = document.getElementById('date');
if (dateInput) {
  dateInput.min = getMinDate();
  dateInput.max = getMaxDate();
}
setupMenuFilters();
setupNavigationAndCart();
