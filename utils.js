export function getAdminId() {
  return Number(process.env.ADMIN_ID || 0);
}

export function isAdminTelegram(ctx) {
  const adminId = getAdminId();
  // kalau ADMIN_ID belum di-set, JANGAN bikin semua user bisa.
  // lebih aman: blok semua command admin sampai adminId ada.
  if (!adminId) return false;
  return Number(ctx?.from?.id) === adminId;
}

export function denyAdmin(ctx) {
  const adminId = getAdminId();
  const me = ctx?.from?.id;
  return ctx.reply(
    `⛔ Akses ditolak.\nID kamu: ${me}\nADMIN_ID saat ini: ${adminId || "(belum diset)"}\n\nSet ADMIN_ID di Railway ke ID kamu.`,
    { disable_web_page_preview: true }
  );
}

export function errText(e) {
  return (e?.response?.description || e?.description || e?.message || String(e));
}

export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
