const fs = require("fs").promises;
const path = require("path");
const Utils = require("./utils");
const ServidoresPublicosProcesador = require("./servidoresPublicos");
const ParticularesProcesador = require("./particulares");

// Estructura para acumular todos los registros
let registrosAcumulados = {
  SERVIDOR_PUBLICO_SANCIONADO: {
    graves: [],
    no_graves: [],
    otro: [],
  },
  PARTICULAR_SANCIONADO: {
    fisica: [],
    moral: [],
    otro: [],
  },
};

// Estructura para estadísticas
const stats = {
  entrada: {
    archivos: 0,
    registrosTotales: 0,
    registrosServidores: 0,
    registrosParticulares: 0,
    registrosNoValidos: 0,
  },
  salida: {
    SERVIDOR_PUBLICO_SANCIONADO: {
      graves: 0,
      no_graves: 0,
      otro: 0,
    },
    PARTICULAR_SANCIONADO: {
      fisica: 0,
      moral: 0,
      otro: 0,
    },
  },
};

async function procesarArchivo(rutaArchivo) {
  try {
    if (!(await Utils.validarArchivosJSON(rutaArchivo))) {
      return;
    }

    console.log(`Procesando archivo: ${rutaArchivo}`);
    const contenido = await fs.readFile(rutaArchivo, "utf8");
    let datos = JSON.parse(contenido);
    const registros = Array.isArray(datos) ? datos : [datos];

    stats.entrada.archivos++;
    stats.entrada.registrosTotales += registros.length;

    for (const registro of registros) {
      try {
        if (registro.servidorPublicoSancionado) {
          stats.entrada.registrosServidores++;
          const clasificacion =
            ServidoresPublicosProcesador.clasificarPorTipoFalta(
              registro.tipoFalta
            );
          const datosTransformados =
            ServidoresPublicosProcesador.transformarServidorPublico(
              registro,
              clasificacion
            );
          registrosAcumulados.SERVIDOR_PUBLICO_SANCIONADO[clasificacion].push(
            datosTransformados
          );
          stats.salida.SERVIDOR_PUBLICO_SANCIONADO[clasificacion]++;
        } else if (registro.particularSancionado) {
          stats.entrada.registrosParticulares++;

          const {
            nombreRazonSocial = "",
            tipoPersona = "",
            rfc = "",
          } = registro.particularSancionado;

          console.log(
            "\nProcesando particular:",
            nombreRazonSocial || "Sin nombre"
          );
          console.log("Datos disponibles:");
          console.log(
            `- Nombre/Razón social: ${nombreRazonSocial || "No proporcionado"}`
          );
          console.log(`- Tipo declarado: ${tipoPersona || "No proporcionado"}`);
          console.log(`- RFC: ${rfc || "No proporcionado"}`);

          const tipoPersonaResultado = Utils.determinarTipoPersona({
            nombreRazonSocial,
            tipoPersona,
            rfc,
          });

          const categoriaFinal = tipoPersonaResultado || "otro";
          const datosTransformados =
            ParticularesProcesador.transformarParticular(
              registro,
              categoriaFinal
            );

          registrosAcumulados.PARTICULAR_SANCIONADO[categoriaFinal].push(
            datosTransformados
          );
          stats.salida.PARTICULAR_SANCIONADO[categoriaFinal]++;
          console.log(`✓ Registro procesado como persona ${categoriaFinal}`);
        } else {
          stats.entrada.registrosNoValidos++;
          console.warn(
            "Registro no válido: No se encontró información de servidor público o particular"
          );
        }
      } catch (regError) {
        stats.entrada.registrosNoValidos++;
        console.error(`Error procesando registro en ${rutaArchivo}:`, regError);
        console.log(
          "Registro problemático:",
          JSON.stringify(registro).substring(0, 200)
        );
      }
    }
  } catch (error) {
    console.error(`\nError procesando archivo ${rutaArchivo}:`, error);
  }
}

async function procesarDirectorio(dirPath) {
  try {
    const archivos = await fs.readdir(dirPath, { withFileTypes: true });

    for (const archivo of archivos) {
      const rutaCompleta = path.join(dirPath, archivo.name);

      if (archivo.isDirectory()) {
        await procesarDirectorio(rutaCompleta);
      } else if (archivo.name.endsWith(".json")) {
        await procesarArchivo(rutaCompleta);
      }
    }
  } catch (error) {
    console.error(`Error procesando directorio ${dirPath}:`, error);
  }
}

async function escribirArchivosConsolidados(outputDir) {
  try {
    const archivos = {
      "faltas_graves.json":
        registrosAcumulados.SERVIDOR_PUBLICO_SANCIONADO.graves,
      "faltas_no_graves.json":
        registrosAcumulados.SERVIDOR_PUBLICO_SANCIONADO.no_graves,
      "faltas_otros.json": registrosAcumulados.SERVIDOR_PUBLICO_SANCIONADO.otro,
      "particulares_personas_fisicas.json":
        registrosAcumulados.PARTICULAR_SANCIONADO.fisica,
      "particulares_personas_morales.json":
        registrosAcumulados.PARTICULAR_SANCIONADO.moral,
      "particulares_otros.json": registrosAcumulados.PARTICULAR_SANCIONADO.otro, // Agregar nuevo archivo
    };

    for (const [nombreArchivo, registros] of Object.entries(archivos)) {
      if (registros && registros.length > 0) {
        const rutaArchivo = path.join(outputDir, nombreArchivo);
        await fs.writeFile(rutaArchivo, JSON.stringify(registros, null, 2));
        console.log(
          `Archivo creado: ${nombreArchivo} (${registros.length} registros)`
        );
      }
    }
  } catch (error) {
    console.error("Error escribiendo archivos:", error);
  }
}

function mostrarResumenProcesamiento() {
  console.log("\n\n============================================");
  console.log("           RESUMEN DE PROCESAMIENTO          ");
  console.log("============================================");

  console.log("\n📥 DATOS DE ENTRADA:");
  console.log("--------------------------------------------");
  console.log(`Archivos procesados: ${stats.entrada.archivos}`);
  console.log(
    `Registros totales encontrados: ${stats.entrada.registrosTotales}`
  );
  console.log(`├── Servidores públicos: ${stats.entrada.registrosServidores}`);
  console.log(`├── Particulares: ${stats.entrada.registrosParticulares}`);
  console.log(
    `└── No válidos/con errores: ${stats.entrada.registrosNoValidos}`
  );

  console.log("\n📤 CLASIFICACIÓN DE SALIDA:");
  console.log("--------------------------------------------");
  console.log("Servidores Públicos:");
  console.log(
    `├── Faltas graves: ${stats.salida.SERVIDOR_PUBLICO_SANCIONADO.graves}`
  );
  console.log(
    `├── Faltas no graves: ${stats.salida.SERVIDOR_PUBLICO_SANCIONADO.no_graves}`
  );
  console.log(`└── Otros: ${stats.salida.SERVIDOR_PUBLICO_SANCIONADO.otro}`);

  console.log("\nParticulares:");
  console.log(
    `├── Personas físicas: ${stats.salida.PARTICULAR_SANCIONADO.fisica}`
  );
  console.log(
    `├── Personas morales: ${stats.salida.PARTICULAR_SANCIONADO.moral}`
  );
  console.log(`└── Otros: ${stats.salida.PARTICULAR_SANCIONADO.otro}`);

  const totalEntrada =
    stats.entrada.registrosServidores + stats.entrada.registrosParticulares;
  const totalSalida =
    Object.values(stats.salida.SERVIDOR_PUBLICO_SANCIONADO).reduce(
      (a, b) => a + b,
      0
    ) +
    Object.values(stats.salida.PARTICULAR_SANCIONADO).reduce(
      (a, b) => a + b,
      0
    );

  console.log("\n📊 TOTALES:");
  console.log("--------------------------------------------");
  console.log(`Total registros válidos de entrada: ${totalEntrada}`);
  console.log(`Total registros procesados: ${totalSalida}`);

  if (stats.salida.SERVIDOR_PUBLICO_SANCIONADO.otro > 0) {
    console.log("\n⚠️  ADVERTENCIA ⚠️");
    console.log("--------------------------------------------");
    console.log(
      `Se encontraron ${stats.salida.SERVIDOR_PUBLICO_SANCIONADO.otro} registros clasificados como "OTROS"`
    );
    console.log("Estos registros requieren revisión y clasificación manual");
    console.log("según su normatividad aplicable.");
  }
  if (stats.salida.PARTICULAR_SANCIONADO.otro > 0) {
    console.log("\n⚠️  ADVERTENCIA - PARTICULARES SIN CLASIFICAR ⚠️");
    console.log("--------------------------------------------");
    console.log(
      `Se encontraron ${stats.salida.PARTICULAR_SANCIONADO.otro} registros de particulares sin clasificación clara`
    );
    console.log("Estos registros requieren revisión y clasificación manual");
    console.log("entre personas físicas y morales.");
  }

  console.log("\n============================================");
}

async function main() {
  try {
    const { inputDir, outputDir } = Utils.getCommandLineArgs();

    try {
      await fs.access(inputDir);
    } catch {
      console.error(`Error: El directorio de entrada "${inputDir}" no existe`);
      process.exit(1);
    }

    await Utils.crearDirectorioSiNoExiste(outputDir);

    console.log(`\nIniciando procesamiento...`);
    console.log(`Directorio de entrada: ${inputDir}`);
    console.log(`Directorio de salida: ${outputDir}`);
    console.log("\nProcesando archivos...");

    // Reiniciar registros y estadísticas
    registrosAcumulados = {
      SERVIDOR_PUBLICO_SANCIONADO: { graves: [], no_graves: [], otro: [] },
      PARTICULAR_SANCIONADO: { fisica: [], moral: [] },
    };

    await procesarDirectorio(inputDir);
    await escribirArchivosConsolidados(outputDir);
    mostrarResumenProcesamiento();
  } catch (error) {
    console.error("\nError en el procesamiento:", error);
    process.exit(1);
  }
}

// Ejecutar el script
main();
