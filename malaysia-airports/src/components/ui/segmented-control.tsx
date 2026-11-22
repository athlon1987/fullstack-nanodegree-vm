'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconKey } from './icon';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  icon?: IconKey;
  /** Small second line, for example "Door to gate". */
  hint?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  /** Names the group for assistive technology (rendered as the fieldset legend). */
  label: string;
  /** Show the legend visually above the control. */
  showLabel?: boolean;
  options: readonly SegmentedOption<T>[];
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  /** Form field name; generated when omitted. */
  name?: string;
  /** md 44px segments (default), lg 52px. */
  size?: 'md' | 'lg';
  /** Stretch to the container width with equal segments. */
  block?: boolean;
  /** Two columns on phones (a two-by-two grid for four options), one row from `sm` up. */
  stackOnPhone?: boolean;
  className?: string;
}

/**
 * A choice between a few views or modes (Departures or Arrivals; the four journey modes).
 * Built on native radio buttons: one tab stop, arrow keys move the selection, and it works
 * inside a form without JavaScript.
 *
 * @example
 * <SegmentedControl label={t('flights.filters.direction')} value={direction} onValueChange={setDirection}
 *   options={[{ value: 'd', label: t('common.labels.departures'), icon: 'plane-takeoff' }, ...]} />
 */
export function SegmentedControl<T extends string = string>({
  label,
  showLabel = false,
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  size = 'md',
  block = false,
  stackOnPhone = false,
  className,
}: SegmentedControlProps<T>) {
  const generated = useId();
  const group = name ?? generated;
  return (
    <fieldset className={cn('min-w-0', block && 'w-full', className)}>
      <legend className={cn(showLabel ? 'type-body-sm mb-1.5 font-semibold text-ink' : 'sr-only')}>{label}</legend>
      {/* Round 6 (review-3 9.1 item 8): options share a row while their words fit and wrap to the
          next row when they do not, so a word is never broken inside ("Antarab / angsa" at 360 px
          and 125% text). Each option is as wide as its longest word at least, and they grow
          equally. */}
      <div
        className={cn(
          'flex flex-wrap gap-1 rounded-lg border border-line-control bg-page-subtle p-1',
          stackOnPhone && 'sm:grid sm:auto-cols-fr sm:grid-flow-col',
          !block && 'inline-flex',
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'relative flex flex-1 items-center justify-center gap-2 rounded-md px-3 text-center font-semibold [overflow-wrap:normal] text-ink-2 transition-colors duration-fast select-none',
              size === 'lg' ? 'min-h-13 text-base sm:px-5' : 'min-h-11 text-sm sm:text-base',
              'hover:text-ink has-[:checked]:bg-ink has-[:checked]:text-page has-[:checked]:shadow-xs',
              'has-[:focus-visible]:focus-ring has-[:disabled]:cursor-not-allowed has-[:disabled]:text-ink-3',
              'forced-colors:has-[:checked]:forced-color-adjust-none forced-colors:has-[:checked]:bg-[Highlight] forced-colors:has-[:checked]:text-[HighlightText]',
            )}
          >
            <input
              type="radio"
              name={group}
              value={option.value}
              disabled={option.disabled}
              className="sr-only"
              {...(value !== undefined
                ? { checked: value === option.value, onChange: () => onValueChange?.(option.value) }
                : { defaultChecked: defaultValue === option.value, onChange: () => onValueChange?.(option.value) })}
            />
            {option.icon ? <Icon name={option.icon} size="sm" strokeWidth={1.75} /> : null}
            <span className="flex flex-col leading-tight">
              <span>{option.label}</span>
              {option.hint ? <span className="type-caption mt-0.5 font-medium opacity-80">{option.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
