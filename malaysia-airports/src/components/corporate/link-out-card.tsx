import type { ReactNode } from 'react';
import type { Source } from '@/content/types';
import { ExternalLink } from '@/components/common/external-link';
import { LocaleLink } from '@/components/common/locale-link';
import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import type { Translator } from '@/lib/i18n';
import { FactMeta } from './fact-meta';
import { MissingFact } from './missing-fact';

export interface LinkOutCardProps {
  icon: IconName;
  title: string;
  children?: ReactNode;
  /** Official address (opens in a new tab) or an internal path (starts with `/`). */
  links?: readonly { href: string; label: string }[];
  /** Sources for the links. */
  sources?: readonly Source[];
  /** Show "Not published" with a pointer to the official channel instead of links. */
  notPublished?: { officialUrl: string; t: Translator };
  headingLevel?: 2 | 3;
  className?: string;
}

/** A titled card that sends people to the official channel, or says plainly that none is published. */
export function LinkOutCard({ icon, title, children, links = [], sources = [], notPublished, headingLevel = 3, className }: LinkOutCardProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  return (
    <div className={cn('flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6', className)}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
          <Icon name={icon} size="md" strokeWidth={1.5} />
        </span>
        <Heading className="type-title-md min-w-0 pt-1.5 text-ink">{title}</Heading>
      </div>
      {children ? <div className="type-body text-ink-2">{children}</div> : null}
      {notPublished ? <MissingFact t={notPublished.t} officialUrl={notPublished.officialUrl} /> : null}
      {links.length ? (
        <ul className="mt-auto flex flex-col gap-0.5">
          {links.map((link) => (
            <li key={link.href}>
              {link.href.startsWith('/') ? (
                <LocaleLink href={link.href} className="link-action type-body-sm text-ink">
                  {link.label}
                  <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
                </LocaleLink>
              ) : (
                <ExternalLink variant="action" href={link.href} className="type-body-sm text-ink">
                  {link.label}
                </ExternalLink>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {sources.length ? <FactMeta provenance="official" sources={sources} /> : null}
    </div>
  );
}
