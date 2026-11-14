# Detective de Tendencias (prototipo funcional)

Respuesta al desafío NASA Space Apps 2026 **"Be An Earth System Trend Detective!"**: el usuario elige una variable y una región, ve su serie de tiempo y la app calcula **cuánto cambia, y si el cambio es significativo** (regresión lineal con t-test e IC 95 %, Mann-Kendall y pendiente de Theil-Sen). Bilingüe ES/EN. Caso estrella: isla de calor superficial en Concepción.

> **Estado de los datos:** los CSV de `public/data/` son **sintéticos** (la app muestra un aviso rojo). Siguen los pasos de la sección 3 para reemplazarlos por datos reales de la NASA.

## 1. Correrlo en VS Code

1. Instala **Node.js 20 o superior** (nodejs.org) y VS Code.
2. Descomprime la carpeta y ábrela: `File > Open Folder…` → `trend-detective-proto`.
3. Abre la terminal integrada (`Ctrl+ñ` o `Terminal > New Terminal`) y ejecuta:
   ```
   npm install
   npm run dev
   ```
4. Abre la dirección que aparece (normalmente http://localhost:5173).
5. Para correr las pruebas del motor estadístico: `npm test`. Para generar la versión publicable: `npm run build` (queda en `dist/`).

## 2. Estructura

```
src/domain/      stats.ts (estadística pura) · series.ts (anomalías, promedios anuales, análisis) · stats.test.ts
src/data/        catalog.ts (variables y regiones, textos ES/EN) · load.ts (lee manifest y CSV)
src/components/  Chart.tsx (gráfico SVG sin librerías) · Result.tsx
src/App.tsx      flujo de 3 pasos; el estado vive en la URL (#v=...&r=...&m=...&l=...) para compartir vistas
public/data/     manifest.json + <variable>__<region>.csv  (date,value mensual)
earth-engine/    export_timeseries.js (se pega en el Code Editor)
scripts/         make-demo-data.mjs · import-ee-exports.mjs
```

## 3. Conectar datos reales (Earth Engine)

1. Entra a https://code.earthengine.google.com con la cuenta que tiene acceso.
2. Crea un script nuevo y pega `earth-engine/export_timeseries.js`.
3. **Verifica en el catálogo de datasets** (pestaña *Bands*) el ID, la banda, la escala y las unidades de cada colección. El script se escribió sin poder ejecutarlo contra Earth Engine, así que puede necesitar ajustes.
4. **Ajusta las regiones** (`REGIONS`): son rectángulos aproximados. Dibuja polígonos reales y que el equipo valide, sobre todo el *entorno de referencia* de Concepción.
5. Pulsa **Run** y abre la pestaña **Tasks**: pulsa **RUN** en cada una de las 4 exportaciones. Los CSV caen en Drive, carpeta `trend-detective`.
6. Descarga los 4 CSV (`trend_lst.csv`, `trend_ndvi.csv`, `trend_precip.csv`, `trend_airtemp.csv`) a `earth-engine/exports/` (créala).
7. En la terminal: `npm run import-data`. Reemplaza `public/data/` con los datos reales, calcula la isla de calor (LST urbana − LST entorno) y marca `demo:false`: el aviso rojo desaparece.
8. Recarga la app.

Las variables de modelo (GLDAS) y de precipitación (IMERG) son de resolución gruesa (≈ 25 y ≈ 10 km): una región pequeña cae en pocos píxeles y "urbano" y "entorno" pueden quedar en la misma celda. Por eso la isla de calor se calcula solo con MODIS LST (1 km).

**Agregar una región o variable:** añade su texto en `src/data/catalog.ts`, su geometría o colección en `export_timeseries.js` y la columna/variable en `scripts/import-ee-exports.mjs`.

## 4. Publicarlo (el enlace debe ser público y sin login)

- **GitHub Pages:** sube el repo, `npm run build` y publica `dist/` (la app usa rutas relativas).
- **Netlify o Vercel:** conecta el repo; comando `npm run build`, carpeta `dist`.

## 5. Checklist de entrega Space Apps (confirma con la guía 2026, que sale el 13 de noviembre)

- Página del proyecto **en inglés**; demo de **máx. 30 s de video o 7 diapositivas**, en inglés (o subtitulada).
- En "NASA Data": MODIS MOD11A2 (LST), MOD13A3 (NDVI), GPM IMERG y GLDAS, con las colecciones exactas que usen.
- **Declaración de uso de IA**: este código se generó con ayuda de IA; hay que declararlo en el formulario.
- No usar logos ni identificadores de la NASA en la interfaz.
- Si algún dato sigue siendo sintético en la demo, dilo expresamente.

## 6. Validación estadística y límites

- `stats.test.ts` compara regresión, IC 95 %, Mann-Kendall (con empates), Theil-Sen y las distribuciones contra **scipy** y **pymannkendall** (valores de referencia embebidos en el test).
- Solo detecta tendencias **lineales**. El método "anomalías mensuales" resta el promedio de cada mes (quita el ciclo estacional) pero deja **autocorrelación**: la app avisa si es alta. "Promedios anuales" es más conservador y usa solo años con ≥ 10 meses.
- LST es temperatura de **superficie** en un paso diurno; la isla de calor de Oke se define con temperatura del **aire** (máximo nocturno). La app lo explica en pantalla.
