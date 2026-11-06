// Resolves which slice of each scene the tour shows, and how long each slice lasts,
// so the film stays between MIN_TOTAL_SECONDS and MAX_TOTAL_SECONDS.
export const MIN_ORIGINAL_SECONDS = 4.5;
export const MAX_ORIGINAL_SECONDS = 10.5;
export const MEME_SECONDS = 3.5;
export const MIN_MEME_SECONDS = 1;
export const MIN_TOTAL_SECONDS = 10;
export const MAX_TOTAL_SECONDS = 15;
const DEFAULT_MOMENT_POSITION = 0.55;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// The window is always `length` seconds long and centered on the key moment.
export function resolveMoment(entry, length) {
  const { tourMoment, duration } = entry;
  const size = Math.min(length, duration);
  let center = duration * DEFAULT_MOMENT_POSITION;
  if (typeof tourMoment === 'number') center = tourMoment;
  else if (tourMoment && typeof tourMoment === 'object') center = (tourMoment.from + tourMoment.to) / 2;
  return { from: clamp(center - size / 2, 0, duration - size), length: size };
}

export function planMoments(catalog) {
  const memeCount = catalog.filter((entry) => entry.mode === 'meme').length;
  const originalCount = catalog.filter((entry) => entry.mode === 'original').length;
  const memeBudget = memeCount === 0
    ? 0
    : clamp((MAX_TOTAL_SECONDS - MIN_ORIGINAL_SECONDS * originalCount) / memeCount, MIN_MEME_SECONDS, MEME_SECONDS);
  const originalBudget = originalCount === 0
    ? 0
    : clamp((MIN_TOTAL_SECONDS + 0.5 - memeBudget * memeCount) / originalCount, MIN_ORIGINAL_SECONDS, MAX_ORIGINAL_SECONDS);
  const plan = catalog.map((entry) => ({
    ...entry,
    moment: resolveMoment(entry, entry.mode === 'meme' ? memeBudget : originalBudget),
  }));
  const total = plan.reduce((sum, entry) => sum + entry.moment.length, 0);
  return { plan, total };
}

export function assertTotalInRange(total) {
  if (total < MIN_TOTAL_SECONDS - 1e-6 || total > MAX_TOTAL_SECONDS + 1e-6) {
    throw new Error(`the tour would last ${total.toFixed(1)} s, outside ${MIN_TOTAL_SECONDS}-${MAX_TOTAL_SECONDS} s (check the catalog scenes and their tourMoment)`);
  }
}
