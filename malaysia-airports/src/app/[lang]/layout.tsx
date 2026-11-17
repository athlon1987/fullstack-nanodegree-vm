import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { lang as routeLang } from 'next/root-params';
import { getSource } from '@/content';
import { SkipLink } from '@/components/common/skip-link';
import { GlobalOverlays } from '@/components/shell/global-overlays';
import { MobileBar } from '@/components/shell/mobile-bar';
import { sectionAvailability } from '@/components/shell/sections.server';
import { ShellProvider } from '@/components/shell/shell-context';
import { SiteFooter } from '@/components/shell/site-footer';
import { SiteHeader } from '@/components/shell/site-header';
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
  const lang = await routeLang();
  const t = getT(lang);
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { default: `${t('common.appName')}: ${t('common.tagline')}`, template: `%s | ${t('common.appName')}` },
    description: t('footer.disclaimer'),
    applicationName: t('common.appName'),
    // A concept prototype must not be mistaken for the official site in search results.
    robots: { index: false, follow: false },
  };
}

/** Browser chrome follows the page tone of each theme (`--color-page` in globals.css). */
export const viewport: Viewport = {
  colorScheme: 'light dark',
  viewportFit: 'cover',
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
 *
 * The shell: skip link, utility bar and sticky header, `<main>`, footer, the phone bottom bar
 * and the global overlays (airport switcher, search palette, concierge, display settings, menu).
 * On phones the page keeps clear of the fixed bottom bar: the footer pads itself and scroll
 * padding stops focus from landing underneath it.
 */
export default async function RootLayout({ children }: LayoutProps<'/[lang]'>) {
  const lang = await routeLang();
  if (!isLang(lang)) notFound();
  const t = getT(lang);

  return (
    <html lang={lang} className={`${fontVariables} max-md:[scroll-padding-bottom:5.5rem]`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider lang={lang} dictionary={getDictionary(lang)}>
          <ShellProvider sections={sectionAvailability()} officialSiteUrl={getSource('mahb-airports-site')?.url}>
            <SkipLink label={t('common.actions.skipToContent')} />
            <SiteHeader lang={lang} />
            <main id="main" tabIndex={-1} className="flex min-h-[60dvh] flex-1 flex-col">
              {children}
            </main>
            <SiteFooter lang={lang} />
            <MobileBar />
            <GlobalOverlays />
          </ShellProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
