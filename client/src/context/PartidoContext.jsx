import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { api } from "../services/api.js";

const PartidoContext = createContext(null);

export function PartidoProvider({ children }) {
  const [partido, setPartido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sseRef = useRef(null);
  const partidoRef = useRef(null);
  const pendingPantallaRef = useRef(null);
  const fetchSeqRef = useRef(0);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    partidoRef.current = partido;
  }, [partido]);

  const fetchPartido = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    try {
      const res = await api.getPartidoActual();
      if (seq !== fetchSeqRef.current) return partidoRef.current;
      let data = res.data;
      if (pendingPantallaRef.current != null && data) {
        data = { ...data, pantalla_actual: pendingPantallaRef.current };
        pendingPantallaRef.current = null;
      }
      setPartido(data);
      setError(null);
      return data;
    } catch (err) {
      if (seq !== fetchSeqRef.current) return partidoRef.current;
      setError(err.message);
      // No borrar un partido ya cargado por un fallo temporal de red
      return partidoRef.current;
    } finally {
      if (seq === fetchSeqRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const connectSSE = () => {
      if (cancelled) return;
      if (sseRef.current) {
        try {
          sseRef.current.close();
        } catch {
          /* ignore */
        }
      }

      const es = new EventSource("/api/sse/events");
      sseRef.current = es;

      es.onopen = () => {
        if (!cancelled) fetchPartido();
      };

      es.onmessage = (event) => {
        if (cancelled) return;
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === "estado-actualizado" || msg.type === "partido-creado") {
          if (msg.data !== undefined) setPartido(msg.data);
        } else if (msg.type === "calentamiento") {
          const actual = partidoRef.current;
          if (!actual) {
            fetchPartido();
            return;
          }
          setPartido({
            ...actual,
            calentamiento: msg.data,
          });
        } else if (msg.type === "descanso") {
          const actual = partidoRef.current;
          if (!actual) {
            fetchPartido();
            return;
          }
          setPartido({
            ...actual,
            descanso: msg.data,
          });
        } else if (msg.type === "pantalla") {
          const pantalla = msg.data?.pantalla ?? "";
          const actual = partidoRef.current;
          if (!actual) {
            pendingPantallaRef.current = pantalla;
            fetchPartido();
            return;
          }
          setPartido({
            ...actual,
            pantalla_actual: pantalla,
          });
        } else if (msg.type === "connected") {
          fetchPartido();
        }
      };

      es.onerror = () => {
        es.close();
        if (sseRef.current === es) sseRef.current = null;
        if (cancelled) return;
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(connectSSE, 2500);
      };
    };

    fetchPartido().then((data) => {
      // Reintento corto si la primera carga llegó vacía (race de arranque)
      if (!cancelled && data == null) {
        setTimeout(() => {
          if (!cancelled && !partidoRef.current) fetchPartido();
        }, 400);
      }
    });
    connectSSE();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      sseRef.current?.close();
      sseRef.current = null;
    };
  }, [fetchPartido]);

  const crearPartido = useCallback(async (data) => {
    const res = await api.crearPartido(data);
    setPartido(res.data);
    return res;
  }, []);

  const actualizarEstado = useCallback(async (data) => {
    setPartido(data);
    const res = await api.actualizarEstado(data);
    return res;
  }, []);

  const setCalentamiento = useCallback(async (activo, fin) => {
    setPartido((prev) =>
      prev
        ? {
            ...prev,
            calentamiento: { activo, fin: fin || 0 },
          }
        : prev
    );
    return api.setCalentamiento(activo, fin);
  }, []);

  const setDescanso = useCallback(async (activo, segundos, fin) => {
    setPartido((prev) =>
      prev
        ? {
            ...prev,
            descanso: {
              activo,
              segundos: segundos || 0,
              fin: fin || 0,
            },
          }
        : prev
    );
    return api.setDescanso(activo, segundos, fin);
  }, []);

  const setPantalla = useCallback(async (pantalla) => {
    setPartido((prev) =>
      prev
        ? {
            ...prev,
            pantalla_actual: pantalla,
          }
        : prev
    );
    return api.setPantalla(pantalla);
  }, []);

  const aplicarPantallaLocal = useCallback((pantalla) => {
    setPartido((prev) =>
      prev
        ? {
            ...prev,
            pantalla_actual: pantalla,
          }
        : prev
    );
  }, []);

  const aplicarEstadoLocal = useCallback((data) => {
    setPartido(data);
  }, []);

  const listarPartidos = useCallback(async () => {
    const res = await api.listarPartidos();
    return res.data || [];
  }, []);

  const activarPartido = useCallback(async (id) => {
    const res = await api.activarPartido(id);
    setPartido(res.data);
    return res;
  }, []);

  return (
    <PartidoContext.Provider
      value={{
        partido,
        loading,
        error,
        fetchPartido,
        crearPartido,
        actualizarEstado,
        setCalentamiento,
        setDescanso,
        setPantalla,
        aplicarPantallaLocal,
        aplicarEstadoLocal,
        listarPartidos,
        activarPartido,
      }}
    >
      {children}
    </PartidoContext.Provider>
  );
}

export function usePartido() {
  return useContext(PartidoContext);
}
