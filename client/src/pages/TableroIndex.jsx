import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usePartidosLista } from "../hooks/usePartidosLista.js";
import { teamLabel } from "../components/MatchCard.jsx";

function ListaTableros() {
  const { lista, loading } = usePartidosLista();
  const enCurso = lista.filter((m) => !m.finalizado);

  if (loading) return <p className="text-white/70">Cargando…</p>;
  if (!enCurso.length) return <p className="text-white/70">No hay partidos en curso.</p>;

  return (
    <ul className="w-full max-w-xl space-y-2">
      {enCurso.map((m) => (
        <li key={m.id}>
          <Link
            to={`/tablero/${m.codigo}`}
            className="flex items-center gap-3 rounded-xl bg-white/10 p-3 text-left transition hover:bg-white/20"
          >
            {m.cancha && (
              <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-bold uppercase text-black">
                {m.cancha}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate">
              {teamLabel(m.equipo1)} vs {teamLabel(m.equipo2)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** /tablero sin código: cada partido tiene su link propio. */
export default function TableroIndex() {
  const { isLoggedIn } = useAuth();
  return (
    <div className="board-shell flex min-h-[100dvh] flex-col items-center justify-center gap-6 p-6 text-center text-white">
      <img src="/assets/icono.webp" alt="SMASHR" className="h-20 w-20 rounded-full" />
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Elegí qué partido mostrar</h1>
        <p className="mt-2 text-white/70">
          {isLoggedIn
            ? "Cada partido tiene su propio tablero. Abrí el que quieras mostrar en esta pantalla."
            : "Cada partido tiene su propio link. Pedíselo al organizador o escaneá el QR de la cancha."}
        </p>
      </div>
      {isLoggedIn ? (
        <ListaTableros />
      ) : (
        <Link to="/login" className="text-sm text-white/60 underline">
          Soy organizador
        </Link>
      )}
    </div>
  );
}
