import Link from 'next/link';
import { getT } from '@/lib/i18n';
import { Wordmark } from '@/components/art/wordmark';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { controlClasses } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';

/**
 * Body of the global 404 (`src/app/global-not-found.tsx`): header with both languages, the
 * bilingual message, a search form that works without JavaScript, and ways back in. Server
 * Component with no context providers (the root layout does not wrap this page).
 */
export function NotFoundContent() {
  const en = getT('en');
  const ms = getT('ms');
  return (
    <>
      <header className="on-media border-b border-[rgb(255_255_255/0.1)] bg-midnight text-ink">
        <Container className="flex h-header items-center justify-between gap-4">
          <Link href="/en" className="rounded-sm">
            <Wordmark name={en('common.appName')} />
          </Link>
          <nav aria-label={en('nav.languageLabel')} className="hidden items-center gap-1 sm:flex">
            <Link href="/en" hrefLang="en" className="type-body-sm link-action rounded-pill px-2 font-semibold text-ink-2 hover:text-ink">
              {en('nav.switchToEnglish')}
            </Link>
            <Link href="/ms" hrefLang="ms" lang="ms" className="type-body-sm link-action rounded-pill px-2 font-semibold text-ink-2 hover:text-ink">
              {ms('nav.switchToMalay')}
            </Link>
          </nav>
        </Container>
      </header>

      <main id="main" className="relative flex flex-1 flex-col justify-center overflow-hidden py-16 sm:py-24">
        <span aria-hidden="true" className="pattern-tabur-fade absolute inset-y-0 right-0 hidden w-1/3 text-gold opacity-40 lg:block" />
        <Container size="narrow" className="relative">
          <p className="type-data-xl text-gold-ink">404</p>
          <h1 className="type-display-xl mt-3 text-ink">{en('errors.notFoundTitle')}</h1>
          <p lang="ms" className="type-display-sm mt-3 font-display text-ink-2 italic">
            {ms('errors.notFoundTitle')}
          </p>
          <span aria-hidden="true" className="rule-gold mt-7 block max-w-40" />

          <div className="mt-7 grid gap-x-10 gap-y-4 md:grid-cols-2">
            <p className="type-body-lg text-ink-2">{en('platformPages.notFound.lead')}</p>
            <p lang="ms" className="type-body-lg text-ink-2">
              {ms('platformPages.notFound.lead')}
            </p>
          </div>

          <form action="/en/search" method="get" role="search" className="mt-10 max-w-reading">
            <label htmlFor="global-404-search" className="type-body-sm mb-1.5 block font-semibold text-ink">
              {en('platformPages.notFound.searchLabel')}{' '}
              <span lang="ms" className="font-normal text-ink-2">
                · {ms('platformPages.notFound.searchLabel')}
              </span>
            </label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
                <input
                  id="global-404-search"
                  name="q"
                  type="search"
                  autoComplete="off"
                  enterKeyHint="search"
                  placeholder={en('platformPages.notFound.searchPlaceholder')}
                  className={`${controlClasses} pl-10`}
                />
              </div>
              <Button type="submit">{en('platformPages.notFound.searchButton')}</Button>
            </div>
          </form>

          <ul className="mt-8 flex flex-wrap gap-3">
            <li>
              <Button asChild iconEnd="arrow-right">
                <Link href="/en">{en('platformPages.notFound.home')}</Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="secondary" iconEnd="arrow-right">
                <Link href="/ms" hrefLang="ms" lang="ms">
                  {ms('platformPages.notFound.home')}
                </Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="ghost" iconStart="tower-control">
                <Link href="/en/airports">{en('platformPages.notFound.airports')}</Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="ghost" iconStart="circle-help">
                <Link href="/en/help">{en('platformPages.notFound.help')}</Link>
              </Button>
            </li>
          </ul>
        </Container>
      </main>

      <footer className="on-media bg-midnight text-ink">
        <Container className="type-caption py-5 text-ink-2">{en('footer.disclaimer')}</Container>
      </footer>
    </>
  );
}
