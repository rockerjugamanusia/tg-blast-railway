import { sleep } from "./utils.js";
import { loadUsers, saveUsers } from "./storage.js";

// klasifikasi error Telegram
function classifyTelegramError(e) {
  const code = e?.response?.error_code;
  const desc = (e?.response?.description || e?.message || "").toLowerCase();

  if (code === 429) return { type: "rate_limit", retryAfter: e?.response?.parameters?.retry_after || 2 };
  if (desc.includes("bot was blocked by the user")) return { type: "blocked" };
  if (desc.includes("user is deactivated")) return { type: "blocked" };
  if (desc.includes("chat not found")) return { type: "not_found" };
  if (desc.includes("bad request: chat not found")) return { type: "not_found" };
  return { type: "other" };
}

async function sendWithRetry(sendFn, opts = {}) {
  const { maxRetry = 3 } = opts;

  for (let i = 0; i <= maxRetry; i++) {
    try {
      return { ok: true, res: await sendFn() };
    } catch (e) {
      const c = classifyTelegramError(e);

      if (c.type === "rate_limit") {
        const wait = (Number(c.retryAfter) || 2) * 1000;
        await sleep(wait);
        continue;
      }

      return { ok: false, err: e, class: c.type };
    }
  }
  return { ok: false, err: new Error("retry_exceeded"), class: "other" };
}

export async function blastToIds(telegram, ids, message, options = {}) {
  const delayMs = Number(options.delayMs ?? process.env.BLAST_DELAY_MS ?? 600); // default 600ms
  const reportEvery = Number(options.reportEvery ?? 25);

  let ok = 0, fail = 0, blocked = 0, notFound = 0, total = 0;

  const users = loadUsers();
  const map = new Map(users.map((u) => [Number(u.user_id), u]));

  for (const raw of ids) {
    const chatId = Number(raw);
    if (!Number.isFinite(chatId) || chatId <= 0) continue;

    total++;

    const result = await sendWithRetry(
      () => telegram.sendMessage(chatId, message, { disable_web_page_preview: true }),
      { maxRetry: 3 }
    );

    const u = map.get(chatId);

    if (result.ok) {
      ok++;
      if (u) u.status = "ok";
    } else {
      fail++;
      if (result.class === "blocked") { blocked++; if (u) u.status = "blocked"; }
      else if (result.class === "not_found") { notFound++; if (u) u.status = "not_found"; }
      else { if (u) u.status = "fail"; }
    }

    if (total % reportEvery === 0 && options.onProgress) {
      options.onProgress({ done: total, ok, fail, blocked, notFound });
    }

    await sleep(delayMs);
  }

  // simpan update status
  saveUsers(Array.from(map.values()));

  return { total, ok, fail, blocked, notFound };
}

export async function blastAllStarted(telegram, message, options = {}) {
  const users = loadUsers();
  const targets = users.filter((u) => !!u.started_at).map((u) => Number(u.user_id));
  return blastToIds(telegram, targets, message, options);
}
