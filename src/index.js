import "dotenv/config";
import { Telegraf } from "telegraf";
import { setupBlastCommands } from "./blast.js"; // pastikan file ini ada
// kalau kamu pakai db, import db init di sini (opsional)
// import { initDb } from "./db.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("BOT_TOKEN belum diset");

const bot = new Telegraf(BOT_TOKEN);

// (opsional) kalau ada init db:
// await initDb();

setupBlastCommands(bot);

// ✅ POLLING (tidak butuh PUBLIC_URL)
await bot.telegram.deleteWebhook({ drop_pending_updates: true }).catch(() => {});
await bot.launch();

console.log("✅ Bot polling live");

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
