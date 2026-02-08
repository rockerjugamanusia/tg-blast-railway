import { createBot } from "./bot.js";
import { openDb } from "./db.js";

const db = openDb();
const bot = createBot(db);

// polling (tanpa webhook)
bot.launch();

console.log("✅ Bot running (polling)");

// graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
