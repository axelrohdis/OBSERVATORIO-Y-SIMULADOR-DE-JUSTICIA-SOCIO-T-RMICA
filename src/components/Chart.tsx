import { useLayoutEffect, useRef, useState } from 'react';
import type { Mode, RawPoint } from '../domain/series';

interface Props {
  series: RawPoint[];
  slope: number;
  intercept: number;
  mode: Mode;
  unit: string;
  ariaLabel: string;
  seriesLabel: string;
  trendLabel: string;
}

const M = { top: 16, right: 16, bottom: 36, left: 56 };

function niceTicks(min: number, max: number, count = 5): number[] {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

export function Chart({ series, slope, intercept, mode, unit, ariaLabel, seriesLabel, trendLabel }: Props) {
  // Medimos el ancho real del contenedor para que los textos del SVG no se encojan en el móvil.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(800);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setW(Math.max(280, Math.round(el.clientWidth)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = Math.round(Math.min(360, Math.max(240, W * 0.45)));

  const t0 = series[0].t;
  const t1 = series[series.length - 1].t;
  const ys = series.map((p) => p.y);
  const trendY = [intercept + slope * t0, intercept + slope * t1];
  const lo = Math.min(...ys, ...trendY);
  const hi = Math.max(...ys, ...trendY);
  const pad = (hi - lo || 1) * 0.08;
  const ymin = lo - pad;
  const ymax = hi + pad;
  const xmin = Math.floor(t0);
  const xmax = Math.ceil(t1);
  const x = (t: number) => M.left + ((t - xmin) / (xmax - xmin || 1)) * (W - M.left - M.right);
  const y = (v: number) => H - M.bottom - ((v - ymin) / (ymax - ymin)) * (H - M.top - M.bottom);
  const path = series.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.y).toFixed(1)}`).join('');
  const yTicks = niceTicks(ymin, ymax);
  const xStep = xmax - xmin > 20 ? 5 : 2;
  const xTicks: number[] = [];
  for (let v = Math.ceil(xmin / xStep) * xStep; v <= xmax; v += xStep) xTicks.push(v);

  return (
    <div ref={box} className="overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="chart">
        {yTicks.map((v) => (
          <g key={v}>
            <line className="grid" x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} />
            <text className="tick" x={M.left - 8} y={y(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text key={v} className="tick" x={x(v)} y={H - M.bottom + 18} textAnchor="middle">
            {v}
          </text>
        ))}
        <text className="tick" x={4} y={12}>
          {unit}
        </text>
        <path className="series" d={path} />
        {mode === 'annual' &&
          series.map((p) => <circle key={p.t} className="dot" cx={x(p.t)} cy={y(p.y)} r={3.5} />)}
        <line className="trend" x1={x(t0)} y1={y(trendY[0])} x2={x(t1)} y2={y(trendY[1])} />
        <g transform={`translate(${M.left + 8},${M.top + 8})`} className="legend">
          <line className="series" x1={0} x2={22} y1={0} y2={0} />
          <text x={28} y={4}>{seriesLabel}</text>
          <line className="trend" x1={0} x2={22} y1={18} y2={18} />
          <text x={28} y={22}>{trendLabel}</text>
        </g>
      </svg>
    </div>
  );
}