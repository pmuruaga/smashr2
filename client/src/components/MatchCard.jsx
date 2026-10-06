import { Monitor, Share2, Trophy } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import Button from "./Button.jsx";

const PUNTOS_GAME = [0, 15, 30, 40, "Ad"];

function formatSets(sets) {
  if (!Array.isArray(sets) || !sets.length) return "—";
  return sets.map((s) => `${s[0] ?? 0}-${s[1] ?? 0}`).join(" · ");
}

function teamLabel(eq) {
  if (!eq) return "Equipo";
  const a = eq.jugador1 || "—";
  const b = eq.jugador2 || "—";
  return `${a} / ${b}`;
}

function setsVisibles(match) {
  const sets = Array.isArray(match.sets) ? match.sets : [];
  if (match.finalizado) {
    const jugados = sets.filter((s) => (s[0] || 0) + (s[1] || 0) > 0);
    return jugados.length ? jugados : sets.slice(0, 1);
  }
  return sets.slice(0, Math.max(1, Math.min(match.set || 1, sets.length)));
}

function gameLabel(match, idx) {
  const v = match.game?.[idx] ?? 0;
  return match.tiebreak ? v : PUNTOS_GAME[v] ?? v;
}

export default function MatchCard({ match, onScore, onOpenTv, onShare }) {
  if (!match) return null;
  const status = match.status || (match.finalizado ? "finalizado" : "en_juego");
  const sets = setsVisibles(match);
  const setActualIdx = (match.set || 1) - 1;
  const enCurso = !match.finalizado;
  const meta = [match.torneo, match.etapa].filter(Boolean).join(" · ");

  const row = (eq, idx) => {
    const ganador = match.equipoGanador === `equipo${idx + 1}`;
    return (
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: eq?.color || "#888", boxShadow: "0 0 0 1px rgba(0,0,0,0.15)" }}
        />
        <span className={`min-w-0 flex-1 truncate ${ganador ? "font-bold" : "font-semibold"}`} title={teamLabel(eq)}>
          {teamLabel(eq)}
        </span>
        {ganador && <Trophy size={15} className="shrink-0 text-[#8a841f]" />}
        <div className="flex shrink-0 gap-1 font-mono tabular-nums">
          {sets.map((s, i) => (
            <span
              key={i}
              className="w-7 rounded-md py-0.5 text-center text-sm font-bold"
              style={
                enCurso && i === setActualIdx
                  ? { backgroundColor: "#1a241c", color: "#fff" }
                  : { backgroundColor: "#eef3ea", color: "#1a241c" }
              }
            >
              {s[idx] ?? 0}
            </span>
          ))}
          {enCurso && (
            <span
              className="w-9 rounded-md py-0.5 text-center text-sm font-bold"
              style={{ backgroundColor: "#2f6b08", color: "#fff" }}
            >
              {gameLabel(match, idx)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <article
      className="flex flex-col rounded-2xl border-2 bg-white p-4 shadow-sm transition hover:shadow-md"
      style={{ borderColor: enCurso ? "#9aaf90" : "#c5d0bc", color: "#1a241c" }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          {match.cancha && (
            <span
              className="mb-1 inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide"
              style={{ backgroundColor: "#1a241c", color: "#ffffff" }}
            >
              {match.cancha}
            </span>
          )}
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-[#3d4f40]">
            {meta || "Partido"}
          </p>
        </div>
        <StatusBadge status={status} className="shrink-0" />
      </div>

      <div className="mb-4 space-y-2">
        {row(match.equipo1, 0)}
        {row(match.equipo2, 1)}
      </div>

      <div className="mt-auto grid grid-cols-[1fr_auto_auto] gap-2">
        {onScore && (
          <Button onClick={onScore} className="!px-3">
            {enCurso ? "Puntuar" : "Ver / editar"}
          </Button>
        )}
        {onOpenTv && (
          <Button variant="secondary" onClick={onOpenTv} className="!px-3" title="Abrir tablero">
            <Monitor size={16} />
            <span className="hidden sm:inline">Tablero</span>
          </Button>
        )}
        {onShare && (
          <Button variant="secondary" onClick={onShare} className="!px-3" title="Compartir link">
            <Share2 size={16} />
            <span className="hidden sm:inline">Compartir</span>
          </Button>
        )}
      </div>
    </article>
  );
}

export { teamLabel, formatSets };
