
/**
 * OBSERVATORIO DE JUSTICIA SOCIO-TÉRMICA
 *
 * Exportación de índices de vegetación VIIRS Suomi NPP.
 *
 * Producto:
 * NASA/VIIRS/002/VNP13A1
 *
 * Resolución: 500 metros
 * Composición: 16 días
 * Cadencia de imágenes en Earth Engine: aproximadamente 8 días
 *
 * Variables:
 * NDVI, EVI, EVI2
 *
 * Calidad:
 * MODLAND QA = 0
 * VI usefulness <= 2
 * Pixel reliability <= 2
 *
 * Salida:
 * CSV con columnas date,value
 */

// --------------------------------------------------
// 1. CONFIGURACIÓN
// --------------------------------------------------

var COLLECTION_ID = 'NASA/VIIRS/002/VNP13A1';

var START_DATE = '2012-01-17';
var END_DATE = '2026-11-01';

var EXPORT_PREFIX = 'vegetation';

// Índices que se exportarán.
var indices = ['NDVI', 'EVI', 'EVI2'];

// --------------------------------------------------
// 2. REGIONES DE ESTUDIO
// --------------------------------------------------

var regions = [
  {
    name: 'concepcion_urbano',
    geometry: ee.Geometry.Rectangle([
      -73.1, -36.86,
      -73.0, -36.78
    ])
  },
  {
    name: 'concepcion_entorno',
    geometry: ee.Geometry.Rectangle([
      -72.95, -36.95,
      -72.85, -36.87
    ])
  },
  {
    name: 'atacama',
    geometry: ee.Geometry.Rectangle([
      -69.6, -24.5,
      -69.1, -24.1
    ])
  },
  {
    name: 'amazonia',
    geometry: ee.Geometry.Rectangle([
      -63.5, -5.0,
      -62.5, -4.0
    ])
  }
];

// --------------------------------------------------
// 3. COLECCIÓN VIIRS
// --------------------------------------------------

var collection = ee.ImageCollection(COLLECTION_ID)
  .filterDate(START_DATE, END_DATE);

print('Colección VIIRS:', collection);
print('Cantidad de imágenes:', collection.size());

// --------------------------------------------------
// 4. FILTRO DE CALIDAD
// --------------------------------------------------

function applyQualityMask(image) {

  var qa = image.select('VI_Quality');

  // Bits 0-1: MODLAND QA.
  var modlandQA = qa.bitwiseAnd(3);

  // Bits 2-5: VI usefulness.
  var usefulness = qa.rightShift(2)
    .bitwiseAnd(15);

  // Pixel reliability.
  var reliability = image.select('pixel_reliability');

  var qualityMask = modlandQA.eq(0)
    .and(usefulness.lte(2))
    .and(reliability.lte(2));

  return image.updateMask(qualityMask);
}

// --------------------------------------------------
// 5. CONSTRUIR SERIE TEMPORAL
// --------------------------------------------------

function buildSeries(index, region) {

  var series = collection.map(function(image) {

    var filteredImage = applyQualityMask(image);

    // Seleccionar índice sin aplicar factor de escala.
    var vegetationIndex = filteredImage.select(index);

    // Promedio espacial de píxeles válidos.
    var statistics = vegetationIndex.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: region.geometry,
      scale: 500,
      maxPixels: 1e8,
      tileScale: 4
    });

    var value = statistics.get(index);

    return ee.Feature(null, {
      date: image.date().format('YYYY-MM-dd'),
      value: value
    });

  });

  // Excluir fechas sin observaciones válidas.
  series = series
    .filter(ee.Filter.notNull(['value']))
    .sort('date');

  return ee.FeatureCollection(series);
}

// --------------------------------------------------
// 6. EXPORTAR CSV
// --------------------------------------------------

regions.forEach(function(region) {

  indices.forEach(function(index) {

    var variable = index.toLowerCase();

    var fileName = variable + '__' + region.name;

    var series = buildSeries(index, region);

    Export.table.toDrive({
      collection: series,
      description: EXPORT_PREFIX + '_' + fileName,
      fileNamePrefix: fileName,
      fileFormat: 'CSV',
      selectors: ['date', 'value']
    });

    print(
      'Exportación preparada:',
      fileName,
      'Registros:',
      series.size()
    );

  });

});

// --------------------------------------------------
// 7. VISUALIZACIÓN DE REFERENCIA
// --------------------------------------------------

var urbanRegion = regions[0];

Map.centerObject(urbanRegion.geometry, 12);

Map.addLayer(
  urbanRegion.geometry,
  {color: 'yellow'},
  'Concepción urbano'
);

var latestImage = ee.Image(
  collection.sort('system:time_start', false).first()
);

var latestNDVI = applyQualityMask(latestImage)
  .select('NDVI');

Map.addLayer(
  latestNDVI,
  {
    min: 0,
    max: 1,
    palette: [
      '8c510a',
      'dfc27d',
      '80cdc1',
      '01665e'
    ]
  },
  'VIIRS NDVI - referencia'
);

print('Exportador de vegetación preparado.');
