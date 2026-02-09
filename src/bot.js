import { Telegraf } from "telegraf";
import { isAdmin, errText } from "./utils.js";
import { upsertUser, stats, exportUsers } from "./db.js";
import { blastAll } from "./blast.js";

export function createBot(db) {
  const bot = new Telegraf(process.env.BOT_TOKEN);

  bot.start(async (ctx) => {
    await upsertUser(db, ctx.from);
    await ctx.reply(
      "✅SELAMAT DATANG DI BOT BACKUP STAY TERUS YA ❤️"
    );
  });

  bot.command("stats", async (ctx) => {
    if (!isAdmin(ctx)) return;
    const s = await stats(db);
    await ctx.reply(`👤 Total user: ${s.total}`);
  });

  bot.command("blastall", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const msg = ctx.message.text.replace(/^\/blastall\s*/i, "");
    if (!msg) return ctx.reply("Format: /blastall <pesan>");

    await ctx.reply("🚀 Blast dimulai...");

    const rep = await blastAll(bot, db, msg, async (done, total, r) => {
      if (done % 20 === 0) {
        await ctx.reply(
          `📤 ${done}/${total} | ✅${r.ok} ❌${r.fail} 🚫${r.blocked}`
        );
      }
    });

    await ctx.reply(
      `✅ Blast selesai\nTotal: ${rep.total}\nSukses: ${rep.ok}\nGagal: ${rep.fail}\nBlocked: ${rep.blocked}\nNotFound: ${rep.notFound}`
    );
  });

  return bot;
}
