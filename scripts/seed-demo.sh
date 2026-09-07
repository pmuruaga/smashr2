#!/usr/bin/env bash
# Carga partidos de demo en el Smashr ya corriendo (localhost).
# Uso en el VPS:  cd /var/www/smashr && bash scripts/seed-demo.sh
set -euo pipefail
BASE="${1:-http://127.0.0.1:3010/api}"

curl -s -X PUT "$BASE/partido/descanso" \
  -H 'Content-Type: application/json' \
  -d '{"activo":false,"segundos":0,"fin":0}' >/dev/null

create() {
  local payload="$1"
  curl -s -X POST "$BASE/partido/crear" \
    -H 'Content-Type: application/json' \
    -d "$payload"
}

echo "==> Final (terminado)"
R=$(create '{
  "equipo1":{"jugador1":"Del Potro","jugador2":"Nalbandian","color":"#17A2B8"},
  "equipo2":{"jugador1":"Vilas","jugador2":"Gaudio","color":"#28A745"},
  "etapa":"Final",
  "configuracion":{"cantidadSets":3,"gamesPorSet":6,"puntoOro":false,"ultimoPuntoTieBreak":100,"ultimoSetTieBreak":false,"ultimoGameSuperTB":100}
}')
# marcar finalizado 6-4 3-6 6-2
curl -s -X PUT "$BASE/partido/estado" -H 'Content-Type: application/json' -d "$(node -e '
const d=JSON.parse(process.argv[1]).data;
d.puntos.sets=[[6,4],[3,6],[6,2]]; d.puntos.game=[0,0]; d.puntos.set=4;
d.juego.equipoGanador="equipo1"; d.juego.tiempoTranscurridoAlFinalizar=5400000;
console.log(JSON.stringify(d));
' "$R")" >/dev/null

echo "==> SemiFinal"
R=$(create '{
  "equipo1":{"jugador1":"Ana Ruiz","jugador2":"Belén Soto","color":"#0d6efd"},
  "equipo2":{"jugador1":"Carla Díaz","jugador2":"Dana Paz","color":"#dc3545"},
  "etapa":"SemiFinal",
  "configuracion":{"cantidadSets":3,"gamesPorSet":6,"puntoOro":true,"ultimoPuntoTieBreak":100,"ultimoSetTieBreak":false,"ultimoGameSuperTB":100}
}')
curl -s -X PUT "$BASE/partido/estado" -H 'Content-Type: application/json' -d "$(node -e '
const d=JSON.parse(process.argv[1]).data;
d.puntos.sets=[[6,3],[4,6],[0,0]]; d.puntos.game=[2,1]; d.puntos.set=3;
console.log(JSON.stringify(d));
' "$R")" >/dev/null

echo "==> Cuartos"
create '{
  "equipo1":{"jugador1":"Lucas Méndez","jugador2":"Tomás Vega","color":"#fd7e14"},
  "equipo2":{"jugador1":"Nico Ríos","jugador2":"Pablo Suárez","color":"#20c997"},
  "etapa":"Cuartos de Final",
  "configuracion":{"cantidadSets":3,"gamesPorSet":6,"puntoOro":false,"ultimoPuntoTieBreak":100,"ultimoSetTieBreak":false,"ultimoGameSuperTB":100}
}' >/dev/null

echo "==> Activo demo (en juego 40-30, set 4-3)"
R=$(create '{
  "equipo1":{"jugador1":"Martina López","jugador2":"Sofía Herrera","color":"#196571"},
  "equipo2":{"jugador1":"Valentina Cruz","jugador2":"Camila Rojas","color":"#6f42c1"},
  "etapa":"Fase de Grupos",
  "configuracion":{"cantidadSets":3,"gamesPorSet":6,"puntoOro":true,"ultimoPuntoTieBreak":100,"ultimoSetTieBreak":false,"ultimoGameSuperTB":100}
}')
curl -s -X PUT "$BASE/partido/estado" -H 'Content-Type: application/json' -d "$(node -e '
const d=JSON.parse(process.argv[1]).data;
d.puntos.sets=[[4,3],[0,0],[0,0]]; d.puntos.game=[3,2]; d.puntos.set=1;
d.juego.servicio=0; d.juego.posServ=0;
console.log(JSON.stringify(d));
' "$R")" >/dev/null

echo "==> Listo"
curl -s "$BASE/partido/lista" | node -e 'let j="";process.stdin.on("data",d=>j+=d);process.stdin.on("end",()=>{JSON.parse(j).data.forEach(m=>console.log(m.id,m.activo?"ACTIVO":"     ",m.etapa,m.equipo1.jugador1,"vs",m.equipo2.jugador1,m.status))})'
echo
echo "Gestión:  http://smashr.duckdns.org:3010/"
echo "Tablero:  http://smashr.duckdns.org:3010/tablero"
echo "Password: padel2025"
