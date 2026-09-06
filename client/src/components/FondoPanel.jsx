import { useState } from "react";
import { api } from "../services/api.js";
import { usePartido } from "../context/PartidoContext.jsx";
import Button from "./Button.jsx";
import { ExternalLink, ImagePlus } from "lucide-react";

/** Subir / restaurar fondo del tablero TV */
export default function FondoPanel({ compact = false }) {
  const { partido, setPantalla, aplicarPantallaLocal } = usePartido();
  const [fondoMsg, setFondoMsg] = useState("");

  if (!partido) {
    return (
      <div
        className="rounded-2xl border-2 border-dashed p-4 text-sm"
        style={{
          borderColor: "#9aaf90",
          backgroundColor: "#ffffff",
          color: "#3d4f40",
        }}
      >
        Activá o creá un partido para cambiar el fondo de la TV.
      </div>
    );
  }

  return (
    <div
      id="fondo-tv"
      className={`rounded-2xl border-2 shadow-sm ${compact ? "p-3" : "p-4 sm:p-5"} space-y-3`}
      style={{ borderColor: "#9aaf90", backgroundColor: "#ffffff" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            className={`font-bold ${compact ? "text-base" : "text-base sm:text-lg"}`}
            style={{ color: "#1a241c" }}
          >
            Fondo del tablero (TV)
          </h3>
          {!compact && (
            <p className="mt-0.5 text-sm" style={{ color: "#3d4f40" }}>
              Subí una imagen para el fondo de la pantalla del partido activo.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: "#2f6b08" }}
          >
            <ImagePlus size={16} /> Subir fondo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFondoMsg("Subiendo…");
                try {
                  const res = await api.uploadPantalla(file);
                  if (!res?.url) throw new Error("Sin URL");
                  aplicarPantallaLocal(res.url);
                  setFondoMsg("Fondo aplicado en la TV.");
                } catch (err) {
                  setFondoMsg("");
                  alert(`No se pudo subir el fondo: ${err.message}`);
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </label>
          <Button
            variant="secondary"
            onClick={async () => {
              await setPantalla("");
              setFondoMsg("Fondo por defecto restaurado");
            }}
          >
            Fondo default
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.open("/tablero", "_blank")}
          >
            <ExternalLink size={14} /> Ver TV
          </Button>
        </div>
      </div>

      {(fondoMsg || partido.pantalla_actual) && (
        <div className="flex items-start gap-4">
          {partido.pantalla_actual ? (
            <img
              src={partido.pantalla_actual}
              alt="Fondo actual"
              className="h-24 w-40 shrink-0 rounded-lg object-cover"
              style={{ border: "2px solid #c5d0bc", backgroundColor: "#eef3ea" }}
            />
          ) : null}
          <div className="text-sm">
            <p className="font-medium" style={{ color: "#1a241c" }}>
              {fondoMsg || "Fondo personalizado activo"}
            </p>
            {partido.pantalla_actual && (
              <p className="mt-1 break-all text-xs" style={{ color: "#5a6b5c" }}>
                {partido.pantalla_actual}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
