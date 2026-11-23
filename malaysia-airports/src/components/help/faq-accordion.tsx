'use client';

import { useState, useSyncExternalStore } from 'react';
import { formatAsOf } from '@/content/values';
import { useLang, useT } from '@/lib/i18n/client';
import { formatDate } from '@/lib/time';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Chip } from '@/components/ui/chip';
import { CopyLinkButton } from './copy-link-button';
import type { FaqView } from './help-views.server';

function subscribeHash(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}
const readHash = () => decodeURIComponent(window.location.hash.slice(1));
const serverHash = () => '';

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

/**
 * FAQs as an accordion. Every answer is deep-linkable: `/help/<topic>#<faq-id>` opens it, and
 * each answer has a copy-link button. Several answers can stay open at once.
 */
export function FaqAccordion({ faqs, headingLevel = 3 }: { faqs: readonly FaqView[]; headingLevel?: 2 | 3 }) {
  const t = useT();
  const lang = useLang();
  const hash = useSyncExternalStore(subscribeHash, readHash, serverHash);
  const [open, setOpen] = useState<string[]>([]);
  const [seenHash, setSeenHash] = useState('');
  // Adjust state when the URL hash changes (React's "derive from a changing value" pattern).
  if (hash !== seenHash) {
    setSeenHash(hash);
    if (faqs.some((faq) => faq.id === hash) && !open.includes(hash)) setOpen([...open, hash]);
  }

  return (
    // Redesign stage two: the answers sit in one white card; rows are separated inside it.
    <Accordion type="multiple" value={open} onValueChange={setOpen} className="rounded-2xl border border-line bg-surface px-5 shadow-sm sm:px-7 [&>*:last-child]:border-b-0">
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} id={faq.id} value={faq.id} title={faq.question} headingLevel={headingLevel} className="scroll-mt-32">
          <p className="type-body text-ink">{faq.answer}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <ProvenanceTag provenance={faq.provenance} length="short" />
            {faq.airports.map((airport) => (
              <Chip key={airport.code} tone="outline" icon="airport">
                {t('guidePages.help.topic.airportOnly', { airport: airport.name })}
              </Chip>
            ))}
            {faq.asOf ? (
              <span className="type-caption text-ink-2">{t('freshness.asOf', { date: isoDate.test(faq.asOf) ? formatDate(faq.asOf, lang) : formatAsOf(faq.asOf, lang) })}</span>
            ) : null}
            <CopyLinkButton anchor={faq.id} />
          </div>
          <SourceNote sources={faq.sources} className="mt-1" />
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/** The same answers as plain HTML, for browsers without JavaScript (the accordion needs it to open). */
export function FaqStatic({ faqs }: { faqs: readonly FaqView[] }) {
  return (
    <ul className="flex flex-col gap-6">
      {faqs.map((faq) => (
        <li key={faq.id}>
          <h3 className="type-title-sm text-ink">{faq.question}</h3>
          <p className="type-body mt-1 text-ink-2">{faq.answer}</p>
        </li>
      ))}
    </ul>
  );
}
