const BASE = "/api";
export const TOKEN_KEY = "smashr_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function handle(res) {
  const body = await res.json().catch(() => ({ message: "Error de red" }));
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new Event("smashr:unauthorized"));
    throw new ApiError(body.message || `HTTP ${res.status}`, res.status, body.data);
  }
  return body;
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...options.headers },
  });
  return handle(res);
}

async function upload(url, file) {
  const form = new FormData();
  form.append("imagen", file);
  const res = await fetch(`${BASE}${url}`, { method: "POST", body: form, headers: authHeaders() });
  return handle(res);
}

const json = (method, body) => ({ method, body: JSON.stringify(body ?? {}) });

export const api = {
  login: (password) => request("/auth/login", json("POST", { password })),
  checkAuth: () => request("/auth/check"),

  getTablero: (codigo) => request(`/tablero/${encodeURIComponent(codigo)}`),

  listarPartidos: (estado = "todos") => request(`/partido/lista?estado=${estado}`),
  getPartido: (id) => request(`/partido/${id}`),
  crearPartido: (data) => request("/partido/crear", json("POST", data)),
  editarPartido: (id, data) => request(`/partido/${id}`, json("PATCH", data)),
  eliminarPartido: (id) => request(`/partido/${id}`, { method: "DELETE" }),
  actualizarEstado: (id, data) => request(`/partido/${id}/estado`, json("PUT", data)),
  deshacerAccion: (id) => request(`/partido/${id}/deshacer`, { method: "POST" }),
  setCalentamiento: (id, activo, fin) =>
    request(`/partido/${id}/calentamiento`, json("PUT", { activo, fin })),
  setDescanso: (id, activo, segundos, fin) =>
    request(`/partido/${id}/descanso`, json("PUT", { activo, segundos, fin })),
  setPantalla: (id, pantalla) => request(`/partido/${id}/pantalla`, json("PUT", { pantalla })),
  uploadPantalla: (id, file) => upload(`/partido/${id}/upload-pantalla`, file),

  getBanners: () => request("/publicidad/banners"),
  updateBanners: (payload) => request("/publicidad/banners", json("PATCH", payload)),
  uploadBanner: (file) => upload("/publicidad/banners", file),
  deleteBanner: (id) =>
    request(`/publicidad/banners/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export function tableroUrl(codigo) {
  return `${window.location.origin}/tablero/${codigo}`;
}
