'use client';

/**
 * The concierge panel: a sheet opened from the header launcher, the menu, the search palette
 * and the home page (`overlays.openConcierge(question?)`). Mounted once by `GlobalOverlays`, so
 * this file stays small: the conversation, the answer views and the ask flow load the first
 * time the panel opens.
 */
import { Suspense, lazy } from 'react';
import { useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { closeOverlay, useOverlayDialog } from '@/components/shell/overlay-store';
import { Icon } from '@/components/ui/icon';
import { Sheet, SheetContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

const ConciergeChat = lazy(() => import('./concierge-chat').then((module) => ({ default: module.ConciergeChat })));

function Loading() {
  const t = useT();
  return (
    <div role="status" aria-label={t('common.labels.loading')} className="flex flex-col gap-3">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function ConciergePanel() {
  const t = useT();
  const dialog = useOverlayDialog('concierge');
  return (
    <Sheet open={dialog.open} onOpenChange={dialog.onOpenChange}>
      <SheetContent
        title={t('conciergePage.title')}
        description={t('conciergePage.panelDescription')}
        onCloseAutoFocus={dialog.onCloseAutoFocus}
        className="max-sm:h-[88dvh] sm:w-[32rem]"
      >
        <div className="flex min-h-full flex-col gap-5">
          <LocaleLink href="/concierge" onClick={() => closeOverlay()} className="link-action type-body-sm inline-flex items-center gap-1.5 self-start">
            <Icon name="arrow-up-right" size="sm" />
            {t('conciergePage.openFullPage')}
          </LocaleLink>
          <Suspense fallback={<Loading />}>
            <ConciergeChat variant="panel" initialQuestion={dialog.payload.question} onDecline={() => closeOverlay('concierge')} />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  );
}
