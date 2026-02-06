import "dotenv/config";
import express from "express";
import { Telegraf } from "telegraf";
import { initDb, upsertUser, setOptin } from "./db.js";
import { setupBlastWorker } from "./blast.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID || 0);
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_URL = process.env.PUBLIC_URL;
const WEBHOOK_PATH = "/telegraf";

if (!BOT_TOKEN) throw new Error("BOT_TOKEN belum diset");
if (!PUBLIC_URL) throw new Error("PUBLIC_URL belum diset");

initDb();

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  await upsertUser(ctx.from);
  await ctx.reply("✅ Kamu terdaftar. Ketik /stop untuk berhenti.");
});

bot.command("stop", async (ctx) => {
  await setOptin(ctx.from.id, false);
  await ctx.reply("🛑 Kamu berhenti menerima pesan.");
});

setupBlastWorker(bot);

const app = express();
app.use(express.json());

app.post(WEBHOOK_PATH, (req, res) => bot.handleUpdate(req.body, res));
app.get("/", (_, res) => res.send("OK"));

await bot.telegram.setWebhook(`${PUBLIC_URL}${WEBHOOK_PATH}`);
app.listen(PORT, () => console.log("🚀 Server running"));
