import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { requireAdmin } from "../auth.js";
import {
  getPartido,
  listarPartidos,
  crearPartido,
  editarPartido,
  eliminarPartido,
  actualizarEstado,
  deshacerAccion,
  getHistorial,
  setCalentamiento,
  setDescanso,
  setPantalla,
  applyPantallaUrl,
} from "../controllers/partidoController.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname) || ".jpg").toLowerCase();
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
router.use(requireAdmin);

router.get("/lista", listarPartidos);
router.post("/crear", crearPartido);
router.get("/:id", getPartido);
router.patch("/:id", editarPartido);
router.delete("/:id", eliminarPartido);
router.put("/:id/estado", actualizarEstado);
router.post("/:id/deshacer", deshacerAccion);
router.get("/:id/historial", getHistorial);
router.put("/:id/calentamiento", setCalentamiento);
router.put("/:id/descanso", setDescanso);
router.put("/:id/pantalla", setPantalla);

router.post("/:id/upload-pantalla", (req, res) => {
  const id = parseInt(req.params.id, 10);
  upload.single("imagen")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ status: "error", message: err.message || "Error al subir" });
    }
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Sin archivo" });
    }
    const url = `/uploads/${req.file.filename}`;
    try {
      const result = Number.isFinite(id) ? await applyPantallaUrl(id, url) : { ok: false };
      if (!result.ok) {
        fs.unlink(req.file.path, () => {});
        return res.status(404).json({ status: "error", message: "Partido no encontrado" });
      }
      res.json({ status: "ok", url, applied: true, data: result.data });
    } catch (error) {
      res.status(500).json({ status: "error", message: error.message });
    }
  });
});

export default router;
