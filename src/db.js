import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";

const DATA_DIR = process.env.DATA_DIR || "/app/data";
const DB_FILE = process.env.DB_FILE || "blast.sqlite";
const DB_PATH = path.join(DATA_DIR, DB_FILE);

export async function openDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  return db;
}

export async function upsertUser(db, from) {
  const user_id = from?.id;
  if (!user_id) return;

  await db.run(
    `INSERT INTO users (user_id, username, first_name, last_name, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       username=excluded.username,
       first_name=excluded.first_name,
       last_name=excluded.last_name,
       updated_at=datetime('now')`,
    [user_id, from.username || null, from.first_name || null, from.last_name || null]
  );
}

export async function exportUsers(db) {
  return db.all(`SELECT * FROM users ORDER BY updated_at DESC`);
}

export async function stats(db) {
  const total = (await db.get(`SELECT COUNT(*) as c FROM users`)).c;
  return { total, started: total, active: total, blocked: 0 };
}
