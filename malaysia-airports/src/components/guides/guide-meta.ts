/**
 * Presentation metadata for the guides: icons, hub groups, related guides and which airport
 * guide-note topics belong to each guide. Client-safe: no content is imported, only types.
 */
import type { GuideScope } from './guide-scopes';
import type { GuideNoteTopic } from '@/content/types';
import type { TKey } from '@/lib/i18n/translate';
import type { IconKey } from '@/components/ui/icon';
import type { ImageId } from '@/content/images';

/** Icon per guide slug; unknown slugs fall back to the generic guide icon. */
export const GUIDE_ICONS: Readonly<Record<string, IconKey>> = {
  departing: 'plane-takeoff',
  arriving: 'plane-landing',
  'check-in': 'ticket-check',
  security: 'scan-line',
  'immigration-customs': 'id-card',
  baggage: 'luggage',
  families: 'baby',
  'first-time': 'compass',
  'reduced-mobility': 'accessibility',
  neurodivergent: 'leaf',
  'older-travellers': 'hand-helping',
};

export function guideIcon(slug: string): IconKey {
  return GUIDE_ICONS[slug] ?? 'file-text';
}

/**
 * Redesign stage two: photographs from the library for guides about travel itself, where a
 * picture is truthful. Each shows what its alt text says (a KLIA gate area, the outside of a
 * KLIA terminal, the KLIA Ekspres, a window seat over Malaysia) and is never presented as another
 * airport. Procedural guides (security, baggage, borders, care) have no truthful photograph in the
 * library and keep their line icon.
 */
export const GUIDE_IMAGES: Readonly<Partial<Record<string, ImageId>>> = {
  'first-time': 'wing-window',
  departing: 'klia-t1-roof',
  arriving: 'klia-ekspres',
};

/** The guides hub's header photograph: the timber-lined roof over the C gates at KLIA Terminal 1. */
export const GUIDES_HUB_IMAGE: ImageId = 'klia-t1-canopy';

export type GuideGroupId = 'before' | 'borders' | 'care';

/** Hub groups in display order. Guides not listed land in the last group. */
export const GUIDE_GROUPS: readonly { id: GuideGroupId; slugs: readonly string[] }[] = [
  { id: 'before', slugs: ['first-time', 'departing', 'check-in', 'security', 'baggage'] },
  { id: 'borders', slugs: ['immigration-customs', 'arriving'] },
  { id: 'care', slugs: ['families', 'reduced-mobility', 'neurodivergent', 'older-travellers'] },
];

/** The guide flagged "Start here" on the hub. */
export const START_HERE_GUIDE = 'first-time';

/** Airport guide-note topics shown under "At specific airports" on each guide. */
export const GUIDE_NOTE_TOPICS: Readonly<Record<string, readonly GuideNoteTopic[]>> = {
  departing: ['getting-there', 'check-in', 'immigration', 'gate'],
  arriving: ['landing', 'immigration', 'baggage', 'onward-transport', 'meeting'],
  'check-in': ['check-in'],
  security: ['security'],
  'immigration-customs': ['landing', 'immigration', 'customs'],
  baggage: ['baggage'],
  'first-time': ['terminal', 'immigration'],
  'reduced-mobility': ['assistance'],
  neurodivergent: ['assistance'],
  'older-travellers': ['assistance'],
};

/** Guides about one direction of travel show only that direction's airport notes (D-07). */
export const GUIDE_NOTE_DIRECTION: Readonly<Record<string, 'departing' | 'arriving'>> = {
  departing: 'departing',
  'first-time': 'departing',
  arriving: 'arriving',
};

/** Related guides, in order. */
export const RELATED_GUIDES: Readonly<Record<string, readonly string[]>> = {
  departing: ['check-in', 'security', 'baggage'],
  arriving: ['immigration-customs', 'baggage', 'first-time'],
  'check-in': ['security', 'baggage', 'departing'],
  security: ['check-in', 'baggage', 'families'],
  'immigration-customs': ['arriving', 'first-time', 'departing'],
  baggage: ['check-in', 'security', 'arriving'],
  families: ['security', 'neurodivergent', 'departing'],
  'first-time': ['check-in', 'security', 'immigration-customs'],
  'reduced-mobility': ['older-travellers', 'neurodivergent', 'departing'],
  neurodivergent: ['families', 'reduced-mobility', 'security'],
  'older-travellers': ['reduced-mobility', 'baggage', 'departing'],
};

export const SCOPE_LABEL_KEYS: Readonly<Record<GuideScope, TKey>> = {
  domestic: 'guidePages.scopes.domestic',
  international: 'guidePages.scopes.international',
  'sabah-sarawak': 'guidePages.scopes.sabahSarawak',
};

export const SCOPE_ICONS: Readonly<Record<GuideScope, IconKey>> = {
  domestic: 'route',
  international: 'globe',
  'sabah-sarawak': 'map',
};
