'use client';

import { Switch as SwitchPrimitive } from 'radix-ui';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './icon';

export interface SwitchProps extends Omit<ComponentProps<typeof SwitchPrimitive.Root>, 'children'> {
  /** Visible label. The whole row is the touch target (44px). */
  label: string;
  /** One line explaining the effect. */
  hint?: ReactNode;
  className?: string;
}

/**
 * An on/off setting that applies immediately (high contrast, reduce motion). The on state
 * shows a check mark and a moved thumb as well as the fill.
 *
 * @example <Switch label={t('preferences.highContrast')} hint={t('preferences.highContrastHint')} checked={on} onCheckedChange={setOn} />
 */
export function Switch({ label, hint, className, id, ...rest }: SwitchProps) {
  const generated = useId();
  const switchId = id ?? generated;
  return (
    <div className={cn('flex min-h-11 items-center justify-between gap-4', className)}>
      <label htmlFor={switchId} className="flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col justify-center py-1">
        <span className="type-body font-semibold text-ink">{label}</span>
        {hint ? (
          <span id={`${switchId}-hint`} className="type-caption text-ink-2">
            {hint}
          </span>
        ) : null}
      </label>
      <SwitchPrimitive.Root
        id={switchId}
        aria-describedby={hint ? `${switchId}-hint` : undefined}
        /* The button is a 48 by 44 hit area; the visible track is the 28px span inside it. */
        className="group flex h-11 w-12 shrink-0 items-center outline-none"
        {...rest}
      >
        <span
          className={cn(
            'flex h-7 w-12 items-center rounded-pill border border-line-control bg-fill transition-colors duration-base',
            'group-focus-visible:focus-ring group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary',
            'group-disabled:border-line group-disabled:bg-neutral-bg',
            'forced-colors:group-data-[state=checked]:forced-color-adjust-none forced-colors:group-data-[state=checked]:bg-[Highlight]',
          )}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'flex size-5 translate-x-0.5 items-center justify-center rounded-full bg-ink-2 text-transparent shadow-sm transition-[translate,background-color] duration-base ease-out',
              'data-[state=checked]:translate-x-6 data-[state=checked]:bg-on-primary data-[state=checked]:text-primary',
              'group-disabled:bg-ink-3',
              'forced-colors:data-[state=checked]:forced-color-adjust-none forced-colors:data-[state=checked]:bg-[HighlightText] forced-colors:data-[state=checked]:text-[Highlight]',
            )}
          >
            <Icon name="check" size="xs" strokeWidth={3} />
          </SwitchPrimitive.Thumb>
        </span>
      </SwitchPrimitive.Root>
    </div>
  );
}
