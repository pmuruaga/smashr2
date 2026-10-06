import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api.js";
import { useLiveStream } from "./useLiveStream.js";

/**
 * Estado en vivo de UN partido.
 * - `{ id }`: modo gestión (lectura + escritura, requiere login).
 * - `{ codigo }`: modo tablero público (solo lectura).
 *
 * Las escrituras de marcador se envían en cola con el número de versión; si otro
 * dispositivo puntuó en el medio, el servidor responde 409 y se carga lo actual.
 */
export function usePartidoLive({ id, codigo }) {
  const [partido, setPartido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eliminado, setEliminado] = useState(false);
  const [aviso, setAviso] = useState("");

  const partidoRef = useRef(null);
  const versionRef = useRef(-1);
  const queueRef = useRef([]);
  const sendingRef = useRef(false);
  const busyRef = useRef(0);
  const idleWaitersRef = useRef([]);

  const commit = useCallback((data) => {
    if (!data) return;
    partidoRef.current = data;
    versionRef.current = data.version ?? versionRef.current;
    setPartido(data);
  }, []);

  const isIdle = () => !sendingRef.current && queueRef.current.length === 0 && busyRef.current === 0;

  const fetchPartido = useCallback(async () => {
    try {
      const res = id ? await api.getPartido(id) : await api.getTablero(codigo);
      if (isIdle() && (res.data?.version ?? 0) >= versionRef.current) commit(res.data);
      setError(null);
    } catch (err) {
      if (err.status === 404) {
        setError("not_found");
        partidoRef.current = null;
        setPartido(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [id, codigo, commit]);

  useEffect(() => {
    setLoading(true);
    setEliminado(false);
    versionRef.current = -1;
    fetchPartido();
  }, [fetchPartido]);

  const streamCodigo = codigo || partido?.codigo;
  useLiveStream(streamCodigo ? `/api/sse/partido/${encodeURIComponent(streamCodigo)}` : null, {
    onOpen: fetchPartido,
    onMessage: (msg) => {
      if (msg.type === "estado" && msg.data) {
        if (isIdle() && msg.data.version >= versionRef.current) commit(msg.data);
      } else if (msg.type === "eliminado") {
        setEliminado(true);
      } else if (msg.type === "publicidad") {
        window.dispatchEvent(new Event("smashr:publicidad"));
      }
    },
  });

  const pid = id || partido?.id;

  const flushIdle = () => {
    if (isIdle()) idleWaitersRef.current.splice(0).forEach((resolve) => resolve());
  };

  const pump = useCallback(async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    while (queueRef.current.length) {
      const datos = queueRef.current[0];
      try {
        const res = await api.actualizarEstado(pid, { ...datos, version: versionRef.current });
        queueRef.current.shift();
        versionRef.current = res.data?.version ?? versionRef.current;
        if (queueRef.current.length === 0) commit(res.data);
      } catch (err) {
        queueRef.current = [];
        if (err.status === 409 && err.data) {
          versionRef.current = -1;
          commit(err.data);
          setAviso(err.message);
        } else {
          setAviso(`No se pudo guardar: ${err.message}`);
          versionRef.current = -1;
          sendingRef.current = false;
          await fetchPartido();
        }
      }
    }
    sendingRef.current = false;
    flushIdle();
  }, [pid, commit, fetchPartido]);

  const whenIdle = () =>
    isIdle() ? Promise.resolve() : new Promise((resolve) => idleWaitersRef.current.push(resolve));

  /** Cambio de marcador (punto, saque). Se aplica al instante y se envía en cola. */
  const enviarEstado = useCallback(
    (datos) => {
      partidoRef.current = datos;
      setPartido(datos);
      queueRef.current.push(datos);
      pump();
    },
    [pump]
  );

  /** Acciones puntuales: esperan la cola y aplican la respuesta del servidor. */
  const run = useCallback(
    async (fn) => {
      await whenIdle();
      busyRef.current++;
      try {
        const res = await fn(pid);
        if (res?.data) {
          versionRef.current = -1;
          commit(res.data);
        }
        return res;
      } catch (err) {
        setAviso(err.message);
        throw err;
      } finally {
        busyRef.current--;
        flushIdle();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pid, commit]
  );

  const actions = {
    enviarEstado,
    deshacer: () => run((i) => api.deshacerAccion(i)),
    setCalentamiento: (activo, fin) => run((i) => api.setCalentamiento(i, activo, fin)),
    setDescanso: (activo, segundos, fin) => run((i) => api.setDescanso(i, activo, segundos, fin)),
    setPantalla: (pantalla) => run((i) => api.setPantalla(i, pantalla)),
    uploadPantalla: (file) => run((i) => api.uploadPantalla(i, file)),
    editar: (data) => run((i) => api.editarPartido(i, data)),
  };

  return {
    partido,
    partidoRef,
    loading,
    error,
    eliminado,
    aviso,
    limpiarAviso: () => setAviso(""),
    refetch: fetchPartido,
    ...actions,
  };
}
