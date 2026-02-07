export function isAdmin(ctx) {
  const adminId = Number(process.env.ADMIN_ID || 0);
  if (!adminId) return true; // kalau ADMIN_ID belum diset, anggap semua admin (biar gampang test)
  return Number(ctx.from?.id) === adminId;
}

export function errText(e) {
  const desc = e?.response?.description || e?.description;
  const msg = e?.message || String(e);
  return desc ? `${msg} | ${desc}` : msg;
}

export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
