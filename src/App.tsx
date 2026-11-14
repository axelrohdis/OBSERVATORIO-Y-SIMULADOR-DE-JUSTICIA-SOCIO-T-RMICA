import { useEffect, useMemo, useState } from 'react';
import { EXAMPLES, Lang, REGIONS, VARIABLES } from './data/catalog';
import { DatasetEntry, dataUrl, fetchManifest, fetchSeries } from './data/load';
import { analyze, Mode, RawPoint } from './domain/series';
import { tr } from './i18n';
import { Navbar } from './components/Navbar';
import { Result } from './components/Result';
import { MapView } from './components/MapView';

interface State {
  v: string;
  r: string;
  m: Mode;
  l: Lang;
}

function readHash(): State {
  const p = new URLSearchParams(location.hash.slice(1));
  const l = (p.get('l') ?? (navigator.language.startsWith('es') ? 'es' : 'en')) as Lang;
  return {
    v: p.get('v') ?? 'lst',
    r: p.get('r') ?? 'concepcion_urbano',
    m: p.get('m') === 'anomalies' ? 'anomalies' : 'annual',
    l: l === 'es' ? 'es' : 'en',
  };
}

export default function App() {
  const [s, setS] = useState<State>(readHash);
  const [manifest, setManifest] = useState<DatasetEntry[] | null>(null);
  const [raw, setRaw] = useState<RawPoint[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [copied, setCopied] = useState(false);
  const lang = s.l;

  useEffect(() => {
    fetchManifest().then(setManifest).catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = tr(lang, 'title');
    history.replaceState(null, '', `#v=${s.v}&r=${s.r}&m=${s.m}&l=${s.l}`);
  }, [s, lang]);

  const regionsFor = (v: string) => new Set((manifest ?? []).filter((d) => d.variable === v).map((d) => d.region));
  const available = manifest ? regionsFor(s.v) : new Set<string>();

  // Si la región elegida no existe para la variable, saltar a la primera disponible.
  useEffect(() => {
    if (manifest && !available.has(s.r)) {
      const first = [...available][0];
      if (first) setS((p) => ({ ...p, r: first }));
    }
  }, [manifest, s.v]); // eslint-disable-line react-hooks/exhaustive-deps

  const entry = manifest?.find((d) => d.variable === s.v && d.region === s.r);

  useEffect(() => {
    if (!entry) return;
    let alive = true;
    setStatus('loading');
    fetchSeries(entry.file)
      .then((pts) => alive && (setRaw(pts), setStatus('ok')))
      .catch(() => alive && setStatus('error'));
    return () => {
      alive = false;
    };
  }, [entry?.file]); // eslint-disable-line react-hooks/exhaustive-deps

  const analysis = useMemo(() => {
    if (!raw || status !== 'ok') return null;
    try {
      return analyze(raw, s.m);
    } catch {
      return null;
    }
  }, [raw, status, s.m]);

  const variable = VARIABLES.find((x) => x.id === s.v)!;
  const anyDemo = (manifest ?? []).some((d) => d.demo);
  const set = (patch: Partial<State>) => setS((p) => ({ ...p, ...patch }));

  const copy = () => {
    navigator.clipboard?.writeText(location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <>
      {anyDemo && (
        <div className="demo" role="alert">
          {tr(lang, 'demoBanner')}
        </div>
      )}

      <Navbar lang={lang} onToggleLang={() => set({ l: lang === 'es' ? 'en' : 'es' })} />

      <main className="container pb-5">
        <header className="py-4">
          <p className="tagline lead text-body-secondary mb-0">{tr(lang, 'tagline')}</p>
        </header>

        <section id="ejemplos" aria-label={tr(lang, 'examples')}>
          <h2>{tr(lang, 'examples')}</h2>
          <div className="d-flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <button
                key={e.v + e.r}
                type="button"
                className="btn btn-outline-primary rounded-pill"
                onClick={() => set({ v: e.v, r: e.r })}
              >
                {e.label[lang]}
              </button>
            ))}
          </div>
        </section>
        <section id="mapa">
          <h2>{tr(lang, 'mapTitle')}</h2>
          <MapView lang={lang} region={s.r} onPickRegion={(r) => set({ r })} />
        </section>
        <section id="variable">
          <h2>{tr(lang, 'step1')}</h2>
          <div className="row g-3">
            {VARIABLES.map((x) => (
              <div className="col-12 col-md-6 col-lg-4" key={x.id}>
                <button
                  type="button"
                  className={`pick w-100 h-100 ${x.id === s.v ? 'on' : ''}`}
                  aria-pressed={x.id === s.v}
                  onClick={() => set({ v: x.id })}
                >
                  <strong>{x.label[lang]}</strong>
                  <span>{x.simple[lang]}</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        <section id="region">
          <h2>{tr(lang, 'step2')}</h2>
          <div className="row g-3">
            {REGIONS.map((x) => {
              const ok = available.has(x.id);
              return (
                <div className="col-6 col-lg-3" key={x.id}>
                  <button
                    type="button"
                    className={`pick w-100 h-100 ${x.id === s.r ? 'on' : ''}`}
                    aria-pressed={x.id === s.r}
                    disabled={!ok}
                    onClick={() => set({ r: x.id })}
                  >
                    <strong>{x.label[lang]}</strong>
                    <span>{x.blurb[lang]}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section id="resultado">
          <h2>{tr(lang, 'step3')}</h2>
          <p className="mb-1">
            <strong>{variable.label[lang]}.</strong> {variable.simple[lang]}
          </p>
          <p className="small text-body-secondary mb-2">
            {tr(lang, 'source')}: {variable.source[lang]}
            {variable.kind === 'model' ? ` · ${tr(lang, 'modelNote')}` : ''}
          </p>
          {variable.note && <div className="alert alert-info small py-2">{variable.note[lang]}</div>}

          <fieldset className="mb-3">
            <legend className="fs-6 fw-semibold">{tr(lang, 'mode')}</legend>
            {(['annual', 'anomalies'] as Mode[]).map((m) => (
              <div className="form-check" key={m}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="mode"
                  id={`mode-${m}`}
                  checked={s.m === m}
                  onChange={() => set({ m })}
                />
                <label className="form-check-label" htmlFor={`mode-${m}`}>
                  <strong>{tr(lang, m === 'annual' ? 'modeAnnual' : 'modeAnomalies')}</strong>
                  <small className="d-block text-body-secondary">
                    {tr(lang, m === 'annual' ? 'modeAnnualHelp' : 'modeAnomaliesHelp')}
                  </small>
                </label>
              </div>
            ))}
          </fieldset>

          {!manifest && status !== 'error' && <p className="text-body-secondary">{tr(lang, 'loading')}</p>}
          {status === 'error' && <div className="alert alert-danger" role="alert">{tr(lang, 'error')}</div>}
          {manifest && !entry && <div className="alert alert-secondary">{tr(lang, 'noData')}</div>}
          {status === 'loading' && entry && <p className="text-body-secondary">{tr(lang, 'loading')}</p>}
          {analysis && <Result a={analysis} v={variable} lang={lang} />}

          <div className="d-flex flex-wrap gap-2 mt-3">
            {entry && (
              <a className="btn btn-outline-primary" href={dataUrl(entry.file)} download>
                {tr(lang, 'download')}
              </a>
            )}
            <button type="button" className="btn btn-outline-primary" onClick={copy}>
              {copied ? tr(lang, 'copied') : tr(lang, 'copyLink')}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}