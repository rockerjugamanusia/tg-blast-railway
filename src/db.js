import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";

const DATA_DIR = process.env.DATA_DIR || "/app/data";
const DB_FILE = process.env.DB_FILE || "blast.sqlite";
const DB_PATH = path.join(DATA_DIR, DB_FILE);

fs.mkdirSync(DATA_DIR, { recursive: true });
sqlite3.verbose();

export const db = new sqlite3.Database(DB_PATH);

export function initDb() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        is_optin INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  });
}

export function upsertUser(u) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (user_id, username, first_name, last_name)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         username=excluded.username,
         first_name=excluded.first_name,
         last_name=excluded.last_name`,
      [u.id, u.username || "", u.first_name || "", u.last_name || ""],
      err => err ? reject(err) : resolve()
    );
  });
}

export function setOptin(userId, optin) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET is_optin=? WHERE user_id=?`,
      [optin ? 1 : 0, userId],
      err => err ? reject(err) : resolve()
    );
  });
}
