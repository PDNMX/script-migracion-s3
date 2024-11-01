# Script de transformación/migración de Datos para el Sistema 3 de la PDN

Este script procesa archivos JSON que contienen información sobre sanciones a servidores públicos y particulares (sistema 3), transformándolos al formato nuevo requerido (versión 2) para su interconexón con la Plataforma Digital Nacional (PDN).

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
- Genera archivos JSON consolidados por cada categoría
- Proporciona estadísticas detalladas del procesamiento

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

## 🚀 Uso

El script se ejecuta desde la línea de comandos con los siguientes parámetros:

```bash
node index.js --input <directorio-entrada> --output <directorio-salida> --entidad <clave-entidad>
```

### Parámetros:
- `--input`: Directorio donde se encuentran los archivos JSON a procesar
- `--output`: Directorio donde se guardarán los archivos procesados
- `--entidad`: Clave de la entidad federativa (dos dígitos)

### Ejemplo:
```bash
node index.js --input "./datos_entrada" --output "./datos_salida" --entidad 01
```

## 📊 Salida del Script

Durante la ejecución, el script mostrará:

1. **Información Inicial**:
```
Iniciando procesamiento...
Directorio de entrada: ./datos_entrada
Directorio de salida: ./datos_salida

Procesando archivos...
```

2. **Progreso de Procesamiento**:
```
Procesando archivo: ./datos_entrada/archivo1.json ✓
Procesando archivo: ./datos_entrada/archivo2.json ✓
```

3. **Resumen Final**:
```
============================================
           RESUMEN DE PROCESAMIENTO
============================================

📥 DATOS DE ENTRADA:
--------------------------------------------
Archivos procesados: X
Registros totales encontrados: X
├── Servidores públicos: X
├── Particulares: X
└── No válidos/con errores: X

📤 CLASIFICACIÓN DE SALIDA:
--------------------------------------------
Servidores Públicos:
├── Faltas graves: X
├── Faltas no graves: X
└── Otros: X

Particulares:
├── Personas físicas: X
└── Personas morales: X

📊 TOTALES:
--------------------------------------------
Total registros válidos de entrada: X
Total registros procesados: X
```

4. **Advertencia** (si aplica):
```
⚠️  ADVERTENCIA ⚠️
--------------------------------------------
Se encontraron X registros clasificados como "OTROS"
Estos registros requieren revisión y clasificación manual
según su normatividad aplicable.
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

1. Revisar el resumen de procesamiento para verificar que los números coincidan con lo esperado
2. Prestar especial atención a:
   - Registros no válidos o con errores
   - Registros clasificados como "OTROS"
   - Total de registros procesados vs. total de entrada
3. Verificar que los datos en los archivos de salida cumplan con el esquema requerido
4. Realizar la reclasificación manual de registros en "OTROS" si existen

## 🐛 Solución de Problemas

El script mostrará mensajes de error detallados en caso de:
- Archivos JSON mal formados
- Directorios inexistentes o sin permisos
- Errores en el procesamiento de registros individuales
- Claves de entidad federativa inválidas

## ⚖️ Notas Legales

Este script es una herramienta de apoyo para el procesamiento de datos. La responsabilidad de la correcta clasificación y veracidad de los datos recae en la institución que los reporta.
