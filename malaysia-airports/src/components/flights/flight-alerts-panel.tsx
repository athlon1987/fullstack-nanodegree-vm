'use client';

import { useState } from 'react';
import { formatFlightNumber, type Flight } from '@/lib/flights';
import { useT } from '@/lib/i18n/client';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { requestAlertPermission, showDemoNotification, useAlertPermission, useFlightAlerts } from './flight-alerts';

/**
 * Opt-in demo alerts for one flight. Turning them on asks the browser for permission; only
 * then does the page send notifications, and each one says it is a demonstration.
 */
export function FlightAlertsPanel({ flight }: { flight: Flight }) {
  const t = useT();
  const permission = useAlertPermission();
  const { ids, enable, disable } = useFlightAlerts();
  const [message, setMessage] = useState('');
  const number = formatFlightNumber(flight);
  const on = permission === 'granted' && ids.has(flight.id);
  const tag = `flight-${flight.id}`;

  const turnOn = async () => {
    const result = await requestAlertPermission();
    if (result === 'granted') {
      enable(flight.id);
      showDemoNotification(t('flightPages.alerts.enabledTitle', { number }), t('flightPages.alerts.notificationBody'), tag);
      setMessage(t('flightPages.alerts.on', { number }));
    } else if (result === 'denied') {
      setMessage(t('flightPages.alerts.denied'));
    } else if (result === 'unsupported') {
      setMessage(t('flightPages.alerts.unsupported'));
    }
  };

  return (
    <section aria-labelledby="flight-alerts-title" className="rounded-lg border border-line-strong bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="flight-alerts-title" className="type-title-md flex items-center gap-2 text-ink">
          <Icon name={on ? 'bell-ring' : 'bell'} size="sm" />
          {t('flightPages.alerts.title')}
        </h2>
        <ProvenanceTag provenance="demo" length="short" />
      </div>
      <p className="type-body-sm mt-2 text-ink-2">{t('flightPages.alerts.body', { number })}</p>
      <p className="type-caption mt-2 text-ink-2">{t('flightPages.alerts.demoNote')}</p>

      <div className="mt-4">
        {permission === 'unsupported' ? (
          <p className="type-body-sm text-ink">{t('flightPages.alerts.unsupported')}</p>
        ) : permission === 'denied' ? (
          <p className="type-body-sm text-ink">{t('flightPages.alerts.denied')}</p>
        ) : on ? (
          <div className="flex flex-col gap-3">
            <p className="type-body-sm flex items-center gap-2 font-semibold text-ink">
              <Icon name="check" size="sm" strokeWidth={2.25} />
              {t('flightPages.alerts.on', { number })}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                iconStart="send"
                onClick={() => showDemoNotification(t('flightPages.alerts.testTitle', { number }), t('flightPages.alerts.notificationBody'), tag)}
              >
                {t('flightPages.alerts.sendTest')}
              </Button>
              <Button
                variant="quiet"
                size="sm"
                iconStart="x"
                onClick={() => {
                  disable(flight.id);
                  setMessage(t('flightPages.alerts.off'));
                }}
              >
                {t('flightPages.alerts.turnOff')}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" iconStart="bell" onClick={turnOn}>
            {t('flightPages.alerts.turnOn')}
          </Button>
        )}
      </div>
      <p role="status" className="sr-only">
        {message}
      </p>
    </section>
  );
}
