import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { getT, toLang } from '@/lib/i18n';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LocaleLink } from '@/components/common/locale-link';
import { PageHeader } from '@/components/common/page-header';
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
        <PageHeader
          title={t('guidePages.help.title')}
          lead={t('guidePages.help.lead')}
          breadcrumbs={<Breadcrumbs items={[{ label: t('nav.help') }]} />}
          meta={<CallRow contacts={contacts} title={t('guidePages.help.callTitle')} allLabel={t('guidePages.help.callAll')} />}
        />
        <Container className="flex flex-col gap-16 pb-16">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <div className="flex min-w-0 flex-col gap-8">
              <HelpSearch items={faqs.map(({ id, topic, topicTitle, question, answer }) => ({ id, topic, topicTitle, question, answer }))} />
              <section aria-labelledby="help-popular-title">
                <h2 id="help-popular-title" className="type-title-md mb-2 text-ink">
                  {t('guidePages.help.popularTitle')}
                </h2>
                <ul className="flex flex-col divide-y divide-line border-y border-line">
                  {popular.map((faq) => (
                    <li key={faq.id}>
                      <LocaleLink href={`/help/${faq.topic}#${faq.id}`} className="group flex min-h-13 items-center justify-between gap-4 py-3 focus-visible:focus-ring-inset">
                        <span className="type-body min-w-0 text-ink group-hover:underline">{faq.question}</span>
                        <Icon name="chevron-right" size="sm" className="shrink-0 text-ink-2" />
                      </LocaleLink>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <Callout
              tone="warning"
              icon="shield-check"
              title={t('guidePages.help.scam.title')}
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
            <SectionHeading id="help-topics-title" title={t('guidePages.help.topicsTitle')} variant="title" />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {topics.map((topic) => (
                <Card as="li" key={topic.slug} interactive padding="md" className="flex min-w-0 flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Icon name={topic.icon} size="lg" className="text-primary-ink" />
                    <span className="type-caption text-ink-2">{t.count('guidePages.help.topicCount', topic.count)}</span>
                  </div>
                  <h3 className="type-title-md text-ink">
                    <CardLink href={`/help/${topic.slug}`}>{topic.title}</CardLink>
                  </h3>
                  <p className="type-body-sm text-ink-2">{topic.summary}</p>
                </Card>
              ))}
            </ul>
          </section>
        </Container>

        <Section tone="subtle" spacing="md" aria-labelledby="help-who-title">
          <div className="grid gap-12 lg:grid-cols-2">
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

        <Container className="flex flex-col gap-12 py-section">
          <section id="contacts" aria-labelledby="help-contacts-title" className="scroll-mt-32">
            <SectionHeading id="help-contacts-title" title={t('guidePages.help.contactsTitle')} lead={t('guidePages.help.contactsLead')} variant="title" />
            <ContactList contacts={contacts} />
          </section>
          <OfficialLinks links={official} title={t('guidePages.help.officialTitle')} />
          <ProvenanceLegend headingLevel={2} />
        </Container>
      </>
  
    </I18nPageScope>
  );
}
