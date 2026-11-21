'use client';

import { useSyncExternalStore } from 'react';
import { useStore } from '@/lib/hooks/use-store';
import { useT } from '@/lib/i18n/client';
import { measurementStore } from '@/components/platform/analytics';
import { Switch } from '@/components/ui/switch';

const subscribeNever = () => () => {};

/** True when the browser asks sites not to track (read after hydration; `false` on the server). */
function useTrackingRefused(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => {
      const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
      return nav.globalPrivacyControl === true || nav.doNotTrack === '1';
    },
    () => false,
  );
}

/**
 * The visitor's measurement switch on the privacy page (E-17 hand-off, round 2). On by default,
 * kept on this device in `ma:measurement:v1`; Global Privacy Control or Do Not Track always win,
 * and the switch says so.
 */
export function MeasurementSwitch() {
  const t = useT();
  const value = useStore(measurementStore);
  const refused = useTrackingRefused();
  return (
    <div className="rounded-lg border border-line-strong bg-surface p-4 sm:p-5">
      <Switch
        label={t('corporatePages.privacy.measurement.switchLabel')}
        hint={t('corporatePages.privacy.measurement.switchHint')}
        checked={value === 'on' && !refused}
        disabled={refused}
        onCheckedChange={(checked) => measurementStore.set(checked ? 'on' : 'off')}
      />
      {refused ? <p className="type-body-sm mt-2 text-ink-2">{t('corporatePages.privacy.measurement.blocked')}</p> : null}
    </div>
  );
}
