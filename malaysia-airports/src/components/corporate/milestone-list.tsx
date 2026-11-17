import type { Provenance, Source } from '@/content/types';
import { FactMeta } from './fact-meta';

export interface MilestoneView {
  id: string;
  /** The year, shown large. */
  year: string;
  /** The full date in words, when more precise than the year. */
  dateLabel?: string;
  title: string;
  body?: string;
  provenance: Provenance;
  sources: Source[];
}

/**
 * History as an editorial ledger: the year in the display face on the left, what happened on
 * the right, a hairline between entries. An ordered list, oldest first.
 */
export function MilestoneList({ items }: { items: readonly MilestoneView[] }) {
  return (
    <ol>
      {items.map((item, index) => {
        const showYear = index === 0 || items[index - 1].year !== item.year;
        return (
          <li key={item.id} className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-5 border-t border-line py-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-10">
            <p className="type-display-sm tabular text-ink" aria-hidden={showYear ? undefined : true}>
              {showYear ? item.year : null}
            </p>
            <div className="min-w-0">
              {item.dateLabel ? <p className="type-caption mb-1 font-semibold text-ink-3">{item.dateLabel}</p> : <span className="sr-only">{item.year}</span>}
              <h3 className="type-title-md text-ink">{item.title}</h3>
              {item.body ? <p className="type-body mt-1.5 max-w-reading text-ink-2">{item.body}</p> : null}
              <FactMeta className="mt-2" provenance={item.provenance} sources={item.sources} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
