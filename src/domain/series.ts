import { XY, lag1Autocorrelation, linearTrend, mannKendall, mean, LinearTrend, MannKendall } from './stats';

/** Punto de una serie mensual (o más fina) tal como viene del CSV. */
export interface RawPoint extends XY {
  year: number;
  month: number; // 1-12
}

export type Mode = 'anomalies' | 'annual';

/** Años con menos meses que esto no se usan en el promedio anual. */
export const MIN_MONTHS_PER_YEAR = 10;
export const ALPHA = 0.05;

/** Parsea CSV "date,value" (YYYY-MM o YYYY-MM-DD). Ignora filas vacías o NaN. */
export function parseCsv(text: string): RawPoint[] {
  const out: RawPoint[] = [];
  for (const line of text.split(/\r?\n/)) {
    const [d, v] = line.split(',');
    if (!d || v === undefined || !/^\d{4}-\d{2}/.test(d)) continue;
    const y = Number(v);
    if (!Number.isFinite(y)) continue;
    const year = Number(d.slice(0, 4));
    const month = Number(d.slice(5, 7));
    const day = d.length >= 10 ? Number(d.slice(8, 10)) : 15;
    const t = year + (month - 1 + (day - 1) / 30) / 12;
    out.push({ t, y, year, month });
  }
  return out.sort((a, b) => a.t - b.t);
}

/** Resta el promedio de cada mes calendario: elimina el ciclo estacional. */
export function monthlyAnomalies(pts: RawPoint[]): RawPoint[] {
  const byMonth = new Map<number, number[]>();
  for (const p of pts) byMonth.set(p.month, [...(byMonth.get(p.month) ?? []), p.y]);
  const clim = new Map<number, number>();
  for (const [m, v] of byMonth) clim.set(m, mean(v));
  return pts.map((p) => ({ ...p, y: p.y - (clim.get(p.month) as number) }));
}

/** Promedio anual; descarta años incompletos para no sesgar por estacionalidad. */

export function annualMeans(pts: RawPoint[]): RawPoint[] {
  const byYear = new Map<number, Map<number, number[]>>();

  for (const p of pts) {
    if (!byYear.has(p.year)) {
      byYear.set(p.year, new Map());
    }

    const months = byYear.get(p.year)!;

    if (!months.has(p.month)) {
      months.set(p.month, []);
    }

    months.get(p.month)!.push(p.y);
  }

  const out: RawPoint[] = [];

  for (const [year, months] of [...byYear].sort((a, b) => a[0] - b[0])) {
    if (months.size < MIN_MONTHS_PER_YEAR) continue;

    const monthlyAverages = [...months.values()].map(values =>
      mean(values)
    );

    out.push({
      t: year + 0.5,
      y: mean(monthlyAverages),
      year,
      month: 7,
    });
  }

  return out;
}


export interface Analysis {
  mode: Mode;
  /** Serie sobre la que se hizo la prueba (anomalías o promedios anuales). */
  series: RawPoint[];
  linear: LinearTrend;
  mk: MannKendall;
  /** Cambio por década con IC 95 % (regresión) y Theil-Sen. */
  perDecade: { value: number; lo: number; hi: number; sen: number };
  significant: boolean;
  /** Autocorrelación de rezago 1 de los residuos: si es alta, el p-valor es optimista. */
  lag1: number;
  warnings: Array<'short' | 'autocorr' | 'disagree'>;
}

export function analyze(raw: RawPoint[], mode: Mode): Analysis {
  const series = mode === 'annual' ? annualMeans(raw) : monthlyAnomalies(raw);
  const linear = linearTrend(series);
  const mk = mannKendall(series);
  const residuals = series.map((p) => p.y - (linear.intercept + linear.slope * p.t));
  const lag1 = lag1Autocorrelation(residuals);
  const significant = linear.p < ALPHA;
  const warnings: Analysis['warnings'] = [];
  const span = series[series.length - 1].t - series[0].t;
  if (span < 15 || series.length < 10) warnings.push('short');
  if (lag1 > 0.3) warnings.push('autocorr');
  if ((linear.p < ALPHA) !== (mk.p < ALPHA)) warnings.push('disagree');
  return {
    mode,
    series,
    linear,
    mk,
    perDecade: {
      value: linear.slope * 10,
      lo: linear.ci95[0] * 10,
      hi: linear.ci95[1] * 10,
      sen: mk.senSlope * 10,
    },
    significant,
    lag1,
    warnings,
  };
}
