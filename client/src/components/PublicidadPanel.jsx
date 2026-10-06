import { useEffect, useRef, useState } from "react";
import { api } from "../services/api.js";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ImagePlus,
  Trash2,
} from "lucide-react";

/** Mini preview de 2 slots como en el Tablero */
function BannerLivePreview({ banners, intervalMs }) {
  const list = banners.length ? banners : [];
  const [srcs, setSrcs] = useState([]);
  const [opacity, setOpacity] = useState([1, 1]);
  const indexRef = useRef(0);
  const listRef = useRef(list);

  useEffect(() => {
    listRef.current = list;
    if (!list.length) {
      setSrcs([]);
      return;
    }
    setSrcs([list[0], list[Math.min(1, list.length - 1)]]);
    indexRef.current = Math.min(1, list.length - 1);
  }, [list]);

  useEffect(() => {
    if (list.length === 0) return undefined;
    const period = intervalMs || 5000;
    const rotateSlot = (slotIndex) => {
      const items = listRef.current;
      if (!items.length) return;
      setOpacity((prev) => {
        const next = [...prev];
        next[slotIndex] = 0;
        return next;
      });
      setTimeout(() => {
        indexRef.current = (indexRef.current + 1) % items.length;
        const nextSrc = items[indexRef.current];
        setSrcs((prev) => {
          const next = [...prev];
          next[slotIndex] = nextSrc;
          return next;
        });
        setTimeout(() => {
          setOpacity((prev) => {
            const next = [...prev];
            next[slotIndex] = 1;
            return next;
          });
        }, 50);
      }, 400);
    };
    const timer = setInterval(() => {
      rotateSlot(0);
      setTimeout(() => rotateSlot(1), Math.min(2500, period / 2));
    }, period);
    return () => clearInterval(timer);
  }, [list, intervalMs]);

  if (!list.length) {
    return (
      <div className="h-20 rounded-lg bg-court-elevated border border-court-line flex items-center justify-center text-sm text-court-muted">
        Ningún banner habilitado — el strip del tablero se oculta
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 h-24 rounded-lg overflow-hidden bg-black border border-gray-700">
      {srcs.map((src, i) => (
        <div key={i} className="relative bg-[#111] flex items-center justify-center overflow-hidden">
          <img
            src={src}
            alt=""
            className="max-h-full max-w-full object-contain"
            style={{
              opacity: opacity[i],
              transition: "opacity 0.4s ease-in-out",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function PublicidadPanel() {
  const [items, setItems] = useState([]);
  const [intervalMs, setIntervalMs] = useState(5000);
  const [banners, setBanners] = useState([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const applyData = (data) => {
    if (!data) return;
    setItems(data.items || []);
    setIntervalMs(data.intervalMs || 5000);
    setBanners(data.banners || []);
  };

  const refresh = async () => {
    try {
      const res = await api.getBanners();
      applyData(res.data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const persist = async (nextItems, nextInterval) => {
    setSaving(true);
    try {
      const res = await api.updateBanners({
        items: nextItems.map((it, idx) => ({
          id: it.id,
          enabled: it.enabled,
          order: idx,
        })),
        intervalMs: nextInterval ?? intervalMs,
      });
      applyData(res.data);
      setMsg("Playlist actualizada");
    } catch (err) {
      alert(err.message);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const move = async (index, dir) => {
    const next = [...items];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    await persist(next);
  };

  const toggle = async (id) => {
    const next = items.map((it) =>
      it.id === id ? { ...it, enabled: !it.enabled } : it
    );
    setItems(next);
    await persist(next);
  };

  const remove = async (id) => {
    try {
      const res = await api.deleteBanner(id);
      applyData(res.data);
      setMsg("Banner eliminado");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="rounded-2xl border border-court-line bg-court-surface p-4 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg text-court-text">Publicidad (banners)</h3>
          <p className="text-sm text-court-muted">
            Se muestran en los tableros de todos los partidos. Elegí cuáles, el orden y
            el intervalo; los cambios llegan a las pantallas abiertas al instante.
          </p>
        </div>
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-[#2f6b08] px-3 py-2 text-sm font-bold text-white shrink-0 hover:bg-[#255506]">
          <ImagePlus size={16} /> Subir banner
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setMsg("Subiendo…");
              try {
                const res = await api.uploadBanner(file);
                applyData(res.data);
                setMsg("Banner agregado al final (habilitado)");
              } catch (err) {
                setMsg("");
                alert(err.message);
              } finally {
                e.target.value = "";
              }
            }}
          />
        </label>
      </div>

      {msg && <p className="text-sm text-smashr-green font-medium">{msg}</p>}

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-court-muted">
          Preview TV (2 slots)
        </p>
        <BannerLivePreview banners={banners} intervalMs={intervalMs} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2 text-court-muted">
          Intervalo (ms)
          <input
            type="number"
            min={1500}
            step={500}
            value={intervalMs}
            disabled={saving}
            onChange={(e) => setIntervalMs(Number(e.target.value) || 5000)}
            onBlur={() => persist(items, intervalMs)}
            className="ui-field !w-24 !px-2 !py-1"
          />
        </label>
        <span className="text-court-muted">
          {banners.length} activos / {items.length} total
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 rounded-xl border p-2 ${
              item.enabled
                ? "border-court-line bg-court-elevated/40"
                : "border-court-line/60 bg-court-elevated/20 opacity-70"
            }`}
          >
            <img
              src={item.src}
              alt={item.id}
              className="h-14 w-24 shrink-0 rounded-lg border border-court-line object-cover bg-white"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-court-text">{item.id}</p>
              <p className="truncate text-xs text-court-muted">{item.src}</p>
              {item.isDefault && (
                <span className="text-[10px] uppercase text-smashr-gold">default</span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                title="Subir"
                disabled={index === 0 || saving}
                onClick={() => move(index, -1)}
                className="rounded-lg bg-white border border-court-line p-1.5 text-court-text hover:bg-court-elevated disabled:opacity-30"
              >
                <ChevronUp size={16} />
              </button>
              <button
                type="button"
                title="Bajar"
                disabled={index === items.length - 1 || saving}
                onClick={() => move(index, 1)}
                className="rounded-lg bg-white border border-court-line p-1.5 text-court-text hover:bg-court-elevated disabled:opacity-30"
              >
                <ChevronDown size={16} />
              </button>
              <button
                type="button"
                title={item.enabled ? "Deshabilitar" : "Habilitar"}
                disabled={saving}
                onClick={() => toggle(item.id)}
                className={`rounded-lg p-1.5 ${
                  item.enabled
                    ? "bg-smashr-green text-white"
                    : "bg-white border border-court-line text-court-muted"
                }`}
              >
                {item.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              {!item.isDefault && (
                <button
                  type="button"
                  title="Eliminar"
                  onClick={() => remove(item.id)}
                  className="rounded-lg bg-[color:var(--danger)] p-1.5 text-white"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
