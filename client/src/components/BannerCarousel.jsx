import { useEffect, useRef, useState } from "react";

const FALLBACK = [
  "/assets/banner1.jfif",
  "/assets/banner2.jfif",
  "/assets/banner3.jfif",
  "/assets/banner4.jfif",
  "/assets/banner5.jfif",
  "/assets/banner6.jfif",
];

export default function BannerCarousel() {
  const [banners, setBanners] = useState(FALLBACK);
  const [intervalMs, setIntervalMs] = useState(5000);
  const [srcs, setSrcs] = useState([FALLBACK[0], FALLBACK[1]]);
  const [opacity, setOpacity] = useState([1, 1]);
  const indexRef = useRef(1);
  const bannersRef = useRef(FALLBACK);
  const intervalRef = useRef(5000);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/publicidad/banners")
        .then((r) => r.json())
        .then((res) => {
          if (cancelled) return;
          const list = Array.isArray(res?.data?.banners) ? res.data.banners : FALLBACK;
          const ms = Number(res?.data?.intervalMs) > 0 ? Number(res.data.intervalMs) : 5000;
          intervalRef.current = ms;
          setIntervalMs(ms);

          const same =
            list.length === bannersRef.current.length &&
            list.every((u, i) => u === bannersRef.current[i]);
          if (same) return;

          bannersRef.current = list;
          setBanners(list);
          if (list.length === 0) {
            setSrcs([]);
            return;
          }
          setSrcs([list[0], list[Math.min(1, list.length - 1)]]);
          indexRef.current = Math.min(1, list.length - 1);
        })
        .catch(() => {});
    };
    load();
    const poll = setInterval(load, 60000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("smashr:publicidad", onFocus);
    return () => {
      cancelled = true;
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("smashr:publicidad", onFocus);
    };
  }, []);

  useEffect(() => {
    bannersRef.current = banners;
  }, [banners]);

  useEffect(() => {
    if (banners.length === 0) return undefined;

    const rotateSlot = (slotIndex) => {
      const list = bannersRef.current;
      if (!list.length) return;

      setOpacity((prev) => {
        const next = [...prev];
        next[slotIndex] = 0;
        return next;
      });

      setTimeout(() => {
        indexRef.current = (indexRef.current + 1) % list.length;
        const nextSrc = list[indexRef.current];
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
      }, 500);
    };

    const period = intervalMs || 5000;
    const timer = setInterval(() => {
      rotateSlot(0);
      setTimeout(() => rotateSlot(1), Math.min(2500, period / 2));
    }, period);

    return () => clearInterval(timer);
  }, [banners, intervalMs]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <div id="banner-area">
      {srcs.map((src, i) => (
        <div className="banner-slot" key={i}>
          <img
            src={src}
            alt={`Banner ${i + 1}`}
            style={{
              opacity: opacity[i],
              transition: "opacity 0.5s ease-in-out",
            }}
          />
        </div>
      ))}
    </div>
  );
}
