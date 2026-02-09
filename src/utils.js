// src/utils.js

export function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} belum diset`);
  return v;
}

export function isAdmin(ctx) {
  const adminId = Number(process.env.ADMIN_ID || 0);
  if (!adminId) return false;
  return Number(ctx.from?.id) === adminId;
}

export function errText(e) {
  const msg =
    e?.description || e?.message || String(e);

  if (msg.includes("403")) return "blocked by user (403)";
  if (msg.toLowerCase().includes("chat not found")) return "chat not found";
  if (msg.toLowerCase().includes("too many requests")) return "rate limited";

  return msg;
}

export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
