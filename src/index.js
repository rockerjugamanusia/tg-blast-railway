import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { openDb, importUserIds, getStartedUsers } from "./db.js";
import { createBot } from "./bot.js";
import { requireAdminKey } from "./utils.js";
import { blastMany } from "./blaster.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = openDb();
const bot = createBot(db);

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// import user ids (optional)
app.post("/api/import-ids", requireAdminKey, (req, res) => {
  const ids = (req.body?.ids || []).map(Number).filter(Boolean);
  importUserIds(db, ids);
  res.json({ ok: true, imported: ids.length });
});

app.get("/api/started-users", requireAdminKey, (req, res) => {
  const rows = getStartedUsers(db);
  res.json({ ids: rows.map(r => r.user_id) });
});

app.post("/api/blast", requireAdminKey, async (req, res) => {
  const ids = (req.body?.ids || []).map(Number).filter(Boolean);
  const message = String(req.body?.message || "");
  const delayMs = Number(req.body?.delayMs || 800);

  if (!message) return res.status(400).json({ error: "message kosong" });
  if (!ids.length) return res.status(400).json({ error: "ids kosong" });

  const rep = await blastMany({ bot, db, ids, message, delayMs });
  res.json(rep);
});

// Railway uses PORT
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log("Dashboard running on port", PORT));

// POLLING mode (biar simpel & cepat live)
bot.launch().then(() => console.log("Bot polling started"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
