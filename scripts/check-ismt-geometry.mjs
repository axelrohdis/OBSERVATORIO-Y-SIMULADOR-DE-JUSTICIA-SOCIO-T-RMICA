import { readFileSync } from 'node:fs';

const [csvPath, geoPath, field] = process.argv.slice(2);
if (!csvPath || !geoPath || !field) {
  console.error('Uso: node scripts/check-ismt-geometry.mjs <csv> <geojson> <campo_id>');
  process.exit(1);
}

const csv = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
const head = csv[0].split(',');
const iz = head.indexOf('zona');
const csvIds = csv.slice(1).map((l) => l.split(',')[iz]);

const gj = JSON.parse(readFileSync(geoPath, 'utf8'));
const feats = (gj.features ?? []).filter(
  (f) => String(f.properties?.COMUNA).replace(/^0+/, '') === '8101',
);
const geoIds = feats.map((f) => String(f.properties?.[field]));

const A = new Set(csvIds);
const B = new Set(geoIds);
const onlyCsv = [...A].filter((x) => !B.has(x));
const onlyGeo = [...B].filter((x) => !A.has(x));

console.log(`CSV: ${csvIds.length} filas, ${A.size} únicos, longitudes`, [...new Set(csvIds.map((x) => x.length))]);
console.log(`Geometría (solo COMUNA 8101): ${feats.length} entidades, ${B.size} únicos, longitudes`, [...new Set(geoIds.map((x) => x.length))]);
console.log(`Coinciden tal cual: ${csvIds.filter((x) => B.has(x)).length} de ${csvIds.length}`);
console.log(`Solo en CSV: ${onlyCsv.length}`, onlyCsv.slice(0, 10));
console.log(`Solo en geometría: ${onlyGeo.length}`, onlyGeo.slice(0, 10));