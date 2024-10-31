const fs = require("fs").promises;
const path = require("path");

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

// Función para obtener argumentos de línea de comandos
const getCommandLineArgs = () => {
  const args = process.argv.slice(2);
  const usage = `
    Uso: node script.js --input <inputDir> --output <outputDir>

    Opciones:
      --input    Directorio de entrada donde se encuentran los archivos JSON
      --output   Directorio de salida donde se guardarán los archivos procesados

    Ejemplo:
      node script.js --input "./datos_entrada" --output "./datos_salida"
  `;

  if (args.length !== 4 || !args.includes('--input') || !args.includes('--output')) {
    console.log(usage);
    process.exit(1);
  }

  const inputIndex = args.indexOf('--input');
  const outputIndex = args.indexOf('--output');

  return {
    inputDir: path.resolve(args[inputIndex + 1]),
    outputDir: path.resolve(args[outputIndex + 1])
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
      throw new Error(`El archivo ${rutaArchivo} no contiene un arreglo de objetos JSON`);
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
    UN: 1, UNO: 1, DOS: 2, TRES: 3, CUATRO: 4,
    CINCO: 5, SEIS: 6, SIETE: 7, OCHO: 8,
    NUEVE: 9, DIEZ: 10
  };

  for (const [palabra, numero] of Object.entries(palabrasNumericas)) {
    if (plazoNormalizado.includes(palabra)) {
      if (plazoNormalizado.includes("AÑO")) return { anios: numero, meses: 0, dias: 0 };
      if (plazoNormalizado.includes("MES")) return { anios: 0, meses: numero, dias: 0 };
      if (plazoNormalizado.includes("DIA")) return { anios: 0, meses: 0, dias: numero };
    }
  }

  const aniosMatch = plazoNormalizado.match(/(\d+)\s*AÑO/);
  const mesesMatch = plazoNormalizado.match(/(\d+)\s*MES/);
  const diasMatch = plazoNormalizado.match(/(\d+)\s*DIA/);

  return {
    anios: aniosMatch ? parseInt(aniosMatch[1]) : 0,
    meses: mesesMatch ? parseInt(mesesMatch[1]) : 0,
    dias: diasMatch ? parseInt(diasMatch[1]) : 0
  };
};

// Función para mapear género
const mapearGenero = (genero) => {
  const valor = genero?.valor?.toUpperCase() || null;
  switch (valor) {
    case "MASCULINO": return "HOMBRE";
    case "FEMENINO": return "MUJER";
    default: return valor;
  }
};

module.exports = {
  formatearMonto,
  getCommandLineArgs,
  crearDirectorioSiNoExiste,
  validarArchivosJSON,
  procesarPlazoInhabilitacion,
  mapearGenero
};
