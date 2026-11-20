'use client';

import { useId } from 'react';
import { getAirport } from '@/content/airports';
import { useSavedJourney } from '@/lib/hooks/use-saved-journey';
import { useT } from '@/lib/i18n/client';
import type { TKey } from '@/lib/i18n/translate';
import type { SavedPlace } from '@/lib/stores';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon, type IconName } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';

const TYPES: Record<SavedPlace['type'], { labelKey: TKey; icon: IconName }> = {
  facility: { labelKey: 'flightPages.journey.places.types.facility', icon: 'info' },
  outlet: { labelKey: 'flightPages.journey.places.types.outlet', icon: 'shopping-bag' },
  'car-park': { labelKey: 'flightPages.journey.places.types.carPark', icon: 'square-parking' },
  transport: { labelKey: 'flightPages.journey.places.types.transport', icon: 'bus-front' },
  'map-point': { labelKey: 'flightPages.journey.places.types.mapPoint', icon: 'map-pin' },
};

/** Places saved from maps and directories, with a link back and a remove button for each. */
export function SavedPlaces() {
  const t = useT();
  const id = useId();
  const { journey, removePlace } = useSavedJourney();
  const places = journey.places;

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-xl border border-line-strong bg-surface p-5 sm:p-6">
      <h2 id={`${id}-title`} className="type-title-lg flex items-center gap-2.5 text-ink">
        <Icon name="map-pin" />
        {t('journey.saved.places')}
      </h2>
      {places.length === 0 ? (
        <p className="type-body-sm mt-2 text-ink-2">{t('flightPages.journey.places.empty')}</p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {places.map((place) => {
            const type = TYPES[place.type];
            const airport = getAirport(place.airport);
            return (
              <li key={`${place.type}-${place.id}`} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
                <Icon name={type.icon} className="shrink-0 text-ink-2" />
                <div className="min-w-0 flex-1">
                  <LocaleLink href={place.href} className="link type-body font-semibold text-ink">
                    {place.title}
                  </LocaleLink>
                  <p className="type-caption text-ink-2">
                    {t(type.labelKey)}
                    {airport ? ` · ${airport.shortName}` : ''}
                  </p>
                </div>
                <IconButton icon="x" size="sm" variant="quiet" label={t('flightPages.journey.places.remove', { place: place.title })} onClick={() => removePlace(place.type, place.id)} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
