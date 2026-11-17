'use client';

/**
 * STUB. The concierge feature replaces the body of this panel; keep the export name and keep
 * driving it from the overlay store, so every launcher in the shell keeps working:
 *
 *   const dialog = useOverlayDialog('concierge');   // dialog.payload.question is the opening question
 *   overlays.openConcierge('Where can I pray at KLIA Terminal 1?');
 *
 * It is mounted once by `GlobalOverlays` in the root layout.
 */
import { useT } from '@/lib/i18n/client';
import { LocaleLink } from '@/components/common/locale-link';
import { closeOverlay, overlays, useOverlayDialog } from '@/components/shell/overlay-store';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Sheet, SheetContent } from '@/components/ui/dialog';

export function ConciergePanel() {
  const t = useT();
  const dialog = useOverlayDialog('concierge');
  const question = dialog.payload.question;
  return (
    <Sheet open={dialog.open} onOpenChange={dialog.onOpenChange}>
      <SheetContent title={t('concierge.title')} description={t('concierge.limits')} onCloseAutoFocus={dialog.onCloseAutoFocus}>
        <div className="flex flex-col gap-5">
          {question ? (
            <div>
              <p className="type-eyebrow mb-1.5 text-ink-2">{t('concierge.stub.asked')}</p>
              <p className="type-body rounded-lg rounded-br-xs bg-primary px-4 py-2.5 font-medium text-on-primary">{question}</p>
            </div>
          ) : null}
          <Callout tone="info" icon="sparkles" title={t('concierge.stub.title')}>
            {t('concierge.stub.body')}
          </Callout>
          <div className="flex flex-wrap gap-3">
            <Button iconStart="search" onClick={() => overlays.openSearch(question)}>
              {t('concierge.stub.searchInstead')}
            </Button>
            <Button asChild variant="secondary" iconEnd="arrow-right">
              <LocaleLink href="/help" onClick={() => closeOverlay()}>
                {t('concierge.stub.helpInstead')}
              </LocaleLink>
            </Button>
          </div>
          <p className="type-caption text-ink-2">{t('concierge.privacy')}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
