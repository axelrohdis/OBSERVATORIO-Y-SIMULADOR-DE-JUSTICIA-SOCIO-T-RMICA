import { describe, expect, it } from 'vitest';
import { ranks, spearman, vulnerabilityIndex, zscores } from './spatial';

describe('spatial', () => {
  it('ranks promedia empates', () => {
    expect(ranks([10, 20, 20, 30])).toEqual([1, 2.5, 2.5, 4]);
  });
  it('spearman: relación monótona perfecta', () => {
    const r = spearman([1, 2, 3, 4, 5, 6], [2, 4, 8, 16, 32, 64]);
    expect(r.rho).toBeCloseTo(1, 10);
    expect(r.p).toBe(0);
  });
  it('spearman: coincide con scipy (rho=0,51858, p=0,003326, n=30)', () => {
    const x = Array.from({ length: 30 }, (_, i) => i + 1);
    const y = x.map((v, i) => v + (i % 2 === 0 ? 12 : -12));
    const r = spearman(x, y);
    expect(r.rho).toBeCloseTo(0.5185762, 6);
    expect(r.p).toBeCloseTo(0.0033259, 6);
    expect(r.n).toBe(30);
  });
  it('zscores: media 0 y desviación 1', () => {
    const z = zscores([1, 2, 3, 4, 5]);
    expect(z.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 10);
    expect(z[4]).toBeGreaterThan(z[0]);
  });
  it('índice: más calor y menor ISMT → mayor vulnerabilidad', () => {
    const idx = vulnerabilityIndex([0.8, 0.5, 0.6], [11, 15, 13]);
    expect(idx[1]).toBeGreaterThan(idx[2]);
    expect(idx[2]).toBeGreaterThan(idx[0]);
  });
});
