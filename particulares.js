const { formatearMonto, getEntidadFederativa } = require('./utils');

const mapearTipoSancionParticular = (clave, tipoPersona) => {
  // Implementación de mapearTipoSancionParticular
  // Mapeo del catálogo original a los nuevos valores
  const mapeoFisicas = {
    I: 'INHABILITACION',
    IND: 'INDEMNIZACION',
    SE: 'SANCION_ECONOMICA',
    M: 'SANCION_ECONOMICA',
    O: 'OTRO',
  };

  const mapeoMorales = {
    I: 'INHABILITACION',
    IND: 'INDEMNIZACION',
    SE: 'SANCION_ECONOMICA',
    M: 'SANCION_ECONOMICA',
    S: 'SUSPENSION_ACTIVIDADES',
    D: 'DISOLUCION_SOCIEDAD',
    O: 'OTRO',
  };

  // Normalizar la clave de entrada
  const claveNormalizada = clave.toUpperCase();

  // Seleccionar el mapeo según el tipo de persona
  const mapeo = tipoPersona === 'fisica' ? mapeoFisicas : mapeoMorales;

  // Retornar el valor mapeado o OTRO si no hay coincidencia
  return mapeo[claveNormalizada] || 'OTRO';
};

const mapearClaveFaltaParticular = (claveOriginal, tipoPersona) => {
  // Implementación de mapearClaveFaltaParticular
  // Mapeo del catálogo original a los nuevos valores
  const mapeoFisicas = {
    I: 'INHABILITACION',
    M: 'SANCION_ECONOMICA',
    SE: 'SANCION_ECONOMICA',
    IND: 'INDEMNIZACION',
  };

  const mapeoMorales = {
    I: 'INHABILITACION',
    M: 'SANCION_ECONOMICA',
    SE: 'SANCION_ECONOMICA',
    IND: 'INDEMNIZACION',
    S: 'SUSPENSION_ACTIVIDADES',
    D: 'DISOLUCION_SOCIEDAD',
  };

  // Normalizar la clave de entrada
  const claveNormalizada = claveOriginal?.toUpperCase() || null;

  // Seleccionar el mapeo según el tipo de persona
  const mapeo = tipoPersona === 'fisica' ? mapeoFisicas : mapeoMorales;

  // Retornar el valor mapeado o OTRO si no hay coincidencia
  return mapeo[claveNormalizada] || 'OTRO';
};

const construirTipoSancionParticular = (sancion, entrada, tipoPersona) => {
  // Implementación de construirTipoSancionParticular
  const claveMapeada = mapearTipoSancionParticular(sancion.clave || null, tipoPersona);

  const sancionBase = {
    clave: claveMapeada,
  };

  // Construir objeto según tipo de sanción
  switch (claveMapeada) {
    case 'INHABILITACION':
      sancionBase.inhabilitacion = {
        plazoAnios: null,
        plazoMeses: null,
        plazoDias: null,
        fechaInicial: entrada.inhabilitacion?.fechaInicial || null,
        fechaFinal: entrada.inhabilitacion?.fechaFinal || null,
      };
      break;

    case 'INDEMNIZACION':
      sancionBase.indemnizacion = {
        monto: formatearMonto(entrada.multa?.monto),
        moneda: null,
        plazoPago: {
          anios: null,
          meses: null,
          dias: null,
        },
        efectivamenteCobrada: {
          monto: null, // Si en el futuro se agrega monto, usar formatearMonto()
          moneda: null,
          fechaCobro: null,
        },
        fechaPagoTotal: null,
      };
      break;

    case 'SANCION_ECONOMICA':
      sancionBase.sancionEconomica = {
        monto: formatearMonto(entrada.multa?.monto),
        moneda: entrada.multa?.moneda?.valor === 'PESO MEXICANO' ? 'MXN' : entrada.multa?.moneda?.valor || null,
        plazoPago: {
          anios: null,
          meses: null,
          dias: null,
        },
        efectivamenteCobrada: {
          monto: null, // Si en el futuro se agrega monto, usar formatearMonto()
          moneda: null,
          fechaCobro: null,
        },
        fechaPagoTotal: null,
      };
      break;
  }

  // Campos específicos para personas morales
  if (tipoPersona === 'moral') {
    if (claveMapeada === 'SUSPENSION_ACTIVIDADES') {
      sancionBase.suspensionActividades = {
        plazoSuspensionAnios: null,
        plazoSuspensionMeses: null,
        plazoSuspensionDias: null,
        fechaInicial: null,
        fechaFinal: null,
      };
    }

    if (claveMapeada === 'DISOLUCION_SOCIEDAD') {
      sancionBase.disolucionSociedad = {
        fechaDisolucion: null,
      };
    }

    if (claveMapeada === 'OTRO') {
      sancionBase.otro = {
        denominacionSancion: sancion.valor || null,
      };
    }
  } else {
    // Para personas físicas, el campo otro es diferente
    if (claveMapeada === 'OTRO') {
      sancionBase.otro = null;
      sancionBase.denominacionSancion = sancion.valor || null;
    }
  }

  return sancionBase;
};

const transformarParticular = (entrada, tipoPersona) => {
  // Implementación de transformarParticular
  // Función auxiliar para procesar tipoFalta
  const procesarTipoFalta = falta => ({
    clave:
      typeof falta === 'object'
        ? mapearClaveFaltaParticular(falta.clave, tipoPersona)
        : mapearClaveFaltaParticular(falta, tipoPersona),
    valor: typeof falta === 'object' ? falta.valor || null : falta || null,
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
    if (tipo === 'mexico') {
      return {
        tipoVialidad: null,
        nombreVialidad: domicilio?.vialidad?.valor || null,
        numeroExterior: domicilio?.numeroExterior || null,
        numeroInterior: domicilio?.numeroInterior || null,
        coloniaLocalidad: domicilio?.localidad?.valor || null,
        municipioAlcaldia: domicilio?.municipio || null,
        codigoPostal: domicilio?.codigoPostal || null,
        entidadFederativa: domicilio?.entidadFederativa?.clave || getEntidadFederativa(),
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
  const construirResolucion = entrada => {
    const resolucion = {
      tituloDocumento: null,
      fechaResolucion: entrada.resolucion?.fechaResolucion || null,
      fechaNotificacion: entrada.resolucion?.fechaNotificacion || null,
      fechaResolucionFirme: entrada.resolucion?.fechaResolucionFirme || null,
      fechaNotificacionFirme: entrada.resolucion?.fechaNotificacionFirme || null,
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
      entrada.tipoSancion?.map(sancion => construirTipoSancionParticular(sancion, entrada, tipoPersona)) || [],
    observaciones: entrada.observaciones || null,
  };

  const construirDatosPersona = persona => {
    if (!persona) return null;

    const datos = {};

    if (persona.nombres) datos.nombres = persona.nombres;
    if (persona.primerApellido) datos.primerApellido = persona.primerApellido;
    if (persona.segundoApellido) datos.segundoApellido = persona.segundoApellido;
    if (persona.curp) datos.curp = persona.curp;
    if (persona.rfc) datos.rfc = persona.rfc;

    return Object.keys(datos).length > 0 ? datos : null;
  };

  if (tipoPersona === 'fisica') {
    const nombreCompleto = entrada.particularSancionado?.nombreRazonSocial || null;
    const partes = nombreCompleto.split(' ').filter(Boolean);
    const nombres = partes.length > 2 ? partes.slice(0, -2).join(' ') : null;
    const primerApellido = partes.length > 1 ? partes[partes.length - 2] : null;
    const segundoApellido = partes.length > 0 ? partes[partes.length - 1] : null;

    const datosGenerales = {
      nombres,
      primerApellido,
      segundoApellido,
      tipoDomicilio: null,
      domicilioMexico: procesarDomicilio(entrada.particularSancionado?.domicilioMexico, 'mexico'),
      domicilioExtranjero: procesarDomicilio(entrada.particularSancionado?.domicilioExtranjero, 'extranjero'),
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
    domicilioMexico: procesarDomicilio(entrada.particularSancionado?.domicilioMexico, 'mexico'),
    domicilioExtranjero: procesarDomicilio(entrada.particularSancionado?.domicilioExtranjero, 'extranjero'),
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
      resultado.datosDirGeneralReprLegal.representanteLegal = representanteLegal;
    }
  }

  return resultado;
};

module.exports = {
  mapearTipoSancionParticular,
  mapearClaveFaltaParticular,
  construirTipoSancionParticular,
  transformarParticular,
};
