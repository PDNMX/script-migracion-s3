const {
  formatearMonto,
  procesarPlazoInhabilitacion,
  mapearGenero,
  calcularPlazoSuspension, 
} = require("./utils");
const {
  entidadFederativaDefault,
  faltasGraves,
  faltasNoGraves,
} = require("./constants");

const clasificarPorTipoFalta = (falta) => {
  if (!falta) return "otro";

  let valorFalta = null;
  if (typeof falta === "object") {
    valorFalta = falta.valor || null;
  } else {
    valorFalta = falta;
  }

  if (faltasGraves.includes(valorFalta)) return "graves";
  if (faltasNoGraves.includes(valorFalta)) return "no_graves";
  return "otro";
};

const obtenerClaveFalta = (tipoFalta) => {
  // Implementación de obtenerClaveFalta para servidores públicos
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
};

const obtenerClaveFaltaNoGrave = (tipoFalta) => {
  // Implementación de obtenerClaveFaltaNoGrave
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
};

const mapearTipoSancion = (clave, tipoEsquema) => {
  // Implementación de mapearTipoSancion
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
};

const construirTipoSancion = (sancion, entrada, tipoEsquema) => {
  // Implementación de construirTipoSancion para servidores públicos
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
        const plazoSuspension = calcularPlazoSuspension(
          entrada.inhabilitacion?.fechaInicial,
          entrada.inhabilitacion?.fechaFinal
        );
        sancionGrave.suspensionEmpleo = {
          plazoMeses: plazoSuspension.meses,
          plazoDias: plazoSuspension.dias,
          fechaInicial: entrada.inhabilitacion?.fechaInicial || null,
          fechaFinal: entrada.inhabilitacion?.fechaFinal || null,
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
          monto: formatearMonto(entrada.multa?.monto),
          moneda:
            entrada.multa?.moneda?.valor === "PESO MEXICANO"
              ? "MXN"
              : entrada.multa?.moneda?.valor || null,
          plazoPago: {
            anios: null,
            meses: null,
            dias: null,
          },
          sancionEfectivamenteCobrada: {
            monto: null, // Si en el futuro se agrega monto, usar formatearMonto()
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
        const plazoSuspension = calcularPlazoSuspension(
          entrada.inhabilitacion?.fechaInicial,
          entrada.inhabilitacion?.fechaFinal
        );
        sancionNoGrave.suspensionEmpleo = {
          plazoMeses: plazoSuspension.meses,
          plazoDias: plazoSuspension.dias,
          fechaInicial: entrada.inhabilitacion?.fechaInicial || null,
          fechaFinal: entrada.inhabilitacion?.fechaFinal || null,
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
};

const transformarServidorPublico = (entrada, tipoSalida) => {
  // Implementación de transformarServidorPublico
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
      entidadFederativa: entidadFederativaDefault || null,
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
};

module.exports = {
  clasificarPorTipoFalta,
  obtenerClaveFalta,
  obtenerClaveFaltaNoGrave,
  mapearTipoSancion,
  construirTipoSancion,
  transformarServidorPublico,
};
