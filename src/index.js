import "dotenv/config";
import express from "express";
import { initDb } from "./db.js";
import { createBot } from "./bot.js";

async function main() {
  // 1) Web server kecil untuk healthcheck (Railway suka)
  const app = express();
  app.get("/", (req, res) => res.status(200).send("OK"));
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log("🌐 HTTP listening on", PORT));

  // 2) DB
  const db = await initDb();

  // 3) Bot
  const bot = createBot(db);

  // 4) Polling mode, pastikan webhook mati biar ga konflik
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
  } catch {}

  await bot.launch({ dropPendingUpdates: true });
  console.log("✅ Bot polling aktif.");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
