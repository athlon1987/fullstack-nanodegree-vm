import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getHelpTopic, helpTopicSlugs, pick } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import type { Translator } from '@/lib/i18n/translate';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { EmptyState } from '@/components/common/empty-state';
import { LocaleLink } from '@/components/common/locale-link';
import { PageHeader } from '@/components/common/page-header';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { SectionHeading } from '@/components/common/section-heading';
import { ContactList } from '@/components/help/contact-list';
import { EscalationLadder } from '@/components/help/escalation-ladder';
import { FaqAccordion, FaqStatic } from '@/components/help/faq-accordion';
import { TOPIC_RELATED } from '@/components/help/help-meta';
import { contactViews, faqView, faqViews, helpTopicViews, officialLinks } from '@/components/help/help-views.server';
import { OfficialLinks } from '@/components/help/official-links';
import { WhoHandles } from '@/components/help/who-handles';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import type { Lang } from '@/content/types';

export function generateStaticParams() {
  return helpTopicSlugs().map((topic) => ({ topic }));
}

/** Topics are module content: every listed topic is fully static and an unknown slug is a real 404. */
export const ensureStatic = 'navigation';

export async function generateMetadata({ params }: PageProps<'/[lang]/help/[topic]'>): Promise<Metadata> {
  const { lang: rawLang, topic } = await params;
  const lang = toLang(rawLang);
  const t = getT(lang);
  const record = getHelpTopic(topic);
  if (!record) return { title: t('errors.notFoundTitle') };
  return { title: `${pick(record.title, lang)}: ${t('guidePages.help.title')}`, description: pick(record.summary, lang) };
}

export default function HelpTopicPage({ params }: PageProps<'/[lang]/help/[topic]'>) {
  return (
    <Suspense
      fallback={
        <Container className="py-10" aria-hidden="true">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="mt-8 h-96 w-full" />
        </Container>
      }
    >
      <HelpTopic params={params} />
    </Suspense>
  );
}

/** Blocks that lead a topic before its questions: contacts, who handles what, escalation. */
function TopicLead({ topic, t, lang }: { topic: string; t: Translator; lang: Lang }) {
  const faqs = Object.fromEntries(faqViews(lang).map((faq) => [faq.id, faq]));
  if (topic === 'contact') {
    return (
      <section aria-labelledby="topic-contacts-title">
        <SectionHeading id="topic-contacts-title" title={t('guidePages.help.contactsTitle')} lead={t('guidePages.help.contactsLead')} variant="title" />
        <ContactList contacts={contactViews(lang, t)} />
      </section>
    );
  }
  if (topic === 'feedback') {
    return (
      <section aria-labelledby="topic-escalation-title">
        <SectionHeading id="topic-escalation-title" title={t('guidePages.help.escalation.title')} lead={t('guidePages.help.escalation.lead')} variant="title" />
        <EscalationLadder t={t} feedback={faqView('airport-feedback', lang)} complaint={faqView('airline-complaint-escalation', lang)} />
      </section>
    );
  }
  const rows: Record<string, readonly string[]> = {
    'lost-property': ['lost-terminal', 'lost-on-board', 'missing-bag'],
    baggage: ['missing-bag', 'lost-terminal'],
    flights: ['delay', 'unresolved'],
  };
  if (rows[topic]) {
    return (
      <section aria-labelledby="topic-who-title">
        <SectionHeading id="topic-who-title" title={t('guidePages.help.whoTitle')} lead={t('guidePages.help.whoLead')} variant="title" />
        <WhoHandles t={t} faqs={faqs} only={rows[topic]} />
      </section>
    );
  }
  return null;
}

async function HelpTopic({ params }: { params: PageProps<'/[lang]/help/[topic]'>['params'] }) {
  const { lang: rawLang, topic } = await params;
  const lang = toLang(rawLang);
  const record = getHelpTopic(topic);
  if (!record) notFound();
  const t = getT(lang);
  const title = pick(record.title, lang);
  const faqs = faqViews(lang, topic);
  const others = helpTopicViews(lang).filter((item) => item.slug !== topic);
  const related = TOPIC_RELATED[topic] ?? [];
  const official = officialLinks(topic, t);

  return (
    <>
      <PageHeader
        eyebrow={t('guidePages.help.title')}
        title={title}
        lead={pick(record.summary, lang)}
        breadcrumbs={<Breadcrumbs items={[{ label: t('nav.help'), href: '/help' }, { label: title }]} />}
      />
      <Container className="pb-section">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-14">
            <TopicLead topic={topic} t={t} lang={lang} />
            <section aria-labelledby="topic-faq-title">
              <SectionHeading id="topic-faq-title" title={t('guidePages.help.topic.faqTitle')} lead={t.count('guidePages.help.topicCount', faqs.length)} variant="title" />
              {faqs.length > 0 ? (
                <>
                  <FaqAccordion faqs={faqs} />
                  <noscript>
                    <FaqStatic faqs={faqs} />
                  </noscript>
                </>
              ) : (
                <EmptyState title={t('guidePages.help.topic.empty')}>{t('empty.officialPointer')}</EmptyState>
              )}
            </section>
            {related.length > 0 || official.length > 0 ? (
              <div className="grid gap-10 sm:grid-cols-2">
                {related.length > 0 ? (
                  <section aria-labelledby="topic-related-title" className="min-w-0">
                    <h2 id="topic-related-title" className="type-title-md mb-2 text-ink">
                      {t('guidePages.help.topic.relatedTitle')}
                    </h2>
                    <ul className="flex flex-col">
                      {related.map((link) => (
                        <li key={link.href}>
                          <LocaleLink href={link.href} className="link-action type-body-sm text-ink">
                            {t(link.label)}
                            <Icon name="arrow-right" size="sm" />
                          </LocaleLink>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                <OfficialLinks links={official} title={t('guidePages.help.officialTitle')} />
              </div>
            ) : null}
            <ProvenanceLegend headingLevel={2} />
          </div>

          <aside aria-labelledby="topic-others-title" className="flex min-w-0 flex-col gap-8 lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)] lg:self-start">
            <div className="rounded-lg border border-line-strong bg-surface p-5">
              <h2 className="type-title-sm text-ink">{t('guidePages.help.topic.stillNeed')}</h2>
              <p className="type-body-sm mt-1 text-ink-2">{t('guidePages.help.topic.stillNeedBody')}</p>
              <LocaleLink href="/help#contacts" className="link-action type-body-sm mt-1 text-ink">
                {t('guidePages.help.topic.contactAction')}
                <Icon name="arrow-right" size="sm" />
              </LocaleLink>
            </div>
            <nav aria-labelledby="topic-others-title">
              <h2 id="topic-others-title" className="type-eyebrow mb-2 text-ink-3">
                {t('guidePages.help.topic.otherTopics')}
              </h2>
              <ul className="flex flex-col border-l border-line-strong pl-4">
                {others.map((item) => (
                  <li key={item.slug}>
                    <LocaleLink href={`/help/${item.slug}`} className="link-action type-body-sm text-ink-2 hover:text-ink">
                      {item.title}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </Container>
    </>
  );
}
