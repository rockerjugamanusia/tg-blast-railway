export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function isAdmin(ctx) {
  const adminId = Number(process.env.ADMIN_ID || 0);
  if (!adminId) return true; // kalau belum diset, semua bisa (buat test)
  return ctx.from?.id === adminId;
}

export function errText(err) {
  return String(err?.response?.description || err?.description || err?.message || err);
}

export function isBlocked(t) {
  t = (t || "").toLowerCase();
  return t.includes("bot was blocked") || t.includes("user is deactivated") || t.includes("forbidden");
}

export function isChatNotFound(t) {
  t = (t || "").toLowerCase();
  return t.includes("chat not found");
}

export function isRateLimit(err) {
  return err?.response?.error_code === 429;
}

export function retryAfterMs(err) {
  const sec = err?.response?.parameters?.retry_after;
  if (!sec) return 0;
  return (Number(sec) + 1) * 1000;
}
