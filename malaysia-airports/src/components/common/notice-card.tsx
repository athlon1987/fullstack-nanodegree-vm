'use client';

import type { ReactNode } from 'react';
import type { NoticeSeverity, Provenance } from '@/content/types';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { Icon, type IconName } from '@/components/ui/icon';
import { ProvenanceTag } from './provenance-tag';

const SEVERITY: Record<NoticeSeverity, { box: string; text: string; icon: IconName }> = {
  info: { box: 'border-info-border bg-info-bg', text: 'text-info-fg', icon: 'info' },
  advisory: { box: 'border-line-control bg-page-subtle', text: 'text-ink', icon: 'megaphone' },
  warning: { box: 'border-2 border-warning-fg bg-warning-bg', text: 'text-warning-fg', icon: 'triangle-alert' },
  critical: { box: 'border-2 border-critical-fg bg-critical-bg', text: 'text-critical-fg', icon: 'octagon-alert' },
};

export interface NoticeCardProps {
  severity: NoticeSeverity;
  title: ReactNode;
  /** The notice text. */
  children?: ReactNode;
  /** `demo` notices must carry the demonstration tag; official ones show where they come from. */
  provenance?: Provenance;
  /** Where it applies, for example "KLIA Terminal 1". */
  scope?: ReactNode;
  /** When it applies, already formatted: `t('notices.from', { date })`. */
  period?: ReactNode;
  /** Links or a `SourceNote`. */
  footer?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

/**
 * A travel advisory or operational notice. Severity is shown by the icon, the label and the
 * weight of the border as well as the colour; provenance by its tag.
 *
 * @example
 * <NoticeCard severity={notice.severity} title={pick(notice.title, lang)} provenance={notice.provenance}
 *   footer={<SourceNote sources={resolveSources(notice.sources)} />}>{pick(notice.body, lang)}</NoticeCard>
 */
export function NoticeCard({ severity, title, children, provenance, scope, period, footer, headingLevel = 3, className }: NoticeCardProps) {
  const t = useT();
  const style = SEVERITY[severity];
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <article data-severity={severity} className={cn('rounded-lg border p-4 text-ink sm:p-5', style.box, className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className={cn('type-eyebrow flex items-center gap-1.5', style.text)}>
          <Icon name={style.icon} size="sm" strokeWidth={2} />
          {t(`notices.severity.${severity}`)}
          {scope ? <span className="text-ink-2"> · {scope}</span> : null}
        </p>
        {provenance ? <ProvenanceTag provenance={provenance} length="short" className="ml-auto" /> : null}
      </div>
      <Heading className="type-title-md mt-2.5 text-ink">{title}</Heading>
      {children ? <div className="type-body-sm mt-1.5 max-w-reading text-ink-2 sm:text-base">{children}</div> : null}
      {period ? <p className="type-data-sm mt-3 text-ink-2">{period}</p> : null}
      {footer ? <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">{footer}</div> : null}
    </article>
  );
}
