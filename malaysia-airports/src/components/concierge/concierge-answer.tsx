'use client';

import { useId, useState } from 'react';
import type { AnswerContact, ConciergeAnswer, ConciergeContext, ConciergeMode } from '@/lib/concierge/types';
import { cn } from '@/lib/cn';
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

/** The labelled details of an answer, each with its provenance and a link to the page. */
function Statements({ statements }: { statements: ConciergeAnswer['statements'] }) {
  const t = useT();
  if (statements.length === 0) return null;
  return (
    <ul aria-label={t('conciergePage.answer.details')} className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
      {statements.map((statement, index) => (
        <li key={`${index}:${statement.text.slice(0, 24)}`} className="flex flex-col gap-2 px-4 py-4 sm:px-5">
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
  );
}

const MODE_ICON: Record<ConciergeMode, IconName> = { grounded: 'badge-check', 'grounded-rephrased': 'sparkles', local: 'wifi-off' };

export interface ConciergeAnswerViewProps {
  answer: ConciergeAnswer;
  mode: ConciergeMode;
  note?: 'offline' | 'rate-limited' | 'private';
  onAsk: (question: string, context?: ConciergeContext) => void;
  busy: boolean;
}

/** How many cards (or, without cards, detail statements) a phone shows before "More" (round 4, 6.1.4). */
const PHONE_ITEMS = 2;

/**
 * One answer: the short reply, then the labelled details, places, next steps, contacts and sources.
 *
 * On a phone (an answer narrower than the `@lg` container size) the answer shows its lead line
 * and two cards; everything else sits behind a "More" disclosure button (`aria-expanded`,
 * `aria-controls`), so one turn no longer runs to 2,300 px and buries the next question (round 4,
 * re-review 6.1.4). Wider answers show everything and hide the button. CSS decides, not the
 * clock or `window`, so the server and the browser render the same markup.
 */
export function ConciergeAnswerView({ answer, mode, note, onAsk, busy }: ConciergeAnswerViewProps) {
  const t = useT();
  const moreId = useId();
  const [expanded, setExpanded] = useState(false);
  const firstCards = answer.cards.slice(0, PHONE_ITEMS);
  const moreCards = answer.cards.slice(PHONE_ITEMS);
  // Round 6 (third review 9.1 item 4): one lead line and at most two cards before "More". With
  // cards, the details wait behind "More" (the fare was stated in the lead, a card and a detail);
  // the detail the lead was taken from is labelled under the lead and also waits there.
  const leadSource = answer.statements.find((statement) => statement.text.startsWith(answer.text.replace(/\.$/, '')));
  // A detail that only repeats the lead word for word is not shown twice: its label and link sit under the lead.
  const leadOnly = leadSource !== undefined && !leadSource.title && leadSource.text.trim() === answer.text.trim();
  const rest = answer.statements.filter((statement) => statement !== leadSource);
  const statementRoom = firstCards.length > 0 ? 0 : 1;
  const firstStatements = rest.slice(0, statementRoom);
  const moreStatements = [...(leadSource && !leadOnly ? [leadSource] : []), ...rest.slice(statementRoom)];
  // With nothing else to show (no card, no detail), the official contacts show at once: for
  // "I can't answer that" they are the answer, with numbers to tap.
  const escalationFirst = answer.escalation !== undefined && firstCards.length + firstStatements.length === 0;
  const hiddenCount = moreCards.length + moreStatements.length + answer.limits.length + (answer.escalation && !escalationFirst ? 1 : 0) + (answer.actions.length > 0 ? 1 : 0);

  return (
    <div className="@container flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <p className="type-body-lg self-start rounded-3xl rounded-tl-md bg-page-subtle px-4 py-3 text-ink @md:px-5 @md:py-3.5">{answer.text}</p>
        {leadSource ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <ProvenanceTag provenance={leadSource.provenance} length="short" />
            {leadOnly && leadSource.href ? (
              <LocaleLink
                href={leadSource.href}
                aria-label={t('conciergePage.answer.detailsFor', { name: leadSource.text.slice(0, 60) })}
                className="link-action type-body-sm inline-flex items-center gap-1"
              >
                {t('conciergePage.answer.details_link')}
                <Icon name="arrow-right" size="xs" />
              </LocaleLink>
            ) : null}
          </div>
        ) : null}
      </div>
      {answer.hint ? (
        <p className="type-body flex items-start gap-2 text-ink-2">
          <Icon name="lightbulb" size="sm" className="mt-1 shrink-0" />
          <span>{answer.hint}</span>
        </p>
      ) : null}

      {answer.demo ? (
        <div className="flex flex-col gap-2">
          <DemoDataBanner>{t('conciergePage.answer.demoBanner')}</DemoDataBanner>
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

      <ConciergeCards cards={firstCards} />
      <Statements statements={firstStatements} />
      {answer.escalation && escalationFirst ? <Escalation escalation={answer.escalation} /> : null}

      {hiddenCount > 0 ? (
        <>
          <Button
            variant="secondary"
            size="sm"
            className="self-start @lg:hidden"
            iconEnd={expanded ? 'chevron-up' : 'chevron-down'}
            aria-expanded={expanded}
            aria-controls={moreId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t('conciergePage.answer.less') : t.count('conciergePage.answer.more', hiddenCount)}
          </Button>

          {/* Behind "More" on a phone; always shown on wider answers. */}
          <div id={moreId} className={cn('flex-col gap-4', expanded ? 'flex' : 'hidden @lg:flex')}>
            {answer.limits.length > 0 ? (
              <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-4 py-3.5">
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

            <ConciergeCards cards={moreCards} />
            <Statements statements={moreStatements} />

            {answer.escalation && !escalationFirst ? <Escalation escalation={answer.escalation} /> : null}

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
          </div>
        </>
      ) : null}

      <div className="flex flex-col gap-1.5 border-t border-line pt-3.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="type-caption inline-flex min-h-7 items-center gap-1.5 rounded-pill bg-fill px-2.5 font-semibold text-ink-2">
            <Icon name={note === 'private' ? 'shield-check' : MODE_ICON[mode]} size="xs" />
            {mode === 'grounded' ? t('conciergePage.mode.grounded') : mode === 'grounded-rephrased' ? t('conciergePage.mode.rephrased') : t('conciergePage.mode.local')}
          </span>
          <SourceNote sources={answer.sources} />
        </div>
        {mode === 'local' ? (
          <p className="type-caption text-ink-2">
            {note === 'private' ? t('conciergePage.onDevice.privateHint') : note === 'rate-limited' ? t('conciergePage.mode.rateLimited') : t('conciergePage.mode.localHint')}
          </p>
        ) : null}
        {answer.translationFallback ? <TranslationNotice /> : null}
      </div>
    </div>
  );
}
