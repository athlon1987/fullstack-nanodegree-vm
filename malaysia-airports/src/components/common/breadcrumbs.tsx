'use client';

import { cn } from '@/lib/cn';
import { useLang, useT } from '@/lib/i18n/client';
import { localeHref } from '@/lib/locale';
import { JsonLd } from '@/lib/seo/json-ld';
import { absoluteUrl } from '@/lib/seo/site';
import { Icon } from '@/components/ui/icon';
import { LocaleLink } from './locale-link';

export interface BreadcrumbItem {
  label: string;
  /** Path without the locale. Omit for the current page (the last item). */
  href?: string;
}

export interface BreadcrumbsProps {
  /** The trail after "Home". The last item is the current page. */
  items: readonly BreadcrumbItem[];
  /** Leave out the automatic "Home" first item. */
  hideHome?: boolean;
  className?: string;
}

/**
 * The trail back up the site. On phones only the parent is shown, as a back link, so the row
 * never wraps or truncates.
 *
 * @example <Breadcrumbs items={[{ label: 'KLIA', href: '/kul' }, { label: t('nav.parking') }]} />
 */
export function Breadcrumbs({ items, hideHome = false, className }: BreadcrumbsProps) {
  const t = useT();
  const lang = useLang();
  const trail: BreadcrumbItem[] = hideHome ? [...items] : [{ label: t('nav.home'), href: '/' }, ...items];
  const parentIndex = trail.length - 2;
  // The matching schema.org BreadcrumbList (A-30), built like `breadcrumbJsonLd` in
  // `@/lib/seo/schemas` (which imports all content, so it cannot run in this Client Component).
  // The current page, last, has no link of its own and is listed without one.
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(localeHref(lang, item.href)) } : {}),
    })),
  };
  return (
    <nav aria-label={t('nav.breadcrumbLabel')} data-breadcrumbs="" className={cn('min-w-0', className)}>
      <JsonLd data={structured} />
      <ol className="type-body-sm flex flex-wrap items-center gap-x-1 text-ink-2">
        {trail.map((item, index) => {
          const current = index === trail.length - 1;
          return (
            <li key={`${index}-${item.label}`} className={cn('items-center gap-1', index === parentIndex ? 'flex' : 'hidden sm:flex')}>
              {index === parentIndex ? <Icon name="chevron-left" size="sm" strokeWidth={2} className="sm:hidden" /> : null}
              {item.href && !current ? (
                <LocaleLink
                  href={item.href}
                  className="inline-flex min-h-8 items-center rounded-sm font-medium underline decoration-line-strong decoration-1 underline-offset-4 hover:text-ink hover:decoration-ink touch:min-h-11 touch:min-w-11"
                >
                  {item.label}
                </LocaleLink>
              ) : (
                <span aria-current={current ? 'page' : undefined} className="inline-flex min-h-8 items-center font-semibold text-ink">
                  {item.label}
                </span>
              )}
              {current ? null : <Icon name="chevron-right" size="xs" strokeWidth={2} className="mx-0.5 hidden text-ink-3 sm:block" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
