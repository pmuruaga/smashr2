import { Router } from "express";
import { prisma } from "../prismaClient.js";
import { requireAdmin } from "../auth.js";

export const sseRouter = Router();

/** partidoId -> Set<res> (tableros y controles de ese partido) */
const partidoClients = new Map();
/** Paneles de gestión: reciben cambios de cualquier partido */
const listaClients = new Set();

const HEARTBEAT_MS = 25000;

function write(res, msg) {
  try {
    res.write(`data: ${JSON.stringify(msg)}\n\n`);
  } catch {
    /* conexión cerrada */
  }
}

function openStream(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  write(res, { type: "connected" });
  const hb = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      /* ignore */
    }
  }, HEARTBEAT_MS);
  req.on("close", () => clearInterval(hb));
}

export function notifyPartido(partidoId, msg) {
  const set = partidoClients.get(partidoId);
  if (set) for (const res of set) write(res, msg);
}

export function notifyLista(msg) {
  for (const res of listaClients) write(res, msg);
}

export function notifyEverywhere(msg) {
  notifyLista(msg);
  for (const set of partidoClients.values()) {
    for (const res of set) write(res, msg);
  }
}

sseRouter.get("/partido/:codigo", async (req, res) => {
  const partido = await prisma.partido.findUnique({
    where: { codigo: String(req.params.codigo) },
    select: { id: true },
  });
  if (!partido) {
    return res.status(404).json({ status: "error", message: "Partido no encontrado" });
  }
  openStream(req, res);
  let set = partidoClients.get(partido.id);
  if (!set) {
    set = new Set();
    partidoClients.set(partido.id, set);
  }
  set.add(res);
  req.on("close", () => {
    set.delete(res);
    if (set.size === 0) partidoClients.delete(partido.id);
  });
});

sseRouter.get("/lista", requireAdmin, (req, res) => {
  openStream(req, res);
  listaClients.add(res);
  req.on("close", () => listaClients.delete(res));
});
