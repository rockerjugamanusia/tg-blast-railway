import { openDb } from "./db.js";
import { createBot } from "./bot.js";

async function main() {
  const db = await openDb();
  const bot = createBot(db);

  // POLLING supaya cepat live dan tidak webhook error
  await bot.launch();
  console.log("✅ Bot polling aktif");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
