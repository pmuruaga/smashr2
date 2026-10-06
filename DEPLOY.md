# Despliegue — SMASHR (gestión + tableros por partido)

## Cómo funciona

| Pantalla | URL | Quién la usa |
|----------|-----|--------------|
| **Gestión** | `/` (login) | Organizador / administradores |
| **Control de un partido** | `/control/:id` | Quien puntúa ese partido (requiere login) |
| **Tablero de un partido** | `/tablero/:codigo` | Público, TV de la cancha, celulares (solo lectura) |
| **Publicidad** | `/publicidad` | Banners que rotan en todos los tableros |

- Se pueden jugar **varios partidos a la vez**: cada uno tiene su control y su tablero.
- Cada partido tiene un **código** (ej. `q48knec`) que forma su link público. Se comparte desde
  el botón *Compartir* (copiar link, WhatsApp o QR para imprimir en la cancha).
- Los tableros se actualizan en vivo por SSE (`/api/sse/partido/:codigo`).
- Toda escritura de la API exige el token que se obtiene al ingresar con la contraseña.
  Los links de tablero solo permiten **ver**.
- Si dos personas puntúan el mismo partido a la vez, la segunda recibe un aviso y se le carga el
  marcador actual (no se pisan puntos).

Ver también: [VPS.md](./VPS.md).

## Variables de entorno

| Variable | Default | Para qué |
|----------|---------|----------|
| `PORT` | `3001` | Puerto del proceso (en el VPS de prueba: `3010`) |
| `ADMIN_PASSWORD` | `padel2025` | Contraseña de gestión. **Cambiala en producción.** |
| `AUTH_SECRET` | valor fijo de desarrollo | Firma del token de sesión. Poné un texto largo al azar. |

Cambiar `ADMIN_PASSWORD` o `AUTH_SECRET` cierra la sesión de todos los dispositivos.

## Actualizar el VPS actual (PM2 en `/var/www/smashr`, puerto 3010)

```bash
cd /var/www/smashr
# traer el código nuevo (git pull o copiar el tgz y descomprimir encima)
git pull

# backup de la DB + dependencias + schema + build
bash scripts/vps-setup.sh

# reiniciar con las variables nuevas (la primera vez definilas así)
PORT=3010 ADMIN_PASSWORD='la-nueva-clave' AUTH_SECRET='un-texto-largo-al-azar' \
  pm2 restart smashr --update-env
pm2 save
```

Qué hace el cambio de base de datos: `prisma db push` **agrega** columnas (`codigo`, `torneo`,
`cancha`, `version`); no borra datos. Al arrancar, el servidor genera el código de link para los
partidos viejos. El backup queda en `backups/dev.db.FECHA`.

Verificar:

```bash
curl -s http://127.0.0.1:3010/api/health
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3010/api/partido/lista   # 401 = protegido OK
```

Demo opcional con varias canchas: `bash scripts/seed-demo.sh http://127.0.0.1:3010/api 'la-clave'`.

## Desarrollo local (2 procesos)

```bash
npm run install:all
npm run prisma:deploy
npm run dev
```

- Front: http://localhost:5173 — API: http://localhost:3001 (Vite proxyea `/api` y `/uploads`).

## Checklist pre-evento

1. Ingresar a la gestión y crear los partidos. Solo los jugadores son obligatorios; torneo/liga,
   cancha e instancia son opcionales (sirven para mostrarlos en el tablero y filtrar en el panel).
2. En cada partido: *Compartir* → abrir el link en la TV de esa cancha (botón de pantalla completa
   abajo a la derecha) y/o imprimir el QR.
3. Sumar puntos desde el control y confirmar que el tablero cambia al instante.
4. Probar deshacer, calentamiento, descanso, fondo y banners.

## Notas

- **SQLite**: un solo proceso Node (no escalar a varias instancias).
- **Uploads** (`server/uploads/`) y la base (`server/prisma/dev.db`) deben persistir entre deploys.
- Con Nginx delante, dejar `proxy_buffering off;` para que los tableros reciban los cambios en vivo.
