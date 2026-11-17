import type { Lang } from '@/content/types';
import { getT } from '@/lib/i18n';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { Icon } from '@/components/ui/icon';

export interface DisruptionHelpProps {
  lang: Lang;
  /** The operating airline's name, as on the board. */
  airline: string;
}

/**
 * "If your flight is delayed or cancelled": points to the airline and to the help centre. It
 * deliberately states no passenger rights or compensation rules: those come from the airline
 * and the authorities, not from this page. Server Component.
 */
export function DisruptionHelp({ lang, airline }: DisruptionHelpProps) {
  const t = getT(lang);
  const links = [
    { href: '/help/flights', label: t('flightPages.disruption.helpFlights') },
    { href: '/help', label: t('flightPages.disruption.helpCentre') },
    { href: '/notices', label: t('flightPages.disruption.notices') },
  ];
  return (
    <section aria-labelledby="flight-disruption-title" className="rounded-lg border border-line-strong bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="flight-disruption-title" className="type-title-md flex items-center gap-2 text-ink">
          <Icon name="circle-alert" size="sm" />
          {t('flightPages.disruption.title')}
        </h2>
        <ProvenanceTag provenance="suggestion" length="short" />
      </div>
      <p className="type-body-sm mt-2 text-ink">{t('flightPages.disruption.airline', { airline })}</p>
      <p className="type-body-sm mt-2 text-ink-2">{t('flightPages.disruption.help')}</p>
      <ul className="mt-3 flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <LocaleLink href={link.href} className="link-action type-body-sm text-ink">
              {link.label}
              <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
            </LocaleLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
