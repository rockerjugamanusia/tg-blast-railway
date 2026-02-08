import express from "express";
import { isAdminKey } from "./utils.js";
import { importUserIds, loadUsers } from "./storage.js";
import { blastToIds, blastAllStarted } from "./blast.js";

export function createDashboard(bot) {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // auth middleware (ADMIN_KEY)
  app.use((req, res, next) => {
    if (!isAdminKey(req)) return res.status(401).send("Unauthorized (ADMIN_KEY salah)");
    next();
  });

  app.get("/", (req, res) => {
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end(`
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Telegram Blast Dashboard</title>
          <style>
            body{font-family:Arial;margin:20px;max-width:900px}
            textarea,input{width:100%;padding:10px;margin:8px 0}
            button{padding:10px 14px;margin-right:8px}
            .row{display:flex;gap:10px}
            .col{flex:1}
            small{color:#666}
          </style>
        </head>
        <body>
          <h2>Telegram Blast Dashboard</h2>
          <p><small>Auth via ADMIN_KEY (header <b>x-admin-key</b> atau query <b>?key=</b>)</small></p>

          <h3>1) Import user_id (opsional)</h3>
          <textarea id="ids" rows="6" placeholder="Tempel user_id banyak, pisah newline atau koma"></textarea>
          <button onclick="importIds()">Import IDs</button>

          <h3>2) Blast ke IDs tertentu</h3>
          <textarea id="msg" rows="5" placeholder="Tulis pesan blast..."></textarea>
          <div class="row">
            <div class="col">
              <input id="delay" placeholder="Delay ms (contoh 600)" value="600"/>
            </div>
            <div class="col">
              <button onclick="blastIds()">Blast IDs</button>
              <button onclick="blastAll()">Blast ALL (yang pernah /start)</button>
            </div>
          </div>

          <pre id="out"></pre>

          <script>
            const KEY = new URLSearchParams(location.search).get("key") || "";

            function parseIds(t){
              return t.split(/[,\\n\\r\\t ]+/).map(x=>x.trim()).filter(Boolean);
            }

            async function importIds(){
              const ids = parseIds(document.getElementById("ids").value);
              const r = await fetch("/api/import?key="+encodeURIComponent(KEY), {
                method:"POST",
                headers:{"content-type":"application/json"},
                body: JSON.stringify({ ids })
              });
              document.getElementById("out").textContent = await r.text();
            }

            async function blastIds(){
              const ids = parseIds(document.getElementById("ids").value);
              const message = document.getElementById("msg").value;
              const delayMs = Number(document.getElementById("delay").value || 600);
              const r = await fetch("/api/blast?key="+encodeURIComponent(KEY), {
                method:"POST",
                headers:{"content-type":"application/json"},
                body: JSON.stringify({ ids, message, delayMs })
              });
              document.getElementById("out").textContent = await r.text();
            }

            async function blastAll(){
              const message = document.getElementById("msg").value;
              const delayMs = Number(document.getElementById("delay").value || 600);
              const r = await fetch("/api/blastall?key="+encodeURIComponent(KEY), {
                method:"POST",
                headers:{"content-type":"application/json"},
                body: JSON.stringify({ message, delayMs })
              });
              document.getElementById("out").textContent = await r.text();
            }
          </script>
        </body>
      </html>
    `);
  });

  app.post("/api/import", (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const rep = importUserIds(ids);
    res.json(rep);
  });

  app.post("/api/blast", async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const message = String(req.body?.message || "").trim();
    const delayMs = Number(req.body?.delayMs || 600);
    if (!message) return res.status(400).send("message kosong");

    const rep = await blastToIds(bot.telegram, ids, message, { delayMs, reportEvery: 999999 });
    res.json(rep);
  });

  app.post("/api/blastall", async (req, res) => {
    const message = String(req.body?.message || "").trim();
    const delayMs = Number(req.body?.delayMs || 600);
    if (!message) return res.status(400).send("message kosong");

    const rep = await blastAllStarted(bot.telegram, message, { delayMs, reportEvery: 999999 });
    res.json(rep);
  });

  // cek users tersimpan
  app.get("/api/users", (req, res) => {
    res.json(loadUsers());
  });

  return app;
}
