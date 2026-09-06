import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import partidoRoutes from "./routes/partidoRoutes.js";
import publicidadRoutes from "./routes/publicidadRoutes.js";
import { sseRouter } from "./routes/sseRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
if (process.argv.includes("--prod")) {
  process.env.NODE_ENV = "production";
}
const isProd = process.env.NODE_ENV === "production";

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/partido", partidoRoutes);
app.use("/api/publicidad", publicidadRoutes);
app.use("/api/sse", sseRouter);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Producción: servir el build de Vite desde el mismo proceso Express
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (isProd && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
  console.log(`Serving client from ${clientDist}`);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  if (!isProd) {
    console.log("Dev mode: use Vite on :5173 (proxied /api → this server)");
  }
});
