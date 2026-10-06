#!/usr/bin/env bash
# Carga partidos de demo (varias canchas en simultáneo) en el Smashr ya corriendo.
# Uso en el VPS:  cd /var/www/smashr && bash scripts/seed-demo.sh [BASE_API] [PASSWORD]
set -euo pipefail
BASE="${1:-http://127.0.0.1:3010/api}"
PASS="${2:-${ADMIN_PASSWORD:-padel2025}}"
SITE="${BASE%/api}"

TOKEN=$(curl -sf -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d "{\"password\":\"$PASS\"}" | node -e 'let j="";process.stdin.on("data",d=>j+=d);process.stdin.on("end",()=>console.log(JSON.parse(j).token))')
AUTH="Authorization: Bearer $TOKEN"

create() {
  curl -sf -X POST "$BASE/partido/crear" -H 'Content-Type: application/json' -H "$AUTH" -d "$1"
}

# $1 = respuesta de create, $2 = JS que modifica `d`
score() {
  local id body
  id=$(node -e 'console.log(JSON.parse(process.argv[1]).data.id)' "$1")
  body=$(node -e "const d=JSON.parse(process.argv[1]).data; $2; console.log(JSON.stringify(d));" "$1")
  curl -sf -X PUT "$BASE/partido/$id/estado" -H 'Content-Type: application/json' -H "$AUTH" -d "$body" >/dev/null
}

CFG='"configuracion":{"cantidadSets":3,"gamesPorSet":6,"puntoOro":false,"ultimoPuntoTieBreak":100,"ultimoSetTieBreak":false,"ultimoGameSuperTB":100}'

echo "==> Final (terminado)"
R=$(create '{"torneo":"Copa Primavera","cancha":"Cancha Central","etapa":"Final",
  "equipo1":{"jugador1":"Del Potro","jugador2":"Nalbandian","color":"#17A2B8"},
  "equipo2":{"jugador1":"Vilas","jugador2":"Gaudio","color":"#28A745"},'"$CFG"'}')
score "$R" 'd.puntos.sets=[[6,4],[3,6],[6,2]]; d.puntos.game=[0,0]; d.puntos.set=4; d.juego.equipoGanador="equipo1"; d.juego.tiempoTranscurridoAlFinalizar=5400000'

echo "==> Cancha 1 (en juego)"
R=$(create '{"torneo":"Relámpago Mixto Suma 13","cancha":"Cancha 1","etapa":"SemiFinal",
  "equipo1":{"jugador1":"Ana Ruiz","jugador2":"Belén Soto","color":"#0d6efd"},
  "equipo2":{"jugador1":"Carla Díaz","jugador2":"Dana Paz","color":"#dc3545"},'"$CFG"'}')
score "$R" 'd.puntos.sets=[[6,3],[4,6],[0,0]]; d.puntos.game=[2,1]; d.puntos.set=3'

echo "==> Cancha 2 (en juego)"
R=$(create '{"torneo":"Relámpago Mixto Suma 13","cancha":"Cancha 2","etapa":"SemiFinal",
  "equipo1":{"jugador1":"Martina López","jugador2":"Sofía Herrera","color":"#196571"},
  "equipo2":{"jugador1":"Valentina Cruz","jugador2":"Camila Rojas","color":"#6f42c1"},'"$CFG"'}')
score "$R" 'd.puntos.sets=[[4,3],[0,0],[0,0]]; d.puntos.game=[3,2]; d.puntos.set=1'

echo "==> Cancha 3 (recién creado)"
create '{"torneo":"Copa Primavera","cancha":"Cancha 3","etapa":"Cuartos de Final",
  "equipo1":{"jugador1":"Lucas Méndez","jugador2":"Tomás Vega","color":"#fd7e14"},
  "equipo2":{"jugador1":"Nico Ríos","jugador2":"Pablo Suárez","color":"#20c997"},'"$CFG"'}' >/dev/null

echo "==> Listo. Tableros:"
curl -sf "$BASE/partido/lista?estado=en_curso" -H "$AUTH" | SITE="$SITE" node -e 'let j="";process.stdin.on("data",d=>j+=d);process.stdin.on("end",()=>{JSON.parse(j).data.forEach(m=>console.log((m.cancha||"-").padEnd(16),m.equipo1.jugador1,"vs",m.equipo2.jugador1," ",process.env.SITE+"/tablero/"+m.codigo))})'
echo
echo "Gestión:  $SITE/"
