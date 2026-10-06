#!/usr/bin/env bash
# Setup / update en el VPS — ejecutar DENTRO de la carpeta del proyecto
set -euo pipefail

echo "==> Node: $(node -v)"

if [ -f server/prisma/dev.db ]; then
  mkdir -p backups
  cp server/prisma/dev.db "backups/dev.db.$(date +%Y%m%d-%H%M%S)"
  echo "==> Backup de la base en backups/"
fi

echo "==> Instalando dependencias..."
npm run install:all

echo "==> Base de datos..."
npm run prisma:deploy

echo "==> Build del front..."
npm run build

mkdir -p server/uploads/banners

echo ""
echo "Listo. Reiniciá el proceso para tomar los cambios:"
echo "  pm2 restart smashr --update-env"
echo ""
echo "Primera vez con PM2:"
echo "  PORT=3010 ADMIN_PASSWORD='...' AUTH_SECRET='...' pm2 start server/src/server.js --name smashr -- --prod"
echo "  pm2 save && pm2 startup"
