import "dotenv/config";
import { createBot } from "./bot.js";

const bot = createBot();

bot.catch((err, ctx) => {
  console.error("BOT_ERROR", err);
});

process.on("unhandledRejection", (e) => console.error("unhandledRejection", e));
process.on("uncaughtException", (e) => console.error("uncaughtException", e));

bot.launch({ dropPendingUpdates: true }).then(() => {
  console.log("✅ Bot polling aktif");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
