import { createPortal } from "react-dom";
import Button from "./Button.jsx";

export default function ConfirmNewMatchModal({
  open,
  activeLabel,
  onCancel,
  onConfirm,
  confirmLabel = "Sí, crear otro partido",
}) {
  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      style={{ backgroundColor: "rgba(26, 36, 28, 0.5)" }}
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-new-match-title"
        className="w-full max-w-md rounded-2xl p-5 shadow-2xl sm:p-6"
        style={{
          backgroundColor: "#ffffff",
          color: "#1a241c",
          border: "2px solid #2f6b08",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-new-match-title"
          className="text-xl font-bold tracking-tight"
          style={{ color: "#1a241c" }}
        >
          ¿Crear otro partido?
        </h2>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "#3d4f40" }}>
          Hay un partido en curso
          {activeLabel ? (
            <>
              : <strong style={{ color: "#1a241c" }}>{activeLabel}</strong>
            </>
          ) : null}
          .
        </p>
        <ul
          className="mt-3 list-disc space-y-1.5 pl-5 text-sm"
          style={{ color: "#3d4f40" }}
        >
          <li>La TV y el control pasarán al partido nuevo.</li>
          <li>El actual queda guardado; lo podés reactivar en recientes.</li>
        </ul>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button variant="primary" onClick={onConfirm} className="w-full sm:w-auto">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
