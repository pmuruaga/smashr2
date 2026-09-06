import StatusBadge from "./StatusBadge.jsx";
import Button from "./Button.jsx";

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

export default function MatchCard({
  match,
  highlight,
  onActivate,
  onScore,
  onOpenTv,
  busy,
}) {
  if (!match) return null;
  const status = match.status || (match.finalizado ? "finalizado" : "en_juego");

  return (
    <article
      className="rounded-2xl border-2 p-4 sm:p-5 scroll-mt-24"
      style={{
        backgroundColor: "#ffffff",
        borderColor: highlight ? "#2f6b08" : "#9aaf90",
        boxShadow: highlight
          ? "0 4px 16px rgba(47, 107, 8, 0.12)"
          : "0 1px 4px rgba(26, 36, 28, 0.06)",
        color: "#1a241c",
      }}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#3d4f40" }}
          >
            {match.etapa || "Partido"}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {match.activo && <StatusBadge status="activo" />}
            <StatusBadge status={status} />
          </div>
        </div>
        <p
          className="font-mono text-base font-bold tabular-nums"
          style={{ color: "#1a241c" }}
        >
          {formatSets(match.sets)}
        </p>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{
              backgroundColor: match.equipo1?.color || "#17A2B8",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
            }}
          />
          <span className="font-semibold" style={{ color: "#1a241c" }}>
            {teamLabel(match.equipo1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{
              backgroundColor: match.equipo2?.color || "#28A745",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
            }}
          />
          <span className="font-semibold" style={{ color: "#1a241c" }}>
            {teamLabel(match.equipo2)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {match.activo ? (
          <>
            {onScore && (
              <Button className="w-full sm:w-auto" onClick={onScore} disabled={busy}>
                Puntuar partido
              </Button>
            )}
            {onOpenTv && (
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={onOpenTv}
                disabled={busy}
              >
                Abrir pantalla TV
              </Button>
            )}
          </>
        ) : (
          onActivate && (
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={onActivate}
              disabled={busy}
            >
              Activar y puntuar
            </Button>
          )
        )}
      </div>
    </article>
  );
}

export { teamLabel, formatSets };
