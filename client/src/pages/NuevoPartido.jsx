import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import AppShell from "../components/AppShell.jsx";
import Button from "../components/Button.jsx";
import { ArrowLeft, ChevronDown } from "lucide-react";

const ETAPAS = [
  "Fase de Grupos",
  "Octavos de Final",
  "Cuartos de Final",
  "SemiFinal",
  "Final",
];

const fieldClass = "ui-field";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-[#3d4f40]";
const panelClass = "rounded-2xl border-2 border-[#9aaf90] bg-white p-5 sm:p-6 shadow-sm";

function EquipoPanel({ titulo, equipo, onChange }) {
  return (
    <div className={panelClass}>
      <h3 className="mb-4 font-bold text-[#1a241c]">{titulo}</h3>
      <label className={labelClass}>Jugador 1</label>
      <input
        type="text"
        value={equipo.jugador1}
        onChange={(e) => onChange({ ...equipo, jugador1: e.target.value })}
        className={`${fieldClass} mb-3`}
      />
      <label className={labelClass}>Jugador 2</label>
      <input
        type="text"
        value={equipo.jugador2}
        onChange={(e) => onChange({ ...equipo, jugador2: e.target.value })}
        className={`${fieldClass} mb-3`}
      />
      <label className={labelClass}>Color</label>
      <input
        type="color"
        value={equipo.color}
        onChange={(e) => onChange({ ...equipo, color: e.target.value })}
        className="h-10 w-full cursor-pointer rounded-xl border-2 border-[#9aaf90] bg-white"
      />
    </div>
  );
}

export default function NuevoPartido() {
  const navigate = useNavigate();

  const [torneo, setTorneo] = useState("");
  const [cancha, setCancha] = useState("");
  const [etapa, setEtapa] = useState("");
  const [sugerencias, setSugerencias] = useState({ torneos: [], canchas: [] });

  useEffect(() => {
    api
      .listarPartidos("todos")
      .then((res) => {
        const data = res.data || [];
        const uniq = (arr) => [...new Set(arr.filter(Boolean))];
        setSugerencias({
          torneos: uniq(data.map((m) => m.torneo)),
          canchas: uniq(data.map((m) => m.cancha)).sort((a, b) =>
            a.localeCompare(b, "es", { numeric: true })
          ),
        });
      })
      .catch(() => {});
  }, []);

  const [equipo1, setEquipo1] = useState({ jugador1: "", jugador2: "", color: "#17A2B8" });
  const [equipo2, setEquipo2] = useState({ jugador1: "", jugador2: "", color: "#28A745" });
  const [puntoOro, setPuntoOro] = useState(false);
  const [cantidadSets, setCantidadSets] = useState(3);
  const [gamesPorSet, setGamesPorSet] = useState(6);
  const [ultimoPuntoTieBreak, setUltimoPuntoTieBreak] = useState(100);
  const [ultimoSetTieBreak, setUltimoSetTieBreak] = useState(false);
  const [superTiebreakMuerte, setSuperTiebreakMuerte] = useState(false);
  const [puntosMuereEn, setPuntosMuereEn] = useState("");
  const [loading, setLoading] = useState(false);

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

      const res = await api.crearPartido({
        torneo: torneo.trim(),
        cancha: cancha.trim(),
        etapa,
        equipo1,
        equipo2,
        configuracion: {
          cantidadSets: Math.min(Math.max(parseInt(cantidadSets) || 3, 1), 5),
          gamesPorSet: parseInt(gamesPorSet),
          puntoOro,
          ultimoPuntoTieBreak: uptb,
          ultimoSetTieBreak,
          ultimoGameSuperTB: ugst,
        },
      });
      navigate(`/control/${res.data.id}`, { state: { nuevo: true } });
    } catch (error) {
      alert(`Error al crear partido: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      title="Nuevo partido"
      actions={
        <Button variant="ghost" className="!py-1.5" onClick={() => navigate("/")}>
          <ArrowLeft size={16} /> Inicio
        </Button>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1a241c] sm:text-3xl">
            Nuevo partido
          </h2>
          <p className="mt-1 text-sm text-[#3d4f40]">
            Solo hacen falta los jugadores. Los partidos que ya están en curso no se tocan:
            cada uno tiene su propio control y su propio tablero.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <EquipoPanel titulo="Equipo 1" equipo={equipo1} onChange={setEquipo1} />
          <EquipoPanel titulo="Equipo 2" equipo={equipo2} onChange={setEquipo2} />
        </div>

        <div className={panelClass}>
          <h3 className="mb-4 font-bold text-[#1a241c]">Reglas</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Cantidad de sets</label>
              <input
                type="number"
                value={cantidadSets}
                onChange={(e) => setCantidadSets(e.target.value)}
                min="1"
                max="5"
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
                  setUltimoPuntoTieBreak(e.target.value === "" ? 100 : parseInt(e.target.value))
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

        <details className={`${panelClass} group`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="font-bold text-[#1a241c]">Torneo, cancha e instancia</span>
              <span className="ml-2 text-sm text-[#3d4f40]">(opcional)</span>
              <span className="mt-0.5 block text-xs text-[#3d4f40]">
                Completalo solo si el partido es de un torneo o liga, o si querés indicar la
                cancha en el tablero.
              </span>
            </span>
            <ChevronDown size={20} className="shrink-0 transition group-open:rotate-180" />
          </summary>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="torneo">Torneo / liga</label>
              <input
                id="torneo"
                type="text"
                list="torneos-sugeridos"
                value={torneo}
                onChange={(e) => setTorneo(e.target.value)}
                placeholder="Ej: Relámpago Suma 13"
                maxLength={80}
                className={fieldClass}
              />
              <datalist id="torneos-sugeridos">
                {sugerencias.torneos.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelClass} htmlFor="cancha">Cancha</label>
              <input
                id="cancha"
                type="text"
                list="canchas-sugeridas"
                value={cancha}
                onChange={(e) => setCancha(e.target.value)}
                placeholder="Ej: Cancha 2"
                maxLength={40}
                className={fieldClass}
              />
              <datalist id="canchas-sugeridas">
                {sugerencias.canchas.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelClass} htmlFor="etapa">Instancia</label>
              <select
                id="etapa"
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                className={fieldClass}
              >
                <option value="">Ninguna</option>
                {ETAPAS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </details>

        <Button onClick={doCreate} disabled={loading} className="w-full py-4 text-base">
          {loading ? "Creando…" : "Crear y puntuar"}
        </Button>
      </div>
    </AppShell>
  );
}
