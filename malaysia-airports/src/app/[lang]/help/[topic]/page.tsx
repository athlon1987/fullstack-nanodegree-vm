import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { getHelpTopic, helpTopicSlugs, pick } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import type { Translator } from '@/lib/i18n/translate';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { EmptyState } from '@/components/common/empty-state';
import { LocaleLink } from '@/components/common/locale-link';
import { MissingPage } from '@/components/common/missing-page';
import { PageHero } from '@/components/guides/page-hero';
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
import type { Lang } from '@/content/types';
import { I18nPageScope } from '@/lib/i18n/page-scope';

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
  return { alternates: languageAlternates(lang, `/help/${topic}`), title: `${pick(record.title, lang)}: ${t('guidePages.help.title')}`, description: pick(record.summary, lang) };
}

/**
 * No page-level `<Suspense>` (round 3, the static shell round 2 gave the airport overview, board and
 * map): every listed topic is complete in the static HTML, so the heading and the first content paint
 * with the document instead of waiting for React's throttled `$RC` reveal script (LCP 4.3 s on
 * transport). Any other topic gets `MissingPage`, a 404 with the site shell.
 */
export default function HelpTopicPage({ params }: PageProps<'/[lang]/help/[topic]'>) {
  return (
    <I18nPageScope namespaces={['guidePages']}>
      <HelpTopic params={params} />
    </I18nPageScope>
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
  if (!record) return <MissingPage />;
  const t = getT(lang);
  const title = pick(record.title, lang);
  const faqs = faqViews(lang, topic);
  const topicViews = helpTopicViews(lang);
  const others = topicViews.filter((item) => item.slug !== topic);
  const icon = topicViews.find((item) => item.slug === topic)?.icon ?? 'circle-help';
  const related = TOPIC_RELATED[topic] ?? [];
  const official = officialLinks(topic, t);

  return (
    <>
      {/* Redesign stage two: the quiet editorial header with the topic's emblem, answers in a
          white card, "still need help" as the one midnight card. */}
      <PageHero
        tone="light"
        emblem={icon}
        eyebrow={t('guidePages.help.title')}
        title={title}
        lead={pick(record.summary, lang)}
        breadcrumbs={<Breadcrumbs items={[{ label: t('nav.help'), href: '/help' }, { label: title }]} />}
      />
      <Container className="pt-6 pb-section sm:pt-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-16">
            <TopicLead topic={topic} t={t} lang={lang} />
            <section aria-labelledby="topic-faq-title">
              <SectionHeading
                id="topic-faq-title"
                title={t('guidePages.help.topic.faqTitle')}
                lead={t.count('guidePages.help.topicCount', faqs.length)}
                variant="title"
              />
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

          <aside
            aria-labelledby="topic-others-title"
            className="flex min-w-0 flex-col gap-8 lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)] lg:self-start"
          >
            <div className="surface-midnight on-media rounded-2xl p-6 text-ink shadow-md">
              <span aria-hidden="true" className="mb-4 flex size-11 items-center justify-center rounded-full bg-on-midnight/8 text-gold-bright ring-1 ring-gold/40">
                <Icon name="messages-square" />
              </span>
              <h2 className="type-title-md text-ink">{t('guidePages.help.topic.stillNeed')}</h2>
              <p className="type-body-sm mt-1 text-ink-2">{t('guidePages.help.topic.stillNeedBody')}</p>
              <LocaleLink href="/help#contacts" className="link-action type-body-sm mt-1 text-ink">
                {t('guidePages.help.topic.contactAction')}
                <Icon name="arrow-right" size="sm" />
              </LocaleLink>
            </div>
            <nav aria-labelledby="topic-others-title">
              <h2 id="topic-others-title" className="type-overline mb-3 text-ink-2">
                {t('guidePages.help.topic.otherTopics')}
              </h2>
              <ul className="flex flex-col gap-0.5">
                {others.map((item) => (
                  <li key={item.slug}>
                    <LocaleLink
                      href={`/help/${item.slug}`}
                      className="type-body-sm flex min-h-11 items-center gap-3 rounded-xl px-2 py-1.5 text-ink-2 transition-colors duration-fast hover:bg-surface hover:text-ink hover:shadow-xs"
                    >
                      <Icon name={item.icon} size="sm" className="text-primary-ink" />
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
