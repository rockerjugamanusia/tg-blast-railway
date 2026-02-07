import { sleep, pickErrorText, isBlockedError, isChatNotFound, isRateLimit, retryAfterMs } from "./utils.js";
import { getBlastTargets, markOk, markErr, markBlocked } from "./db.js";

const DEFAULT_DELAY_MS = Number(process.env.BLAST_DELAY_MS || 80); // aman: ~12 msg/detik
const MAX_FAILS_STOP = Number(process.env.BLAST_MAX_FAILS_STOP || 0); // 0 = jangan stop

async function sendWithRetry(bot, chatId, text) {
  try {
    await bot.telegram.sendMessage(chatId, text, { disable_web_page_preview: true });
    return { ok: true };
  } catch (err) {
    // rate limit 429 → tunggu lalu retry sekali
    if (isRateLimit(err)) {
      const waitMs = retryAfterMs(err);
      if (waitMs > 0) {
        await sleep(waitMs);
        await bot.telegram.sendMessage(chatId, text, { disable_web_page_preview: true });
        return { ok: true, waitedMs: waitMs };
      }
    }
    return { ok: false, err };
  }
}

export async function blastAll({ bot, db, text, onProgress }) {
  const targets = await getBlastTargets(db);

  const report = {
    total: targets.length,
    ok: 0,
    fail: 0,
    blocked: 0,
    notFound: 0,
    details: [], // simpan ringkas
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };

  let failsInRow = 0;

  for (let i = 0; i < targets.length; i++) {
    const user_id = targets[i].user_id;

    const res = await sendWithRetry(bot, user_id, text);

    if (res.ok) {
      report.ok++;
      failsInRow = 0;
      await markOk(db, user_id);
    } else {
      report.fail++;
      failsInRow++;
      const errText = pickErrorText(res.err);

      if (isBlockedError(errText)) {
        report.blocked++;
        await markBlocked(db, user_id, errText);
      } else if (isChatNotFound(errText)) {
        report.notFound++;
        // chat not found sering berarti user belum start / ID salah
        await markErr(db, user_id, errText);
      } else {
        await markErr(db, user_id, errText);
      }

      report.details.push({ user_id, err: errText.slice(0, 120) });
    }

    if (typeof onProgress === "function") {
      await onProgress({ i: i + 1, total: targets.length, report });
    }

    if (MAX_FAILS_STOP > 0 && failsInRow >= MAX_FAILS_STOP) {
      report.details.push({ system: true, err: `Stop: ${failsInRow} gagal berturut-turut` });
      break;
    }

    await sleep(DEFAULT_DELAY_MS);
  }

  report.finishedAt = new Date().toISOString();
  return report;
}
