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

async function procesarArchivo(rutaArchivo) {
  try {
    console.log(`Procesando archivo: ${rutaArchivo}`);

    if (!await Utils.validarArchivosJSON(rutaArchivo)) {
      return;
    }

    const contenido = await fs.readFile(rutaArchivo, "utf8");
    let datos = JSON.parse(contenido);
    const registros = Array.isArray(datos) ? datos : [datos];

    for (const registro of registros) {
      try {
        if (registro.servidorPublicoSancionado) {
          const clasificacion = ServidoresPublicosProcesador.clasificarPorTipoFalta(registro.tipoFalta);
          const datosTransformados = ServidoresPublicosProcesador.transformarServidorPublico(registro, clasificacion);
          registrosAcumulados.SERVIDOR_PUBLICO_SANCIONADO[clasificacion].push(datosTransformados);
        } else if (registro.particularSancionado) {
          const tipoPersona = registro.particularSancionado.tipoPersona;
          const categoria = tipoPersona === "F" ? "fisica" : tipoPersona === "M" ? "moral" : null;

          if (categoria) {
            const datosTransformados = ParticularesProcesador.transformarParticular(registro, categoria);
            registrosAcumulados.PARTICULAR_SANCIONADO[categoria].push(datosTransformados);
          }
        }
      } catch (regError) {
        console.error(`Error procesando registro en ${rutaArchivo}:`, regError);
        console.log("Registro problemático:", JSON.stringify(registro).substring(0, 200));
      }
    }
  } catch (error) {
    console.error(`Error procesando archivo ${rutaArchivo}:`, error);
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
    console.log(`Directorio de salida: ${outputDir}\n`);

    // Reiniciar registros acumulados
    registrosAcumulados = {
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

    // Procesar todos los archivos
    await procesarDirectorio(inputDir);

    // Escribir archivos consolidados
    await escribirArchivosConsolidados(outputDir);

    // Mostrar resumen final
    console.log("\nResumen del procesamiento:");
    console.log("---------------------------");
    console.log(`Faltas graves: ${registrosAcumulados.SERVIDOR_PUBLICO_SANCIONADO.graves.length} registros`);
    console.log(`Faltas no graves: ${registrosAcumulados.SERVIDOR_PUBLICO_SANCIONADO.no_graves.length} registros`);
    console.log(`Otras faltas: ${registrosAcumulados.SERVIDOR_PUBLICO_SANCIONADO.otro.length} registros`);
    console.log(`Personas físicas: ${registrosAcumulados.PARTICULAR_SANCIONADO.fisica.length} registros`);
    console.log(`Personas morales: ${registrosAcumulados.PARTICULAR_SANCIONADO.moral.length} registros`);
    console.log("\nProcesamiento completado exitosamente");
  } catch (error) {
    console.error("Error en el procesamiento:", error);
    process.exit(1);
  }
}

// Ejecutar el script
main();
