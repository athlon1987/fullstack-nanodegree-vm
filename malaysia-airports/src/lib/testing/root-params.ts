/**
 * Unit-test stand-in for `next/root-params` (aliased in vitest.config.ts). The real module is
 * replaced by the Next.js compiler and throws when imported anywhere else; Vitest imports page
 * modules directly (the sitemap test reads their `generateStaticParams`), and since round 2 many
 * pages import `I18nPageScope`, which reads the language with it. Tests that render a page
 * would get English.
 */
export async function lang(): Promise<string> {
  return 'en';
}
