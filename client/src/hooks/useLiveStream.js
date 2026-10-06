import { useEffect, useRef } from "react";

/**
 * EventSource con reconexión automática. `onMessage` recibe el JSON ya parseado;
 * `onOpen` se llama en cada (re)conexión para resincronizar.
 */
export function useLiveStream(url, { onMessage, onOpen }) {
  const handlers = useRef({ onMessage, onOpen });
  handlers.current = { onMessage, onOpen };

  useEffect(() => {
    if (!url) return undefined;
    let es = null;
    let timer = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      es = new EventSource(url);
      es.onopen = () => handlers.current.onOpen?.();
      es.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        handlers.current.onMessage?.(msg);
      };
      es.onerror = () => {
        es.close();
        if (closed) return;
        clearTimeout(timer);
        timer = setTimeout(connect, 3000);
      };
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") handlers.current.onOpen?.();
    };

    connect();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      closed = true;
      clearTimeout(timer);
      es?.close();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [url]);
}
