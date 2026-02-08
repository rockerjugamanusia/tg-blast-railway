import fs from "fs";
import path from "path";
import { nowISO } from "./utils.js";

export function getDataDir() {
  // Railway enak pakai /app/data (kalau kamu mount volume)
  // lokal pakai ./data
  return process.env.DATA_DIR || (process.env.RAILWAY_ENVIRONMENT ? "/app/data" : "./data");
}

export function ensureDataDir() {
  const dir = getDataDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function usersFilePath() {
  return path.join(getDataDir(), "users.json");
}

export function loadUsers() {
  ensureDataDir();
  const fp = usersFilePath();
  if (!fs.existsSync(fp)) return [];
  try {
    return JSON.parse(fs.readFileSync(fp, "utf8")) || [];
  } catch {
    return [];
  }
}

export function saveUsers(rows) {
  ensureDataDir();
  fs.writeFileSync(usersFilePath(), JSON.stringify(rows, null, 2));
}

export function upsertUserFromCtx(ctx) {
  const u = ctx?.from;
  if (!u?.id) return;

  const users = loadUsers();
  const id = Number(u.id);

  const existing = users.find((x) => Number(x.user_id) === id);

  const payload = {
    user_id: id,
    username: u.username || null,
    first_name: u.first_name || null,
    last_name: u.last_name || null,
    started_at: existing?.started_at || nowISO(),
    last_seen_at: nowISO(),
    status: existing?.status || "ok"
  };

  if (existing) {
    Object.assign(existing, payload);
  } else {
    users.push(payload);
  }

  saveUsers(users);
}

export function importUserIds(ids = []) {
  const users = loadUsers();

  const set = new Set(users.map((x) => Number(x.user_id)));
  let added = 0;

  for (const raw of ids) {
    const id = Number(String(raw).trim());
    if (!Number.isFinite(id) || id <= 0) continue;
    if (set.has(id)) continue;

    users.push({
      user_id: id,
      username: null,
      first_name: null,
      last_name: null,
      started_at: null,        // karena belum /start
      last_seen_at: null,
      status: "unknown"
    });
    set.add(id);
    added++;
  }

  saveUsers(users);
  return { total: users.length, added };
}

export function statsUsers() {
  const users = loadUsers();
  const total = users.length;
  const started = users.filter((u) => !!u.started_at).length;
  const blocked = users.filter((u) => u.status === "blocked").length;
  const notFound = users.filter((u) => u.status === "not_found").length;
  return { total, started, blocked, notFound };
}
