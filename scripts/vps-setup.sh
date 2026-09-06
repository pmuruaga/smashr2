#!/usr/bin/env bash
# Setup / update en el VPS — ejecutar DENTRO de la carpeta del proyecto
set -euo pipefail

echo "==> Node: $(node -v)"
echo "==> Instalando dependencias..."
npm run install:all

echo "==> Base de datos..."
npm run prisma:deploy

echo "==> Build del front..."
npm run build

mkdir -p server/uploads/banners

echo ""
echo "Listo. Para arrancar:"
echo "  npm start"
echo ""
echo "O con PM2 (recomendado, queda vivo):"
echo "  npm i -g pm2"
echo "  pm2 start server/src/server.js --name smashr -- --prod"
echo "  pm2 save && pm2 startup"
echo ""
echo "URLs (reemplazá IP o dominio):"
echo "  Gestión:  http://TU_IP:3001/"
echo "  Tablero:  http://TU_IP:3001/tablero"
echo "  Password: padel2025"
