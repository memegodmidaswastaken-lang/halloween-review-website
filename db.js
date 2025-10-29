import sqlite3 from "sqlite3";
import fs from "fs";

// Persistent data path
const dataDir = "/data";
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath = `${dataDir}/db.sqlite`;
const db = new sqlite3.Database(dbPath);

// Initialize tables
db.serialize(() => {
  // Users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      title TEXT DEFAULT '',
      profile_pic TEXT DEFAULT '',
      role TEXT DEFAULT 'user'
    )
  `);

  // Houses
  db.run(`
    CREATE TABLE IF NOT EXISTS houses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL,
      lng REAL,
      rating TEXT,
      glutenFree INTEGER DEFAULT 0,
      sugarFree INTEGER DEFAULT 0,
      lactoseFree INTEGER DEFAULT 0,
      other TEXT,
      description TEXT,
      user_id INTEGER,
      image TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Reviews
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      house_id INTEGER,
      user_id INTEGER,
      review TEXT,
      FOREIGN KEY(house_id) REFERENCES houses(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Moderator account
  db.get(`SELECT * FROM users WHERE username = 'memegodmidas'`, (err, row) => {
    if (!row) {
      db.run(
        `INSERT INTO users (username, password, title, role) VALUES (?, ?, ?, ?)`,
        ["memegodmidas", "Godsatan1342", "Moderator", "moderator"]
      );
      console.log("✅ Created moderator account: memegodmidas");
    }
  });
});

export default db;

