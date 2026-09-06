const BASE = "/api";

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Error de red" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getPartidoActual: () => request("/partido/actual"),
  listarPartidos: () => request("/partido/lista"),
  activarPartido: (id) =>
    request(`/partido/${id}/activar`, { method: "PUT" }),
  crearPartido: (data) =>
    request("/partido/crear", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  actualizarEstado: (data) =>
    request("/partido/estado", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deshacerAccion: () =>
    request("/partido/deshacer", { method: "POST" }),
  getHistorial: () => request("/partido/historial"),
  setCalentamiento: (activo, fin) =>
    request("/partido/calentamiento", {
      method: "PUT",
      body: JSON.stringify({ activo, fin }),
    }),
  setDescanso: (activo, segundos, fin) =>
    request("/partido/descanso", {
      method: "PUT",
      body: JSON.stringify({ activo, segundos, fin }),
    }),
  setPantalla: (pantalla) =>
    request("/partido/pantalla", {
      method: "PUT",
      body: JSON.stringify({ pantalla }),
    }),
  uploadPantalla: async (file) => {
    const form = new FormData();
    form.append("imagen", file);
    const res = await fetch(`${BASE}/partido/upload-pantalla`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error de red" }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  },
  getBanners: () => request("/publicidad/banners"),
  updateBanners: (payload) =>
    request("/publicidad/banners", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  uploadBanner: async (file) => {
    const form = new FormData();
    form.append("imagen", file);
    const res = await fetch(`${BASE}/publicidad/banners`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error de red" }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  },
  deleteBanner: (id) =>
    request(`/publicidad/banners/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
