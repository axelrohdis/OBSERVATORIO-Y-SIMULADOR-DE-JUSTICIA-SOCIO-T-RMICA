// Une el ISMT (CSV v3) con la temperatura nocturna zonal (Earth Engine) por GEOCODIGO = zona.
// Uso: node scripts/build-ismt.mjs
// No modifica ids ni valores; falla si las 76 zonas no coinciden exactamente.
import { readFileSync, writeFileSync } from 'node:fs';

const ISMT_CSV = 'fuentes/ISMT_2022_Concepcion_8101_Consolidado-v3.csv';
const LST_CSV = 'fuentes/ismt_zonal_lst.csv';
const OUT = 'public/data/ismt_barrios.json';

function readCsv(path) {
  const lines = readFileSync(path, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  const head = lines[0].split(',');
  return lines.slice(1).map((l) => {
    const c = l.split(',');
    return Object.fromEntries(head.map((h, i) => [h, c[i]]));
  });
}

const ismt = new Map(readCsv(ISMT_CSV).map((r) => [r.zona, r]));
const lst = new Map(readCsv(LST_CSV).map((r) => [String(r.GEOCODIGO), r]));

const onlyIsmt = [...ismt.keys()].filter((k) => !lst.has(k));
const onlyLst = [...lst.keys()].filter((k) => !ismt.has(k));
if (onlyIsmt.length || onlyLst.length) {
  console.error(`Los ids no coinciden. Solo ISMT: ${onlyIsmt.length}, solo temperatura: ${onlyLst.length}`);
  process.exit(1);
}

const num = (v) => Number(v);
const zonas = [...ismt.keys()].sort().map((id) => {
  const a = ismt.get(id);
  const t = lst.get(id);
  const q = [a.Q1, a.Q2, a.Q3, a.Q4, a.Q5].map(num);
  const row = {
    zona: id,
    ismt: num(a.ismtpn),
    q,
    hogares: q.reduce((s, v) => s + v, 0),
    escolaridad: num(a.escolar),
    lst_c: num(t.lst_noche_verano_c),
    noches: num(t.noches_validas_prom),
    cobertura: num(t.cobertura_dato),
    area_km2: num(t.area_km2),
  };
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === 'number' && !Number.isFinite(v)) {
      console.error(`Valor no numérico en la zona ${id}, campo ${k}`);
      process.exit(1);
    }
  }
  return row;
});

const out = {
  fuente: {
    ismt: 'Índice Socio-Material Territorial (ISMT), Observatorio de Ciudades UC (OCUC). Archivo ISMT_2022_Concepcion_8101_Consolidado-v3 (comuna 8101). Valor usado: ismtpn.',
    geometria: 'Zonas de la capa Indicador sociomaterial territorial - ISMT (OCUC), descargada el 2026-11-15; unión por GEOCODIGO = zona (76 de 76).',
    temperatura: 'NASA VIIRS/Suomi NPP VNP21A1N V002, temperatura de superficie nocturna, 1 km, vía Google Earth Engine. Promedio de los veranos 2020/21 a 2024/25 (dic–feb), solo noches despejadas; media ponderada por cobertura de píxel.',
    generado: new Date().toISOString().slice(0, 10),
  },
  n: zonas.length,
  zonas,
};
writeFileSync(OUT, JSON.stringify(out));
console.log(`OK: ${zonas.length} zonas → ${OUT}`);
