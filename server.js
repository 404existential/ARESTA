require('dotenv').config();
const express = require('express');
const path = require('node:path');
const Database = require('better-sqlite3');
const Stripe = require('stripe');

const app = express();
const port = Number(process.env.PORT || 3000);
const db = new Database(process.env.DB_FILE || path.join(__dirname, 'aresta.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  guests INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

const menu = {
  ricotta: { name: 'Whipped ricotta', amount: 1600 },
  greens: { name: 'Market greens', amount: 1700 },
  pappardelle: { name: 'Hand-cut pappardelle', amount: 2900 },
  chicken: { name: 'Roasted half chicken', amount: 3200 },
  risotto: { name: 'Wild mushroom risotto', amount: 2700 },
  cake: { name: 'Olive oil cake', amount: 1300 },
};

app.use(express.json({ limit: '20kb' }));
app.use(express.static(__dirname, { extensions: ['html'] }));

app.post('/api/reservations', (req, res) => {
  const { name, email, date, time, guests } = req.body || {};
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date || '') && date >= new Date().toISOString().slice(0, 10);
  const validTime = ['5:00 pm', '5:30 pm', '6:00 pm', '6:30 pm', '7:00 pm', '7:30 pm', '8:00 pm', '8:30 pm', '9:00 pm'].includes(time);
  if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100 ||
      typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !validDate || !validTime || !Number.isInteger(guests) || guests < 1 || guests > 6) {
    return res.status(400).json({ error: 'Please check your name, email, date, time, and party size.' });
  }
  try {
    const result = db.prepare('INSERT INTO reservations (name,email,date,time,guests) VALUES (?,?,?,?,?)')
      .run(name.trim(), email.trim(), date, time, guests);
    return res.status(201).json({ id: result.lastInsertRowid, name: name.trim(), status: 'pending' });
  } catch (error) {
    console.error('Could not save reservation:', error.message);
    return res.status(500).json({ error: 'We could not save your request right now.' });
  }
});

app.post('/api/checkout', async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Online checkout is not configured yet.' });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const requested = req.body?.items;
  if (!Array.isArray(requested) || requested.length < 1 || requested.length > 20) {
    return res.status(400).json({ error: 'Your order is empty or invalid.' });
  }
  const lineItems = [];
  for (const item of requested) {
    if (!item || typeof item.id !== 'string' || !menu[item.id] || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      return res.status(400).json({ error: 'One or more items in your order are invalid.' });
    }
    lineItems.push({ quantity: item.quantity, price_data: { currency: 'usd', unit_amount: menu[item.id].amount, product_data: { name: menu[item.id].name } } });
  }
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', line_items: lineItems,
      success_url: `${baseUrl}/?order=success`, cancel_url: `${baseUrl}/#menu`,
    });
    return res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    return res.status(502).json({ error: 'Secure checkout is temporarily unavailable.' });
  }
});

app.listen(port, () => console.log(`Aresta is running at http://localhost:${port}`));
