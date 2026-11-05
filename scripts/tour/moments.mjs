// Resolves which slice of each scene the tour shows, and how long each slice lasts,
// so the film stays short however many memes the catalog has.
export const ORIGINAL_SECONDS = 4.5;
export const MEME_SECONDS = 3.5;
export const MIN_MEME_SECONDS = 1.5;
export const MAX_TOTAL_SECONDS = 15;
const DEFAULT_MOMENT_POSITION = 0.55;

function clampWindow(center, length, duration) {
  const from = Math.min(Math.max(0, center - length / 2), Math.max(0, duration - length));
  return { from, length: Math.min(length, duration) };
}

// `tourMoment` is an instant (centered window) or a { from, to } range (trimmed to the budget).
export function resolveMoment(entry, budget) {
  const { tourMoment, duration } = entry;
  if (typeof tourMoment === 'number') return clampWindow(tourMoment, budget, duration);
  if (tourMoment && typeof tourMoment === 'object') {
    const from = Math.min(Math.max(0, tourMoment.from), duration);
    const to = Math.min(Math.max(from, tourMoment.to), duration);
    return clampWindow((from + to) / 2, Math.min(budget, Math.max(to - from, 0.5)), duration);
  }
  return clampWindow(duration * DEFAULT_MOMENT_POSITION, budget, duration);
}

export function planMoments(catalog) {
  const memes = catalog.filter((entry) => entry.mode === 'meme');
  const originals = catalog.filter((entry) => entry.mode === 'original');
  const originalBudget = originals.length > 0 ? ORIGINAL_SECONDS : 0;
  const memeBudget = memes.length === 0
    ? MEME_SECONDS
    : Math.min(MEME_SECONDS, Math.max(MIN_MEME_SECONDS, (MAX_TOTAL_SECONDS - originalBudget * originals.length) / memes.length));
  return catalog.map((entry) => ({
    ...entry,
    moment: resolveMoment(entry, entry.mode === 'meme' ? memeBudget : ORIGINAL_SECONDS),
  }));
}
