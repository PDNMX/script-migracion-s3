const fs = require("fs").promises;
const path = require("path");

// Define input and output paths
const inputDir = "../pruebas/datos_entrada/";
const outputDir = "../pruebas/datos_salida/";
const entidadFederativaDefault = "01";
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

function procesarPlazoInhabilitacion(plazo) {
  if (!plazo) return { anios: "", meses: "", dias: "" };

  // Convertir a mayúsculas y eliminar paréntesis para uniformidad
  const plazoNormalizado = plazo.toUpperCase().replace(/[()]/g, "");

  // Caso especial para texto como "TRES MESES"
  const palabrasNumericas = {
    UN: 1,
    UNO: 1,
    DOS: 2,
    TRES: 3,
    CUATRO: 4,
    CINCO: 5,
    SEIS: 6,
    SIETE: 7,
    OCHO: 8,
    NUEVE: 9,
    DIEZ: 10,
  };

  // Verificar si es un formato textual
  for (const [palabra, numero] of Object.entries(palabrasNumericas)) {
    if (plazoNormalizado.includes(palabra)) {
      if (plazoNormalizado.includes("AÑO"))
        return { anios: numero.toString(), meses: 0, dias: 0 };
      if (plazoNormalizado.includes("MES"))
        return { anios: 0, meses: numero.toString(), dias: 0 };
      if (plazoNormalizado.includes("DIA"))
        return { anios: 0, meses: 0, dias: numero.toString() };
    }
  }

  // Para formato "0 día(s) 4 mes(es) 4 año(s)"
  const aniosMatch = plazoNormalizado.match(/(\d+)\s*AÑO/);
  const mesesMatch = plazoNormalizado.match(/(\d+)\s*MES/);
  const diasMatch = plazoNormalizado.match(/(\d+)\s*DIA/);

  return {
    anios: aniosMatch ? aniosMatch[1] : 0,
    meses: mesesMatch ? mesesMatch[1] : 0,
    dias: diasMatch ? diasMatch[1] : 0,
  };
}

function mapearGenero(genero) {
  const valor = genero?.valor?.toUpperCase() || "";
  switch (valor) {
    case "MASCULINO":
      return "HOMBRE";
    case "FEMENINO":
      return "MUJER";
    default:
      return valor;
  }
}

function mapearTipoSancionParticular(clave, tipoPersona) {
  // Mapeo del catálogo original a los nuevos valores
  const mapeoFisicas = {
    I: "INHABILITACION",
    IND: "INDEMNIZACION",
    SE: "SANCION_ECONOMICA",
    M: "SANCION_ECONOMICA",
    O: "OTRO",
  };

  const mapeoMorales = {
    I: "INHABILITACION",
    IND: "INDEMNIZACION",
    SE: "SANCION_ECONOMICA",
    M: "SANCION_ECONOMICA",
    S: "SUSPENSION_ACTIVIDADES",
    D: "DISOLUCION_SOCIEDAD",
    O: "OTRO",
  };

  // Normalizar la clave de entrada
  const claveNormalizada = clave.toUpperCase();

  // Seleccionar el mapeo según el tipo de persona
  const mapeo = tipoPersona === "fisica" ? mapeoFisicas : mapeoMorales;

  // Retornar el valor mapeado o OTRO si no hay coincidencia
  return mapeo[claveNormalizada] || "OTRO";
}

function mapearClaveFaltaParticular(claveOriginal, tipoPersona) {
  // Mapeo del catálogo original a los nuevos valores
  const mapeoFisicas = {
    I: "INHABILITACION",
    M: "SANCION_ECONOMICA",
    SE: "SANCION_ECONOMICA",
    IND: "INDEMNIZACION",
  };

  const mapeoMorales = {
    I: "INHABILITACION",
    M: "SANCION_ECONOMICA",
    SE: "SANCION_ECONOMICA",
    IND: "INDEMNIZACION",
    S: "SUSPENSION_ACTIVIDADES",
    D: "DISOLUCION_SOCIEDAD",
  };

  // Normalizar la clave de entrada
  const claveNormalizada = claveOriginal?.toUpperCase() || "";

  // Seleccionar el mapeo según el tipo de persona
  const mapeo = tipoPersona === "fisica" ? mapeoFisicas : mapeoMorales;

  // Retornar el valor mapeado o OTRO si no hay coincidencia
  return mapeo[claveNormalizada] || "OTRO";
}

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
        const plazos = procesarPlazoInhabilitacion(
          entrada.inhabilitacion?.plazo
        );
        sancionGrave.inhabilitacion = {
          plazoAnios: plazos.anios,
          plazoMeses: plazos.meses,
          plazoDias: plazos.dias,
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
        const plazos = procesarPlazoInhabilitacion(
          entrada.inhabilitacion?.plazo
        );
        sancionNoGrave.inhabilitacion = {
          plazoAnios: plazos.anios,
          plazoMeses: plazos.meses,
          plazoDias: plazos.dias,
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
      sexo: mapearGenero(entrada.servidorPublicoSancionado?.genero),
    },
    empleoCargoComision: {
      entidadFederativa:
        entrada.domicilioMexico?.entidadFederativa.clave ||
        entidadFederativaDefault,
      nivelOrdenGobierno: "",
      ambitoPublico: "",
      nombreEntePublico: entrada.institucionDependencia?.nombre || "",
      siglasEntePublico: entrada.institucionDependencia?.siglas || "",
      nivelJerarquico: {
        clave: "OTRO",
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
  const claveMapeada = mapearTipoSancionParticular(
    sancion.clave || "",
    tipoPersona
  );

  const sancionBase = {
    clave: claveMapeada,
  };

  // Construir objeto según tipo de sanción
  switch (claveMapeada) {
    case "INHABILITACION":
      sancionBase.inhabilitacion = {
        plazoAnios: "",
        plazoMeses: "",
        plazoDias: "",
        fechaInicial: entrada.inhabilitacion?.fechaInicial || "",
        fechaFinal: entrada.inhabilitacion?.fechaFinal || "",
      };
      break;

    case "INDEMNIZACION":
      sancionBase.indemnizacion = {
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
      };
      break;

    case "SANCION_ECONOMICA":
      sancionBase.sancionEconomica = {
        monto: entrada.multa?.monto || "",
        moneda:
          entrada.multa?.moneda?.valor === "PESO MEXICANO"
            ? "MXN"
            : entrada.multa?.moneda?.valor || "",
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
      };
      break;
  }

  // Campos específicos para personas morales
  if (tipoPersona === "moral") {
    if (claveMapeada === "SUSPENSION_ACTIVIDADES") {
      sancionBase.suspensionActividades = {
        plazoSuspensionAnios: "",
        plazoSuspensionMeses: "",
        plazoSuspensionDias: "",
        fechaInicial: "",
        fechaFinal: "",
      };
    }

    if (claveMapeada === "DISOLUCION_SOCIEDAD") {
      sancionBase.disolucionSociedad = {
        fechaDisolucion: "",
      };
    }

    if (claveMapeada === "OTRO") {
      sancionBase.otro = {
        denominacionSancion: sancion.valor || "",
      };
    }
  } else {
    // Para personas físicas, el campo otro es diferente
    if (claveMapeada === "OTRO") {
      sancionBase.otro = "";
      sancionBase.denominacionSancion = sancion.valor || "";
    }
  }

  return sancionBase;
}

function transformarParticular(entrada, tipoPersona) {
  // Función auxiliar para procesar tipoFalta
  const procesarTipoFalta = (falta) => ({
    clave:
      typeof falta === "object"
        ? mapearClaveFaltaParticular(falta.clave, tipoPersona)
        : mapearClaveFaltaParticular(falta, tipoPersona),
    valor: typeof falta === "object" ? falta.valor || "" : falta || "",
    normatividadInfringida: [
      {
        nombreNormatividad: "",
        articulo: "",
        fraccion: "",
      },
    ],
    descripcionHechos: entrada.causaMotivoHechos || "",
  });

  // Función auxiliar para procesar domicilio
  const procesarDomicilio = (domicilio, tipo) => {
    if (tipo === "mexico") {
      return {
        tipoVialidad: "",
        nombreVialidad: domicilio?.vialidad?.valor || "",
        numeroExterior: domicilio?.numeroExterior || "",
        numeroInterior: domicilio?.numeroInterior || "",
        coloniaLocalidad: domicilio?.localidad?.valor || "",
        municipioAlcaldia: domicilio?.municipio || "",
        codigoPostal: domicilio?.codigoPostal || "",
        entidadFederativa:
          domicilio?.entidadFederativa.clave || entidadFederativaDefault,
      };
    }
    return {
      ciudad: domicilio?.ciudadLocalidad || "",
      provincia: domicilio?.estadoProvincia || "",
      calle: domicilio?.calle || "",
      numeroExterior: domicilio?.numeroExterior || "",
      numeroInterior: domicilio?.numeroInterior || "",
      codigoPostal: domicilio?.codigoPostal || "",
      pais: domicilio?.pais?.valor || "",
    };
  };

  const datosBase = {
    faltaCometida: [procesarTipoFalta(entrada.tipoFalta)],
    tipoSancion:
      entrada.tipoSancion?.map((sancion) =>
        construirTipoSancionParticular(sancion, entrada, tipoPersona)
      ) || [],
  };

  if (tipoPersona === "fisica") {
    const nombreCompleto =
      entrada.particularSancionado?.nombreRazonSocial || "";
    const partes = nombreCompleto.split(" ").filter(Boolean);

    // Asegurarse de que haya suficientes partes para nombres y apellidos
    const nombres = partes.length > 2 ? partes.slice(0, -2).join(" ") : "";
    const primerApellido = partes.length > 1 ? partes[partes.length - 2] : "";
    const segundoApellido = partes.length > 0 ? partes[partes.length - 1] : "";

    return {
      ...datosBase,
      datosGenerales: {
        nombres,
        primerApellido,
        segundoApellido,
        curp: "",
        rfc: entrada.particularSancionado?.rfc || "",
        tipoDomicilio: "",
        domicilioMexico: procesarDomicilio(
          entrada.particularSancionado?.domicilioMexico,
          "mexico"
        ),
        domicilioExtranjero: procesarDomicilio(
          entrada.particularSancionado?.domicilioExtranjero,
          "extranjero"
        ),
      },
    };
  }

  // Persona moral
  return {
    ...datosBase,
    datosGenerales: {
      nombreRazonSocial: entrada.particularSancionado?.nombreRazonSocial || "",
      rfc: entrada.particularSancionado?.rfc || "",
      objetoSocial: entrada.particularSancionado?.objetoSocial || "",
      tipoDomicilio: "",
      domicilioMexico: procesarDomicilio(
        entrada.particularSancionado?.domicilioMexico,
        "mexico"
      ),
      domicilioExtranjero: procesarDomicilio(
        entrada.particularSancionado?.domicilioExtranjero,
        "extranjero"
      ),
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
  };
}

async function crearDirectorioSiNoExiste(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
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
