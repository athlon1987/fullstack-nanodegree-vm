'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import type { Lang } from '@/content/types';
import { useLang } from '@/lib/i18n/client';
import { localeHref } from '@/lib/locale';

export interface LocaleLinkProps extends Omit<ComponentProps<typeof Link>, 'href' | 'lang'> {
  /** A path WITHOUT the locale (`/kul/flights`). External URLs, `#hash` and `/api/*` pass through. */
  href: string;
  /** Override the language (the language switcher). Defaults to the language of the current route. */
  lang?: Lang;
}

/**
 * `next/link` that adds the locale prefix. The language comes from the i18n context, so it
 * works in Server and Client Components alike without passing `lang` around.
 *
 * @example <LocaleLink href="/kul/flights">{t('nav.flights')}</LocaleLink>
 */
export function LocaleLink({ href, lang, ...rest }: LocaleLinkProps) {
  const current = useLang();
  return <Link href={localeHref(lang ?? current, href)} {...rest} />;
}
