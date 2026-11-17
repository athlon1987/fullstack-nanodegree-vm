'use client';

import { useRef, useState } from 'react';
import { useSavedJourney } from '@/lib/hooks';
import { useT } from '@/lib/i18n/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useFlightAlerts } from './flight-alerts';

export interface ClearJourneyProps {
  /** Called shortly after everything is cleared and the dialog has closed: move focus and announce. */
  onCleared: () => void;
}

/** "Clear my journey", with a confirmation dialog. Clears flights, places, the parking note and alerts. */
export function ClearJourney({ onCleared }: ClearJourneyProps) {
  const t = useT();
  const { clearAll } = useSavedJourney();
  const alerts = useFlightAlerts();
  const [open, setOpen] = useState(false);
  const cleared = useRef(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="quiet" iconStart="trash-2">
          {t('journey.saved.clearAll')}
        </Button>
      </DialogTrigger>
      <DialogContent
        title={t('flightPages.journey.clear.title')}
        description={t('flightPages.journey.clear.body')}
        size="sm"
        onCloseAutoFocus={(event) => {
          // The trigger disappears with the content it cleared: the page places focus instead.
          if (cleared.current) event.preventDefault();
        }}
        footer={
          <>
            <DialogClose asChild>
              <Button variant="secondary">{t('common.actions.cancel')}</Button>
            </DialogClose>
            <Button
              variant="danger"
              iconStart="trash-2"
              onClick={() => {
                cleared.current = true;
                clearAll();
                alerts.clear();
                setOpen(false);
                // After the dialog and the cleared content have unmounted.
                window.setTimeout(() => {
                  cleared.current = false;
                  onCleared();
                }, 60);
              }}
            >
              {t('flightPages.journey.clear.confirm')}
            </Button>
          </>
        }
      >
        <p className="type-body-sm text-ink-2">{t('journey.saved.storedLocally')}</p>
      </DialogContent>
    </Dialog>
  );
}
