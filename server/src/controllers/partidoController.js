import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../prismaClient.js";
import { notifyPartido, notifyLista } from "../routes/sseRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "..", "uploads");

const partidoInclude = {
  equipo1: true,
  equipo2: true,
  configuracion: true,
  estado: true,
};

const CODIGO_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function nuevoCodigo(len = 7) {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODIGO_ALPHABET[crypto.randomInt(CODIGO_ALPHABET.length)];
  }
  return out;
}

async function codigoLibre() {
  for (let i = 0; i < 10; i++) {
    const codigo = nuevoCodigo();
    const exists = await prisma.partido.findUnique({ where: { codigo }, select: { id: true } });
    if (!exists) return codigo;
  }
  return nuevoCodigo(10);
}

/** Partidos creados antes de los links compartibles no tienen código. */
export async function ensureCodigos() {
  const sinCodigo = await prisma.partido.findMany({
    where: { codigo: null },
    select: { id: true },
  });
  for (const p of sinCodigo) {
    await prisma.partido.update({ where: { id: p.id }, data: { codigo: await codigoLibre() } });
  }
  if (sinCodigo.length) console.log(`Códigos generados para ${sinCodigo.length} partidos`);
}

function parseJSON(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function equipoJSON(eq, defColor) {
  return {
    jugador1: eq?.jugador1 || "",
    jugador2: eq?.jugador2 || "",
    color: eq?.color || defColor,
  };
}

function estadoToJSON(partido) {
  if (!partido) return null;
  const estado = partido.estado;
  const config = partido.configuracion;
  return {
    id: partido.id,
    codigo: partido.codigo,
    torneo: partido.torneo || "",
    cancha: partido.cancha || "",
    version: estado?.version ?? 0,
    finalizado: Boolean(partido.finalizado),
    equipo1: equipoJSON(partido.equipo1, "#17A2B8"),
    equipo2: equipoJSON(partido.equipo2, "#28A745"),
    puntos: {
      game: [estado?.gameEquipo1 || 0, estado?.gameEquipo2 || 0],
      sets: parseJSON(estado?.setsJSON, [[0, 0], [0, 0], [0, 0]]),
      set: estado?.setActual || 1,
      ultimoPunto: estado?.ultimoPunto || 4,
      ultimoGame: estado?.ultimoGame || 6,
      puntoOro: config?.puntoOro || false,
      ultimoPuntoTieBreak: config?.ultimoPuntoTieBreak || 100,
      ultimoSetTieBreak: config?.ultimoSetTieBreak || false,
      ultimoGameSuperTB: config?.ultimoGameSuperTB || 100,
    },
    juego: {
      servicio: estado?.servicioActual || 0,
      orden: parseJSON(estado?.ordenServicios, [0, 2, 1, 3]),
      posServ: estado?.posicionServicio || 0,
      tiebreak: estado?.tiebreak || false,
      equipoGanador: partido.equipoGanador || "",
      inicio: partido.inicio ? new Date(partido.inicio).getTime() : Date.now(),
      cantidadSets: String(config?.cantidadSets || 3),
      gamesporset: config?.gamesPorSet || 6,
      etapa: partido.etapa || "",
      tiempoTranscurridoAlFinalizar: Number(estado?.tiempoFinalMs || 0) || null,
    },
    calentamiento: {
      activo: estado?.calentamientoActivo || false,
      fin: Number(estado?.calentamientoFin || 0),
    },
    descanso: {
      activo: estado?.descansoActivo || false,
      segundos: estado?.descansoSegundos || 0,
      fin: Number(estado?.descansoFin || 0),
    },
    pantalla_actual: estado?.pantallaActual || "",
  };
}

function resumenPartido(p) {
  const now = Date.now();
  const calentamiento =
    p.estado?.calentamientoActivo && Number(p.estado.calentamientoFin || 0) > now;
  const descanso = p.estado?.descansoActivo && Number(p.estado.descansoFin || 0) > now;

  let status = "en_juego";
  if (p.finalizado) status = "finalizado";
  else if (calentamiento) status = "calentamiento";
  else if (descanso) status = "descanso";

  return {
    id: p.id,
    codigo: p.codigo,
    torneo: p.torneo || "",
    cancha: p.cancha || "",
    etapa: p.etapa,
    finalizado: p.finalizado,
    status,
    inicio: p.inicio,
    updatedAt: p.updatedAt,
    equipo1: equipoJSON(p.equipo1, "#17A2B8"),
    equipo2: equipoJSON(p.equipo2, "#28A745"),
    sets: parseJSON(p.estado?.setsJSON, [[0, 0]]),
    set: p.estado?.setActual || 1,
    game: [p.estado?.gameEquipo1 || 0, p.estado?.gameEquipo2 || 0],
    tiebreak: Boolean(p.estado?.tiebreak),
    equipoGanador: p.equipoGanador || "",
  };
}

function parseId(req) {
  const id = parseInt(req.params.id, 10);
  return Number.isFinite(id) ? id : null;
}

async function loadPartido(id) {
  return prisma.partido.findUnique({ where: { id }, include: partidoInclude });
}

/** Avisa al tablero/controles del partido y a los paneles de gestión. */
async function broadcast(id) {
  const partido = await loadPartido(id);
  if (!partido) return null;
  const data = estadoToJSON(partido);
  notifyPartido(id, { type: "estado", data });
  notifyLista({ type: "partido", data: resumenPartido(partido) });
  return data;
}

function sendError(res, error, where) {
  console.error(`Error ${where}:`, error);
  res.status(500).json({ status: "error", message: error.message });
}

function notFound(res) {
  return res.status(404).json({ status: "error", message: "Partido no encontrado" });
}

export async function getTableroPublico(req, res) {
  try {
    const partido = await prisma.partido.findUnique({
      where: { codigo: String(req.params.codigo) },
      include: partidoInclude,
    });
    if (!partido) return notFound(res);
    res.json({ status: "ok", data: estadoToJSON(partido) });
  } catch (error) {
    sendError(res, error, "getTableroPublico");
  }
}

export async function getPartido(req, res) {
  try {
    const id = parseId(req);
    const partido = id ? await loadPartido(id) : null;
    if (!partido) return notFound(res);
    res.json({ status: "ok", data: estadoToJSON(partido) });
  } catch (error) {
    sendError(res, error, "getPartido");
  }
}

export async function listarPartidos(req, res) {
  try {
    const filtro = String(req.query.estado || "todos");
    const where =
      filtro === "en_curso"
        ? { finalizado: false }
        : filtro === "finalizados"
          ? { finalizado: true }
          : {};
    const partidos = await prisma.partido.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { equipo1: true, equipo2: true, estado: true },
    });
    res.json({ status: "ok", data: partidos.map(resumenPartido) });
  } catch (error) {
    sendError(res, error, "listarPartidos");
  }
}

export async function crearPartido(req, res) {
  try {
    const { equipo1, equipo2, configuracion, etapa, torneo, cancha } = req.body || {};

    const cantidadSets = Math.min(Math.max(parseInt(configuracion?.cantidadSets, 10) || 3, 1), 5);
    const gamesPorSet = parseInt(configuracion?.gamesPorSet, 10) || 6;
    const setsArray = Array.from({ length: cantidadSets }, () => [0, 0]);

    const eq1 = await prisma.equipo.create({ data: equipoJSON(equipo1, "#17A2B8") });
    const eq2 = await prisma.equipo.create({ data: equipoJSON(equipo2, "#28A745") });

    const partido = await prisma.partido.create({
      data: {
        codigo: await codigoLibre(),
        torneo: String(torneo || "").slice(0, 80),
        cancha: String(cancha || "").slice(0, 40),
        etapa: String(etapa || "").slice(0, 60),
        equipo1Id: eq1.id,
        equipo2Id: eq2.id,
        configuracion: {
          create: {
            cantidadSets,
            gamesPorSet,
            puntoOro: Boolean(configuracion?.puntoOro),
            ultimoPuntoTieBreak: configuracion?.ultimoPuntoTieBreak || 100,
            ultimoSetTieBreak: Boolean(configuracion?.ultimoSetTieBreak),
            ultimoGameSuperTB: configuracion?.ultimoGameSuperTB || 100,
          },
        },
        estado: {
          create: {
            setsJSON: JSON.stringify(setsArray),
            ultimoGame: gamesPorSet,
          },
        },
      },
      include: partidoInclude,
    });

    notifyLista({ type: "partido", data: resumenPartido(partido) });
    res.json({ status: "ok", data: estadoToJSON(partido) });
  } catch (error) {
    sendError(res, error, "crearPartido");
  }
}

/** Datos del partido que no son el marcador: torneo, cancha, instancia, nombres. */
export async function editarPartido(req, res) {
  try {
    const id = parseId(req);
    const partido = id ? await loadPartido(id) : null;
    if (!partido) return notFound(res);

    const { torneo, cancha, etapa, equipo1, equipo2 } = req.body || {};
    const data = {};
    if (torneo !== undefined) data.torneo = String(torneo).slice(0, 80);
    if (cancha !== undefined) data.cancha = String(cancha).slice(0, 40);
    if (etapa !== undefined) data.etapa = String(etapa).slice(0, 60);
    if (Object.keys(data).length) {
      await prisma.partido.update({ where: { id }, data });
    }
    if (equipo1) {
      await prisma.equipo.update({
        where: { id: partido.equipo1Id },
        data: equipoJSON({ ...partido.equipo1, ...equipo1 }, "#17A2B8"),
      });
    }
    if (equipo2) {
      await prisma.equipo.update({
        where: { id: partido.equipo2Id },
        data: equipoJSON({ ...partido.equipo2, ...equipo2 }, "#28A745"),
      });
    }
    await prisma.estadoPartido.update({
      where: { partidoId: id },
      data: { version: { increment: 1 } },
    });

    res.json({ status: "ok", data: await broadcast(id) });
  } catch (error) {
    sendError(res, error, "editarPartido");
  }
}

export async function eliminarPartido(req, res) {
  try {
    const id = parseId(req);
    const partido = id ? await loadPartido(id) : null;
    if (!partido) return notFound(res);

    await prisma.partido.delete({ where: { id } });
    await prisma.equipo.deleteMany({ where: { id: { in: [partido.equipo1Id, partido.equipo2Id] } } });
    removeUploadIfUnused(partido.estado?.pantallaActual);

    notifyPartido(id, { type: "eliminado", data: { id } });
    notifyLista({ type: "eliminado", data: { id } });
    res.json({ status: "ok" });
  } catch (error) {
    sendError(res, error, "eliminarPartido");
  }
}

function conflict(res, partido) {
  return res.status(409).json({
    status: "conflict",
    message: "Otro dispositivo actualizó este partido. Se cargó el marcador actual.",
    data: estadoToJSON(partido),
  });
}

export async function actualizarEstado(req, res) {
  try {
    const id = parseId(req);
    const partido = id ? await loadPartido(id) : null;
    if (!partido) return notFound(res);

    const estadoData = req.body || {};
    const actual = partido.estado;
    const baseVersion = Number.isInteger(estadoData.version) ? estadoData.version : actual.version;

    const result = await prisma.estadoPartido.updateMany({
      where: { partidoId: id, version: baseVersion },
      data: {
        gameEquipo1: estadoData.puntos?.game?.[0] ?? actual.gameEquipo1,
        gameEquipo2: estadoData.puntos?.game?.[1] ?? actual.gameEquipo2,
        setsJSON: estadoData.puntos?.sets
          ? JSON.stringify(estadoData.puntos.sets)
          : actual.setsJSON,
        setActual: estadoData.puntos?.set ?? actual.setActual,
        ultimoPunto: estadoData.puntos?.ultimoPunto ?? actual.ultimoPunto,
        ultimoGame: estadoData.puntos?.ultimoGame ?? actual.ultimoGame,
        servicioActual: estadoData.juego?.servicio ?? actual.servicioActual,
        ordenServicios: estadoData.juego?.orden
          ? JSON.stringify(estadoData.juego.orden)
          : actual.ordenServicios,
        posicionServicio: estadoData.juego?.posServ ?? actual.posicionServicio,
        tiebreak: estadoData.juego?.tiebreak ?? actual.tiebreak,
        calentamientoActivo: estadoData.calentamiento?.activo ?? actual.calentamientoActivo,
        calentamientoFin:
          estadoData.calentamiento?.fin != null
            ? BigInt(estadoData.calentamiento.fin)
            : actual.calentamientoFin,
        descansoActivo: estadoData.descanso?.activo ?? actual.descansoActivo,
        descansoSegundos: estadoData.descanso?.segundos ?? actual.descansoSegundos,
        descansoFin:
          estadoData.descanso?.fin != null ? BigInt(estadoData.descanso.fin) : actual.descansoFin,
        tiempoFinalMs:
          estadoData.juego?.tiempoTranscurridoAlFinalizar != null
            ? BigInt(estadoData.juego.tiempoTranscurridoAlFinalizar)
            : actual.tiempoFinalMs,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      return conflict(res, await loadPartido(id));
    }

    await prisma.historialAccion.create({
      data: { partidoId: id, estadoJSON: JSON.stringify(estadoToJSON(partido)) },
    });
    const extras = await prisma.historialAccion.findMany({
      where: { partidoId: id },
      orderBy: { timestamp: "desc" },
      skip: 80,
      select: { id: true },
    });
    if (extras.length) {
      await prisma.historialAccion.deleteMany({ where: { id: { in: extras.map((e) => e.id) } } });
    }

    const partidoData = {};
    if (estadoData.juego?.equipoGanador !== undefined) {
      partidoData.equipoGanador = estadoData.juego.equipoGanador;
      partidoData.finalizado = estadoData.juego.equipoGanador !== "";
    }
    // Toca updatedAt para que el partido suba en la lista de gestión
    await prisma.partido.update({ where: { id }, data: partidoData });

    res.json({ status: "ok", data: await broadcast(id) });
  } catch (error) {
    sendError(res, error, "actualizarEstado");
  }
}

export async function deshacerAccion(req, res) {
  try {
    const id = parseId(req);
    const partido = id
      ? await prisma.partido.findUnique({
          where: { id },
          include: { ...partidoInclude, historial: { orderBy: { id: "desc" }, take: 1 } },
        })
      : null;
    if (!partido) return notFound(res);

    if (!partido.historial?.length) {
      return res.json({
        status: "ok",
        message: "No hay acciones para deshacer",
        data: estadoToJSON(partido),
      });
    }

    const ultimaAccion = partido.historial[0];
    const previo = JSON.parse(ultimaAccion.estadoJSON);
    await prisma.historialAccion.delete({ where: { id: ultimaAccion.id } });

    await prisma.estadoPartido.update({
      where: { partidoId: id },
      data: {
        gameEquipo1: previo.puntos?.game?.[0] ?? 0,
        gameEquipo2: previo.puntos?.game?.[1] ?? 0,
        setsJSON: previo.puntos?.sets
          ? JSON.stringify(previo.puntos.sets)
          : partido.estado.setsJSON,
        setActual: previo.puntos?.set ?? 1,
        ultimoPunto: previo.puntos?.ultimoPunto ?? 4,
        ultimoGame: previo.puntos?.ultimoGame ?? 6,
        servicioActual: previo.juego?.servicio ?? 0,
        ordenServicios: previo.juego?.orden ? JSON.stringify(previo.juego.orden) : "[0,2,1,3]",
        posicionServicio: previo.juego?.posServ ?? 0,
        tiebreak: previo.juego?.tiebreak ?? false,
        calentamientoActivo: previo.calentamiento?.activo ?? false,
        calentamientoFin: BigInt(previo.calentamiento?.fin || 0),
        descansoActivo: previo.descanso?.activo ?? false,
        descansoSegundos: previo.descanso?.segundos ?? 0,
        descansoFin: BigInt(previo.descanso?.fin || 0),
        tiempoFinalMs: BigInt(previo.juego?.tiempoTranscurridoAlFinalizar || 0),
        version: { increment: 1 },
      },
    });

    await prisma.partido.update({
      where: { id },
      data: {
        equipoGanador: previo.juego?.equipoGanador || "",
        finalizado: Boolean(previo.juego?.equipoGanador),
      },
    });

    res.json({ status: "ok", data: await broadcast(id) });
  } catch (error) {
    sendError(res, error, "deshacerAccion");
  }
}

export async function getHistorial(req, res) {
  try {
    const id = parseId(req);
    if (!id) return notFound(res);
    const historial = await prisma.historialAccion.findMany({
      where: { partidoId: id },
      orderBy: { id: "desc" },
    });
    res.json({ status: "ok", data: historial });
  } catch (error) {
    sendError(res, error, "getHistorial");
  }
}

async function patchEstado(req, res, data, where) {
  try {
    const id = parseId(req);
    const exists = id
      ? await prisma.estadoPartido.findUnique({ where: { partidoId: id }, select: { id: true } })
      : null;
    if (!exists) return notFound(res);
    await prisma.estadoPartido.update({
      where: { partidoId: id },
      data: { ...data, version: { increment: 1 } },
    });
    res.json({ status: "ok", data: await broadcast(id) });
  } catch (error) {
    sendError(res, error, where);
  }
}

export function setCalentamiento(req, res) {
  const { activo, fin } = req.body || {};
  return patchEstado(
    req,
    res,
    { calentamientoActivo: Boolean(activo), calentamientoFin: BigInt(fin || 0) },
    "setCalentamiento"
  );
}

export function setDescanso(req, res) {
  const { activo, segundos, fin } = req.body || {};
  return patchEstado(
    req,
    res,
    {
      descansoActivo: Boolean(activo),
      descansoSegundos: Number(segundos) || 0,
      descansoFin: BigInt(fin || 0),
    },
    "setDescanso"
  );
}

function removeUploadIfUnused(url) {
  if (!url || !url.startsWith("/uploads/pantalla-")) return;
  const filename = path.basename(url.split("?")[0]);
  prisma.estadoPartido
    .count({ where: { pantallaActual: { contains: filename } } })
    .then((enUso) => {
      if (enUso > 0) return;
      const full = path.join(uploadsDir, filename);
      if (full.startsWith(uploadsDir) && fs.existsSync(full)) fs.unlinkSync(full);
    })
    .catch(() => {});
}

export async function applyPantallaUrl(id, pantalla) {
  const estado = await prisma.estadoPartido.findUnique({ where: { partidoId: id } });
  if (!estado) return { ok: false, error: "Partido no encontrado" };

  await prisma.estadoPartido.update({
    where: { partidoId: id },
    data: { pantallaActual: pantalla ?? "", version: { increment: 1 } },
  });
  if (estado.pantallaActual && estado.pantallaActual !== pantalla) {
    removeUploadIfUnused(estado.pantallaActual);
  }
  const data = await broadcast(id);
  return { ok: true, data };
}

export async function setPantalla(req, res) {
  try {
    const id = parseId(req);
    if (!id) return notFound(res);
    const pantalla = String(req.body?.pantalla ?? "");
    const result = await applyPantallaUrl(id, pantalla);
    if (!result.ok) return res.status(404).json({ status: "error", message: result.error });
    res.json({ status: "ok", url: pantalla, data: result.data });
  } catch (error) {
    sendError(res, error, "setPantalla");
  }
}

export { estadoToJSON };
