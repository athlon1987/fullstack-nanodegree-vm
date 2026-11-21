'use client';

import Link from 'next/link';
import { useState, type ComponentProps, type FocusEvent, type MouseEvent, type TouchEvent } from 'react';
import type { Lang } from '@/content/types';
import { useLang } from '@/lib/i18n/client';
import { localeHref } from '@/lib/locale';

export interface LocaleLinkProps extends Omit<ComponentProps<typeof Link>, 'href' | 'lang'> {
  /** A path WITHOUT the locale (`/kul/flights`). External URLs, `#hash` and `/api/*` pass through. */
  href: string;
  /** Override the language (the language switcher). Defaults to the language of the current route. */
  lang?: Lang;
}

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

/** Data saver on, or a 2G or 3G connection: never prefetch. */
function constrainedNetwork(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) return false;
  return Boolean(connection.saveData) || ['slow-2g', '2g', '3g'].includes(connection.effectiveType ?? '');
}

/**
 * `next/link` that adds the locale prefix. The language comes from the i18n context, so it
 * works in Server and Client Components alike without passing `lang` around.
 *
 * Prefetching follows intent (A-19): a link prefetches when it is hovered, focused or touched,
 * not merely because it scrolled into view, and never with Data Saver or on a 2G or 3G
 * connection. Pass `prefetch` explicitly (`true` or `"auto"`) for the few likely next steps that
 * must be ready before the click; that still respects a constrained network.
 *
 * @example <LocaleLink href="/kul/flights">{t('nav.flights')}</LocaleLink>
 */
export function LocaleLink({ href, lang, prefetch, onMouseEnter, onFocus, onTouchStart, ...rest }: LocaleLinkProps) {
  const current = useLang();
  const [intent, setIntent] = useState(false);
  const wantIntent = () => {
    if (!intent && !constrainedNetwork()) setIntent(true);
  };
  // `false` stops both viewport and hover prefetching in the App Router; `null` restores the default.
  const resolved = prefetch === undefined ? (intent ? null : false) : prefetch && typeof navigator !== 'undefined' && constrainedNetwork() ? false : prefetch;
  return (
    <Link
      href={localeHref(lang ?? current, href)}
      prefetch={resolved}
      onMouseEnter={(event: MouseEvent<HTMLAnchorElement>) => {
        wantIntent();
        onMouseEnter?.(event);
      }}
      onFocus={(event: FocusEvent<HTMLAnchorElement>) => {
        wantIntent();
        onFocus?.(event);
      }}
      onTouchStart={(event: TouchEvent<HTMLAnchorElement>) => {
        wantIntent();
        onTouchStart?.(event);
      }}
      {...rest}
    />
  );
}
