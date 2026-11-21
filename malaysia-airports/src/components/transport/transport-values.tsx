'use client';

import type { ReactNode } from 'react';
import { pick } from '@/content/values';
import type { Hours, Lang, Money, TerminalId, TransportOption } from '@/content/types';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDuration, formatList } from '@/lib/format';
import { useLang, useT } from '@/lib/i18n/client';
import type { Translator } from '@/lib/i18n/translate';
import { formatDate, zonedDateTime } from '@/lib/time';
import { NotPublished } from '@/components/common/not-published';
import { TerminalBadge } from '@/components/common/terminal-badge';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { asOfLabel, type FareInfo, type FarePeriod } from './transport-logic';
import type { TransportContext } from './transport-types';

/** A date key in words, in airport time: "31 December 2026". */
export function dayLabel(key: string, lang: Lang, timeZone: string, style: 'long' | 'medium' = 'long'): string {
  return formatDate(zonedDateTime(key, 720, timeZone), lang, style, timeZone);
}

/** A published amount: "Free", "from RM 12" or "RM 55", and the basis caption. */
export function moneyText(money: Money, lang: Lang, t: Translator): { amount: string; basis?: string } {
  if (money.amount === 0) return { amount: t('transportPages.fare.free') };
  const value = formatCurrency(money, lang);
  if (money.basis === 'from') return { amount: t('transportPages.fare.from', { amount: value }) };
  return { amount: value, basis: money.basis ? t(`transportPages.fare.basis.${money.basis}`) : undefined };
}

/** The fare figure for a card or a table cell. */
export function FareFigure({ info, context, size = 'lg', shortLabel = false }: { info: FareInfo; context: TransportContext; size?: 'lg' | 'md'; shortLabel?: boolean }) {
  const t = useT();
  const lang = useLang();
  const missing = <NotPublished label={shortLabel ? undefined : t('transportPages.fare.notPublished')} />;
  if (!info.place || info.doorToDoor) return missing;
  if (info.dated && !info.status) {
    return (
      <ul className="flex flex-col gap-1.5">
        {info.place.periods.map((period) => (
          <li key={period.from ?? period.until ?? 'any'} className="flex flex-wrap items-baseline gap-x-2">
            {period.destination.fare ? (
              <span className={cn('text-ink', size === 'lg' ? 'type-data-md' : 'type-data-sm')}>{moneyText(period.destination.fare, lang, t).amount}</span>
            ) : (
              <NotPublished />
            )}
            <span className="type-caption text-ink-2">{periodText(period, lang, context.timezone, t)}</span>
          </li>
        ))}
      </ul>
    );
  }
  const fare = info.shown?.fare;
  if (!fare) return missing;
  const text = moneyText(fare, lang, t);
  return (
    <span className="flex flex-col">
      <span className={cn('text-ink', size === 'lg' ? 'type-data-lg' : 'type-data-md')}>{text.amount}</span>
      {text.basis ? <span className="type-caption text-ink-2">{text.basis}</span> : null}
    </span>
  );
}

function periodText(period: FarePeriod, lang: Lang, timeZone: string, t: Translator): string {
  if (period.until) return t('transportPages.fare.until', { date: dayLabel(period.until, lang, timeZone) });
  if (period.from) return t('transportPages.fare.since', { date: dayLabel(period.from, lang, timeZone) });
  return '';
}

/**
 * Which dated fare applies today and what changes next. Before the clock is read it says that
 * the fare depends on the travel date (the figure lists every period).
 */
export function FareTimeline({ info, context, compact = false }: { info: FareInfo; context: TransportContext; compact?: boolean }) {
  const t = useT();
  const lang = useLang();
  if (!info.dated || !info.place) return null;
  if (!info.status) {
    return compact ? null : <p className="type-body-sm text-ink-2">{t('transportPages.fare.periodsHint')}</p>;
  }
  const { current, upcoming, expired } = info.status;
  const next = upcoming[0];
  if (compact) {
    return (
      <div className="mt-2 flex flex-col gap-1">
        {current ? (
          <p className="type-caption flex items-start gap-1.5 text-positive-fg">
            <Icon name="circle-check" size="xs" className="mt-0.5 shrink-0" />
            {current.until ? t('transportPages.fare.todayShort', { date: dayLabel(current.until, lang, context.timezone, 'medium') }) : t('transportPages.fare.appliesToday')}
          </p>
        ) : null}
        {next?.destination.fare && next.from ? (
          <p className="type-caption flex items-start gap-1.5 text-ink-2">
            <Icon name="calendar-days" size="xs" className="mt-0.5 shrink-0" />
            {t('transportPages.fare.upcomingShort', { amount: moneyText(next.destination.fare, lang, t).amount, date: dayLabel(next.from, lang, context.timezone, 'medium') })}
          </p>
        ) : null}
        {expired?.until ? <p className="type-caption text-ink-2">{t('transportPages.fare.expired', { date: dayLabel(expired.until, lang, context.timezone, 'medium') })}</p> : null}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {current ? (
        <Chip tone="positive" icon="circle-check">
          {t('transportPages.fare.appliesToday')}
          {current.until ? ` · ${periodText(current, lang, context.timezone, t)}` : null}
        </Chip>
      ) : null}
      {next?.destination.fare && next.from ? (
        <Chip tone="info" icon="calendar-days">
          {t('transportPages.fare.upcoming', { amount: moneyText(next.destination.fare, lang, t).amount, date: dayLabel(next.from, lang, context.timezone) })}
        </Chip>
      ) : null}
      {expired?.until ? <p className="type-body-sm text-ink-2">{t('transportPages.fare.expired', { date: dayLabel(expired.until, lang, context.timezone) })}</p> : null}
    </div>
  );
}

/** Published journey time, or "not published". */
export function DurationValue({ info, shortLabel = false }: { info: FareInfo; shortLabel?: boolean }) {
  const t = useT();
  const lang = useLang();
  const minutes = info.doorToDoor ? undefined : info.shown?.durationMinutes;
  return minutes !== undefined ? (
    <span className="type-data-md text-ink">{formatDuration(minutes, lang)}</span>
  ) : (
    <NotPublished label={shortLabel ? undefined : t('transportPages.fare.timeNotPublished')} />
  );
}

/** How often the service runs: the published words, or the published interval. */
export function FrequencyValue({ option, shortLabel = false }: { option: TransportOption; shortLabel?: boolean }) {
  const t = useT();
  const lang = useLang();
  if (option.frequency) return <span className="type-body-sm text-ink">{pick(option.frequency, lang)}</span>;
  if (option.frequencyMinutes !== undefined) return <span className="type-body-sm text-ink">{t('transportPages.fare.everyMinutes', { minutes: option.frequencyMinutes })}</span>;
  return <NotPublished label={shortLabel ? undefined : t('transportPages.fare.frequencyNotPublished')} />;
}

/** Published hours. */
export function HoursValue({ hours, shortLabel = false }: { hours: Hours | undefined; shortLabel?: boolean }) {
  const t = useT();
  const lang = useLang();
  if (!hours) return <NotPublished label={shortLabel ? undefined : t('transportPages.fare.hoursNotPublished')} />;
  if (hours.kind === 'text') return <span className="type-body-sm text-ink">{pick(hours.text, lang)}</span>;
  const main = hours.kind === '24h' ? t('transportPages.fare.open24') : `${hours.open}–${hours.close}`;
  return (
    <span className="flex flex-col gap-0.5">
      <span className="type-body-sm font-medium text-ink">{main}</span>
      {hours.note ? <span className="type-caption text-ink-2">{pick(hours.note, lang)}</span> : null}
    </span>
  );
}

/** Accepted payment methods as published. */
export function PaymentValue({ option, shortLabel = false }: { option: TransportOption; shortLabel?: boolean }) {
  const t = useT();
  const lang = useLang();
  return option.payment && option.payment.length > 0 ? (
    <span className="type-body-sm text-ink">{formatList(option.payment.map((method) => pick(method, lang)), lang)}</span>
  ) : (
    <NotPublished label={shortLabel ? undefined : t('transportPages.fare.paymentNotPublished')} />
  );
}

/** Step-free access, with icon and words, and the published note. */
export function AccessValue({ option, compact = false }: { option: TransportOption; compact?: boolean }) {
  const t = useT();
  const lang = useLang();
  const stepFree = option.accessibility?.stepFree;
  const note = option.accessibility?.note;
  const chip =
    stepFree === true ? (
      <Chip tone="positive" icon="accessibility">
        {t('transportPages.access.stepFree')}
      </Chip>
    ) : stepFree === false ? (
      <Chip tone="warning" icon="ban">
        {t('transportPages.access.notStepFree')}
      </Chip>
    ) : (
      <Chip tone="neutral" icon="circle-help">
        {compact ? t('transportPages.access.unknownShort') : t('transportPages.access.unknown')}
      </Chip>
    );
  return (
    <span className="flex flex-col items-start gap-1">
      {chip}
      {note && !compact ? <span className="type-caption text-ink-2">{pick(note, lang)}</span> : null}
    </span>
  );
}

/** Where to board, by terminal, level and the published note (doors, bays). */
export function BoardingList({ option, context, terminal, compact = false }: { option: TransportOption; context: TransportContext; terminal?: TerminalId; compact?: boolean }) {
  const t = useT();
  const lang = useLang();
  const points = terminal ? option.boarding.filter((point) => point.terminal === terminal) : option.boarding;
  if (option.boarding.length === 0) return <NotPublished label={t('transportPages.boarding.none')} />;
  if (points.length === 0) {
    const label = context.terminals.find((item) => item.id === terminal)?.label ?? terminal ?? '';
    return <NotPublished label={t('transportPages.boarding.otherTerminal', { terminal: label })} />;
  }
  const multi = context.terminals.length > 1;
  return (
    <ul className={cn('flex flex-col', compact ? 'gap-2' : 'gap-3')}>
      {points.map((point, index) => {
        const level = point.level ? (context.terminals.find((item) => item.id === point.terminal)?.levels[point.level] ?? point.level) : undefined;
        return (
          <li key={`${point.terminal}-${index}`} className="flex min-w-0 items-start gap-2.5">
            {multi ? <TerminalBadge terminal={point.terminal} size="sm" className="mt-0.5 shrink-0" /> : null}
            <span className="min-w-0">
              {level ? <span className="type-body-sm block font-semibold text-ink">{level}</span> : null}
              <span className={cn('block text-ink-2', compact ? 'type-caption' : 'type-body-sm')}>{pick(point.note, lang)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** "As of 1 October 2026" from a date key or the source's own wording. */
export function AsOf({ value, timeZone, className }: { value: string; timeZone: string; className?: string }) {
  const t = useT();
  const lang = useLang();
  return <p className={cn('type-caption py-2 text-ink-2', className)}>{t('freshness.asOf', { date: asOfLabel(value, lang, (key, l) => dayLabel(key, l, timeZone, 'medium')) })}</p>;
}

/** A labelled fact inside a card. */
export function Fact({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="type-eyebrow text-ink-3">{label}</dt>
      <dd className="mt-1.5 min-w-0">{children}</dd>
    </div>
  );
}
