'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, type MouseEvent } from 'react';
import { LANGS, type Lang } from '@/content/types';
import { cn } from '@/lib/cn';
import { useLang, useT } from '@/lib/i18n/client';
import { switchLocalePath } from '@/lib/locale';
import { closeOverlay } from './overlay-store';

export interface LanguageSwitchProps {
  /** `inline`: EN | BM in the utility bar (on the ink band). `block`: two large buttons for the phone menu. `plain`: text links for the footer. */
  variant?: 'inline' | 'block' | 'plain';
  className?: string;
}

/** Remember the choice for the `/` redirect in `src/proxy.ts`. */
function rememberLanguage(lang: Lang): void {
  // Secure on https (the site's only cookie; plain http only in local development).
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax${secure}`;
}

function Links({ variant, pathname, className }: LanguageSwitchProps & { pathname: string | null }) {
  const t = useT();
  const current = useLang();
  const router = useRouter();
  const names: Record<Lang, string> = { en: t('nav.switchToEnglish'), ms: t('nav.switchToMalay') };

  const onClick = (lang: Lang) => (event: MouseEvent<HTMLAnchorElement>) => {
    rememberLanguage(lang);
    closeOverlay();
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    // Keep the query string and the hash: the same page, in the other language.
    event.preventDefault();
    router.push(`${switchLocalePath(window.location.pathname, lang)}${window.location.search}${window.location.hash}`);
  };

  return (
    <div
      role="group"
      aria-label={t('nav.languageLabel')}
      className={cn(variant === 'block' ? 'grid grid-cols-2 gap-2' : variant === 'plain' ? 'inline-flex items-center gap-4' : 'inline-flex items-center gap-0.5', className)}
    >
      {LANGS.map((lang) => {
        const active = lang === current;
        return (
          <Link
            key={lang}
            href={pathname ? switchLocalePath(pathname, lang) : `/${lang}`}
            hrefLang={lang}
            lang={lang}
            aria-current={active ? 'true' : undefined}
            aria-label={variant === 'inline' ? `${t(`shell.langShort.${lang}`)}: ${names[lang]}` : active ? names[lang] : t('shell.languageSwitch', { language: names[lang] })}
            onClick={onClick(lang)}
            className={
              variant === 'block'
                ? cn(
                    'flex min-h-12 items-center justify-center gap-2 rounded-md border px-3 text-base font-semibold transition-colors duration-fast',
                    active ? 'border-ink bg-ink text-page' : 'border-line-control bg-surface text-ink hover:border-ink',
                  )
                : variant === 'plain'
                  ? cn(
                      'inline-flex min-h-8 items-center rounded-sm underline underline-offset-4 transition-colors duration-fast touch:min-h-11',
                      active ? 'font-semibold text-ink decoration-gold' : 'text-ink-2 decoration-transparent hover:text-ink hover:decoration-gold',
                    )
                  : cn(
                      'type-data-xs inline-flex h-7 min-w-8 items-center justify-center rounded-xs px-1.5 font-bold transition-colors duration-fast',
                      active ? 'bg-on-inverse text-inverse' : 'text-on-inverse-dim hover:text-on-inverse',
                    )
            }
          >
            {variant === 'inline' ? t(`shell.langShort.${lang}`) : names[lang]}
          </Link>
        );
      })}
    </div>
  );
}

function LinksForPath(props: LanguageSwitchProps) {
  return <Links {...props} pathname={usePathname()} />;
}

/**
 * English / Bahasa Malaysia. Switches to the same page in the other language (query string and
 * hash included) and remembers the choice in a cookie for the next visit to `/`.
 */
export function LanguageSwitch({ variant = 'inline', className }: LanguageSwitchProps) {
  return (
    // `usePathname` suspends on routes with params that are not prerendered: until it resolves the
    // links point at the other language's home page (the click handler still keeps the page).
    <Suspense fallback={<Links variant={variant} className={className} pathname={null} />}>
      <LinksForPath variant={variant} className={className} />
    </Suspense>
  );
}
