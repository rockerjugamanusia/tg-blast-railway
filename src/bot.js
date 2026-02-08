import { Telegraf } from "telegraf";
import { isAdminTelegram, errText } from "./utils.js";
import { upsertUserFromCtx, loadUsers, statsUsers } from "./storage.js";
import { blastAllStarted, blastToIds } from "./blast.js";

export function createBot() {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error("BOT_TOKEN belum diset");

  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    upsertUserFromCtx(ctx);
    await ctx.reply(
      "✅ Bot Blast Aktif.\n\nPerintah:\n" +
      "/stats\n" +
      "/exportusers\n" +
      "/blast <chat_id> <pesan>\n" +
      "/blastids <id1,id2,id3> <pesan>\n" +
      "/blastall <pesan>\n",
      { disable_web_page_preview: true }
    );
  });

  bot.on("message", (ctx) => {
    // update last_seen
    upsertUserFromCtx(ctx);
  });

  bot.command("stats", async (ctx) => {
    if (!isAdminTelegram(ctx)) return;
    const s = statsUsers();
    await ctx.reply(
      `📊 Stats\nTotal tersimpan: ${s.total}\nPernah /start: ${s.started}\nBlocked: ${s.blocked}\nChat not found: ${s.notFound}`
    );
  });

  bot.command("exportusers", async (ctx) => {
    if (!isAdminTelegram(ctx)) return;
    const rows = loadUsers();
    const json = JSON.stringify(rows, null, 2);
    await ctx.replyWithDocument({ source: Buffer.from(json), filename: "users.json" });
  });

  bot.command("blast", async (ctx) => {
    if (!isAdminTelegram(ctx)) return;

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

  // blast banyak id dari command
  bot.command("blastids", async (ctx) => {
    if (!isAdminTelegram(ctx)) return;

    const raw = ctx.message?.text || "";
    const cleaned = raw.replace(/^\/blastids(@\w+)?\s*/i, "");
    const firstSpace = cleaned.indexOf(" ");
    if (firstSpace === -1) return ctx.reply("Format: /blastids <id1,id2,id3> <pesan>");

    const idsPart = cleaned.slice(0, firstSpace).trim();
    const msg = cleaned.slice(firstSpace + 1).trim();
    if (!idsPart || !msg) return ctx.reply("Format: /blastids <id1,id2,id3> <pesan>");

    const ids = idsPart.split(",").map((x) => x.trim()).filter(Boolean);

    await ctx.reply(`⏳ Blast ke ${ids.length} user...`);
    const rep = await blastToIds(ctx.telegram, ids, msg, {
      delayMs: Number(process.env.BLAST_DELAY_MS || 600),
      reportEvery: 25,
      onProgress: (p) => ctx.reply(`📤 ${p.done} | ✅${p.ok} ❌${p.fail} 🚫${p.blocked} ❓${p.notFound}`)
    });

    await ctx.reply(
      `✅ Selesai\nTotal: ${rep.total}\nSukses: ${rep.ok}\nGagal: ${rep.fail}\nBlocked: ${rep.blocked}\nChat not found: ${rep.notFound}`
    );
  });

  bot.command("blastall", async (ctx) => {
    if (!isAdminTelegram(ctx)) return;

    const raw = ctx.message?.text || "";
    const msg = raw.replace(/^\/blastall(@\w+)?\s*/i, "");
    if (!msg) return ctx.reply("Format: /blastall <pesan>");

    await ctx.reply("⏳ Blast ke semua yang pernah /start...");
    const rep = await blastAllStarted(ctx.telegram, msg, {
      delayMs: Number(process.env.BLAST_DELAY_MS || 600),
      reportEvery: 25,
      onProgress: (p) => ctx.reply(`📤 ${p.done} | ✅${p.ok} ❌${p.fail} 🚫${p.blocked} ❓${p.notFound}`)
    });

    await ctx.reply(
      `✅ Blast selesai\nTotal: ${rep.total}\nSukses: ${rep.ok}\nGagal: ${rep.fail}\nBlocked: ${rep.blocked}\nChat not found: ${rep.notFound}`
    );
  });

  return bot;
}
