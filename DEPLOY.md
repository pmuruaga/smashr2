# Despliegue — Torneo Smaash (control + tablero TV)

El sistema tiene **dos pantallas** que deben verse al mismo tiempo:

| Pantalla | URL | Quién la usa |
|----------|-----|--------------|
| **Gestión / control** | `/` → login → control | Operador de cancha |
| **Tablero TV (público)** | `/tablero` | Público / proyector / TV |

Ambas se sincronizan por **SSE** (`/api/sse/events`). En el evento: abrí el control en una notebook/tablet y el tablero en la TV (pantalla completa F11).

Ver también: [VPS.md](./VPS.md) (pasos cortos para subir a tu VPS y mandarle el link al cliente).

## Requisitos

- Node.js 20+
- Espacio en disco escribible (SQLite + uploads de banners/fondos)

## Instalación (servidor / VPS)

```bash
npm run install:all
npm run prisma:deploy
npm run build
npm start
```

`prisma:deploy` aplica el schema a SQLite (`db push`) y regenera el client.

Queda un solo proceso en el puerto `PORT` (default **3001**) que sirve:

- API: `/api/*`
- Uploads: `/uploads/*`
- Front (build Vite): `/`, `/tablero`, etc.

Abrí:

- Gestión: `http://TU_HOST:3001/`
- TV: `http://TU_HOST:3001/tablero`

## Variables de entorno

Creá `server/.env` si hace falta (Prisma ya usa SQLite por defecto):

```
PORT=3001
DATABASE_URL="file:./dev.db"
```

Opcional: cambiar la ruta de la DB a un volumen persistente en el host.

## Desarrollo local (2 procesos)

```bash
npm run install:all
npm run prisma:deploy
npm run dev
```

- Front: http://localhost:5173  
- API: http://localhost:3001  
- Vite proxyea `/api` y `/uploads` al backend.

## Checklist pre-evento

1. Login en gestión (`padel2025` por defecto — cambialo en `client/src/context/AuthContext.jsx` antes de producción).
2. Crear partido de prueba.
3. Abrir **dos ventanas**: control + `/tablero`.
4. Sumar puntos y confirmar que la TV actualiza al instante.
5. Probar calentamiento, descanso, deshacer, banners y fondo.
6. En la TV: F11 (pantalla completa).

## Notas importantes

- **Auth**: la contraseña solo protege el front; la API no tiene auth. Usar en red controlada (LAN del club) o poner un reverse proxy con basic auth.
- **SQLite**: no es ideal para multi-instancia; un solo proceso Node.
- **Uploads**: `server/uploads/` debe persistir entre deploys (volumen o backup).
- Este producto es **control de partido + marcador TV**, no brackets/fixture completo de torneo.
