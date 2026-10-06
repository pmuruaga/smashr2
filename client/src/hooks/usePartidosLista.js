import { useCallback, useEffect, useState } from "react";
import { api, getToken } from "../services/api.js";
import { useLiveStream } from "./useLiveStream.js";

/** Lista de partidos para gestión, actualizada en vivo. */
export function usePartidosLista() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api.listarPartidos("todos");
      setLista(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const token = getToken();
  useLiveStream(token ? `/api/sse/lista?token=${encodeURIComponent(token)}` : null, {
    onOpen: refresh,
    onMessage: (msg) => {
      if (msg.type === "partido" && msg.data) {
        setLista((prev) => [msg.data, ...prev.filter((p) => p.id !== msg.data.id)]);
      } else if (msg.type === "eliminado") {
        setLista((prev) => prev.filter((p) => p.id !== msg.data?.id));
      }
    },
  });

  const quitar = useCallback((id) => {
    setLista((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { lista, loading, error, refresh, quitar };
}
