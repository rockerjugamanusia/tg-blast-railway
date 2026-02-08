import { delay, errText } from "./utils.js";
import { insertLog, markBlocked, markOk } from "./db.js";

export async function blastMany({ bot, db, ids, message, delayMs = 800 }) {
  const rep = { total: ids.length, ok: 0, fail: 0, blocked: 0, notFound: 0 };

  for (let i = 0; i < ids.length; i++) {
    const id = Number(ids[i]);
    if (!id) continue;

    try {
      await bot.telegram.sendMessage(id, message, { disable_web_page_preview: true });
      rep.ok++;
      markOk(db, id);
      insertLog(db, id, "ok", null);
    } catch (e) {
      const t = errText(e);
      rep.fail++;
      insertLog(db, id, "fail", t);

      // klasifikasi error umum
      const s = (e?.response?.description || "").toLowerCase();
      if (s.includes("bot was blocked") || s.includes("forbidden")) {
        rep.blocked++;
        markBlocked(db, id, true);
      }
      if (s.includes("chat not found")) rep.notFound++;
    }

    if (i < ids.length - 1) await delay(delayMs);
  }

  return rep;
}
