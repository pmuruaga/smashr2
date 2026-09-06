import { useEffect, useState } from "react";

const MEDIA = [
  "/assets/contenidocalentamiento/adidas.mp4",
  "/assets/contenidocalentamiento/banner2.jpg",
  "/assets/contenidocalentamiento/nike.mp4",
  "/assets/contenidocalentamiento/coca.jpg",
  "/assets/contenidocalentamiento/pringles.mp4",
];

function isVideo(src) {
  return /\.(mp4|webm|ogg)$/i.test(src);
}

export default function MediaRotator({ intervalMs = 30000 }) {
  const [index, setIndex] = useState(0);
  const src = MEDIA[index % MEDIA.length];

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MEDIA.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  if (isVideo(src)) {
    return (
      <video
        key={src}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        style={{
          maxWidth: "90vw",
          maxHeight: "22vh",
          objectFit: "contain",
          border: "none",
        }}
      />
    );
  }

  return (
    <img
      key={src}
      src={src}
      alt="Publicidad"
      style={{
        maxWidth: "90vw",
        maxHeight: "22vh",
        objectFit: "contain",
        border: "none",
      }}
    />
  );
}
