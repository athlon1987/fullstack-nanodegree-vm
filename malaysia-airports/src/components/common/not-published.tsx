'use client';

import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { Icon } from '@/components/ui/icon';
import { ExternalLink } from './external-link';

export interface NotPublishedProps {
  /** The official page where the visitor can check. When given, the block form links to it. */
  officialUrl?: string;
  /**
   * `inline` (default): the words "Not published" in place of a value, in a table cell or fact.
   * `block`: adds "Check the official source before you travel" and the link.
   */
  variant?: 'inline' | 'block';
  /** Override the label, for example `t('transport.fareNotPublished')`. */
  label?: string;
  className?: string;
}

/**
 * The standard way to say a fact is not available. We never guess: the UI says so and points
 * to the official channel.
 *
 * @example <KeyFact label={t('common.labels.price')} value={<NotPublished label={t('transport.fareNotPublished')} />} />
 */
export function NotPublished({ officialUrl, variant = 'inline', label, className }: NotPublishedProps) {
  const t = useT();
  const text = label ?? t('common.labels.notPublished');
  if (variant === 'inline') {
    return (
      <span data-not-published="" className={cn('type-body-sm inline-flex items-center gap-1.5 font-medium text-ink-2', className)}>
        <Icon name="circle-dashed" size="sm" />
        {text}
      </span>
    );
  }
  return (
    <div data-not-published="" className={cn('flex gap-3 rounded-lg border border-line-strong bg-page-subtle p-4', className)}>
      <Icon name="circle-dashed" className="mt-0.5 text-ink-2" />
      <div className="min-w-0">
        <p className="type-title-sm text-ink">{text}</p>
        <p className="type-body-sm mt-1 text-ink-2">{t('freshness.checkOfficial')}</p>
        {officialUrl ? (
          <ExternalLink variant="action" href={officialUrl} className="type-body-sm mt-1">
            {t('common.actions.openOfficialSite')}
          </ExternalLink>
        ) : null}
      </div>
    </div>
  );
}
