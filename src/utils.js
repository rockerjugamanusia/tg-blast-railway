export function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} belum diset`);
  return v;
}

export function toInt(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function nowISO() {
  return new Date().toISOString();
}

// admin pakai 2 cara:
// 1) ADMIN_ID (Telegram user id)
// 2) ADMIN_KEY (buat dashboard / API)
export function isAdminTelegram(ctx) {
  const adminId = toInt(process.env.ADMIN_ID, 0);
  if (!adminId) return true; // kalau kosong: anggap bebas (boleh kamu ubah)
  return ctx?.from?.id === adminId;
}

export function isAdminKey(req) {
  const key = process.env.ADMIN_KEY || "";
  if (!key) return true; // kalau kosong: bebas (boleh kamu ubah)
  const got = req.headers["x-admin-key"] || req.query.key || "";
  return String(got) === String(key);
}

// ringkas error telegram
export function errText(e) {
  const msg = e?.message || String(e);
  const code = e?.code;
  const desc = e?.response?.description;
  return [code, desc, msg].filter(Boolean).join(" | ");
}
