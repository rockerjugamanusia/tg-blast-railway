import { Telegraf } from "telegraf";
import { isAdmin, errText, delay } from "./utils.js";
import { upsertUser, stats, exportUsers } from "./db.js";
import { blastAll } from "./blast.js";

export function createBot(db) {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error("BOT_TOKEN belum diset");

  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    await upsertUser(db, ctx.from);
    await ctx.reply(
      "✅ Bot Blast Aktif.\n\nPerintah:\n/stats\n/exportusers\n/blast <chat_id> <pesan>\n/blastall <pesan>\n",
      { disable_web_page_preview: true }
    );
  });

  bot.command("stats", async (ctx) => {
    if (!isAdmin(ctx)) return;
    const s = await stats(db);
    await ctx.reply(`📊 Stats\nTotal: ${s.total}\nPernah /start: ${s.started}\nAktif: ${s.active}\nBlocked: ${s.blocked}`);
  });

  bot.command("exportusers", async (ctx) => {
    if (!isAdmin(ctx)) return;
    const rows = await exportUsers(db);
    const json = JSON.stringify(rows, null, 2);
    await ctx.replyWithDocument({ source: Buffer.from(json), filename: "users.json" });
  });

  bot.command("blast", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const text = ctx.message?.text || "";
    const parts = text.split(" ").filter(Boolean);
    if (parts.length < 3) return ctx.reply("Format: /blast <chat_id> <pesan>");

    const chatId = Number(parts[1]);
    const msg = parts.slice(2).join(" ");

    try {
      await ctx.reply("⏳ Mengirim...");
      await ctx.telegram.sendMessage(chatId, msg, { disable_web_page_preview: true });
      await ctx.reply("✅ Sukses.");
    } catch (e) {
      await ctx.reply("❌ Gagal: " + errText(e));
    }
  });

  bot.command("blastall", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const raw = ctx.message?.text || "";
    const msg = raw.replace(/^\/blastall(@\w+)?\s*/i, "");
    if (!msg) return ctx.reply("Format: /blastall <pesan>");

    await ctx.reply("⏳ Blast mulai...");

    const rep = await blastAll(bot, db, msg, async (done, total, r) => {
      await ctx.reply(`📤 ${done}/${total} | ✅${r.ok} ❌${r.fail} 🚫${r.blocked}`);
    });

    await ctx.reply(
      `✅ Blast selesai\nTotal: ${rep.total}\nSukses: ${rep.ok}\nGagal: ${rep.fail}\nBlocked: ${rep.blocked}\nChat not found: ${rep.notFound}`
    );
  });

  return bot;
}
