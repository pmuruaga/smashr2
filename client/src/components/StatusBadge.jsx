const styles = {
  en_juego: "bg-[#2f6b08] text-white",
  finalizado: "bg-[#dfe6db] text-[#3d4f40]",
  calentamiento: "bg-[#c45c12] text-white",
  descanso: "bg-[#0b6e99] text-white",
  activo: "bg-[#c9a227] text-[#1a241c]",
};

const labels = {
  en_juego: "En juego",
  finalizado: "Finalizado",
  calentamiento: "Calentamiento",
  descanso: "Descanso",
  activo: "Activo en TV",
};

export default function StatusBadge({ status, className = "" }) {
  const key = styles[status] ? status : "en_juego";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${styles[key]} ${className}`}
    >
      {labels[key]}
    </span>
  );
}
