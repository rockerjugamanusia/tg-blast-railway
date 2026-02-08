import { errText } from "./utils.js";

export async function blastAll(bot, db, message, onProgress) {
  const users = await db.all(`SELECT user_id FROM users`);
  const total = users.length;

  let ok = 0;
  let fail = 0;
  let blocked = 0;
  let notFound = 0;
  let done = 0;

  for (const u of users) {
    try {
      await bot.telegram.sendMessage(u.user_id, message, {
        disable_web_page_preview: true,
      });
      ok++;
    } catch (e) {
      const t = errText(e);
      if (t.includes("blocked")) blocked++;
      else if (t.includes("chat not found")) notFound++;
      else fail++;
    }

    done++;
    if (onProgress && done % 10 === 0) {
      await onProgress(done, total, { ok, fail, blocked, notFound });
    }

    // anti limit
    await new Promise((r) => setTimeout(r, 1200));
  }

  return { total, ok, fail, blocked, notFound };
}
