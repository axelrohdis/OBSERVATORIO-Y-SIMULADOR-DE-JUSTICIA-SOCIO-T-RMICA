import { readFileSync } from 'node:fs';

const [csvPath, geoPath] = process.argv.slice(2);
const lines = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
const head = lines[0].split(',');
const csv = new Map();
for (const l of lines.slice(1)) {
  const c = l.split(',');
  csv.set(c[head.indexOf('zona')], Object.fromEntries(head.map((h, i) => [h, c[i]])));
}
const geo = new Map(
  JSON.parse(readFileSync(geoPath, 'utf8')).features
    .filter((f) => String(f.properties.COMUNA).replace(/^0+/, '') === '8101')
    .map((f) => [String(f.properties.GEOCODIGO), f.properties]),
);

const ids = [...csv.keys()].filter((k) => geo.has(k));
const num = (v) => Number(v);
function corr(x, y) {
  const n = x.length, mx = x.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return sxy / Math.sqrt(sxx * syy);
}

console.log(`zonas comparadas: ${ids.length}`);
const ismt = ids.map((k) => num(csv.get(k).ismtpn));
console.log('\nismtpn (CSV) vs puntajes de la capa:');
for (const f of ['puntaje', 'PuntajeAj', 'PNTJ']) {
  const g = ids.map((k) => num(geo.get(k)[f]));
  const maxd = Math.max(...ids.map((k, i) => Math.abs(ismt[i] - g[i])));
  const iguales = ids.filter((k, i) => Math.abs(ismt[i] - g[i]) < 0.005).length;
  console.log(`  ${f}: correlación=${corr(ismt, g).toFixed(3)} · dif. máxima=${maxd.toFixed(3)} · iguales (±0,005)=${iguales}/${ids.length}`);
}

console.log('\nconteos (CSV vs capa), zonas con valor idéntico:');
const same = (a, b) => ids.filter((k) => num(csv.get(k)[a]) === num(geo.get(k)[b])).length;
for (const f of ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Alto', 'Medio', 'Bajo', 'C2', 'C3', 'D', 'E']) console.log(`  ${f}: ${same(f, f)}/${ids.length}`);
const abc1 = ids.filter((k) => num(csv.get(k).AB) + num(csv.get(k).C1) === num(geo.get(k).ABC1)).length;
console.log(`  AB+C1 vs ABC1: ${abc1}/${ids.length}`);

console.log('\nárea (Shape__Area), zonas con diferencia <1 %:');
console.log(`  ${ids.filter((k) => Math.abs(num(csv.get(k).Shape__Area) / num(geo.get(k).Shape__Area) - 1) < 0.01).length}/${ids.length}`);