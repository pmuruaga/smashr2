const styles = {
  en_juego: "bg-[#c43c2c] text-white",
  finalizado: "bg-[#dfe6db] text-[#3d4f40]",
  calentamiento: "bg-[#c45c12] text-white",
  descanso: "bg-[#0b6e99] text-white",
};

const labels = {
  en_juego: "En vivo",
  finalizado: "Finalizado",
  calentamiento: "Calentamiento",
  descanso: "Descanso",
};

export default function StatusBadge({ status, className = "" }) {
  const key = styles[status] ? status : "en_juego";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${styles[key]} ${className}`}
    >
      {key === "en_juego" && <span className="live-dot" aria-hidden />}
      {labels[key]}
    </span>
  );
}
