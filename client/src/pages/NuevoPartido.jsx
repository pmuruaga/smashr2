import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePartido } from "../context/PartidoContext.jsx";
import AppShell from "../components/AppShell.jsx";
import Button from "../components/Button.jsx";
import ConfirmNewMatchModal from "../components/ConfirmNewMatchModal.jsx";
import { teamLabel } from "../components/MatchCard.jsx";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const ETAPAS = [
  "Fase de Grupos",
  "Octavos de Final",
  "Cuartos de Final",
  "SemiFinal",
  "Final",
];

const CONFIRM_KEY = "smashr_crear_confirmado";

const fieldClass = "ui-field";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-[#3d4f40]";
const panelClass =
  "rounded-2xl border-2 border-[#9aaf90] bg-white p-5 sm:p-6 shadow-sm";

export default function NuevoPartido() {
  const navigate = useNavigate();
  const { crearPartido, partido } = usePartido();

  const [equipo1, setEquipo1] = useState({
    jugador1: "",
    jugador2: "",
    color: "#17A2B8",
  });
  const [equipo2, setEquipo2] = useState({
    jugador1: "",
    jugador2: "",
    color: "#28A745",
  });
  const [etapa, setEtapa] = useState("Fase de Grupos");
  const [puntoOro, setPuntoOro] = useState(false);
  const [cantidadSets, setCantidadSets] = useState(3);
  const [gamesPorSet, setGamesPorSet] = useState(6);
  const [ultimoPuntoTieBreak, setUltimoPuntoTieBreak] = useState(100);
  const [ultimoSetTieBreak, setUltimoSetTieBreak] = useState(false);
  const [superTiebreakMuerte, setSuperTiebreakMuerte] = useState(false);
  const [puntosMuereEn, setPuntosMuereEn] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [yaConfirmado, setYaConfirmado] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(CONFIRM_KEY) === "1") {
      setYaConfirmado(true);
      sessionStorage.removeItem(CONFIRM_KEY);
    }
  }, []);

  const enJuego =
    partido && !partido.finalizado && !partido.juego?.equipoGanador;

  const activeLabel = partido
    ? `${teamLabel(partido.equipo1)} vs ${teamLabel(partido.equipo2)}`
    : "";

  const doCreate = async () => {
    setLoading(true);
    try {
      let ugst = 100;
      if (ultimoSetTieBreak && superTiebreakMuerte && puntosMuereEn !== "") {
        ugst = parseInt(puntosMuereEn);
      }

      const uptb =
        ultimoPuntoTieBreak === "" || ultimoPuntoTieBreak < 7
          ? 100
          : parseInt(ultimoPuntoTieBreak);

      await crearPartido({
        equipo1,
        equipo2,
        etapa,
        configuracion: {
          cantidadSets: parseInt(cantidadSets),
          gamesPorSet: parseInt(gamesPorSet),
          puntoOro,
          ultimoPuntoTieBreak: uptb,
          ultimoSetTieBreak,
          ultimoGameSuperTB: ugst,
        },
      });
      navigate("/control");
    } catch (error) {
      alert(`Error al crear partido: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = () => {
    // Si ya aceptó el aviso en Home, no volver a preguntar
    if (enJuego && !yaConfirmado) {
      setConfirmOpen(true);
      return;
    }
    doCreate();
  };

  return (
    <AppShell
      title="Configurar partido"
      actions={
        <Button variant="ghost" className="!py-1.5" onClick={() => navigate("/")}>
          <ArrowLeft size={16} /> Inicio
        </Button>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1a241c] sm:text-3xl">
            Configurar partido
          </h2>
          <p className="mt-1 text-sm text-[#3d4f40]">
            Completá equipos y reglas. Al confirmar, este partido queda activo en
            el control y en la TV.
          </p>
        </div>

        {enJuego && (
          <div
            className="flex gap-3 rounded-xl border-2 p-4"
            style={{
              backgroundColor: "#fff8e6",
              borderColor: "#c9a227",
              color: "#1a241c",
            }}
          >
            <AlertTriangle className="shrink-0 text-[#8a841f]" size={22} />
            <div className="text-sm">
              <p className="font-bold">Hay un partido en curso</p>
              <p className="mt-1 text-[#3d4f40]">
                {activeLabel}. Al confirmar, la TV pasará a este partido nuevo.
                El anterior queda en recientes para reactivarlo.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <div className={panelClass}>
            <h3 className="mb-4 font-bold text-[#1a241c]">Equipo 1</h3>
            <label className={labelClass}>Jugador 1</label>
            <input
              type="text"
              value={equipo1.jugador1}
              onChange={(e) => setEquipo1({ ...equipo1, jugador1: e.target.value })}
              className={`${fieldClass} mb-3`}
            />
            <label className={labelClass}>Jugador 2</label>
            <input
              type="text"
              value={equipo1.jugador2}
              onChange={(e) => setEquipo1({ ...equipo1, jugador2: e.target.value })}
              className={`${fieldClass} mb-3`}
            />
            <label className={labelClass}>Color</label>
            <input
              type="color"
              value={equipo1.color}
              onChange={(e) => setEquipo1({ ...equipo1, color: e.target.value })}
              className="h-10 w-full cursor-pointer rounded-xl border-2 border-[#9aaf90] bg-white"
            />
          </div>

          <div className={panelClass}>
            <h3 className="mb-4 font-bold text-[#1a241c]">Equipo 2</h3>
            <label className={labelClass}>Jugador 1</label>
            <input
              type="text"
              value={equipo2.jugador1}
              onChange={(e) => setEquipo2({ ...equipo2, jugador1: e.target.value })}
              className={`${fieldClass} mb-3`}
            />
            <label className={labelClass}>Jugador 2</label>
            <input
              type="text"
              value={equipo2.jugador2}
              onChange={(e) => setEquipo2({ ...equipo2, jugador2: e.target.value })}
              className={`${fieldClass} mb-3`}
            />
            <label className={labelClass}>Color</label>
            <input
              type="color"
              value={equipo2.color}
              onChange={(e) => setEquipo2({ ...equipo2, color: e.target.value })}
              className="h-10 w-full cursor-pointer rounded-xl border-2 border-[#9aaf90] bg-white"
            />
          </div>
        </div>

        <div className={panelClass}>
          <h3 className="mb-4 font-bold text-[#1a241c]">Reglas</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Instancia</label>
              <select
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                className={fieldClass}
              >
                {ETAPAS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Cantidad de sets</label>
              <input
                type="number"
                value={cantidadSets}
                onChange={(e) => setCantidadSets(e.target.value)}
                min="1"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Games por set</label>
              <input
                type="number"
                value={gamesPorSet}
                onChange={(e) => setGamesPorSet(e.target.value)}
                min="4"
                max="12"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tie-break a</label>
              <input
                type="number"
                value={ultimoPuntoTieBreak === 100 ? "" : ultimoPuntoTieBreak}
                onChange={(e) =>
                  setUltimoPuntoTieBreak(
                    e.target.value === "" ? 100 : parseInt(e.target.value)
                  )
                }
                placeholder="vacío = diff. de 2"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="mt-4 space-y-3 text-[#1a241c]">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={puntoOro}
                onChange={(e) => setPuntoOro(e.target.checked)}
                className="h-4 w-4"
              />
              Punto de oro
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={ultimoSetTieBreak}
                onChange={(e) => setUltimoSetTieBreak(e.target.checked)}
                className="h-4 w-4"
              />
              Desempate en super tie-break
            </label>
            {ultimoSetTieBreak && (
              <div className="ml-2 space-y-2 rounded-xl border-2 border-[#9aaf90] bg-[#eef3ea] p-4 text-sm">
                <label className="flex flex-wrap items-center gap-2">
                  <input
                    type="radio"
                    name="superTb"
                    checked={superTiebreakMuerte}
                    onChange={() => setSuperTiebreakMuerte(true)}
                  />
                  Muere en
                  <input
                    type="number"
                    value={puntosMuereEn}
                    onChange={(e) => setPuntosMuereEn(e.target.value)}
                    disabled={!superTiebreakMuerte}
                    placeholder="10"
                    className="ui-field !w-20 !px-2 !py-1"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="superTb"
                    checked={!superTiebreakMuerte}
                    onChange={() => setSuperTiebreakMuerte(false)}
                  />
                  Diferencia de 2 (a 10)
                </label>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleConfirmar}
          disabled={loading}
          className="w-full py-4 text-base"
        >
          {loading ? "Creando…" : "Confirmar y puntuar"}
        </Button>
      </div>

      <ConfirmNewMatchModal
        open={confirmOpen}
        activeLabel={activeLabel}
        confirmLabel="Sí, crear este partido"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setYaConfirmado(true);
          doCreate();
        }}
      />
    </AppShell>
  );
}
