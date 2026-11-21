'use client';

import { pick } from '@/content/values';
import type { Lang, RateBand } from '@/content/types';
import type { Translator } from '@/lib/i18n/translate';
import { formatCurrency, formatDuration, formatQualifiedNumber } from '@/lib/format';
import { useT } from '@/lib/i18n/client';
import type { ParkingAvailability } from '@/lib/providers';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { Chip, type ChipTone } from '@/components/ui/chip';
import type { IconKey } from '@/components/ui/icon';
import type { CarParkView } from './parking-types';

const LEVEL_FORM: Record<ParkingAvailability['level'], { tone: ChipTone; icon: IconKey }> = {
  plenty: { tone: 'positive', icon: 'circle-check' },
  filling: { tone: 'info', icon: 'circle-dot' },
  'nearly-full': { tone: 'warning', icon: 'triangle-alert' },
  full: { tone: 'critical', icon: 'circle-x' },
};

/** Simulated space in a car park: level in words with an icon, free bays or percent full, and the demo tag. */
export function AvailabilityValue({ availability }: { availability: ParkingAvailability | null | undefined }) {
  const t = useT();
  if (availability === undefined) return null;
  if (availability === null) {
    return (
      <span className="type-caption inline-flex min-h-chip items-center text-ink-2" aria-hidden="true">
        {t('transportPages.availability.loading')}
      </span>
    );
  }
  const form = LEVEL_FORM[availability.level];
  const detail =
    availability.availableBays !== undefined
      ? t.count('transportPages.availability.freeBays', availability.availableBays)
      : t('transportPages.availability.percentFull', { percent: availability.percentFull });
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Chip tone={form.tone} icon={form.icon}>
        {t(`transportPages.availability.levels.${availability.level}`)} · {detail}
      </Chip>
      <ProvenanceTag provenance="demo" length="short" />
    </span>
  );
}

/** Published bay count with its qualifier: "over 5,700". */
export function baysText(carPark: CarParkView, lang: Lang): string | undefined {
  return carPark.bays === undefined ? undefined : formatQualifiedNumber(carPark.bays, carPark.baysQualifier, lang);
}

/** How you get from the car park to the terminal, as published. */
export function walkText(carPark: CarParkView, t: Translator): string | undefined {
  if (!carPark.walk) return undefined;
  const parts = [carPark.walk.minutes !== undefined ? t('transportPages.parking.walkMinutes', { minutes: carPark.walk.minutes }) : undefined, carPark.walk.note];
  const text = parts.filter(Boolean).join('. ');
  return text || undefined;
}

/** One tariff band in words: "Up to 1 h: RM 4", "After 1 h: RM 3 each 1 h". */
export function rateBandText(band: RateBand, lang: Lang, t: Translator): string {
  if (band.label) return `${pick(band.label, lang)}: ${bandAmount(band, lang, t)}`;
  const range =
    band.fromMinute === 0 && band.toMinute !== undefined
      ? t('transportPages.parking.rates.upTo', { duration: formatDuration(band.toMinute, lang) })
      : band.toMinute !== undefined
        ? t('transportPages.parking.rates.between', { from: formatDuration(band.fromMinute, lang), to: formatDuration(band.toMinute, lang) })
        : t('transportPages.parking.rates.after', { duration: formatDuration(band.fromMinute, lang) });
  return `${range}: ${bandAmount(band, lang, t)}`;
}

function bandAmount(band: RateBand, lang: Lang, t: Translator): string {
  const amount = formatCurrency(band.amount, lang);
  return band.kind === 'per-block' ? t('transportPages.parking.rates.perBlock', { amount, block: formatDuration(band.blockMinutes ?? 60, lang) }) : amount;
}

/** A yes or no fact with an icon and words, or nothing when unpublished. */
export function YesNo({ value, icon }: { value: boolean; icon: IconKey }) {
  const t = useT();
  return value ? (
    <Chip tone="positive" icon={icon}>
      {t('transportPages.parking.available')}
    </Chip>
  ) : (
    <Chip tone="neutral" icon="ban">
      {t('transportPages.parking.notAvailable')}
    </Chip>
  );
}
