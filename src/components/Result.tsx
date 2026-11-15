import type { Analysis } from '../domain/series';
import type { Lang, VariableInfo } from '../data/catalog';
import { fmt, fmtP, tr } from '../i18n';
import { Chart } from './Chart';

interface Props {
  a: Analysis;
  v: VariableInfo;
  lang: Lang;
}

export function Result({ a, v, lang }: Props) {
  const d = v.decimals;
  const u = v.unit[lang];
  const unit = u ? ` ${u}` : '';
  const up = a.perDecade.value > 0;
  const first = a.series[0].year;
  const last = a.series[a.series.length - 1].year;
  const warn = {
    short: tr(lang, 'warnShort'),
    autocorr: tr(lang, 'warnAutocorr'),
    disagree: tr(lang, 'warnDisagree'),
  };
  const shownWarnings = a.warnings.filter((w) => w !== 'short');
  return (
    <div className="mt-3">
      <div className={`alert ${a.significant ? 'alert-success' : 'alert-secondary'}`} role="status">
        <p className="fs-5 mb-1">
          {up ? '▲' : '▼'} {up ? tr(lang, 'increasing') : tr(lang, 'decreasing')}:{' '}
          <strong>
            {fmt(a.perDecade.value, d, lang, true)}
            {unit} {tr(lang, 'perDecade')}
          </strong>
        </p>
        <p className="mb-1">
          {tr(lang, 'ci')}: [{fmt(a.perDecade.lo, d, lang, true)}, {fmt(a.perDecade.hi, d, lang, true)}]
          {unit} · {fmtP(a.linear.p, lang)}
        </p>
        <p className="mb-0">
          <strong>{a.significant ? tr(lang, 'significant') : tr(lang, 'notSignificant')}.</strong>{' '}
          {a.significant ? tr(lang, 'sigExplain') : tr(lang, 'notSigExplain')}
        </p>
      </div>

      <div className="card mb-3">
        <div className="card-body p-2">
          <Chart
            series={a.series}
            slope={a.linear.slope}
            intercept={a.linear.intercept}
            mode={a.mode}
            unit={a.mode === 'anomalies' ? `Δ ${u}`.trim() : u}
            ariaLabel={`${v.label[lang]}. ${tr(lang, 'chartLabel')}`}
            seriesLabel={tr(lang, 'seriesLabel')}
            trendLabel={tr(lang, 'trendLabel')}
          />
        </div>
      </div>

      {shownWarnings.length > 0 && (
        <div className="alert alert-warning" role="note">
          <strong>{tr(lang, 'warnTitle')}</strong>
          <ul className="mb-0 mt-1">
            {shownWarnings.map((w) => (
              <li key={w}>{warn[w]}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="mb-3">
        <summary className="fw-semibold">{tr(lang, 'stats')}</summary>
        <table className="table table-sm mt-2">
          <tbody>
            <tr><th scope="row" className="w-50">{tr(lang, 'points')}</th><td>{a.linear.n}</td></tr>
            <tr><th scope="row">{tr(lang, 'period')}</th><td>{first}–{last}</td></tr>
            <tr><th scope="row">{tr(lang, 'regression')}</th><td>t = {fmt(a.linear.tStat, 2, lang)} · R² = {fmt(a.linear.r2, 2, lang)} · {fmtP(a.linear.p, lang)}</td></tr>
            <tr><th scope="row">{tr(lang, 'mannKendall')}</th><td>Z = {fmt(a.mk.z, 2, lang)} · τ = {fmt(a.mk.tau, 2, lang)} · {fmtP(a.mk.p, lang)}</td></tr>
            <tr><th scope="row">{tr(lang, 'senSlope')}</th><td>{fmt(a.perDecade.sen, d, lang, true)}{unit} {tr(lang, 'perDecade')}</td></tr>
          </tbody>
        </table>
      </details>

      <div className="small text-body-secondary">
        <strong>{tr(lang, 'limits')}</strong>
        <ul className="mb-0 mt-1">
          <li>{tr(lang, 'limit1')}</li>
          <li>{tr(lang, 'limit2')}</li>
          <li>{tr(lang, 'limit3')}</li>
        </ul>
      </div>
    </div>
  );
}