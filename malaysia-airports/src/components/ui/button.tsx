import { Slot } from 'radix-ui';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './icon';

const BASE =
  'relative inline-flex shrink-0 items-center justify-center rounded-md border border-transparent font-semibold whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,box-shadow] duration-fast ' +
  'disabled:border-line disabled:bg-neutral-bg disabled:text-ink-3 disabled:shadow-none ' +
  'aria-disabled:cursor-not-allowed data-[loading=true]:cursor-progress';

const VARIANTS = {
  /** The one main action of a view. */
  primary: 'bg-primary text-on-primary shadow-xs hover:bg-primary-hover',
  /** Secondary actions: a bordered, surface-coloured button. */
  secondary: 'border-line-control bg-surface text-ink hover:border-ink hover:bg-page-subtle',
  /** Tertiary actions in toolbars and cards: brand ink, no border. */
  ghost: 'text-primary-ink hover:bg-primary-soft',
  /** The lowest emphasis: reads as text until hovered. */
  quiet: 'text-ink-2 hover:bg-page-subtle hover:text-ink',
  /** Destructive actions only (clear, remove). */
  danger: 'bg-critical-fg text-page shadow-xs hover:brightness-90',
} as const;

const SIZES = {
  sm: 'h-9 gap-1.5 px-3 text-sm touch:min-h-11',
  md: 'h-11 gap-2 px-4 text-base',
  lg: 'h-13 gap-2.5 px-6 text-lg',
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** sm 36px (44px on phones), md 44px (default), lg 52px. */
  size?: ButtonSize;
  /** Render the child element (a link) with button styling instead of a `<button>`. */
  asChild?: boolean;
  /** Shows a spinner, sets `aria-busy` and ignores clicks. The button stays focusable. */
  loading?: boolean;
  /** Announced to assistive technology while loading, for example `t('common.labels.loading')`. */
  loadingLabel?: string;
  iconStart?: IconName;
  iconEnd?: IconName;
  /** Stretch to the width of the container. */
  block?: boolean;
  children: ReactNode;
}

/** Class names for something that should look like a button (rarely needed: prefer `asChild`). */
export function buttonClasses({ variant = 'primary', size = 'md', block = false }: Pick<ButtonProps, 'variant' | 'size' | 'block'> = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full');
}

/**
 * Button. One `primary` per view; `secondary` for alternatives; `ghost` and `quiet` for
 * low-emphasis actions; `danger` only for destructive ones.
 *
 * @example <Button iconEnd="arrow-right">{t('common.actions.search')}</Button>
 * @example <Button asChild variant="secondary"><LocaleLink href="/airports">{t('nav.airports')}</LocaleLink></Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  asChild = false,
  loading = false,
  loadingLabel,
  iconStart,
  iconEnd,
  block = false,
  className,
  children,
  type,
  onClick,
  ...rest
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  const iconSize = size === 'lg' ? 'md' : 'sm';
  return (
    <Comp
      className={cn(buttonClasses({ variant, size, block }), className)}
      {...(asChild ? {} : { type: loading ? 'button' : (type ?? 'button') })}
      {...(loading ? { 'aria-busy': true, 'aria-disabled': true, 'data-loading': true } : { onClick })}
      {...rest}
    >
      {loading ? (
        <Icon name="loader-circle" size={iconSize} strokeWidth={2} className="animate-spin" />
      ) : iconStart ? (
        <Icon name={iconStart} size={iconSize} strokeWidth={1.75} />
      ) : null}
      <Slot.Slottable>{children}</Slot.Slottable>
      {iconEnd ? <Icon name={iconEnd} size={iconSize} strokeWidth={1.75} /> : null}
      {loading && loadingLabel ? (
        <span role="status" className="sr-only">
          {loadingLabel}
        </span>
      ) : null}
    </Comp>
  );
}
