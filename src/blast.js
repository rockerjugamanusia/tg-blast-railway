import { delay, errText } from "./utils.js";
import { listTargets, markResult } from "./db.js";

function classifyError(e) {
  const d = (e?.response?.description || "").toLowerCase();

  if (d.includes("bot was blocked by the user")) return "blocked";
  if (d.includes("user is deactivated")) return "blocked";
  if (d.includes("chat not found")) return "not_found";
  if (d.includes("forbidden")) return "blocked";

  return "fail";
}

export async function blastAll(bot, db, message, onProgress) {
  const rows = await listTargets(db);
  const total = rows.length;

  const gapMs = Number(process.env.BLAST_DELAY_MS || 800); // aman anti limit

  let ok = 0, fail = 0, blocked = 0, notFound = 0;
  let done = 0;

  for (const r of rows) {
    const userId = Number(r.user_id);

    try {
      await bot.telegram.sendMessage(userId, message, { disable_web_page_preview: true });
      ok++;
      await markResult(db, userId, "ok", null);
    } catch (e) {
      const type = classifyError(e);
      const text = errText(e);

      if (type === "blocked") blocked++;
      else if (type === "not_found") notFound++;
      else fail++;

      await markResult(db, userId, type, text);
    }

    done++;
    if (onProgress && (done === 1 || done % 20 === 0 || done === total)) {
      await onProgress(done, total, { ok, fail, blocked, notFound });
    }

    await delay(gapMs);
  }

  return { total, ok, fail, blocked, notFound };
}
