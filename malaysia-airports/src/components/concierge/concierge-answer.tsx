'use client';

import type { AnswerContact, ConciergeAnswer, ConciergeContext, ConciergeMode } from '@/lib/concierge/types';
import { useT } from '@/lib/i18n/client';
import { DemoDataBanner } from '@/components/common/demo-data-banner';
import { ExternalLink } from '@/components/common/external-link';
import { Freshness } from '@/components/common/freshness';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { TranslationNotice } from '@/components/common/translation-notice';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Icon, type IconName } from '@/components/ui/icon';
import { ConciergeCards } from './concierge-cards';

const CONTACT_ICONS: Record<AnswerContact['kind'], IconName> = { phone: 'phone', email: 'mail', web: 'globe', chat: 'messages-square', app: 'smartphone' };

function ContactValue({ contact }: { contact: AnswerContact }) {
  if (contact.href?.startsWith('http')) return <ExternalLink href={contact.href}>{contact.value}</ExternalLink>;
  if (contact.href) {
    return (
      <a href={contact.href} className="link tabular">
        {contact.value}
      </a>
    );
  }
  return <span>{contact.value}</span>;
}

function Escalation({ escalation }: { escalation: NonNullable<ConciergeAnswer['escalation']> }) {
  const t = useT();
  return (
    <Callout tone="neutral" icon="hand-helping" title={t('conciergePage.answer.escalationTitle')}>
      <p>{escalation.text}</p>
      <ul aria-label={t('conciergePage.answer.contactsLabel')} className="mt-3 flex flex-col gap-2.5">
        {escalation.airline ? (
          <li className="flex items-start gap-2.5">
            <Icon name="plane" size="sm" className="mt-0.5 shrink-0 text-ink-2" />
            <span className="text-ink">{t('conciergePage.answer.airlineContact')}</span>
          </li>
        ) : null}
        {escalation.contacts.map((contact) => (
          <li key={`${contact.kind}:${contact.value}`} className="flex items-start gap-2.5">
            <Icon name={CONTACT_ICONS[contact.kind]} size="sm" className="mt-0.5 shrink-0 text-ink-2" />
            <span className="min-w-0">
              <span className="block text-ink-2">{contact.label}</span>
              <span className="block font-medium break-words text-ink">
                <ContactValue contact={contact} />
              </span>
              {contact.note ? <span className="type-caption block text-ink-2">{contact.note}</span> : null}
            </span>
          </li>
        ))}
        {escalation.officialUrl ? (
          <li className="flex items-start gap-2.5">
            <Icon name="globe" size="sm" className="mt-0.5 shrink-0 text-ink-2" />
            <ExternalLink href={escalation.officialUrl}>{t('conciergePage.answer.officialSite')}</ExternalLink>
          </li>
        ) : null}
      </ul>
    </Callout>
  );
}

const MODE_ICON: Record<ConciergeMode, IconName> = { grounded: 'badge-check', 'grounded-rephrased': 'sparkles', local: 'wifi-off' };

export interface ConciergeAnswerViewProps {
  answer: ConciergeAnswer;
  mode: ConciergeMode;
  note?: 'offline' | 'rate-limited';
  onAsk: (question: string, context?: ConciergeContext) => void;
  busy: boolean;
}

/** One answer: the short reply, then the labelled details, places, next steps, contacts and sources. */
export function ConciergeAnswerView({ answer, mode, note, onAsk, busy }: ConciergeAnswerViewProps) {
  const t = useT();
  return (
    <div className="@container flex min-w-0 flex-col gap-4">
      <p className="type-body-lg text-ink">{answer.text}</p>

      {answer.demo ? (
        <div className="flex flex-col gap-2">
          <DemoDataBanner compact>{t('conciergePage.answer.demoBanner')}</DemoDataBanner>
          {answer.demoGeneratedAt ? <Freshness updatedAt={answer.demoGeneratedAt} live="off" /> : null}
        </div>
      ) : null}

      {answer.clarify ? (
        <div role="group" aria-label={t('conciergePage.answer.chooseAirport')} className="flex flex-wrap gap-2">
          {answer.clarify.options.map((option) => (
            <Button key={option.label} variant="secondary" size="sm" disabled={busy} onClick={() => onAsk(answer.question, option.context)}>
              {option.label}
            </Button>
          ))}
        </div>
      ) : null}

      {answer.limits.length > 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-page-subtle px-4 py-3">
          <p className="type-eyebrow mb-1.5 text-ink-2">{t('conciergePage.answer.limitsLabel')}</p>
          <ul className="flex flex-col gap-1.5">
            {answer.limits.map((limit) => (
              <li key={limit} className="type-body flex items-start gap-2 text-ink">
                <Icon name="info" size="sm" className="mt-1 shrink-0 text-ink-2" />
                <span>{limit}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {answer.statements.length > 0 ? (
        <ul aria-label={t('conciergePage.answer.details')} className="flex flex-col divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {answer.statements.map((statement, index) => (
            <li key={`${index}:${statement.text.slice(0, 24)}`} className="flex flex-col gap-2 px-4 py-3.5">
              {statement.title ? <p className="type-title-sm text-ink">{statement.title}</p> : null}
              <p className="type-body text-ink-2">{statement.text}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <ProvenanceTag provenance={statement.provenance} length="short" />
                {statement.href ? (
                  <LocaleLink
                    href={statement.href}
                    aria-label={t('conciergePage.answer.detailsFor', { name: statement.title ?? statement.text.slice(0, 60) })}
                    className="link-action type-body-sm inline-flex items-center gap-1"
                  >
                    {t('conciergePage.answer.details_link')}
                    <Icon name="arrow-right" size="xs" />
                  </LocaleLink>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <ConciergeCards cards={answer.cards} />

      {answer.escalation ? <Escalation escalation={answer.escalation} /> : null}

      {answer.actions.length > 0 ? (
        <ul aria-label={t('conciergePage.answer.nextSteps')} className="flex flex-wrap gap-2">
          {answer.actions.map((action) => (
            <li key={action.kind === 'link' ? action.href : action.question}>
              {action.kind === 'link' ? (
                <Button asChild variant="secondary" size="sm" iconStart={(action.icon as IconName | undefined) ?? 'arrow-right'}>
                  <LocaleLink href={action.href}>{action.label}</LocaleLink>
                </Button>
              ) : (
                <Button variant="secondary" size="sm" iconStart="messages-square" disabled={busy} onClick={() => onAsk(action.question, action.context)}>
                  {action.label}
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-1.5 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="type-caption inline-flex items-center gap-1.5 font-semibold text-ink-2">
            <Icon name={MODE_ICON[mode]} size="xs" />
            {mode === 'grounded' ? t('conciergePage.mode.grounded') : mode === 'grounded-rephrased' ? t('conciergePage.mode.rephrased') : t('conciergePage.mode.local')}
          </span>
          <SourceNote sources={answer.sources} />
        </div>
        {mode === 'local' ? <p className="type-caption text-ink-2">{note === 'rate-limited' ? t('conciergePage.mode.rateLimited') : t('conciergePage.mode.localHint')}</p> : null}
        {answer.translationFallback ? <TranslationNotice /> : null}
      </div>
    </div>
  );
}
