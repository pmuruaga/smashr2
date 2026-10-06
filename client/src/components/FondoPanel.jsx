import { useState } from "react";
import Button from "./Button.jsx";
import { ImagePlus, RotateCcw } from "lucide-react";

/** Fondo del tablero de UN partido. */
export default function FondoPanel({ pantalla, onUpload, onReset }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3 rounded-2xl border-2 border-[#c5d0bc] bg-white p-4 sm:p-5">
      <div>
        <h3 className="font-bold">Fondo del tablero</h3>
        <p className="mt-0.5 text-sm text-[#3d4f40]">
          Imagen de fondo solo para este partido (por ejemplo, el logo del torneo o del
          sponsor de la cancha). Ideal horizontal 16:9.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div
          className="aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:w-48"
          style={{
            border: "2px solid #c5d0bc",
            background: pantalla
              ? `center / cover no-repeat url("${pantalla}")`
              : "linear-gradient(135deg, #0f3b44 0%, #1d1d2b 55%, #5a1f2c 100%)",
          }}
          aria-label={pantalla ? "Fondo actual" : "Fondo por defecto"}
        />
        <div className="flex flex-wrap gap-2">
          <label
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-white ${busy ? "opacity-60" : ""}`}
            style={{ backgroundColor: "#2f6b08" }}
          >
            <ImagePlus size={16} /> {pantalla ? "Cambiar fondo" : "Subir fondo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                setMsg("Subiendo…");
                try {
                  await onUpload(file);
                  setMsg("Fondo aplicado en el tablero.");
                } catch (err) {
                  setMsg(`No se pudo subir: ${err.message}`);
                } finally {
                  setBusy(false);
                  e.target.value = "";
                }
              }}
            />
          </label>
          {pantalla && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onReset();
                  setMsg("Se volvió al fondo por defecto.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <RotateCcw size={16} /> Quitar fondo
            </Button>
          )}
        </div>
      </div>
      {msg && <p className="text-sm font-medium">{msg}</p>}
    </div>
  );
}
