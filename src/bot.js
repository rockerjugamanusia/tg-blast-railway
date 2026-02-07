import { Telegraf } from "telegraf";
import { isAdmin } from "./utils.js";
import { upsertUser, getStats, exportUsersJson } from "./db.js";
import { blastAll } from "./blast.js";

export function createBot(db) {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error("BOT_TOKEN belum diset");

  const bot = new Telegraf(token);

  // simpan user saat /start (agar valid untuk blast)
  bot.start(async (ctx) => {
    await upsertUser(db, ctx.from);
    await ctx.reply(
      "✅ Bot aktif.\n\nPerintah:\n/blast <chat_id> <pesan>\n/blastall <pesan>\n/stats\n/exportusers\n",
      { disable_web_page_preview: true }
    );
  });

  bot.command("stats", async (ctx) => {
    if (!isAdmin(ctx)) return;
    const s = await getStats(db);
    await ctx.reply(
      `📊 Stats\nTotal: ${s.total}\nPernah /start: ${s.started}\nAktif (bisa blast): ${s.active}\nBlocked: ${s.blocked}`
    );
  });

  bot.command("exportusers", async (ctx) => {
    if (!isAdmin(ctx)) return;
    const rows = await exportUsersJson(db);
    const json = JSON.stringify(rows, null, 2);
    // kirim sebagai file kecil (kalau besar, mending simpan ke /app/data lalu sendDocument)
    await ctx.replyWithDocument({ source: Buffer.from(json), filename: "users.json" });
  });

  // /blast <chat_id> <pesan>
  bot.command("blast", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const text = ctx.message?.text || "";
    const parts = text.split(" ").filter(Boolean);
    if (parts.length < 3) {
      return ctx.reply("Format: /blast <chat_id> <pesan>");
    }

    const chatId = Number(parts[1]);
    const msg = parts.slice(2).join(" ");

    try {
      await ctx.reply("⏳ Mengirim...");
      await ctx.telegram.sendMessage(chatId, msg, { disable_web_page_preview: true });
      await ctx.reply("✅ Sukses.");
    } catch (e) {
      await ctx.reply(`❌ Gagal: ${e?.response?.description || e?.message || e}`);
    }
  });

  // /blastall <pesan>
  bot.command("blastall", async (ctx) => {
    if (!isAdmin(ctx)) return;

    const raw = ctx.message?.text || "";
    const msg = raw.replace(/^\/blastall(@\w+)?\s*/i, "");
    if (!msg) return ctx.reply("Format: /blastall <pesan>");

    await ctx.reply("⏳ Blast mulai...");

    let lastPing = 0;
    const report = await blastAll({
      bot,
      db,
      text: msg,
      onProgress: async ({ i, total, report }) => {
        // update tiap 25 kirim atau tiap 5 detik biar gak spam
        const now = Date.now();
        if (i % 25 === 0 || now - lastPing > 5000) {
          lastPing = now;
          await ctx.reply(`📤 Progress ${i}/${total} | ✅${report.ok} ❌${report.fail} 🚫${report.blocked}`);
        }
      },
    });

    // ringkas report
    await ctx.reply(
      `✅ Blast selesai\nTotal target: ${report.total}\nSukses: ${report.ok}\nGagal: ${report.fail}\nBlocked: ${report.blocked}\nChat not found: ${report.notFound}`
    );
  });

  return bot;
}
