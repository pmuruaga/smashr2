import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import Button from "../components/Button.jsx";
import MatchCard, { teamLabel } from "../components/MatchCard.jsx";
import ShareModal from "../components/ShareModal.jsx";
import { usePartidosLista } from "../hooks/usePartidosLista.js";

const FILTROS = [
  { id: "en_curso", label: "En curso" },
  { id: "finalizados", label: "Finalizados" },
  { id: "todos", label: "Todos" },
];

const SIN_TORNEO = "__sin_torneo__";

function normalizar(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function compararCancha(a, b) {
  return String(a.cancha || "~").localeCompare(String(b.cancha || "~"), "es", { numeric: true });
}

export default function Home() {
  const navigate = useNavigate();
  const { lista, loading, error } = usePartidosLista();
  const [filtro, setFiltro] = useState("en_curso");
  const [torneo, setTorneo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [share, setShare] = useState(null);

  const enCurso = lista.filter((m) => !m.finalizado);
  const torneos = useMemo(
    () => [...new Set(lista.map((m) => m.torneo).filter(Boolean))].sort(),
    [lista]
  );

  const visibles = useMemo(() => {
    const q = normalizar(busqueda);
    const out = lista.filter((m) => {
      if (filtro === "en_curso" && m.finalizado) return false;
      if (filtro === "finalizados" && !m.finalizado) return false;
      if (torneo === SIN_TORNEO ? m.torneo : torneo && m.torneo !== torneo) return false;
      if (!q) return true;
      const hay = normalizar(
        [teamLabel(m.equipo1), teamLabel(m.equipo2), m.cancha, m.torneo, m.etapa].join(" ")
      );
      return hay.includes(q);
    });
    // En curso: ordenados por cancha para ubicarlos rápido
    return filtro === "en_curso" ? out.sort(compararCancha) : out;
  }, [lista, filtro, torneo, busqueda]);

  const openTv = (m) => window.open(`/tablero/${m.codigo}`, "_blank");

  return (
    <AppShell wide>
      <div className="space-y-5 sm:space-y-6">
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Partidos</h2>
            <p className="mt-1 text-sm text-[#3d4f40]">
              {enCurso.length === 0
                ? "No hay partidos en curso."
                : enCurso.length === 1
                  ? "1 partido en curso."
                  : `${enCurso.length} partidos en curso al mismo tiempo.`}{" "}
              Cada uno tiene su propio tablero para compartir.
            </p>
          </div>
          <Button onClick={() => navigate("/nuevo-partido")} className="w-full sm:w-auto">
            <Plus size={18} /> Nuevo partido
          </Button>
        </section>

        <section className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div
            className="flex w-full shrink-0 rounded-xl border-2 border-[#c5d0bc] bg-white p-1 lg:inline-flex lg:w-auto"
            role="tablist"
          >
            {FILTROS.map((f) => {
              const count =
                f.id === "en_curso"
                  ? enCurso.length
                  : f.id === "finalizados"
                    ? lista.length - enCurso.length
                    : lista.length;
              const active = filtro === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFiltro(f.id)}
                  className={`flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-sm font-semibold transition sm:px-3 ${
                    active ? "bg-[#1a241c] text-white" : "text-[#3d4f40] hover:bg-[#eef3ea]"
                  }`}
                >
                  {f.label} <span className="opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            {torneos.length > 0 && (
              <select
                value={torneo}
                onChange={(e) => setTorneo(e.target.value)}
                className="ui-field sm:!w-56"
                aria-label="Filtrar por torneo"
              >
                <option value="">Todos los partidos</option>
                <option value={SIN_TORNEO}>Partidos sin torneo</option>
                {torneos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
            <label className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8a7c]"
              />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar jugador, cancha o torneo"
                className="ui-field !pl-9"
              />
            </label>
          </div>
        </section>

        {error && (
          <p className="rounded-xl border-2 border-[#c43c2c] bg-white p-3 text-sm text-[#c43c2c]">
            No se pudo cargar la lista: {error}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
        ) : visibles.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#9aaf90] bg-white p-8 text-center text-[#3d4f40]">
            {lista.length === 0 ? (
              <>
                <p className="mb-4">Todavía no hay partidos. Creá el primero para empezar.</p>
                <Button onClick={() => navigate("/nuevo-partido")}>
                  <Plus size={18} /> Crear partido
                </Button>
              </>
            ) : busqueda || torneo ? (
              <p>Ningún partido coincide con la búsqueda.</p>
            ) : filtro === "en_curso" ? (
              <p>No hay partidos en curso. Creá uno nuevo o mirá los finalizados.</p>
            ) : (
              <p>No hay partidos finalizados todavía.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                onScore={() => navigate(`/control/${m.id}`)}
                onOpenTv={() => openTv(m)}
                onShare={() => setShare(m)}
              />
            ))}
          </div>
        )}
      </div>

      {share && <ShareModal match={share} onClose={() => setShare(null)} />}
    </AppShell>
  );
}
