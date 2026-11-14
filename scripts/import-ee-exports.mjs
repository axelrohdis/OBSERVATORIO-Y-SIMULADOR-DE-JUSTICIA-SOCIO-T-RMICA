import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const IN = new URL('../earth-engine/exports/', import.meta.url);
const OUT = new URL('../public/data/', import.meta.url);
const VARIABLES = ['lst', 'ndvi', 'precip', 'airtemp'];
// Un mes se descarta si el promedio de noches válidas por píxel es menor a este valor.
const MIN_NIGHTS = 5;
mkdirSync(OUT, { recursive: true });

/** Lee un CSV ancho y devuelve { columna: Map(fecha -> número) } (omite celdas vacías). */
function parseWide(file) {
  const [head, ...lines] = readFileSync(file, 'utf8').trim().split(/\r?\n/);
  const cols = head.split(',').map((c) => c.trim());
  const di = cols.indexOf('date');
  const out = {};
  cols.forEach((name, ci) => {
    if (ci === di || name === 'system:index' || name === '.geo') return;
    const m = new Map();
    for (const line of lines) {
      const cells = line.split(',');
      const v = Number(cells[ci]);
      if (cells[ci] !== '' && Number.isFinite(v) && v > -9000) m.set(cells[di], v);
    }
    out[name] = m;
  });
  return out;
}

const nightsFile = new URL('trend_lst_n.csv', IN);
const nights = existsSync(nightsFile) ? parseWide(nightsFile) : null;
if (!nights) console.warn('(falta) trend_lst_n.csv: no se filtran meses por noches válidas');

const manifest = [];
const lst = {};

for (const variable of VARIABLES) {
  const f = new URL(`trend_${variable}.csv`, IN);
  if (!existsSync(f)) {
    console.warn(`(falta) earth-engine/exports/trend_${variable}.csv: se omite`);
    continue;
  }
  for (const [region, map] of Object.entries(parseWide(f))) {
    let rows = [...map];
    if (variable === 'lst' && nights) {
      const n = nights[`${region}_n`];
      const before = rows.length;
      rows = rows.filter(([d]) => (n?.get(d) ?? 0) >= MIN_NIGHTS);
      console.log(`lst/${region}: ${rows.length} meses válidos, ${before - rows.length} descartados (menos de ${MIN_NIGHTS} noches)`);
    }
    if (!rows.length) continue;
    const file = `${variable}__${region}.csv`;
    writeFileSync(new URL(file, OUT), 'date,value\n' + rows.map(([d, v]) => `${d},${v.toFixed(4)}`).join('\n') + '\n');
    manifest.push({ variable, region, file, demo: false });
    if (variable === 'lst') lst[region] = new Map(rows);
  }
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