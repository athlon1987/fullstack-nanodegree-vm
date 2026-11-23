import type { FactView } from './corporate-data.server';
import { FactMeta } from './fact-meta';

/**
 * The vision and brand promise as pull quotes. Both are published in English only, so the
 * quotes carry `lang="en"` on the Malay pages too.
 */
export function BrandStatement({ statements, asOfLabel }: { statements: readonly FactView[]; asOfLabel: (date: string) => string }) {
  return (
    <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
      {statements.map((statement) => (
        <figure key={statement.id} className="flex min-w-0 flex-col">
          <figcaption className="type-eyebrow flex items-center gap-3 text-gold-ink">
            <span aria-hidden="true" className="h-px w-8 bg-gold" />
            {statement.label}
          </figcaption>
          {/* Fraunces as the editorial accent: the one serif pull quote of the page, at the section
              heading's size so the corporate hub keeps to eight type sizes (A-14). */}
          <blockquote lang="en" className="type-serif-lg mt-5 text-[length:clamp(1.625rem,1.25rem_+_1.5vw,2.5rem)]! text-ink [text-wrap:balance]">
            <p>“{statement.value}”</p>
          </blockquote>
          {statement.note ? <p className="type-body-sm mt-4 max-w-reading text-ink-2">{statement.note}</p> : null}
          <FactMeta className="mt-4" provenance={statement.provenance} dateLabel={asOfLabel(statement.asOf)} sources={statement.sources} />
        </figure>
      ))}
    </div>
  );
}
