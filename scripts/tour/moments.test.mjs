import { describe, expect, it } from 'vitest';
import { MAX_TOTAL_SECONDS, MIN_TOTAL_SECONDS, assertTotalInRange, planMoments, resolveMoment } from './moments.mjs';

const scene = (key, mode, duration, tourMoment) => ({ key, mode, duration, tourMoment });
const memes = (count) => Array.from({ length: count }, (_, i) => scene(`m${i}`, 'meme', 12));

describe('tour moments', () => {
  it('centers a default window inside the scene', () => {
    const moment = resolveMoment(scene('a', 'meme', 12), 3.5);
    expect(moment.length).toBe(3.5);
    expect(moment.from).toBeGreaterThanOrEqual(0);
    expect(moment.from + moment.length).toBeLessThanOrEqual(12);
  });

  it('centers the window on an explicit instant', () => {
    expect(resolveMoment(scene('a', 'meme', 12, 6), 4)).toEqual({ from: 4, length: 4 });
  });

  it('clamps an instant near the end of the scene', () => {
    const moment = resolveMoment(scene('a', 'meme', 12, 12), 4);
    expect(moment.from + moment.length).toBe(12);
  });

  it('centers the window on a range, whatever its length', () => {
    expect(resolveMoment(scene('a', 'original', 28, { from: 12.5, to: 17 }), 4.5)).toEqual({ from: 12.5, length: 4.5 });
    expect(resolveMoment(scene('a', 'meme', 12, { from: 2, to: 10 }), 3)).toEqual({ from: 4.5, length: 3 });
    expect(resolveMoment(scene('a', 'meme', 12, { from: 5, to: 5.5 }), 3)).toEqual({ from: 3.75, length: 3 });
  });

  it('keeps the film inside the duration range for 1 to 10 memes', () => {
    for (let count = 1; count <= 10; count += 1) {
      const { total } = planMoments([scene('o', 'original', 28), ...memes(count)]);
      expect(total, `${count} memes`).toBeGreaterThanOrEqual(MIN_TOTAL_SECONDS - 1e-6);
      expect(total, `${count} memes`).toBeLessThanOrEqual(MAX_TOTAL_SECONDS + 1e-6);
    }
  });

  it('rejects a catalog that cannot fit the range', () => {
    expect(() => assertTotalInRange(planMoments([scene('o', 'original', 28), ...memes(11)]).total)).toThrow(/outside/);
  });
});
