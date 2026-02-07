import "dotenv/config";
import { initDb } from "./db.js";
import { createBot } from "./bot.js";

async function main() {
  const db = await initDb();
  const bot = createBot(db);

  // IMPORTANT: polling mode (tanpa webhook)
  // hapus webhook dulu biar tidak bentrok
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
  } catch {}

  await bot.launch({
    dropPendingUpdates: true
  });

  console.log("✅ Bot polling aktif.");

  // Graceful stop
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
