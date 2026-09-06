# Torneo Smaash - React + Vite + Express + Prisma + SQLite

Migración del sistema de gestión de torneos de pádel desde vanilla JS/PHP a un stack moderno.

## 🚀 Inicio Rápido

```bash
# Instalar todas las dependencias
npm run install:all

# Crear / aplicar la base de datos SQLite
npm run prisma:deploy

# Desarrollo (frontend + backend)
npm run dev
```

## 📦 Producción (un solo puerto)

```bash
npm run install:all
npm run prisma:deploy
npm run build
npm start
```

Ver guía completa: [DEPLOY.md](./DEPLOY.md)

## 🔧 URLs de Desarrollo

- **Gestión (React):** http://localhost:5173
- **Backend (Express API):** http://localhost:3001
- **Tablero TV (público):** http://localhost:5173/tablero

En producción (`npm start`): todo en el mismo host/puerto (`PORT`, default 3001).

## 🖥️ Dos pantallas a la vez

1. **Operador:** login → home → puntuar (`/control`)
2. **Público / TV:** `/tablero` (sin login), idealmente en otra pantalla o proyector

La sincronización es en tiempo real por Server-Sent Events (SSE).

## 🔐 Autenticación

Contraseña por defecto: `padel2025` (configurable en `client/src/context/AuthContext.jsx`)

## 📋 Funcionalidades

- ✅ Creación de partidos con configuración personalizable
- ✅ Sistema de puntuación completo (puntos, games, sets)
- ✅ Tie-break tradicional y Super tie-break
- ✅ Punto de Oro
- ✅ Gestión de servicios y rotación automática
- ✅ Función deshacer
- ✅ Calentamiento con cuenta regresiva (5 min)
- ✅ Descansos configurables (90s / 2min)
- ✅ Tablero en tiempo real (SSE)
- ✅ Pantalla de ganador con animación
- ✅ Banners publicitarios
- ✅ Autenticación simple
- ✅ Responsive design

## 🔄 Sincronización en Tiempo Real

Se reemplazó el polling de 750ms por **Server-Sent Events (SSE)**, que permite:
- Actualización instantánea del tablero al cambiar el marcador
- Menor carga del servidor
- Notificación de calentamiento/descanso en tiempo real
