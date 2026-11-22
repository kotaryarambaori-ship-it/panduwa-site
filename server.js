const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const app = express();

app.set("trust proxy", 1);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

const PORT = process.env.PORT || 10000;
const SECRET = process.env.JWT_SECRET;

if (!process.env.DATABASE_URL || !SECRET) {
  console.error("DATABASE_URL और JWT_SECRET जरूरी हैं");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false }
});

const categories = [
  "sadak", "awas", "nali", "pani", "street-light",
  "mnrega", "yojana", "vikas-karya", "news",
  "notices", "gallery", "documents", "ration-card",
  "pension", "education", "health", "budget"
];

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      video_url TEXT DEFAULT '',
      amount NUMERIC DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id SERIAL PRIMARY KEY,
      tracking_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      subject TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function auth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "पहले Login करें" });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.clearCookie("token");
    return res.status(401).json({ error: "Login दोबारा करें" });
  }
}

function admin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin अनुमति जरूरी है" });
  }
  next();
}

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch {
    res.status(500).json({ ok: false, database: "error" });
  }
});

app.post("/api/register", loginLimit, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({
        error: "नाम, ईमेल और कम से कम 8 अक्षर का पासवर्ड जरूरी है"
      });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users(name,email,password)
       VALUES($1,$2,$3) RETURNING id,name,email,role`,
      [name.trim(), email.toLowerCase().trim(), hash]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (e) {
    res.status(400).json({ error: "यह ईमेल पहले से रजिस्टर्ड हो सकता है" });
  }
});

app.post("/api/login", loginLimit, async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [(email || "").toLowerCase().trim()]
  );

  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password || "", user.password))) {
    return res.status(401).json({ error: "ईमेल या पासवर्ड गलत है" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

app.get("/api/me", auth, async (req, res) => {
  const result = await pool.query(
    "SELECT id,name,email,role FROM users WHERE id=$1",
    [req.user.id]
  );
  res.json({ user: result.rows[0] || null });
});

app.get("/api/posts", async (req, res) => {
  const { category, search } = req.query;
  const values = [];
  let sql = "SELECT * FROM posts WHERE status='published'";

  if (category && category !== "all") {
    values.push(category);
    sql += ` AND category=$${values.length}`;
  }

  if (search) {
    values.push("%" + search + "%");
    sql += ` AND (title ILIKE $${values.length} OR description ILIKE $${values.length})`;
  }

  sql += " ORDER BY created_at DESC LIMIT 200";
  const result = await pool.query(sql, values);
  res.json({ posts: result.rows });
});

app.get("/api/posts/:id", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM posts WHERE id=$1 AND status='published'",
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: "जानकारी नहीं मिली" });
  res.json({ post: result.rows[0] });
});

app.post("/api/posts", auth, admin, async (req, res) => {
  const { title, category, description, image_url, video_url, amount } = req.body;

  if (!title || !categories.includes(category)) {
    return res.status(400).json({ error: "शीर्षक और सही विभाग चुनें" });
  }

  const result = await pool.query(
    `INSERT INTO posts(title,category,description,image_url,video_url,amount)
     VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
    [title, category, description || "", image_url || "",
     video_url || "", Number(amount) || 0]
  );
  res.status(201).json({ post: result.rows[0] });
});

app.delete("/api/posts/:id", auth, admin, async (req, res) => {
  await pool.query("DELETE FROM posts WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

app.post("/api/complaints", async (req, res) => {
  const { name, mobile, subject, details } = req.body;

  if (!name || !/^[6-9]\d{9}$/.test(mobile || "") || !subject || !details) {
    return res.status(400).json({ error: "सभी जानकारी सही भरें" });
  }

  const code = "PP" + Date.now().toString().slice(-9);

  const result = await pool.query(
    `INSERT INTO complaints(tracking_code,name,mobile,subject,details)
     VALUES($1,$2,$3,$4,$5) RETURNING tracking_code,status`,
    [code, name, mobile, subject, details]
  );

  res.status(201).json({ complaint: result.rows[0] });
});

app.get("/api/complaints/track/:code", async (req, res) => {
  const result = await pool.query(
    "SELECT tracking_code,subject,status,created_at FROM complaints WHERE tracking_code=$1",
    [req.params.code]
  );
  if (!result.rows.length) return res.status(404).json({ error: "शिकायत नहीं मिली" });
  res.json({ complaint: result.rows[0] });
});

app.get("/api/admin/complaints", auth, admin, async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM complaints ORDER BY created_at DESC LIMIT 500"
  );
  res.json({ complaints: result.rows });
});

app.patch("/api/admin/complaints/:id", auth, admin, async (req, res) => {
  const allowed = ["pending", "in_progress", "resolved"];
  if (!allowed.includes(req.body.status)) {
    return res.status(400).json({ error: "गलत स्थिति" });
  }

  const result = await pool.query(
    "UPDATE complaints SET status=$1 WHERE id=$2 RETURNING *",
    [req.body.status, req.params.id]
  );
  res.json({ complaint: result.rows[0] || null });
});

app.use(express.static(path.join(__dirname, "public")));

// हर ऑनलाइन पेज सीधे खुलेगा, Refresh पर भी।
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

initDB().then(() => {
  app.listen(PORT, () => console.log("Panduwa website running on " + PORT));
}).catch(error => {
  console.error("Database startup failed:", error);
  process.exit(1);
});
