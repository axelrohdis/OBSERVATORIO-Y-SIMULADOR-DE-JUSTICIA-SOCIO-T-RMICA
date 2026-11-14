import { describe, expect, it } from 'vitest';
import { linearTrend, mannKendall, tCdf, tQuantile, normCdf } from './stats';
import { analyze, annualMeans, monthlyAnomalies, parseCsv } from './series';

// Valores de referencia calculados con scipy 1.x y pymannkendall (ver README, sección "Validación").
const T = [2000.5, 2001.5, 2002.5, 2003.5, 2004.5, 2005.5, 2006.5, 2007.5, 2008.5, 2009.5, 2010.5, 2011.5, 2012.5, 2013.5, 2014.5, 2015.5, 2016.5, 2017.5, 2018.5, 2019.5, 2020.5, 2021.5, 2022.5, 2023.5, 2024.5];
const Y = [9.9304, 10.239, 10.0209, 10.0297, 9.8545, 10.1453, 10.6492, 10.4485, 10.7029, 10.4671, 10.5582, 10.5249, 9.9169, 10.8393, 10.7572, 10.7946, 10.068, 10.0896, 10.4286, 10.6161, 10.9269, 10.8439, 11.0823, 10.7152, 11.088];
const ref = {
  slope: 0.03460246153846151, p: 0.00023433755666192835, se: 0.007951510528386795, r2: 0.4515603046920251,
  ci: [0.01815350876958698, 0.05105141430733605],
  mk: {"z": 3.6667300270007734, "p": 0.0002456719267813767, "s": 158.0, "slope": 0.03672500000000001, "tau": 0.5266666666666666},
};
const Y2 = [1, 2, 2, 3, 3, 3, 4, 5, 5, 6, 7, 7, 8, 9, 9];
const T2 = [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014];
const ref2 = {"z": 4.845963378410102, "p": 1.2599875851559972e-06, "s": 98.0, "slope": 0.5833333333333334};

const pts = (t: number[], y: number[]) => t.map((x, i) => ({ t: x, y: y[i] }));

describe('funciones especiales', () => {
  it('tCdf coincide con scipy', () => {
    for (const [x, df, expected] of [[2.0, 10, 0.9633059826146299], [-1.3, 23, 0.1032394276680102]]) expect(tCdf(x, df)).toBeCloseTo(expected, 8);
  });
  it('tQuantile coincide con scipy', () => {
    for (const [p, df, expected] of [[0.975, 23, 2.0686576104190486], [0.975, 8, 2.306004135204166]]) expect(tQuantile(p, df)).toBeCloseTo(expected, 6);
  });
  it('normCdf', () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 7);
    expect(normCdf(1.96)).toBeCloseTo(0.9750021, 5);
  });
});

describe('regresión lineal', () => {
  const lt = linearTrend(pts(T, Y));
  it('pendiente, error estándar y R²', () => {
    expect(lt.slope).toBeCloseTo(ref.slope, 10);
    expect(lt.se).toBeCloseTo(ref.se, 10);
    expect(lt.r2).toBeCloseTo(ref.r2, 10);
  });
  it('p-valor e IC 95 %', () => {
    expect(lt.p).toBeCloseTo(ref.p, 8);
    expect(lt.ci95[0]).toBeCloseTo(ref.ci[0], 6);
    expect(lt.ci95[1]).toBeCloseTo(ref.ci[1], 6);
  });
  it('rechaza series demasiado cortas', () => {
    expect(() => linearTrend(pts([1, 2], [1, 2]))).toThrow();
  });
});

describe('Mann-Kendall', () => {
  it('serie sin empates', () => {
    const mk = mannKendall(pts(T, Y));
    expect(mk.s).toBe(ref.mk.s);
    expect(mk.z).toBeCloseTo(ref.mk.z, 8);
    expect(mk.p).toBeCloseTo(ref.mk.p, 5);
    expect(mk.senSlope).toBeCloseTo(ref.mk.slope, 8);
    expect(mk.tau).toBeCloseTo(ref.mk.tau, 8);
  });
  it('serie con empates (corrección de varianza)', () => {
    const mk = mannKendall(pts(T2, Y2));
    expect(mk.s).toBe(ref2.s);
    expect(mk.z).toBeCloseTo(ref2.z, 8);
    expect(mk.senSlope).toBeCloseTo(ref2.slope, 8);
  });
});

describe('series', () => {
  const csv = ['date,value'];
  // 12 años mensuales con ciclo estacional fuerte y tendencia +0.5 por año
  for (let y = 2010; y < 2022; y++)
    for (let m = 1; m <= 12; m++)
      csv.push(`${y}-${String(m).padStart(2, '0')},${(10 + 8 * Math.sin(((m - 1) / 12) * 2 * Math.PI) + 0.5 * (y - 2010)).toFixed(4)}`);
  const raw = parseCsv(csv.join('\n'));

  it('parseCsv ignora cabecera y NaN', () => {
    expect(raw).toHaveLength(144);
    expect(parseCsv('date,value\n2020-01,NaN\n2020-02,3')).toHaveLength(1);
  });
  it('las anomalías eliminan el ciclo estacional y conservan la tendencia', () => {
    const a = analyze(raw, 'anomalies');
    expect(a.perDecade.value).toBeCloseTo(5, 1);
    expect(a.significant).toBe(true);
  });
  it('promedio anual descarta años incompletos', () => {
    const partial = raw.filter((p) => !(p.year === 2021 && p.month > 4));
    expect(annualMeans(partial)).toHaveLength(11);
    expect(monthlyAnomalies(raw)).toHaveLength(144);
  });
  it('una serie sin tendencia no es significativa', () => {
    const flat = ['date,value'];
    let seed = 3;
    for (let y = 2000; y < 2025; y++) {
      seed = (seed * 16807) % 2147483647;
      flat.push(`${y}-06,${(seed / 2147483647).toFixed(4)}`);
      for (let m of [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12]) flat.push(`${y}-${String(m).padStart(2, '0')},0.5`);
    }
    const a = analyze(parseCsv(flat.join('\n')), 'annual');
    expect(a.linear.n).toBe(25);
  });
});
