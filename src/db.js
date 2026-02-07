import path from "path";
import fs from "fs";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const DATA_DIR = process.env.DATA_DIR || "/app/data";
const DB_FILE  = process.env.DB_FILE || "crm.sqlite";
export const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, DB_FILE);
console.log("DB PATH =", DB_PATH);

export async function initDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id     INTEGER PRIMARY KEY,
      username    TEXT,
      first_name  TEXT,
      last_name   TEXT,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now')),

      started_at  TEXT,
      blocked_at  TEXT,
      last_ok_at  TEXT,
      last_err_at TEXT,
      last_err    TEXT
    );
  `);

  await db.exec(`CREATE INDEX IF NOT EXISTS idx_users_started ON users(started_at);`);
  return db;
}

export async function upsertUser(db, tgUser) {
  await db.run(
    `
    INSERT INTO users (user_id, username, first_name, last_name, started_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      username=excluded.username,
      first_name=excluded.first_name,
      last_name=excluded.last_name,
      updated_at=datetime('now'),
      started_at=COALESCE(users.started_at, excluded.started_at)
    `,
    [tgUser.id, tgUser.username || null, tgUser.first_name || null, tgUser.last_name || null]
  );
}

export async function getTargets(db) {
  return db.all(`
    SELECT user_id FROM users
    WHERE started_at IS NOT NULL AND blocked_at IS NULL
    ORDER BY user_id ASC
  `);
}

export async function markOk(db, user_id) {
  await db.run(
    `UPDATE users SET last_ok_at=datetime('now'), last_err=NULL, last_err_at=NULL, updated_at=datetime('now') WHERE user_id=?`,
    [user_id]
  );
}

export async function markErr(db, user_id, text) {
  await db.run(
    `UPDATE users SET last_err=?, last_err_at=datetime('now'), updated_at=datetime('now') WHERE user_id=?`,
    [String(text).slice(0, 500), user_id]
  );
}

export async function markBlocked(db, user_id, text) {
  await db.run(
    `UPDATE users SET blocked_at=datetime('now'), last_err=?, last_err_at=datetime('now'), updated_at=datetime('now') WHERE user_id=?`,
    [String(text).slice(0, 500), user_id]
  );
}

export async function stats(db) {
  const total = await db.get(`SELECT COUNT(*) n FROM users`);
  const started = await db.get(`SELECT COUNT(*) n FROM users WHERE started_at IS NOT NULL`);
  const blocked = await db.get(`SELECT COUNT(*) n FROM users WHERE blocked_at IS NOT NULL`);
  const active = await db.get(`SELECT COUNT(*) n FROM users WHERE started_at IS NOT NULL AND blocked_at IS NULL`);
  return { total: total.n, started: started.n, blocked: blocked.n, active: active.n };
}

export async function exportUsers(db) {
  return db.all(`SELECT * FROM users ORDER BY updated_at DESC`);
}
