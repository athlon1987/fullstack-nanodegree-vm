import { ExternalLink } from '@/components/common/external-link';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import type { Translator } from '@/lib/i18n';

/**
 * "Not published" for corporate facts: the same dashed mark as `NotPublished`, without its
 * travel wording, and a link to where the official answer lives.
 */
export function MissingFact({
  label,
  officialUrl,
  actionLabel,
  t,
  className,
}: {
  label?: string;
  officialUrl: string;
  /** A link text that names the destination; defaults to "Open the official site". */
  actionLabel?: string;
  t: Translator;
  className?: string;
}) {
  return (
    <div data-not-published="" className={cn('flex gap-3.5 rounded-2xl border border-dashed border-line-strong bg-surface p-5', className)}>
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold-ink">
        <Icon name="circle-dashed" size="sm" />
      </span>
      <div className="min-w-0">
        <p className="type-title-sm text-ink">{label ?? t('common.labels.notPublished')}</p>
        <p className="type-body-sm mt-1 text-ink-2">
          {label ? `${t('common.labels.notPublished')}. ` : null}
          {t('corporatePages.common.checkOfficial')}
        </p>
        <ExternalLink variant="action" href={officialUrl} className="type-body-sm mt-1">
          {actionLabel ?? t('corporatePages.common.openOfficial')}
        </ExternalLink>
      </div>
    </div>
  );
}
