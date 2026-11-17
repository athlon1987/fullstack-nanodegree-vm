import { ExternalLink } from '@/components/common/external-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import type { OfficialLinkView } from './help-views.server';

/** Links to official Malaysia Airports pages, each from the source registry. */
export function OfficialLinks({ links, title }: { links: readonly OfficialLinkView[]; title: string }) {
  if (links.length === 0) return null;
  return (
    <section aria-labelledby="official-links-title" className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 id="official-links-title" className="type-title-md text-ink">
          {title}
        </h2>
        <ProvenanceTag provenance="official" length="short" />
      </div>
      <ul className="flex flex-col">
        {links.map((link) => (
          <li key={link.id}>
            <ExternalLink href={link.url} variant="action" className="type-body-sm text-ink">
              {link.label}
            </ExternalLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
