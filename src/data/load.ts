import { parseCsv, RawPoint } from '../domain/series';

export interface DatasetEntry {
  variable: string;
  region: string;
  file: string;
  demo: boolean;
}

const url = (p: string) => `${import.meta.env.BASE_URL}data/${p}`;
const cache = new Map<string, Promise<unknown>>();

function memo<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key) as Promise<T>;
}

export const fetchManifest = () =>
  memo('manifest', async () => {
    const r = await fetch(url('manifest.json'));
    if (!r.ok) throw new Error('manifest');
    return ((await r.json()) as { datasets: DatasetEntry[] }).datasets;
  });

export const fetchSeries = (file: string) =>
  memo<RawPoint[]>(file, async () => {
    const r = await fetch(url(file));
    if (!r.ok) throw new Error(file);
    return parseCsv(await r.text());
  });

export const dataUrl = url;
