import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { openDb } from "./db.js";
import { createBot } from "./bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = openDb();
const bot = createBot(db);

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Dashboard aktif");
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log("Web running on", PORT));

bot.launch();
