import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Limpiando base de datos...");
  await prisma.historialAccion.deleteMany();
  await prisma.estadoPartido.deleteMany();
  await prisma.configuracionPartido.deleteMany();
  await prisma.partido.deleteMany();
  await prisma.equipo.deleteMany();

  console.log("Creando partido de ejemplo...");

  const equipo1 = await prisma.equipo.create({
    data: {
      jugador1: "Juan Martín Del Potro",
      jugador2: "David Nalbandian",
      color: "#17A2B8",
    },
  });

  const equipo2 = await prisma.equipo.create({
    data: {
      jugador1: "Guillermo Vilas",
      jugador2: "Gastón Gaudio",
      color: "#28A745",
    },
  });

  const partido = await prisma.partido.create({
    data: {
      etapa: "Final",
      activo: true,
      equipo1Id: equipo1.id,
      equipo2Id: equipo2.id,
      configuracion: {
        create: {
          cantidadSets: 3,
          gamesPorSet: 6,
          puntoOro: false,
          ultimoPuntoTieBreak: 100,
          ultimoSetTieBreak: false,
          ultimoGameSuperTB: 100,
        },
      },
      estado: {
        create: {
          gameEquipo1: 2,
          gameEquipo2: 3,
          setsJSON: JSON.stringify([[6, 4], [3, 6], [0, 0]]),
          setActual: 3,
          ultimoPunto: 4,
          ultimoGame: 6,
          servicioActual: 2,
          ordenServicios: JSON.stringify([0, 2, 1, 3]),
          posicionServicio: 1,
          tiebreak: false,
        },
      },
    },
  });

  console.log("✅ Partido de ejemplo creado:");
  console.log("   Equipo 1:", equipo1.jugador1, "/", equipo1.jugador2);
  console.log("   Equipo 2:", equipo2.jugador1, "/", equipo2.jugador2);
  console.log("   Sets: 6-4, 3-6, 0-0");
  console.log("   Puntos actuales: 30-40");
  console.log("   ID del partido:", partido.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
