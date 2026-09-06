import { useCallback, useRef } from "react";
import { api } from "../services/api.js";

const PUNTOS_GAME = [0, 15, 30, 40, "Ad"];

export function useScoring(partido, actualizarEstado, onEstadoRemoto) {
  const accionesRef = useRef([]);

  const guardarHistorial = useCallback(() => {
    if (partido) {
      accionesRef.current.push(JSON.stringify(partido));
    }
  }, [partido]);

  const deshacer = useCallback(async () => {
    try {
      const res = await api.deshacerAccion();
      if (res?.data) {
        if (accionesRef.current.length > 0) accionesRef.current.pop();
        onEstadoRemoto?.(res.data);
        return res.data;
      }
    } catch {
      /* fallback local */
    }
    if (accionesRef.current.length < 1) return null;
    const estadoAnterior = JSON.parse(accionesRef.current.pop());
    await actualizarEstado(estadoAnterior);
    return estadoAnterior;
  }, [actualizarEstado, onEstadoRemoto]);

  const sumarPunto = useCallback(
    (equipo) => {
      if (!partido) return;
      if (partido.juego.equipoGanador !== "") return;

      guardarHistorial();

      const datos = JSON.parse(JSON.stringify(partido));
      if (datos.calentamiento?.activo) {
        datos.calentamiento = { activo: false, fin: 0 };
      }
      const equipoIndex = equipo - 1;

      const esUltimoSet =
        datos.puntos.set === parseInt(datos.juego.cantidadSets);
      const esSuperTiebreak = esUltimoSet && datos.puntos.ultimoSetTieBreak;

      if (esSuperTiebreak) {
        datos.puntos.sets[datos.puntos.set - 1][equipoIndex]++;

        const puntos1 = datos.puntos.sets[datos.puntos.set - 1][0];
        const puntos2 = datos.puntos.sets[datos.puntos.set - 1][1];
        const diferencia = Math.abs(puntos1 - puntos2);

        if (datos.puntos.ultimoGameSuperTB !== 100) {
          if (
            puntos1 === datos.puntos.ultimoGameSuperTB ||
            puntos2 === datos.puntos.ultimoGameSuperTB
          ) {
            datos.puntos.set++;
            juego_finalizado(datos);
          }
        } else {
          if ((puntos1 >= 10 || puntos2 >= 10) && diferencia >= 2) {
            datos.puntos.set++;
            juego_finalizado(datos);
          }
        }
      } else {
        datos.puntos.game[equipoIndex]++;

        if (datos.puntos.game[equipoIndex] === datos.puntos.ultimoPunto) {
          datos.puntos.game = [0, 0];
          datos.puntos.sets[datos.puntos.set - 1][equipoIndex]++;
          datos.puntos.ultimoPunto = 4;
          datos.juego.tiebreak = false;
          datos.juego.posServ = (datos.juego.posServ + 1) % 4;
          datos.juego.servicio = datos.juego.orden[datos.juego.posServ];
        }

        if (
          datos.juego.tiebreak &&
          (datos.puntos.game[0] + datos.puntos.game[1] + 1) % 2 === 0
        ) {
          datos.juego.posServ = (datos.juego.posServ + 1) % 4;
          datos.juego.servicio = datos.juego.orden[datos.juego.posServ];
        }

        if (
          !datos.puntos.puntoOro &&
          !datos.juego.tiebreak &&
          datos.puntos.ultimoPunto - datos.puntos.game[0] === 1 &&
          datos.puntos.ultimoPunto - datos.puntos.game[1] === 1
        ) {
          datos.puntos.ultimoPunto = 5;
          datos.puntos.game = [3, 3];
        }

        if (
          datos.puntos.sets[datos.puntos.set - 1][0] === 5 &&
          datos.puntos.sets[datos.puntos.set - 1][1] === 5 &&
          !(datos.puntos.ultimoSetTieBreak && esUltimoSet)
        ) {
          datos.puntos.ultimoGame = 7;
        }

        if (
          datos.puntos.sets[datos.puntos.set - 1][0] === 6 &&
          datos.puntos.sets[datos.puntos.set - 1][1] === 6 &&
          datos.puntos.game[0] === 0 &&
          datos.puntos.game[1] === 0
        ) {
          datos.puntos.ultimoPunto = 7;
          datos.juego.tiebreak = true;
        }

        if (
          datos.juego.tiebreak &&
          datos.puntos.ultimoPunto - datos.puntos.game[0] === 1 &&
          datos.puntos.ultimoPunto - datos.puntos.game[1] === 1 &&
          datos.puntos.ultimoPunto < datos.puntos.ultimoPuntoTieBreak
        ) {
          datos.puntos.ultimoPunto++;
        }

        if (
          esUltimoSet &&
          datos.puntos.ultimoSetTieBreak &&
          datos.puntos.ultimoGame - datos.puntos.sets[datos.puntos.set - 1][0] === 1 &&
          datos.puntos.ultimoGame - datos.puntos.sets[datos.puntos.set - 1][1] === 1 &&
          datos.puntos.ultimoGame < datos.puntos.ultimoGameSuperTB
        ) {
          datos.puntos.ultimoGame++;
        }

        if (
          datos.puntos.sets[datos.puntos.set - 1][0] === datos.puntos.ultimoGame ||
          datos.puntos.sets[datos.puntos.set - 1][1] === datos.puntos.ultimoGame
        ) {
          datos.puntos.set++;
          datos.puntos.ultimoGame =
            esUltimoSet && datos.puntos.ultimoSetTieBreak
              ? datos.puntos.ultimoGameSuperTB
              : 6;
          juego_finalizado(datos);
        }
      }

      actualizarEstado(datos);
    },
    [partido, actualizarEstado, guardarHistorial]
  );

  const establecerServ = useCallback(
    (jugadorIndex) => {
      if (!partido) return;
      const datos = JSON.parse(JSON.stringify(partido));
      const orden = [...datos.juego.orden];
      let pos = datos.juego.posServ;

      if (jugadorIndex === 0 && orden[pos] === 1) {
        [orden[0], orden[2]] = [orden[2], orden[0]];
      } else if (jugadorIndex === 1 && orden[pos] === 0) {
        [orden[0], orden[2]] = [orden[2], orden[0]];
      } else if (jugadorIndex === 2 && orden[pos] === 3) {
        [orden[1], orden[3]] = [orden[3], orden[1]];
      } else if (jugadorIndex === 3 && orden[pos] === 2) {
        [orden[1], orden[3]] = [orden[3], orden[1]];
      } else if (jugadorIndex === 3 && orden[pos] === 0) {
        [orden[1], orden[3]] = [orden[3], orden[1]];
        pos = (pos + 1) % 4;
      } else {
        pos = (pos + 1) % 4;
      }

      datos.juego.posServ = pos;
      datos.juego.orden = orden;
      datos.juego.servicio = orden[pos];

      actualizarEstado(datos);
    },
    [partido, actualizarEstado]
  );

  return {
    sumarPunto,
    establecerServ,
    deshacer,
    PUNTOS_GAME,
    tieneHistorial: accionesRef.current.length > 0,
  };
}

function juego_finalizado(datos) {
  const necesariosParaGanar = Math.ceil(parseInt(datos.juego.cantidadSets) / 2);
  const equipo1 = datos.puntos.sets
    .map((e) => Math.sign(e[0] - e[1]))
    .filter((f) => f === 1).length;
  const equipo2 = datos.puntos.sets
    .map((e) => Math.sign(e[0] - e[1]))
    .filter((f) => f === -1).length;

  if (equipo1 >= necesariosParaGanar) {
    datos.juego.equipoGanador = "equipo1";
    datos.juego.tiempoTranscurridoAlFinalizar =
      Date.now() - (datos.juego.inicio || Date.now());
  }
  if (equipo2 >= necesariosParaGanar) {
    datos.juego.equipoGanador = "equipo2";
    datos.juego.tiempoTranscurridoAlFinalizar =
      Date.now() - (datos.juego.inicio || Date.now());
  }
}
