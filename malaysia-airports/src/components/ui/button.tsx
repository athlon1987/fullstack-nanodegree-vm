import { Slot } from 'radix-ui';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './icon';

const BASE =
  // Labels wrap instead of running off the screen at 320 px and 125% text (A-16; design-system
  // rule: never truncate, use min heights). One-line buttons keep their exact height.
  // Direction v2: pill shaped, a soft press on click (only when motion is allowed).
  'relative inline-flex max-w-full shrink-0 items-center justify-center rounded-pill border border-transparent text-center font-semibold tracking-[-0.006em] select-none ' +
  'transition-[background-color,border-color,color,box-shadow,scale] duration-fast ease-out motion-ok:active:scale-[0.97] ' +
  'disabled:border-transparent disabled:bg-fill disabled:text-ink-3 disabled:shadow-none disabled:backdrop-blur-none motion-ok:disabled:active:scale-100 ' +
  'aria-disabled:cursor-not-allowed data-[loading=true]:cursor-progress';

const VARIANTS = {
  /** The one main action of a view: solid midnight (near-white in the dark theme and over media). */
  primary: 'bg-primary text-on-primary shadow-sm hover:bg-primary-hover hover:shadow-md',
  /** The premium accent: solid gold. At most one per view, and never next to a `primary`. */
  gold: 'bg-gold text-on-gold shadow-sm hover:bg-gold-hover hover:shadow-md',
  /** Secondary actions: frosted surface glass with a hairline. White on a page, glassy over media. */
  secondary:
    'border-line-strong bg-[color-mix(in_srgb,var(--color-surface)_78%,transparent)] text-ink shadow-xs backdrop-blur-md hover:border-line-control hover:bg-surface',
  /** Over photographs: smoky midnight glass with white text, in both themes. */
  glass: 'glass-dark on-media text-ink hover:bg-[color-mix(in_srgb,var(--color-glass-dark)_86%,transparent)]',
  /** Tertiary actions in toolbars and cards: brand ink, no border. */
  ghost: 'text-primary-ink hover:bg-primary-soft',
  /** The lowest emphasis: reads as text until hovered. */
  quiet: 'text-ink-2 hover:bg-fill hover:text-ink',
  /** Destructive actions only (clear, remove). */
  danger: 'bg-critical-fg text-page shadow-xs hover:brightness-90',
} as const;

const SIZES = {
  sm: 'min-h-9 gap-1.5 px-3.5 py-1 text-sm touch:min-h-11',
  md: 'min-h-11 gap-2 px-5 py-1.5 text-base',
  lg: 'min-h-13 gap-2.5 px-7 py-2 text-[1.0625rem]',
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
 * Button. One `primary` (or one `gold`) per view; `secondary` for alternatives; `glass` over
 * photographs; `ghost` and `quiet` for low-emphasis actions; `danger` only for destructive ones.
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
