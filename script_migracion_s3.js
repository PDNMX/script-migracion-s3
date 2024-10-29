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

function mapearTipoSancion(clave, tipoEsquema) {
  // Mapeo del catálogo original a los nuevos valores
  const mapeoGraves = {
    I: "INHABILITACION",
    SE: "SANCION_ECONOMICA",
    S: "SUSPENSION",
    D: "DESTITUCION",
    M: "SANCION_ECONOMICA",
    IRSC: "SANCION_ECONOMICA",
    O: "OTRO",
  };

  const mapeoNoGraves = {
    I: "INHABILITACION",
    S: "SUSPENSION",
    D: "DESTITUCION",
    A: "AMONESTACION",
    O: "OTRO",
  };

  // Normalizar la clave de entrada
  const claveNormalizada = clave.toUpperCase();

  // Seleccionar el mapeo según el tipo de esquema
  const mapeo = tipoEsquema === "no_graves" ? mapeoNoGraves : mapeoGraves;

  // Retornar el valor mapeado o OTRO si no hay coincidencia
  return mapeo[claveNormalizada] || "OTRO";
}

function obtenerClaveFalta(tipoFalta) {
  // Si es un string "Dato no proporcionado"
  if (tipoFalta === "Dato no proporcionado") {
    return {
      clave: "OTRO",
      incluirValorOriginal: true,
      valorOriginal: tipoFalta,
    };
  }

  // Si es un objeto
  if (typeof tipoFalta === "object") {
    const valor = tipoFalta.valor || "";

    // Si el valor es "OTRO" o la clave es "OTRO"
    if (valor === "OTRO" || tipoFalta.clave === "OTRO") {
      return {
        clave: "OTRO",
        incluirValorOriginal: true,
        valorOriginal: valor,
      };
    }

    // Normalizar el valor para comparación
    const valorNormalizado = valor.toUpperCase();

    // Mapeo de faltas conocidas
    const mapeoFaltas = [
      { buscar: "ABUSO DE FUNCIONES", clave: "ABUSO_FUNCIONES" },
      { buscar: "COHECHO", clave: "COHECHO" },
      { buscar: "PECULADO", clave: "PECULADO" },
      { buscar: "DESVIO DE RECURSOS", clave: "DESVIO_RECURSOS_PUBLICOS" },
      {
        buscar: "UTILIZACION INDEBIDA DE INFORMACION",
        clave: "UTILIZACION_INDEBIDA_INFORMACION",
      },
      { buscar: "CONFLICTO DE INTERES", clave: "CONFLICTO_INTERES" },
      { buscar: "CONTRATACION INDEBIDA", clave: "CONTRATACION_INDEBIDA" },
      { buscar: "ENRIQUECIMIENTO OCULTO", clave: "ENRIQUECIMIENTO_OCULTO" },
      { buscar: "TRAFICO DE INFLUENCIAS", clave: "TRAFICO_INFLUENCIAS" },
      { buscar: "SIMULACION", clave: "SIMULACION_ACTO_JURIDICO" },
      { buscar: "ENCUBRIMIENTO", clave: "ENCUBRIMIENTO" },
      { buscar: "DESACATO", clave: "DESACATO" },
      { buscar: "NEPOTISMO", clave: "NEPOTISMO" },
      { buscar: "OBSTRUCCION", clave: "OBSTRUCCION" },
    ];

    // Buscar coincidencia
    const coincidencia = mapeoFaltas.find((item) =>
      valorNormalizado.includes(item.buscar)
    );

    if (coincidencia) {
      return {
        clave: coincidencia.clave,
        incluirValorOriginal: false,
      };
    }

    // Si no hay coincidencia, retornar el valor original
    return {
      clave: "OTRO",
      incluirValorOriginal: true,
      valorOriginal: valor,
    };
  }

  // Si es cualquier otro caso
  return {
    clave: "OTRO",
    incluirValorOriginal: true,
    valorOriginal: tipoFalta || "",
  };
}

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

function obtenerClaveFaltaNoGrave(tipoFalta) {
  // Si es un string "Dato no proporcionado"
  if (tipoFalta === "Dato no proporcionado") {
    return {
      clave: "OTRO",
      incluirValorOriginal: true,
      valorOriginal: tipoFalta,
    };
  }

  // Si es un objeto
  if (typeof tipoFalta === "object") {
    const valor = tipoFalta.valor || "";

    // Si el valor es "OTRO" o la clave es "OTRO"
    if (valor === "OTRO" || tipoFalta.clave === "OTRO") {
      return {
        clave: "OTRO",
        incluirValorOriginal: true,
        valorOriginal: valor,
      };
    }

    // Normalizar el valor para comparación
    const valorNormalizado = valor.toUpperCase();

    // Mapeo de faltas no graves
    const mapeoFaltasNoGraves = [
      { buscar: "CUMPLIR CON LAS FUNCIONES", clave: "CUMPLIR_FUNCIONES" },
      { buscar: "DENUNCIAR LAS FALTAS", clave: "DENUNCIAR_FALTAS" },
      { buscar: "ATENDER LAS INSTRUCCIONES", clave: "ATENDER_INSTRUCCIONES" },
      { buscar: "PRESENTAR DECLARACIONES", clave: "DECLARACIONES" },
      { buscar: "CUSTODIAR DOCUMENTACION", clave: "CUSTODIAR_DOCUMENTACION" },
      { buscar: "SUPERVISAR", clave: "SUPERVISAR_ART_49_LGRA" },
      { buscar: "RENDIR CUENTAS", clave: "RENDIR_CUENTAS" },
      {
        buscar: "COLABORAR EN PROCEDIMIENTOS",
        clave: "COLABORAR_PROCEDIMIENTOS",
      },
      { buscar: "CAUSAR DAÑOS", clave: "CAUSAR_DANOS" },
    ];

    // Buscar coincidencia
    const coincidencia = mapeoFaltasNoGraves.find((item) =>
      valorNormalizado.includes(item.buscar)
    );

    if (coincidencia) {
      return {
        clave: coincidencia.clave,
        incluirValorOriginal: false,
      };
    }

    // Si no hay coincidencia, retornar el valor original
    return {
      clave: "OTRO",
      incluirValorOriginal: true,
      valorOriginal: valor,
    };
  }

  // Si es cualquier otro caso
  return {
    clave: "OTRO",
    incluirValorOriginal: true,
    valorOriginal: tipoFalta || "",
  };
}

function construirTipoSancion(sancion, entrada, tipoEsquema) {
  const claveMapeada = mapearTipoSancion(sancion.clave || "", tipoEsquema);

  const base = {
    clave: claveMapeada,
  };

  if (tipoEsquema === "graves" || tipoEsquema === "otro") {
    const sancionGrave = {
      ...base,
    };

    // Usar la clave mapeada para determinar la estructura
    switch (claveMapeada) {
      case "SUSPENSION":
        sancionGrave.suspension = {
          plazoMeses: "",
          plazoDias: "",
          fechaInicial: "",
          fechaFinal: "",
        };
        break;

      case "DESTITUCION":
        sancionGrave.destitucionEmpleo = {
          fechaDestitucion: "",
        };
        break;

      case "INHABILITACION":
        sancionGrave.inhabilitacion = {
          plazoAnios: "",
          plazoMeses: "",
          plazoDias: "",
          fechaInicial: entrada.inhabilitacion?.fechaInicial || "",
          fechaFinal: entrada.inhabilitacion?.fechaFinal || "",
        };
        break;

      case "SANCION_ECONOMICA":
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
        break;

      case "OTRO":
        sancionGrave.otro = {
          denominacionSancion: sancion.valor || "",
        };
        break;
    }

    return sancionGrave;
  } else {
    // no_graves
    const sancionNoGrave = {
      ...base,
    };

    // Usar la clave mapeada para determinar la estructura
    switch (claveMapeada) {
      case "AMONESTACION":
        sancionNoGrave.amonestacion = {
          tipo: "",
        };
        break;

      case "SUSPENSION":
        sancionNoGrave.suspension = {
          plazoMeses: "",
          plazoDias: "",
          plazoFechaInicial: "",
          plazoFechaFinal: "",
        };
        break;

      case "DESTITUCION":
        sancionNoGrave.destitucionEmpleo = {
          fechaDestitucion: "",
        };
        break;

      case "INHABILITACION":
        sancionNoGrave.inhabilitacion = {
          plazoAnios: "",
          plazoMeses: "",
          plazoDias: "",
          plazoFechaInicial: entrada.inhabilitacion?.fechaInicial || "",
          plazoFechaFinal: entrada.inhabilitacion?.fechaFinal || "",
        };
        break;

      case "OTRO":
        sancionNoGrave.otro = {
          denominacionSancion: sancion.valor || "",
        };
        break;
    }

    return sancionNoGrave;
  }
}

function transformarServidorPublico(entrada, tipoSalida) {
  const resultadoFalta =
    tipoSalida === "no_graves"
      ? obtenerClaveFaltaNoGrave(entrada.tipoFalta)
      : obtenerClaveFalta(entrada.tipoFalta);

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

  // Construir objeto faltaCometida
  const faltaCometidaBase = {
    clave: resultadoFalta.clave,
    normatividadInfringida: [
      {
        nombreNormatividad: "",
        articulo: "",
        fraccion: "",
      },
    ],
    descripcionHechos: entrada.causaMotivoHechos || "",
  };

  // Agregar valor solo si es necesario
  if (resultadoFalta.incluirValorOriginal) {
    faltaCometidaBase.valor = resultadoFalta.valorOriginal;
  }

  if (tipoSalida === "graves" || tipoSalida === "otro") {
    return {
      ...esquemaBase,
      faltaCometida: [faltaCometidaBase],
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
      faltaCometida: [faltaCometidaBase],
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
        entrada.tipoSancion?.map((sancion) =>
          construirTipoSancion(sancion, entrada, tipoSalida)
        ) || [],
      observaciones: entrada.observaciones || "",
    };
  }
}

function construirTipoSancionParticular(sancion, entrada, tipoPersona) {
  const tipoSancionBase = {
    clave: sancion.clave || "",
  };

  switch (sancion.clave) {
    case "I": // Inhabilitación
      return {
        ...tipoSancionBase,
        inhabilitacion: {
          plazoAnios: "",
          plazoMeses: "",
          plazoDias: "",
          fechaInicial: entrada.inhabilitacion?.fechaInicial || "",
          fechaFinal: entrada.inhabilitacion?.fechaFinal || "",
        },
      };

    case "SE": // Sanción Económica
      return {
        ...tipoSancionBase,
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
          fechaPagoTotal: "",
        },
      };

    case "IN": // Indemnización
      return {
        ...tipoSancionBase,
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
      };

    case "SA": // Suspensión de Actividades (solo para morales)
      if (tipoPersona === "moral") {
        return {
          ...tipoSancionBase,
          suspensionActividades: {
            plazoSuspensionAnios: "",
            plazoSuspensionMeses: "",
            plazoSuspensionDias: "",
            fechaInicial: "",
            fechaFinal: "",
          },
        };
      }
      break;

    case "DS": // Disolución de Sociedad (solo para morales)
      if (tipoPersona === "moral") {
        return {
          ...tipoSancionBase,
          disolucionSociedad: {
            fechaDisolucion: "",
          },
        };
      }
      break;

    case "O": // Otro
      if (tipoPersona === "moral") {
        return {
          ...tipoSancionBase,
          otro: {
            denominacionSancion: "",
          },
        };
      } else {
        return {
          ...tipoSancionBase,
          otro: "",
          denominacionSancion: "",
        };
      }
      break;

    default:
      return tipoSancionBase;
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
        entrada.tipoSancion
          ?.map((sancion) =>
            construirTipoSancionParticular(sancion, entrada, tipoPersona)
          )
          .filter(Boolean) || [],
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
