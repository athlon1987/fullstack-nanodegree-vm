import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { getT, toLang } from '@/lib/i18n';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LocaleLink } from '@/components/common/locale-link';
import { PageHero } from '@/components/guides/page-hero';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { SectionHeading } from '@/components/common/section-heading';
import { CallRow, ContactList } from '@/components/help/contact-list';
import { EscalationLadder } from '@/components/help/escalation-ladder';
import { POPULAR_FAQS } from '@/components/help/help-meta';
import { HelpSearch } from '@/components/help/help-search';
import { contactViews, faqView, faqViews, helpTopicViews, officialLinks } from '@/components/help/help-views.server';
import { OfficialLinks } from '@/components/help/official-links';
import { WhoHandles } from '@/components/help/who-handles';
import { Callout } from '@/components/ui/callout';
import { Card, CardLink } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { I18nPageScope } from '@/lib/i18n/page-scope';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/help'), title: t('guidePages.help.title'), description: t('guidePages.help.metaDescription') };
}

/**
 * Help centre: search across every answer, topics, who handles what, escalation, official
 * contacts and links. Fully static; search is the only client-side behaviour.
 */
export default async function HelpPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const faqs = faqViews(lang);
  const byId = Object.fromEntries(faqs.map((faq) => [faq.id, faq]));
  const popular = POPULAR_FAQS.map((id) => byId[id]).filter(Boolean);
  const topics = helpTopicViews(lang);
  const contacts = contactViews(lang, t);
  const official = [...officialLinks('contact', t), ...officialLinks('scams', t).slice(0, 1), ...officialLinks('lost-property', t), ...officialLinks('privacy', t)];

  return (
    <I18nPageScope namespaces={['guidePages']}>
      <>
        {/* Redesign stage two: a calm midnight band with the call lines, then one big search on a
            white card that overlaps the band (the Dubai pattern), then topics and answers. */}
        {/* Polish (critique-redesign2 item 3): the call lines are the band's right column (was an emblem). */}
        <PageHero
          tone="midnight"
          size="lg"
          title={t('guidePages.help.title')}
          lead={t('guidePages.help.lead')}
          breadcrumbs={<Breadcrumbs items={[{ label: t('nav.help') }]} />}
          aside={<CallRow layout="card" contacts={contacts} title={t('guidePages.help.callTitle')} allLabel={t('guidePages.help.callAll')} />}
          className="pb-12 sm:pb-16"
        />
        <Container className="relative z-10 -mt-10 sm:-mt-12">
          <div className="rounded-3xl bg-surface p-3 shadow-xl ring-1 ring-line sm:p-4">
            <HelpSearch items={faqs.map(({ id, topic, topicTitle, question, answer }) => ({ id, topic, topicTitle, question, answer }))} />
          </div>
        </Container>
        <Container className="flex flex-col gap-16 pt-12 pb-section sm:gap-20 sm:pt-16">
          {/* Polish (critique-redesign2 item 21): the popular questions come before the topics (they answer faster). */}
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-12">
            <section aria-labelledby="help-popular-title" className="min-w-0">
              <h2 id="help-popular-title" className="type-display-sm mb-6 text-ink">
                {t('guidePages.help.popularTitle')}
              </h2>
              <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                {popular.map((faq) => (
                  <li key={faq.id}>
                    <LocaleLink href={`/help/${faq.topic}#${faq.id}`} className="group flex min-h-14 items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-fast hover:bg-page-subtle focus-visible:focus-ring-inset sm:px-6">
                      <span className="type-body min-w-0 font-medium text-ink">{faq.question}</span>
                      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fill text-ink-2 transition-colors duration-fast group-hover:bg-primary group-hover:text-on-primary">
                        <Icon name="chevron-right" size="sm" />
                      </span>
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </section>
            <Callout
              tone="warning"
              icon="shield-check"
              title={t('guidePages.help.scam.title')}
              className="lg:mt-14"
              actions={
                <LocaleLink href="/help/scams" className="link-action type-body-sm text-ink">
                  {t('guidePages.help.scam.action')}
                  <Icon name="arrow-right" size="sm" />
                </LocaleLink>
              }
            >
              <p>{t('guidePages.help.scam.body')}</p>
            </Callout>
          </div>

          <section aria-labelledby="help-topics-title">
            <SectionHeading id="help-topics-title" title={t('guidePages.help.topicsTitle')} />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {topics.map((topic) => (
                <Card as="li" key={topic.slug} interactive padding="md" className="flex min-w-0 flex-col gap-3">
                  {/* Polish (critique-redesign2 item 21): less chrome, the count after the title in a quiet tone (no pill). */}
                  <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-ink">
                    <Icon name={topic.icon} size="lg" />
                  </span>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    <h3 className="type-title-lg text-ink">
                      <CardLink href={`/help/${topic.slug}`}>{topic.title}</CardLink>
                    </h3>
                    <span className="type-body-sm text-ink-3">· {t.count('guidePages.help.topicCount', topic.count)}</span>
                  </div>
                  <p className="type-body-sm text-ink-2">{topic.summary}</p>
                </Card>
              ))}
            </ul>
          </section>
        </Container>

        <Section tone="subtle" spacing="lg" aria-labelledby="help-who-title">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="min-w-0">
              <SectionHeading id="help-who-title" title={t('guidePages.help.whoTitle')} lead={t('guidePages.help.whoLead')} variant="title" />
              <WhoHandles t={t} faqs={byId} />
            </div>
            <div className="min-w-0">
              <SectionHeading id="help-escalation-title" title={t('guidePages.help.escalation.title')} lead={t('guidePages.help.escalation.lead')} variant="title" />
              <EscalationLadder t={t} feedback={faqView('airport-feedback', lang)} complaint={faqView('airline-complaint-escalation', lang)} />
            </div>
          </div>
        </Section>

        <Container className="flex flex-col gap-14 py-section">
          <section id="contacts" aria-labelledby="help-contacts-title" className="scroll-mt-32">
            <SectionHeading id="help-contacts-title" title={t('guidePages.help.contactsTitle')} lead={t('guidePages.help.contactsLead')} />
            <ContactList contacts={contacts} />
          </section>
          <OfficialLinks links={official} title={t('guidePages.help.officialTitle')} />
          <ProvenanceLegend headingLevel={2} />
        </Container>
      </>
  
    </I18nPageScope>
  );
}
