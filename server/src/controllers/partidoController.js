import { prisma } from "../prismaClient.js";
import { notifyAllClients } from "../routes/sseRoutes.js";

const partidoInclude = {
  equipo1: true,
  equipo2: true,
  configuracion: true,
  estado: true,
};

function estadoToJSON(estado, partido, equipo1, equipo2, config) {
  if (!partido) return null;
  return {
    id: partido.id,
    activo: Boolean(partido.activo),
    finalizado: Boolean(partido.finalizado),
    equipo1: {
      jugador1: equipo1?.jugador1 || "",
      jugador2: equipo1?.jugador2 || "",
      color: equipo1?.color || "#17A2B8",
    },
    equipo2: {
      jugador1: equipo2?.jugador1 || "",
      jugador2: equipo2?.jugador2 || "",
      color: equipo2?.color || "#28A745",
    },
    puntos: {
      game: [estado?.gameEquipo1 || 0, estado?.gameEquipo2 || 0],
      sets: estado?.setsJSON ? JSON.parse(estado.setsJSON) : [[0, 0], [0, 0], [0, 0]],
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
      orden: estado?.ordenServicios ? JSON.parse(estado.ordenServicios) : [0, 2, 1, 3],
      posServ: estado?.posicionServicio || 0,
      tiebreak: estado?.tiebreak || false,
      equipoGanador: partido?.equipoGanador || "",
      inicio: partido?.inicio ? new Date(partido.inicio).getTime() : Date.now(),
      cantidadSets: String(config?.cantidadSets || 3),
      gamesporset: config?.gamesPorSet || 6,
      etapa: partido?.etapa || "Fase de Grupos",
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

async function findActivoPartido(extraInclude = {}) {
  let partido = await prisma.partido.findFirst({
    where: { activo: true },
    include: { ...partidoInclude, ...extraInclude },
  });
  if (partido) return partido;

  // Migración / datos viejos: activar el más reciente
  partido = await prisma.partido.findFirst({
    orderBy: { createdAt: "desc" },
    include: { ...partidoInclude, ...extraInclude },
  });
  if (partido && !partido.activo) {
    await prisma.partido.updateMany({ data: { activo: false } });
    await prisma.partido.update({
      where: { id: partido.id },
      data: { activo: true },
    });
    partido = await prisma.partido.findFirst({
      where: { id: partido.id },
      include: { ...partidoInclude, ...extraInclude },
    });
  }
  return partido;
}

function resumenPartido(p) {
  let sets = [[0, 0]];
  try {
    sets = p.estado?.setsJSON ? JSON.parse(p.estado.setsJSON) : [[0, 0]];
  } catch {
    /* ignore */
  }
  const calentamiento =
    p.estado?.calentamientoActivo && Number(p.estado.calentamientoFin || 0) > Date.now();
  const descanso =
    p.estado?.descansoActivo && Number(p.estado.descansoFin || 0) > Date.now();

  let status = "en_juego";
  if (p.finalizado) status = "finalizado";
  else if (calentamiento) status = "calentamiento";
  else if (descanso) status = "descanso";

  return {
    id: p.id,
    etapa: p.etapa,
    activo: p.activo,
    finalizado: p.finalizado,
    status,
    inicio: p.inicio,
    updatedAt: p.updatedAt,
    equipo1: {
      jugador1: p.equipo1?.jugador1 || "",
      jugador2: p.equipo1?.jugador2 || "",
      color: p.equipo1?.color || "#17A2B8",
    },
    equipo2: {
      jugador1: p.equipo2?.jugador1 || "",
      jugador2: p.equipo2?.jugador2 || "",
      color: p.equipo2?.color || "#28A745",
    },
    sets,
    game: [p.estado?.gameEquipo1 || 0, p.estado?.gameEquipo2 || 0],
    equipoGanador: p.equipoGanador || "",
  };
}

export async function getPartidoActual(req, res) {
  try {
    const partido = await findActivoPartido();
    if (!partido) {
      return res.json({ status: "ok", data: null });
    }
    const data = estadoToJSON(
      partido.estado,
      partido,
      partido.equipo1,
      partido.equipo2,
      partido.configuracion
    );
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("Error getPartidoActual:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}

export async function listarPartidos(req, res) {
  try {
    const partidos = await prisma.partido.findMany({
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: {
        equipo1: true,
        equipo2: true,
        estado: true,
      },
    });
    res.json({ status: "ok", data: partidos.map(resumenPartido) });
  } catch (error) {
    console.error("Error listarPartidos:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}

export async function activarPartido(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ status: "error", message: "ID inválido" });
    }

    const exists = await prisma.partido.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ status: "error", message: "Partido no encontrado" });
    }

    await prisma.partido.updateMany({ data: { activo: false } });
    await prisma.partido.update({ where: { id }, data: { activo: true } });

    const partido = await prisma.partido.findFirst({
      where: { id },
      include: partidoInclude,
    });
    const data = estadoToJSON(
      partido.estado,
      partido,
      partido.equipo1,
      partido.equipo2,
      partido.configuracion
    );
    notifyAllClients({ type: "partido-creado", data });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("Error activarPartido:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}

export async function crearPartido(req, res) {
  try {
    const { equipo1, equipo2, configuracion, etapa } = req.body;

    const cantidadSets = configuracion?.cantidadSets || 3;
    const gamesPorSet = configuracion?.gamesPorSet || 6;
    const setsArray = Array.from({ length: cantidadSets }, () => [0, 0]);

    const eq1 = await prisma.equipo.create({
      data: {
        jugador1: equipo1?.jugador1 || "",
        jugador2: equipo1?.jugador2 || "",
        color: equipo1?.color || "#17A2B8",
      },
    });

    const eq2 = await prisma.equipo.create({
      data: {
        jugador1: equipo2?.jugador1 || "",
        jugador2: equipo2?.jugador2 || "",
        color: equipo2?.color || "#28A745",
      },
    });

    await prisma.partido.updateMany({ data: { activo: false } });

    const partido = await prisma.partido.create({
      data: {
        etapa: etapa || "Fase de Grupos",
        activo: true,
        equipo1Id: eq1.id,
        equipo2Id: eq2.id,
        configuracion: {
          create: {
            cantidadSets,
            gamesPorSet,
            puntoOro: configuracion?.puntoOro || false,
            ultimoPuntoTieBreak: configuracion?.ultimoPuntoTieBreak || 100,
            ultimoSetTieBreak: configuracion?.ultimoSetTieBreak || false,
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

    const data = estadoToJSON(
      partido.estado,
      partido,
      partido.equipo1,
      partido.equipo2,
      partido.configuracion
    );
    notifyAllClients({ type: "partido-creado", data });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("Error crearPartido:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}

export async function actualizarEstado(req, res) {
  try {
    const estadoData = req.body;
    const partido = await findActivoPartido();

    if (!partido) {
      return res.status(404).json({ status: "error", message: "No hay partido activo" });
    }

    const snapshot = estadoToJSON(
      partido.estado,
      partido,
      partido.equipo1,
      partido.equipo2,
      partido.configuracion
    );
    await prisma.historialAccion.create({
      data: {
        partidoId: partido.id,
        estadoJSON: JSON.stringify(snapshot),
      },
    });
    const extras = await prisma.historialAccion.findMany({
      where: { partidoId: partido.id },
      orderBy: { timestamp: "desc" },
      skip: 50,
    });
    if (extras.length) {
      await prisma.historialAccion.deleteMany({
        where: { id: { in: extras.map((e) => e.id) } },
      });
    }

    const setsJSON = estadoData.puntos?.sets
      ? JSON.stringify(estadoData.puntos.sets)
      : partido.estado.setsJSON;

    await prisma.estadoPartido.update({
      where: { partidoId: partido.id },
      data: {
        gameEquipo1: estadoData.puntos?.game?.[0] ?? partido.estado.gameEquipo1,
        gameEquipo2: estadoData.puntos?.game?.[1] ?? partido.estado.gameEquipo2,
        setsJSON,
        setActual: estadoData.puntos?.set ?? partido.estado.setActual,
        ultimoPunto: estadoData.puntos?.ultimoPunto ?? partido.estado.ultimoPunto,
        ultimoGame: estadoData.puntos?.ultimoGame ?? partido.estado.ultimoGame,
        servicioActual: estadoData.juego?.servicio ?? partido.estado.servicioActual,
        ordenServicios: estadoData.juego?.orden
          ? JSON.stringify(estadoData.juego.orden)
          : partido.estado.ordenServicios,
        posicionServicio: estadoData.juego?.posServ ?? partido.estado.posicionServicio,
        tiebreak: estadoData.juego?.tiebreak ?? partido.estado.tiebreak,
        pantallaActual: partido.estado.pantallaActual,
        calentamientoActivo:
          estadoData.calentamiento?.activo ?? partido.estado.calentamientoActivo,
        calentamientoFin:
          estadoData.calentamiento?.fin != null
            ? BigInt(estadoData.calentamiento.fin)
            : partido.estado.calentamientoFin,
        descansoActivo: estadoData.descanso?.activo ?? partido.estado.descansoActivo,
        descansoSegundos:
          estadoData.descanso?.segundos ?? partido.estado.descansoSegundos,
        descansoFin:
          estadoData.descanso?.fin != null
            ? BigInt(estadoData.descanso.fin)
            : partido.estado.descansoFin,
        tiempoFinalMs:
          estadoData.juego?.tiempoTranscurridoAlFinalizar != null
            ? BigInt(estadoData.juego.tiempoTranscurridoAlFinalizar)
            : partido.estado.tiempoFinalMs,
      },
    });

    if (estadoData.juego?.equipoGanador !== undefined) {
      await prisma.partido.update({
        where: { id: partido.id },
        data: {
          equipoGanador: estadoData.juego.equipoGanador,
          finalizado: estadoData.juego.equipoGanador !== "",
        },
      });
    }

    if (estadoData.equipo1) {
      await prisma.equipo.update({
        where: { id: partido.equipo1Id },
        data: {
          jugador1: estadoData.equipo1.jugador1,
          jugador2: estadoData.equipo1.jugador2,
          color: estadoData.equipo1.color,
        },
      });
    }
    if (estadoData.equipo2) {
      await prisma.equipo.update({
        where: { id: partido.equipo2Id },
        data: {
          jugador1: estadoData.equipo2.jugador1,
          jugador2: estadoData.equipo2.jugador2,
          color: estadoData.equipo2.color,
        },
      });
    }

    const updatedPartido = await findActivoPartido();
    const data = estadoToJSON(
      updatedPartido.estado,
      updatedPartido,
      updatedPartido.equipo1,
      updatedPartido.equipo2,
      updatedPartido.configuracion
    );
    notifyAllClients({ type: "estado-actualizado", data });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("Error actualizarEstado:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}

export async function deshacerAccion(req, res) {
  try {
    const partido = await findActivoPartido({
      historial: { orderBy: { timestamp: "desc" }, take: 1 },
    });

    if (!partido || !partido.historial?.length) {
      return res.json({
        status: "ok",
        message: "No hay acciones para deshacer",
        data: null,
      });
    }

    const ultimaAccion = partido.historial[0];
    const estadoPrevio = JSON.parse(ultimaAccion.estadoJSON);
    await prisma.historialAccion.delete({ where: { id: ultimaAccion.id } });

    const setsJSON = estadoPrevio.puntos?.sets
      ? JSON.stringify(estadoPrevio.puntos.sets)
      : partido.estado.setsJSON;

    await prisma.estadoPartido.update({
      where: { partidoId: partido.id },
      data: {
        gameEquipo1: estadoPrevio.puntos?.game?.[0] ?? 0,
        gameEquipo2: estadoPrevio.puntos?.game?.[1] ?? 0,
        setsJSON,
        setActual: estadoPrevio.puntos?.set ?? 1,
        ultimoPunto: estadoPrevio.puntos?.ultimoPunto ?? 4,
        ultimoGame: estadoPrevio.puntos?.ultimoGame ?? 6,
        servicioActual: estadoPrevio.juego?.servicio ?? 0,
        ordenServicios: estadoPrevio.juego?.orden
          ? JSON.stringify(estadoPrevio.juego.orden)
          : "[0,2,1,3]",
        posicionServicio: estadoPrevio.juego?.posServ ?? 0,
        tiebreak: estadoPrevio.juego?.tiebreak ?? false,
        calentamientoActivo: estadoPrevio.calentamiento?.activo ?? false,
        calentamientoFin: BigInt(estadoPrevio.calentamiento?.fin || 0),
        descansoActivo: estadoPrevio.descanso?.activo ?? false,
        descansoSegundos: estadoPrevio.descanso?.segundos ?? 0,
        descansoFin: BigInt(estadoPrevio.descanso?.fin || 0),
        tiempoFinalMs: BigInt(estadoPrevio.juego?.tiempoTranscurridoAlFinalizar || 0),
        pantallaActual: estadoPrevio.pantalla_actual ?? partido.estado.pantallaActual,
      },
    });

    await prisma.partido.update({
      where: { id: partido.id },
      data: {
        equipoGanador: estadoPrevio.juego?.equipoGanador || "",
        finalizado: !!estadoPrevio.juego?.equipoGanador,
      },
    });

    const updatedPartido = await findActivoPartido();
    const data = estadoToJSON(
      updatedPartido.estado,
      updatedPartido,
      updatedPartido.equipo1,
      updatedPartido.equipo2,
      updatedPartido.configuracion
    );

    notifyAllClients({ type: "estado-actualizado", data });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("Error deshacerAccion:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}

export async function getHistorial(req, res) {
  try {
    const partido = await findActivoPartido({
      historial: { orderBy: { timestamp: "desc" } },
    });

    if (!partido) return res.json({ status: "ok", data: [] });

    res.json({ status: "ok", data: partido.historial });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}

export async function setCalentamiento(req, res) {
  try {
    const { activo, fin } = req.body;
    const partido = await findActivoPartido();

    if (!partido) return res.status(404).json({ status: "error", message: "No hay partido" });

    await prisma.estadoPartido.update({
      where: { partidoId: partido.id },
      data: {
        calentamientoActivo: activo,
        calentamientoFin: BigInt(fin || 0),
      },
    });

    notifyAllClients({ type: "calentamiento", data: { activo, fin } });
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}

export async function setDescanso(req, res) {
  try {
    const { activo, segundos, fin } = req.body;
    const partido = await findActivoPartido();

    if (!partido) return res.status(404).json({ status: "error", message: "No hay partido" });

    await prisma.estadoPartido.update({
      where: { partidoId: partido.id },
      data: {
        descansoActivo: activo,
        descansoSegundos: segundos || 0,
        descansoFin: BigInt(fin || 0),
      },
    });

    notifyAllClients({ type: "descanso", data: { activo, segundos, fin } });
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}

export async function applyPantallaUrl(pantalla) {
  const partido = await findActivoPartido();
  if (!partido) return { ok: false, error: "No hay partido" };

  await prisma.estadoPartido.update({
    where: { partidoId: partido.id },
    data: { pantallaActual: pantalla ?? "" },
  });

  notifyAllClients({ type: "pantalla", data: { pantalla: pantalla ?? "" } });
  return { ok: true };
}

export async function setPantalla(req, res) {
  try {
    const { pantalla } = req.body;
    const result = await applyPantallaUrl(pantalla ?? "");
    if (!result.ok) {
      return res.status(404).json({ status: "error", message: result.error });
    }
    res.json({ status: "ok", url: pantalla ?? "" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
}

export { estadoToJSON };
