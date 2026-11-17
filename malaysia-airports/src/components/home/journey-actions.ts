/**
 * Quick actions per journey mode: the same six tiles, reordered and renamed for what the visitor
 * is doing. The first action of a mode is the one marked "Start here".
 */
import type { JourneyMode } from '@/lib/journey/modes';
import type { TKey } from '@/lib/i18n/translate';
import type { IconKey } from '@/components/ui/icon';
import type { AirportSectionId } from '@/components/shell/sections';

/** Copy variants in `home.actions.*` of the dictionary. */
export type ActionCopy =
  | 'track'
  | 'trackArrival'
  | 'trackOnward'
  | 'trackTheirs'
  | 'gettingThere'
  | 'leaving'
  | 'connections'
  | 'parking'
  | 'parkingPickUp'
  | 'maps'
  | 'mapsArrival'
  | 'mapsTransit'
  | 'mapsMeeting'
  | 'lounges'
  | 'rest'
  | 'loungesTransit'
  | 'food'
  | 'foodArrival'
  | 'foodWaiting'
  | 'facilities';

/** One quick action: where it goes, its icon, and which wording it uses. */
export interface JourneyAction {
  copy: ActionCopy;
  section: AirportSectionId;
  icon: IconKey;
}

/** Six actions per mode, most useful first. */
export const JOURNEY_ACTIONS: Record<JourneyMode, readonly JourneyAction[]> = {
  departing: [
    { copy: 'track', section: 'flights', icon: 'plane-takeoff' },
    { copy: 'gettingThere', section: 'transport', icon: 'train-front' },
    { copy: 'parking', section: 'parking', icon: 'square-parking' },
    { copy: 'maps', section: 'map', icon: 'map' },
    { copy: 'lounges', section: 'lounges', icon: 'armchair' },
    { copy: 'food', section: 'shop-dine', icon: 'utensils' },
  ],
  arriving: [
    { copy: 'trackArrival', section: 'flights', icon: 'plane-landing' },
    { copy: 'leaving', section: 'transport', icon: 'train-front' },
    { copy: 'mapsArrival', section: 'map', icon: 'map' },
    { copy: 'foodArrival', section: 'shop-dine', icon: 'utensils' },
    { copy: 'parking', section: 'parking', icon: 'square-parking' },
    { copy: 'rest', section: 'lounges', icon: 'bed' },
  ],
  transiting: [
    { copy: 'connections', section: 'transit', icon: 'arrow-left-right' },
    { copy: 'trackOnward', section: 'flights', icon: 'plane-takeoff' },
    { copy: 'mapsTransit', section: 'map', icon: 'map' },
    { copy: 'loungesTransit', section: 'lounges', icon: 'armchair' },
    { copy: 'food', section: 'shop-dine', icon: 'utensils' },
    { copy: 'facilities', section: 'facilities', icon: 'map-pin' },
  ],
  meeting: [
    { copy: 'trackTheirs', section: 'flights', icon: 'plane-landing' },
    { copy: 'parkingPickUp', section: 'parking', icon: 'square-parking' },
    { copy: 'mapsMeeting', section: 'map', icon: 'map' },
    { copy: 'foodWaiting', section: 'shop-dine', icon: 'utensils' },
    { copy: 'gettingThere', section: 'transport', icon: 'train-front' },
    { copy: 'facilities', section: 'facilities', icon: 'map-pin' },
  ],
};

/** Dictionary key of an action's title. */
export const actionTitleKey = (copy: ActionCopy): TKey => `home.actions.${copy}.title`;

/** Dictionary key of an action's one-line hint. */
export const actionHintKey = (copy: ActionCopy): TKey => `home.actions.${copy}.hint`;
