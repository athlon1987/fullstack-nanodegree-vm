'use client';

import { cn } from '@/lib/cn';
import { useSavedJourney } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Kbd } from '@/components/ui/kbd';
import { Tooltip } from '@/components/ui/tooltip';
import { overlays, useOverlayState } from './overlay-store';

/** Number of things saved in "My journey" (flights, places and the parked-car note). */
export function useSavedCount(): number {
  const { journey } = useSavedJourney();
  return journey.flights.length + journey.places.length + (journey.parkedCar ? 1 : 0);
}

/** Opens the search palette. The shortcut is shown in the tooltip. */
export function SearchButton({ className }: { className?: string }) {
  const t = useT();
  const { open } = useOverlayState();
  return (
    <Tooltip
      side="bottom"
      content={
        <span className="inline-flex items-center gap-2">
          {t('search.label')} <Kbd>/</Kbd>
        </span>
      }
    >
      <IconButton
        icon="search"
        label={t('search.open')}
        aria-haspopup="dialog"
        aria-expanded={open === 'search'}
        aria-keyshortcuts="/ Control+K Meta+K"
        onClick={() => overlays.openSearch()}
        className={className}
      />
    </Tooltip>
  );
}

/** "My journey" with a count of saved items. */
export function JourneyLink({ className }: { className?: string }) {
  const t = useT();
  const count = useSavedCount();
  return (
    <LocaleLink
      href="/journey"
      aria-label={count > 0 ? t.count('shell.journey.count', count) : t('shell.journey.empty')}
      className={cn(
        'relative inline-flex size-11 shrink-0 items-center justify-center rounded-md text-ink transition-colors duration-fast hover:bg-page-subtle',
        className,
      )}
    >
      <Icon name={count > 0 ? 'bookmark-check' : 'bookmark'} />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="type-data-xs absolute top-1 right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-pill bg-primary px-1 font-bold text-on-primary"
        >
          {count}
        </span>
      ) : null}
    </LocaleLink>
  );
}

/** Opens the concierge panel. */
export function ConciergeLauncher({ className }: { className?: string }) {
  const t = useT();
  const { open } = useOverlayState();
  return (
    <Tooltip side="bottom" content={t('concierge.open')}>
      <IconButton
        icon="sparkles"
        label={t('concierge.open')}
        aria-haspopup="dialog"
        aria-expanded={open === 'concierge'}
        onClick={() => overlays.openConcierge()}
        className={className}
      />
    </Tooltip>
  );
}

/** Opens the menu (navigation, language and display settings). */
export function MenuButton({ className }: { className?: string }) {
  const t = useT();
  const { open } = useOverlayState();
  return (
    <IconButton
      icon="menu"
      label={t('common.actions.openMenu')}
      aria-haspopup="dialog"
      aria-expanded={open === 'menu'}
      onClick={() => overlays.openMenu()}
      className={className}
    />
  );
}

/** "Display settings" in the utility bar: opens theme, text size, contrast and motion. */
export function DisplaySettingsButton({ className }: { className?: string }) {
  const t = useT();
  const { open } = useOverlayState();
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open === 'preferences'}
      onClick={() => overlays.openPreferences()}
      className={cn(
        'type-caption inline-flex h-7 items-center gap-1.5 rounded-xs px-1.5 font-semibold text-on-inverse-dim transition-colors duration-fast hover:text-on-inverse',
        className,
      )}
    >
      <Icon name="accessibility" size="sm" />
      {t('preferences.open')}
    </button>
  );
}
