'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { AIRPORTS, getAirport } from '@/content/airports';
import type { Provenance } from '@/content/types';
import { useAirportContext, useSavedJourney } from '@/lib/hooks';
import { useLang, useT } from '@/lib/i18n/client';
import { formatDateTime } from '@/lib/time';
import { LocaleLink } from '@/components/common/locale-link';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { useSectionAvailability } from '@/components/shell/shell-context';
import { hasSection } from '@/components/shell/sections';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field, controlClasses, describedBy } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/cn';

/** A published car park, by id, with its name in the page language (from the server). */
export interface CarParkOption {
  id: string;
  airport: string;
  name: string;
  /** The airport's premium-parking warning, for car parks of type `preferred`. */
  warning?: { title: string; body: string; provenance: Provenance };
}

/**
 * The parked-car note from My journey: where you left the car, editable here. Car parks are
 * offered only from the published list for that airport; everything else is the visitor's own
 * words. Stored on this device only.
 */
export function ParkedCarCard({ carParks }: { carParks: readonly CarParkOption[] }) {
  const t = useT();
  const lang = useLang();
  const id = useId();
  const availability = useSectionAvailability();
  const { selection } = useAirportContext();
  const { journey, setParkedCar, clearParkedCar } = useSavedJourney();
  const note = journey.parkedCar;
  const [editing, setEditing] = useState(false);
  const [airportSlug, setAirportSlug] = useState('');
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);

  const startEditing = () => {
    setAirportSlug(note?.airport ?? selection?.airport ?? '');
    setEditing(true);
    setMessage('');
  };
  const stopEditing = (text = '') => {
    setEditing(false);
    setMessage(text);
    // The form is replaced by the summary: keep the keyboard in this card.
    window.requestAnimationFrame(() => heading.current?.focus());
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? '').trim() || undefined;
    const value = { airport: text('airport'), carParkId: text('carPark'), level: text('level'), zone: text('zone'), note: text('note') };
    if (!value.carParkId && !value.level && !value.zone && !value.note) {
      clearParkedCar();
      stopEditing(t('flightPages.journey.parked.cleared'));
      return;
    }
    setParkedCar(value);
    stopEditing(t('flightPages.journey.parked.saved'));
  };

  const airport = note?.airport ? getAirport(note.airport) : undefined;
  const carPark = note?.carParkId ? carParks.find((item) => item.id === note.carParkId) : undefined;
  const options = carParks.filter((item) => item.airport === airportSlug);
  const airportChoices = [...AIRPORTS].sort((a, b) => a.shortName.localeCompare(b.shortName));
  const noteId = `${id}-note`;

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-xl border border-line-strong bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`${id}-title`} ref={heading} tabIndex={-1} className="type-title-lg flex items-center gap-2.5 text-ink">
          <Icon name="car-front" />
          {t('journey.saved.parkedCar.title')}
        </h2>
        {note && !editing ? (
          <Button variant="quiet" size="sm" iconStart="pencil" onClick={startEditing}>
            {t('flightPages.journey.parked.edit')}
          </Button>
        ) : null}
      </div>

      {editing ? (
        <form onSubmit={onSubmit} aria-label={t('flightPages.journey.parked.formTitle')} className="mt-4 flex flex-col gap-4">
          <NativeSelect label={t('flightPages.journey.parked.airport')} name="airport" value={airportSlug} onChange={(event) => setAirportSlug(event.target.value)}>
            <option value="">{t('flightPages.journey.parked.airportNone')}</option>
            {airportChoices.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.shortName} ({item.code})
              </option>
            ))}
          </NativeSelect>
          {options.length > 0 ? (
            <NativeSelect
              key={airportSlug}
              label={t('journey.saved.parkedCar.carPark')}
              name="carPark"
              defaultValue={note?.airport === airportSlug ? (note?.carParkId ?? '') : ''}
              hint={t('flightPages.journey.parked.carParkHint')}
            >
              <option value="">{t('flightPages.journey.parked.carParkNone')}</option>
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </NativeSelect>
          ) : null}
          <div className="grid gap-4 xs:grid-cols-2">
            <Input label={t('journey.saved.parkedCar.level')} name="level" maxLength={40} defaultValue={note?.level ?? ''} optionalLabel={t('common.labels.optional')} />
            <Input label={t('journey.saved.parkedCar.zone')} name="zone" maxLength={40} defaultValue={note?.zone ?? ''} optionalLabel={t('common.labels.optional')} />
          </div>
          <Field id={noteId} label={t('journey.saved.parkedCar.note')} optionalLabel={t('common.labels.optional')}>
            <textarea
              id={noteId}
              name="note"
              maxLength={280}
              rows={3}
              defaultValue={note?.note ?? ''}
              aria-describedby={describedBy(noteId, undefined, undefined)}
              className={cn(controlClasses, 'h-auto min-h-24 py-2.5')}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" iconStart="check">
              {t('flightPages.journey.parked.save')}
            </Button>
            <Button type="button" variant="quiet" onClick={() => stopEditing()}>
              {t('common.actions.cancel')}
            </Button>
            {note ? (
              <Button
                type="button"
                variant="quiet"
                iconStart="trash-2"
                className="ml-auto"
                onClick={() => {
                  clearParkedCar();
                  stopEditing(t('flightPages.journey.parked.cleared'));
                }}
              >
                {t('journey.saved.parkedCar.clear')}
              </Button>
            ) : null}
          </div>
        </form>
      ) : note ? (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
            {airport ? (
              <div className="col-span-2">
                <dt className="type-eyebrow text-ink-2">{t('flightPages.journey.parked.airport')}</dt>
                <dd className="type-body mt-0.5 text-ink">{airport.name}</dd>
              </div>
            ) : null}
            {carPark ? (
              <div className="col-span-2">
                <dt className="type-eyebrow text-ink-2">{t('journey.saved.parkedCar.carPark')}</dt>
                <dd className="type-body mt-0.5 font-semibold text-ink">{carPark.name}</dd>
              </div>
            ) : null}
            {note.level ? (
              <div>
                <dt className="type-eyebrow text-ink-2">{t('journey.saved.parkedCar.level')}</dt>
                <dd className="type-data-lg mt-0.5 text-ink">{note.level}</dd>
              </div>
            ) : null}
            {note.zone ? (
              <div>
                <dt className="type-eyebrow text-ink-2">{t('journey.saved.parkedCar.zone')}</dt>
                <dd className="type-data-lg mt-0.5 text-ink">{note.zone}</dd>
              </div>
            ) : null}
            {note.note ? (
              <div className="col-span-2">
                <dt className="type-eyebrow text-ink-2">{t('journey.saved.parkedCar.note')}</dt>
                <dd className="type-body mt-0.5 break-words whitespace-pre-line text-ink">{note.note}</dd>
              </div>
            ) : null}
          </dl>
          {carPark?.warning ? (
            <Callout tone="warning" title={carPark.warning.title} className="mt-4" actions={<ProvenanceTag provenance={carPark.warning.provenance} />}>
              <p>{carPark.warning.body}</p>
            </Callout>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-3">
            <p className="type-caption text-ink-2">{t('journey.saved.parkedCar.savedAt', { time: formatDateTime(note.savedAt, lang) })}</p>
            {note.airport && airport && hasSection(availability, note.airport, 'parking') ? (
              <LocaleLink href={`/${note.airport}/parking`} className="link-action type-body-sm text-ink">
                {t('flightPages.journey.parked.seeParking', { airport: airport.shortName })}
                <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
              </LocaleLink>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <p className="type-body-sm mt-2 text-ink-2">{t('flightPages.journey.parked.emptyBody')}</p>
          <Button variant="secondary" iconStart="plus" className="mt-4" onClick={startEditing}>
            {t('journey.saved.parkedCar.add')}
          </Button>
        </>
      )}
      <p role="status" className="sr-only">
        {message}
      </p>
    </section>
  );
}
