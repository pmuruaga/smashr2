import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePartido } from "../context/PartidoContext.jsx";
import { useScoring } from "../hooks/useScoring.js";
import PublicidadPanel from "../components/PublicidadPanel.jsx";
import AppShell from "../components/AppShell.jsx";
import Button from "../components/Button.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import FondoPanel from "../components/FondoPanel.jsx";
import {
  ArrowLeft,
  Undo,
  Flame,
  Timer,
  Trophy,
  CircleDot,
  Monitor,
} from "lucide-react";

export default function ControlPartido() {
  const navigate = useNavigate();
  const {
    partido,
    loading,
    actualizarEstado,
    setCalentamiento,
    setDescanso,
    aplicarEstadoLocal,
  } = usePartido();
  const { sumarPunto, establecerServ, deshacer, PUNTOS_GAME } = useScoring(
    partido,
    actualizarEstado,
    aplicarEstadoLocal
  );

  const [tiempoTranscurrido, setTiempoTranscurrido] = useState("00:00:00");
  const [descansoActivo, setDescansoActivo] = useState(false);
  const [tiempoDescanso, setTiempoDescanso] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (partido?.juego?.inicio && partido.juego.equipoGanador === "") {
        const ms = Date.now() - partido.juego.inicio;
        setTiempoTranscurrido(msToTime(ms));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [partido]);

  useEffect(() => {
    if (partido?.descanso?.activo && partido.descanso.fin > Date.now()) {
      setDescansoActivo(true);
      setTiempoDescanso(
        Math.max(0, Math.ceil((partido.descanso.fin - Date.now()) / 1000))
      );
    } else if (partido && !partido.descanso?.activo) {
      setDescansoActivo(false);
      setTiempoDescanso(0);
    }
  }, [partido]);

  useEffect(() => {
    if (!descansoActivo) return;
    const interval = setInterval(() => {
      setTiempoDescanso((prev) => {
        if (prev <= 1) {
          setDescansoActivo(false);
          setDescanso(false, 0, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descansoActivo]);

  if (loading) {
    return (
      <AppShell showLogout={false}>
        <p className="text-center text-court-muted py-20">Cargando…</p>
      </AppShell>
    );
  }

  if (!partido) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="mb-4 text-lg text-court-muted">No hay un partido activo</p>
          <Button onClick={() => navigate("/nuevo-partido")}>Crear partido</Button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-4 text-sm text-court-muted hover:text-smashr-green"
          >
            Volver al inicio
          </button>
        </div>
      </AppShell>
    );
  }

  const esSuperTieBreak =
    partido.puntos.ultimoSetTieBreak &&
    partido.puntos.set === parseInt(partido.juego.cantidadSets);

  const punto1 =
    !partido.juego.tiebreak && !esSuperTieBreak
      ? PUNTOS_GAME[partido.puntos.game[0]]
      : partido.puntos.game[0];
  const punto2 =
    !partido.juego.tiebreak && !esSuperTieBreak
      ? PUNTOS_GAME[partido.puntos.game[1]]
      : partido.puntos.game[1];

  const esPuntoOro =
    punto1 === "Ad" || punto2 === "Ad" || (punto1 === 40 && punto2 === 40);

  const iniciarDescanso = (segundos) => {
    setDescansoActivo(true);
    setTiempoDescanso(segundos);
    setDescanso(true, segundos, Date.now() + segundos * 1000);
  };

  const detenerDescanso = () => {
    setDescansoActivo(false);
    setTiempoDescanso(0);
    setDescanso(false, 0, 0);
  };

  const iniciarCalentamiento = () => {
    const fin = Date.now() + 5 * 60 * 1000;
    setCalentamiento(true, fin);
  };

  const cancelarCalentamiento = () => {
    setCalentamiento(false, 0);
  };

  const partidoIniciado =
    (partido.puntos.game?.[0] || 0) > 0 ||
    (partido.puntos.game?.[1] || 0) > 0 ||
    (partido.puntos.sets || []).some((s) => (s?.[0] || 0) > 0 || (s?.[1] || 0) > 0);

  let status = "en_juego";
  if (partido.juego.equipoGanador) status = "finalizado";
  else if (partido.calentamiento?.activo && partido.calentamiento.fin > Date.now())
    status = "calentamiento";
  else if (descansoActivo) status = "descanso";

  const title = `${partido.juego.etapa} · ${new Date(
    partido.juego.inicio
  ).toLocaleDateString()}`;

  return (
    <AppShell
      title={title}
      actions={
        <>
          <Button
            variant="ghost"
            className="!py-1.5 !px-2"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Inicio</span>
          </Button>
          <Button
            variant="secondary"
            className="!py-1.5 !px-2"
            onClick={() => window.open("/tablero", "_blank")}
          >
            <Monitor size={16} />
            <span className="hidden sm:inline">Abrir TV</span>
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="activo" />
          <StatusBadge status={status} />
          <span className="ml-auto font-mono text-lg text-smashr-dark tabular-nums inline-flex items-center gap-2 font-semibold">
            <Timer size={18} /> {tiempoTranscurrido}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <TeamScoreCard
            label="Equipo 1"
            color={partido.equipo1.color}
            j1={partido.equipo1.jugador1}
            j2={partido.equipo1.jugador2}
            serv1={partido.juego.orden[partido.juego.posServ] === 0}
            serv2={partido.juego.orden[partido.juego.posServ] === 1}
            onServ1={() => establecerServ(0)}
            onServ2={() => establecerServ(1)}
            punto={punto1}
            esPuntoOro={esPuntoOro}
            disabled={partido.juego.equipoGanador !== ""}
            onPunto={() => sumarPunto(1)}
          />
          <TeamScoreCard
            label="Equipo 2"
            color={partido.equipo2.color}
            j1={partido.equipo2.jugador1}
            j2={partido.equipo2.jugador2}
            serv1={partido.juego.orden[partido.juego.posServ] === 2}
            serv2={partido.juego.orden[partido.juego.posServ] === 3}
            onServ1={() => establecerServ(2)}
            onServ2={() => establecerServ(3)}
            punto={punto2}
            esPuntoOro={esPuntoOro}
            disabled={partido.juego.equipoGanador !== ""}
            onPunto={() => sumarPunto(2)}
          />
        </div>

        <div className="rounded-2xl border border-court-line bg-court-surface p-4 sm:p-5 shadow-sm">
          <h3 className="mb-3 text-xs uppercase tracking-wider text-court-muted">
            Resultado por sets
          </h3>
          <table className="w-full text-center">
            <tbody>
              <tr className="text-2xl font-bold tabular-nums">
                {partido.puntos.sets.map((s, i) => (
                  <td
                    key={i}
                    className={`py-1 rounded-lg ${
                      i + 1 === partido.puntos.set
                        ? "bg-[#2f6b08]/15 text-[#1a241c] ring-1 ring-[#2f6b08]/35"
                        : ""
                    }`}
                  >
                    {s[0]}
                  </td>
                ))}
              </tr>
              <tr className="text-2xl font-bold tabular-nums text-court-muted">
                {partido.puntos.sets.map((s, i) => (
                  <td
                    key={i}
                    className={`py-1 rounded-lg ${
                      i + 1 === partido.puntos.set
                        ? "bg-[#2f6b08]/15 text-[#1a241c] ring-1 ring-[#2f6b08]/35"
                        : ""
                    }`}
                  >
                    {s[1]}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="gold" onClick={deshacer}>
            <Undo size={18} /> Deshacer
          </Button>

          {!partidoIniciado && !partido.calentamiento?.activo && (
            <Button variant="secondary" onClick={iniciarCalentamiento}>
              <Flame size={18} /> Calentamiento
            </Button>
          )}
          {partido.calentamiento?.activo && (
            <Button variant="danger" onClick={cancelarCalentamiento}>
              Cancelar calentamiento
            </Button>
          )}

          <Button variant="secondary" onClick={() => iniciarDescanso(90)}>
            Descanso 90s
          </Button>
          <Button variant="secondary" onClick={() => iniciarDescanso(120)}>
            Descanso 2m
          </Button>
          {descansoActivo && (
            <Button variant="danger" onClick={detenerDescanso}>
              Detener ({formatTime(tiempoDescanso)})
            </Button>
          )}
        </div>

        <FondoPanel />

        <PublicidadPanel />

        {partido.juego.equipoGanador && (
          <div className="cartel-ganador rounded-2xl p-6 text-center text-xl font-bold text-black sm:text-2xl">
            <Trophy size={28} className="inline" /> Ganadores:{" "}
            {partido[partido.juego.equipoGanador].jugador1} -{" "}
            {partido[partido.juego.equipoGanador].jugador2}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function TeamScoreCard({
  label,
  color,
  j1,
  j2,
  serv1,
  serv2,
  onServ1,
  onServ2,
  punto,
  esPuntoOro,
  disabled,
  onPunto,
}) {
  return (
    <div className="rounded-2xl border border-court-line bg-court-surface p-4 sm:p-5 shadow-sm">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-court-muted">
        {label}
      </h3>
      <div className="space-y-2">
        <JugadorBox nombre={j1} color={color} servicio={serv1} onClick={onServ1} />
        <JugadorBox nombre={j2} color={color} servicio={serv2} onClick={onServ2} />
      </div>
      <button
        type="button"
        onClick={onPunto}
        disabled={disabled}
        className={`mt-4 w-full rounded-2xl py-10 text-4xl font-bold transition disabled:opacity-40 sm:py-12 sm:text-5xl ${
          esPuntoOro
            ? "bg-[#8a841f] text-white hover:bg-[#6f6a18]"
            : "bg-[#2f6b08] text-white hover:bg-[#255506]"
        }`}
      >
        {punto}
      </button>
      <p className="mt-2 text-center text-xs text-court-muted">Tocá para sumar punto</p>
    </div>
  );
}

function JugadorBox({ nombre, color, servicio, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:brightness-110"
      style={{ backgroundColor: color + "33" }}
    >
      <span className="font-medium">{nombre || "—"}</span>
      {servicio && <CircleDot size={20} className="text-smashr-green" />}
    </button>
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

function formatTime(totalSeconds) {
  const minutos = Math.floor(totalSeconds / 60);
  const segundos = totalSeconds % 60;
  return `${minutos.toString().padStart(2, "0")}:${segundos
    .toString()
    .padStart(2, "0")}`;
}
