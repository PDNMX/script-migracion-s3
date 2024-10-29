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

function construirTipoSancion(sancion, entrada, tipoEsquema) {
  const base = {
    clave: sancion.valor || "",
  };

  if (tipoEsquema === "graves" || tipoEsquema === "otro") {
    const sancionGrave = {
      ...base,
    };

    // Suspension (S)
    if (sancion.clave === "S") {
      sancionGrave.suspension = {
        plazoMeses: "",
        plazoDias: "",
        fechaInicial: "",
        fechaFinal: "",
      };
    }

    // Destitución (D)
    if (sancion.clave === "D") {
      sancionGrave.destitucionEmpleo = {
        fechaDestitucion: "",
      };
    }

    // Inhabilitación (I)
    if (sancion.clave === "I") {
      sancionGrave.inhabilitacion = {
        plazoAnios: "",
        plazoMeses: "",
        plazoDias: "",
        fechaInicial: entrada.inhabilitacion?.fechaInicial || "",
        fechaFinal: entrada.inhabilitacion?.fechaFinal || "",
      };
    }

    // Sanción Económica (SE)
    if (sancion.clave === "SE") {
      sancionGrave.sancionEconomica = {
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
      };
    }

    // Otro
    sancionGrave.otro = {
      denominacionSancion: "",
    };

    return sancionGrave;
  } else {
    // no_graves
    const sancionNoGrave = {
      ...base,
    };

    // Amonestación (A)
    if (sancion.clave === "A") {
      sancionNoGrave.amonestacion = {
        tipo: "",
      };
    }

    // Suspensión (S)
    if (sancion.clave === "S") {
      sancionNoGrave.suspension = {
        plazoMeses: "",
        plazoDias: "",
        plazoFechaInicial: "",
        plazoFechaFinal: "",
      };
    }

    // Destitución (D)
    if (sancion.clave === "D") {
      sancionNoGrave.destitucionEmpleo = {
        fechaDestitucion: "",
      };
    }

    // Inhabilitación (I)
    if (sancion.clave === "I") {
      sancionNoGrave.inhabilitacion = {
        plazoAnios: "",
        plazoMeses: "",
        plazoDias: "",
        plazoFechaInicial: entrada.inhabilitacion?.fechaInicial || "",
        plazoFechaFinal: entrada.inhabilitacion?.fechaFinal || "",
      };
    }

    // Otro
    sancionNoGrave.otro = {
      denominacionSancion: "",
    };

    return sancionNoGrave;
  }
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
      nivelJerarquico: {
        clave: "otro",
        valor: entrada.servidorPublicoSancionado?.puesto || "",
      },
      denominacion: "",
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
        entrada.tipoSancion?.map((sancion) =>
          construirTipoSancion(sancion, entrada, tipoSalida)
        ) || [],
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
  // Esquema base común
  const esquemaBase = {
    fecha: entrada.fechaCaptura || "",
    expediente: entrada.expediente || "",
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
      tituloResolucion: entrada.resolucion?.sentido || "",
      fechaResolucion: "",
      fechaNotificacion: entrada.resolucion?.fechaNotificacion || "",
      urlResolucion: entrada.resolucion?.url || "",
      fechaResolucionFirme: "",
      fechaNotificacionFirme: "",
      urlResolucionFirme: "",
      fechaEjecucion: "",
      ordenJurisdiccional: "",
      autoridadResolutora: entrada.autoridadSancionadora || "",
      autoridadInvestigadora: "",
      autoridadSubstanciadora: "",
    },
    observaciones: entrada.observaciones || "",
  };

  if (tipoPersona === "fisica") {
    // Extraer nombres y apellidos del nombreRazonSocial
    const nombreCompleto =
      entrada.particularSancionado?.nombreRazonSocial || "";
    const partes = nombreCompleto.split(" ");
    const segundoApellido = partes.pop() || "";
    const primerApellido = partes.pop() || "";
    const nombres = partes.join(" ");

    return {
      ...esquemaBase,
      datosGenerales: {
        nombres,
        primerApellido,
        segundoApellido,
        curp: "",
        rfc: entrada.particularSancionado?.rfc || "",
        tipoDomicilio: "",
        domicilioMexico: {
          tipoVialidad: "",
          nombreVialidad:
            entrada.particularSancionado?.domicilioMexico?.vialidad?.valor ||
            "",
          numeroExterior:
            entrada.particularSancionado?.domicilioMexico?.numeroExterior || "",
          numeroInterior:
            entrada.particularSancionado?.domicilioMexico?.numeroInterior || "",
          coloniaLocalidad:
            entrada.particularSancionado?.domicilioMexico?.localidad?.valor ||
            "",
          municipioAlcaldia:
            entrada.particularSancionado?.domicilioMexico?.municipio || "",
          codigoPostal:
            entrada.particularSancionado?.domicilioMexico?.codigoPostal || "",
          entidadFederativa:
            entrada.particularSancionado?.domicilioMexico?.entidadFederativa ||
            "",
        },
        domicilioExtranjero: {
          ciudad:
            entrada.particularSancionado?.domicilioExtranjero
              ?.ciudadLocalidad || "",
          provincia:
            entrada.particularSancionado?.domicilioExtranjero
              ?.estadoProvincia || "",
          calle: entrada.particularSancionado?.domicilioExtranjero?.calle || "",
          numeroExterior:
            entrada.particularSancionado?.domicilioExtranjero?.numeroExterior ||
            "",
          numeroInterior:
            entrada.particularSancionado?.domicilioExtranjero?.numeroInterior ||
            "",
          codigoPostal:
            entrada.particularSancionado?.domicilioExtranjero?.codigoPostal ||
            "",
          pais:
            entrada.particularSancionado?.domicilioExtranjero?.pais?.valor ||
            "",
        },
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
          indemnizacion: {
            monto: "",
            moneda: "",
            plazoPago: {
              anios: "",
              meses: "",
              dias: "",
            },
            efectivamenteCobrada: {
              monto: "",
              moneda: "",
              fechaCobro: "",
            },
            fechaPagoTotal: "",
          },
          sancionEconomica: {
            monto: entrada.multa?.monto || "",
            moneda: entrada.multa?.moneda?.valor || "",
            plazoPago: {
              anios: "",
              meses: "",
              dias: "",
            },
            efectivamenteCobrada: {
              monto: "",
              moneda: "",
              fechaCobro: "",
            },
          },
          otro: "",
          denominacionSancion: "",
        })) || [],
    };
  } else {
    // moral
    return {
      ...esquemaBase,
      datosGenerales: {
        nombreRazonSocial:
          entrada.particularSancionado?.nombreRazonSocial || "",
        rfc: entrada.particularSancionado?.rfc || "",
        objetoSocial: entrada.particularSancionado?.objetoSocial || "",
        tipoDomicilio: "",
        domicilioMexico: {
          tipoVialidad: "",
          nombreVialidad:
            entrada.particularSancionado?.domicilioMexico?.vialidad?.valor ||
            "",
          numeroExterior:
            entrada.particularSancionado?.domicilioMexico?.numeroExterior || "",
          numeroInterior:
            entrada.particularSancionado?.domicilioMexico?.numeroInterior || "",
          coloniaLocalidad:
            entrada.particularSancionado?.domicilioMexico?.localidad?.valor ||
            "",
          municipioAlcaldia:
            entrada.particularSancionado?.domicilioMexico?.municipio || "",
          codigoPostal:
            entrada.particularSancionado?.domicilioMexico?.codigoPostal || "",
          entidadFederativa:
            entrada.particularSancionado?.domicilioMexico?.entidadFederativa ||
            "",
        },
        domicilioExtranjero: {
          ciudad:
            entrada.particularSancionado?.domicilioExtranjero
              ?.ciudadLocalidad || "",
          provincia:
            entrada.particularSancionado?.domicilioExtranjero
              ?.estadoProvincia || "",
          calle: entrada.particularSancionado?.domicilioExtranjero?.calle || "",
          numeroExterior:
            entrada.particularSancionado?.domicilioExtranjero?.numeroExterior ||
            "",
          numeroInterior:
            entrada.particularSancionado?.domicilioExtranjero?.numeroInterior ||
            "",
          codigoPostal:
            entrada.particularSancionado?.domicilioExtranjero?.codigoPostal ||
            "",
          pais:
            entrada.particularSancionado?.domicilioExtranjero?.pais?.valor ||
            "",
        },
      },
      datosDirGeneralReprLegal: {
        directorGeneral: {
          nombres: entrada.directorGeneral?.nombres || "",
          primerApellido: entrada.directorGeneral?.primerApellido || "",
          segundoApellido: entrada.directorGeneral?.segundoApellido || "",
          rfc: "",
          curp: entrada.directorGeneral?.curp || "",
        },
        representanteLegal: {
          nombres: entrada.apoderadoLegal?.nombres || "",
          primerApellido: entrada.apoderadoLegal?.primerApellido || "",
          segundoApellido: entrada.apoderadoLegal?.segundoApellido || "",
          rfc: "",
          curp: entrada.apoderadoLegal?.curp || "",
        },
      },
      tipoSancion:
        entrada.tipoSancion?.map((sancion) => ({
          clave: sancion.clave || "",
          inhabilitacion: {
            plazoAnios: 0,
            plazoMeses: 0,
            plazoDias: 0,
            fechaInicial: entrada.inhabilitacion?.fechaInicial || "",
            fechaFinal: entrada.inhabilitacion?.fechaFinal || "",
          },
          indemnizacion: {
            monto: 0,
            moneda: "",
            plazoPago: {
              anios: 0,
              meses: 0,
              dias: 0,
            },
            efectivamenteCobrada: {
              monto: 0,
              moneda: "",
              fechaCobro: "",
            },
            fechaPagoTotal: "",
          },
          sancionEconomica: {
            monto: entrada.multa?.monto || 0,
            moneda: entrada.multa?.moneda?.valor || "",
            plazoPago: {
              anios: 0,
              meses: 0,
              dias: 0,
            },
            efectivamenteCobrada: {
              monto: 0,
              moneda: "",
              fechaCobro: "",
            },
            fechaPagoTotal: "",
          },
          suspensionActividades: {
            plazoSuspensionAnios: 0,
            plazoSuspensionMeses: 0,
            plazoSuspensionDias: 0,
            fechaInicial: "",
            fechaFinal: "",
          },
          disolucionSociedad: {
            fechaDisolucion: "",
          },
          otro: {
            denominacionSancion: "",
          },
        })) || [],
    };
  }
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
