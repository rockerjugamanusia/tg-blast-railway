import sqlite3 from "sqlite3";
import { open } from "sqlite";

const DB_PATH = process.env.DB_FILE || "./data/users.sqlite";

export async function openDB() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      started INTEGER DEFAULT 0,
      blocked INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

export async function upsertUser(db, u) {
  if (!u?.id) return;
  await db.run(
    `
    INSERT INTO users (user_id, username, first_name, last_name, started)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(user_id) DO UPDATE SET
      username=excluded.username,
      first_name=excluded.first_name,
      last_name=excluded.last_name,
      started=1,
      updated_at=CURRENT_TIMESTAMP
    `,
    [u.id, u.username, u.first_name, u.last_name]
  );
}

export async function stats(db) {
  const total = (await db.get(`SELECT COUNT(*) c FROM users`)).c;
  const started = (await db.get(`SELECT COUNT(*) c FROM users WHERE started=1`)).c;
  const blocked = (await db.get(`SELECT COUNT(*) c FROM users WHERE blocked=1`)).c;
  const active = total - blocked;
  return { total, started, blocked, active };
}

export async function exportUsers(db) {
  return db.all(`SELECT * FROM users WHERE started=1 AND blocked=0`);
}

export async function markBlocked(db, userId) {
  await db.run(`UPDATE users SET blocked=1 WHERE user_id=?`, [userId]);
}
