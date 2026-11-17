import { NextResponse, type NextRequest } from 'next/server';
import { isLang } from '@/content/types';
import { negotiateLang } from '@/lib/locale';

/**
 * Every page lives under `/en` or `/ms`. This proxy sends any path WITHOUT a locale to the
 * visitor's language: the `lang` cookie (set by the language switch), then `Accept-Language`,
 * then English. `/` becomes `/en`; `/kul/parking` becomes `/ms/kul/parking`.
 *
 * It also gives unknown locales a proper answer: `/fr/kul` is not a locale path, so it becomes
 * `/en/fr/kul`, which no route matches and the localised not-found page answers with a 404.
 *
 * It never runs for localised pages (they are static), API routes, Next.js assets or files.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isLang(pathname.split('/')[1])) return NextResponse.next();

  const cookie = request.cookies.get('lang')?.value;
  const lang = isLang(cookie) ? cookie : negotiateLang(request.headers.get('accept-language'));
  const url = request.nextUrl.clone();
  url.pathname = `/${lang}${pathname === '/' ? '' : pathname}`;
  url.search = search;

  const response = NextResponse.redirect(url, 307);
  // The answer depends on the visitor, so it must not be cached for someone else.
  response.headers.set('Vary', 'Accept-Language, Cookie');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  // Everything except: localised pages, API routes, Next.js internals, and files with an extension.
  matcher: ['/((?!en(?:/|$)|ms(?:/|$)|api(?:/|$)|_next/|.*\\.[^/]+$).*)'],
};
