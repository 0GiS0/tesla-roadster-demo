import { describe, expect, it } from 'vitest';
import { MAX_TOTAL_SECONDS, MIN_MEME_SECONDS, planMoments, resolveMoment } from './moments.mjs';

const scene = (key, mode, duration, tourMoment) => ({ key, mode, duration, tourMoment });

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

  it('uses a range and trims it to the budget', () => {
    expect(resolveMoment(scene('a', 'original', 28, { from: 12.5, to: 17 }), 4.5)).toEqual({ from: 12.5, length: 4.5 });
    expect(resolveMoment(scene('a', 'meme', 12, { from: 2, to: 10 }), 3).length).toBe(3);
  });

  it('keeps the film short as memes are added', () => {
    const memes = Array.from({ length: 4 }, (_, i) => scene(`m${i}`, 'meme', 12));
    const plan = planMoments([scene('o', 'original', 28), ...memes]);
    const total = plan.reduce((sum, entry) => sum + entry.moment.length, 0);
    expect(total).toBeLessThanOrEqual(MAX_TOTAL_SECONDS + 1e-6);
    expect(plan.every((entry) => entry.moment.length >= MIN_MEME_SECONDS)).toBe(true);
  });
});
