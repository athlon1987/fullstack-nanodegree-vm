import type { Provenance, Source } from '@/content/types';
import { cn } from '@/lib/cn';
import { FactMeta } from './fact-meta';

export interface PersonView {
  id: string;
  name: string;
  role: string;
  /** "Since 18 June 2026". */
  since?: string;
  note?: string;
  provenance: Provenance;
  sources: Source[];
}

/** People in their roles. `lead` gives the Chairman and Managing Director more room. */
export function PersonList({ people, variant = 'compact', label }: { people: readonly PersonView[]; variant?: 'lead' | 'compact'; label: string }) {
  const lead = variant === 'lead';
  return (
    <ul aria-label={label} className={cn('grid gap-x-8', lead ? 'gap-y-8 md:grid-cols-2' : 'gap-y-0 sm:grid-cols-2 lg:grid-cols-3')}>
      {people.map((person) => (
        <li key={person.id} className={cn('min-w-0', lead ? 'rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6' : 'border-t border-line py-4')}>
          <p className={cn('text-ink', lead ? 'type-title-lg' : 'type-title-sm')}>{person.name}</p>
          <p className={cn('text-ink-2', lead ? 'type-body mt-1' : 'type-body-sm mt-0.5')}>{person.role}</p>
          {person.since ? <p className="type-caption mt-1 font-semibold text-ink-3">{person.since}</p> : null}
          {person.note ? <p className="type-body-sm mt-3 max-w-reading text-ink-2">{person.note}</p> : null}
          {lead ? <FactMeta className="mt-3" provenance={person.provenance} sources={person.sources} /> : null}
        </li>
      ))}
    </ul>
  );
}
