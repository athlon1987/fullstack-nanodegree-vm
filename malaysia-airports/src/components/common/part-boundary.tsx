'use client';

import { Component, Fragment, useSyncExternalStore, type ErrorInfo, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { getServerWaitingImports, getWaitingImports, retryWaitingImports, subscribeWaitingImports } from '@/lib/retrying-import';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

/*
 * Round 6 (review-3 9.1 item 1, pilot condition P8): with a saved flight, one script that could
 * not be fetched replaced the whole home or My journey with "Something went wrong", and "Try again"
 * re-rendered the cached failure. Lazy parts now load with `retryableLazy` (they wait instead of
 * failing), show `PartLoading` while they wait, and sit inside a `PartBoundary`, so anything that
 * still goes wrong stays in the card or control and "Try again" imports it afresh.
 */

interface PartMessageProps {
  id?: string;
  text: string;
  onRetry: () => void;
  /** One line beside a control (for example in place of a button), instead of a card. */
  compact?: boolean;
  className?: string;
}

function PartMessage({ id, text, onRetry, compact = false, className }: PartMessageProps) {
  const t = useT();
  return (
    <div
      id={id}
      data-part-message=""
      className={cn(
        'flex min-w-0 items-start gap-3 text-ink',
        compact ? 'type-body-sm flex-wrap items-center' : 'rounded-lg border border-line-strong bg-surface p-4',
        className,
      )}
    >
      {compact ? null : <Icon name="wifi-off" size="sm" strokeWidth={1.75} className="mt-0.5 shrink-0 text-ink-2" />}
      <div className={cn('flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2', compact && 'justify-end')}>
        <p role="status" className="type-body-sm min-w-0 flex-1 basis-56 text-ink-2">
          {text}
        </p>
        <Button size="sm" variant="secondary" iconStart="refresh-cw" onClick={onRetry}>
          {t('platformPages.part.retry')}
        </Button>
      </div>
    </div>
  );
}

export interface PartLoadingProps {
  /** What to show while the part loads normally (a skeleton or a placeholder of the part's size). */
  children?: ReactNode;
  compact?: boolean;
  className?: string;
}

/**
 * The `<Suspense>` fallback of a lazy part. While its script loads it shows `children` (or
 * nothing); once a fetch has failed and is waiting for the connection, it says so in place, with
 * "Try again" (which fetches it again at once).
 */
export function PartLoading({ children = null, compact = false, className }: PartLoadingProps) {
  const t = useT();
  const waiting = useSyncExternalStore(subscribeWaitingImports, getWaitingImports, getServerWaitingImports);
  if (waiting === 0) return <>{children}</>;
  return <PartMessage text={t('platformPages.part.waiting')} onRetry={retryWaitingImports} compact={compact} className={className} />;
}

function PartFailed({ id, onRetry, compact, className }: { id?: string; onRetry: () => void; compact?: boolean; className?: string }) {
  const t = useT();
  return <PartMessage id={id} text={t('platformPages.part.failed')} onRetry={onRetry} compact={compact} className={className} />;
}

export interface PartBoundaryProps {
  children: ReactNode;
  /** Called before "Try again" renders the part again: pass the lazy component's `renew`. */
  onRetry?: () => void;
  /** Render nothing on failure (for optional layers such as closed overlays). */
  silent?: boolean;
  /** Keeps an in-page anchor of the part on its failure message (for example `needs-control`). */
  id?: string;
  compact?: boolean;
  className?: string;
}

/**
 * An error boundary the size of one card or control. A failure inside it shows a short message
 * and "Try again" in its place; the rest of the page keeps working.
 */
export class PartBoundary extends Component<PartBoundaryProps, { failed: boolean; attempt: number }> {
  state = { failed: false, attempt: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  retry = () => {
    this.props.onRetry?.();
    this.setState((state) => ({ failed: false, attempt: state.attempt + 1 }));
  };

  render() {
    if (this.state.failed) return this.props.silent ? null : <PartFailed id={this.props.id} onRetry={this.retry} compact={this.props.compact} className={this.props.className} />;
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}
