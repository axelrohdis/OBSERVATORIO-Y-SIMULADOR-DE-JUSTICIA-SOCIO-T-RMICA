
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
  /** [oeste, sur, este, norte] en grados. Debe coincidir con export_lst_night.js y export_vegetation.js */
  bbox: [number, number, number, number];
}

const same = (s: string): L10n => ({ es: s, en: s });

export const VARIABLES: VariableInfo[] = [
  {
    id: 'lst',
    unit: same('°C'),
    decimals: 2,
    kind: 'satellite',
    label: {
      es: 'Temperatura de la superficie (noche)',
      en: 'Land surface temperature (night)',
    },
    simple: {
      es: 'Temperatura de la "piel" del suelo, el pavimento o la vegetación, medida desde el espacio con infrarrojo térmico. No es la temperatura del aire que sentimos.',
      en: 'Temperature of the "skin" of soil, pavement or vegetation, measured from space with thermal infrared. It is not the air temperature we feel.',
    },
    source: {
      es: 'NASA VIIRS/Suomi NPP VNP21A1N.002 (nocturno, 1 km), promedio mensual de noches despejadas',
      en: 'NASA VIIRS/Suomi NPP VNP21A1N.002 (night, 1 km), monthly mean of clear nights',
    },
  },
  {
    id: 'uhi',
    unit: same('°C'),
    decimals: 2,
    kind: 'derived',
    label: {
      es: 'Isla de calor superficial',
      en: 'Surface urban heat island',
    },
    simple: {
      es: 'Diferencia de temperatura superficial entre la zona urbana y su entorno de referencia (ciudad menos entorno). Un valor positivo indica que la superficie urbana está más caliente.',
      en: 'Difference in land surface temperature between the urban area and its reference surroundings (city minus surroundings). A positive value indicates a warmer urban surface.',
    },
    source: {
      es: 'Derivado de NASA VIIRS/Suomi NPP VNP21A1N.002: temperatura superficial nocturna urbana menos temperatura del entorno de referencia',
      en: 'Derived from NASA VIIRS/Suomi NPP VNP21A1N.002: urban nighttime land surface temperature minus reference-area temperature',
    },
    note: {
      es: 'Representa una isla de calor superficial nocturna, calculada con observaciones de noches despejadas. Está relacionada con la isla de calor urbana atmosférica descrita por Oke, pero no es equivalente a ella.',
      en: "Represents a nocturnal surface urban heat island, calculated from clear-night observations. It is related to Oke's atmospheric urban heat island, but is not equivalent to it.",
    },
  },
  {
    id: 'ndvi',
    unit: same(''),
    decimals: 3,
    kind: 'satellite',
    label: {
      es: 'Índice de vegetación (NDVI)',
      en: 'Vegetation index (NDVI)',
    },
    simple: {
      es: 'Índice espectral que permite estimar el verdor relativo de la vegetación. Sus valores suelen variar entre -1 y 1. No es una medición directa de la salud de las plantas.',
      en: 'A spectral index used to estimate relative vegetation greenness. Values generally range from -1 to 1. It is not a direct measurement of plant health.',
    },
    source: {
      es: 'NASA VIIRS/Suomi NPP VNP13A1.002: producto de índices de vegetación, resolución de 500 m y composiciones de 16 días',
      en: 'NASA VIIRS/Suomi NPP VNP13A1.002: vegetation indices product, 500 m resolution and 16-day composites',
    },
    note: {
      es: 'Los valores pueden variar por estacionalidad, cobertura del suelo y mezcla de superficies dentro de cada píxel. Conviene interpretar las tendencias junto con el contexto territorial.',
      en: 'Values may vary with seasonality, land cover and mixed surfaces within each pixel. Trends should be interpreted alongside territorial context.',
    },
  },
  {
    id: 'evi',
    unit: same(''),
    decimals: 3,
    kind: 'satellite',
    label: {
      es: 'Índice de vegetación mejorado (EVI)',
      en: 'Enhanced Vegetation Index (EVI)',
    },
    simple: {
      es: 'Índice espectral que representa el verdor de la vegetación y busca mejorar la sensibilidad en zonas con vegetación abundante, reduciendo algunas influencias del suelo y la atmósfera.',
      en: 'A spectral index representing vegetation greenness, designed to improve sensitivity in areas with abundant vegetation while reducing some soil and atmospheric influences.',
    },
    source: {
      es: 'NASA VIIRS/Suomi NPP VNP13A1.002: producto de índices de vegetación, resolución de 500 m y composiciones de 16 días',
      en: 'NASA VIIRS/Suomi NPP VNP13A1.002: vegetation indices product, 500 m resolution and 16-day composites',
    },
    note: {
      es: 'Es un índice adimensional. Sus valores no deben interpretarse como porcentaje de cobertura vegetal ni como una medición directa de salud ecológica.',
      en: 'This is a dimensionless index. Its values should not be interpreted as vegetation-cover percentages or direct measurements of ecological health.',
    },
  },
  {
    id: 'evi2',
    unit: same(''),
    decimals: 3,
    kind: 'satellite',
    label: {
      es: 'Índice de vegetación mejorado de dos bandas (EVI2)',
      en: 'Two-band Enhanced Vegetation Index (EVI2)',
    },
    simple: {
      es: 'Variante del EVI que utiliza dos bandas espectrales. Permite analizar el verdor de la vegetación sin depender de la banda azul utilizada por el EVI convencional.',
      en: 'A two-band variant of EVI. It allows vegetation greenness analysis without relying on the blue band used by conventional EVI.',
    },
    source: {
      es: 'NASA VIIRS/Suomi NPP VNP13A1.002: producto de índices de vegetación, resolución de 500 m y composiciones de 16 días',
      en: 'NASA VIIRS/Suomi NPP VNP13A1.002: vegetation indices product, 500 m resolution and 16-day composites',
    },
    note: {
      es: 'Es un índice adimensional. Se recomienda analizarlo como una serie temporal y compararlo con NDVI y EVI, sin asumir que sus escalas son intercambiables.',
      en: 'This is a dimensionless index. It is best analyzed as a time series and compared with NDVI and EVI without assuming their scales are interchangeable.',
    },
  },
];

export const REGIONS: RegionInfo[] = [
  {
    id: 'concepcion_urbano',
    bbox: [-73.1, -36.86, -73.0, -36.78],
    label: {
      es: 'Concepción (zona urbana)',
      en: 'Concepción (urban area)',
    },
    blurb: {
      es: 'Centro urbano del Gran Concepción, Chile',
      en: 'Urban core of Greater Concepción, Chile',
    },
  },
  {
    id: 'concepcion_entorno',
    bbox: [-72.95, -36.95, -72.85, -36.87],
    label: {
      es: 'Entorno de Concepción',
      en: 'Concepción surroundings',
    },
    blurb: {
      es: 'Zona forestal de referencia fuera de la ciudad',
      en: 'Forested reference area outside the city',
    },
  },
];

export const EXAMPLES: Array<{ v: string; r: string; label: L10n }> = [
  {
    v: 'uhi',
    r: 'concepcion_urbano',
    label: {
      es: '¿Se calienta más la ciudad que su entorno?',
      en: 'Is the city warmer than its surroundings?',
    },
  },
  {
    v: 'ndvi',
    r: 'concepcion_urbano',
    label: {
      es: '¿Cómo cambia el verdor de la zona urbana?',
      en: 'How does urban vegetation greenness change?',
    },
  },
  {
    v: 'evi',
    r: 'concepcion_urbano',
    label: {
      es: '¿Qué tendencias muestra el EVI?',
      en: 'What trends does EVI show?',
    },
  },
  {
    v: 'evi2',
    r: 'concepcion_urbano',
    label: {
      es: '¿Qué tendencias muestra el EVI2?',
      en: 'What trends does EVI2 show?',
    },
  },
];
