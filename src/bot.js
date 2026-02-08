import { Telegraf } from "telegraf";
import { isAdminTelegram, denyAdmin, errText } from "./utils.js";
import { upsertUser, stats, exportUsers } from "./db.js";
import { blastAll } from "./blast.js";

export function createBot(db) {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error("BOT_TOKEN belum diset");

  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    try { await upsertUser(db, ctx.from); } catch {}
    await ctx.reply(
      "✅ Bot Blast Aktif.\n\nPerintah:\n/whoami\n/stats\n/exportusers\n/blast <chat_id> <pesan>\n/blastall <pesan>",
      { disable_web_page_preview: true }
    );
  });

  // cek ID telegram kamu
  bot.command("whoami", async (ctx) => {
    return ctx.reply(`🆔 ID kamu: ${ctx.from?.id}`);
  });

  bot.command("stats", async (ctx) => {
    if (!isAdminTelegram(ctx)) return denyAdmin(ctx);
    try {
      const s = await stats(db);
      await ctx.reply(
        `📊 Stats\nTotal: ${s.total}\nPernah /start: ${s.started}\nAktif: ${s.active}\nBlocked: ${s.blocked}`
      );
    } catch (e) {
      await ctx.reply("❌ Error stats: " + errText(e));
    }
  });

  bot.command("exportusers", async (ctx) => {
    if (!isAdminTelegram(ctx)) return denyAdmin(ctx);
    try {
      const rows = await exportUsers(db);
      const json = JSON.stringify(rows, null, 2);
      await ctx.replyWithDocument({ source: Buffer.from(json), filename: "users.json" });
    } catch (e) {
      await ctx.reply("❌ Error export: " + errText(e));
    }
  });

  bot.command("blast", async (ctx) => {
    if (!isAdminTelegram(ctx)) return denyAdmin(ctx);

    const text = ctx.message?.text || "";
    const parts = text.split(" ").filter(Boolean);
    if (parts.length < 3) return ctx.reply("Format: /blast <chat_id> <pesan>");

    const chatId = Number(parts[1]);
    if (!chatId) return ctx.reply("❌ chat_id harus angka. Contoh: /blast 123456789 Halo");

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
    if (!isAdminTelegram(ctx)) return denyAdmin(ctx);

    const raw = ctx.message?.text || "";
    const msg = raw.replace(/^\/blastall(@\w+)?\s*/i, "");
    if (!msg) return ctx.reply("Format: /blastall <pesan>");

    await ctx.reply("⏳ Blast mulai...");

    try {
      const rep = await blastAll(bot, db, msg, async (done, total, r) => {
        // update progress tiap 20 user biar nggak spam
        if (done % 20 === 0 || done === total) {
          await ctx.reply(`📤 ${done}/${total} | ✅${r.ok} ❌${r.fail} 🚫${r.blocked} 🔍${r.notFound}`);
        }
      });

      await ctx.reply(
        `✅ Blast selesai\nTotal: ${rep.total}\nSukses: ${rep.ok}\nGagal: ${rep.fail}\nBlocked: ${rep.blocked}\nChat not found: ${rep.notFound}`
      );
    } catch (e) {
      await ctx.reply("❌ Blastall error: " + errText(e));
    }
  });

  return bot;
}
