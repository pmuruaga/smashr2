import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePartido } from "../context/PartidoContext.jsx";
import AppShell from "../components/AppShell.jsx";
import Button from "../components/Button.jsx";
import MatchCard, { teamLabel } from "../components/MatchCard.jsx";
import ConfirmNewMatchModal from "../components/ConfirmNewMatchModal.jsx";
import FondoPanel from "../components/FondoPanel.jsx";
import { Monitor, Plus } from "lucide-react";

function partidoToCard(partido) {
  if (!partido) return null;
  let status = "en_juego";
  if (partido.finalizado || partido.juego?.equipoGanador) status = "finalizado";
  else if (
    partido.calentamiento?.activo &&
    partido.calentamiento.fin > Date.now()
  )
    status = "calentamiento";
  else if (partido.descanso?.activo && partido.descanso.fin > Date.now())
    status = "descanso";

  return {
    id: partido.id,
    etapa: partido.juego?.etapa,
    activo: true,
    finalizado: Boolean(partido.finalizado || partido.juego?.equipoGanador),
    status,
    equipo1: partido.equipo1,
    equipo2: partido.equipo2,
    sets: partido.puntos?.sets || [],
    game: partido.puntos?.game || [0, 0],
  };
}

export default function Home() {
  const navigate = useNavigate();
  const { partido, loading, listarPartidos, activarPartido, fetchPartido } =
    usePartido();
  const [lista, setLista] = useState([]);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const refreshLista = useCallback(async () => {
    try {
      const data = await listarPartidos();
      setLista(data);
    } catch {
      /* ignore */
    }
  }, [listarPartidos]);

  useEffect(() => {
    refreshLista();
  }, [refreshLista, partido?.id, partido?.puntos?.sets, partido?.finalizado]);

  const activoCard = partidoToCard(partido);
  const enJuego = Boolean(activoCard && !activoCard.finalizado);
  const hayActivo = Boolean(activoCard);
  const activeLabel = activoCard
    ? `${teamLabel(activoCard.equipo1)} vs ${teamLabel(activoCard.equipo2)}`
    : "";

  const otros = lista.filter((m) => !m.activo);

  /** Sin partido activo o el activo ya terminó → ir directo al formulario */
  const goCreate = () => {
    if (enJuego) {
      setConfirmOpen(true);
      return;
    }
    navigate("/nuevo-partido");
  };

  const confirmAndGoCreate = () => {
    setConfirmOpen(false);
    sessionStorage.setItem("smashr_crear_confirmado", "1");
    navigate("/nuevo-partido");
  };

  const handleActivate = async (id) => {
    setBusy(true);
    try {
      await activarPartido(id);
      await refreshLista();
      navigate("/control");
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      actions={
        <Button
          variant="ghost"
          className="!py-1.5 !px-2"
          onClick={() => window.open("/tablero", "_blank")}
        >
          <Monitor size={16} />
          <span className="hidden sm:inline">TV</span>
        </Button>
      }
    >
      <div className="space-y-8">
        <section className="space-y-2">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: "#2f6b08" }}
          >
            Control de cancha
          </p>
          <h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "#1a241c" }}
          >
            Partidos
          </h2>
          <p className="max-w-xl text-sm sm:text-base" style={{ color: "#3d4f40" }}>
            {enJuego
              ? "Hay un partido en juego. Podés puntuarlo, abrir la TV o crear otro (te vamos a pedir confirmación)."
              : hayActivo
                ? "El partido activo ya terminó. Podés ver la TV o crear uno nuevo."
                : "No hay partido activo. Creá uno para puntuar y mostrar en la TV."}
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: "#3d4f40" }}
            >
              {enJuego
                ? "Partido en curso"
                : hayActivo
                  ? "Último partido activo"
                  : "Partido activo"}
            </h3>
            <Button variant="secondary" onClick={goCreate} className="!py-2">
              <Plus size={16} /> Crear partido
            </Button>
          </div>

          {loading ? (
            <div
              className="rounded-2xl border-2 p-8 text-center"
              style={{
                borderColor: "#c5d0bc",
                backgroundColor: "#ffffff",
                color: "#3d4f40",
              }}
            >
              Cargando…
            </div>
          ) : hayActivo ? (
            <div className="space-y-3">
              <MatchCard
                match={activoCard}
                highlight
                busy={busy}
                onScore={() => navigate("/control")}
                onOpenTv={() => window.open("/tablero", "_blank")}
              />
              <FondoPanel />
            </div>
          ) : (
            <div
              className="rounded-2xl border-2 border-dashed p-8 text-center"
              style={{
                borderColor: "#9aaf90",
                backgroundColor: "#ffffff",
                color: "#3d4f40",
              }}
            >
              <p className="mb-4">
                Todavía no hay partido activo. Creá el primero para empezar.
              </p>
              <Button onClick={() => navigate("/nuevo-partido")}>
                <Plus size={18} /> Crear primer partido
              </Button>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "#3d4f40" }}
          >
            Partidos recientes
          </h3>
          {otros.length === 0 ? (
            <p className="text-sm" style={{ color: "#3d4f40" }}>
              {hayActivo
                ? "Solo está el partido activo. Cuando crees otro, el anterior aparece acá."
                : "Acá vas a ver los partidos guardados para reactivarlos."}
            </p>
          ) : (
            <div className="space-y-3">
              {otros.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  busy={busy}
                  onActivate={() => handleActivate(m.id)}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              fetchPartido();
              refreshLista();
            }}
            className="text-xs font-medium"
            style={{ color: "#3d4f40" }}
          >
            Actualizar lista
          </button>
        </section>
      </div>

      <ConfirmNewMatchModal
        open={confirmOpen}
        activeLabel={activeLabel}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmAndGoCreate}
      />
    </AppShell>
  );
}
