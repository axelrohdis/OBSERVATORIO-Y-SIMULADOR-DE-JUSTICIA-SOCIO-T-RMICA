// Genera datos SINTÉTICOS de demostración en public/data (mensuales, 2001-2025).
// No son mediciones reales: el manifest los marca con demo:true y la app muestra un aviso.
// Para datos reales usa earth-engine/export_timeseries.js y luego: npm run import-data
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../public/data/', import.meta.url);
mkdirSync(OUT, { recursive: true });

// Generador pseudoaleatorio reproducible
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

// base + estacionalidad (peak = mes del máximo) + tendencia por década + ruido AR(1)
const P = {
  lst: {
    concepcion_urbano: { base: 22, amp: 6, peak: 1, trend: 0.45, noise: 0.9 },
    concepcion_entorno: { base: 20, amp: 5.5, peak: 1, trend: 0.15, noise: 0.9 },
    atacama: { base: 30, amp: 5, peak: 1, trend: 0.1, noise: 0.8 },
    amazonia: { base: 30, amp: 1.2, peak: 9, trend: 0.25, noise: 0.7 },
  },
  ndvi: {
    concepcion_urbano: { base: 0.4, amp: 0.04, peak: 2, trend: -0.01, noise: 0.02 },
    concepcion_entorno: { base: 0.62, amp: 0.06, peak: 2, trend: -0.005, noise: 0.025 },
    atacama: { base: 0.08, amp: 0.01, peak: 2, trend: 0, noise: 0.01 },
    amazonia: { base: 0.82, amp: 0.03, peak: 7, trend: -0.015, noise: 0.02 },
  },
  precip: {
    concepcion_urbano: { base: 90, amp: 85, peak: 7, trend: -4, noise: 40, min: 0 },
    concepcion_entorno: { base: 100, amp: 90, peak: 7, trend: -4, noise: 45, min: 0 },
    atacama: { base: 1, amp: 0.8, peak: 7, trend: 0, noise: 1.2, min: 0 },
    amazonia: { base: 220, amp: 120, peak: 2, trend: -3, noise: 50, min: 0 },
  },
  airtemp: {
    concepcion_urbano: { base: 13, amp: 4, peak: 1, trend: 0.25, noise: 0.6 },
    concepcion_entorno: { base: 12, amp: 4, peak: 1, trend: 0.22, noise: 0.6 },
    atacama: { base: 17, amp: 4.5, peak: 1, trend: 0.15, noise: 0.7 },
    amazonia: { base: 26, amp: 0.8, peak: 10, trend: 0.2, noise: 0.5 },
  },
};

const dates = [];
for (let y = 2001; y <= 2025; y++) for (let m = 1; m <= 12; m++) dates.push([y, m]);
const label = ([y, m]) => `${y}-${String(m).padStart(2, '0')}`;

const manifest = [];
const store = {};
let seed = 11;
for (const [variable, regions] of Object.entries(P)) {
  for (const [region, p] of Object.entries(regions)) {
    const r = rng(seed++);
    let e = 0;
    const vals = dates.map(([y, m], i) => {
      e = 0.4 * e + gauss(r) * p.noise;
      const v = p.base + p.amp * Math.cos((2 * Math.PI * (m - p.peak)) / 12) + p.trend * (i / 120) + e;
      return p.min !== undefined ? Math.max(p.min, v) : v;
    });
    store[`${variable}__${region}`] = vals;
    write(variable, region, vals);
  }
}
// Isla de calor superficial = LST urbana - LST entorno
write('uhi', 'concepcion_urbano', store['lst__concepcion_urbano'].map((v, i) => v - store['lst__concepcion_entorno'][i]));

function write(variable, region, vals) {
  const file = `${variable}__${region}.csv`;
  const rows = dates.map((d, i) => `${label(d)},${vals[i].toFixed(4)}`);
  writeFileSync(new URL(file, OUT), `date,value\n${rows.join('\n')}\n`);
  manifest.push({ variable, region, file, demo: true });
}
writeFileSync(new URL('manifest.json', OUT), JSON.stringify({ datasets: manifest }, null, 2));
console.log(`Datos demo escritos: ${manifest.length} series en public/data/`);
