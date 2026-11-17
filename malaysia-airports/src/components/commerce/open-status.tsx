'use client';

import { useNow } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { Chip } from '@/components/ui/chip';
import { isOutletOpen, type HoursView } from './commerce-view';

/**
 * "Open now" or "Closed now" for hours that can tell (daily or 24 hours), worked out on the
 * device in airport time. Renders nothing before the clock is read and for prose hours.
 */
export function OpenStatus({ hours }: { hours: HoursView | undefined }) {
  const t = useT();
  const now = useNow();
  const open = isOutletOpen(hours, now);
  if (open === undefined) return null;
  return open ? (
    <Chip tone="positive" icon="clock">
      {t('common.labels.openNow')}
    </Chip>
  ) : (
    <Chip tone="neutral" icon="clock-alert">
      {t('common.labels.closedNow')}
    </Chip>
  );
}
