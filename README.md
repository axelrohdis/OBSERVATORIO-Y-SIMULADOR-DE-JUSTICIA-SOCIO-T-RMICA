# Observatorio y simulador de justicia socio-térmica
### Urban Heat Observatory — NASA Space Apps Challenge 2026

Prototipo desarrollado como respuesta al desafío **"Be An Earth System Trend Detective!"** de NASA Space Apps Challenge 2026.

El proyecto explora la evolución temporal de variables ambientales y sus relaciones con las condiciones territoriales del Gran Concepción, Chile. Su objetivo es facilitar la identificación de tendencias ambientales y aportar información para comprender las desigualdades socio-térmicas en el territorio urbano.

La aplicación permite seleccionar una variable y una región, visualizar su serie temporal y analizar la evolución mediante métodos estadísticos de detección de tendencias.

**Interfaz bilingüe:** español e inglés (ES/EN).

---

## 1. Estado actual del prototipo

La versión actual trabaja con datos satelitales de NASA VIIRS y series derivadas para dos áreas de estudio:

- **Concepción urbano:** área urbana de referencia.
- **Entorno de Concepción:** área de referencia exterior a la ciudad.

### Variables disponibles

| Variable | Descripción | Fuente | Resolución |
|---|---|---|---|
| LST | Temperatura superficial nocturna | VIIRS VNP21A1N.002 | 1 km |
| UHI | Isla de calor superficial nocturna derivada | VIIRS VNP21A1N.002 | Derivada |
| NDVI | Índice de vegetación | VIIRS VNP13A1.002 | 500 m |
| EVI | Índice de vegetación mejorado | VIIRS VNP13A1.002 | 500 m |
| EVI2 | Índice de vegetación mejorado de dos bandas | VIIRS VNP13A1.002 | 500 m |

Actualmente existen nueve datasets activos:

- LST: urbano y entorno.
- UHI: urbano.
- NDVI: urbano y entorno.
- EVI: urbano y entorno.
- EVI2: urbano y entorno.

Los datos están almacenados en archivos CSV y se declaran mediante `public/data/manifest.json`.

**Estado de los datos:** las series activas corresponden a exportaciones de Google Earth Engine a partir de colecciones satelitales de NASA. No son datos sintéticos.

---

## 2. Fuentes de datos y metodología

### 2.1. Temperatura superficial nocturna (LST)

**Fuente:** NASA VIIRS / Suomi NPP — `VNP21A1N.002`.

- Resolución espacial: 1 km.
- Observaciones de temperatura superficial nocturna.
- Las series utilizadas corresponden a promedios mensuales de observaciones disponibles en noches despejadas.
- Unidad de análisis: grados Celsius (°C).

La temperatura superficial representa la temperatura de la superficie del suelo, pavimento, vegetación y otros materiales. No equivale a la temperatura del aire experimentada por las personas.

### 2.2. Isla de calor superficial (UHI)

Indicador derivado de las series LST:

**UHI = LST urbana − LST del entorno de referencia**

- Resultado positivo: la superficie urbana presenta mayor temperatura que el entorno.
- Resultado negativo: el entorno presenta mayor temperatura que la superficie urbana.
- Resultado cercano a cero: temperaturas superficiales similares.

El indicador representa una isla de calor urbana superficial nocturna, calculada a partir de observaciones satelitales en noches despejadas.

Es importante distinguirla de la isla de calor atmosférica descrita por Oke, que se basa en la temperatura del aire.

### 2.3. Índices de vegetación

**Fuente:** NASA VIIRS / Suomi NPP — `VNP13A1.002`.

Producto de índices de vegetación con resolución espacial de 500 m y composiciones de 16 días.

Se utilizan tres indicadores:

- **NDVI:** Normalized Difference Vegetation Index. Permite estimar el verdor relativo de la vegetación.
- **EVI:** Enhanced Vegetation Index. Busca mejorar la sensibilidad en zonas con vegetación abundante y reducir algunas influencias del suelo y la atmósfera.
- **EVI2:** Two-band Enhanced Vegetation Index. Variante del EVI que utiliza dos bandas espectrales.

Los índices son adimensionales y sus valores no representan directamente porcentajes de cobertura vegetal ni mediciones de salud ecológica.

Las exportaciones incorporan filtros de calidad de los píxeles mediante las bandas de control de calidad del producto.

La interpretación de sus tendencias debe considerar la estacionalidad, la cobertura del suelo y la mezcla de superficies dentro de cada píxel.

---

## 3. Arquitectura y tecnologías

Aplicación web estática, sin backend.

| Tecnología | Función |
|---|---|
| React 18 | Interfaz de usuario |
| TypeScript | Tipado y estructura del código |
| Vite 5 | Desarrollo y compilación |
| Bootstrap 5.3 | Estilos de interfaz |
| MapLibre GL | Visualización cartográfica |
| NASA GIBS | Imágenes y capas cartográficas |
| Vitest | Pruebas automatizadas |
| Google Earth Engine | Procesamiento y exportación de datos satelitales |

### Arquitectura general

- Los datos se cargan desde archivos CSV locales.
- `manifest.json` declara los datasets disponibles.
- `catalog.ts` contiene metadatos, descripciones y regiones.
- `domain/` contiene la lógica estadística independiente de la interfaz.
- Los textos de la aplicación se centralizan en `i18n.ts`.
- El estado de navegación se conserva en la URL mediante parámetros hash.

### Visualización cartográfica

El mapa utiliza MapLibre GL y servicios de NASA GIBS.

La capa contextual de temperatura actualmente disponible en el mapa corresponde a MODIS Terra L3 Land Surface Temperature Monthly Day.

**Importante:** esta capa diurna de MODIS es una referencia visual independiente. No corresponde a las series estadísticas nocturnas VIIRS VNP21A1N utilizadas para calcular LST y UHI.

La integración de capas raster de vegetación NDVI, EVI y EVI2 en el mapa está pendiente. Su disponibilidad como series estadísticas no implica que ya estén disponibles como capas geográficas.

---

## 4. Estructura del proyecto

```text
PROTOTIPO/
│
├── public/
│   └── data/
│       ├── manifest.json
│       ├── lst__concepcion_urbano.csv
│       ├── lst__concepcion_entorno.csv
│       ├── uhi__concepcion_urbano.csv
│       ├── ndvi__concepcion_urbano.csv
│       ├── ndvi__concepcion_entorno.csv
│       ├── evi__concepcion_urbano.csv
│       ├── evi__concepcion_entorno.csv
│       ├── evi2__concepcion_urbano.csv
│       └── evi2__concepcion_entorno.csv
│
├── src/
│   ├── components/
│   │   ├── Chart.tsx
│   │   ├── MapView.tsx
│   │   └── Result.tsx
│   │
│   ├── data/
│   │   ├── catalog.ts
│   │   ├── gibs.ts
│   │   └── load.ts
│   │
│   ├── domain/
│   │   ├── series.ts
│   │   ├── stats.ts
│   │   └── stats.test.ts
│   │
│   ├── App.tsx
│   └── i18n.ts
│
├── earth-engine/
│   ├── export_lst_night.js
│   ├── export_vegetation.js
│   └── exports/
│
├── scripts/
│
├── index.html
├── package.json
├── vite.config.ts
├── README.md
└── CHANGELOG.md
```

La estructura representa los componentes principales del prototipo. Pueden existir archivos auxiliares adicionales para desarrollo y exportación.

---

## 5. Instalación y ejecución local

### Requisitos

- Node.js 20 o superior.
- npm.
- Visual Studio Code.
- Git (recomendado).

### Clonar el repositorio

```bash
git clone https://github.com/axelrohdis/OBSERVATORIO-Y-SIMULADOR-DE-JUSTICIA-SOCIO-T-RMICA.git

cd OBSERVATORIO-Y-SIMULADOR-DE-JUSTICIA-SOCIO-T-RMICA
```

### Instalar dependencias

```bash
npm install
```

### Ejecutar en desarrollo

```bash
npm run dev
```

Abrir en el navegador la dirección local indicada por Vite, normalmente:

```text
http://localhost:5173
```

### Ejecutar pruebas

```bash
npm test
```

### Compilar para producción

```bash
npm run build
```

Los archivos de producción se generan en:

```text
dist/
```

---

## 6. Formato e integración de datos

Los datasets utilizan archivos CSV con dos columnas:

```csv
date,value
2012-01-17,0.523
2012-01-25,0.547
2012-02-02,0.561
```

El formato admite fechas `YYYY-MM` y `YYYY-MM-DD`.

Los archivos deben ubicarse en:

```text
public/data/
```

El registro de cada serie se realiza en:

```text
public/data/manifest.json
```

Ejemplo:

```json
{
  "variable": "ndvi",
  "region": "concepcion_urbano",
  "file": "ndvi__concepcion_urbano.csv",
  "demo": false
}
```

El campo `demo` identifica si el dataset corresponde a datos demostrativos. Las series satelitales actualmente integradas están declaradas con `demo: false`.

### Exportaciones de Earth Engine

Los scripts principales de procesamiento son:

- `earth-engine/export_lst_night.js`
- `earth-engine/export_vegetation.js`

Las exportaciones se realizan desde Google Earth Engine y posteriormente se integran en `public/data/`.

Los scripts de exportación deben mantener consistencia con las regiones y geometrías definidas en `src/data/catalog.ts`.

---

## 7. Motor estadístico

La lógica de análisis se encuentra separada de los componentes visuales en `src/domain/`.

### Métodos implementados

**Regresión lineal**

- Estimación de pendiente.
- Error estándar.
- Coeficiente de determinación R².
- Prueba t y p-valor.
- Intervalo de confianza del 95 %.

**Mann-Kendall**

- Detección no paramétrica de tendencias monotónicas.
- Corrección de varianza para observaciones empatadas.

**Theil-Sen**

- Estimación robusta de la pendiente de una tendencia temporal.

### Modos de análisis

**Promedios anuales**

Los datos se agrupan primero por mes y posteriormente se calcula el promedio anual asignando el mismo peso a cada mes disponible.

Se excluyen años con menos de 10 meses distintos para evitar resultados basados en cobertura temporal insuficiente.

**Anomalías mensuales**

Se elimina el ciclo estacional mediante la resta del promedio correspondiente a cada mes calendario. Esto permite estudiar las desviaciones respecto del comportamiento estacional habitual.

### Validación

Las pruebas automatizadas se ejecutan mediante Vitest.

Estado de validación de esta versión:

- 13 pruebas aprobadas.
- Validación de regresión lineal y sus intervalos de confianza.
- Validación de Mann-Kendall.
- Validación de funciones estadísticas especiales.
- Validación del procesamiento de series temporales.
- Validación de promedios anuales con ponderación mensual uniforme.

---

## 8. Limitaciones y consideraciones metodológicas

- La temperatura superficial no equivale a la temperatura del aire.
- Las observaciones satelitales de temperatura utilizadas corresponden a noches despejadas y no representan todas las condiciones meteorológicas.
- Los índices de vegetación están condicionados por la resolución espacial, la estacionalidad y la composición de los píxeles.
- Los límites de las regiones son geometrías de referencia aproximadas y requieren validación territorial.
- Las áreas urbana y de referencia deben interpretarse considerando sus diferencias de cobertura y contexto geográfico.
- Los métodos estadísticos detectan tendencias temporales, pero no demuestran causalidad.
- La eliminación del ciclo estacional no elimina necesariamente la autocorrelación temporal.
- La regresión lineal identifica tendencias lineales y puede no representar adecuadamente comportamientos no lineales.
- La isla de calor superficial calculada no sustituye mediciones de temperatura del aire ni evaluaciones de confort térmico humano.

El prototipo no debe interpretarse como un sistema de medición directa de exposición térmica individual.

---

## 9. Próximos desarrollos

Líneas de trabajo previstas:

1. Integración de capas raster de vegetación en el visualizador cartográfico.
2. Incorporación de información censal y territorial del Instituto Nacional de Estadísticas (INE), manteniendo sus resultados estadísticos separados de las series satelitales.
3. Desarrollo de indicadores de vulnerabilidad socio-territorial.
4. Integración de indicadores de amenaza y vulnerabilidad para el análisis de justicia socio-térmica.
5. Desarrollo del simulador para explorar escenarios y apoyar la planificación urbana.
6. Optimización de la carga inicial de la aplicación y división del bundle JavaScript.

La integración de datos socioeconómicos deberá mantener su propia metodología, fuentes y trazabilidad, sin mezclarlos directamente con las mediciones satelitales.

---

## 10. Publicación

La aplicación puede desplegarse como sitio estático.

Opciones compatibles:

- GitHub Pages.
- Netlify.
- Vercel.

Comando de compilación:

```bash
npm run build
```

Directorio de publicación:

```text
dist/
```

La aplicación no requiere un servidor backend para cargar los datasets actualmente integrados.

---

## 11. Consideraciones de uso de NASA

Los datos satelitales se obtienen de productos científicos públicos de NASA.

La atribución de las colecciones y sus versiones debe mantenerse en la documentación y en la presentación del proyecto.

No se utilizan logotipos ni identificadores visuales oficiales de NASA como elementos de identidad de la aplicación.

Para la presentación de resultados se debe distinguir claramente entre:

- Observaciones satelitales.
- Indicadores derivados.
- Resultados estadísticos.
- Interpretaciones y escenarios de simulación.

**Proyecto:** Observatorio y simulador de justicia socio-térmica
**Repositorio:** [GitHub — OBSERVATORIO Y SIMULADOR DE JUSTICIA SOCIO-TÉRMICA](https://github.com/axelrohdis/OBSERVATORIO-Y-SIMULADOR-DE-JUSTICIA-SOCIO-T-RMICA)
**Desarrollo:** NASA Space Apps Challenge 2026