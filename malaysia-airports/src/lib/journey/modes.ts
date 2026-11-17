/**
 * Journey modes. Kept in its own tiny module so that client stores and hooks can use the list
 * without importing the whole journey builder.
 */

/** The four ways someone uses an airport. */
export const JOURNEY_MODES = ['departing', 'arriving', 'transiting', 'meeting'] as const;

/** A journey mode: it reorders quick actions and content blocks wherever it appears. */
export type JourneyMode = (typeof JOURNEY_MODES)[number];

/** The mode assumed for ordering content when the user has not picked one. */
export const DEFAULT_JOURNEY_MODE: JourneyMode = 'departing';

/** Type guard for stored values and URL params. */
export function isJourneyMode(value: unknown): value is JourneyMode {
  return typeof value === 'string' && (JOURNEY_MODES as readonly string[]).includes(value);
}
