import { Telegraf } from "telegraf";
import { mustEnv } from "./utils.js";
import { upsertUser, stats as dbStats } from "./db.js";

export function createBot(db) {
  const BOT_TOKEN = mustEnv("BOT_TOKEN");
  const bot = new Telegraf(BOT_TOKEN);

  bot.start(async (ctx) => {
    upsertUser(db, ctx.from);
    await ctx.reply("✅ Bot aktif. Kamu sudah terdaftar (start).");
  });

  bot.command("stats", async (ctx) => {
    const ADMIN_ID = Number(process.env.ADMIN_ID || 0);
    if (ADMIN_ID && ctx.from?.id !== ADMIN_ID) return;
    const s = dbStats(db);
    await ctx.reply(`📊 Users\nTotal: ${s.total}\nPernah /start: ${s.started}\nBlocked: ${s.blocked}`);
  });

  return bot;
}
