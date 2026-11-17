'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { getAirport } from '@/content/airports';
import { cn } from '@/lib/cn';
import { useSavedJourney } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { formatDateTime } from '@/lib/time';
import { LocaleLink } from '@/components/common/locale-link';
import { Button } from '@/components/ui/button';
import { Field, controlClasses, describedBy } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import type { CarParkView } from './parking-types';

export interface ParkedCarControlProps {
  slug: string;
  timezone: string;
  carParks: readonly Pick<CarParkView, 'id' | 'name' | 'type'>[];
  /** Title of the premium-parking advice, repeated when that car park is chosen. */
  premiumWarning?: string;
}

/**
 * "Remember where I parked": car park (from the published list), level, zone or bay and a note,
 * saved on this device with `useSavedJourney` and shown on My journey. Shows the saved note with
 * Edit and Clear once there is one for this airport.
 */
export function ParkedCarControl({ slug, timezone, carParks, premiumWarning }: ParkedCarControlProps) {
  const t = useT();
  const lang = useLang();
  const id = useId();
  const { journey, setParkedCar, clearParkedCar, hydrated } = useSavedJourney();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const note = journey.parkedCar;
  const here = note && note.airport === slug ? note : null;
  const elsewhere = note && note.airport !== slug ? note : null;
  const showForm = editing || !here;
  const carParkId = chosen ?? here?.carParkId ?? '';
  const carPark = carParks.find((item) => item.id === (here?.carParkId ?? ''));
  const chosenPremium = carParks.find((item) => item.id === carParkId)?.type === 'preferred';
  const noteId = `${id}-note`;

  const focusHeading = () => window.requestAnimationFrame(() => heading.current?.focus());

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? '').trim() || undefined;
    const value = { airport: slug, carParkId: text('carPark'), level: text('level'), zone: text('zone'), note: text('note') };
    if (!value.carParkId && !value.level && !value.zone && !value.note) {
      setMessage(t('transportPages.parked.empty'));
      return;
    }
    setParkedCar(value);
    setEditing(false);
    setChosen(null);
    setMessage(t('transportPages.parked.saved'));
    focusHeading();
  };

  const clear = () => {
    clearParkedCar();
    setEditing(false);
    setChosen(null);
    setMessage(t('transportPages.parked.cleared'));
    focusHeading();
  };

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="rounded-xl border border-line-strong bg-surface p-4 shadow-xs sm:p-5">
        <h3 ref={heading} tabIndex={-1} className="type-title-md flex items-center gap-2.5 text-ink focus:outline-none focus-visible:focus-ring">
          <Icon name="car-front" />
          {here && !editing ? t('transportPages.parked.current') : t('transportPages.parked.title')}
        </h3>

        {showForm ? (
          <form onSubmit={onSubmit} aria-label={t('transportPages.parked.title')} className="mt-4 flex flex-col gap-4">
            {elsewhere && hydrated ? (
              <p className="type-body-sm flex items-start gap-2 text-ink-2">
                <Icon name="info" size="sm" className="mt-0.5 shrink-0" />
                {t('transportPages.parked.otherAirport', { airport: getAirport(elsewhere.airport ?? '')?.shortName ?? elsewhere.airport ?? '' })}
              </p>
            ) : null}
            <NativeSelect label={t('transportPages.parked.carPark')} name="carPark" value={carParkId} onChange={(event) => setChosen(event.target.value)}>
              <option value="">{t('transportPages.parked.carParkNone')}</option>
              {carParks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </NativeSelect>
            {chosenPremium && premiumWarning ? (
              <p className="type-body-sm flex items-start gap-2 font-semibold text-warning-fg">
                <Icon name="triangle-alert" size="sm" className="mt-0.5 shrink-0" />
                {premiumWarning}
              </p>
            ) : null}
            <div className="grid gap-4 xs:grid-cols-2">
              <Input
                key={`level-${here?.savedAt ?? 'new'}`}
                label={t('transportPages.parked.level')}
                hint={t('transportPages.parked.levelHint')}
                name="level"
                maxLength={40}
                defaultValue={here?.level ?? ''}
                optionalLabel={t('common.labels.optional')}
                autoComplete="off"
                mono
              />
              <Input
                key={`zone-${here?.savedAt ?? 'new'}`}
                label={t('transportPages.parked.zone')}
                hint={t('transportPages.parked.zoneHint')}
                name="zone"
                maxLength={40}
                defaultValue={here?.zone ?? ''}
                optionalLabel={t('common.labels.optional')}
                autoComplete="off"
                mono
              />
            </div>
            <Field id={noteId} label={t('transportPages.parked.note')} hint={t('transportPages.parked.noteHint')} optionalLabel={t('common.labels.optional')}>
              <textarea
                key={`note-${here?.savedAt ?? 'new'}`}
                id={noteId}
                name="note"
                maxLength={280}
                rows={3}
                defaultValue={here?.note ?? ''}
                aria-describedby={describedBy(noteId, true, undefined)}
                className={cn(controlClasses, 'h-auto min-h-24 py-2.5')}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" iconStart="map-pin-check">
                {here ? t('transportPages.parked.update') : t('transportPages.parked.save')}
              </Button>
              {here ? (
                <Button type="button" variant="quiet" onClick={() => setEditing(false)}>
                  {t('common.actions.cancel')}
                </Button>
              ) : null}
            </div>
          </form>
        ) : here ? (
          <>
            {carPark?.type === 'preferred' && premiumWarning ? (
              <p className="type-body-sm mt-3 flex items-start gap-2 font-semibold text-warning-fg">
                <Icon name="triangle-alert" size="sm" className="mt-0.5 shrink-0" />
                {premiumWarning}
              </p>
            ) : null}
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
              {carPark ? (
                <div className="col-span-2">
                  <dt className="type-eyebrow text-ink-3">{t('transportPages.parked.carPark')}</dt>
                  <dd className="type-body mt-1 font-semibold text-ink">{carPark.name}</dd>
                </div>
              ) : null}
              {here.level ? (
                <div>
                  <dt className="type-eyebrow text-ink-3">{t('transportPages.parked.level')}</dt>
                  <dd className="type-data-lg mt-1 break-words text-ink">{here.level}</dd>
                </div>
              ) : null}
              {here.zone ? (
                <div>
                  <dt className="type-eyebrow text-ink-3">{t('transportPages.parked.zone')}</dt>
                  <dd className="type-data-lg mt-1 break-words text-ink">{here.zone}</dd>
                </div>
              ) : null}
              {here.note ? (
                <div className="col-span-2">
                  <dt className="type-eyebrow text-ink-3">{t('transportPages.parked.note')}</dt>
                  <dd className="type-body mt-1 break-words whitespace-pre-line text-ink">{here.note}</dd>
                </div>
              ) : null}
            </dl>
            <p className="type-caption mt-4 text-ink-2">{t('transportPages.parked.savedAt', { time: formatDateTime(here.savedAt, lang, timezone) })}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <Button type="button" variant="secondary" size="sm" iconStart="pencil" onClick={() => setEditing(true)}>
                {t('transportPages.parked.edit')}
              </Button>
              <Button type="button" variant="quiet" size="sm" iconStart="trash-2" onClick={clear}>
                {t('transportPages.parked.clear')}
              </Button>
            </div>
          </>
        ) : null}
        <p role="status" className={message ? 'type-body-sm mt-3 text-ink-2' : 'sr-only'}>
          {message}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-page-subtle p-4 sm:p-5">
        <p className="type-body-sm flex items-start gap-2.5 text-ink-2">
          <Icon name="shield-check" size="sm" className="mt-0.5 shrink-0 text-ink" />
          {t('transportPages.parked.deviceOnly')}
        </p>
        <LocaleLink href="/journey" className="link-action type-body-sm text-ink">
          {t('transportPages.parked.openJourney')}
          <Icon name="arrow-right" size="sm" />
        </LocaleLink>
      </div>
    </div>
  );
}
