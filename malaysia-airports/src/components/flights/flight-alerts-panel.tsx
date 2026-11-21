'use client';

import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { formatFlightNumber, type Flight } from '@/lib/flights';
import { useT } from '@/lib/i18n/client';
import { emailFollowChannel, emailFollowStore } from '@/lib/providers/follow';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { DemoMark } from './demo-mark';
import { requestAlertPermission, showDemoNotification, useAlertPermission, useFlightAlerts } from './flight-alerts';
import { FOLLOW_PANEL_ID } from './follow-state';

/**
 * "Follow this flight" (BR-04): opened from the Follow button beside Save. It says exactly what
 * is delivered today, offers browser notifications where the browser has them, and otherwise
 * (for example Safari on iPhone outside a Home Screen app) explains how to get them, with an
 * e-mail follow as the alternative. E-mail is a labelled demonstration through the
 * `FollowChannel` interface: the address stays on this device and nothing is sent (OOS-10).
 */
export function FollowPanel({ flight }: { flight: Flight }) {
  const t = useT();
  const permission = useAlertPermission();
  const { ids, enable, disable } = useFlightAlerts();
  const emails = useSyncExternalStore(emailFollowStore.subscribe, emailFollowStore.getSnapshot, emailFollowStore.getServerSnapshot);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  // Read once, after an interaction opened the panel (never during server rendering).
  const [appleMobile] = useState(() => typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent));
  const number = formatFlightNumber(flight);
  const on = permission === 'granted' && ids.has(flight.id);
  const savedEmail = emails[flight.id] ?? null;
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
      setMessage(t('flightPages.follow.noNotifications'));
    }
  };

  const followByEmail = async (event: FormEvent) => {
    event.preventDefault();
    const result = await emailFollowChannel.follow(flight.id, email);
    if (!result.ok) {
      setEmailError(t('flightPages.follow.emailInvalid'));
      return;
    }
    setEmailError('');
    setEmail('');
    setMessage(t('flightPages.follow.emailSaved', { number }));
  };

  return (
    <section id={FOLLOW_PANEL_ID} aria-labelledby="follow-title" className="rounded-lg border border-line-strong bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="follow-title" className="type-title-md flex items-center gap-2 text-ink">
          <Icon name={on || savedEmail ? 'bell-ring' : 'bell'} size="sm" />
          {t('flightPages.follow.title')}
        </h2>
        <DemoMark />
      </div>
      <p className="type-body-sm mt-2 text-ink-2">{t('flightPages.follow.delivered')}</p>

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
        <p className="type-eyebrow text-ink-2">{t('flightPages.alerts.title')}</p>
        {permission === 'unsupported' ? (
          <div className="flex flex-col gap-2">
            <p className="type-body-sm text-ink">{t('flightPages.follow.noNotifications')}</p>
            {appleMobile ? (
              <p className="type-body-sm flex items-start gap-2 text-ink-2">
                <Icon name="smartphone" size="sm" className="mt-0.5 shrink-0" />
                {t('flightPages.follow.iosHint')}
              </p>
            ) : null}
          </div>
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
          <div>
            <Button variant="secondary" iconStart="bell" onClick={turnOn}>
              {t('flightPages.alerts.turnOn')}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
        <p className="type-eyebrow text-ink-2">{t('flightPages.follow.emailTitle')}</p>
        <p className="type-caption text-ink-2">{t('flightPages.follow.emailDemo')}</p>
        {savedEmail ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="type-body-sm flex items-center gap-2 text-ink">
              <Icon name="mail" size="sm" />
              <span className="font-semibold">{savedEmail}</span>
            </p>
            <Button
              variant="quiet"
              size="sm"
              iconStart="x"
              onClick={async () => {
                await emailFollowChannel.unfollow(flight.id);
                setMessage(t('flightPages.alerts.off'));
              }}
            >
              {t('flightPages.follow.emailRemove')}
            </Button>
          </div>
        ) : (
          <form className="flex flex-wrap items-end gap-2" onSubmit={followByEmail} noValidate>
            <Input
              label={t('flightPages.follow.emailLabel')}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={emailError || undefined}
              fieldClassName="min-w-0 flex-1 basis-56"
            />
            <Button type="submit" variant="secondary" iconStart="mail">
              {t('flightPages.follow.emailSubmit')}
            </Button>
          </form>
        )}
      </div>
      <p role="status" className="sr-only">
        {message}
      </p>
    </section>
  );
}
