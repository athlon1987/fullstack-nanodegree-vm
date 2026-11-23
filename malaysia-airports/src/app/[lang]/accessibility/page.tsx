import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { getT, toLang } from '@/lib/i18n';
import type { TKey } from '@/lib/i18n/translate';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LocaleLink } from '@/components/common/locale-link';
import { MoreOnPhones } from '@/components/common/more-on-phones';
import { PageHero } from '@/components/guides/page-hero';
import { ExternalLink } from '@/components/common/external-link';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { NeedsControl } from '@/components/flights/needs-control';
import { SectionHeading } from '@/components/common/section-heading';
import { accessibilityData } from '@/components/guides/accessibility-data.server';
import { FactCard } from '@/components/guides/fact-card';
import { GuideSteps } from '@/components/guides/guide-steps';
import { ContactList } from '@/components/help/contact-list';
import { contactViews } from '@/components/help/help-views.server';
import { PreferencesControls } from '@/components/shell/preferences-controls';
import { Card, CardLink } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { Icon, type IconKey } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/accessibility'), title: t('guidePages.accessibility.title'), description: t('guidePages.accessibility.metaDescription') };
}

const NAV: readonly { id: string; label: TKey; icon: IconKey }[] = [
  { id: 'assistance', label: 'guidePages.accessibility.nav.assistance', icon: 'hand-helping' },
  { id: 'hidden-disabilities', label: 'guidePages.accessibility.nav.butterfly', icon: 'leaf' },
  { id: 'facilities', label: 'guidePages.accessibility.nav.facilities', icon: 'accessibility' },
  { id: 'not-published', label: 'guidePages.accessibility.gaps.title', icon: 'circle-help' },
  { id: 'settings', label: 'guidePages.accessibility.nav.settings', icon: 'sliders-horizontal' },
  { id: 'statement', label: 'guidePages.accessibility.nav.statement', icon: 'file-text' },
];

const FACILITY_LINKS: readonly { id: string; icon: IconKey; href: string; title: TKey; body: TKey; action: TKey }[] = [
  { id: 'step-free', icon: 'route', href: '/kul/map?sf=1', title: 'guidePages.accessibility.facilities.stepFreeTitle', body: 'guidePages.accessibility.facilities.stepFreeBody', action: 'guidePages.accessibility.facilities.stepFreeAction' },
  { id: 'assistance', icon: 'hand-helping', href: '/kul/facilities?access=1', title: 'guidePages.accessibility.facilities.assistanceTitle', body: 'guidePages.accessibility.facilities.assistanceBody', action: 'guidePages.accessibility.facilities.assistanceAction' },
  { id: 'toilets', icon: 'accessible-toilet', href: '/kul/map?cat=accessible-toilets', title: 'guidePages.accessibility.facilities.toiletsTitle', body: 'guidePages.accessibility.facilities.toiletsBody', action: 'guidePages.accessibility.facilities.toiletsAction' },
];

/**
 * Assistance and accessibility: how to ask for help, the Butterfly Effect, accessible facilities,
 * this site's display settings and the accessibility statement. Static apart from the settings.
 */
export default async function AccessibilityPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const data = accessibilityData(lang);
  const statementTested: TKey[] = [
    'guidePages.accessibility.statement.tested1',
    'guidePages.accessibility.statement.tested2',
    'guidePages.accessibility.statement.tested3',
    'guidePages.accessibility.statement.tested5',
    'guidePages.accessibility.statement.tested6',
    'guidePages.accessibility.statement.tested4',
  ];
  // Round 4 (6.1.10): the official general feedback channels from the content layer, since MAHB
  // publishes no accessibility contact or response time in our sources (needs MAHB data).
  const contacts = contactViews(lang, t);
  const feedback = contacts.filter((contact) => contact.scope === t('common.appName') && (contact.kind === 'email' || contact.kind === 'phone'));
  const statementLimits: TKey[] = [
    'guidePages.accessibility.statement.limit1',
    'guidePages.accessibility.statement.limit2',
    'guidePages.accessibility.statement.limit3',
    'guidePages.accessibility.statement.limit4',
    'guidePages.accessibility.statement.limit5',
  ];

  return (
    <>
      {/* Redesign stage two: the light editorial header with the accessibility emblem; the section
          links as pills; sections separated by space, the settings on the one subtle band. */}
      {/* Polish (critique-redesign2 item 3): from 1024 px the right column is the first answer, how to
          ask for assistance (it was a wheelchair emblem); smaller screens reach the section first. */}
      <PageHero
        tone="light"
        asideClassName="max-lg:hidden"
        aside={
          <section aria-labelledby="hero-assistance-title" className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            <h2 id="hero-assistance-title" className="type-title-md text-ink">
              {t('guidePages.accessibility.assistance.title')}
            </h2>
            <p className="type-body-sm mt-1.5 text-ink-2">{t('guidePages.accessibility.assistance.lead')}</p>
            <ul className="mt-3 flex flex-col">
              {(
                [
                  ['plane', 'guidePages.accessibility.assistance.airlineTitle'],
                  ['tower-control', 'guidePages.accessibility.assistance.airportTitle'],
                ] as const
              ).map(([icon, label]) => (
                <li key={label}>
                  <a href="#assistance-title" className="group flex min-h-12 items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors duration-fast hover:bg-page-subtle">
                    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
                      <Icon name={icon} size="sm" />
                    </span>
                    <span className="type-title-sm min-w-0 flex-1 text-ink">{t(label)}</span>
                    <Icon name="arrow-down" size="sm" className="shrink-0 text-ink-3 transition-transform duration-fast motion-ok:group-hover:translate-y-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        }
        title={t('guidePages.accessibility.title')}
        lead={t('guidePages.accessibility.lead')}
        breadcrumbs={<Breadcrumbs items={[{ label: t('nav.help'), href: '/help' }, { label: t('guidePages.accessibility.title') }]} />}
        meta={
          <nav aria-label={t('guidePages.accessibility.nav.label')}>
            <ul className="flex flex-wrap gap-2">
              {NAV.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="type-body-sm inline-flex min-h-11 items-center gap-2 rounded-pill bg-surface px-4 font-medium text-ink shadow-xs ring-1 ring-line transition-[box-shadow] duration-fast hover:shadow-sm hover:ring-line-strong"
                  >
                    <Icon name={item.icon} size="sm" />
                    {t(item.label)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        }
      />

      <Container className="flex flex-col gap-20 pt-6 pb-section sm:gap-24 sm:pt-10">
        <section id="assistance" aria-labelledby="assistance-title" className="scroll-mt-32">
          <SectionHeading id="assistance-title" number={1} title={t('guidePages.accessibility.assistance.title')} lead={t('guidePages.accessibility.assistance.lead')} />
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="min-w-0">
              <h3 className="type-title-lg mb-5 text-ink">{t('guidePages.accessibility.assistance.airlineTitle')}</h3>
              <GuideSteps steps={data.airlineSteps} label={t('guidePages.accessibility.assistance.airlineTitle')} t={t} />
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1">
                <LocaleLink href="/guides/reduced-mobility" className="link-action type-body-sm text-ink">
                  {t('guidePages.accessibility.assistance.guideAction')}
                  <Icon name="arrow-right" size="sm" />
                </LocaleLink>
                <LocaleLink href="/guides/older-travellers" className="link-action type-body-sm text-ink">
                  {t('guidePages.accessibility.assistance.olderAction')}
                  <Icon name="arrow-right" size="sm" />
                </LocaleLink>
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="type-title-lg mb-5 text-ink">{t('guidePages.accessibility.assistance.airportTitle')}</h3>
              <GuideSteps steps={data.airportSteps} label={t('guidePages.accessibility.assistance.airportTitle')} t={t} />
            </div>
          </div>
          <h3 className="type-title-md mt-12 mb-4 text-ink">{t('guidePages.accessibility.assistance.contactsTitle')}</h3>
          <ContactList contacts={contacts} />
          {/* B-11 hand-off: set the needs My journey plans for, here where people look for help. */}
          <div className="mt-12 max-w-reading">
            <p className="type-body mb-4 text-ink-2">{t('guidePages.accessibility.assistance.needsLead')}</p>
            <NeedsControl headingLevel={3} />
          </div>
        </section>

        <section id="hidden-disabilities" aria-labelledby="hidden-title" className="scroll-mt-32">
          <SectionHeading
            id="hidden-title"
            number={2}
            title={t('guidePages.accessibility.butterfly.title')}
            lead={t('guidePages.accessibility.butterfly.lead')}
            action={
              <LocaleLink href="/guides/neurodivergent" className="link-action type-body-sm text-ink">
                {t('guidePages.accessibility.butterfly.action')}
                <Icon name="arrow-right" size="sm" />
              </LocaleLink>
            }
          />
          <div className="grid gap-12 lg:grid-cols-2">
            <GuideSteps steps={data.butterflySteps} label={t('guidePages.accessibility.butterfly.title')} t={t} />
            <div className="min-w-0">
              <h3 className="type-title-lg mb-4 text-ink">{t('guidePages.accessibility.butterfly.calmTitle')}</h3>
              {/* Round 6 (review-3 9.1 item 7): the places behind a disclosure on phones. */}
              <MoreOnPhones summary={t('guidePages.accessibility.butterfly.calmMore', { count: data.quietSpaces.length })}>
                <ul className="flex flex-col gap-3">
                  {data.quietSpaces.map((fact) => (
                    <li key={fact.id}>
                      <FactCard fact={fact} headingLevel={4} />
                    </li>
                  ))}
                </ul>
              </MoreOnPhones>
              <LocaleLink href="/kul/facilities?cat=calm-room" className="link-action type-body-sm mt-3 text-ink">
                {t('guidePages.accessibility.butterfly.directory')}
                <Icon name="arrow-right" size="sm" />
              </LocaleLink>
            </div>
          </div>
        </section>

        <section id="facilities" aria-labelledby="facilities-title" className="scroll-mt-32">
          <SectionHeading id="facilities-title" number={3} title={t('guidePages.accessibility.facilities.title')} lead={t('guidePages.accessibility.facilities.lead')} />
          <ul className="grid gap-4 md:grid-cols-3 lg:gap-5">
            {FACILITY_LINKS.map((item) =>
              // While no accessible toilet is published, the card must not send people to a map
              // that says they are not on it (D-11). The map link returns once points exist.
              item.id === 'toilets' && !data.accessibleToiletsPublished ? (
                <Card as="li" key={item.id} padding="md" className="flex min-w-0 flex-col gap-2 border-dashed border-line-strong">
                  <span aria-hidden="true" className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-gold-soft text-gold-ink">
                    <Icon name={item.icon} size="lg" />
                  </span>
                  <h3 className="type-title-md text-ink">{t(item.title)}</h3>
                  <p className="type-body-sm text-ink-2">{t('guidePages.accessibility.facilities.toiletsBodyUnpublished')}</p>
                  <ExternalLink href={data.specialAssistanceUrl} className="type-body-sm mt-auto pt-1 font-semibold text-ink">
                    {t('guidePages.accessibility.facilities.toiletsActionOfficial')}
                  </ExternalLink>
                </Card>
              ) : (
                <Card as="li" key={item.id} interactive padding="md" className="flex min-w-0 flex-col gap-2">
                  <span aria-hidden="true" className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-ink">
                    <Icon name={item.icon} size="lg" />
                  </span>
                  <h3 className="type-title-md text-ink">
                    <CardLink href={item.href}>{t(item.title)}</CardLink>
                  </h3>
                  <p className="type-body-sm text-ink-2">{t(item.body)}</p>
                  <span aria-hidden="true" className="type-body-sm mt-auto inline-flex items-center gap-1.5 pt-1 font-semibold text-ink">
                    {t(item.action)}
                    <Icon name="arrow-right" size="sm" />
                  </span>
                </Card>
              ),
            )}
          </ul>
          {data.otherFacilityAirports.length > 0 ? (
            <p className="type-body-sm mt-5 text-ink-2">
              {t('guidePages.accessibility.facilities.otherAirports')}{' '}
              {data.otherFacilityAirports.map((airport, index) => (
                <span key={airport.slug}>
                  {index > 0 ? (index === data.otherFacilityAirports.length - 1 ? ` ${t('guidePages.accessibility.facilities.and')} ` : ', ') : null}
                  <LocaleLink href={`/${airport.slug}/facilities?access=1`} className="link text-ink">
                    {airport.name}
                  </LocaleLink>
                </span>
              ))}
              .
            </p>
          ) : null}
        </section>

        {data.gaps ? (
          <section id="not-published" aria-labelledby="not-published-title" className="scroll-mt-32">
            <SectionHeading id="not-published-title" number={4} title={t('guidePages.accessibility.gaps.title')} lead={t('guidePages.accessibility.gaps.lead')} />
            <div className="grid gap-12 lg:grid-cols-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="type-title-md text-ink">{data.gaps.title}</h3>
                  <ProvenanceTag provenance="suggestion" length="short" />
                </div>
                <p className="type-body mt-2 max-w-reading text-ink-2">{data.gaps.body}</p>
                <SourceNote sources={data.gaps.sources} className="mt-1" />
              </div>
              <div className="min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
                <h3 className="type-title-md text-ink">{t('guidePages.accessibility.gaps.askTitle')}</h3>
                <ul className="type-body mt-3 flex list-disc flex-col gap-2 pl-5 text-ink-2">
                  <li>{t('guidePages.accessibility.gaps.askAirline')}</li>
                  <li>{t('guidePages.accessibility.gaps.askAirport')}</li>
                  <li>{t('guidePages.accessibility.gaps.chatHours')}</li>
                </ul>
                {data.careChatUrl ? (
                  <ExternalLink href={data.careChatUrl} className="type-body-sm mt-4 inline-flex font-semibold text-ink">
                    {t('guidePages.accessibility.gaps.chatAction')}
                  </ExternalLink>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </Container>

      <Section id="settings" tone="subtle" spacing="lg" aria-labelledby="settings-title" className="scroll-mt-32">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
          <SectionHeading id="settings-title" number={data.gaps ? 5 : 4} title={t('guidePages.accessibility.settings.title')} lead={t('guidePages.accessibility.settings.lead')} />
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-md sm:p-7">
            <PreferencesControls />
          </div>
        </div>
      </Section>

      <Container size="narrow" className="flex flex-col gap-12 py-section">
        <section id="statement" aria-labelledby="statement-title" className="scroll-mt-32">
          <SectionHeading id="statement-title" number={data.gaps ? 6 : 5} title={t('guidePages.accessibility.statement.title')} lead={t('guidePages.accessibility.statement.reviewed')} />
          <div className="flex max-w-reading flex-col gap-8">
            <p className="type-body-lg text-ink">{t('guidePages.accessibility.statement.intro')}</p>
            <div>
              <h3 className="type-title-md text-ink">{t('guidePages.accessibility.statement.focusTitle')}</h3>
              <p className="type-body mt-2 text-ink-2">{t('guidePages.accessibility.statement.focus')}</p>
            </div>
            {/* Round 6 (review-3 9.1 item 7): tests and limits behind a disclosure on phones. */}
            <MoreOnPhones summary={t('guidePages.accessibility.statement.moreTitle')} contentClassName="flex flex-col gap-8">
              <div>
                <h3 className="type-title-md text-ink">{t('guidePages.accessibility.statement.testedTitle')}</h3>
                <ul className="type-body mt-2 flex list-disc flex-col gap-2 pl-5 text-ink-2">
                  {statementTested.map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>
                <p className="type-body-sm mt-2 text-ink-2">{t('guidePages.accessibility.statement.testedBrowsers')}</p>
              </div>
              <div>
                <h3 className="type-title-md text-ink">{t('guidePages.accessibility.statement.limitsTitle')}</h3>
                <ul className="type-body mt-2 flex list-disc flex-col gap-2 pl-5 text-ink-2">
                  {statementLimits.map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>
              </div>
            </MoreOnPhones>
            <div>
              <h3 className="type-title-md text-ink">{t('guidePages.accessibility.statement.reportTitle')}</h3>
              <p className="type-body mt-2 text-ink-2" data-accessibility-contact="">
                {t('guidePages.accessibility.statement.contactNone')}
              </p>
              {feedback.length > 0 ? (
                <ul className="type-body mt-2 flex flex-col gap-1.5">
                  {feedback.map((contact) => (
                    <li key={contact.id} className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                      <span className="text-ink-2">{contact.label}:</span>
                      {contact.href ? (
                        <a href={contact.href} className="link font-semibold break-words text-ink">
                          {contact.value}
                        </a>
                      ) : (
                        <span className="font-semibold text-ink">{contact.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
              <SourceNote sources={feedback.flatMap((contact) => contact.sources).filter((source, index, all) => all.findIndex((other) => other.id === source.id) === index)} className="mt-1" />
              <p className="type-body mt-3 text-ink-2">{t('guidePages.accessibility.statement.report')}</p>
              <LocaleLink href="/help#contacts" className="link-action type-body-sm mt-1 text-ink">
                {t('guidePages.help.contactsTitle')}
                <Icon name="arrow-right" size="sm" />
              </LocaleLink>
            </div>
          </div>
        </section>
        <ProvenanceLegend headingLevel={2} />
      </Container>
    </>
  );
}
