const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const app = express();
const port = Number(process.env.PORT) || 3000;
const dataDirectory = path.join(__dirname, "data");
fs.mkdirSync(dataDirectory, { recursive: true });

const db = new Database(path.join(dataDirectory, "eshop.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    image TEXT NOT NULL,
    badge TEXT,
    stock INTEGER NOT NULL DEFAULT 20
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Processing',
    shipping_name TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL
  );
`);

const seedProducts = [
  {
    id: 1,
    name: "Everyday Linen Shirt",
    category: "Clothing",
    description: "An easy, airy layer made from beautiful natural linen. Cut for a relaxed fit that feels just right from morning to evening.",
    price: 6800,
    image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=85",
    badge: "Bestseller"
  },
  {
    id: 2,
    name: "Cloud Knit Sweater",
    category: "Clothing",
    description: "Soft, substantial knitwear with a gentle drape. Your new favorite layer for slower mornings and cooler evenings.",
    price: 9400,
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=85",
    badge: "New"
  },
  {
    id: 3,
    name: "Studio Ceramic Vase",
    category: "Home",
    description: "A sculptural, hand-finished ceramic piece designed to bring a little more intention to your everyday spaces.",
    price: 4200,
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85",
    badge: null
  },
  {
    id: 4,
    name: "Market Tote in Canvas",
    category: "Accessories",
    description: "A sturdy, roomy everyday carryall crafted from heavyweight cotton canvas. Made to go wherever the day takes you.",
    price: 3600,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85",
    badge: "Bestseller"
  },
  {
    id: 5,
    name: "Sunday Stoneware Set",
    category: "Home",
    description: "A thoughtful pair of everyday cups in warm, tactile stoneware. Each one has its own character, just like your morning ritual.",
    price: 5200,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85",
    badge: null
  },
  {
    id: 6,
    name: "Weekend Leather Slides",
    category: "Accessories",
    description: "Minimal, easy-to-wear slides in supple leather, with a cushioned footbed for all-day comfort.",
    price: 7800,
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=85",
    badge: "New"
  },
  {
    id: 7,
    name: "Ribbed Cotton Tank",
    category: "Clothing",
    description: "The versatile warm-weather essential, made from soft, breathable organic cotton with a flattering ribbed finish.",
    price: 2900,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
    badge: null
  },
  {
    id: 8,
    name: "Soft Form Throw",
    category: "Home",
    description: "A generously sized, wonderfully soft throw for the sofa, the bed, or that quiet moment you saved for yourself.",
    price: 8600,
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85",
    badge: null
  },
  {
    id: 9,
    name: "Cotton Crew Tee",
    category: "Clothing",
    description: "An easy everyday tee in soft, breathable cotton. A comfortable, versatile layer you'll reach for again and again.",
    price: 2800,
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=85",
    badge: "Everyday"
  },
  {
    id: 10,
    name: "Easy Day Trousers",
    category: "Clothing",
    description: "Relaxed, easy-to-style trousers with a clean shape and a comfortable fit for all-day wear.",
    price: 5600,
    image: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=85",
    badge: null
  },
  {
    id: 11,
    name: "Harbor Knit Cardigan",
    category: "Clothing",
    description: "A soft, lightweight knit layer with a relaxed shape. Made for cool mornings and late-evening walks.",
    price: 8900,
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=85",
    badge: "New"
  },
  {
    id: 12,
    name: "Weekend Poplin Shirt",
    category: "Clothing",
    description: "A crisp, breathable shirt with a gently relaxed fit. Wear it open, tucked in, or however feels like you.",
    price: 7200,
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85",
    badge: null
  },
  {
    id: 13,
    name: "Softline Cushion Cover",
    category: "Home",
    description: "A simple finishing touch in a soft, tactile fabric. Easy to layer into your favorite corner at home.",
    price: 3200,
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85",
    badge: null
  },
  {
    id: 14,
    name: "Quiet Hours Table Lamp",
    category: "Home",
    description: "A warm, gentle light for a bedside table or reading nook, designed to make evenings feel a little slower.",
    price: 7800,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
    badge: "New"
  },
  {
    id: 15,
    name: "Sunday Breakfast Bowl",
    category: "Home",
    description: "A small-batch stoneware bowl for breakfast, snacks, and all the in-between. Each piece has a handmade finish.",
    price: 2400,
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85",
    badge: null
  },
  {
    id: 16,
    name: "Everyday Woven Bag",
    category: "Accessories",
    description: "A roomy, easy-carry bag with a relaxed shape and considered details to take along on everyday errands.",
    price: 4600,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85",
    badge: null
  },
  {
    id: 17,
    name: "Roasted Trail Mix",
    category: "Snacks",
    description: "A satisfying mix of roasted nuts, seeds, and dried fruit for a little pick-me-up between meals.",
    price: 450,
    image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=85",
    badge: "Bestseller"
  },
  {
    id: 18,
    name: "Dark Chocolate Bites",
    category: "Snacks",
    description: "Rich, bite-sized dark chocolate pieces made for an after-lunch treat or a quiet evening in.",
    price: 320,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85",
    badge: null
  },
  {
    id: 19,
    name: "Sea Salt Millet Crisps",
    category: "Snacks",
    description: "Light, crunchy millet crisps with a simple sea-salt finish. An easy savory snack to keep close by.",
    price: 180,
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=85",
    badge: "New"
  },
  {
    id: 20,
    name: "Honey Oat Granola",
    category: "Snacks",
    description: "Oven-toasted oats with a touch of honey and a lovely crunch, ready for breakfast or straight from the jar.",
    price: 520,
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=85",
    badge: null
  },
  {
    id: 21,
    name: "Seasonal Farm Vegetables",
    category: "Groceries",
    description: "A fresh selection of seasonal vegetables for everyday cooking, packed with care and ready for your kitchen.",
    price: 380,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85",
    badge: "Fresh"
  },
  {
    id: 22,
    name: "Crisp Orchard Apples",
    category: "Groceries",
    description: "Crisp, naturally sweet apples selected for freshness. Enjoy them as they are or add them to your breakfast bowl.",
    price: 260,
    image: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=900&q=85",
    badge: null
  },
  {
    id: 23,
    name: "Organic Rolled Oats",
    category: "Groceries",
    description: "A pantry staple for warm porridge, homemade granola, and easy weekday breakfasts.",
    price: 340,
    image: "/organic-rolled-oats.svg",
    badge: null
  },
  {
    id: 24,
    name: "Freshly Baked Sourdough",
    category: "Groceries",
    description: "A crusty, slow-fermented sourdough loaf for toast, sandwiches, and sharing around the table.",
    price: 290,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85",
    badge: "Fresh"
  }
];

const insertProduct = db.prepare(`
  INSERT INTO products (id, name, category, description, price, image, badge)
  VALUES (@id, @name, @category, @description, @price, @image, @badge)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    category = excluded.category,
    description = excluded.description,
    price = excluded.price,
    image = excluded.image,
    badge = excluded.badge
`);
const seed = db.transaction((products) => products.forEach((product) => insertProduct.run(product)));
seed(seedProducts);

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use(session({
  secret: process.env.SESSION_SECRET || "eshop-demo-session-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));
app.use(express.static(path.join(__dirname, "public")));

const safeUser = (user) => ({ id: user.id, name: user.name, email: user.email });
const getUser = (req) => req.session.userId
  ? db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(req.session.userId)
  : null;

function establishUserSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      req.session.userId = userId;
      req.session.save((saveError) => saveError ? reject(saveError) : resolve());
    });
  });
}

function requireUser(req, res, next) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: "Please sign in to continue." });
  req.user = user;
  next();
}

app.get("/api/products", (req, res) => {
  const products = db.prepare("SELECT * FROM products ORDER BY id").all();
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(404).json({ error: "That product could not be found." });
  }
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!product) return res.status(404).json({ error: "That product could not be found." });
  res.json(product);
});

app.get("/api/auth/me", (req, res) => {
  const user = getUser(req);
  res.json({ user: user ? safeUser(user) : null });
});

app.post("/api/auth/register", async (req, res, next) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: "Please enter a name between 2 and 80 characters." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: "Your password must be between 8 and 72 characters." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = db.prepare(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)"
    ).run(name, email, passwordHash);
    await establishUserSession(req, Number(result.lastInsertRowid));
    res.status(201).json({ user: { id: Number(result.lastInsertRowid), name, email } });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "An account with that email already exists." });
    }
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  try {
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "That email and password combination did not match." });
    }
    await establishUserSession(req, user.id);
    res.json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

app.get("/api/orders", requireUser, (req, res) => {
  const orders = db.prepare(`
    SELECT id, total, status, shipping_name AS shippingName,
           shipping_address AS shippingAddress, created_at AS createdAt
    FROM orders WHERE user_id = ? ORDER BY id DESC
  `).all(req.user.id).map((order) => ({
    ...order,
    items: db.prepare(`
      SELECT product_name AS name, quantity, unit_price AS price
      FROM order_items WHERE order_id = ?
    `).all(order.id)
  }));
  res.json({ orders });
});

app.post("/api/orders", requireUser, (req, res, next) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const name = typeof body.shippingName === "string" ? body.shippingName.trim() : "";
  const address = typeof body.shippingAddress === "string" ? body.shippingAddress.trim() : "";
  const items = body.items;
  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ error: "Please enter a valid recipient name." });
  }
  if (address.length < 8 || address.length > 300) {
    return res.status(400).json({ error: "Please enter a complete shipping address." });
  }
  if (!Array.isArray(items) || items.length < 1 || items.length > 30) {
    return res.status(400).json({ error: "Your cart is empty or contains too many items." });
  }

  const quantities = new Map();
  for (const item of items) {
    const id = Number(item && item.id);
    const quantity = Number(item && item.quantity);
    if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: "Please check the quantities in your cart." });
    }
    quantities.set(id, (quantities.get(id) || 0) + quantity);
  }
  if ([...quantities.values()].some((quantity) => quantity > 20)) {
    return res.status(400).json({ error: "You can order up to 20 of each item." });
  }

  try {
    const createOrder = db.transaction(() => {
      const products = [...quantities.entries()].map(([id, quantity]) => {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
        if (!product) throw Object.assign(new Error("A product in your cart is no longer available."), { status: 400 });
        if (product.stock < quantity) throw Object.assign(new Error(`${product.name} is currently out of stock.`), { status: 409 });
        return { ...product, quantity };
      });
      const total = products.reduce((sum, product) => sum + product.price * product.quantity, 0);
      if (!Number.isSafeInteger(total) || total < 1) {
        throw Object.assign(new Error("We couldn't calculate your order total."), { status: 400 });
      }
      const orderResult = db.prepare(
        "INSERT INTO orders (user_id, total, shipping_name, shipping_address) VALUES (?, ?, ?, ?)"
      ).run(req.user.id, total, name, address);
      const orderId = Number(orderResult.lastInsertRowid);
      const addItem = db.prepare(
        "INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)"
      );
      const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
      products.forEach((product) => {
        addItem.run(orderId, product.id, product.name, product.quantity, product.price);
        updateStock.run(product.quantity, product.id);
      });
      return { id: orderId, total, status: "Processing" };
    });
    res.status(201).json({ order: createOrder() });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(port, () => {
  console.log(`E-Shop is ready at http://localhost:${port}`);
});
