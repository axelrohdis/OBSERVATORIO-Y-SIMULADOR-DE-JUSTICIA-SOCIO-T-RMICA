/**
 * Estadística pura (sin React) para detectar tendencias lineales.
 * - Regresión lineal por mínimos cuadrados con t-test e IC 95 % de la pendiente.
 * - Mann-Kendall (con corrección por empates) y pendiente de Theil-Sen.
 * Validado contra scipy y pymannkendall en stats.test.ts.
 */

export interface XY {
  /** Tiempo en años decimales (p. ej. 2010.5) */
  t: number;
  y: number;
}

export interface LinearTrend {
  n: number;
  slope: number; // unidades por año
  intercept: number;
  se: number;
  tStat: number;
  df: number;
  p: number; // dos colas
  ci95: [number, number]; // IC 95 % de la pendiente
  r2: number;
}

export interface MannKendall {
  n: number;
  s: number;
  z: number;
  p: number; // dos colas
  senSlope: number; // unidades por año
  tau: number;
}

// ---------- Funciones especiales ----------

function lgamma(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const cj of c) ser += cj / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a: number, b: number, x: number): number {
  const MAXIT = 300;
  const EPS = 3e-14;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Beta incompleta regularizada I_x(a, b). */
export function ibeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  return x < (a + 1) / (a + b + 2)
    ? (bt * betacf(a, b, x)) / a
    : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** CDF de la t de Student. */
export function tCdf(t: number, df: number): number {
  const x = df / (df + t * t);
  const tail = 0.5 * ibeta(df / 2, 0.5, x);
  return t > 0 ? 1 - tail : tail;
}

/** Cuantil de la t de Student (p entre 0 y 1) por bisección. */
export function tQuantile(p: number, df: number): number {
  let lo = -1e4;
  let hi = 1e4;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (tCdf(mid, df) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** erfc con precisión ~1e-7 relativa (Numerical Recipes). */
function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? r : 2 - r;
}

export function normCdf(z: number): number {
  return 0.5 * erfc(-z / Math.SQRT2);
}

// ---------- Utilidades ----------

export const mean = (v: number[]): number => v.reduce((a, b) => a + b, 0) / v.length;

export function median(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ---------- Regresión lineal ----------

export function linearTrend(pts: XY[]): LinearTrend {
  const n = pts.length;
  if (n < 3) throw new Error('Se necesitan al menos 3 puntos');
  const mt = mean(pts.map((p) => p.t));
  const my = mean(pts.map((p) => p.y));
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of pts) {
    sxx += (p.t - mt) ** 2;
    sxy += (p.t - mt) * (p.y - my);
    syy += (p.y - my) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mt;
  let sse = 0;
  for (const p of pts) sse += (p.y - (intercept + slope * p.t)) ** 2;
  const df = n - 2;
  const se = Math.sqrt(sse / df / sxx);
  const tStat = se === 0 ? Infinity : slope / se;
  const p = se === 0 ? 0 : 2 * (1 - tCdf(Math.abs(tStat), df));
  const tcrit = tQuantile(0.975, df);
  return {
    n,
    slope,
    intercept,
    se,
    tStat,
    df,
    p,
    ci95: [slope - tcrit * se, slope + tcrit * se],
    r2: syy === 0 ? 0 : 1 - sse / syy,
  };
}

// ---------- Mann-Kendall + Theil-Sen ----------

export function mannKendall(pts: XY[]): MannKendall {
  const n = pts.length;
  if (n < 4) throw new Error('Se necesitan al menos 4 puntos');
  const sorted = [...pts].sort((a, b) => a.t - b.t);
  let s = 0;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dy = sorted[j].y - sorted[i].y;
      s += Math.sign(dy);
      const dt = sorted[j].t - sorted[i].t;
      if (dt !== 0) slopes.push(dy / dt);
    }
  }
  // Corrección por empates
  const counts = new Map<number, number>();
  for (const p of sorted) counts.set(p.y, (counts.get(p.y) ?? 0) + 1);
  let tieTerm = 0;
  for (const c of counts.values()) if (c > 1) tieTerm += c * (c - 1) * (2 * c + 5);
  const varS = (n * (n - 1) * (2 * n + 5) - tieTerm) / 18;
  const z = s > 0 ? (s - 1) / Math.sqrt(varS) : s < 0 ? (s + 1) / Math.sqrt(varS) : 0;
  const p = 2 * (1 - normCdf(Math.abs(z)));
  return { n, s, z, p, senSlope: median(slopes), tau: s / ((n * (n - 1)) / 2) };
}

/** Autocorrelación de rezago 1 (sobre residuos o anomalías). */
export function lag1Autocorrelation(v: number[]): number {
  const m = mean(v);
  let num = 0;
  let den = 0;
  for (let i = 0; i < v.length; i++) {
    den += (v[i] - m) ** 2;
    if (i > 0) num += (v[i] - m) * (v[i - 1] - m);
  }
  return den === 0 ? 0 : num / den;
}
