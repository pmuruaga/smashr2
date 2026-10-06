import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { requireAdmin } from "../auth.js";
import { notifyEverywhere } from "./sseRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bannersDir = path.join(__dirname, "..", "..", "uploads", "banners");
const configPath = path.join(bannersDir, "config.json");
if (!fs.existsSync(bannersDir)) fs.mkdirSync(bannersDir, { recursive: true });

const DEFAULT_ITEMS = [
  { id: "banner1", src: "/assets/banner1.jfif", enabled: true, order: 0 },
  { id: "banner2", src: "/assets/banner2.jfif", enabled: true, order: 1 },
  { id: "banner3", src: "/assets/banner3.jfif", enabled: true, order: 2 },
  { id: "banner4", src: "/assets/banner4.jfif", enabled: true, order: 3 },
  { id: "banner5", src: "/assets/banner5.jfif", enabled: true, order: 4 },
  { id: "banner6", src: "/assets/banner6.jfif", enabled: true, order: 5 },
];

function defaultConfig() {
  return {
    intervalMs: 5000,
    items: DEFAULT_ITEMS.map((i) => ({ ...i, isDefault: true })),
  };
}

function readConfig() {
  try {
    if (!fs.existsSync(configPath)) {
      const cfg = defaultConfig();
      writeConfig(cfg);
      return cfg;
    }
    const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!Array.isArray(raw.items) || raw.items.length === 0) {
      const cfg = defaultConfig();
      writeConfig(cfg);
      return cfg;
    }
    return {
      intervalMs: Number(raw.intervalMs) > 0 ? Number(raw.intervalMs) : 5000,
      items: raw.items.map((item, idx) => ({
        id: String(item.id || `item-${idx}`),
        src: String(item.src || ""),
        enabled: item.enabled !== false,
        order: typeof item.order === "number" ? item.order : idx,
        isDefault: Boolean(item.isDefault) || String(item.src || "").startsWith("/assets/"),
      })),
    };
  } catch {
    const cfg = defaultConfig();
    writeConfig(cfg);
    return cfg;
  }
}

function writeConfig(cfg) {
  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), "utf8");
}

function saveAndNotify(cfg) {
  writeConfig(cfg);
  notifyEverywhere({ type: "publicidad" });
}

function sortedItems(cfg) {
  return [...cfg.items].sort((a, b) => a.order - b.order);
}

function resolvePlaylist(cfg) {
  return sortedItems(cfg)
    .filter((i) => i.enabled && i.src)
    .map((i) => i.src);
}

function responsePayload(cfg) {
  const items = sortedItems(cfg).map((i, idx) => ({
    ...i,
    order: idx,
    isDefault: i.isDefault || String(i.src).startsWith("/assets/"),
  }));
  return {
    intervalMs: cfg.intervalMs,
    items,
    banners: resolvePlaylist({ ...cfg, items }),
  };
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, bannersDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const safe = file.originalname
      .replace(ext, "")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 40);
    cb(null, `${safe || "banner"}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo imágenes"));
    }
    cb(null, true);
  },
});

const router = Router();

router.get("/banners", (_req, res) => {
  const cfg = readConfig();
  res.json({ status: "ok", data: responsePayload(cfg) });
});

router.patch("/banners", requireAdmin, (req, res) => {
  try {
    const cfg = readConfig();
    const { items, intervalMs } = req.body || {};

    if (intervalMs != null) {
      const n = Number(intervalMs);
      if (Number.isFinite(n) && n >= 1500) cfg.intervalMs = n;
    }

    if (Array.isArray(items)) {
      const byId = new Map(cfg.items.map((i) => [i.id, i]));
      const next = [];
      items.forEach((incoming, idx) => {
        const existing = byId.get(incoming.id);
        if (!existing) return;
        next.push({
          ...existing,
          enabled: incoming.enabled !== undefined ? Boolean(incoming.enabled) : existing.enabled,
          order: typeof incoming.order === "number" ? incoming.order : idx,
          src: existing.src,
          id: existing.id,
          isDefault: existing.isDefault || existing.src.startsWith("/assets/"),
        });
      });
      // keep any items not mentioned
      cfg.items.forEach((item) => {
        if (!next.find((n) => n.id === item.id)) {
          next.push(item);
        }
      });
      cfg.items = next.map((i, idx) => ({ ...i, order: idx }));
    }

    saveAndNotify(cfg);
    res.json({ status: "ok", data: responsePayload(cfg) });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.post("/banners", requireAdmin, (req, res) => {
  upload.single("imagen")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ status: "error", message: err.message || "Error al subir" });
    }
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Sin archivo" });
    }
    const cfg = readConfig();
    const url = `/uploads/banners/${req.file.filename}`;
    const maxOrder = cfg.items.reduce((m, i) => Math.max(m, i.order), -1);
    cfg.items.push({
      id: `upload-${Date.now()}`,
      src: url,
      enabled: true,
      order: maxOrder + 1,
      isDefault: false,
    });
    saveAndNotify(cfg);
    res.json({ status: "ok", url, data: responsePayload(cfg) });
  });
});

router.delete("/banners/:id", requireAdmin, (req, res) => {
  const cfg = readConfig();
  const id = req.params.id;
  const item = cfg.items.find((i) => i.id === id);
  if (!item) {
    // backward compat: delete by filename
    const name = path.basename(id);
    const bySrc = cfg.items.find((i) => i.src.endsWith(`/${name}`) || i.src.includes(name));
    if (!bySrc) {
      return res.status(404).json({ status: "error", message: "No encontrado" });
    }
    return deleteItem(cfg, bySrc, res);
  }
  return deleteItem(cfg, item, res);
});

function deleteItem(cfg, item, res) {
  if (item.isDefault || item.src.startsWith("/assets/")) {
    return res.status(400).json({
      status: "error",
      message: "Los banners por defecto no se eliminan; deshabilitalos",
    });
  }
  const filename = path.basename(item.src.split("?")[0]);
  const full = path.join(bannersDir, filename);
  if (full.startsWith(bannersDir) && fs.existsSync(full) && filename !== "config.json") {
    fs.unlinkSync(full);
  }
  cfg.items = cfg.items
    .filter((i) => i.id !== item.id)
    .map((i, idx) => ({ ...i, order: idx }));
  saveAndNotify(cfg);
  res.json({ status: "ok", data: responsePayload(cfg) });
}

export default router;
