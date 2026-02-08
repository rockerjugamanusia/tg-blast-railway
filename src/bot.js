import { Telegraf } from "telegraf";
import { mustEnv } from "./utils.js";
import { upsertUser, stats } from "./db.js";

export function createBot(db) {
  const BOT_TOKEN = mustEnv("BOT_TOKEN");
  const ADMIN_ID = Number(process.env.ADMIN_ID || 0);

  const bot = new Telegraf(BOT_TOKEN);

  bot.start(async (ctx) => {
    await upsertUser(db, ctx.from);
    await ctx.reply("✅ Bot Blast Aktif.\nKamu sudah terdaftar.");
  });

  bot.command("stats", async (ctx) => {
    if (ADMIN_ID && ctx.from.id !== ADMIN_ID) return;
    const s = stats(db);
    await ctx.reply(
      `📊 Stats\nTotal: ${s.total}\nStarted: ${s.started}\nBlocked: ${s.blocked}`
    );
  });

  return bot;
}
