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
        <figure key={statement.id} className="flex min-w-0 flex-col border-t-2 border-gold pt-5">
          <figcaption className="type-eyebrow text-gold-ink">{statement.label}</figcaption>
          <blockquote lang="en" className="type-display-md mt-4 text-ink">
            <p>“{statement.value}”</p>
          </blockquote>
          {statement.note ? <p className="type-body-sm mt-4 max-w-reading text-ink-2">{statement.note}</p> : null}
          <FactMeta className="mt-4" provenance={statement.provenance} dateLabel={asOfLabel(statement.asOf)} sources={statement.sources} />
        </figure>
      ))}
    </div>
  );
}
