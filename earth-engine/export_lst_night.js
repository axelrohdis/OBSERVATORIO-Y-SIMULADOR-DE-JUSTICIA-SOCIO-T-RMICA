/**
 * Temperatura superficial NOCTURNA (VIIRS Suomi NPP, VNP21A1N V002, 1 km, diaria).
 * Exporta a Drive (carpeta "trend-detective") 2 CSV mensuales por región:
 *   trend_lst    -> temperatura media mensual en °C
 *   trend_lst_n  -> noches válidas promedio por píxel en el mes
 * LST_1KM ya viene en kelvin (verificado). Cobertura desde 2012-01-19.
 */
var START = '2012-02-01'; // primer mes completo
var END = '2026-01-01'; // exclusivo

// Rectángulos APROXIMADOS [oeste, sur, este, norte]. Deben coincidir con REGIONS en src/data/catalog.ts.
var REGIONS = {
    concepcion_urbano: ee.Geometry.Rectangle([-73.1, -36.86, -73.0, -36.78]),
    concepcion_entorno: ee.Geometry.Rectangle([-72.95, -36.95, -72.85, -36.87]),
    atacama: ee.Geometry.Rectangle([-69.6, -24.5, -69.1, -24.1]),
    amazonia: ee.Geometry.Rectangle([-63.5, -5.0, -62.5, -4.0]),
};
var NAMES = Object.keys(REGIONS);

var col = ee.ImageCollection('NASA/VIIRS/002/VNP21A1N');

// QC bits 0-1 = 0 (producido, buena calidad) y temperatura físicamente posible.
function good(img) {
    var lst = img.select('LST_1KM');
    var ok = img.select('QC').bitwiseAnd(3).eq(0).and(lst.gt(150)).and(lst.lt(340));
    return lst.updateMask(ok);
}

var nMonths = ee.Date(END).difference(ee.Date(START), 'month').round();
var starts = ee.List.sequence(0, nMonths.subtract(1)).map(function (i) {
    return ee.Date(START).advance(i, 'month');
});

var table = ee.FeatureCollection(
    starts.map(function (d) {
        var start = ee.Date(d);
        var days = col.filterDate(start, start.advance(1, 'month')).map(good);
        var img = days.mean().subtract(273.15).rename('v').addBands(days.count().rename('n'));
        var props = ee.Dictionary({ date: start.format('YYYY-MM') });
        NAMES.forEach(function (r) {
            var opts = { geometry: REGIONS[r], scale: 1000, maxPixels: 1e9 };
            var mean = img.select('v').reduceRegion(ee.Reducer.mean(), opts.geometry, opts.scale, null, null, false, opts.maxPixels);
            var cnt = img.select('v').reduceRegion(ee.Reducer.count(), opts.geometry, opts.scale, null, null, false, opts.maxPixels);
            var nn = img.select('n').reduceRegion(ee.Reducer.mean(), opts.geometry, opts.scale, null, null, false, opts.maxPixels);
            var ok = ee.Number(cnt.get('v')).gt(0);
            // Sin píxeles válidos: -9999 (el importador lo trata como dato faltante) y 0 noches.
            props = props
                .set(r, ee.Algorithms.If(ok, mean.get('v'), -9999))
                .set(r + '_n', ee.Algorithms.If(ok, nn.get('n'), 0));
        });
        return ee.Feature(null, props);
    })
);

Export.table.toDrive({
    collection: table,
    description: 'trend_lst',
    folder: 'trend-detective',
    fileFormat: 'CSV',
    selectors: ['date'].concat(NAMES),
});
Export.table.toDrive({
    collection: table,
    description: 'trend_lst_n',
    folder: 'trend-detective',
    fileFormat: 'CSV',
    selectors: ['date'].concat(NAMES.map(function (r) { return r + '_n'; })),
});
print('Listo: abre la pestaña Tasks y ejecuta las 2 exportaciones.');