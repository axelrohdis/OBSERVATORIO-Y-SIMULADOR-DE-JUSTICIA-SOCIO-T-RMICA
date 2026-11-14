// Capas de NASA GIBS (WMTS, sin clave). Patrón de URL (documentado por GIBS):
// https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{capa}/default/{fecha}/{matriz}/{z}/{y}/{x}.{ext}
import type { L10n } from './catalog';

export interface GibsLayer {
    id: string; // identificador de capa en GIBS
    label: L10n;
    matrix: string; // TileMatrixSet, p. ej. GoogleMapsCompatible_Level9
    maxZoom: number; // el nivel de la matriz
    ext: 'jpg' | 'png';
    /** 'daily' usa AAAA-MM-15 · 'monthly' usa AAAA-MM-01 */
    time: 'daily' | 'monthly';
}

export const IMAGERY: GibsLayer = {
    id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    label: { es: 'Color real (MODIS Terra)', en: 'True color (MODIS Terra)' },
    matrix: 'GoogleMapsCompatible_Level9',
    maxZoom: 9,
    ext: 'jpg',
    time: 'daily',
};

// Capas de datos superpuestas. Si alguna no carga, revisa el id en
// https://nasa-gibs.github.io/gibs-api-docs/available-visualizations/
export const OVERLAYS: GibsLayer[] = [
    {
        id: 'MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day',
        label: { es: 'Temperatura superficial (día, mensual)', en: 'Surface temperature (day, monthly)' },
        matrix: 'GoogleMapsCompatible_Level6',
        maxZoom: 6,
        ext: 'png',
        time: 'monthly',
    },
];

export function dateFor(l: GibsLayer, year: number, month: number): string {
    const mm = String(month).padStart(2, '0');
    return `${year}-${mm}-${l.time === 'daily' ? '15' : '01'}`;
}

export function tileUrl(l: GibsLayer, year: number, month: number): string {
    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${l.id}/default/${dateFor(l, year, month)}/${l.matrix}/{z}/{y}/{x}.${l.ext}`;
}