/**
 * Earth Engine Code Editor: https://code.earthengine.google.com
 * Exporta series MENSUALES por región a Google Drive (4 CSV "anchos", uno por variable).
 *
 * ESTADO: escrito sin poder ejecutarlo contra Earth Engine. Antes de confiar en los
 * resultados, VERIFICA en el catálogo de datasets (pestaña "Bands" de cada uno):
 *   - ID de la colección, nombre de la banda, factor de escala y unidades.
 *   - Rango de fechas disponible.
 * Los IDs marcados con (*) los vi listados en el catálogo; MOD13A3 y los nombres de banda,
 * escalas y unidades están escritos de memoria y hay que comprobarlos.
 *
 * Uso: pega este archivo en el Code Editor, pulsa Run, abre la pestaña "Tasks" y pulsa RUN
 * en cada tarea (4). Descarga los CSV desde Drive a earth-engine/exports/ y corre: npm run import-data
 */

var START = '2001-01-01';
var END = '2026-01-01'; // exclusivo

// Regiones: rectángulos APROXIMADOS [oeste, sur, este, norte]. AJÚSTALOS dibujando polígonos
// y validándolos con el equipo (p. ej. el entorno de referencia de Concepción).
var REGIONS = {
  concepcion_urbano: ee.Geometry.Rectangle([-73.1, -36.86, -73.0, -36.78]),
  concepcion_entorno: ee.Geometry.Rectangle([-72.95, -36.95, -72.85, -36.87]),
  atacama: ee.Geometry.Rectangle([-69.6, -24.5, -69.1, -24.1]),
  amazonia: ee.Geometry.Rectangle([-63.5, -5.0, -62.5, -4.0]),
};
var NAMES = Object.keys(REGIONS);

// Cada variable devuelve una imagen de UNA banda llamada 'v' para el mes que empieza en `start`.
var VARIABLES = {
  // (*) MODIS Terra LST diurna, 8 días, 1 km. Escala 0.02 K. QC_Day bits 0-1: 0/1 = calidad aceptable.
  lst: {
    scale: 1000,
    image: function (start, end) {
      var c = ee.ImageCollection('MODIS/061/MOD11A2').filterDate(start, end).map(function (img) {
        var good = img.select('QC_Day').bitwiseAnd(3).lt(2);
        return img.select('LST_Day_1km').updateMask(good);
      });
      return c.mean().multiply(0.02).subtract(273.15).rename('v');
    },
  },
  // MODIS Terra NDVI mensual 1 km. Escala 0.0001. (comprobar ID)
  ndvi: {
    scale: 1000,
    image: function (start, end) {
      return ee.ImageCollection('MODIS/061/MOD13A3').filterDate(start, end).select('NDVI').mean().multiply(0.0001).rename('v');
    },
  },
  // (*) GPM IMERG mensual V07, 0.1°. Banda 'precipitation' en mm/hora -> mm/mes. (comprobar banda y unidad)
  precip: {
    scale: 11132,
    image: function (start, end) {
      var hours = end.difference(start, 'hour');
      return ee.ImageCollection('NASA/GPM_L3/IMERG_MONTHLY_V07').filterDate(start, end).select('precipitation').mean().multiply(hours).rename('v');
    },
  },
  // (*) GLDAS-2.1 Noah, 3-horario, 0.25°. Tair_f_inst en K -> °C, promedio mensual. SALIDA DE MODELO.
  airtemp: {
    scale: 27830,
    image: function (start, end) {
      return ee.ImageCollection('NASA/GLDAS/V021/NOAH/G025/T3H').filterDate(start, end).select('Tair_f_inst').mean().subtract(273.15).rename('v');
    },
  },
};

var nMonths = ee.Date(END).difference(ee.Date(START), 'month').round();
var starts = ee.List.sequence(0, nMonths.subtract(1)).map(function (i) {
  return ee.Date(START).advance(i, 'month');
});

Object.keys(VARIABLES).forEach(function (name) {
  var cfg = VARIABLES[name];
  var table = ee.FeatureCollection(
    starts.map(function (d) {
      var start = ee.Date(d);
      var end = start.advance(1, 'month');
      var img = cfg.image(start, end);
      var props = ee.Dictionary({ date: start.format('YYYY-MM') });
      NAMES.forEach(function (r) {
        var v = img.reduceRegion({ reducer: ee.Reducer.mean(), geometry: REGIONS[r], scale: cfg.scale, maxPixels: 1e9 }).get('v');
        props = props.set(r, v);
      });
      return ee.Feature(null, props);
    })
  );
  Export.table.toDrive({
    collection: table,
    description: 'trend_' + name,
    folder: 'trend-detective',
    fileFormat: 'CSV',
    selectors: ['date'].concat(NAMES),
  });
});
print('Listo: abre la pestaña Tasks y ejecuta las 4 exportaciones.');
