import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, ExternalLink, Share2 } from "lucide-react";
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";
import { tableroUrl } from "../services/api.js";
import { teamLabel } from "./MatchCard.jsx";

export default function ShareModal({ match, onClose }) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState("");
  const url = match?.codigo ? tableroUrl(match.codigo) : "";

  useEffect(() => {
    setCopied(false);
    setQr("");
    if (!url) return;
    QRCode.toDataURL(url, { width: 480, margin: 1, color: { dark: "#1a241c", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [url]);

  if (!match) return null;

  const titulo = `${teamLabel(match.equipo1)} vs ${teamLabel(match.equipo2)}`;
  const texto = `Seguí en vivo ${titulo}${match.cancha ? ` (${match.cancha})` : ""}: ${url}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: "Marcador en vivo", text: texto, url });
    } catch {
      /* cancelado */
    }
  };

  return (
    <Modal open title="Compartir tablero" onClose={onClose}>
      <p className="text-sm font-semibold">{titulo}</p>
      <p className="mb-4 text-xs text-[#3d4f40]">
        {[match.torneo, match.cancha, match.etapa].filter(Boolean).join(" · ")}
      </p>

      <p className="mb-2 text-sm text-[#3d4f40]">
        Cualquiera con este link ve el marcador en vivo (solo lectura). Sirve para la TV de
        la cancha, el celular de los jugadores o el público.
      </p>

      <div className="mb-3 flex items-stretch gap-2">
        <input readOnly value={url} className="ui-field min-w-0 flex-1 font-mono text-sm" onFocus={(e) => e.target.select()} />
        <Button onClick={copy} className="shrink-0">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span className="hidden sm:inline">{copied ? "Copiado" : "Copiar"}</span>
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "#1f8f4e" }}
        >
          WhatsApp
        </a>
        <Button variant="secondary" onClick={() => window.open(url, "_blank")}>
          <ExternalLink size={16} /> Abrir
        </Button>
        {typeof navigator !== "undefined" && navigator.share && (
          <Button variant="secondary" onClick={nativeShare} className="col-span-2 sm:col-span-1">
            <Share2 size={16} /> Más…
          </Button>
        )}
      </div>

      {qr && (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-[#c5d0bc] p-4">
          <img src={qr} alt="Código QR del tablero" className="h-48 w-48 sm:h-56 sm:w-56" />
          <p className="text-center text-xs text-[#3d4f40]">
            Imprimilo y pegalo en la cancha para que el público escanee.
          </p>
          <a
            href={qr}
            download={`tablero-${match.cancha || match.codigo}.png`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2f6b08]"
          >
            <Download size={14} /> Descargar QR
          </a>
        </div>
      )}
    </Modal>
  );
}
