export function mustEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} belum diset`);
  }
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
