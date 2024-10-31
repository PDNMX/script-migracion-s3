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
  if (!plazo) return { anios: null, meses: null, dias: null };

  // Convertir a mayúsculas y eliminar paréntesis para uniformidad
  const plazoNormalizado = plazo.toUpperCase().replace(/[()]/g, null);

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
  const valor = genero?.valor?.toUpperCase() || null;
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
  const claveNormalizada = claveOriginal?.toUpperCase() || null;

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
    const valor = tipoFalta.valor || null;

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
    valorOriginal: tipoFalta || null,
  };
}

function clasificarPorTipoFalta(falta) {
  // Si no hay falta, va a otro
  if (!falta) {
    return "otro";
  }

  let valorFalta = null;

  // Si es objeto, tomamos el valor
  if (typeof falta === "object") {
    valorFalta = falta.valor || null;
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
    const valor = tipoFalta.valor || null;

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
    valorOriginal: tipoFalta || null,
  };
}

function construirTipoSancion(sancion, entrada, tipoEsquema) {
  const claveMapeada = mapearTipoSancion(sancion.clave || null, tipoEsquema);

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
          plazoMeses: null,
          plazoDias: null,
          fechaInicial: null,
          fechaFinal: null,
        };
        break;

      case "DESTITUCION":
        sancionGrave.destitucionEmpleo = {
          fechaDestitucion: null,
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
          fechaInicial: entrada.inhabilitacion?.fechaInicial || null,
          fechaFinal: entrada.inhabilitacion?.fechaFinal || null,
        };
        break;

      case "SANCION_ECONOMICA":
        sancionGrave.sancionEconomica = {
          monto: entrada.multa?.monto || null,
          moneda: entrada.multa?.moneda?.valor || null,
          plazoPago: {
            anios: null,
            meses: null,
            dias: null,
          },
          sancionEfectivamenteCobrada: {
            monto: null,
            moneda: null,
            fechaCobro: null,
          },
          fechaPagoTotal: null,
        };
        break;

      case "OTRO":
        sancionGrave.otro = {
          denominacionSancion: sancion.valor || null,
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
          tipo: null,
        };
        break;

      case "SUSPENSION":
        sancionNoGrave.suspension = {
          plazoMeses: null,
          plazoDias: null,
          plazoFechaInicial: null,
          plazoFechaFinal: null,
        };
        break;

      case "DESTITUCION":
        sancionNoGrave.destitucionEmpleo = {
          fechaDestitucion: null,
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
          plazoFechaInicial: entrada.inhabilitacion?.fechaInicial || null,
          plazoFechaFinal: entrada.inhabilitacion?.fechaFinal || null,
        };
        break;

      case "OTRO":
        sancionNoGrave.otro = {
          denominacionSancion: sancion.valor || null,
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

  // Función auxiliar para construir datos generales
  const construirDatosGenerales = (servidor) => {
    const datos = {
      nombres: servidor?.nombres || null,
      primerApellido: servidor?.primerApellido || null,
      segundoApellido: servidor?.segundoApellido || null,
      sexo: mapearGenero(servidor?.genero),
    };

    // Agregar CURP y RFC solo si existen
    if (servidor?.curp) {
      datos.curp = servidor.curp;
    }
    if (servidor?.rfc) {
      datos.rfc = servidor.rfc;
    }

    return datos;
  };

  // Función auxiliar para construir la resolución
  const construirResolucion = (entrada, tipoSalida) => {
    const resolucion = {
      tituloDocumento: null,
      fechaResolucion: entrada.resolucion?.fechaResolucion || null,
      fechaNotificacion: null,
      fechaResolucionFirme: null,
      fechaNotificacionFirme: null,
      autoridadResolutora: entrada.autoridadSancionadora || null,
      autoridadInvestigadora: null,
      autoridadSubstanciadora: null,
    };

    // Campos específicos para graves u otro
    if (tipoSalida === "graves" || tipoSalida === "otro") {
      resolucion.ordenJurisdiccional = null;
      resolucion.fechaEjecucion = null;

      // Agregar URLs solo si existen
      if (entrada.resolucion?.url) {
        resolucion.urlResolucion = entrada.resolucion.url;
      }
      if (entrada.resolucion?.urlResolucionFirme) {
        resolucion.urlResolucionFirme = entrada.resolucion.urlResolucionFirme;
      }
    }

    return resolucion;
  };

  const esquemaBase = {
    fecha: entrada.fechaCaptura || null,
    expediente: entrada.expediente || null,
    datosGenerales: construirDatosGenerales(entrada.servidorPublicoSancionado),
    empleoCargoComision: {
      entidadFederativa: null,
      nivelOrdenGobierno: null,
      ambitoPublico: null,
      nombreEntePublico: entrada.institucionDependencia?.nombre || null,
      siglasEntePublico: entrada.institucionDependencia?.siglas || null,
      nivelJerarquico: {
        clave: "OTRO",
        valor: entrada.servidorPublicoSancionado?.puesto || null,
      },
      denominacion: null,
      areaAdscripcion: null,
    },
    origenProcedimiento: {
      clave: null,
      valor: null,
    },
  };

  // Construir objeto faltaCometida
  const faltaCometidaBase = {
    clave: resultadoFalta.clave,
    normatividadInfringida: [
      {
        nombreNormatividad: null,
        articulo: null,
        fraccion: null,
      },
    ],
    descripcionHechos: entrada.causaMotivoHechos || null,
  };

  // Agregar valor solo si es necesario
  if (resultadoFalta.incluirValorOriginal) {
    faltaCometidaBase.valor = resultadoFalta.valorOriginal;
  }

  const resultado = {
    ...esquemaBase,
    faltaCometida: [faltaCometidaBase],
    resolucion: construirResolucion(entrada, tipoSalida),
    tipoSancion:
      entrada.tipoSancion?.map((sancion) =>
        construirTipoSancion(sancion, entrada, tipoSalida)
      ) || [],
    observaciones: entrada.observaciones || null,
  };

  return resultado;
}

function construirTipoSancionParticular(sancion, entrada, tipoPersona) {
  const claveMapeada = mapearTipoSancionParticular(
    sancion.clave || null,
    tipoPersona
  );

  const sancionBase = {
    clave: claveMapeada,
  };

  // Construir objeto según tipo de sanción
  switch (claveMapeada) {
    case "INHABILITACION":
      sancionBase.inhabilitacion = {
        plazoAnios: null,
        plazoMeses: null,
        plazoDias: null,
        fechaInicial: entrada.inhabilitacion?.fechaInicial || null,
        fechaFinal: entrada.inhabilitacion?.fechaFinal || null,
      };
      break;

    case "INDEMNIZACION":
      sancionBase.indemnizacion = {
        monto: null,
        moneda: null,
        plazoPago: {
          anios: null,
          meses: null,
          dias: null,
        },
        efectivamenteCobrada: {
          monto: null,
          moneda: null,
          fechaCobro: null,
        },
        fechaPagoTotal: null,
      };
      break;

    case "SANCION_ECONOMICA":
      sancionBase.sancionEconomica = {
        monto: entrada.multa?.monto || null,
        moneda:
          entrada.multa?.moneda?.valor === "PESO MEXICANO"
            ? "MXN"
            : entrada.multa?.moneda?.valor || null,
        plazoPago: {
          anios: null,
          meses: null,
          dias: null,
        },
        efectivamenteCobrada: {
          monto: null,
          moneda: null,
          fechaCobro: null,
        },
        fechaPagoTotal: null,
      };
      break;
  }

  // Campos específicos para personas morales
  if (tipoPersona === "moral") {
    if (claveMapeada === "SUSPENSION_ACTIVIDADES") {
      sancionBase.suspensionActividades = {
        plazoSuspensionAnios: null,
        plazoSuspensionMeses: null,
        plazoSuspensionDias: null,
        fechaInicial: null,
        fechaFinal: null,
      };
    }

    if (claveMapeada === "DISOLUCION_SOCIEDAD") {
      sancionBase.disolucionSociedad = {
        fechaDisolucion: null,
      };
    }

    if (claveMapeada === "OTRO") {
      sancionBase.otro = {
        denominacionSancion: sancion.valor || null,
      };
    }
  } else {
    // Para personas físicas, el campo otro es diferente
    if (claveMapeada === "OTRO") {
      sancionBase.otro = null;
      sancionBase.denominacionSancion = sancion.valor || null;
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
    valor: typeof falta === "object" ? falta.valor || null : falta || null,
    normatividadInfringida: [
      {
        nombreNormatividad: null,
        articulo: null,
        fraccion: null,
      },
    ],
    descripcionHechos: entrada.causaMotivoHechos || null,
  });

  // Función auxiliar para procesar domicilio
  const procesarDomicilio = (domicilio, tipo) => {
    if (tipo === "mexico") {
      return {
        tipoVialidad: null,
        nombreVialidad: domicilio?.vialidad?.valor || null,
        numeroExterior: domicilio?.numeroExterior || null,
        numeroInterior: domicilio?.numeroInterior || null,
        coloniaLocalidad: domicilio?.localidad?.valor || null,
        municipioAlcaldia: domicilio?.municipio || null,
        codigoPostal: domicilio?.codigoPostal || null,
        entidadFederativa:
          domicilio?.entidadFederativa?.clave || entidadFederativaDefault,
      };
    }
    return {
      ciudad: domicilio?.ciudadLocalidad || null,
      provincia: domicilio?.estadoProvincia || null,
      calle: domicilio?.calle || null,
      numeroExterior: domicilio?.numeroExterior || null,
      numeroInterior: domicilio?.numeroInterior || null,
      codigoPostal: domicilio?.codigoPostal || null,
      pais: domicilio?.pais?.valor || null,
    };
  };

  // Función auxiliar para construir el objeto resolución
  const construirResolucion = (entrada) => {
    const resolucion = {
      tituloDocumento: null,
      fechaResolucion: entrada.resolucion?.fechaResolucion || null,
      fechaNotificacion: entrada.resolucion?.fechaNotificacion || null,
      fechaResolucionFirme: entrada.resolucion?.fechaResolucionFirme || null,
      fechaNotificacionFirme:
        entrada.resolucion?.fechaNotificacionFirme || null,
      autoridadResolutora: entrada.autoridadSancionadora || null,
      autoridadInvestigadora: null,
      autoridadSubstanciadora: null,
      ordenJurisdiccional: null,
      fechaEjecucion: entrada.resolucion?.fechaEjecucion || null,
    };

    // Agregar URLs solo si existen
    if (entrada.resolucion?.url) {
      resolucion.urlResolucion = entrada.resolucion.url;
    }
    if (entrada.resolucion?.urlResolucionFirme) {
      resolucion.urlResolucionFirme = entrada.resolucion.urlResolucionFirme;
    }

    return resolucion;
  };

  const datosBase = {
    fecha: entrada.fechaCaptura || null,
    expediente: entrada.expediente || null,
    faltaCometida: [procesarTipoFalta(entrada.tipoFalta)],
    resolucion: construirResolucion(entrada),
    tipoSancion:
      entrada.tipoSancion?.map((sancion) =>
        construirTipoSancionParticular(sancion, entrada, tipoPersona)
      ) || [],
    observaciones: entrada.observaciones || null,
  };

  const construirDatosPersona = (persona) => {
    if (!persona) return null;

    const datos = {};

    if (persona.nombres) datos.nombres = persona.nombres;
    if (persona.primerApellido) datos.primerApellido = persona.primerApellido;
    if (persona.segundoApellido)
      datos.segundoApellido = persona.segundoApellido;
    if (persona.curp) datos.curp = persona.curp;
    if (persona.rfc) datos.rfc = persona.rfc;

    return Object.keys(datos).length > 0 ? datos : null;
  };

  if (tipoPersona === "fisica") {
    const nombreCompleto =
      entrada.particularSancionado?.nombreRazonSocial || null;
    const partes = nombreCompleto.split(" ").filter(Boolean);
    const nombres = partes.length > 2 ? partes.slice(0, -2).join(" ") : null;
    const primerApellido = partes.length > 1 ? partes[partes.length - 2] : null;
    const segundoApellido =
      partes.length > 0 ? partes[partes.length - 1] : null;

    const datosGenerales = {
      nombres,
      primerApellido,
      segundoApellido,
      tipoDomicilio: null,
      domicilioMexico: procesarDomicilio(
        entrada.particularSancionado?.domicilioMexico,
        "mexico"
      ),
      domicilioExtranjero: procesarDomicilio(
        entrada.particularSancionado?.domicilioExtranjero,
        "extranjero"
      ),
    };

    if (entrada.particularSancionado?.curp) {
      datosGenerales.curp = entrada.particularSancionado.curp;
    }
    if (entrada.particularSancionado?.rfc) {
      datosGenerales.rfc = entrada.particularSancionado.rfc;
    }

    return {
      ...datosBase,
      datosGenerales,
    };
  }

  // Persona moral
  const datosGenerales = {
    nombreRazonSocial: entrada.particularSancionado?.nombreRazonSocial || null,
    objetoSocial: entrada.particularSancionado?.objetoSocial || null,
    tipoDomicilio: null,
    domicilioMexico: procesarDomicilio(
      entrada.particularSancionado?.domicilioMexico,
      "mexico"
    ),
    domicilioExtranjero: procesarDomicilio(
      entrada.particularSancionado?.domicilioExtranjero,
      "extranjero"
    ),
  };

  if (entrada.particularSancionado?.rfc) {
    datosGenerales.rfc = entrada.particularSancionado.rfc;
  }

  const resultado = {
    ...datosBase,
    datosGenerales,
  };

  // Construir datosDirGeneralReprLegal solo si hay información
  const directorGeneral = construirDatosPersona(entrada.directorGeneral);
  const representanteLegal = construirDatosPersona(entrada.apoderadoLegal);

  if (directorGeneral || representanteLegal) {
    resultado.datosDirGeneralReprLegal = {};

    if (directorGeneral) {
      resultado.datosDirGeneralReprLegal.directorGeneral = directorGeneral;
    }

    if (representanteLegal) {
      resultado.datosDirGeneralReprLegal.representanteLegal =
        representanteLegal;
    }
  }

  return resultado;
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
