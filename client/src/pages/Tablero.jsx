import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Maximize, Minimize } from "lucide-react";
import { usePartidoLive } from "../hooks/usePartidoLive.js";
import BannerCarousel from "../components/BannerCarousel.jsx";
import MediaRotator from "../components/MediaRotator.jsx";

const PUNTOS_GAME = [0, 15, 30, 40, "Ad"];

function useNow(ms = 500) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Evita que el celular/tablet apague la pantalla mientras se mira el partido. */
function useWakeLock() {
  useEffect(() => {
    let lock = null;
    const request = async () => {
      try {
        if (document.visibilityState === "visible" && navigator.wakeLock) {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* no soportado o denegado */
      }
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      document.removeEventListener("visibilitychange", request);
      lock?.release?.().catch(() => {});
    };
  }, []);
}

function FullscreenButton() {
  const [visible, setVisible] = useState(true);
  const [isFs, setIsFs] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    let t = setTimeout(() => setVisible(false), 3500);
    const show = () => {
      setVisible(true);
      clearTimeout(t);
      t = setTimeout(() => setVisible(false), 3500);
    };
    const onFs = () => setIsFs(Boolean(document.fullscreenElement));
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  if (!document.documentElement.requestFullscreen) return null;

  return (
    <button
      type="button"
      className="sb-fs"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
      onClick={() =>
        isFs ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {})
      }
      aria-label={isFs ? "Salir de pantalla completa" : "Pantalla completa"}
    >
      {isFs ? <Minimize size={20} /> : <Maximize size={20} />}
    </button>
  );
}

export default function Tablero() {
  const { codigo } = useParams();
  const { partido, loading, error, eliminado } = usePartidoLive({ codigo });
  const now = useNow();
  useWakeLock();

  useEffect(() => {
    if (!partido) return;
    const eq = (e) => [e.jugador1, e.jugador2].filter(Boolean).join("/");
    document.title = `${partido.cancha ? `${partido.cancha} · ` : ""}${eq(partido.equipo1)} vs ${eq(partido.equipo2)}`;
    return () => {
      document.title = "SMASHR";
    };
  }, [partido]);

  if (loading) {
    return <Mensaje titulo="Cargando tablero…" />;
  }

  if (eliminado || error === "not_found" || !partido) {
    return (
      <Mensaje
        titulo={eliminado ? "Este partido fue eliminado" : "Tablero no encontrado"}
        detalle={
          eliminado
            ? "El organizador eliminó este partido."
            : error && error !== "not_found"
              ? "Reintentando conexión…"
              : "Revisá el link o pedile uno nuevo al organizador."
        }
      />
    );
  }

  const calentando = partido.calentamiento?.activo && partido.calentamiento.fin > now;
  const descansando = partido.descanso?.activo && partido.descanso.fin > now;

  if (calentando) {
    return <PausaScreen titulo="Calentamiento" reloj={cuentaRegresiva(partido.calentamiento.fin - now)} partido={partido} />;
  }
  if (descansando) {
    return <PausaScreen titulo="Descanso" reloj={cuentaRegresiva(partido.descanso.fin - now)} partido={partido} />;
  }

  return <Marcador partido={partido} now={now} />;
}

function Marcador({ partido, now }) {
  const esSuperTieBreak =
    partido.puntos.ultimoSetTieBreak && partido.puntos.set === parseInt(partido.juego.cantidadSets);
  const usarPuntos = !partido.juego.tiebreak && !esSuperTieBreak;

  let punto1 = usarPuntos ? PUNTOS_GAME[partido.puntos.game[0]] : partido.puntos.game[0];
  let punto2 = usarPuntos ? PUNTOS_GAME[partido.puntos.game[1]] : partido.puntos.game[1];
  let destacar1 = false;
  let destacar2 = false;
  if (punto1 === "Ad") {
    destacar1 = true;
    punto2 = 40;
  } else if (punto2 === "Ad") {
    destacar2 = true;
    punto1 = 40;
  } else if (partido.puntos.puntoOro && punto1 === 40 && punto2 === 40) {
    destacar1 = destacar2 = true;
  }

  const ganador = partido.juego.equipoGanador;
  const sets = partido.puntos.sets || [];
  const n = Math.max(1, sets.length);
  const setActual = partido.puntos.set || 1;
  const servicio = partido.juego.servicio;

  const tiempo = ganador
    ? partido.juego.tiempoTranscurridoAlFinalizar || 0
    : now - partido.juego.inicio;

  const customBg = partido.pantalla_actual;
  const vars = {
    "--n": n,
    "--cols-land": `minmax(0, 2.4fr) minmax(0, 1fr) minmax(0, ${n * 0.8}fr)`,
    "--cols-port": `minmax(0, 1fr) minmax(0, ${n * 0.75}fr)`,
    ...(customBg ? { "--board-bg": `url("${customBg.replace(/"/g, '\\"')}")` } : {}),
  };

  const equipos = [
    { eq: partido.equipo1, idx: 0, punto: punto1, destacar: destacar1, servs: [0, 1] },
    { eq: partido.equipo2, idx: 1, punto: punto2, destacar: destacar2, servs: [2, 3] },
  ];

  return (
    <div className={`sb board-shell${customBg ? " sb--custom-bg" : ""}`} style={vars}>
      <Header partido={partido} reloj={msToTime(tiempo)} />

      <main className="sb-main">
        <div className="sb-panel">
          <div className="sb-row sb-labels" aria-hidden>
            <span className="sb-labels-names" />
            <span className="sb-labels-game">{usarPuntos ? "Puntos" : "Tie-break"}</span>
            <span className="sb-sets">
              {sets.map((_, i) => (
                <span key={i}>
                  <span className="sb-lbl-long">Set </span>
                  {i + 1}
                </span>
              ))}
            </span>
          </div>

          {equipos.map(({ eq, idx, punto, destacar, servs }) => (
            <div
              key={idx}
              className={`sb-row sb-team${ganador === `equipo${idx + 1}` ? " sb-team--winner" : ""}`}
            >
              <div className="sb-names" style={{ "--team": eq.color }}>
                <NombreJugador nombre={eq.jugador1} saca={!ganador && servicio === servs[0]} />
                <NombreJugador nombre={eq.jugador2} saca={!ganador && servicio === servs[1]} />
              </div>
              <div className={`sb-game${destacar ? " sb-game--hot" : ""}${ganador ? " sb-game--off" : ""}`}>
                {ganador ? "" : punto}
              </div>
              <div className="sb-sets">
                {sets.map((s, i) => (
                  <div
                    key={i}
                    className={`sb-set${!ganador && i + 1 === setActual ? " sb-set--current" : ""}${
                      (s[idx] || 0) > (s[1 - idx] || 0) && (ganador || i + 1 < setActual) ? " sb-set--won" : ""
                    }`}
                  >
                    {s[idx]}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {ganador && (
          <div className="sb-winner cartel-ganador" role="status">
            <span className="sb-winner-label">Ganadores</span>
            <span className="sb-winner-names">
              {partido[ganador].jugador1} – {partido[ganador].jugador2}
            </span>
          </div>
        )}
      </main>

      <BannerCarousel />
      <FullscreenButton />
    </div>
  );
}

function Header({ partido, reloj }) {
  const sub = [partido.cancha, partido.juego.etapa].filter(Boolean).join(" · ");
  return (
    <header className="sb-header">
      <img src="/assets/icono.webp" alt="" className="sb-logo" />
      <div className="sb-title">
        <div className="sb-torneo">{partido.torneo || "SMASHR"}</div>
        {sub && <div className="sb-sub">{sub}</div>}
      </div>
      {reloj && <div className="sb-clock">{reloj}</div>}
    </header>
  );
}

function NombreJugador({ nombre, saca }) {
  const boxRef = useRef(null);
  const textRef = useRef(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return undefined;
    const fit = () => {
      text.style.transform = "";
      const ratio = text.clientWidth / Math.max(1, text.scrollWidth);
      if (ratio < 1) {
        text.style.transform = `scaleX(${Math.max(0.6, ratio)})`;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [nombre]);

  return (
    <div ref={boxRef} className="sb-name">
      <span ref={textRef} className="sb-name-text" title={nombre}>
        {nombre || "—"}
      </span>
      <span className={`sb-ball${saca ? " sb-ball--on" : ""}`} aria-label={saca ? "Saca" : undefined} />
    </div>
  );
}

function PausaScreen({ titulo, reloj, partido }) {
  const equipo = (e) => `${e.jugador1 || "—"} / ${e.jugador2 || "—"}`;
  return (
    <div className="pausa">
      <Header partido={partido} />
      <div className="pausa-body">
        <div className="pausa-team" style={{ borderColor: partido.equipo1.color }}>
          {equipo(partido.equipo1)}
        </div>
        <div className="pausa-vs">VS</div>
        <div className="pausa-team" style={{ borderColor: partido.equipo2.color }}>
          {equipo(partido.equipo2)}
        </div>
        <div className="pausa-media">
          <MediaRotator />
        </div>
      </div>
      <div className="pausa-footer">
        <div className="pausa-titulo">{titulo}</div>
        <div className="pausa-reloj">{reloj}</div>
      </div>
    </div>
  );
}

function Mensaje({ titulo, detalle }) {
  return (
    <div className="board-shell flex min-h-[100dvh] flex-col items-center justify-center gap-3 p-6 text-center text-white">
      <img src="/assets/icono.webp" alt="SMASHR" className="mb-2 h-16 w-16 rounded-full" />
      <p className="text-2xl font-bold sm:text-4xl">{titulo}</p>
      {detalle && <p className="text-base text-white/70 sm:text-xl">{detalle}</p>}
    </div>
  );
}

function cuentaRegresiva(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function msToTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}
