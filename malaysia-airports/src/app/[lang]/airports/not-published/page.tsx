import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { Suspense } from 'react';
import { GROUP_CONTACTS, getSource, pick } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { NotPublishedSection, NotPublishedSectionFallback, type NotPublishedContact } from '@/components/airport/not-published-section';
import { Container } from '@/components/ui/container';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(await routeLang());
  return {
    alternates: languageAlternates(await routeLang(), '/airports/not-published'),
    title: t('shellExtras.notPublished.metaTitle'),
    description: t('shellExtras.notPublished.metaDescription'),
    // A state, not content: keep it out of search results.
    robots: { index: false, follow: true },
  };
}

/**
 * `/airports/not-published?airport=szb&section=parking`: the honest state behind a tile or a
 * navigation item named after a section the chosen airport does not have (A-07). It says the
 * section is not published there and points to the official website and the group phone line,
 * both from the source registry. The parameters are read on the client inside Suspense, so the
 * page stays static.
 */
export default async function NotPublishedPage() {
  const lang = toLang(await routeLang());
  const official = getSource('mahb-airports-site');
  const phone = GROUP_CONTACTS.find((contact) => contact.kind === 'phone');
  const contact: NotPublishedContact | undefined = phone?.href ? { label: pick(phone.label, lang), value: phone.value, href: phone.href } : undefined;
  return (
    <Container className="pt-8 pb-section sm:pt-12">
      <Suspense fallback={<NotPublishedSectionFallback />}>
        <NotPublishedSection officialUrl={official?.url} phone={contact} />
      </Suspense>
    </Container>
  );
}
