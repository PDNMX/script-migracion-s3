const fs = require("fs").promises;
const path = require("path");

const INDICADORES_PERSONA_MORAL = [
  ["SA", "S.A."],
  ["SA DE CV", "S.A. DE C.V.", "S.A DE C.V", "SA DE CV"],
  ["S DE RL", "S.DE.R.L.", "SRL", "S.R.L."],
  ["S DE RL DE CV", "S.DE.R.L.DE.C.V.", "S DE RL DE CV"],
  ["S EN C", "S.EN.C."],
  ["S EN NC", "S.EN.N.C."],
  ["SNC", "S.N.C."],
  ["SOCIEDAD ANONIMA"],
  ["ASOCIACION CIVIL", "AC", "A.C."],
  ["SC", "S.C."],
  ["SAPI", "S.A.P.I."],
  ["SAB", "S.A.B."],
];

// En utils.js

/**
 * Determina el tipo de persona utilizando múltiples criterios
 * @param {Object} params - Parámetros para determinar el tipo
 * @param {string} params.nombreRazonSocial - Nombre o razón social
 * @param {string} params.tipoPersona - Tipo declarado (F o M)
 * @param {string} params.rfc - RFC si está disponible
 * @returns {string|null} 'fisica', 'moral' o null
 */
const determinarTipoPersona = ({ nombreRazonSocial, tipoPersona, rfc }) => {
  console.log("\nProceso de determinación de tipo:");

  // 1. Primero verificar por tipoPersona (prioridad más alta)
  if (tipoPersona && tipoPersona !== "Dato no proporcionado") {
    if (tipoPersona === "F") {
      console.log("✓ Determinado como persona física por tipo declarado");
      return "fisica";
    }
    if (tipoPersona === "M") {
      console.log("✓ Determinado como persona moral por tipo declarado");
      return "moral";
    }
  }

  // 2. Verificar por nombreRazonSocial
  if (nombreRazonSocial) {
    const nombreNormalizado = nombreRazonSocial
      .toUpperCase()
      .replace(/\./g, "");

    // Buscar indicadores de persona moral
    for (const variantes of INDICADORES_PERSONA_MORAL) {
      for (const indicador of variantes) {
        const indicadorNormalizado = indicador.replace(/\./g, "");
        if (nombreNormalizado.includes(indicadorNormalizado)) {
          console.log("✓ Determinado como persona moral por razón social");
          return "moral";
        }
      }
    }

    // Si no hay indicadores de persona moral, verificar si parece nombre de persona física
    const palabras = nombreNormalizado.split(/\s+/).filter(Boolean);
    if (palabras.length >= 2) {
      console.log(
        "✓ Determinado como persona física por estructura del nombre"
      );
      return "fisica";
    }
  }

  // 3. Verificar por RFC (si está disponible)
  if (rfc) {
    const rfcLimpio = rfc.trim().toUpperCase();
    if (rfcLimpio.length === 13) {
      console.log("✓ Determinado como persona física por RFC");
      return "fisica";
    }
    if (rfcLimpio.length === 12) {
      console.log("✓ Determinado como persona moral por RFC");
      return "moral";
    }
  }

  console.log("✗ No se pudo determinar el tipo de persona");
  return null;
};

// Catálogo de entidades federativas
const catalogoEntidadesFederativas = {
  "01": "AGUASCALIENTES",
  "02": "BAJA CALIFORNIA",
  "03": "BAJA CALIFORNIA SUR",
  "04": "CAMPECHE",
  "05": "COAHUILA",
  "06": "COLIMA",
  "07": "CHIAPAS",
  "08": "CHIHUAHUA",
  "09": "CIUDAD DE MÉXICO",
  10: "DURANGO",
  11: "GUANAJUATO",
  12: "GUERRERO",
  13: "HIDALGO",
  14: "JALISCO",
  15: "MÉXICO",
  16: "MICHOACÁN",
  17: "MORELOS",
  18: "NAYARIT",
  19: "NUEVO LEÓN",
  20: "OAXACA",
  21: "PUEBLA",
  22: "QUERÉTARO",
  23: "QUINTANA ROO",
  24: "SAN LUIS POTOSÍ",
  25: "SINALOA",
  26: "SONORA",
  27: "TABASCO",
  28: "TAMAULIPAS",
  29: "TLAXCALA",
  30: "VERACRUZ",
  31: "YUCATÁN",
  32: "ZACATECAS",
  33: "FEDERACIÓN",
};
// Función para calcular plazo de suspensión
const calcularPlazoSuspension = (fechaInicial, fechaFinal) => {
  if (!fechaInicial || !fechaFinal) {
    return { meses: null, dias: null };
  }

  try {
    // Convertir strings a objetos Date
    const inicio = new Date(fechaInicial);
    const fin = new Date(fechaFinal);

    // Verificar si las fechas son válidas
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return { meses: null, dias: null };
    }

    // Verificar que la fecha final sea posterior a la inicial
    if (fin < inicio) {
      return { meses: null, dias: null };
    }

    // Calcular la diferencia en días total
    const diffTime = Math.abs(fin - inicio);
    const totalDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Calcular meses completos y días restantes
    const meses = Math.floor(totalDias / 30);
    const dias = totalDias % 30;

    return {
      meses: meses || null, // Si es 0, convertir a null
      dias: dias || null, // Si es 0, convertir a null
    };
  } catch (error) {
    console.error("Error calculando el plazo de suspensión:", error);
    return { meses: null, dias: null };
  }
};

// Función para formatear montos
const formatearMonto = (monto) => {
  if (monto === null || monto === undefined) return null;

  // Si el monto es string, intentar convertirlo a número
  let montoNumerico;

  if (typeof monto === "string") {
    // Remover caracteres no numéricos excepto punto y guion
    const montoLimpio = monto.replace(/[^0-9.-]/g, "");
    montoNumerico = parseFloat(montoLimpio);
  } else {
    montoNumerico = monto;
  }

  // Si no es un número válido después de la conversión, retornar null
  if (isNaN(montoNumerico)) return null;

  // Redondear al entero más cercano
  return Math.round(montoNumerico);
};

// Variable para almacenar la entidad federativa
let entidadFederativaDefault = null;

// Función getter para obtener la entidad federativa
const getEntidadFederativa = () => {
  if (!entidadFederativaDefault) {
    throw new Error(
      "Entidad federativa no ha sido configurada. Asegúrate de ejecutar getCommandLineArgs primero."
    );
  }
  return entidadFederativaDefault;
};

// Función para obtener argumentos de línea de comandos
const getCommandLineArgs = () => {
  const args = process.argv.slice(2);
  const usage = `
    Uso: node script.js --input <inputDir> --output <outputDir> --entidad <claveEntidad>

    Opciones:
      --input     Directorio de entrada donde se encuentran los archivos JSON
      --output    Directorio de salida donde se guardarán los archivos procesados
      --entidad   Clave de la entidad federativa (dos dígitos)

    Ejemplo:
      node script.js --input "./datos_entrada" --output "./datos_salida" --entidad 01

    Catálogo de entidades federativas:
${Object.entries(catalogoEntidadesFederativas)
  .filter(([, nombre]) => nombre !== "FEDERACIÓN")
  .sort(([, nombreA], [, nombreB]) => nombreA.localeCompare(nombreB))
  .map(([clave, nombre]) => `      ${clave}: ${nombre}`)
  .join("\n")}
  `;

  if (
    args.length !== 6 ||
    !args.includes("--input") ||
    !args.includes("--output") ||
    !args.includes("--entidad")
  ) {
    console.log(usage);
    process.exit(1);
  }

  const inputIndex = args.indexOf("--input");
  const outputIndex = args.indexOf("--output");
  const entidadIndex = args.indexOf("--entidad");

  const entidadFederativa = args[entidadIndex + 1];

  // Validar el formato de la entidad federativa
  if (!entidadFederativa.match(/^\d{2}$/)) {
    console.error(
      "Error: La clave de entidad federativa debe ser un número de dos dígitos"
    );
    console.log(usage);
    process.exit(1);
  }

  // Validar que la entidad federativa exista en el catálogo
  if (!catalogoEntidadesFederativas[entidadFederativa]) {
    console.error(
      `Error: La clave de entidad federativa "${entidadFederativa}" no es válida`
    );
    console.log(usage);
    process.exit(1);
  }

  // Establecer la entidad federativa default
  entidadFederativaDefault = entidadFederativa;

  return {
    inputDir: path.resolve(args[inputIndex + 1]),
    outputDir: path.resolve(args[outputIndex + 1]),
    entidadFederativa,
  };
};

// Función para crear directorio si no existe
const crearDirectorioSiNoExiste = async (dir) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Función para validar archivos JSON
const validarArchivosJSON = async (rutaArchivo) => {
  try {
    const contenido = await fs.readFile(rutaArchivo, "utf8");
    const datos = JSON.parse(contenido);

    if (!Array.isArray(datos)) {
      throw new Error(
        `El archivo ${rutaArchivo} no contiene un arreglo de objetos JSON`
      );
    }

    return true;
  } catch (error) {
    console.error(`Error validando archivo ${rutaArchivo}:`, error.message);
    return false;
  }
};

// Función para procesar el plazo de inhabilitación
const procesarPlazoInhabilitacion = (plazo) => {
  if (!plazo) return { anios: null, meses: null, dias: null };

  const plazoNormalizado = plazo.toUpperCase().replace(/[()]/g, "");

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

  for (const [palabra, numero] of Object.entries(palabrasNumericas)) {
    if (plazoNormalizado.includes(palabra)) {
      if (plazoNormalizado.includes("AÑO"))
        return { anios: numero, meses: 0, dias: 0 };
      if (plazoNormalizado.includes("MES"))
        return { anios: 0, meses: numero, dias: 0 };
      if (plazoNormalizado.includes("DIA"))
        return { anios: 0, meses: 0, dias: numero };
    }
  }

  const aniosMatch = plazoNormalizado.match(/(\d+)\s*AÑO/);
  const mesesMatch = plazoNormalizado.match(/(\d+)\s*MES/);
  const diasMatch = plazoNormalizado.match(/(\d+)\s*DIA/);

  return {
    anios: aniosMatch ? parseInt(aniosMatch[1]) : 0,
    meses: mesesMatch ? parseInt(mesesMatch[1]) : 0,
    dias: diasMatch ? parseInt(diasMatch[1]) : 0,
  };
};

// Función para mapear género
const mapearGenero = (genero) => {
  const valor = genero?.valor?.toUpperCase() || null;
  switch (valor) {
    case "MASCULINO":
      return "HOMBRE";
    case "FEMENINO":
      return "MUJER";
    default:
      return valor;
  }
};

module.exports = {
  formatearMonto,
  getCommandLineArgs,
  crearDirectorioSiNoExiste,
  validarArchivosJSON,
  procesarPlazoInhabilitacion,
  mapearGenero,
  calcularPlazoSuspension,
  getEntidadFederativa,
  determinarTipoPersona,
};
