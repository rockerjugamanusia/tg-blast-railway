import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export function openDb() {
  const DATA_DIR = process.env.DATA_DIR || "/app/data";
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const DB_FILE = process.env.DB_FILE || "blast.sqlite";
  const dbPath = path.join(DATA_DIR, DB_FILE);

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      started_at TEXT,
      last_ok_at TEXT,
      blocked INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS blast_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (datetime('now')),
      target_id INTEGER,
      status TEXT,
      error TEXT
    );
  `);

  return db;
}

export function upsertUser(db, from) {
  const stmt = db.prepare(`
    INSERT INTO users (user_id, username, first_name, last_name, started_at)
    VALUES (@id, @username, @first_name, @last_name, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      username=excluded.username,
      first_name=excluded.first_name,
      last_name=excluded.last_name
  `);
  stmt.run({
    id: from.id,
    username: from.username || null,
    first_name: from.first_name || null,
    last_name: from.last_name || null
  });
}

export function markBlocked(db, userId, blocked) {
  db.prepare(`UPDATE users SET blocked=? WHERE user_id=?`).run(blocked ? 1 : 0, userId);
}

export function markOk(db, userId) {
  db.prepare(`UPDATE users SET last_ok_at=datetime('now') WHERE user_id=?`).run(userId);
}

export function insertLog(db, targetId, status, error = null) {
  db.prepare(`INSERT INTO blast_logs (target_id, status, error) VALUES (?, ?, ?)`)
    .run(targetId, status, error);
}

export function getStartedUsers(db) {
  return db.prepare(`SELECT user_id FROM users WHERE started_at IS NOT NULL AND blocked=0`).all();
}

export function importUserIds(db, ids) {
  const ins = db.prepare(`
    INSERT INTO users (user_id)
    VALUES (?)
    ON CONFLICT(user_id) DO NOTHING
  `);
  const tx = db.transaction((arr) => arr.forEach((id) => ins.run(id)));
  tx(ids);
}

export function stats(db) {
  const total = db.prepare(`SELECT COUNT(*) c FROM users`).get().c;
  const started = db.prepare(`SELECT COUNT(*) c FROM users WHERE started_at IS NOT NULL`).get().c;
  const blocked = db.prepare(`SELECT COUNT(*) c FROM users WHERE blocked=1`).get().c;
  return { total, started, blocked };
}
