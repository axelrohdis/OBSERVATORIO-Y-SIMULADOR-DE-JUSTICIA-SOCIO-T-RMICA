import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Lang, REGIONS } from '../data/catalog';
import { IMAGERY, OVERLAYS, tileUrl } from '../data/gibs';
import { tr } from '../i18n';

const MIN_YEAR = 2001;
const MAX_YEAR = new Date().getFullYear() - 1;
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  lang: Lang;
  region: string;
  onPickRegion: (id: string) => void;
}

function boxFeature(id: string, b: [number, number, number, number]) {
  const [w, s, e, n] = b;
  return {
    type: 'Feature' as const,
    properties: { id },
    geometry: { type: 'Polygon' as const, coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] },
  };
}

export function MapView({ lang, region, onPickRegion }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const ready = useRef(false);
  const pickRef = useRef(onPickRegion);
  pickRef.current = onPickRegion;

  const [year, setYear] = useState(2005);
  const [month, setMonth] = useState(1);
  const [overlay, setOverlay] = useState(''); // '' = ninguna
  const [opacity, setOpacity] = useState(0.7);
  const [playing, setPlaying] = useState(false);
  const [tick, setTick] = useState(0); // avisa que el mapa ya cargó

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#1b1f24' } }] },
      center: [-73.05, -36.82],
      zoom: 9,
      maxZoom: 12,
      attributionControl: { compact: true },
    });
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    m.on('load', () => {
      m.addSource('regions', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: REGIONS.map((r) => boxFeature(r.id, r.bbox)) },
      });
      m.addLayer({ id: 'regions-fill', type: 'fill', source: 'regions', paint: { 'fill-color': '#ffffff', 'fill-opacity': 0.05 } });
      m.addLayer({
        id: 'regions-line',
        type: 'line',
        source: 'regions',
        paint: {
          'line-color': ['case', ['==', ['get', 'id'], ''], '#ffd54a', '#ffffff'],
          'line-width': 2,
        },
      });
      m.on('click', 'regions-fill', (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) pickRef.current(String(id));
      });
      m.on('mouseenter', 'regions-fill', () => (m.getCanvas().style.cursor = 'pointer'));
      m.on('mouseleave', 'regions-fill', () => (m.getCanvas().style.cursor = ''));
      ready.current = true;
      setTick((t) => t + 1);
    });
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      ready.current = false;
    };
  }, []);

  // Capas de GIBS: se reemplazan cuando cambia fecha o capa.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    const put = (key: string, layer: typeof IMAGERY, op: number) => {
      if (m.getLayer(key)) m.removeLayer(key);
      if (m.getSource(key)) m.removeSource(key);
      m.addSource(key, {
        type: 'raster',
        tiles: [tileUrl(layer, year, month)],
        tileSize: 256,
        maxzoom: layer.maxZoom,
        attribution: 'NASA GIBS / ESDIS',
      });
      m.addLayer({ id: key, type: 'raster', source: key, paint: { 'raster-opacity': op, 'raster-fade-duration': 0 } }, 'regions-fill');
    };
    put('imagery', IMAGERY, 1);
    const o = OVERLAYS.find((x) => x.id === overlay);
    if (o) put('overlay', o, opacity);
    else {
      if (m.getLayer('overlay')) m.removeLayer('overlay');
      if (m.getSource('overlay')) m.removeSource('overlay');
    }
  }, [year, month, overlay, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const m = map.current;
    if (m && m.getLayer('overlay')) m.setPaintProperty('overlay', 'raster-opacity', opacity);
  }, [opacity]);

  // Resaltar la región elegida y volar hacia ella.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    m.setPaintProperty('regions-line', 'line-color', ['case', ['==', ['get', 'id'], region], '#ffd54a', '#ffffff']);
    m.setPaintProperty('regions-line', 'line-width', ['case', ['==', ['get', 'id'], region], 3, 1.5]);
    const r = REGIONS.find((x) => x.id === region);
    if (r) {
      const [w, s, e, n] = r.bbox;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      m.fitBounds([[w, s], [e, n]], { padding: 60, duration: reduce ? 0 : 1200, maxZoom: 10 });
    }
  }, [region, tick]);

  // Reproducir años.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setYear((y) => (y >= MAX_YEAR ? MIN_YEAR : y + 1)), 1800);
    return () => clearInterval(id);
  }, [playing]);

  const months = lang === 'es' ? MONTHS_ES : MONTHS_EN;
  const regionName = REGIONS.find((r) => r.id === region)?.label[lang] ?? '';

  return (
    <div>
      <div className="row g-3 mb-3 align-items-end">
        <div className="col-12 col-md-6">
          <label htmlFor="map-year" className="form-label mb-1">
            {tr(lang, 'mapYear')}: <strong>{year}</strong>
          </label>
          <div className="d-flex gap-2 align-items-center">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPlaying((p) => !p)}>
              {tr(lang, playing ? 'mapPause' : 'mapPlay')}
            </button>
            <input
              id="map-year"
              type="range"
              className="form-range"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="col-6 col-md-2">
          <label htmlFor="map-month" className="form-label mb-1">{tr(lang, 'mapMonth')}</label>
          <select id="map-month" className="form-select form-select-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((n, i) => (
              <option key={n} value={i + 1}>{n}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-4">
          <label htmlFor="map-overlay" className="form-label mb-1">{tr(lang, 'mapOverlay')}</label>
          <select id="map-overlay" className="form-select form-select-sm" value={overlay} onChange={(e) => setOverlay(e.target.value)}>
            <option value="">{tr(lang, 'mapNone')}</option>
            {OVERLAYS.map((o) => (
              <option key={o.id} value={o.id}>{o.label[lang]}</option>
            ))}
          </select>
        </div>
        {overlay && (
          <div className="col-12 col-md-6">
            <label htmlFor="map-op" className="form-label mb-1">{tr(lang, 'mapOpacity')}</label>
            <input id="map-op" type="range" className="form-range" min={0.1} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
          </div>
        )}
      </div>
      <div ref={box} className="map-box rounded border" role="region" aria-label={`${tr(lang, 'navMap')}: ${regionName}`} />
      <p className="small text-body-secondary mt-2 mb-0">
        {IMAGERY.label[lang]} · {regionName} · {months[month - 1]} {year}. {tr(lang, 'mapHint')}
      </p>
    </div>
  );
}