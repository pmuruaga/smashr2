import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CircleDot,
  Flame,
  Monitor,
  Pencil,
  Share2,
  Timer,
  Trash2,
  Trophy,
  Undo,
  X,
} from "lucide-react";
import { usePartidoLive } from "../hooks/usePartidoLive.js";
import { useScoring } from "../hooks/useScoring.js";
import { api } from "../services/api.js";
import AppShell from "../components/AppShell.jsx";
import Button from "../components/Button.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import FondoPanel from "../components/FondoPanel.jsx";
import ShareModal from "../components/ShareModal.jsx";
import Modal from "../components/Modal.jsx";

const ETAPAS = ["Fase de Grupos", "Octavos de Final", "Cuartos de Final", "SemiFinal", "Final"];

export default function ControlPartido() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const live = usePartidoLive({ id: Number(id) });
  const { partido, partidoRef, loading, error, eliminado, aviso, limpiarAviso } = live;
  const { sumarPunto, establecerServ, PUNTOS_GAME } = useScoring(partidoRef, live.enviarEstado);

  const [now, setNow] = useState(Date.now());
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [nuevo, setNuevo] = useState(Boolean(location.state?.nuevo));

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(limpiarAviso, 5000);
    return () => clearTimeout(t);
  }, [aviso, limpiarAviso]);

  const backAction = (
    <Button variant="ghost" className="!px-2 !py-1.5" onClick={() => navigate("/")}>
      <ArrowLeft size={16} />
      <span className="hidden sm:inline">Partidos</span>
    </Button>
  );

  if (loading) {
    return (
      <AppShell actions={backAction}>
        <p className="py-20 text-center text-[#3d4f40]">Cargando…</p>
      </AppShell>
    );
  }

  if (eliminado || !partido) {
    return (
      <AppShell actions={backAction}>
        <div className="flex flex-col items-center py-16 text-center">
          <p className="mb-4 text-lg text-[#3d4f40]">
            {eliminado
              ? "Este partido fue eliminado."
              : error === "not_found"
                ? "Este partido no existe."
                : `No se pudo cargar el partido${error ? `: ${error}` : ""}.`}
          </p>
          <Button onClick={() => navigate("/")}>Volver a partidos</Button>
        </div>
      </AppShell>
    );
  }

  const esSuperTieBreak =
    partido.puntos.ultimoSetTieBreak && partido.puntos.set === parseInt(partido.juego.cantidadSets);
  const usarPuntos = !partido.juego.tiebreak && !esSuperTieBreak;
  const punto1 = usarPuntos ? PUNTOS_GAME[partido.puntos.game[0]] : partido.puntos.game[0];
  const punto2 = usarPuntos ? PUNTOS_GAME[partido.puntos.game[1]] : partido.puntos.game[1];
  const esPuntoOro = punto1 === "Ad" || punto2 === "Ad" || (punto1 === 40 && punto2 === 40);

  const finalizado = partido.juego.equipoGanador !== "";
  const calentando = partido.calentamiento?.activo && partido.calentamiento.fin > now;
  const descansando = partido.descanso?.activo && partido.descanso.fin > now;
  const restanteDescanso = descansando ? Math.ceil((partido.descanso.fin - now) / 1000) : 0;

  let status = "en_juego";
  if (finalizado) status = "finalizado";
  else if (calentando) status = "calentamiento";
  else if (descansando) status = "descanso";

  const tiempo = finalizado
    ? partido.juego.tiempoTranscurridoAlFinalizar || 0
    : now - partido.juego.inicio;

  const partidoIniciado =
    partido.puntos.game.some((g) => g > 0) ||
    partido.puntos.sets.some((s) => (s?.[0] || 0) > 0 || (s?.[1] || 0) > 0);

  const iniciarDescanso = (segundos) =>
    live.setDescanso(true, segundos, Date.now() + segundos * 1000).catch(() => {});

  const share = {
    ...partido,
    etapa: partido.juego.etapa,
  };

  return (
    <AppShell
      title={[partido.cancha, partido.torneo].filter(Boolean).join(" · ")}
      actions={
        <>
          {backAction}
          <Button
            variant="secondary"
            className="!px-2 !py-1.5"
            onClick={() => window.open(`/tablero/${partido.codigo}`, "_blank")}
            title="Abrir tablero"
          >
            <Monitor size={16} />
            <span className="hidden sm:inline">Tablero</span>
          </Button>
          <Button className="!px-2 !py-1.5" onClick={() => setShareOpen(true)} title="Compartir">
            <Share2 size={16} />
            <span className="hidden sm:inline">Compartir</span>
          </Button>
        </>
      }
    >
      <div className="space-y-4 sm:space-y-5">
        {aviso && (
          <div
            className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-md items-start gap-3 rounded-xl p-3 text-sm text-white shadow-xl"
            style={{ backgroundColor: "#1a241c" }}
            role="status"
          >
            <span className="flex-1">{aviso}</span>
            <button type="button" onClick={limpiarAviso} aria-label="Cerrar">
              <X size={16} />
            </button>
          </div>
        )}

        {nuevo && (
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#2f6b08] bg-white p-4 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm">
              <strong>Partido creado.</strong> Compartí el link del tablero para verlo en la
              TV de la cancha o desde cualquier celular.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setShareOpen(true)}>
                <Share2 size={16} /> Compartir tablero
              </Button>
              <Button variant="ghost" onClick={() => setNuevo(false)} aria-label="Cerrar aviso">
                <X size={16} />
              </Button>
            </div>
          </div>
        )}

        <section className="flex flex-wrap items-center gap-2">
          {partido.cancha && (
            <span className="rounded-md bg-[#1a241c] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              {partido.cancha}
            </span>
          )}
          <span className="text-sm font-semibold text-[#3d4f40]">
            {[partido.torneo, partido.juego.etapa].filter(Boolean).join(" · ")}
          </span>
          <StatusBadge status={status} />
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-base font-semibold tabular-nums sm:text-lg">
            <Timer size={18} /> {msToTime(tiempo)}
          </span>
        </section>

        {finalizado && (
          <div className="cartel-ganador rounded-2xl p-5 text-center text-lg font-bold text-black sm:text-2xl">
            <Trophy size={26} className="mr-1 inline" /> Ganadores:{" "}
            {partido[partido.juego.equipoGanador].jugador1} -{" "}
            {partido[partido.juego.equipoGanador].jugador2}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:gap-6">
          <TeamScoreCard
            color={partido.equipo1.color}
            j1={partido.equipo1.jugador1}
            j2={partido.equipo1.jugador2}
            serv1={partido.juego.orden[partido.juego.posServ] === 0}
            serv2={partido.juego.orden[partido.juego.posServ] === 1}
            onServ1={() => establecerServ(0)}
            onServ2={() => establecerServ(1)}
            punto={punto1}
            esPuntoOro={esPuntoOro}
            disabled={finalizado}
            onPunto={() => sumarPunto(1)}
          />
          <TeamScoreCard
            color={partido.equipo2.color}
            j1={partido.equipo2.jugador1}
            j2={partido.equipo2.jugador2}
            serv1={partido.juego.orden[partido.juego.posServ] === 2}
            serv2={partido.juego.orden[partido.juego.posServ] === 3}
            onServ1={() => establecerServ(2)}
            onServ2={() => establecerServ(3)}
            punto={punto2}
            esPuntoOro={esPuntoOro}
            disabled={finalizado}
            onPunto={() => sumarPunto(2)}
          />
        </div>
        <p className="-mt-2 text-center text-xs text-[#3d4f40]">
          Tocá el número para sumar el punto. Tocá un jugador para marcar quién saca.
        </p>

        <SetsTable partido={partido} />

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button variant="gold" onClick={() => live.deshacer().catch(() => {})} className="col-span-2 sm:col-auto">
            <Undo size={18} /> Deshacer último punto
          </Button>
          {!finalizado && !partidoIniciado && !calentando && (
            <Button
              variant="secondary"
              onClick={() => live.setCalentamiento(true, Date.now() + 5 * 60 * 1000).catch(() => {})}
            >
              <Flame size={18} /> Calentamiento
            </Button>
          )}
          {calentando && (
            <Button variant="danger" onClick={() => live.setCalentamiento(false, 0).catch(() => {})}>
              Terminar calentamiento
            </Button>
          )}
          {!finalizado && !descansando && (
            <>
              <Button variant="secondary" onClick={() => iniciarDescanso(90)}>
                Descanso 90s
              </Button>
              <Button variant="secondary" onClick={() => iniciarDescanso(120)}>
                Descanso 2m
              </Button>
            </>
          )}
          {descansando && (
            <Button variant="danger" onClick={() => live.setDescanso(false, 0, 0).catch(() => {})}>
              Terminar descanso ({formatTime(restanteDescanso)})
            </Button>
          )}
        </div>

        <FondoPanel
          pantalla={partido.pantalla_actual}
          onUpload={(file) => live.uploadPantalla(file)}
          onReset={() => live.setPantalla("")}
        />

        <div className="flex flex-wrap gap-2 border-t border-[#c5d0bc] pt-4">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil size={16} /> Editar datos del partido
          </Button>
          <Button variant="ghost" className="!text-[#c43c2c]" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={16} /> Eliminar partido
          </Button>
        </div>
      </div>

      {shareOpen && <ShareModal match={share} onClose={() => setShareOpen(false)} />}

      {editOpen && (
        <EditarModal partido={partido} onClose={() => setEditOpen(false)} onSave={live.editar} />
      )}

      <Modal open={deleteOpen} title="¿Eliminar este partido?" onClose={() => setDeleteOpen(false)}>
        <p className="mb-5 text-sm text-[#3d4f40]">
          Se borra el marcador y el link del tablero deja de funcionar. Esta acción no se
          puede deshacer.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                await api.eliminarPartido(partido.id);
                navigate("/", { replace: true });
              } catch (err) {
                alert(err.message);
              }
            }}
          >
            <Trash2 size={16} /> Sí, eliminar
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}

function SetsTable({ partido }) {
  const sets = partido.puntos.sets;
  const actual = partido.puntos.set;
  const finalizado = partido.juego.equipoGanador !== "";
  const cell = (i) =>
    !finalizado && i + 1 === actual ? "bg-[#1a241c] text-white" : "bg-[#eef3ea] text-[#1a241c]";

  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-[#c5d0bc] bg-white p-3 sm:p-4">
      <table className="w-full border-separate border-spacing-1 text-center">
        <thead>
          <tr className="text-[11px] font-bold uppercase tracking-wider text-[#3d4f40]">
            <th className="text-left">Sets</th>
            {sets.map((_, i) => (
              <th key={i}>{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-xl font-bold tabular-nums sm:text-2xl">
          {[partido.equipo1, partido.equipo2].map((eq, row) => (
            <tr key={row}>
              <td className="max-w-[9rem] truncate pr-2 text-left text-xs font-semibold sm:max-w-none sm:text-sm">
                <span
                  className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                  style={{ backgroundColor: eq.color }}
                />
                {eq.jugador1 || "—"} / {eq.jugador2 || "—"}
              </td>
              {sets.map((s, i) => (
                <td key={i} className={`rounded-lg py-1 ${cell(i)}`}>
                  {s[row]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamScoreCard({ color, j1, j2, serv1, serv2, onServ1, onServ2, punto, esPuntoOro, disabled, onPunto }) {
  return (
    <div
      className="flex flex-col rounded-2xl border-2 bg-white p-2 shadow-sm sm:p-4"
      style={{ borderColor: color }}
    >
      <div className="space-y-1.5">
        <JugadorBox nombre={j1} color={color} servicio={serv1} onClick={onServ1} />
        <JugadorBox nombre={j2} color={color} servicio={serv2} onClick={onServ2} />
      </div>
      <button
        type="button"
        onClick={onPunto}
        disabled={disabled}
        className={`mt-2 w-full select-none rounded-xl py-8 text-5xl font-black tabular-nums text-white transition active:scale-[0.98] disabled:opacity-40 sm:mt-3 sm:py-12 sm:text-6xl ${
          esPuntoOro ? "bg-[#8a841f] hover:bg-[#6f6a18]" : "bg-[#2f6b08] hover:bg-[#255506]"
        }`}
        style={{ touchAction: "manipulation" }}
        aria-label={`Sumar punto (${punto})`}
      >
        {punto}
      </button>
    </div>
  );
}

function JugadorBox({ nombre, color, servicio, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-1 rounded-lg px-2 py-2 text-left text-sm transition hover:brightness-95 sm:px-3 sm:text-base"
      style={{ backgroundColor: `${color}26`, touchAction: "manipulation" }}
    >
      <span className="min-w-0 truncate font-semibold">{nombre || "—"}</span>
      {servicio && <CircleDot size={18} className="shrink-0 text-[#2f6b08]" aria-label="Saca" />}
    </button>
  );
}

function EditarModal({ partido, onClose, onSave }) {
  const [form, setForm] = useState({
    torneo: partido.torneo || "",
    cancha: partido.cancha || "",
    etapa: partido.juego.etapa,
    equipo1: { ...partido.equipo1 },
    equipo2: { ...partido.equipo2 },
  });
  const [saving, setSaving] = useState(false);
  const label = "mb-1 block text-xs font-semibold uppercase tracking-wider text-[#3d4f40]";
  const setEq = (k, field, value) => setForm((f) => ({ ...f, [k]: { ...f[k], [field]: value } }));

  const etapas = !form.etapa || ETAPAS.includes(form.etapa) ? ETAPAS : [form.etapa, ...ETAPAS];

  return (
    <Modal open title="Editar datos del partido" onClose={onClose} maxWidth={560}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            await onSave(form);
            onClose();
          } catch {
            setSaving(false);
          }
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Torneo / liga (opcional)</label>
            <input className="ui-field" value={form.torneo} maxLength={80} onChange={(e) => setForm({ ...form, torneo: e.target.value })} />
          </div>
          <div>
            <label className={label}>Cancha (opcional)</label>
            <input className="ui-field" value={form.cancha} maxLength={40} onChange={(e) => setForm({ ...form, cancha: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Instancia</label>
            <select className="ui-field" value={form.etapa} onChange={(e) => setForm({ ...form, etapa: e.target.value })}>
              <option value="">Ninguna</option>
              {etapas.map((et) => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>
        </div>
        {["equipo1", "equipo2"].map((k, idx) => (
          <fieldset key={k} className="rounded-xl border-2 border-[#c5d0bc] p-3">
            <legend className="px-1 text-sm font-bold">Equipo {idx + 1}</legend>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input className="ui-field" value={form[k].jugador1} placeholder="Jugador 1" onChange={(e) => setEq(k, "jugador1", e.target.value)} />
              <input className="ui-field" value={form[k].jugador2} placeholder="Jugador 2" onChange={(e) => setEq(k, "jugador2", e.target.value)} />
              <input type="color" className="h-full w-12 cursor-pointer rounded-lg border-2 border-[#9aaf90]" value={form[k].color} onChange={(e) => setEq(k, "color", e.target.value)} aria-label={`Color equipo ${idx + 1}`} />
            </div>
          </fieldset>
        ))}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function msToTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
