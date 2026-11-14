export type Lang = 'es' | 'en';
export type L10n = Record<Lang, string>;

export interface VariableInfo {
  id: string;
  unit: L10n;
  decimals: number;
  kind: 'satellite' | 'model' | 'derived';
  label: L10n;
  simple: L10n;
  source: L10n;
  note?: L10n;
}

export interface RegionInfo {
  id: string;
  label: L10n;
  blurb: L10n;
  /** [oeste, sur, este, norte] en grados. Debe coincidir con earth-engine/export_timeseries.js */
  bbox: [number, number, number, number];
}

const same = (s: string): L10n => ({ es: s, en: s });

export const VARIABLES: VariableInfo[] = [
  {
    id: 'lst',
    unit: same('°C'),
    decimals: 2,
    kind: 'satellite',
    label: { es: 'Temperatura de la superficie', en: 'Land surface temperature' },
    simple: {
      es: 'Temperatura de la "piel" del suelo, el pavimento o la vegetación, medida desde el espacio con infrarrojo térmico. No es la temperatura del aire que sentimos.',
      en: 'Temperature of the "skin" of soil, pavement or vegetation, measured from space with thermal infrared. It is not the air temperature we feel.',
    },
    source: {
      es: 'NASA MODIS Terra MOD11A2 (diurno, 1 km), promedio mensual',
      en: 'NASA MODIS Terra MOD11A2 (daytime, 1 km), monthly mean',
    },
  },
  {
    id: 'ndvi',
    unit: same(''),
    decimals: 3,
    kind: 'satellite',
    label: { es: 'Verdor de la vegetación (NDVI)', en: 'Vegetation greenness (NDVI)' },
    simple: {
      es: 'Índice de verdor entre -1 y 1. Alto = vegetación densa y sana; cerca de 0 = suelo desnudo o pavimento.',
      en: 'Greenness index from -1 to 1. High = dense, healthy vegetation; near 0 = bare soil or pavement.',
    },
    source: { es: 'NASA MODIS Terra MOD13A3 (mensual, 1 km)', en: 'NASA MODIS Terra MOD13A3 (monthly, 1 km)' },
  },
  {
    id: 'precip',
    unit: { es: 'mm/mes', en: 'mm/month' },
    decimals: 1,
    kind: 'satellite',
    label: { es: 'Precipitación', en: 'Precipitation' },
    simple: {
      es: 'Lluvia acumulada en un mes. 1 mm equivale a 1 litro de agua por metro cuadrado.',
      en: 'Rain accumulated in a month. 1 mm equals 1 litre of water per square metre.',
    },
    source: {
      es: 'NASA GPM IMERG mensual V07 (0,1°), estimación satelital',
      en: 'NASA GPM IMERG monthly V07 (0.1°), satellite estimate',
    },
  },
  {
    id: 'airtemp',
    unit: same('°C'),
    decimals: 2,
    kind: 'model',
    label: { es: 'Temperatura del aire (modelo)', en: 'Air temperature (model)' },
    simple: {
      es: 'Temperatura del aire a 2 m calculada por un modelo (GLDAS-2.1) que asimila datos satelitales. Es salida de modelo, no una medición directa.',
      en: 'Air temperature at 2 m computed by a model (GLDAS-2.1) that assimilates satellite data. It is model output, not a direct measurement.',
    },
    source: { es: 'NASA GLDAS-2.1 Noah (0,25°), modelo', en: 'NASA GLDAS-2.1 Noah (0.25°), model' },
  },
  {
    id: 'uhi',
    unit: same('°C'),
    decimals: 2,
    kind: 'derived',
    label: { es: 'Isla de calor superficial', en: 'Surface urban heat island' },
    simple: {
      es: 'Diferencia de temperatura de superficie entre la ciudad y su entorno natural (ciudad menos referencia). Positivo = la ciudad está más caliente.',
      en: 'Surface temperature difference between the city and its natural surroundings (city minus reference). Positive = the city is warmer.',
    },
    source: {
      es: 'Derivado de MODIS MOD11A2: zona urbana menos zona de referencia',
      en: 'Derived from MODIS MOD11A2: urban area minus reference area',
    },
    note: {
      es: 'Oke definió la isla de calor sobre la temperatura del AIRE, con máximos típicos de noche. Un satélite mide la temperatura de la SUPERFICIE a una hora de paso diurna: por eso esto es una isla de calor superficial, relacionada pero no idéntica.',
      en: "Oke defined the urban heat island on AIR temperature, typically strongest at night. A satellite measures SURFACE temperature at a daytime overpass: this is a surface heat island, related to but not the same as Oke's.",
    },
  },
];

export const REGIONS: RegionInfo[] = [
  {
    id: 'concepcion_urbano',
    bbox: [-73.1, -36.86, -73.0, -36.78],
    label: { es: 'Concepción (zona urbana)', en: 'Concepción (urban area)' },
    blurb: { es: 'Centro urbano del Gran Concepción, Chile', en: 'Urban core of Greater Concepción, Chile' },
  },
  {
    id: 'concepcion_entorno',
    bbox: [-72.95, -36.95, -72.85, -36.87],
    label: { es: 'Entorno de Concepción', en: 'Concepción surroundings' },
    blurb: { es: 'Zona forestal de referencia fuera de la ciudad', en: 'Forested reference area outside the city' },
  },
  {
    id: 'atacama',
    bbox: [-69.6, -24.5, -69.1, -24.1],
    label: { es: 'Desierto de Atacama', en: 'Atacama Desert' },
    blurb: { es: 'Desierto hiperárido del norte de Chile', en: 'Hyper-arid desert in northern Chile' },
  },
  {
    id: 'amazonia',
    bbox: [-63.5, -5.0, -62.5, -4.0],
    label: { es: 'Amazonía central', en: 'Central Amazon' },
    blurb: { es: 'Selva tropical húmeda', en: 'Humid tropical rainforest' },
  },
];

export const EXAMPLES: Array<{ v: string; r: string; label: L10n }> = [
  {
    v: 'uhi',
    r: 'concepcion_urbano',
    label: { es: '¿Se calienta más la ciudad que su entorno?', en: 'Is the city warming faster than its surroundings?' },
  },
  {
    v: 'ndvi',
    r: 'amazonia',
    label: { es: '¿Cambia el verdor de la Amazonía?', en: 'Is the Amazon changing in greenness?' },
  },
  {
    v: 'precip',
    r: 'concepcion_urbano',
    label: { es: 'Lluvia en Concepción: ¿hay tendencia?', en: 'Rain in Concepción: is there a trend?' },
  },
];
