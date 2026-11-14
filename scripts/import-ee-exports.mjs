// Convierte los CSV "anchos" exportados desde Earth Engine al formato de la app.
// Entrada:  earth-engine/exports/trend_<variable>.csv  (columnas: date, <region1>, <region2>, ...)
// Salida:   public/data/<variable>__<region>.csv + manifest.json (demo:false)
// Además calcula la isla de calor superficial = lst(concepcion_urbano) - lst(concepcion_entorno).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const IN = new URL('../earth-engine/exports/', import.meta.url);
const OUT = new URL('../public/data/', import.meta.url);
const VARIABLES = ['lst', 'ndvi', 'precip', 'airtemp'];
mkdirSync(OUT, { recursive: true });

const manifest = [];
const lst = {};

for (const variable of VARIABLES) {
  const f = new URL(`trend_${variable}.csv`, IN);
  if (!existsSync(f)) {
    console.warn(`(falta) earth-engine/exports/trend_${variable}.csv: se omite`);
    continue;
  }
  const [head, ...lines] = readFileSync(f, 'utf8').trim().split(/\r?\n/);
  const cols = head.split(',').map((c) => c.trim());
  const di = cols.indexOf('date');
  cols.forEach((region, ci) => {
    if (ci === di || region === 'system:index' || region === '.geo') return;
    const rows = [];
    for (const line of lines) {
      const cells = line.split(',');
      const v = Number(cells[ci]);
      if (cells[ci] !== '' && Number.isFinite(v)) rows.push([cells[di], v]);
    }
    if (!rows.length) return;
    const file = `${variable}__${region}.csv`;
    writeFileSync(new URL(file, OUT), 'date,value\n' + rows.map(([d, v]) => `${d},${v.toFixed(4)}`).join('\n') + '\n');
    manifest.push({ variable, region, file, demo: false });
    if (variable === 'lst') lst[region] = new Map(rows);
  });
}

if (lst.concepcion_urbano && lst.concepcion_entorno) {
  const rows = [];
  for (const [d, v] of lst.concepcion_urbano) {
    const ref = lst.concepcion_entorno.get(d);
    if (ref !== undefined) rows.push(`${d},${(v - ref).toFixed(4)}`);
  }
  writeFileSync(new URL('uhi__concepcion_urbano.csv', OUT), 'date,value\n' + rows.join('\n') + '\n');
  manifest.push({ variable: 'uhi', region: 'concepcion_urbano', file: 'uhi__concepcion_urbano.csv', demo: false });
}

writeFileSync(new URL('manifest.json', OUT), JSON.stringify({ datasets: manifest }, null, 2));
console.log(`Importadas ${manifest.length} series reales a public/data/ (demo:false)`);
