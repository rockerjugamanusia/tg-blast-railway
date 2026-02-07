import { sleep, errText, isBlocked, isChatNotFound, isRateLimit, retryAfterMs } from "./utils.js";
import { getTargets, markOk, markErr, markBlocked } from "./db.js";

const DELAY = Number(process.env.BLAST_DELAY_MS || 120); // aman
const PROGRESS_EVERY = Number(process.env.PROGRESS_EVERY || 25);

async function sendMsg(bot, chatId, text) {
  try {
    await bot.telegram.sendMessage(chatId, text, { disable_web_page_preview: true });
    return { ok: true };
  } catch (e) {
    if (isRateLimit(e)) {
      const waitMs = retryAfterMs(e);
      if (waitMs) {
        await sleep(waitMs);
        await bot.telegram.sendMessage(chatId, text, { disable_web_page_preview: true });
        return { ok: true, waitedMs: waitMs };
      }
    }
    return { ok: false, err: e };
  }
}

export async function blastAll(bot, db, text, onProgress) {
  const targets = await getTargets(db);

  const rep = {
    total: targets.length,
    ok: 0,
    fail: 0,
    blocked: 0,
    notFound: 0
  };

  for (let i = 0; i < targets.length; i++) {
    const user_id = targets[i].user_id;

    const r = await sendMsg(bot, user_id, text);

    if (r.ok) {
      rep.ok++;
      await markOk(db, user_id);
    } else {
      rep.fail++;
      const t = errText(r.err);

      if (isBlocked(t)) {
        rep.blocked++;
        await markBlocked(db, user_id, t);
      } else {
        if (isChatNotFound(t)) rep.notFound++;
        await markErr(db, user_id, t);
      }
    }

    if (onProgress && ((i + 1) % PROGRESS_EVERY === 0 || i + 1 === targets.length)) {
      await onProgress(i + 1, targets.length, rep);
    }

    await sleep(DELAY);
  }

  return rep;
}
