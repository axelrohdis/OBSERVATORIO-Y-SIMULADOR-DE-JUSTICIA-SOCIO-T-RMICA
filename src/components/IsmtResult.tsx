import { useEffect, useMemo, useState } from 'react';
import type { Lang } from '../data/catalog';
import { fmt, fmtP } from '../i18n';
import { spearman, vulnerabilityIndex } from '../domain/spatial';

interface Zona {
  zona: string;
  ismt: number;
  hogares: number;
  lst_c: number;
  noches: number;
  cobertura: number;
  area_km2: number;
}
interface Data {
  fuente: { ismt: string; geometria: string; temperatura: string; generado: string };
  n: number;
  zonas: Zona[];
}

const T = {
  es: {
    title: '5. Gráfico 2 · Análisis socio-material (ISMT)',
    notSat:
      'El ISMT (Índice Socio-Material Territorial) proviene de datos censales y no es una medición satelital. La temperatura sí es una observación NASA VIIRS.',
    loading: 'Cargando datos del ISMT…',
    error: 'No se pudieron cargar los datos del ISMT.',
    chartLabel: 'Dispersión: ISMT por zona (eje horizontal) contra temperatura nocturna de verano (eje vertical)',
    x: 'ISMT (mayor = mejor condición socio-material)',
    y: 'Temperatura nocturna de verano (°C)',
    top: 'Cuartil más vulnerable',
    rest: 'Resto de las zonas',
    corr: 'Correlación de Spearman entre ISMT y temperatura',
    neg: 'Las zonas con menor ISMT tienden a ser más cálidas de noche. Es una asociación, no prueba causalidad.',
    pos: 'Las zonas con mayor ISMT tienden a ser más cálidas de noche. Es una asociación, no prueba causalidad.',
    none: 'No hay una asociación estadísticamente significativa (α = 0,05) entre el ISMT y la temperatura en estas zonas.',
    idxTitle: 'Zonas con mayor índice relativo de vulnerabilidad socio-térmica',
    idxDef:
      'Índice = promedio del puntaje z de la temperatura y del puntaje z del ISMT invertido. Es relativo a las demás zonas de Concepción: mayor valor significa más calor y menor condición socio-material.',
    zone: 'Zona censal',
    temp: 'Temp. (°C)',
    idx: 'Índice',
    limits: 'Limitaciones',
    l1: (k: number, n: number) =>
      `La temperatura tiene 1 km de resolución y ${k} de las ${n} zonas miden menos de 1 km²: comparten píxeles con sus vecinas, y los valores de zonas cercanas se parecen por construcción.`,
    l2: 'Zonas vecinas se parecen entre sí (autocorrelación espacial) y el p-valor supone observaciones independientes: es optimista.',
    l3: 'La temperatura es el promedio de los veranos 2020/21 a 2024/25 (dic–feb) y solo incluye noches despejadas. Es temperatura de la superficie, no del aire.',
    l4: 'El ISMT es un dato censal de un solo momento, no una serie de tiempo: no se calcula tendencia.',
    l5: 'El índice es un ordenamiento relativo dentro de la comuna, no una medida absoluta de riesgo.',
    sources: 'Fuentes',
  },
  en: {
    title: '5. Chart 2 · Socio-material analysis (ISMT)',
    notSat:
      'The ISMT (Territorial Socio-Material Index) comes from census data and is not a satellite measurement. The temperature is a NASA VIIRS observation.',
    loading: 'Loading ISMT data…',
    error: 'Could not load the ISMT data.',
    chartLabel: 'Scatter plot: ISMT per zone (horizontal) against summer night temperature (vertical)',
    x: 'ISMT (higher = better socio-material condition)',
    y: 'Summer night temperature (°C)',
    top: 'Most vulnerable quartile',
    rest: 'Other zones',
    corr: 'Spearman correlation between ISMT and temperature',
    neg: 'Zones with a lower ISMT tend to be warmer at night. This is an association, not proof of causation.',
    pos: 'Zones with a higher ISMT tend to be warmer at night. This is an association, not proof of causation.',
    none: 'There is no statistically significant association (α = 0.05) between the ISMT and temperature across these zones.',
    idxTitle: 'Zones with the highest relative socio-thermal vulnerability index',
    idxDef:
      'Index = average of the z-score of temperature and the z-score of the inverted ISMT. It is relative to the other zones in Concepción: a higher value means hotter and a lower socio-material condition.',
    zone: 'Census zone',
    temp: 'Temp. (°C)',
    idx: 'Index',
    limits: 'Limitations',
    l1: (k: number, n: number) =>
      `Temperature has 1 km resolution and ${k} of the ${n} zones are smaller than 1 km²: they share pixels with their neighbours, so nearby zones look alike by construction.`,
    l2: 'Neighbouring zones resemble each other (spatial autocorrelation) and the p-value assumes independent observations: it is optimistic.',
    l3: 'Temperature is the average of the 2020/21 to 2024/25 summers (Dec–Feb) and uses clear nights only. It is surface temperature, not air temperature.',
    l4: 'The ISMT is a single-moment census dataset, not a time series: no trend is computed.',
    l5: 'The index is a relative ranking within the municipality, not an absolute risk measure.',
    sources: 'Sources',
  },
};

const W = 640, H = 380, M = { l: 58, r: 16, t: 14, b: 50 };

function ticks(lo: number, hi: number, k = 5): number[] {
  return Array.from({ length: k }, (_, i) => lo + ((hi - lo) * i) / (k - 1));
}

export function IsmtResult({ lang }: { lang: Lang }) {
  const t = T[lang];
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}data/ismt_barrios.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Data) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const calc = useMemo(() => {
    if (!data) return null;
    const z = data.zonas;
    const ismt = z.map((r) => r.ismt);
    const heat = z.map((r) => r.lst_c);
    const idx = vulnerabilityIndex(ismt, heat);
    const sorted = [...idx].sort((a, b) => a - b);
    const q75 = sorted[Math.floor(0.75 * (sorted.length - 1))];
    const rows = z.map((r, i) => ({ ...r, idx: idx[i], top: idx[i] >= q75 }));
    return {
      rows,
      sp: spearman(ismt, heat),
      ranking: [...rows].sort((a, b) => b.idx - a.idx).slice(0, 10),
      small: z.filter((r) => r.area_km2 < 1).length,
      xr: [Math.min(...ismt), Math.max(...ismt)] as const,
      yr: [Math.min(...heat), Math.max(...heat)] as const,
    };
  }, [data]);

  if (failed) return <div className="alert alert-warning" role="status">{t.error}</div>;
  if (!data || !calc) return <p className="text-body-secondary">{t.loading}</p>;

  const { rows, sp, ranking, small, xr, yr } = calc;
  const padX = (xr[1] - xr[0]) * 0.05, padY = (yr[1] - yr[0]) * 0.08;
  const x0 = xr[0] - padX, x1 = xr[1] + padX, y0 = yr[0] - padY, y1 = yr[1] + padY;
  const sx = (v: number) => M.l + ((v - x0) / (x1 - x0)) * (W - M.l - M.r);
  const sy = (v: number) => H - M.b - ((v - y0) / (y1 - y0)) * (H - M.t - M.b);
  const significant = sp.p < 0.05;
  const verdict = !significant ? t.none : sp.rho < 0 ? t.neg : t.pos;

  return (
    <div>

      <div className={`alert ${significant ? 'alert-success' : 'alert-secondary'}`} role="status">
        <p className="mb-1">
          {t.corr}: <strong>ρ = {fmt(sp.rho, 2, lang, true)}</strong> · {fmtP(sp.p, lang)} · n = {sp.n}
        </p>
        <p className="mb-0">{verdict}</p>
      </div>

      <div className="card mb-3">
        <div className="card-body p-2">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.chartLabel} style={{ width: '100%', height: 'auto' }}>
            {ticks(y0, y1).map((v) => (
              <g key={`y${v}`}>
                <line x1={M.l} x2={W - M.r} y1={sy(v)} y2={sy(v)} stroke="var(--bs-border-color)" />
                <text x={M.l - 6} y={sy(v) + 4} textAnchor="end" fontSize="11" fill="var(--bs-secondary-color)">
                  {fmt(v, 1, lang)}
                </text>
              </g>
            ))}
            {ticks(x0, x1).map((v) => (
              <text key={`x${v}`} x={sx(v)} y={H - M.b + 16} textAnchor="middle" fontSize="11" fill="var(--bs-secondary-color)">
                {fmt(v, 2, lang)}
              </text>
            ))}
            <text x={(M.l + W - M.r) / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--bs-body-color)">{t.x}</text>
            <text transform={`translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="var(--bs-body-color)">{t.y}</text>
            {rows.map((r) => (
              <circle
                key={r.zona}
                cx={sx(r.ismt)}
                cy={sy(r.lst_c)}
                r={r.top ? 5.5 : 4.5}
                fill={r.top ? 'var(--bs-danger)' : 'var(--bs-secondary)'}
                fillOpacity={0.75}
                stroke="var(--bs-body-bg)"
              >
                <title>{`${r.zona} · ISMT ${fmt(r.ismt, 2, lang)} · ${fmt(r.lst_c, 1, lang)} °C`}</title>
              </circle>
            ))}
          </svg>
          <div className="small d-flex gap-3 px-2 pb-1">
            <span><span style={{ color: 'var(--bs-danger)' }}>●</span> {t.top}</span>
            <span><span style={{ color: 'var(--bs-secondary)' }}>●</span> {t.rest}</span>
          </div>
        </div>
      </div>

      <h3 className="h6">{t.idxTitle}</h3>
      <p className="small text-body-secondary">{t.idxDef}</p>
      <div className="table-responsive mb-3">
        <table className="table table-sm">
          <thead>
            <tr>
              <th scope="col">{t.zone}</th>
              <th scope="col">ISMT</th>
              <th scope="col">{t.temp}</th>
              <th scope="col">{t.idx}</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r) => (
              <tr key={r.zona}>
                <td>{r.zona}</td>
                <td>{fmt(r.ismt, 2, lang)}</td>
                <td>{fmt(r.lst_c, 1, lang)}</td>
                <td>{fmt(r.idx, 2, lang, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="small text-body-secondary">
        <strong>{t.limits}</strong>
        <ul className="mb-2 mt-1">
          <li>{t.l1(small, data.n)}</li>
          <li>{t.l2}</li>
          <li>{t.l3}</li>
          <li>{t.l4}</li>
          <li>{t.l5}</li>
        </ul>
        <strong>{t.sources}</strong>
        <ul className="mb-0 mt-1">
          <li>{data.fuente.ismt}</li>
          <li>{data.fuente.geometria}</li>
          <li>{data.fuente.temperatura}</li>
        </ul>
      </div>
    </div>
  );
}
