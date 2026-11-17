import type { Translator } from '@/lib/i18n/translate';
import { EmptyState } from '@/components/common/empty-state';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { Button } from '@/components/ui/button';

export interface MapUnavailableProps {
  t: Translator;
  airportName: string;
  facilitiesHref?: string;
  officialAirportUrl: string;
}

/** An honest empty state for airports without a schematic map: where to look instead. */
export function MapUnavailable({ t, airportName, facilitiesHref, officialAirportUrl }: MapUnavailableProps) {
  return (
    <EmptyState
      icon="map"
      headingLevel={2}
      title={t('mapPages.noneTitle', { airport: airportName })}
      className="mx-auto max-w-narrow py-14"
      action={
        <>
          {facilitiesHref ? (
            <Button asChild iconStart="map-pin">
              <LocaleLink href={facilitiesHref}>{t('mapPages.openFacilities')}</LocaleLink>
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <ExternalLink href={officialAirportUrl} variant="plain">
              {t('mapPages.officialAirportPage')}
            </ExternalLink>
          </Button>
        </>
      }
    >
      <p>{t('mapPages.noneBody')}</p>
      <p className="mt-2">{facilitiesHref ? t('mapPages.nonePointerFacilities') : t('mapPages.nonePointerOfficial')}</p>
    </EmptyState>
  );
}
