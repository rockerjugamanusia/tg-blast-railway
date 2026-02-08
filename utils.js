export function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} belum diset`);
  return v;
}

export function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function errText(e) {
  const msg = e?.message || String(e);
  const desc = e?.response?.description || e?.description;
  return desc ? `${msg} | ${desc}` : msg;
}

export function requireAdminKey(req, res, next) {
  const key = req.headers["x-admin-key"] || req.query.key || "";
  const ADMIN_KEY = process.env.ADMIN_KEY || "";
  if (!ADMIN_KEY) return res.status(500).send("ADMIN_KEY belum diset");
  if (key !== ADMIN_KEY) return res.status(401).send("Unauthorized");
  next();
}
