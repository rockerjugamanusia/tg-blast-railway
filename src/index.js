import { openDb } from "./db.js";
import { createBot } from "./bot.js";

const db = await openDb();
const bot = createBot(db);

bot.launch();
console.log("🚀 Bot berjalan (polling)");

process.on("SIGINT", () => bot.stop("SIGINT"));
process.on("SIGTERM", () => bot.stop("SIGTERM"));
