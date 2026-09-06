import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  getPartidoActual,
  crearPartido,
  actualizarEstado,
  deshacerAccion,
  getHistorial,
  setCalentamiento,
  setDescanso,
  setPantalla,
  applyPantallaUrl,
  listarPartidos,
  activarPartido,
} from "../controllers/partidoController.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `pantalla-${Date.now()}${ext}`);
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

router.get("/actual", getPartidoActual);
router.get("/lista", listarPartidos);
router.put("/:id/activar", activarPartido);
router.post("/crear", crearPartido);
router.put("/estado", actualizarEstado);
router.post("/deshacer", deshacerAccion);
router.get("/historial", getHistorial);
router.put("/calentamiento", setCalentamiento);
router.put("/descanso", setDescanso);
router.put("/pantalla", setPantalla);

router.post("/upload-pantalla", (req, res) => {
  upload.single("imagen")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ status: "error", message: err.message || "Error al subir" });
    }
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Sin archivo" });
    }
    const url = `/uploads/${req.file.filename}?t=${Date.now()}`;
    try {
      const result = await applyPantallaUrl(url);
      if (!result.ok) {
        return res.status(404).json({ status: "error", message: result.error, url });
      }
      res.json({ status: "ok", url, applied: true });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });
});

export default router;
