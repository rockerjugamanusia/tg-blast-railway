export function isAdminTelegram(ctx) {
  const adminId = Number(process.env.ADMIN_ID || 0);
  if (!adminId) return true; // kalau tidak diset, semua boleh
  return Number(ctx?.from?.id) === adminId;
}

export function errText(e) {
  return (e?.response?.description || e?.description || e?.message || String(e));
}

export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
