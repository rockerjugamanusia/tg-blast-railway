import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function openDb() {
  const dataDir = process.env.DATA_DIR || "/app/data";
  const dbFile = process.env.DB_FILE || "blast.sqlite";
  fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, dbFile);

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id     INTEGER PRIMARY KEY,
      username    TEXT,
      first_name  TEXT,
      last_name   TEXT,
      started     INTEGER DEFAULT 0,
      status      TEXT DEFAULT 'ok',         -- ok | blocked | not_found | fail
      last_error  TEXT,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );
  `);

  return db;
}

export async function upsertUser(db, from) {
  if (!from?.id) return;

  const user_id = Number(from.id);
  const username = from.username || null;
  const first_name = from.first_name || null;
  const last_name = from.last_name || null;

  await db.run(
    `
    INSERT INTO users (user_id, username, first_name, last_name, started, updated_at)
    VALUES (?, ?, ?, ?, 1, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      username=excluded.username,
      first_name=excluded.first_name,
      last_name=excluded.last_name,
      started=1,
      updated_at=datetime('now');
    `,
    [user_id, username, first_name, last_name]
  );
}

export async function markResult(db, userId, status, lastError = null) {
  await db.run(
    `
    UPDATE users
    SET status=?, last_error=?, updated_at=datetime('now')
    WHERE user_id=?;
    `,
    [status, lastError, Number(userId)]
  );
}

export async function listTargets(db) {
  // hanya yang sudah pernah /start
  return db.all(`SELECT user_id FROM users WHERE started=1`);
}

export async function stats(db) {
  const total = (await db.get(`SELECT COUNT(*) as c FROM users`))?.c || 0;
  const started = (await db.get(`SELECT COUNT(*) as c FROM users WHERE started=1`))?.c || 0;

  const ok = (await db.get(`SELECT COUNT(*) as c FROM users WHERE status='ok'`))?.c || 0;
  const blocked = (await db.get(`SELECT COUNT(*) as c FROM users WHERE status='blocked'`))?.c || 0;
  const not_found = (await db.get(`SELECT COUNT(*) as c FROM users WHERE status='not_found'`))?.c || 0;
  const fail = (await db.get(`SELECT COUNT(*) as c FROM users WHERE status='fail'`))?.c || 0;

  return { total, started, ok, blocked, notFound: not_found, fail };
}

export async function exportUsers(db) {
  return db.all(`SELECT * FROM users ORDER BY updated_at DESC`);
}
