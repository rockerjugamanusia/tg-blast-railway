import { Telegraf } from "telegraf";
import { isAdmin, errText } from "./utils.js";
import { upsertUser, stats, exportUsers } from "./db.js";
import { blastAll } from "./blast.js";

export function createBot(db) {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error("BOT_TOKEN belum diset");

  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    try {
      // ctx.from bisa null di beberapa kasus (misal channel)
      if (ctx.from) await upsertUser(db, ctx.from);

      await ctx.reply(
        "✅ Bot Blast Aktif.\n\nPerintah:\n" +
          "/stats\n" +
          "/exportusers\n" +
          "/blast <chat_id> <pesan>\n" +
          "/blastall <pesan>\n",
        { disable_web_page_preview: true }
      );
    } catch (e) {
      await ctx.reply("❌ Error: " + errText(e));
    }
  });

  bot.command("stats", async (ctx) => {
    if (!isAdmin(ctx)) return;

    try {
      const s = await stats(db);
      await ctx.reply(
        `📊 Stats\nTotal: ${s.total}\nPernah /start: ${s.started}\nAktif: ${s.active}\nBlocked: ${s.blocked}`
      );
    } catch (e) {
      await ctx.reply("❌ Error: " + errText(e));
    }
  });

  bot.command("exportusers", async (ctx) => {
    if (!isAdmin(ctx)) return;

    try {
      const rows = await exportUsers(db);
      const json = JSON.stringify(rows, null, 2);
      await ctx.replyWithDocument({
        source: Buffer.from(json),
        filename: "users.json",
      });
    } catch (e) {
      await ctx.reply("❌ Error: " + errText(e));
    }
  });

  bot.command("blast", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const text = ctx.message?.text ?? "";
    const parts = text.split(" ").filter(Boolean);

    if (parts.length < 3) {
      return ctx.reply("Format: /blast <chat_id> <pesan>\nContoh: /blast -1001234567890 Halo semua");
    }

    const chatIdRaw = parts[1];
    const msg = parts.slice(2).join(" ");

    // chat_id bisa negatif (channel/group)
    const chatId = Number(chatIdRaw);
    if (!Number.isFinite(chatId)) {
      return ctx.reply("❌ chat_id tidak valid. Contoh: -1001234567890 atau 6220019493");
    }

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

    const raw = ctx.message?.text ?? "";
    const msg = raw.replace(/^\/blastall(@\w+)?\s*/i, "").trim();
    if (!msg) return ctx.reply("Format: /blastall <pesan>");

    try {
      await ctx.reply("⏳ Blast mulai...");

      const rep = await blastAll(bot, db, msg, async (done, total, r) => {
        // Update progres (ini bisa spam kalau terlalu sering; idealnya editMessageText, tapi ini aman dulu)
        await ctx.reply(`📤 ${done}/${total} | ✅${r.ok} ❌${r.fail} 🚫${r.blocked} 🧯${r.notFound}`);
      });

      await ctx.reply(
        `✅ Blast selesai\n` +
          `Total: ${rep.total}\n` +
          `Sukses: ${rep.ok}\n` +
          `Gagal: ${rep.fail}\n` +
          `Blocked: ${rep.blocked}\n` +
          `Chat not found: ${rep.notFound}`
      );
    } catch (e) {
      await ctx.reply("❌ Error: " + errText(e));
    }
  });

  return bot;
}
