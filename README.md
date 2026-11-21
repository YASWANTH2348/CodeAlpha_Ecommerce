# E-Shop

A responsive e-commerce demo built with Express, vanilla HTML/CSS/JavaScript, and SQLite. It includes a 24-product catalog across clothing, home, accessories, snacks, and groceries; an auto-advancing featured carousel; category collections; product search; category/price/availability filters; sorting; product display preferences; product detail views; a persistent browser cart; account registration and login; checkout; inventory updates; and order history.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder, run `npm install`.
3. Start the server with `npm start` (or `npm run dev` while developing).
4. Visit [http://localhost:3000](http://localhost:3000).

The SQLite database is created at `data/eshop.sqlite`; the sample catalog is seeded automatically on the first run. Product prices and order totals are stored in whole Indian rupees.

For deployment, set `SESSION_SECRET` to a long, random value and run behind HTTPS. The default Express session store is intended for local demos only; use a persistent session store for production. Product photography is loaded from Unsplash.
