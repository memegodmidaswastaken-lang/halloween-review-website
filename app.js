import express from "express";
import sqlite3 from "sqlite3";
import multer from "multer";
import bcrypt from "bcrypt";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// Persistent directories
const dataDir = "/data";
const dbPath = path.join(dataDir, "db.sqlite");
const uploadDir = path.join(dataDir, "uploads");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static(uploadDir));

// DB setup
const db = new sqlite3.Database(dbPath);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    title TEXT DEFAULT NULL,
    profile_pic TEXT DEFAULT NULL,
    role TEXT DEFAULT 'user'
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL,
    lng REAL,
    rating TEXT,
    gluten_free INTEGER,
    sugar_free INTEGER,
    lactose_free INTEGER,
    other TEXT,
    description TEXT,
    user_id INTEGER,
    image TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER,
    user_id INTEGER,
    review TEXT,
    FOREIGN KEY(house_id) REFERENCES houses(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// File upload (persistent)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Helper
const hash = (pw) => bcrypt.hashSync(pw, 10);
const check = (pw, hashpw) => bcrypt.compareSync(pw, hashpw);

// --- Routes ---

// Register
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });
  const role = username === "memegodmidas" ? "moderator" : "user";
  db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hash(password), role], (err) => {
    if (err) return res.status(400).json({ error: "Username taken" });
    res.json({ success: true });
  });
});

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (!row) return res.status(400).json({ error: "Invalid username" });
    if (!check(password, row.password)) return res.status(400).json({ error: "Invalid password" });
    res.json({ id: row.id, username: row.username, role: row.role, title: row.title, profile_pic: row.profile_pic });
  });
});

// Upload profile picture
app.post("/api/profilepic/:id", upload.single("file"), (req, res) => {
  const { id } = req.params;
  const filePath = `/uploads/${req.file.filename}`;
  db.run("UPDATE users SET profile_pic = ? WHERE id = ?", [filePath, id]);
  res.json({ success: true, path: filePath });
});

// Add house
app.post("/api/houses", upload.single("image"), (req, res) => {
  const { lat, lng, rating, gluten_free, sugar_free, lactose_free, other, description, user_id } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  db.run(
    `INSERT INTO houses (lat, lng, rating, gluten_free, sugar_free, lactose_free, other, description, user_id, image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [lat, lng, rating, gluten_free, sugar_free, lactose_free, other, description, user_id, imagePath],
    function () {
      res.json({ id: this.lastID });
    }
  );
});

// Add review
app.post("/api/reviews", (req, res) => {
  const { house_id, user_id, review } = req.body;
  db.run("INSERT INTO reviews (house_id, user_id, review) VALUES (?, ?, ?)", [house_id, user_id, review]);
  res.json({ success: true });
});

// Get houses
app.get("/api/houses", (req, res) => {
  db.all(
    `SELECT h.*, u.username, u.title, u.profile_pic FROM houses h
     LEFT JOIN users u ON h.user_id = u.id`,
    [],
    (err, rows) => res.json(rows)
  );
});

// Get reviews
app.get("/api/reviews/:houseId", (req, res) => {
  db.all(
    `SELECT r.*, u.username, u.title, u.profile_pic FROM reviews r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.house_id = ?`,
    [req.params.houseId],
    (err, rows) => res.json(rows)
  );
});

// Moderator: set title
app.post("/api/settitle", (req, res) => {
  const { mod_id, username, title } = req.body;
  db.get("SELECT role FROM users WHERE id = ?", [mod_id], (err, row) => {
    if (!row || row.role !== "moderator") return res.status(403).json({ error: "Not allowed" });
    db.run("UPDATE users SET title = ? WHERE username = ?", [title, username]);
    res.json({ success: true });
  });
});

// Moderator: delete review
app.post("/api/deletereview", (req, res) => {
  const { mod_id, review_id } = req.body;
  db.get("SELECT role FROM users WHERE id = ?", [mod_id], (err, row) => {
    if (!row || row.role !== "moderator") return res.status(403).json({ error: "Not allowed" });
    db.run("DELETE FROM reviews WHERE id = ?", [review_id]);
    res.json({ success: true });
  });
});

app.listen(PORT, () => console.log(`🎃 Server running on port ${PORT}`));
