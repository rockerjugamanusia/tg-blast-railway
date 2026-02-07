export function isAdmin(ctx) {
  const adminId = Number(process.env.ADMIN_ID || 0);
  if (!adminId) return true; // kalau belum diset, sementara anggap admin semua (biar bisa test)
  return Number(ctx.from?.id) === adminId;
}

export function errText(e) {
  const msg = e?.message || String(e);
  const desc = e?.response?.description || e?.description;
  return desc ? `${msg} | ${desc}` : msg;
}

export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
