import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { usePartido } from "../context/PartidoContext.jsx";
import BannerCarousel from "../components/BannerCarousel.jsx";
import MediaRotator from "../components/MediaRotator.jsx";

const PUNTOS_GAME = [0, 15, 30, 40, "Ad"];
const DEFAULT_BOARD_BG = "/assets/score_pantalla-1.jpg";

export default function Tablero() {
  const { partido, loading } = usePartido();
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState("00:00:00");
  const [mostrarCalentamiento, setMostrarCalentamiento] = useState(false);
  const [mostrarDescanso, setMostrarDescanso] = useState(false);
  const [relojCalentamiento, setRelojCalentamiento] = useState("05:00");
  const [relojDescanso, setRelojDescanso] = useState("00:00");

  useEffect(() => {
    const interval = setInterval(() => {
      if (partido?.juego?.inicio) {
        if (partido.juego.equipoGanador === "") {
          setTiempoTranscurrido(msToTime(Date.now() - partido.juego.inicio));
        } else if (partido.juego.tiempoTranscurridoAlFinalizar != null) {
          setTiempoTranscurrido(
            msToTime(partido.juego.tiempoTranscurridoAlFinalizar)
          );
        }
      }

      if (partido?.calentamiento?.activo && partido.calentamiento.fin > Date.now()) {
        const diff = Math.max(0, partido.calentamiento.fin - Date.now());
        setMostrarCalentamiento(true);
        const totalSeg = Math.floor(diff / 1000);
        const min = Math.floor(totalSeg / 60);
        const seg = totalSeg % 60;
        setRelojCalentamiento(
          `${min.toString().padStart(2, "0")}:${seg.toString().padStart(2, "0")}`
        );
      } else {
        setMostrarCalentamiento(false);
      }

      if (partido?.descanso?.activo && partido.descanso.fin > Date.now()) {
        const diff = Math.max(0, partido.descanso.fin - Date.now());
        setMostrarDescanso(true);
        const totalSeg = Math.floor(diff / 1000);
        const min = Math.floor(totalSeg / 60);
        const seg = totalSeg % 60;
        setRelojDescanso(
          `${min.toString().padStart(2, "0")}:${seg.toString().padStart(2, "0")}`
        );
      } else {
        setMostrarDescanso(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [partido]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-2xl">Cargando tablero...</p>
      </div>
    );
  }

  if (!partido) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "#000",
          color: "#fff",
        }}
      >
        <div id="main-layout">
          <div id="board-container">
            <div id="board" className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-bold mb-4">Esperando partido...</p>
                <p className="text-xl text-gray-400">
                  Crea un partido desde el panel de control
                </p>
              </div>
            </div>
          </div>
          <BannerCarousel />
        </div>
      </div>
    );
  }

  if (mostrarCalentamiento) {
    return (
      <CalentamientoScreen reloj={relojCalentamiento} partido={partido} />
    );
  }

  if (mostrarDescanso) {
    return <DescansoScreen reloj={relojDescanso} partido={partido} />;
  }

  const esSuperTieBreak =
    partido.puntos.ultimoSetTieBreak &&
    partido.puntos.set === parseInt(partido.juego.cantidadSets);

  const usarPuntosGame = !partido.juego.tiebreak && !esSuperTieBreak;

  let punto1 = usarPuntosGame
    ? PUNTOS_GAME[partido.puntos.game[0]]
    : partido.puntos.game[0];
  let punto2 = usarPuntosGame
    ? PUNTOS_GAME[partido.puntos.game[1]]
    : partido.puntos.game[1];

  const highlightAd = { backgroundColor: "#FFC107", color: "#37363D" };
  const stylePuntaje1 = {};
  const stylePuntaje2 = {};

  if (punto1 === "Ad") {
    Object.assign(stylePuntaje1, highlightAd);
    punto2 = 40;
  } else if (punto2 === "Ad") {
    Object.assign(stylePuntaje2, highlightAd);
    punto1 = 40;
  } else if (partido.puntos.puntoOro && punto1 === 40 && punto2 === 40) {
    Object.assign(stylePuntaje1, highlightAd);
    Object.assign(stylePuntaje2, highlightAd);
  }

  const servicio = partido.juego.servicio;
  const sets = partido.puntos.sets || [];
  const setActual = partido.puntos.set || 1;
  const hasCustomBg = Boolean(partido.pantalla_actual);
  const boardBg = partido.pantalla_actual || DEFAULT_BOARD_BG;
  const boardBgCss = boardBg.includes("(") ? boardBg : boardBg.replace(/"/g, '\\"');

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#000",
        color: "#fff",
      }}
    >
      <div id="main-layout">
        <div id="board-container">
          <div
            id="board"
            className={hasCustomBg ? "board--custom-bg" : undefined}
            style={{
              ["--board-bg"]: `url("${boardBgCss}")`,
            }}
          >
            <div id="etapa">{partido.juego.etapa}</div>

            <div id="score-panel">
              <div className="team-block">
                <JugadorRow
                  id="jugador11"
                  nombre={partido.equipo1.jugador1}
                  color={partido.equipo1.color}
                  mostrandoServicio={servicio === 0}
                />
                <JugadorRow
                  id="jugador21"
                  nombre={partido.equipo1.jugador2}
                  color={partido.equipo1.color}
                  mostrandoServicio={servicio === 1}
                />
                <div
                  id="puntaje1"
                  className="score-cell score-cell--game"
                  style={stylePuntaje1}
                >
                  {punto1}
                </div>
                {sets.map((s, i) => (
                  <div
                    key={`set-top-${i}`}
                    id={`set${i + 1}1`}
                    className={`score-cell score-cell--set${
                      i + 1 === setActual ? " score-cell--set-current" : ""
                    }`}
                  >
                    {s[0]}
                  </div>
                ))}
              </div>

              <div className="clock-row">
                <div id="reloj">{tiempoTranscurrido}</div>
              </div>

              <div className="team-block">
                <JugadorRow
                  id="jugador12"
                  nombre={partido.equipo2.jugador1}
                  color={partido.equipo2.color}
                  mostrandoServicio={servicio === 2}
                />
                <JugadorRow
                  id="jugador22"
                  nombre={partido.equipo2.jugador2}
                  color={partido.equipo2.color}
                  mostrandoServicio={servicio === 3}
                />
                <div
                  id="puntaje2"
                  className="score-cell score-cell--game"
                  style={stylePuntaje2}
                >
                  {punto2}
                </div>
                {sets.map((s, i) => (
                  <div
                    key={`set-bot-${i}`}
                    id={`set${i + 1}2`}
                    className={`score-cell score-cell--set${
                      i + 1 === setActual ? " score-cell--set-current" : ""
                    }`}
                  >
                    {s[1]}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <BannerCarousel />
      </div>

      {partido.juego.equipoGanador && (
        <div
          id="cartel"
          className="cartel-ganador"
          style={{
            textAlign: "center",
            fontSize: "4vw",
            padding: "2vh",
            color: "white",
            position: "absolute",
            top: "2vh",
            width: "76vw",
            height: "22vh",
            borderRadius: "7px",
            boxShadow: "10px 5px 5px gray",
            marginLeft: "12vw",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div>Ganadores</div>
          <div>
            {partido[partido.juego.equipoGanador].jugador1} -{" "}
            {partido[partido.juego.equipoGanador].jugador2}
          </div>
        </div>
      )}
    </div>
  );
}

function JugadorRow({ id, nombre, color, mostrandoServicio }) {
  const rowRef = useRef(null);
  const nameRef = useRef(null);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const nameEl = nameRef.current;
    if (!row || !nameEl) return;

    const fit = () => {
      nameEl.style.fontSize = "";
      let scale = 1;
      while (nameEl.scrollWidth > nameEl.clientWidth && scale > 0.55) {
        scale -= 0.05;
        nameEl.style.fontSize = `calc(clamp(0.85rem, 2.2vmin, 2.2rem) * ${scale})`;
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(row);
    return () => ro.disconnect();
  }, [nombre]);

  return (
    <div
      ref={rowRef}
      id={id}
      className="name-cell"
      style={{
        backgroundImage: `linear-gradient(165deg, transparent 55%, ${color})`,
      }}
    >
      <span ref={nameRef} className="name-text" title={nombre}>
        {nombre}
      </span>
      <span
        className="ball-indicator"
        style={{ visibility: mostrandoServicio ? "visible" : "hidden" }}
        aria-hidden={!mostrandoServicio}
      />
    </div>
  );
}

function CalentamientoScreen({ reloj, partido }) {
  return (
    <div
      className="flex flex-col text-white"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundImage: "url('/assets/background_calentamiento.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="h-[12vh] max-h-[110px] flex items-center justify-center shrink-0 pt-2">
        <img
          src="/assets/logo_torneo.png"
          alt="Logo"
          className="max-h-full max-w-[80%] object-contain"
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 gap-2 overflow-hidden">
        <div className="jugadores bg-black/40 px-5 py-3 rounded-xl text-center text-xl sm:text-2xl font-bold">
          {partido.equipo1.jugador1} / {partido.equipo1.jugador2}
        </div>
        <div className="text-3xl font-bold text-yellow-500">VS</div>
        <div className="jugadores bg-black/40 px-5 py-3 rounded-xl text-center text-xl sm:text-2xl font-bold">
          {partido.equipo2.jugador1} / {partido.equipo2.jugador2}
        </div>
        <div className="mt-1 flex justify-center items-center max-h-[22vh] overflow-hidden">
          <MediaRotator />
        </div>
      </div>

      <div className="barra-inferior bg-black/70 px-4 py-4 sm:py-6 text-center shrink-0">
        <div className="text-lg sm:text-2xl font-semibold mb-1">Calentamiento</div>
        <div className="text-[clamp(3.5rem,14vh,8rem)] font-black tracking-wider leading-none">
          {reloj}
        </div>
      </div>
    </div>
  );
}

function DescansoScreen({ reloj, partido }) {
  return (
    <div
      className="flex flex-col text-white"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundImage: "url('/assets/background_calentamiento.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 gap-2 overflow-hidden">
        <div className="jugadores bg-black/40 px-5 py-3 rounded-xl text-center text-xl sm:text-2xl font-bold">
          {partido.equipo1.jugador1} / {partido.equipo1.jugador2}
        </div>
        <div className="text-3xl font-bold text-yellow-500">VS</div>
        <div className="jugadores bg-black/40 px-5 py-3 rounded-xl text-center text-xl sm:text-2xl font-bold">
          {partido.equipo2.jugador1} / {partido.equipo2.jugador2}
        </div>
        <div className="mt-1 flex justify-center items-center max-h-[22vh] overflow-hidden">
          <MediaRotator />
        </div>
      </div>

      <div className="barra-inferior bg-black/70 px-4 py-4 sm:py-6 text-center shrink-0">
        <div className="text-lg sm:text-2xl font-semibold mb-1">Descanso</div>
        <div className="text-[clamp(3.5rem,14vh,8rem)] font-black tracking-wider leading-none">
          {reloj}
        </div>
      </div>
    </div>
  );
}

function msToTime(s) {
  const ms = s % 1000;
  s = (s - ms) / 1000;
  const secs = s % 60;
  s = (s - secs) / 60;
  const mins = s % 60;
  const hrs = (s - mins) / 60;
  return (
    String(hrs).padStart(2, "0") +
    ":" +
    String(mins).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );
}
