# Aresta Restaurant Website

An upscale, dark, responsive restaurant site with an interactive menu, Stripe-hosted online checkout, a photo gallery, and reservation requests saved to SQLite.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm start
```

Open <http://localhost:3000>. Without Stripe configured, browsing and reservation requests work; online checkout returns an informative setup message.

## Configure Stripe checkout

1. Create a Stripe account and use a test secret key from the Stripe Dashboard.
2. Add `STRIPE_SECRET_KEY=sk_test_...` to `.env`.
3. Set `BASE_URL` to the public HTTPS address when deployed (for example `https://your-domain.example`).
4. Configure Stripe webhooks for production payment fulfilment. Do not mark an order fulfilled based only on the browser's success redirect; verify `checkout.session.completed` server-side.

Prices and product names are defined on the server in `server.js`; never trust prices from the browser. Stripe Checkout collects payment securely. Current checkout is configured for pickup-style ordering and does not calculate tax, delivery, or pickup slots; configure those business rules before taking live orders.

## Reservations

`POST /api/reservations` validates requests and stores them in `aresta.sqlite` with `pending` status. This is a working request-capture backend, not an instant confirmed-booking/availability system: the restaurant must review requests and contact guests. Before production, add staff notifications, a reservation management workflow, privacy/retention policies, backups, HTTPS, and appropriate abuse protection. The displayed restaurant address and contact information are sample content and should be replaced with real business details.

## Image credits

Photography is loaded from Unsplash. Google Fonts provides DM Sans and Playfair Display.
