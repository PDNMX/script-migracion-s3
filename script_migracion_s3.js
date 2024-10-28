const fs = require("fs").promises;
const path = require("path");

// Define input and output paths
const inputDir = "../pruebas/datos_entrada/";
const outputDir = "../pruebas/datos_salida/";

// Definición de tipos de faltas
const faltasGraves = [
  "COHECHO O EXTORSION",
  "PECULADO",
  "DESVIO DE RECURSOS PUBLICOS",
  "UTILIZACION INDEBIDA DE INFORMACION",
  "ABUSO DE FUNCIONES",
  "ACTUACION BAJO CONFLICTO DE INTERES",
  "CONTRATACION INDEBIDA",
  "ENRIQUECIMIENTO OCULTO U OCULTAMIENTO DE CONFLICTO DE INTERES",
  "TRAFICO DE INFLUENCIAS",
  "ENCUBRIMIENTO",
  "DESACATO",
  "OBSTRUCCIÓN DE LA JUSTICIA",
  "ADMINISTRATIVA GRAVE",
];

const faltasNoGraves = [
  "NEGLIGENCIA ADMINISTRATIVA",
  "INCUMPLIMIENTO EN DECLARACION DE SITUACION PATRIMONIAL",
  "ADMINISTRATIVA NO GRAVE",
];

function clasificarPorTipoFalta(falta) {
  // Si no hay falta, va a otro
  if (!falta) {
    return "otro";
  }

  let valorFalta = "";

  // Si es objeto, tomamos el valor
  if (typeof falta === "object") {
    valorFalta = falta.valor || "";
  } else {
    // Si es string, lo usamos directamente
    valorFalta = falta;
  }

  // Comparamos el valor contra las listas
  if (faltasGraves.includes(valorFalta)) {
    return "graves";
  }
  if (faltasNoGraves.includes(valorFalta)) {
    return "no_graves";
  }

  return "otro";
}

function transformarServidorPublico(entrada, tipoSalida) {
  const esquemaBase = {
    fecha: entrada.fechaCaptura || "",
    expediente: entrada.expediente || "",
    datosGenerales: {
      nombres: entrada.servidorPublicoSancionado?.nombres || "",
      primerApellido: entrada.servidorPublicoSancionado?.primerApellido || "",
      segundoApellido: entrada.servidorPublicoSancionado?.segundoApellido || "",
      curp: entrada.servidorPublicoSancionado?.curp || "",
      rfc: entrada.servidorPublicoSancionado?.rfc || "",
      sexo: entrada.servidorPublicoSancionado?.genero?.valor || "",
    },
    empleoCargoComision: {
      entidadFederativa: "",
      nivelOrdenGobierno: "",
      ambitoPublico: "",
      nombreEntePublico: entrada.institucionDependencia?.nombre || "",
      siglasEntePublico: entrada.institucionDependencia?.siglas || "",
      nivelJerarquico:
        "obtenerNivelJerarquico(entrada.servidorPublicoSancionado?.puesto)",
      denominacion: entrada.servidorPublicoSancionado?.puesto || "",
      areaAdscripcion: "",
    },
    origenProcedimiento: {
      clave: "",
      valor: "",
    },
  };

  if (tipoSalida === "graves" || tipoSalida === "otro") {
    return {
      ...esquemaBase,
      faltaCometida: [
        {
          clave: entrada.tipoFalta?.clave || "",
          valor: entrada.tipoFalta?.valor || "",
          normatividadInfringida: [
            {
              nombreNormatividad: "",
              articulo: "",
              fraccion: "",
            },
          ],
          descripcionHechos: entrada.causaMotivoHechos || "",
        },
      ],
      resolucion: {
        tituloDocumento: "",
        fechaResolucion: entrada.resolucion?.fechaResolucion || "",
        fechaNotificacion: "",
        urlResolucion: entrada.resolucion?.url || "",
        fechaResolucionFirme: "",
        fechaNotificacionFirme: "",
        urlResolucionFirme: "",
        autoridadResolutora: entrada.autoridadSancionadora || "",
        ordenJurisdiccional: "",
        fechaEjecucion: "",
        autoridadInvestigadora: "",
        autoridadSubstanciadora: "",
      },
      tipoSancion:
        entrada.tipoSancion?.map((sancion) => ({
          clave: sancion.clave || "",
          suspension: {
            plazoMeses: "",
            plazoDias: "",
            fechaInicial: "",
            fechaFinal: "",
          },
          destitucionEmpleo: {
            fechaDestitucion: "",
          },
          inhabilitacion: {
            plazoAnios: "",
            plazoMeses: "",
            plazoDias: "",
            fechaInicial: entrada.inhabilitacion?.fechaInicial || "",
            fechaFinal: entrada.inhabilitacion?.fechaFinal || "",
          },
          sancionEconomica: {
            monto: entrada.multa?.monto || "",
            moneda: entrada.multa?.moneda?.valor || "",
            plazoPago: {
              anios: "",
              meses: "",
              dias: "",
            },
            sancionEfectivamenteCobrada: {
              monto: "",
              moneda: "",
              fechaCobro: "",
            },
            fechaPagoTotal: "",
          },
          otro: {
            denominacionSancion: "",
          },
        })) || [],
      observaciones: entrada.observaciones || "",
    };
  } else {
    // no_graves
    return {
      ...esquemaBase,
      faltaCometida: [
        {
          clave: entrada.tipoFalta?.clave || "",
          valor: entrada.tipoFalta?.valor || "",
          normatividadInfringida: [
            {
              nombreNormatividad: "",
              articulo: "",
              fraccion: "",
            },
          ],
          descripcionHechos: entrada.causaMotivoHechos || "",
        },
      ],
      resolucion: {
        tituloDocumento: "",
        fechaResolucion: entrada.resolucion?.fechaResolucion || "",
        fechaNotificacion: "",
        fechaResolucionFirme: "",
        fechaNotificacionFirme: "",
        fechaEjecucion: "",
        autoridadResolutora: entrada.autoridadSancionadora || "",
        autoridadInvestigadora: "",
        autoridadSubstanciadora: "",
      },
      tipoSancion:
        entrada.tipoSancion?.map((sancion) => ({
          clave: sancion.clave || "",
          amonestacion: {
            tipo: "",
          },
          suspension: {
            plazoMeses: "",
            plazoDias: "",
            plazoFechaInicial: "",
            plazoFechaFinal: "",
          },
          destitucionEmpleo: {
            fechaDestitucion: "",
          },
          inhabilitacion: {
            plazoAnios: "",
            plazoMeses: "",
            plazoDias: "",
            plazoFechaInicial: entrada.inhabilitacion?.fechaInicial || "",
            plazoFechaFinal: entrada.inhabilitacion?.fechaFinal || "",
          },
          otro: {
            denominacionSancion: "",
          },
        })) || [],
      observaciones: entrada.observaciones || "",
    };
  }
}

function transformarParticular(entrada, tipoPersona) {
  return {
    id: entrada.id || "",
    fecha: entrada.fechaCaptura || "",
    expediente: entrada.expediente || "",
    datosGenerales: {
      nombreRazonSocial: entrada.particularSancionado?.nombreRazonSocial || "",
      objetoSocial: entrada.particularSancionado?.objetoSocial || "",
      rfc: entrada.particularSancionado?.rfc || "",
      tipoDomicilio: "",
      domicilioMexico: {
        tipoVialidad: "",
        nombreVialidad: "",
        numeroExterior:
          entrada.particularSancionado?.domicilioMexico?.numeroExterior || "",
        numeroInterior:
          entrada.particularSancionado?.domicilioMexico?.numeroInterior || "",
        coloniaLocalidad: "",
        municipioAlcaldia:
          entrada.particularSancionado?.domicilioMexico?.municipio || "",
        codigoPostal:
          entrada.particularSancionado?.domicilioMexico?.codigoPostal || "",
        entidadFederativa:
          entrada.particularSancionado?.domicilioMexico?.entidadFederativa ||
          "",
      },
    },
    dondeCometioLaFalta: {
      entidadFederativa: "",
      nivelOrdenGobierno: "",
      ambitoPublico: "",
      nombreEntePublico: entrada.institucionDependencia?.nombre || "",
      siglasEntePublico: entrada.institucionDependencia?.siglas || "",
    },
    origenProcedimiento: {
      clave: "",
      valor: "",
    },
    faltaCometida: [
      {
        clave: "",
        valor: "",
        normatividadInfringida: {
          nombreNormatividad: "",
          articulo: "",
          fraccion: "",
        },
        descripcionHechos: entrada.causaMotivoHechos || "",
      },
    ],
    resolucion: {
      tituloResolucion: "",
      fechaResolucion: entrada.resolucion?.fechaResolucion || "",
      fechaNotificacion: "",
      urlResolucion: entrada.resolucion?.url || "",
      fechaResolucionFirme: "",
      fechaNotificacionFirme: "",
      urlResolucionFirme: "",
      fechaEjecucion: "",
      autoridadResolutora: entrada.autoridadSancionadora || "",
      autoridadInvestigadora: "",
      autoridadSubstanciadora: "",
    },
    tipoSancion:
      entrada.tipoSancion?.map((sancion) => ({
        clave: sancion.clave || "",
        inhabilitacion: {
          plazoAnios: "",
          plazoMeses: "",
          plazoDias: "",
          fechaInicial: entrada.inhabilitacion?.fechaInicial || "",
          fechaFinal: entrada.inhabilitacion?.fechaFinal || "",
        },
        multa: {
          monto: entrada.multa?.monto || "",
          moneda: entrada.multa?.moneda?.valor || "",
        },
        otro: {
          denominacionSancion: "",
        },
      })) || [],
    observaciones: entrada.observaciones || "",
  };
}

async function crearDirectorioSiNoExiste(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function escribirArchivo(directorio, nombreArchivo, contenido) {
  try {
    await crearDirectorioSiNoExiste(directorio);
    const rutaCompleta = path.join(directorio, nombreArchivo);
    await fs.writeFile(rutaCompleta, JSON.stringify(contenido, null, 2));
    console.log(`Archivo escrito exitosamente: ${rutaCompleta}`);
  } catch (error) {
    console.error(`Error escribiendo archivo ${nombreArchivo}:`, error);
  }
}

async function procesarArchivo(rutaArchivo) {
  try {
    console.log(`Procesando archivo: ${rutaArchivo}`);
    const contenido = await fs.readFile(rutaArchivo, "utf8");
    let datos = JSON.parse(contenido);

    const registros = Array.isArray(datos) ? datos : [datos];

    // Inicializar estructura de resultados
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
          const datosTransformados = transformarServidorPublico(
            registro,
            clasificacion
          );
          resultados.SERVIDOR_PUBLICO_SANCIONADO[clasificacion].push(
            datosTransformados
          );
        } else if (registro.particularSancionado) {
          const tipoPersona = registro.particularSancionado.tipoPersona;
          const categoria =
            tipoPersona === "F"
              ? "fisica"
              : tipoPersona === "M"
              ? "moral"
              : null;

          if (categoria) {
            const datosTransformados = transformarParticular(
              registro,
              categoria
            );
            resultados.PARTICULAR_SANCIONADO[categoria].push(
              datosTransformados
            );
          }
        }
      } catch (regError) {
        console.error(`Error procesando registro en ${rutaArchivo}:`, regError);
        console.log(
          "Registro problemático:",
          JSON.stringify(registro).substring(0, 200)
        );
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

async function main() {
  try {
    await crearDirectorioSiNoExiste(outputDir);
    await procesarDirectorio(inputDir);
    console.log("Procesamiento completado exitosamente");
  } catch (error) {
    console.error("Error en el procesamiento:", error);
    process.exit(1);
  }
}

// Ejecutar el script
main();
