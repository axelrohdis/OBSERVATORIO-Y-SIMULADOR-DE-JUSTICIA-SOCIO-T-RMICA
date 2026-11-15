# Registro de cambios

## [2026-11-14] - Integración de índices de vegetación VIIRS

### Agregado
- Integración de series temporales NDVI, EVI y EVI2 para Concepción urbano y su entorno.
- Incorporación de los seis CSV de vegetación exportados desde Google Earth Engine.
- Actualización del manifest con nueve datasets activos: LST, UHI, NDVI, EVI y EVI2.

### Modificado
- Actualización del catálogo de variables y regiones para reflejar el alcance actual del prototipo.
- Corrección de las fuentes de NDVI y UHI: VIIRS VNP13A1.002 y VNP21A1N.002, respectivamente.
- Modificación de `annualMeans` para calcular primero los promedios mensuales y luego asignar el mismo peso a cada mes.
- Incorporación de una prueba para verificar la ponderación mensual.

### Validación
- Vitest: 13 pruebas aprobadas.
- TypeScript: compilación sin errores.
- Vite: compilación de producción exitosa.
- Advertencia pendiente: bundle JavaScript principal de aproximadamente 982 kB, superior al umbral recomendado de 500 kB.

### Pendiente
- Integrar capas raster de vegetación en MapLibre.
- Evaluar división del bundle para optimizar la carga inicial.
- Actualizar README con las fuentes y variables vigentes.

## 2026-11-14 16:40 — Datos reales VIIRS nocturnos (VNP21A1N V002) y sección de datos numéricos
- Qué se modificó: la fuente de datos pasa de MODIS MOD11A2 (diurno, sintético) a VIIRS/Suomi NPP VNP21A1N V002 (temperatura superficial nocturna, 1 km, diaria desde 2012), vía Earth Engine (`NASA/VIIRS/002/VNP21A1N`). Nueva sección «Datos numéricos» (resumen y tabla mensual). La app solo muestra variables con datos en el manifest. Mensaje cuando no hay datos suficientes para un método.
- Archivos que cambiaron: earth-engine/export_lst_night.js (nuevo), scripts/import-ee-exports.mjs, src/components/NumericData.tsx (nuevo), src/App.tsx, src/data/catalog.ts, src/i18n.ts, src/components/Navbar.tsx, earth-engine/exports/trend_lst.csv y trend_lst_n.csv (datos de origen), public/data/*.
- Por qué: el equipo seleccionó esta colección en Worldview (C2545314559-LPCLOUD). La noche es el momento de mayor isla de calor (Oke).
- Pruebas ejecutadas: prueba en Earth Engine (LST_1KM = 276,68 K en julio de 2020: ya en kelvin, sin escala); exportación ejecutada por Axel; importación con `npm run import-data`; revisión de la app en la copia de Claude con datos simulados (tsc, build, pantalla).
- Resultado: meses válidos (mínimo 5 noches) de 167 posibles: Concepción urbano 161, entorno 166, Atacama 167, Amazonía 12 (nubes). Series 2012-02 a 2025-12.
- Pendiente: verificar en pantalla que los valores sean plausibles; el filtro de QC (bits 0-1 = 0) viene del catálogo y no está validado; definir las regiones finales (Concepción, Nonguén, referencia; Amazonía y Atacama sobran); capa de mapa de este producto en GIBS (falta la URL de Worldview); capa social (INE/Censo); panel de comparación; publicación pública; página en inglés, demo y declaración de IA.
- Commit: "feat: real VIIRS night LST data (VNP21A1N V002)"
- Autor: Axel con Claude.

Cada hito se anota arriba de los anteriores. Formato fijo para que Claude y ChatGPT lo lean igual.

## 2026-11-13 23:59 — Línea base y repositorio en GitHub
- Qué se modificó: se inicializó Git y se subió el proyecto a GitHub (rama main).
- Archivos que cambiaron: ninguno de código; se agregó este CHANGELOG.md.
- Por qué: tener una única fuente de verdad para Claude y ChatGPT.
- Commit: 13fb71b (initial project snapshot).
- Pruebas ejecutadas: en la copia de Claude, `tsc --noEmit`, `npm test` y `npm run build`; en el equipo de Axel, solo verificación de estructura y versiones (git status, npm ls, grep de archivos clave).
- Resultado: tsc sin errores, 12 de 12 pruebas, build correcto (copia de Claude). Versiones y archivos coinciden con la copia de Claude.
- Pendiente: datos reales de Earth Engine (hoy todo es sintético, 17 de 17 con demo: true); regiones definitivas Concepción y Nonguén; capa social; grilla de tendencias; panel de comparación; publicación pública; página en inglés, demo y declaración de IA.
- Autor: Axel con Claude.