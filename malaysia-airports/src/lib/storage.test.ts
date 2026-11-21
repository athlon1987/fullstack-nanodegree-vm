import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { memoryStorage } from '@/lib/testing/fixtures';
import { DEFAULT_PREFERENCES, PREFERENCES_INIT_SCRIPT, PREFERENCES_STORAGE_KEY, PreferencesSchema, preferenceAttributes, type Preferences } from './preferences';
import { check, createStore, storageKey, validator } from './storage';
import { EMPTY_SAVED_JOURNEY, SAME_SITE_PATH, SavedJourneySchema, airportStore, journeyModeStore, preferencesStore, savedJourneyStore } from './stores';
import { getServerNow, getTicker } from './time-store';

const schema = z.object({ count: z.number().int().min(0), label: z.string().optional() });
type Value = z.infer<typeof schema>;
const DEFAULT: Value = { count: 0 };

describe('createStore', () => {
  it('uses namespaced, versioned keys', () => {
    expect(storageKey('airport', 1)).toBe('ma:airport:v1');
    expect(createStore({ name: 'thing', version: 3, schema, defaultValue: DEFAULT, storage: null }).key).toBe('ma:thing:v3');
  });

  it('returns the default until something valid is stored, then persists as JSON', () => {
    const storage = memoryStorage();
    const store = createStore({ name: 'test', version: 1, schema, defaultValue: DEFAULT, storage });
    expect(store.get()).toBe(DEFAULT);
    store.set({ count: 2 });
    expect(store.get()).toEqual({ count: 2 });
    expect(storage.data.get('ma:test:v1')).toBe('{"count":2}');
    store.set((current) => ({ ...current, count: current.count + 1, label: 'x' }));
    expect(store.get()).toEqual({ count: 3, label: 'x' });
  });

  it('keeps the same reference until the value changes, as useSyncExternalStore requires', () => {
    const store = createStore({ name: 'test', version: 1, schema, defaultValue: DEFAULT, storage: memoryStorage({ 'ma:test:v1': '{"count":5}' }) });
    const first = store.getSnapshot();
    expect(first).toEqual({ count: 5 });
    expect(store.getSnapshot()).toBe(first);
    expect(store.getServerSnapshot()).toBe(DEFAULT);
  });

  it('falls back to the default for corrupt or invalid stored data', () => {
    expect(createStore({ name: 'test', version: 1, schema, defaultValue: DEFAULT, storage: memoryStorage({ 'ma:test:v1': '{not json' }) }).get()).toBe(DEFAULT);
    expect(createStore({ name: 'test', version: 1, schema, defaultValue: DEFAULT, storage: memoryStorage({ 'ma:test:v1': '{"count":-4}' }) }).get()).toBe(DEFAULT);
  });

  it('ignores data written by an older version of the store', () => {
    const storage = memoryStorage({ 'ma:test:v1': '{"count":9}' });
    expect(createStore({ name: 'test', version: 2, schema, defaultValue: DEFAULT, storage }).get()).toBe(DEFAULT);
  });

  it('rejects invalid writes', () => {
    const storage = memoryStorage();
    const store = createStore({ name: 'test', version: 1, schema, defaultValue: DEFAULT, storage });
    store.set({ count: -1 });
    expect(store.get()).toBe(DEFAULT);
    expect(storage.data.size).toBe(0);
  });

  it('notifies subscribers on set and clear, and stops after unsubscribe', () => {
    const storage = memoryStorage();
    const store = createStore({ name: 'test', version: 1, schema, defaultValue: DEFAULT, storage });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.set({ count: 1 });
    store.clear();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.get()).toBe(DEFAULT);
    expect(storage.data.has('ma:test:v1')).toBe(false);
    unsubscribe();
    store.set({ count: 2 });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps working in memory when storage is missing or throws', () => {
    const memoryOnly = createStore({ name: 'test', version: 1, schema, defaultValue: DEFAULT, storage: null });
    memoryOnly.set({ count: 7 });
    expect(memoryOnly.get()).toEqual({ count: 7 });

    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const store = createStore({ name: 'test', version: 1, schema, defaultValue: DEFAULT, storage: broken });
    expect(store.get()).toBe(DEFAULT);
    store.set({ count: 4 });
    expect(store.get()).toEqual({ count: 4 });
    expect(() => store.clear()).not.toThrow();
  });
});

describe('app stores', () => {
  it('start from safe defaults: no airport assumed, no mode chosen, nothing saved', () => {
    expect(airportStore.getServerSnapshot()).toBeNull();
    expect(journeyModeStore.getServerSnapshot()).toBeNull();
    expect(savedJourneyStore.getServerSnapshot()).toBe(EMPTY_SAVED_JOURNEY);
    expect(preferencesStore.getServerSnapshot()).toBe(DEFAULT_PREFERENCES);
    expect(airportStore.key).toBe('ma:airport:v1');
  });

  it('validate what is written', () => {
    airportStore.set({ airport: 'kul', terminal: 'T2' });
    expect(airportStore.get()).toEqual({ airport: 'kul', terminal: 'T2' });
    airportStore.set({ airport: 'NOT-A-SLUG' });
    expect(airportStore.get()).toEqual({ airport: 'kul', terminal: 'T2' });
    airportStore.clear();
    expect(airportStore.get()).toBeNull();

    savedJourneyStore.set({ ...EMPTY_SAVED_JOURNEY, parkedCar: { carParkId: 'kul-t1-car-park', level: '2', zone: 'B', savedAt: '2026-11-17T08:00:00.000Z' } });
    expect(savedJourneyStore.get().parkedCar?.zone).toBe('B');
    savedJourneyStore.clear();
  });

  it('drop tampered saved places but keep the rest of the journey (security-09)', () => {
    const storage = memoryStorage();
    const place = (href: string, id = href) => ({ id, type: 'facility', airport: 'kul', title: 'Prayer room', href, savedAt: '2026-11-17T08:00:00.000Z' });
    const flight = { id: 'mh2610-20261117-d', airport: 'kul', number: 'MH2610', direction: 'd', date: '2026-11-17', savedAt: '2026-11-17T08:00:00.000Z' };
    storage.setItem(
      savedJourneyStore.key,
      JSON.stringify({
        flights: [flight, { id: 'x' }],
        places: [place('/kul/facilities/prayer'), place('https://evil.example/login'), place('//evil.example/x'), place('/\\evil.example'), place('data:text/html,<b>x</b>'), place('javascript:alert(1)')],
        parkedCar: null,
      }),
    );
    const store = createStore({ name: 'journey', version: 1, schema: SavedJourneySchema, defaultValue: EMPTY_SAVED_JOURNEY, storage });
    expect(store.get().places.map((entry) => entry.href)).toEqual(['/kul/facilities/prayer']);
    expect(store.get().flights).toEqual([flight]);
    expect(SAME_SITE_PATH.test('/ms/kul')).toBe(true);
  });

  it('validate without zod (performance-08): unknown keys are dropped, optional keys stay absent', () => {
    expect(PreferencesSchema.safeParse({ theme: 'dark', textSize: 125, highContrast: true, reducedMotion: false, extra: 1 })).toEqual({
      success: true,
      data: { theme: 'dark', textSize: 125, highContrast: true, reducedMotion: false },
    });
    expect(PreferencesSchema.safeParse({ theme: 'dark', textSize: 110, highContrast: true, reducedMotion: false }).success).toBe(false);
    const rule = validator(check.object({ a: check.string({ max: 2 }), b: check.optional(check.boolean()) }));
    expect(rule.safeParse({ a: 'ok' })).toEqual({ success: true, data: { a: 'ok' } });
    expect(rule.safeParse({ a: 'too long' }).success).toBe(false);
    expect(rule.safeParse([]).success).toBe(false);
  });
});

describe('preferences', () => {
  it('maps preferences to html attributes, resolving the system theme', () => {
    expect(preferenceAttributes(DEFAULT_PREFERENCES, false)).toEqual({
      'data-theme': 'light',
      'data-theme-choice': 'system',
      'data-text-size': '100',
      'data-contrast': 'normal',
      'data-motion': 'normal',
    });
    expect(preferenceAttributes(DEFAULT_PREFERENCES, true)['data-theme']).toBe('dark');
    expect(preferenceAttributes({ theme: 'light', textSize: 125, highContrast: true, reducedMotion: true }, true)).toEqual({
      'data-theme': 'light',
      'data-theme-choice': 'light',
      'data-text-size': '125',
      'data-contrast': 'more',
      'data-motion': 'reduce',
    });
  });

  /** Run the inline script against a fake document and return the attributes it sets. */
  function runInitScript(stored: string | null, systemDark: boolean): Record<string, string> {
    const attributes: Record<string, string> = {};
    const fakeDocument = { documentElement: { setAttribute: (name: string, value: string) => (attributes[name] = value) } };
    const fakeStorage = { getItem: (key: string) => (key === PREFERENCES_STORAGE_KEY ? stored : null) };
    const fakeMatchMedia = () => ({ matches: systemDark });
    new Function('document', 'localStorage', 'matchMedia', PREFERENCES_INIT_SCRIPT)(fakeDocument, fakeStorage, fakeMatchMedia);
    return attributes;
  }

  it('applies stored preferences before hydration exactly as the hook does afterwards', () => {
    const cases: Preferences[] = [
      DEFAULT_PREFERENCES,
      { theme: 'dark', textSize: 112, highContrast: false, reducedMotion: true },
      { theme: 'light', textSize: 125, highContrast: true, reducedMotion: false },
    ];
    for (const preferences of cases) {
      for (const systemDark of [false, true]) {
        expect(runInitScript(JSON.stringify(preferences), systemDark)).toEqual(preferenceAttributes(preferences, systemDark));
      }
    }
  });

  it('survives missing, corrupt or tampered storage', () => {
    expect(runInitScript(null, true)).toEqual(preferenceAttributes(DEFAULT_PREFERENCES, true));
    expect(runInitScript('{broken', false)).toEqual(preferenceAttributes(DEFAULT_PREFERENCES, false));
    expect(runInitScript('{"theme":"neon","textSize":900}', false)).toEqual(preferenceAttributes(DEFAULT_PREFERENCES, false));
    expect(PREFERENCES_INIT_SCRIPT).toContain('ma:preferences:v1');
    expect(PREFERENCES_INIT_SCRIPT).not.toContain('<');
  });
});

describe('shared clock', () => {
  afterEach(() => vi.useRealTimers());

  it('is null on the server and before anything subscribes', () => {
    expect(getServerNow()).toBeNull();
    expect(getTicker(45_000).getSnapshot()).toBeNull();
  });

  it('ticks while subscribed and forgets the time afterwards', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-17T06:30:00Z'));
    const ticker = getTicker(30_000);
    const listener = vi.fn();
    const unsubscribe = ticker.subscribe(listener);
    expect(ticker.getSnapshot()).toBe(Date.parse('2026-11-17T06:30:00Z'));
    vi.advanceTimersByTime(60_000);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(ticker.getSnapshot()).toBe(Date.parse('2026-11-17T06:31:00Z'));
    unsubscribe();
    expect(ticker.getSnapshot()).toBeNull();
    vi.advanceTimersByTime(60_000);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
