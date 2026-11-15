import type { Lang, VariableInfo } from '../data/catalog';
import type { RawPoint } from '../domain/series';
import { fmt, tr } from '../i18n';

interface Props {
  raw: RawPoint[];
  v: VariableInfo;
  lang: Lang;
  demo: boolean;
}

const ym = (p: RawPoint) => `${p.year}-${String(p.month).padStart(2, '0')}`;

export function NumericData({ raw, v, lang, demo }: Props) {
  if (raw.length === 0) return null;
  const pts = [...raw].sort((a, b) => a.t - b.t);
  const n = pts.length;
  const d = v.decimals;
  const u = v.unit[lang];
  const unit = u ? ` ${u}` : '';
  const mean = pts.reduce((s, p) => s + p.y, 0) / n;
  const min = pts.reduce((a, p) => (p.y < a.y ? p : a), pts[0]);
  const max = pts.reduce((a, p) => (p.y > a.y ? p : a), pts[0]);
  const first = pts[0];
  const last = pts[n - 1];
  const expected = (last.year - first.year) * 12 + (last.month - first.month) + 1;
  const missing = Math.max(0, expected - n);

  return (
    <div>
      <p className="text-body-secondary">{tr(lang, 'dataIntro')}</p>
      {demo && <div className="alert alert-warning small py-2">{tr(lang, 'dataDemo')}</div>}

      <table className="table table-sm mb-3">
        <tbody>
          <tr><th scope="row" className="w-50">{tr(lang, 'dataN')}</th><td>{n}</td></tr>
          <tr><th scope="row">{tr(lang, 'period')}</th><td>{ym(first)} – {ym(last)}</td></tr>
          <tr><th scope="row">{tr(lang, 'dataMissing')}</th><td>{missing}</td></tr>
          <tr><th scope="row">{tr(lang, 'dataMean')}</th><td>{fmt(mean, d, lang)}{unit}</td></tr>
          <tr><th scope="row">{tr(lang, 'dataMin')}</th><td>{fmt(min.y, d, lang)}{unit} ({ym(min)})</td></tr>
          <tr><th scope="row">{tr(lang, 'dataMax')}</th><td>{fmt(max.y, d, lang)}{unit} ({ym(max)})</td></tr>
          <tr><th scope="row">{tr(lang, 'dataLast')}</th><td>{fmt(last.y, d, lang)}{unit} ({ym(last)})</td></tr>
        </tbody>
      </table>

      <div className="table-responsive border rounded" style={{ maxHeight: 360 }}>
        <table className="table table-sm table-striped mb-0">
          <thead className="sticky-top" style={{ background: 'var(--bs-body-bg)' }}>
            <tr>
              <th scope="col">{tr(lang, 'dataDate')}</th>
              <th scope="col" className="text-end">{tr(lang, 'dataValue')}{unit ? ` (${u})` : ''}</th>
            </tr>
          </thead>
          <tbody>
            {pts.map((p) => (
              <tr key={ym(p)}>
                <td>{ym(p)}</td>
                <td className="text-end">{fmt(p.y, d, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
