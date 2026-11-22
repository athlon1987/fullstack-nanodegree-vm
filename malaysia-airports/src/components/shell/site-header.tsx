import type { Lang } from '@/content/types';
import { getT } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { Wordmark } from '@/components/art/wordmark';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon } from '@/components/ui/icon';
import { AirportSwitcherButton } from './airport-switcher';
import { ConciergeLauncher, DisplaySettingsButton, JourneyLink, MenuButton, SearchButton } from './header-tools';
import { LanguageSwitch } from './language-switch';
import { PrimaryNav } from './primary-nav';

/**
 * Where the navigation row appears, as a container width of the header. Container queries in
 * `rem` follow the text-size setting as well as the window, and the Malay labels are longer,
 * so each language has its own threshold. Below it the menu button takes over.
 */
const NAV_AT: Record<Lang, { nav: string; menu: string; airportLabel: string }> = {
  en: { nav: 'hidden @[73rem]:block', menu: '@[73rem]:hidden', airportLabel: 'hidden @[36rem]:inline @[73rem]:hidden @[85rem]:inline' },
  ms: { nav: 'hidden @[84rem]:block', menu: '@[84rem]:hidden', airportLabel: 'hidden @[36rem]:inline @[84rem]:hidden' },
};

/**
 * The bar's own surface: midnight, slightly translucent with a blur where the browser can (solid
 * for "reduce transparency" and high contrast). It sits on a layer behind the header's content so
 * it can fade without touching the content.
 *
 * Over a hero that runs up under the header (`data-hero-under-header`, the home page) the layer
 * is transparent at the top of the page and fades in over the first 5rem of scrolling:
 * - with CSS scroll-driven animations, purely in CSS (no script, no state, nothing to hydrate);
 * - elsewhere `ScrollChrome` sets `data-scrolled` on `<html>` and the layer fades on that.
 * Under reduced motion it switches at once instead of fading. Without JavaScript and without
 * scroll-driven animations the bar simply stays solid. The words
 * on the bar are always light (an `on-media` scope), and the hero keeps a dark zone under them.
 */
const BAR_LAYER = cn(
  'pointer-events-none absolute inset-0 -z-10 border-b border-[rgb(255_255_255/0.1)] shadow-[0_8px_24px_-12px_rgb(0_0_0/0.45)]',
  'bg-[color-mix(in_srgb,var(--color-midnight)_92%,transparent)] backdrop-blur-xl backdrop-saturate-150',
  'hc:bg-midnight [@media(prefers-reduced-transparency:reduce)]:bg-midnight [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none',
  'supports-[animation-timeline:scroll()]:[body:has([data-hero-under-header])_&]:[animation-name:fade-in]',
  'supports-[animation-timeline:scroll()]:[body:has([data-hero-under-header])_&]:[animation-fill-mode:both]',
  'supports-[animation-timeline:scroll()]:[body:has([data-hero-under-header])_&]:[animation-timing-function:linear]',
  'supports-[animation-timeline:scroll()]:[body:has([data-hero-under-header])_&]:[animation-timeline:scroll(root)]',
  'supports-[animation-timeline:scroll()]:[body:has([data-hero-under-header])_&]:[animation-range:0_5rem]',
  // Reduced motion (the system's or the site's own setting): the bar switches at once, no fade.
  'motion-reduce:[animation-range:0_1px]! [html[data-motion=reduce]_&]:[animation-range:0_1px]! [html[data-motion=reduced]_&]:[animation-range:0_1px]!',
  'transition-opacity duration-base not-supports-[animation-timeline:scroll()]:[html[data-theme]:not([data-scrolled])_body:has([data-hero-under-header])_&]:opacity-0',
);

/** Links in the slim utility strip. */
const STRIP_LINK =
  'type-caption inline-flex h-7 items-center gap-1.5 rounded-pill px-2 font-semibold text-on-midnight-dim transition-colors duration-fast hover:bg-[rgb(255_255_255/0.08)] hover:text-on-midnight';

/**
 * The slim utility strip and the sticky site header (Direction v2).
 *
 * The strip carries the persistent "Concept prototype, not official" notice, Assistance, the
 * corporate site, the language switch and the display settings; it scrolls away. The header below
 * it is a midnight bar, exactly `--spacing-header` tall and sticky, so scroll padding keeps focus
 * clear of it: the wordmark, the primary navigation, the airport chooser as a pill (solid gold
 * while no airport is chosen) and refined icon buttons for search, My journey and the concierge.
 */
export function SiteHeader({ lang }: { lang: Lang }) {
  const t = getT(lang);
  const at = NAV_AT[lang];
  return (
    <>
      <div data-print="hidden" className="on-media relative border-b border-[rgb(255_255_255/0.07)] bg-midnight text-ink">
        <div className="mx-auto flex min-h-8 max-w-wide items-center justify-between gap-4 px-4 sm:px-6">
          <LocaleLink
            href="/about-this-prototype"
            className="type-caption group inline-flex min-h-8 min-w-0 items-center gap-2.5 font-medium text-on-midnight-dim transition-colors duration-fast hover:text-on-midnight"
          >
            {/* The brand's gold lozenge: a quiet marker for the notice. */}
            <span aria-hidden="true" className="size-1.5 shrink-0 rotate-45 bg-gold-bright" />
            <span className="underline decoration-transparent underline-offset-4 group-hover:decoration-current lg:hidden">{t('shell.prototypeMarkerShort')}</span>
            <span className="tracking-[0.01em] underline decoration-transparent underline-offset-4 group-hover:decoration-current max-lg:hidden">{t('shell.prototypeMarker')}</span>
          </LocaleLink>
          <div className="flex shrink-0 items-center gap-1 max-md:hidden">
            {/* Assistance, one interaction from any page (A-15, BR-18). */}
            <LocaleLink href="/accessibility" className={cn(STRIP_LINK, 'text-on-midnight')}>
              <Icon name="accessibility" size="xs" strokeWidth={2} />
              {t('shellExtras.nav.assistance')}
            </LocaleLink>
            <LocaleLink href="/corporate" className={STRIP_LINK}>
              {t('shell.corporateSite')}
              <Icon name="arrow-up-right" size="xs" strokeWidth={2} />
            </LocaleLink>
            <span aria-hidden="true" className="mx-1.5 h-3.5 w-px bg-[rgb(255_255_255/0.2)]" />
            <LanguageSwitch />
            <span aria-hidden="true" className="mx-1.5 h-3.5 w-px bg-[rgb(255_255_255/0.2)]" />
            <DisplaySettingsButton />
          </div>
        </div>
      </div>

      <header data-print="hidden" data-site-header="" className="on-media sticky top-0 z-40 isolate h-header text-ink">
        <span aria-hidden="true" className={BAR_LAYER} />
        <div className="group/hdr @container mx-auto h-full max-w-wide px-4 sm:px-6">
          <div className="flex h-full items-center gap-2 sm:gap-3">
            <LocaleLink href="/" aria-label={t('shell.homeLabel', { name: t('common.appName') })} className="shrink-0 rounded-sm">
              {/* With no airport chosen, a narrow header (320 px, or 125% text) keeps the mark and
                  hides the name visually, so "Choose airport" fits (A-16). The link keeps its name. */}
              {/* Round 6 (review-3 9.1 item 9): with the device's text at 200% the name gives way to the
                  mark (the header is measured in rem), so the airport control stays on screen. */}
              <Wordmark name={t('common.appName')} size="sm" className="sm:hidden" nameClassName="@max-[21rem]:group-has-[[data-no-airport]]/hdr:sr-only @max-[14rem]:sr-only" />
              <Wordmark name={t('common.appName')} className="max-sm:hidden" />
            </LocaleLink>
            <PrimaryNav className={cn('ml-4', at.nav)} />
            <div className="ml-auto flex min-w-0 items-center gap-0.5">
              <AirportSwitcherButton className="mr-1.5" labelClassName={at.airportLabel} />
              <SearchButton className="max-md:hidden" />
              <JourneyLink className="max-md:hidden" />
              <ConciergeLauncher className="max-md:hidden" />
              <MenuButton className={cn('max-md:hidden', at.menu)} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
