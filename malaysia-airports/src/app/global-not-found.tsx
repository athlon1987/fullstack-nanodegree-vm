import type { Metadata } from 'next';
import { fontVariables } from '@/fonts';
import { getT } from '@/lib/i18n';
import { PREFERENCES_INIT_SCRIPT } from '@/lib/preferences';
import { NotFoundContent } from '@/components/platform/not-found-content';
import { ShortSharedCache } from '@/components/platform/short-cache';
import './globals.css';

const en = getT('en');

export const metadata: Metadata = {
  title: `${en('platformPages.notFound.metaTitle')} | ${en('common.appName')}`,
  description: en('errors.notFoundBody'),
  robots: { index: false, follow: false },
};

/**
 * The designed 404 for URLs that match no route at all (the root layout lives under `[lang]`, so
 * without this file they would get the framework's bare page: Next.js notes, section 5). It is a
 * whole document with its own styles, fonts and theme script. We cannot know the visitor's
 * language here, so it speaks both: English first, Bahasa Malaysia beside it, each marked with
 * its `lang`. Search works without JavaScript (a plain GET form to the search page).
 * `ShortSharedCache` caps shared caching of the 404 at a minute (security-12).
 */
export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-page text-ink">
        <ShortSharedCache />
        <NotFoundContent />
      </body>
    </html>
  );
}
