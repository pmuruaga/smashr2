# Script para limpiar completamente el caché y reiniciar servidores

Write-Host "=== Limpiando caché y reiniciando servidores ===" -ForegroundColor Cyan

# 1. Matar todos los procesos de Node
Write-Host "`n1. Deteniendo procesos de Node..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. Limpiar caché de Vite
Write-Host "`n2. Limpiando caché de Vite..." -ForegroundColor Yellow
Remove-Item -Path "client/node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "client/.vite" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Limpiar dist
Write-Host "`n3. Limpiando carpeta dist..." -ForegroundColor Yellow
Remove-Item -Path "client/dist" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Reiniciar servidor backend
Write-Host "`n4. Iniciando servidor backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; node src/server.js"
Start-Sleep -Seconds 3

# 5. Reiniciar servidor frontend
Write-Host "`n5. Iniciando servidor frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; npx vite --force --clearScreen false"
Start-Sleep -Seconds 5

Write-Host "`n=== ✅ Servidores iniciados ===" -ForegroundColor Green
Write-Host "`nFrontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "`nAbre el navegador en MODO INCÓGNITO y ve a:" -ForegroundColor Yellow
Write-Host "http://localhost:5173/tablero" -ForegroundColor White
Write-Host "`nPresiona Ctrl+C para salir de este script" -ForegroundColor Gray

# Mantener el script abierto
Read-Host "`nPresiona Enter para cerrar"
