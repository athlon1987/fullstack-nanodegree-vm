/**
 * "Applies to" scopes for guide steps: domestic flights, international flights, and the Sabah and
 * Sarawak rules for domestic journeys from Peninsular Malaysia. Client-safe (types only).
 *
 * The guide schema has no per-step scope, so scopes live here, keyed `<guide slug>/<step id>`.
 * A step that is not listed applies to every traveller.
 */
import type { Guide } from '@/content/types';

/** Who a guide step applies to. */
export const GUIDE_SCOPES = ['domestic', 'international', 'sabah-sarawak'] as const;
export type GuideScope = (typeof GUIDE_SCOPES)[number];

const INTL: readonly GuideScope[] = ['international'];
const BORNEO: readonly GuideScope[] = ['domestic', 'sabah-sarawak'];

/** Scopes per step. Unlisted steps apply to everyone. */
export const GUIDE_STEP_SCOPES: Readonly<Record<string, readonly GuideScope[]>> = {
  'arriving/mdac': INTL,
  'arriving/mdac-fake-sites': INTL,
  'arriving/immigration': INTL,
  'arriving/autogates': INTL,
  'arriving/sabah-arrival': BORNEO,
  'arriving/sarawak-arrival': BORNEO,
  'arriving/customs': INTL,
  'check-in/large-liquids': INTL,
  'security/lags-scope': INTL,
  'security/lags-limits': INTL,
  'security/lags-exempt': INTL,
  'security/duty-free': INTL,
  'immigration-customs/mdac': INTL,
  'immigration-customs/documents': INTL,
  'immigration-customs/autogates': INTL,
  'immigration-customs/declare': INTL,
  'immigration-customs/allowances': INTL,
  'immigration-customs/passport-control': INTL,
  'immigration-customs/sabah-arrival': BORNEO,
  'immigration-customs/sabah-slip': BORNEO,
  'immigration-customs/sarawak-arrival': BORNEO,
  'immigration-customs/leaving-sabah-sarawak': BORNEO,
  'immigration-customs/long-stays': BORNEO,
  'baggage/liquids': INTL,
  'families/baby-food': INTL,
  'first-time/pack-liquids': INTL,
  'first-time/passport-control': INTL,
  'first-time/security': INTL,
  'first-time/mdac': INTL,
};

/** The scopes of one step (empty: applies to everyone). */
export function guideStepScopes(slug: string, stepId: string): readonly GuideScope[] {
  return GUIDE_STEP_SCOPES[`${slug}/${stepId}`] ?? [];
}

/** Every scope a guide touches, in `GUIDE_SCOPES` order. */
export function guideScopes(guide: Guide): GuideScope[] {
  const found = new Set<GuideScope>();
  for (const section of guide.sections) for (const step of section.steps) for (const scope of guideStepScopes(guide.slug, step.id)) found.add(scope);
  return GUIDE_SCOPES.filter((scope) => found.has(scope));
}
