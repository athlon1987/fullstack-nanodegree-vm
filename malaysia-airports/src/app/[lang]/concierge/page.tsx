import { cn } from '@/lib/cn';
import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { GROUP_CONTACTS, pick, resolveSources } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { I18nPageScope } from '@/lib/i18n/page-scope';
import { ConciergeChat } from '@/components/concierge/concierge-chat';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ExternalLink } from '@/components/common/external-link';
import { PageHero } from '@/components/guides/page-hero';
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
      {/* Redesign stage two: the midnight band with the concierge's emblem; the conversation is a
          white card that rises into the band, the explanation and official contacts beside it. */}
      {/* Polish (critique-redesign2 item 3): from 1024 px the band's right column explains how an
          answer is put together (it was a sparkle emblem); smaller screens keep it beside the chat. */}
      <PageHero
        tone="midnight"
        eyebrow={t('conciergePage.eyebrow')}
        asideClassName="max-lg:hidden"
        aside={<HowAnswers id="concierge-how-band" title={t('conciergePage.aside.howTitle')} steps={how} tone="band" />}
        title={t('conciergePage.pageTitle')}
        lead={t('conciergePage.lead')}
        breadcrumbs={<Breadcrumbs items={[{ label: t('conciergePage.title') }]} />}
        className="pb-8 sm:pb-12"
      />
      <Container className="grid items-start gap-10 pb-section max-sm:pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:gap-12">
        <section
          aria-labelledby="concierge-conversation"
          className="relative z-10 min-w-0 sm:-mt-12 sm:rounded-3xl sm:border sm:border-line sm:bg-surface sm:p-8 sm:shadow-xl"
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

        <aside className="flex min-w-0 flex-col gap-10 lg:pt-10" aria-label={t('conciergePage.aside.contactsTitle')}>
          <HowAnswers id="concierge-how" title={t('conciergePage.aside.howTitle')} steps={how} className="lg:hidden" />

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
      </Container>
    </>
  );
}

/** The three steps of "How answers are put together": in the band's right column, or on the page. */
function HowAnswers({ id, title, steps, tone = 'page', className }: { id: string; title: string; steps: readonly string[]; tone?: 'band' | 'page'; className?: string }) {
  const band = tone === 'band';
  return (
    <section aria-labelledby={id} className={cn(band && 'glass-dark rounded-3xl p-5 sm:p-6', className)}>
      <h2 id={id} className="type-title-md mb-4 text-ink">
        {title}
      </h2>
      <ol className="flex flex-col gap-4">
        {steps.map((text, index) => (
          <li key={text} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn('type-data-sm flex size-8 shrink-0 items-center justify-center rounded-pill', band ? 'bg-gold text-on-gold' : 'bg-primary text-on-primary')}
            >
              {index + 1}
            </span>
            <p className={cn('text-ink-2', band ? 'type-body-sm' : 'type-body')}>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
