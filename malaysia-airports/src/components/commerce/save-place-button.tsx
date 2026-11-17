'use client';

import { useSavedJourney } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';

export interface SavePlaceButtonProps {
  id: string;
  airport: string;
  title: string;
  /** Locale-free link back to the place. */
  href: string;
}

/** Save an outlet to "My journey" on this device, or remove it again. */
export function SavePlaceButton({ id, airport, title, href }: SavePlaceButtonProps) {
  const t = useT();
  const { isPlaceSaved, savePlace, removePlace, hydrated } = useSavedJourney();
  const saved = hydrated && isPlaceSaved('outlet', id);
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-1.5">
      <Button
        variant="secondary"
        iconStart={saved ? 'bookmark-check' : 'bookmark'}
        aria-pressed={saved}
        disabled={!hydrated}
        // Long Malay labels at a large text size wrap instead of widening the page.
        className="h-auto min-h-11 max-w-full shrink self-start py-2 text-left whitespace-normal"
        onClick={() => (saved ? removePlace('outlet', id) : savePlace({ id, type: 'outlet', airport, title, href }))}
      >
        {saved ? t('commercePages.outlet.saved') : t('commercePages.outlet.save')}
      </Button>
      <p className="type-caption text-ink-2">{t('commercePages.outlet.savedHint')}</p>
    </div>
  );
}
