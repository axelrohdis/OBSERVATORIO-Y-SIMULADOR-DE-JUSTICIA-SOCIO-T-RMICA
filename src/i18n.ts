import type { Lang } from './data/catalog';

const ui = {
  title: { es: 'Detective de Tendencias', en: 'Earth System Trend Detective' },
  tagline: {
    es: 'Elige una variable de la Tierra y una región. Descubre si cambia en el tiempo y si ese cambio es "significativo".',
    en: 'Pick an Earth variable and a region. Find out whether it changes over time and whether that change is "significant".',
  },
  demoBanner: {
    es: 'DATOS DE DEMOSTRACIÓN (sintéticos). No son mediciones reales: no los uses para sacar conclusiones. Reemplázalos con los datos de Earth Engine (ver README).',
    en: 'DEMONSTRATION DATA (synthetic). These are not real measurements: do not draw conclusions from them. Replace them with the Earth Engine exports (see README).',
  },
  navExamples: { es: 'Ejemplos', en: 'Examples' },
  navMap: { es: 'Mapa', en: 'Map' },
  mapTitle: { es: 'Mapa: mira el territorio a través de los años', en: 'Map: see the territory through the years' },
  mapImagery: { es: 'Imagen satelital', en: 'Satellite imagery' },
  mapOverlay: { es: 'Capa de datos', en: 'Data layer' },
  mapNone: { es: 'Ninguna', en: 'None' },
  mapYear: { es: 'Año', en: 'Year' },
  mapMonth: { es: 'Mes', en: 'Month' },
  mapOpacity: { es: 'Opacidad de la capa', en: 'Layer opacity' },
  mapPlay: { es: 'Reproducir años', en: 'Play years' },
  mapPause: { es: 'Pausar', en: 'Pause' },
  mapHint: { es: 'Haz clic en un recuadro para elegir esa región. Imágenes: NASA GIBS. Las nubes pueden tapar algunos días.', en: 'Click a box to pick that region. Imagery: NASA GIBS. Clouds can hide some days.' },
  notEnough: { es: 'No hay suficientes datos válidos para este método (se descartaron los meses con pocas noches despejadas). Prueba con «Anomalías mensuales» o elige otra región.', en: 'Not enough valid data for this method (months with few clear nights were discarded). Try «Monthly anomalies» or pick another region.' },
  navVariable: { es: 'Variable', en: 'Variable' },
  navRegion: { es: 'Región', en: 'Region' },
  navResult: { es: 'Resultado', en: 'Result' },
  examples: { es: 'Prueba un ejemplo', en: 'Try an example' },
  step1: { es: '1. ¿Qué quieres investigar?', en: '1. What do you want to investigate?' },
  step2: { es: '2. ¿Dónde?', en: '2. Where?' },
  step3: { es: '3. ¿Qué encontramos?', en: '3. What did we find?' },
  mode: { es: 'Método', en: 'Method' },
  modeAnnual: { es: 'Promedios anuales', en: 'Annual means' },
  modeAnomalies: { es: 'Anomalías mensuales', en: 'Monthly anomalies' },
  modeAnnualHelp: {
    es: 'Un punto por año. Más conservador: los puntos son más independientes entre sí.',
    en: 'One point per year. More conservative: the points are more independent of each other.',
  },
  modeAnomaliesHelp: {
    es: 'Un punto por mes, sin el ciclo estacional (verano/invierno). Más datos, pero meses vecinos se parecen.',
    en: 'One point per month with the seasonal cycle removed. More data, but neighbouring months are alike.',
  },
  loading: { es: 'Cargando datos…', en: 'Loading data…' },
  error: { es: 'No se pudieron cargar los datos.', en: 'Could not load the data.' },
  noData: { es: 'No hay datos para esta combinación.', en: 'No data for this combination.' },
  source: { es: 'Fuente', en: 'Source' },
  modelNote: { es: 'Variable producida por un modelo.', en: 'Variable produced by a model.' },
  chartLabel: { es: 'Serie y línea de tendencia', en: 'Series and trend line' },
  seriesLabel: { es: 'Datos', en: 'Data' },
  trendLabel: { es: 'Tendencia lineal', en: 'Linear trend' },
  perDecade: { es: 'por década', en: 'per decade' },
  increasing: { es: 'Aumenta', en: 'Increasing' },
  decreasing: { es: 'Disminuye', en: 'Decreasing' },
  significant: { es: 'Tendencia significativa', en: 'Significant trend' },
  notSignificant: { es: 'Tendencia no significativa', en: 'No significant trend' },
  sigExplain: {
    es: 'Con 95 % de confianza, es muy poco probable que este cambio sea solo azar.',
    en: 'At 95% confidence, it is very unlikely that this change is just chance.',
  },
  notSigExplain: {
    es: 'No podemos descartar que sea azar. No significa que no cambie: con un registro más largo podría volverse significativa.',
    en: 'We cannot rule out chance. That does not mean nothing changes: a longer record could make it significant.',
  },
  ci: { es: 'IC 95 %', en: '95% CI' },
  stats: { es: 'Detalle estadístico', en: 'Statistical details' },
  regression: { es: 'Regresión lineal', en: 'Linear regression' },
  mannKendall: { es: 'Mann-Kendall / Theil-Sen', en: 'Mann-Kendall / Theil-Sen' },
  points: { es: 'Puntos', en: 'Points' },
  period: { es: 'Período', en: 'Period' },
  senSlope: { es: 'Pendiente de Theil-Sen', en: 'Theil-Sen slope' },
  warnTitle: { es: 'Ojo con esto', en: 'Keep in mind' },
  warnShort: {
    es: 'Serie corta (menos de 15 años o 10 puntos): la tendencia puede ser frágil.',
    en: 'Short record (under 15 years or 10 points): the trend may be fragile.',
  },
  warnAutocorr: {
    es: 'Los datos vecinos se parecen entre sí (autocorrelación alta): el p-valor es optimista. Prueba con promedios anuales.',
    en: 'Neighbouring values resemble each other (high autocorrelation): the p-value is optimistic. Try annual means.',
  },
  warnDisagree: {
    es: 'Regresión y Mann-Kendall no coinciden en la significancia: el resultado es sensible al método.',
    en: 'Regression and Mann-Kendall disagree on significance: the result is method-sensitive.',
  },
  limits: { es: 'Lo que este análisis NO puede decir', en: 'What this analysis can NOT tell you' },
  limit1: {
    es: 'Solo detecta tendencias lineales; no cambios bruscos ni ciclos de varias décadas.',
    en: 'It only detects linear trends, not abrupt shifts or multi-decade cycles.',
  },
  limit2: {
    es: 'Una tendencia no explica su causa: correlación no es causalidad.',
    en: 'A trend does not explain its cause: correlation is not causation.',
  },
  limit3: {
    es: 'Cada píxel satelital promedia mucho terreno; una región pequeña puede quedar mezclada con su entorno.',
    en: 'Each satellite pixel averages a lot of ground; a small region may blend with its surroundings.',
  },
  download: { es: 'Descargar datos (CSV)', en: 'Download data (CSV)' },
  copyLink: { es: 'Copiar enlace', en: 'Copy link' },
  copied: { es: '¡Copiado!', en: 'Copied!' },
  lang: { es: 'English', en: 'Español' },
} satisfies Record<string, Record<Lang, string>>;

export type UiKey = keyof typeof ui;
export const tr = (lang: Lang, key: UiKey): string => ui[key][lang];

export function fmt(n: number, digits: number, lang: Lang, signed = false): string {
  const s = n.toLocaleString(lang === 'es' ? 'es-CL' : 'en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: signed ? 'exceptZero' : 'auto',
  });
  return s;
}

/** Devuelve "p < 0.001" o "p = 0.008" (con coma decimal en español). */
export function fmtP(p: number, lang: Lang): string {
  if (p < 0.001) return lang === 'es' ? 'p < 0,001' : 'p < 0.001';
  return `p = ${fmt(p, 3, lang)}`;
}
