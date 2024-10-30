# Procesador de Archivos JSON para Sistema de Sanciones

## Descripción
Script de Node.js para procesar y transformar archivos JSON conteniendo información sobre sanciones a servidores públicos y particulares. El script lee archivos JSON de un directorio de entrada, procesa su contenido y genera archivos JSON transformados en un directorio de salida con una estructura específica.

## Requisitos
- Node.js v22.x o superior
- Las siguientes bibliotecas nativas de Node.js:
  - `fs.promises`
  - `path`

## Estructura del Proyecto
```
proyecto/
├── src/
│   └── processor.js
├── pruebas/
│   ├── datos_entrada/
│   │   └── [archivos JSON de entrada]
│   └── datos_salida/
│       ├── SERVIDOR_PUBLICO_SANCIONADO/
│       │   ├── graves/
│       │   ├── no_graves/
│       │   └── otro/
│       └── PARTICULAR_SANCIONADO/
│           ├── fisica/
│           └── moral/
└── README.md
```

## Configuración
Antes de ejecutar el script, es necesario configurar las siguientes variables en el archivo `processor.js`:

```javascript
// Rutas de directorios
const inputDir = "../pruebas/datos_entrada/";  // Directorio donde se encuentran los archivos JSON a procesar
const outputDir = "../pruebas/datos_salida/";  // Directorio donde se guardarán los archivos procesados
```

Asegúrese de ajustar estas rutas según la estructura de directorios de su proyecto.

## Uso
1. Clone el repositorio:
   ```bash
   git clone [URL del repositorio]
   ```

2. Configure las rutas de los directorios como se mencionó anteriormente.

3. Coloque los archivos JSON a procesar en el directorio de entrada configurado.

4. Ejecute el script:
   ```bash
   node processor.js
   ```

El script procesará todos los archivos JSON encontrados en el directorio de entrada y sus subdirectorios, generando los archivos transformados en el directorio de salida.

## Estructura de Salida
Los archivos procesados se organizarán en la siguiente estructura:

- `SERVIDOR_PUBLICO_SANCIONADO/`
  - `graves/`: Sanciones graves de servidores públicos
  - `no_graves/`: Sanciones no graves de servidores públicos
  - `otro/`: Otras sanciones de servidores públicos
- `PARTICULAR_SANCIONADO/`
  - `fisica/`: Sanciones a personas físicas
  - `moral/`: Sanciones a personas morales

## Notas
- Los archivos de salida seguirán el patrón de nombre: `procesado_[directorio_padre]_[nombre_archivo].json`
- El script creará automáticamente los directorios necesarios si no existen
- Se manejan errores de procesamiento por archivo, permitiendo que el script continúe con los demás archivos en caso de error

