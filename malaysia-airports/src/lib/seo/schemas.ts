/**
 * schema.org builders for `<JsonLd>`. Server only: they read the content layer.
 *
 * Rule (build-spec, section 1): structured data repeats only published, sourced facts. Fields the
 * registry marks as unverified are left out, and so are the coordinates (approximate, for the
 * schematic map only). The prototype's own mark is NOT the Malaysia Airports logo, so no `logo`.
 */
import { GROUP_CONTACTS, getSource, pick, type Airport, type Contact, type Lang } from '@/content';
import { getT } from '@/lib/i18n';
import { localeHref } from '@/lib/locale';
import { absoluteUrl } from './site';

const CONTEXT = 'https://schema.org';
const ORGANIZATION_NAME = 'Malaysia Airports Holdings Berhad';

function phoneNumber(contact: Contact): string | undefined {
  return contact.kind === 'phone' ? contact.value : undefined;
}

/**
 * An `Airport` for the airport overview page (`/[lang]/[airport]`).
 *
 * @example <JsonLd data={airportJsonLd(airport, lang)} />
 */
export function airportJsonLd(airport: Airport, lang: Lang): Record<string, unknown> {
  const unverified = new Set(airport.unverifiedFields);
  const groupNumbers = new Set(GROUP_CONTACTS.map((contact) => contact.value));
  // Only a number published for this airport; the group line is the organisation's, not the airport's.
  const telephone = airport.contacts.map(phoneNumber).find((value) => value && !groupNumbers.has(value));
  return {
    '@context': CONTEXT,
    '@type': 'Airport',
    '@id': `${absoluteUrl(localeHref(lang, `/${airport.slug}`))}#airport`,
    name: airport.name,
    alternateName: airport.shortName !== airport.name ? airport.shortName : undefined,
    description: pick(airport.summary, lang),
    url: absoluteUrl(localeHref(lang, `/${airport.slug}`)),
    iataCode: unverified.has('code') ? undefined : airport.code,
    icaoCode: airport.icao && !unverified.has('icao') ? airport.icao : undefined,
    address: unverified.has('location')
      ? undefined
      : { '@type': 'PostalAddress', addressLocality: airport.city, addressRegion: airport.state, addressCountry: 'MY' },
    telephone,
    inLanguage: lang,
  };
}

/**
 * The operator, for the corporate home (`/[lang]/corporate`) or the network home.
 *
 * @example <JsonLd data={organizationJsonLd(lang)} />
 */
export function organizationJsonLd(lang: Lang): Record<string, unknown> {
  const t = getT(lang);
  const official = [getSource('mahb-airports-site')?.url, getSource('mahb-contact')?.url].filter((url): url is string => Boolean(url?.startsWith('https://')));
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    '@id': `${absoluteUrl('/')}#organization`,
    name: ORGANIZATION_NAME,
    alternateName: t('common.appName'),
    url: absoluteUrl(localeHref(lang, '/')),
    sameAs: official.length > 0 ? official : undefined,
    contactPoint: GROUP_CONTACTS.map((contact) => ({
      '@type': 'ContactPoint',
      contactType: pick(contact.label, lang),
      ...(contact.kind === 'phone' ? { telephone: contact.value } : {}),
      ...(contact.kind === 'email' ? { email: contact.value } : {}),
      availableLanguage: ['en', 'ms'],
    })),
  };
}

/** The site itself, for the home page: lets search engines show the site name. */
export function websiteJsonLd(lang: Lang): Record<string, unknown> {
  const t = getT(lang);
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    '@id': `${absoluteUrl('/')}#website`,
    name: t('common.appName'),
    description: t('common.tagline'),
    url: absoluteUrl(localeHref(lang, '/')),
    inLanguage: lang,
  };
}

/**
 * A `BreadcrumbList` matching the visible `Breadcrumbs` (paths without the locale; home first).
 *
 * @example <JsonLd data={breadcrumbJsonLd(lang, [{ name: 'KLIA', path: '/kul' }, { name: 'Parking', path: '/kul/parking' }])} />
 */
export function breadcrumbJsonLd(lang: Lang, items: { name: string; path: string }[]): Record<string, unknown> {
  const t = getT(lang);
  const all = [{ name: t('nav.home'), path: '/' }, ...items];
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: all.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localeHref(lang, item.path)),
    })),
  };
}
