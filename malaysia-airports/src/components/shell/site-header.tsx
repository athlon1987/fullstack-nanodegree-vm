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
 * The slim utility bar and the sticky site header.
 *
 * The utility bar carries the persistent "concept prototype" marker, the link to the corporate
 * section, the language switch and the display settings; it scrolls away. The header below it is
 * opaque, exactly `--spacing-header` tall and sticky, so scroll padding keeps focus clear of it.
 */
export function SiteHeader({ lang }: { lang: Lang }) {
  const t = getT(lang);
  const at = NAV_AT[lang];
  return (
    <>
      <div data-print="hidden" className="bg-inverse text-on-inverse">
        <div className="mx-auto flex min-h-8 max-w-wide items-center justify-between gap-4 px-4 sm:px-6">
          <LocaleLink
            href="/about-this-prototype"
            className="type-caption group inline-flex min-h-8 min-w-0 items-center gap-2 font-medium text-on-inverse-dim transition-colors duration-fast hover:text-on-inverse"
          >
            <Icon name="flask-conical" size="xs" strokeWidth={2} className="text-gold" />
            <span className="underline decoration-transparent underline-offset-4 group-hover:decoration-current sm:hidden">{t('shell.prototypeMarkerShort')}</span>
            <span className="underline decoration-transparent underline-offset-4 group-hover:decoration-current max-sm:hidden">{t('shell.prototypeMarker')}</span>
          </LocaleLink>
          <div className="flex shrink-0 items-center gap-3 max-md:hidden">
            {/* Assistance, one interaction from any page (A-15, BR-18). */}
            <LocaleLink
              href="/accessibility"
              className="type-caption inline-flex h-7 items-center gap-1.5 rounded-xs px-1.5 font-semibold text-on-inverse transition-colors duration-fast hover:text-on-inverse-dim"
            >
              <Icon name="accessibility" size="xs" strokeWidth={2} />
              {t('shellExtras.nav.assistance')}
            </LocaleLink>
            <span aria-hidden="true" className="h-3.5 w-px bg-on-inverse-dim opacity-40" />
            <LocaleLink
              href="/corporate"
              className="type-caption inline-flex h-7 items-center gap-1 rounded-xs px-1.5 font-semibold text-on-inverse-dim transition-colors duration-fast hover:text-on-inverse"
            >
              {t('shell.corporateSite')}
              <Icon name="arrow-right" size="xs" strokeWidth={2} />
            </LocaleLink>
            <span aria-hidden="true" className="h-3.5 w-px bg-on-inverse-dim opacity-40" />
            <LanguageSwitch />
            <span aria-hidden="true" className="h-3.5 w-px bg-on-inverse-dim opacity-40" />
            <DisplaySettingsButton />
          </div>
        </div>
      </div>

      <header data-print="hidden" data-site-header="" className="sticky top-0 z-40 h-header border-b border-line bg-page">
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
            <PrimaryNav className={cn('ml-3', at.nav)} />
            <div className="ml-auto flex min-w-0 items-center gap-1">
              <AirportSwitcherButton className="mr-1" labelClassName={at.airportLabel} />
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
