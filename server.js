// Server kecil: API + database berupa file data/db.json + (dev) Vite / (produksi) folder dist.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const DB = path.join(root, "data", "db.json");
const DIST = path.join(root, "dist");
const PORT = Number(process.env.PORT) || 3000;
const DEV = process.argv.includes("--dev");
const MAX_BODY = 20 * 1024 * 1024;

/* ---------- database (file JSON, ditulis atomik + cadangan) ---------- */
function load() {
  try { return JSON.parse(fs.readFileSync(DB, "utf8")); }
  catch (e) { return { projects: {}, drawings: null, hps: null }; }
}
function save(d) {
  fs.mkdirSync(path.dirname(DB), { recursive: true });
  const tmp = DB + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(d, null, 1));
  if (fs.existsSync(DB)) fs.copyFileSync(DB, DB + ".bak");
  fs.renameSync(tmp, DB);
}

/* ---------- API ---------- */
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const send = (res, code, obj) => {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
};
function readBody(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const parts = [];
    req.on("data", (c) => { n += c.length; if (n > MAX_BODY) { reject(new Error("Data terlalu besar")); req.destroy(); } else parts.push(c); });
    req.on("end", () => { try { resolve(parts.length ? JSON.parse(Buffer.concat(parts).toString("utf8")) : {}); } catch (e) { reject(new Error("JSON tidak valid")); } });
    req.on("error", reject);
  });
}

async function api(req, res, url) {
  const db = load();
  const m = /^\/api\/projects(?:\/([^/]+))?$/.exec(url.pathname);

  if (req.method === "GET" && url.pathname === "/api/state") {
    const projects = Object.entries(db.projects || {}).map(([id, v]) => ({ id, ...v })).sort((a, b) => (a.o || 0) - (b.o || 0));
    return send(res, 200, { projects, drawings: db.drawings || null, hps: db.hps || null, recap: db.recap || {} });
  }

  if (m && req.method === "POST" && !m[1]) {
    const b = await readBody(req);
    if (!String(b.n || "").trim()) return send(res, 400, { error: "Nama proyek wajib diisi" });
    const o = Date.now();
    const id = "p" + o;
    db.projects[id] = { n: String(b.n).trim(), k: String(b.k || "").trim(), p: clamp(b.p), r: clamp(b.r), o };
    save(db);
    return send(res, 200, { id });
  }

  if (m && m[1] && req.method === "PATCH") {
    const cur = db.projects[m[1]];
    if (!cur) return send(res, 404, { error: "Proyek tidak ditemukan" });
    const b = await readBody(req);
    if ("n" in b) { if (!String(b.n).trim()) return send(res, 400, { error: "Nama proyek wajib diisi" }); cur.n = String(b.n).trim(); }
    if ("k" in b) cur.k = String(b.k || "").trim();
    if ("p" in b) cur.p = clamp(b.p);
    if ("r" in b) cur.r = clamp(b.r);
    save(db);
    return send(res, 200, { ok: true });
  }

  if (m && m[1] && req.method === "DELETE") {
    delete db.projects[m[1]];
    save(db);
    return send(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/sync") {
    const b = await readBody(req);
    if (!Array.isArray(b.rows)) return send(res, 400, { error: "File tidak valid. Gunakan drawing_data.json dari sync_drawing.py." });
    const generated = b.generated || new Date().toISOString().slice(0, 16);
    db.drawings = { generated, rows: b.rows, errors: Array.isArray(b.errors) ? b.errors : [] };
    if (Array.isArray(b.hps)) db.hps = { generated, rows: b.hps };
    if (b.recap) db.recap = b.recap;
    save(db);
    return send(res, 200, { ok: true, drawings: b.rows.length, hps: Array.isArray(b.hps) ? b.hps.length : null });
  }

  return send(res, 404, { error: "Tidak ditemukan" });
}

/* ---------- file statis (produksi) ---------- */
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2" };
function serveStatic(req, res, url) {
  let f = path.join(DIST, decodeURIComponent(url.pathname));
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, "index.html");
  if (!fs.existsSync(f)) { res.writeHead(500); return res.end("Folder dist belum ada. Jalankan: npm run build"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}

/* ---------- jalankan ---------- */
let vite = null;
if (DEV) {
  const { createServer } = await import("vite");
  vite = await createServer({ root, server: { middlewareMode: true }, appType: "spa" });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    if (vite) return vite.middlewares(req, res, () => { res.writeHead(404); res.end(); });
    return serveStatic(req, res, url);
  } catch (e) {
    if (!res.headersSent) send(res, 500, { error: e.message || "Kesalahan server" });
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Dashboard berjalan di http://localhost:${PORT}  (${DEV ? "mode dev" : "mode produksi"})`);
  console.log(`Data tersimpan di ${DB}`);
});
