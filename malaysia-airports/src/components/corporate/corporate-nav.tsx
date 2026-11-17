import { LocaleLink } from '@/components/common/locale-link';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import type { Translator } from '@/lib/i18n';
import { CORPORATE_SECTIONS, type CorporateNavId } from './corporate-sections';

const LINK_BASE =
  'inline-flex min-h-11 items-center gap-2 rounded-sm px-2.5 text-on-inverse-dim transition-colors duration-fast hover:text-on-inverse aria-[current=page]:text-on-inverse';
const LINK = `${LINK_BASE} type-body-sm aria-[current=page]:font-semibold`;

/**
 * The corporate register's own band under the site header: the section links (a disclosure on
 * phones, a row from `lg`), the current page marked with `aria-current` and an underline, and a
 * way back to the passenger site. Server-rendered: the current page comes from the caller.
 */
export function CorporateNav({ current, t }: { current: CorporateNavId; t: Translator }) {
  const items = [
    { id: 'overview' as const, href: '/corporate', label: t('corporatePages.nav.overview') },
    ...CORPORATE_SECTIONS.map((section) => ({ id: section.id, href: section.href, label: t(section.label) })),
  ];
  const currentLabel = items.find((item) => item.id === current)?.label ?? items[0].label;

  const passenger = (
    <LocaleLink href="/" className={cn(LINK, 'shrink-0 font-medium text-on-inverse')}>
      <Icon name="arrow-left" size="sm" strokeWidth={1.75} />
      {t('corporatePages.nav.passengerSite')}
    </LocaleLink>
  );

  return (
    <nav aria-label={t('corporatePages.nav.label')} className="relative bg-inverse text-on-inverse">
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gold/60" />
      <Container>
        {/* Phones and tablets: register name, way back, and a disclosure with the sections. */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <LocaleLink
              href="/corporate"
              aria-current={current === 'overview' ? 'page' : undefined}
              className={cn(LINK_BASE, 'type-eyebrow -ml-2.5 text-on-inverse')}
            >
              {t('corporatePages.title')}
            </LocaleLink>
            {passenger}
          </div>
          <details className="group/cnav -mx-2.5 border-t border-on-inverse-dim/25 pb-1">
            <summary className="type-body-sm flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-sm px-2.5 text-on-inverse [&::-webkit-details-marker]:hidden">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="text-on-inverse-dim">{t('corporatePages.nav.menu')}</span>
                <span className="font-semibold">{currentLabel}</span>
              </span>
              <Icon name="chevron-down" size="sm" strokeWidth={1.75} className="shrink-0 transition-transform duration-fast group-open/cnav:rotate-180" />
            </summary>
            <ul className="grid gap-x-4 pb-2 sm:grid-cols-2">
              {items.map((item) => (
                <li key={item.id}>
                  <LocaleLink href={item.href} aria-current={item.id === current ? 'page' : undefined} className={cn(LINK, 'flex w-full')}>
                    {item.id === current ? <span aria-hidden="true" className="h-4 w-0.5 rounded-pill bg-gold" /> : null}
                    {item.label}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </details>
        </div>

        {/* Desktop: one row of sections, the way back on the right. */}
        <div className="hidden items-center justify-between gap-6 lg:flex">
          <ul className="-ml-2.5 flex flex-wrap items-center gap-x-1">
            {items.map((item) => (
              <li key={item.id}>
                <LocaleLink
                  href={item.href}
                  aria-current={item.id === current ? 'page' : undefined}
                  className={cn(
                    item.id === 'overview' ? cn(LINK_BASE, 'type-eyebrow mr-3 text-on-inverse') : LINK,
                    'relative after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-pill after:bg-gold after:opacity-0 aria-[current=page]:after:opacity-100',
                  )}
                >
                  {item.label}
                </LocaleLink>
              </li>
            ))}
          </ul>
          {passenger}
        </div>
      </Container>
    </nav>
  );
}
