import crypto from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "padel2025";
// Cambiar ADMIN_PASSWORD o AUTH_SECRET invalida todas las sesiones abiertas.
const AUTH_SECRET = process.env.AUTH_SECRET || "smashr-local-secret";

const TOKEN = crypto
  .createHmac("sha256", AUTH_SECRET)
  .update(`admin:${ADMIN_PASSWORD}`)
  .digest("hex");

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function checkPassword(password) {
  return safeEqual(password || "", ADMIN_PASSWORD);
}

export function issueToken() {
  return TOKEN;
}

export function isValidToken(token) {
  return Boolean(token) && safeEqual(token, TOKEN);
}

function tokenFromRequest(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  if (typeof req.query?.token === "string") return req.query.token;
  return "";
}

export function requireAdmin(req, res, next) {
  if (isValidToken(tokenFromRequest(req))) return next();
  res.status(401).json({ status: "error", message: "Sesión vencida. Volvé a ingresar." });
}
