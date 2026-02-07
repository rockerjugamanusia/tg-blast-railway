export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function isAdmin(ctx) {
  const adminId = Number(process.env.ADMIN_ID || 0);
  if (!adminId) return true; // kalau ADMIN_ID belum di-set, anggap semua admin (untuk testing)
  return ctx.from?.id === adminId;
}

export function pickErrorText(err) {
  // telegraf error biasanya punya response?.description
  const desc = err?.response?.description || err?.description || err?.message || String(err);
  return String(desc);
}

// Detect error type
export function isBlockedError(errText) {
  const t = errText.toLowerCase();
  return t.includes("bot was blocked") || t.includes("user is deactivated") || t.includes("forbidden");
}
export function isChatNotFound(errText) {
  const t = errText.toLowerCase();
  return t.includes("chat not found");
}
export function isRateLimit(err) {
  return err?.response?.error_code === 429;
}
export function retryAfterMs(err) {
  const sec = err?.response?.parameters?.retry_after;
  if (!sec) return 0;
  return (Number(sec) + 1) * 1000; // +1 detik aman
}
