# Script de Procesamiento de Datos para PDN

Este script procesa archivos JSON que contienen información sobre sanciones a servidores públicos y particulares, transformándolos al formato requerido (versión 2 del sistema 3) para su carga en el API de Interconexión a la Plataforma Digital Nacional (PDN).

## 📋 Descripción General

El script realiza las siguientes operaciones:
- Lee archivos JSON de un directorio de entrada (incluyendo subdirectorios)
- Procesa y transforma los datos según el esquema requerido por la PDN
- Clasifica los registros en:
  - Servidores Públicos:
    - Faltas Graves
    - Faltas No Graves
    - Otros
  - Particulares:
    - Personas Físicas
    - Personas Morales
- Genera archivos JSON consolidados por cada categoría en el directorio de salida

## ⚠️ Advertencias Importantes

> **ATENCIÓN**: Antes de cargar los datos a la PDN, tenga en cuenta lo siguiente:

1. **Registros clasificados como "OTROS"**:
   - Si se genera un archivo de registros clasificados como "OTROS", estos deben ser revisados y reclasificados manualmente.
   - La reclasificación debe realizarse según su normatividad aplicable en:
     - Faltas graves
     - Faltas no graves
     - Particulares personas físicas
     - Particulares personas morales

2. **Ambiente de Pruebas**:
   - **IMPORTANTE**: Se recomienda SIEMPRE realizar primero las pruebas en un ambiente de desarrollo/pruebas.
   - Verificar la integridad y correcta clasificación de los datos antes de proceder con el ambiente de producción.
   - NO cargar datos directamente al ambiente de interconexión de la PDN sin haber realizado pruebas previas.

## 🔧 Requisitos

- Node.js versión 14 o superior
- Sistema operativo: Windows, Linux o macOS
- Archivos JSON de entrada con la estructura correcta (array de objetos)
- Permisos de lectura/escritura en los directorios de entrada y salida

## 📦 Instalación

1. Clonar o descargar el repositorio
```bash
git clone [url-del-repositorio]
```

2. Navegar al directorio del proyecto
```bash
cd [nombre-del-directorio]
```

3. Instalar dependencias (si las hubiera)
```bash
npm install
```

## 🚀 Uso

El script se ejecuta desde la línea de comandos con los siguientes parámetros:

```bash
node script.js --input <directorio-entrada> --output <directorio-salida> --entidad <clave-entidad>
```

### Parámetros:
- `--input`: Directorio donde se encuentran los archivos JSON a procesar
- `--output`: Directorio donde se guardarán los archivos procesados
- `--entidad`: Clave de la entidad federativa (dos dígitos)

### Ejemplo:
```bash
node script.js --input "./datos_entrada" --output "./datos_salida" --entidad 01
```

## 📄 Archivos de Salida

El script generará los siguientes archivos en el directorio de salida:
- `faltas_graves.json`: Servidores públicos con faltas graves
- `faltas_no_graves.json`: Servidores públicos con faltas no graves
- `faltas_otros.json`: Registros que requieren clasificación manual
- `particulares_personas_fisicas.json`: Sanciones a personas físicas
- `particulares_personas_morales.json`: Sanciones a personas morales

## 🔍 Verificación de Datos

Antes de proceder con la carga en la PDN, se recomienda:

1. Revisar los archivos generados para asegurar que la clasificación es correcta
2. Verificar que los datos cumplen con el esquema requerido por la PDN
3. Validar que los montos, fechas y demás campos críticos se hayan procesado correctamente
4. Reclasificar manualmente los registros en el archivo `faltas_otros.json`

## 🐛 Solución de Problemas

El script mostrará mensajes de error en caso de:
- Archivos JSON mal formados
- Directorios inexistentes o sin permisos
- Claves de entidad federativa inválidas
- Errores en el procesamiento de registros individuales
