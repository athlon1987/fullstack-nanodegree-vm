import { pick } from '@/content/values';
import type { Lang, TransportOption } from '@/content/types';
import type { Translator } from '@/lib/i18n/translate';
import { ProvenanceDefault, ProvenanceTag } from '@/components/common/provenance-tag';
import { sharedProvenance } from '@/components/common/shared-provenance';
import { SectionHeading } from '@/components/common/section-heading';
import { sectionSources } from '@/components/common/section-sources';
import { SourceNote } from '@/components/common/source-note';
import { Callout } from '@/components/ui/callout';
import { TransportOptionCard } from './transport-option-card';
import type { NoteView, TransportContext } from './transport-types';

export interface TerminalTransfersProps {
  t: Translator;
  lang: Lang;
  context: TransportContext;
  between: readonly TransportOption[];
  inside: readonly TransportOption[];
  notes: readonly NoteView[];
}

/**
 * Moving between terminals (for KLIA: train and free shuttle, landside only) and inside one
 * terminal (people movers). The transit advice from the content layer leads, as a warning,
 * because changing terminals means clearing immigration and checking in again.
 */
export function TerminalTransfers({ t, lang, context, between, inside, notes }: TerminalTransfersProps) {
  const betweenProvenance = sharedProvenance(between);
  return (
    <>
      {between.length > 0 ? (
        <section id="between-terminals" aria-labelledby="between-terminals-title" className="scroll-mt-32 border-t border-line pt-10">
          <SectionHeading id="between-terminals-title" title={t('transportPages.terminals.title')} lead={t('transportPages.terminals.lead')} variant="title" />
          <div className="flex flex-col gap-4">
            {notes.map((note) => (
              <Callout key={note.id} tone="warning" title={note.title} className="max-w-narrow">
                <p>{note.body}</p>
                {/* Round 4 (A-14): a tag only where it differs from the section's; sources in the section list. */}
                {note.provenance !== betweenProvenance ? <ProvenanceTag provenance={note.provenance} className="mt-2" /> : null}
              </Callout>
            ))}
            {/* Round 2 (A-14): the provenance the options share, said once; the others keep their tag. */}
            {betweenProvenance ? <ProvenanceDefault provenance={betweenProvenance} className="-mb-2" /> : null}
            <ul className="grid items-start gap-4 xl:grid-cols-2">
              {between.map((option) => (
                <li key={option.id} className="min-w-0">
                  <TransportOptionCard option={option} context={context} day={null} defaultProvenance={betweenProvenance} groupedSources />
                </li>
              ))}
            </ul>
            <SectionSourceList
              t={t}
              items={[...notes.map((note) => ({ name: note.title, ids: note.sourceIds })), ...between.map((option) => ({ name: pick(option.name, lang), ids: option.sources }))]}
              context={context}
            />
          </div>
        </section>
      ) : null}

      {inside.length > 0 ? (
        <section aria-labelledby="inside-terminal-title" className="border-t border-line pt-10">
          <SectionHeading id="inside-terminal-title" title={t('transportPages.terminals.insideTitle')} lead={t('transportPages.terminals.insideLead')} variant="title" />
          <ul className="grid items-start gap-4 xl:grid-cols-2">
            {inside.map((option) => (
              <li key={option.id} className="min-w-0">
                <TransportOptionCard option={option} context={context} day={null} groupedSources />
              </li>
            ))}
          </ul>
          <SectionSourceList t={t} items={inside.map((option) => ({ name: pick(option.name, lang), ids: option.sources }))} context={context} />
        </section>
      ) : null}
    </>
  );
}

/** Round 4 (A-14): the section's sources, listed once, each naming the items it supports. */
function SectionSourceList({ t, items, context }: { t: Translator; items: { name: string; ids: readonly string[] }[]; context: TransportContext }) {
  const listed = sectionSources(items, (item) => item.ids, (item) => item.name, context.sources);
  if (listed.sources.length === 0) return null;
  return (
    <div data-section-sources="">
      <SourceNote sources={listed.sources} citedBy={items.length > 1 ? listed.citedBy : undefined} label={t('shellExtras.sourceLists.section')} />
    </div>
  );
}
