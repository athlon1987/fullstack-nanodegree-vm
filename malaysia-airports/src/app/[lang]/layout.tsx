import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { lang as routeLang } from 'next/root-params';
import { SkipLink } from '@/components/common/skip-link';
import { fontVariables } from '@/fonts';
import { getDictionary, getT, isLang, langParams } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/client';
import { PREFERENCES_INIT_SCRIPT } from '@/lib/preferences';
import '../globals.css';

/** Both locales are prerendered; `[lang]` is a root param, so this is required under Cache Components. */
export function generateStaticParams() {
  return langParams();
}

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(await routeLang());
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { default: `${t('common.appName')}: ${t('common.tagline')}`, template: `%s | ${t('common.appName')}` },
    description: t('footer.disclaimer'),
  };
}

/** Browser chrome follows the page tone of each theme (`--color-page` in globals.css). */
export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf5ea' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0e24' },
  ],
};

/**
 * Root layout. It lives under `[lang]` so `<html lang>` comes from the route.
 *
 * Theme, contrast, text size and motion are `data-*` attributes that the inline script sets on
 * `<html>` before first paint (hence `suppressHydrationWarning`). Without JavaScript no attribute
 * is set and `globals.css` follows `prefers-color-scheme`.
 */
export default async function RootLayout({ children }: LayoutProps<'/[lang]'>) {
  const lang = await routeLang();
  if (!isLang(lang)) notFound();
  const t = getT(lang);

  return (
    <html lang={lang} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_INIT_SCRIPT }} />
      </head>
      <body>
        <I18nProvider lang={lang} dictionary={getDictionary(lang)}>
          <SkipLink label={t('common.actions.skipToContent')} />

          {/* ── SHELL: HEADER ─────────────────────────────────────────────────────────────
              foundation-ui mounts the utility bar, site header and notices bar here.
              Keep it opaque (no backdrop blur) and keep `--spacing-header` in globals.css
              equal to its height: scroll-padding and sticky offsets read that token. */}

          <main id="main" tabIndex={-1} className="flex min-h-[60dvh] flex-col">
            {children}
          </main>

          {/* ── SHELL: FOOTER ─────────────────────────────────────────────────────────────
              foundation-ui mounts the site footer, the phone tab bar and global panels
              (search palette, concierge, preferences) here. */}
        </I18nProvider>
      </body>
    </html>
  );
}
