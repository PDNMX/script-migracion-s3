const fs = require("fs").promises;
const path = require("path");
const Utils = require('./utils');
const ServidoresPublicosProcesador = require('./servidoresPublicos');
const ParticularesProcesador = require('./particulares');

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
  },
};

// Estructura para estadísticas
const stats = {
  entrada: {
    archivos: 0,
    registrosTotales: 0,
    registrosServidores: 0,
    registrosParticulares: 0,
    registrosNoValidos: 0
  },
  salida: {
    SERVIDOR_PUBLICO_SANCIONADO: {
      graves: 0,
      no_graves: 0,
      otro: 0
    },
    PARTICULAR_SANCIONADO: {
      fisica: 0,
      moral: 0
    }
  }
};

async function procesarArchivo(rutaArchivo) {
  try {
    console.log(`Procesando archivo: ${rutaArchivo}`);

    if (!await Utils.validarArchivosJSON(rutaArchivo)) {
      return;
    }

    const contenido = await fs.readFile(rutaArchivo, "utf8");
    let datos = JSON.parse(contenido);
    const registros = Array.isArray(datos) ? datos : [datos];

    stats.entrada.archivos++;
    stats.entrada.registrosTotales += registros.length;

    for (const registro of registros) {
      try {
        if (registro.servidorPublicoSancionado) {
          stats.entrada.registrosServidores++;
          const clasificacion = ServidoresPublicosProcesador.clasificarPorTipoFalta(registro.tipoFalta);
          const datosTransformados = ServidoresPublicosProcesador.transformarServidorPublico(registro, clasificacion);
          registrosAcumulados.SERVIDOR_PUBLICO_SANCIONADO[clasificacion].push(datosTransformados);
          stats.salida.SERVIDOR_PUBLICO_SANCIONADO[clasificacion]++;
        } else if (registro.particularSancionado) {
          stats.entrada.registrosParticulares++;
          const tipoPersona = registro.particularSancionado.tipoPersona;
          const categoria = tipoPersona === "F" ? "fisica" : tipoPersona === "M" ? "moral" : null;

          if (categoria) {
            const datosTransformados = ParticularesProcesador.transformarParticular(registro, categoria);
            registrosAcumulados.PARTICULAR_SANCIONADO[categoria].push(datosTransformados);
            stats.salida.PARTICULAR_SANCIONADO[categoria]++;
          }
        } else {
          stats.entrada.registrosNoValidos++;
          console.warn("Registro no válido: No se encontró información de servidor público o particular");
        }
      } catch (regError) {
        stats.entrada.registrosNoValidos++;
        console.error(`Error procesando registro en ${rutaArchivo}:`, regError);
        console.log("Registro problemático:", JSON.stringify(registro).substring(0, 200));
      }
    }
    //process.stdout.write("✓");
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
    // Mapeo de nombres de archivo
    const archivos = {
      'faltas_graves.json': registrosAcumulados.SERVIDOR_PUBLICO_SANCIONADO.graves,
      'faltas_no_graves.json': registrosAcumulados.SERVIDOR_PUBLICO_SANCIONADO.no_graves,
      'faltas_otros.json': registrosAcumulados.SERVIDOR_PUBLICO_SANCIONADO.otro,
      'particulares_personas_fisicas.json': registrosAcumulados.PARTICULAR_SANCIONADO.fisica,
      'particulares_personas_morales.json': registrosAcumulados.PARTICULAR_SANCIONADO.moral
    };

    // Escribir cada archivo
    for (const [nombreArchivo, registros] of Object.entries(archivos)) {
      if (registros.length > 0) {
        const rutaArchivo = path.join(outputDir, nombreArchivo);
        await fs.writeFile(
          rutaArchivo,
          JSON.stringify(registros, null, 2)
        );
        console.log(`Archivo creado: ${nombreArchivo} (${registros.length} registros)`);
      }
    }
  } catch (error) {
    console.error('Error escribiendo archivos:', error);
  }
}


function mostrarResumenProcesamiento() {
  console.log("\n\n============================================");
  console.log("           RESUMEN DE PROCESAMIENTO          ");
  console.log("============================================");

  console.log("\n📥 DATOS DE ENTRADA:");
  console.log("--------------------------------------------");
  console.log(`Archivos procesados: ${stats.entrada.archivos}`);
  console.log(`Registros totales encontrados: ${stats.entrada.registrosTotales}`);
  console.log(`├── Servidores públicos: ${stats.entrada.registrosServidores}`);
  console.log(`├── Particulares: ${stats.entrada.registrosParticulares}`);
  console.log(`└── No válidos/con errores: ${stats.entrada.registrosNoValidos}`);

  console.log("\n📤 CLASIFICACIÓN DE SALIDA:");
  console.log("--------------------------------------------");
  console.log("Servidores Públicos:");
  console.log(`├── Faltas graves: ${stats.salida.SERVIDOR_PUBLICO_SANCIONADO.graves}`);
  console.log(`├── Faltas no graves: ${stats.salida.SERVIDOR_PUBLICO_SANCIONADO.no_graves}`);
  console.log(`└── Otros: ${stats.salida.SERVIDOR_PUBLICO_SANCIONADO.otro}`);

  console.log("\nParticulares:");
  console.log(`├── Personas físicas: ${stats.salida.PARTICULAR_SANCIONADO.fisica}`);
  console.log(`└── Personas morales: ${stats.salida.PARTICULAR_SANCIONADO.moral}`);

  const totalEntrada = stats.entrada.registrosServidores + stats.entrada.registrosParticulares;
  const totalSalida = Object.values(stats.salida.SERVIDOR_PUBLICO_SANCIONADO).reduce((a, b) => a + b, 0) +
                     Object.values(stats.salida.PARTICULAR_SANCIONADO).reduce((a, b) => a + b, 0);

  console.log("\n📊 TOTALES:");
  console.log("--------------------------------------------");
  console.log(`Total registros válidos de entrada: ${totalEntrada}`);
  console.log(`Total registros procesados: ${totalSalida}`);

  if (stats.salida.SERVIDOR_PUBLICO_SANCIONADO.otro > 0) {
    console.log("\n⚠️  ADVERTENCIA ⚠️");
    console.log("--------------------------------------------");
    console.log(`Se encontraron ${stats.salida.SERVIDOR_PUBLICO_SANCIONADO.otro} registros clasificados como "OTROS"`);
    console.log("Estos registros requieren revisión y clasificación manual");
    console.log("según su normatividad aplicable.");
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
      PARTICULAR_SANCIONADO: { fisica: [], moral: [] }
    };

    // Procesar archivos
    await procesarDirectorio(inputDir);

    // Escribir archivos consolidados
    await escribirArchivosConsolidados(outputDir);

    // Mostrar resumen
    mostrarResumenProcesamiento();

  } catch (error) {
    console.error("\nError en el procesamiento:", error);
    process.exit(1);
  }
}

// Ejecutar el script
main();
