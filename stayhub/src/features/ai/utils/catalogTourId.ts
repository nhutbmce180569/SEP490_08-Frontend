/** Synthetic AI catalog IDs: baseId * 10_000 + variantIndex */
const SYNTHETIC_MULTIPLIER = 10_000;

export function resolvePublicTourId(tourId: number): number {
  return tourId >= SYNTHETIC_MULTIPLIER
    ? Math.floor(tourId / SYNTHETIC_MULTIPLIER)
    : tourId;
}
