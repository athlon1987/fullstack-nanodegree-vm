import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { GROUP_CONTACTS, pick, resolveSources } from '@/content';
import { Suspense } from 'react';
import { getT, toLang } from '@/lib/i18n';
import { I18nPageScope } from '@/lib/i18n/page-scope';
import { ConciergeChat } from '@/components/concierge/concierge-chat';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ExternalLink } from '@/components/common/external-link';
import { PageHeader } from '@/components/common/page-header';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { SourceNote } from '@/components/common/source-note';
import { Container } from '@/components/ui/container';
import { Icon, type IconName } from '@/components/ui/icon';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(await routeLang());
  return { title: t('conciergePage.metaTitle'), description: t('conciergePage.metaDescription') };
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
      <PageHeader
        eyebrow={t('conciergePage.eyebrow')}
        title={t('conciergePage.pageTitle')}
        lead={t('conciergePage.lead')}
        breadcrumbs={<Breadcrumbs items={[{ label: t('conciergePage.title') }]} />}
      />
      <Container className="grid items-start gap-10 pb-section lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:gap-12">
        <section aria-labelledby="concierge-conversation" className="min-w-0 sm:rounded-xl sm:border sm:border-line-strong sm:bg-surface sm:p-7 sm:shadow-sm">
          <h2 id="concierge-conversation" className="sr-only">
            {t('conciergePage.log.label')}
          </h2>
          <noscript>
            <p className="type-body mb-4 text-ink-2">{t('conciergePage.noScript')}</p>
          </noscript>
          {/* Round 5: the concierge copy comes with this page only (`PARTIAL_NAMESPACES`), and the
              conversation hydrates in its own boundary, after the page's first hydration task
              (nothing in it suspends; a tap or key press in it before then hydrates it at once). */}
          <I18nPageScope namespaces={['conciergePage']}>
            <Suspense>
              <ConciergeChat variant="page" />
            </Suspense>
          </I18nPageScope>
        </section>

        <aside className="flex min-w-0 flex-col gap-10" aria-label={t('conciergePage.aside.howTitle')}>
          <section aria-labelledby="concierge-how">
            <h2 id="concierge-how" className="type-title-md mb-4 text-ink">
              {t('conciergePage.aside.howTitle')}
            </h2>
            <ol className="flex flex-col gap-4">
              {how.map((text, index) => (
                <li key={text} className="flex items-start gap-3">
                  <span aria-hidden="true" className="type-data-sm flex size-7 shrink-0 items-center justify-center rounded-pill border border-line-strong text-ink-2">
                    {index + 1}
                  </span>
                  <p className="type-body text-ink-2">{text}</p>
                </li>
              ))}
            </ol>
          </section>

          <ProvenanceLegend headingLevel={2} />

          <section aria-labelledby="concierge-contacts" className="rounded-lg border border-line bg-page-subtle p-5">
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
      </Container>
    </>
  );
}
