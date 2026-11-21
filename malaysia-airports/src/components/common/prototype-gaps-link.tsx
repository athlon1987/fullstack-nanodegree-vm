import type { Lang } from '@/content';
import { getT } from '@/lib/i18n';
import { ExternalLink } from './external-link';
import { LocaleLink } from './locale-link';

export interface PrototypeGapsLinkProps {
  lang: Lang;
  /** Airport slug: the anchor on About this prototype is `#gaps-<slug>`. */
  airport: string;
  /** Localised short name of the airport. */
  airportName: string;
  /** The section's heading id and title (kept so the page outline does not change). */
  id: string;
  title: string;
  /** The official page for details this page does not have. */
  officialHref: string;
  officialLabel: string;
}

/**
 * The closing "what we have not verified" section of a section page, as one line (D-05 hand-off,
 * round 2): what this prototype has not checked at the airport is listed once, on About this
 * prototype (`/about-this-prototype#gaps-<airport>`), instead of repeating the whole note at the
 * foot of parking, facilities and transport. The official link stays.
 */
export function PrototypeGapsLink({ lang, airport, airportName, id, title, officialHref, officialLabel }: PrototypeGapsLinkProps) {
  const t = getT(lang);
  return (
    <section aria-labelledby={id} className="grid gap-x-10 gap-y-3 border-t border-line pt-8 lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)]">
      <h2 id={id} className="type-title-md text-ink">
        {title}
      </h2>
      <div className="min-w-0 max-w-reading">
        <p className="type-body-sm text-ink-2">
          {t('transportPages.gaps.line', { airport: airportName })}{' '}
          <LocaleLink href={`/about-this-prototype#gaps-${airport}`} className="link text-ink">
            {t('transportPages.gaps.link', { airport: airportName })}
          </LocaleLink>
        </p>
        <ExternalLink href={officialHref} variant="action" className="type-body-sm mt-1">
          {officialLabel}
        </ExternalLink>
      </div>
    </section>
  );
}
