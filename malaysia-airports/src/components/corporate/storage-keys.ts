import { storageKey } from '@/lib/storage';
import { airportStore, journeyModeStore, preferencesStore, savedJourneyStore } from '@/lib/stores';
import type { TKey } from '@/lib/i18n/translate';

/** Where an entry lives in the browser. */
export type StorageArea = 'local' | 'session' | 'cookie';

export interface DeviceKey {
  /** The key exactly as the browser shows it. */
  key: string;
  area: StorageArea;
  /** What it holds, in plain words. */
  label: TKey;
}

/** Every entry this site writes in the browser. Owners: domain (core stores), search, flights, concierge, shell (cookie). */
export const DEVICE_KEYS: readonly DeviceKey[] = [
  { key: preferencesStore.key, area: 'local', label: 'corporatePages.privacy.stored.keys.preferences' },
  { key: airportStore.key, area: 'local', label: 'corporatePages.privacy.stored.keys.airport' },
  { key: journeyModeStore.key, area: 'local', label: 'corporatePages.privacy.stored.keys.journeyMode' },
  { key: savedJourneyStore.key, area: 'local', label: 'corporatePages.privacy.stored.keys.journey' },
  { key: storageKey('recent-searches', 1), area: 'local', label: 'corporatePages.privacy.stored.keys.recentSearches' },
  { key: storageKey('flight-alerts', 1), area: 'local', label: 'corporatePages.privacy.stored.keys.flightAlerts' },
  { key: storageKey('concierge-consent', 1), area: 'local', label: 'corporatePages.privacy.stored.keys.conciergeConsent' },
  { key: storageKey('concierge-conversation', 1), area: 'session', label: 'corporatePages.privacy.stored.keys.conciergeConversation' },
  // Round 2 (E-17): the measurement switch (`measurementStore` in components/platform/analytics.ts).
  { key: storageKey('measurement', 1), area: 'local', label: 'corporatePages.privacy.stored.keys.measurement' },
  { key: 'lang', area: 'cookie', label: 'corporatePages.privacy.stored.keys.lang' },
];

/** Prefix of every storage key this site writes. */
export const STORAGE_KEY_PREFIX = 'ma:';
/** The language cookie set by the language switch. */
export const LANG_COOKIE = 'lang';
