const fs = require("fs").promises;
const path = require("path");
const { getCommandLineArgs, crearDirectorioSiNoExiste, validarArchivosJSON } = require('./utils');
const { transformarServidorPublico, clasificarPorTipoFalta } = require('./servidoresPublicos');
const { transformarParticular } = require('./particulares');

async function procesarArchivo(rutaArchivo, outputDir) {
  try {
    console.log(`Procesando archivo: ${rutaArchivo}`);

    if (!await validarArchivosJSON(rutaArchivo)) {
      return;
    }

    const contenido = await fs.readFile(rutaArchivo, "utf8");
    let datos = JSON.parse(contenido);
    const registros = Array.isArray(datos) ? datos : [datos];

    const resultados = {
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

    const dirPadre = path.basename(path.dirname(rutaArchivo));
    const nombreArchivo = `procesado_${dirPadre}_${path.basename(rutaArchivo)}`;

    for (const registro of registros) {
      try {
        if (registro.servidorPublicoSancionado) {
          const clasificacion = clasificarPorTipoFalta(registro.tipoFalta);
          const datosTransformados = transformarServidorPublico(registro, clasificacion);
          resultados.SERVIDOR_PUBLICO_SANCIONADO[clasificacion].push(datosTransformados);
        } else if (registro.particularSancionado) {
          const tipoPersona = registro.particularSancionado.tipoPersona;
          const categoria = tipoPersona === "F" ? "fisica" : tipoPersona === "M" ? "moral" : null;

          if (categoria) {
            const datosTransformados = transformarParticular(registro, categoria);
            resultados.PARTICULAR_SANCIONADO[categoria].push(datosTransformados);
          }
        }
      } catch (regError) {
        console.error(`Error procesando registro en ${rutaArchivo}:`, regError);
        console.log("Registro problemático:", JSON.stringify(registro).substring(0, 200));
      }
    }

    // Escribir resultados
    for (const [tipoSancion, categorias] of Object.entries(resultados)) {
      for (const [categoria, datos] of Object.entries(categorias)) {
        if (datos && datos.length > 0) {
          const directorioSalida = path.join(outputDir, tipoSancion, categoria);
          await crearDirectorioSiNoExiste(directorioSalida);
          const rutaCompleta = path.join(directorioSalida, nombreArchivo);
          await fs.writeFile(rutaCompleta, JSON.stringify(datos, null, 2));
          console.log(`Archivo creado: ${rutaCompleta}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error procesando archivo ${rutaArchivo}:`, error);
  }
}

async function procesarDirectorio(dirPath, outputDir) {
  try {
    const archivos = await fs.readdir(dirPath, { withFileTypes: true });

    for (const archivo of archivos) {
      const rutaCompleta = path.join(dirPath, archivo.name);

      if (archivo.isDirectory()) {
        await procesarDirectorio(rutaCompleta, outputDir);
      } else if (archivo.name.endsWith(".json")) {
        await procesarArchivo(rutaCompleta, outputDir);
      }
    }
  } catch (error) {
    console.error(`Error procesando directorio ${dirPath}:`, error);
  }
}

async function main() {
  try {
    const { inputDir, outputDir } = getCommandLineArgs();

    try {
      await fs.access(inputDir);
    } catch {
      console.error(`Error: El directorio de entrada "${inputDir}" no existe`);
      process.exit(1);
    }

    await crearDirectorioSiNoExiste(outputDir);

    console.log(`\nIniciando procesamiento...`);
    console.log(`Directorio de entrada: ${inputDir}`);
    console.log(`Directorio de salida: ${outputDir}\n`);

    await procesarDirectorio(inputDir, outputDir);
    console.log("\nProcesamiento completado exitosamente");
  } catch (error) {
    console.error("Error en el procesamiento:", error);
    process.exit(1);
  }
}

// Ejecutar el script
main();
