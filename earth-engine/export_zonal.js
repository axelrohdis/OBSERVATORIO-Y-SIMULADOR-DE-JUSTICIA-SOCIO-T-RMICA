// Observatorio y simulador de justicia socio-térmica
// Temperatura nocturna de la superficie (VIIRS VNP21A1N V002, 1 km) por zona censal.
// Promedio de los veranos 2020/21 a 2024/25 (dic–feb), solo noches despejadas.

var ZONAS = ee.FeatureCollection('projects/urban-heat-observatory/assets/zonas_8101');

var START = '2020-12-01';
var END = '2025-03-01'; // exclusivo

var col = ee.ImageCollection('NASA/VIIRS/002/VNP21A1N')
  .filterDate(START, END)
  .filter(ee.Filter.or(
    ee.Filter.calendarRange(12, 12, 'month'),
    ee.Filter.calendarRange(1, 2, 'month')
  ));

function good(img) {
  var lst = img.select('LST_1KM');
  var qc = img.select('QC');
  var ok = qc.bitwiseAnd(3).eq(0).and(lst.gt(150)).and(lst.lt(340));
  return lst.updateMask(ok).rename('lst');
}

var noches = col.map(good);
var proy = col.first().select('LST_1KM').projection();

// Banda 1: temperatura media en °C. Banda 2: noches válidas por píxel. Banda 3: 1 donde hay dato.
var img = noches.mean().subtract(273.15).rename('lst_c')
  .addBands(noches.count().rename('n_noches'))
  .addBands(noches.mean().mask().rename('cob'));

var res = img.reduceRegions({
  collection: ZONAS,
  reducer: ee.Reducer.mean(),
  crs: proy,
  tileScale: 4
}).map(function (f) {
  var area = f.geometry().area(1).divide(1e6);
  return ee.Feature(null, {
    GEOCODIGO: f.get('GEOCODIGO'),
    lst_noche_verano_c: f.get('lst_c'),   // media ponderada por cobertura
    noches_validas_prom: f.get('n_noches'),
    cobertura_dato: f.get('cob'),         // 0–1: fracción de la zona con dato válido
    area_km2: area
  });
});

// Chequeos rápidos antes de exportar.
print(ee.Dictionary({
  zonas: res.size(),
  sin_valor: res.filter(ee.Filter.notNull(['lst_noche_verano_c']).not()).size(),
  minimo_c: res.aggregate_min('lst_noche_verano_c'),
  maximo_c: res.aggregate_max('lst_noche_verano_c'),
  primera: res.first()
}));

Export.table.toDrive({
  collection: res,
  description: 'ismt_zonal_lst',
  folder: 'trend-detective',
  fileNamePrefix: 'ismt_zonal_lst',
  fileFormat: 'CSV',
  selectors: ['GEOCODIGO', 'lst_noche_verano_c', 'noches_validas_prom', 'cobertura_dato', 'area_km2']
});