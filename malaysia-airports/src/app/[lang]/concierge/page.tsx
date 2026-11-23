import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { GROUP_CONTACTS, pick, resolveSources } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { I18nPageScope } from '@/lib/i18n/page-scope';
import { ConciergeChat } from '@/components/concierge/concierge-chat';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ExternalLink } from '@/components/common/external-link';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { SourceNote } from '@/components/common/source-note';
import { Container } from '@/components/ui/container';
import { Icon, type IconName } from '@/components/ui/icon';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(await routeLang());
  return { alternates: languageAlternates(await routeLang(), '/concierge'), title: t('conciergePage.metaTitle'), description: t('conciergePage.metaDescription') };
}

const CONTACT_ICONS: Record<string, IconName> = { phone: 'phone', email: 'mail', web: 'globe', chat: 'messages-square', app: 'smartphone' };

/**
 * The concierge as a full page. The conversation is a Client Component (it needs consent,
 * session storage and the network); everything around it is static HTML, so the official
 * contacts and the explanation of how answers are built work without JavaScript.
 */
export default async function ConciergePage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const how = [t('conciergePage.aside.how1'), t('conciergePage.aside.how2'), t('conciergePage.aside.how3')];
  return (
    <>
      {/* Redesign three (phone first): a compact header instead of the midnight band, so the
          suggestions and the question field are on the first phone screen (the conversation
          started at y 1,430 at 390 x 844). The title and one short line; the full lead and the three
          steps of how an answer is built stay one tap away, in a native disclosure. The `h1` is
          static HTML, as before. From 1024 px the conversation and the side column sit in one calm
          row under the same header. */}
      <div className="bg-linear-to-b from-surface to-page">
        <Container className="pt-3 pb-section sm:pt-4">
          <div data-page-breadcrumbs="" className="mb-4 sm:mb-8">
            <Breadcrumbs items={[{ label: t('conciergePage.title') }]} />
          </div>
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:gap-14">
            <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
              <header className="flex flex-col gap-2.5">
                {/* Closing fix (VA6 item 6): the title starts at the page's text edge, as on every
                    other page (x 148 at 1440 px, 16 at 390), and the sparkle tile follows it as the
                    concierge's mark. It came first, so the h1 started at x 220 and 72. Same row
                    height, so nothing below it moves. */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <h1 className="type-display-md text-balance text-ink">{t('conciergePage.pageTitle')}</h1>
                  </div>
                  <span
                    aria-hidden="true"
                    className="surface-midnight flex size-11 shrink-0 items-center justify-center rounded-2xl text-gold-bright shadow-md ring-1 ring-gold/40 sm:size-14"
                  >
                    <Icon name="sparkles" className="sm:size-6" />
                  </span>
                </div>
                <p className="type-body max-w-reading text-ink-2 [text-wrap:pretty]">{t('conciergePage.shortLead')}</p>
                <HowAnswers id="concierge-how" title={t('conciergePage.aside.howTitle')} lead={t('conciergePage.lead')} steps={how} />
              </header>

              <section
                aria-labelledby="concierge-conversation"
                className="relative z-10 min-w-0 sm:rounded-3xl sm:border sm:border-line sm:bg-surface sm:p-8 sm:shadow-lg"
              >
                <h2 id="concierge-conversation" className="sr-only">
                  {t('conciergePage.log.label')}
                </h2>
                <noscript>
                  <p className="type-body mb-4 text-ink-2">{t('conciergePage.noScript')}</p>
                </noscript>
                {/* Round 5 (E-11): the concierge copy comes with this page only (`PARTIAL_NAMESPACES`). */}
                <I18nPageScope namespaces={['conciergePage']}>
                  <ConciergeChat variant="page" />
                </I18nPageScope>
              </section>
            </div>

            <aside className="flex min-w-0 flex-col gap-10 lg:pt-2" aria-label={t('conciergePage.aside.contactsTitle')}>
              <ProvenanceLegend headingLevel={2} />

              <section aria-labelledby="concierge-contacts" className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
                <h2 id="concierge-contacts" className="type-title-md text-ink">
                  {t('conciergePage.aside.contactsTitle')}
                </h2>
                <p className="type-body-sm mt-1 text-ink-2">{t('conciergePage.aside.contactsLead')}</p>
                <ul className="mt-4 flex flex-col gap-3.5">
                  {GROUP_CONTACTS.map((contact) => (
                    <li key={contact.value} className="flex items-start gap-3">
                      <Icon name={CONTACT_ICONS[contact.kind] ?? 'info'} size="sm" className="mt-1 shrink-0 text-ink-2" />
                      <div className="min-w-0">
                        <p className="type-body-sm text-ink-2">{pick(contact.label, lang)}</p>
                        {contact.href?.startsWith('http') ? (
                          <ExternalLink href={contact.href}>{contact.value}</ExternalLink>
                        ) : contact.href ? (
                          <a href={contact.href} className="link type-body font-medium break-words">
                            {contact.value}
                          </a>
                        ) : (
                          <p className="type-body font-medium text-ink">{contact.value}</p>
                        )}
                        {contact.note ? <p className="type-caption mt-0.5 text-ink-2">{pick(contact.note, lang)}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
                <SourceNote className="mt-3" sources={resolveSources([...new Set(GROUP_CONTACTS.flatMap((contact) => contact.sources))])} />
              </section>

              <section aria-labelledby="concierge-privacy">
                <h2 id="concierge-privacy" className="type-title-md text-ink">
                  {t('conciergePage.aside.privacyTitle')}
                </h2>
                <p className="type-body mt-2 text-ink-2">{t('conciergePage.aside.privacy')}</p>
              </section>
            </aside>
          </div>
        </Container>
      </div>
    </>
  );
}

/**
 * "How answers are put together" as one quiet line that opens in place (a native `<details>`: it
 * works without JavaScript, and screen readers announce it as expanded or collapsed). Inside, the
 * page's full lead and the three steps. The privacy line above the conversation stays visible.
 */
function HowAnswers({ id, title, lead, steps }: { id: string; title: string; lead: string; steps: readonly string[] }) {
  return (
    <details className="group/how max-w-reading">
      <summary className="type-body-sm inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-sm font-medium text-ink-2 hover:text-ink focus-visible:focus-ring [&::-webkit-details-marker]:hidden">
        <Icon name="shield-check" size="sm" className="shrink-0 text-gold-ink" />
        <span id={id}>{title}</span>
        <Icon name="chevron-down" size="sm" strokeWidth={1.75} className="shrink-0 transition-transform duration-fast group-open/how:rotate-180" />
      </summary>
      <div className="mt-2 rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5">
        <p className="type-body-sm text-ink-2">{lead}</p>
        <ol aria-labelledby={id} className="mt-4 flex flex-col gap-3">
          {steps.map((text, index) => (
            <li key={text} className="flex items-start gap-3">
              <span aria-hidden="true" className="type-data-sm flex size-7 shrink-0 items-center justify-center rounded-pill bg-primary-soft text-primary-ink">
                {index + 1}
              </span>
              <p className="type-body-sm text-ink-2">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
