import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './icon';

const VARIANTS = {
  ghost: 'text-ink hover:bg-fill',
  secondary: 'border-line-strong bg-surface text-ink shadow-xs hover:border-line-control hover:bg-page-subtle',
  primary: 'bg-primary text-on-primary shadow-sm hover:bg-primary-hover',
  quiet: 'text-ink-3 hover:bg-fill hover:text-ink',
  /** Over photographs: smoky midnight glass, white icon. */
  glass: 'glass-dark on-media text-ink hover:bg-[color-mix(in_srgb,var(--color-glass-dark)_86%,transparent)]',
} as const;

const SIZES = {
  sm: 'size-9 touch:size-11',
  md: 'size-11',
  lg: 'size-13',
} as const;

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  /** Required accessible name: an icon alone is never enough. */
  label: string;
  icon: IconName;
  variant?: keyof typeof VARIANTS;
  /** sm 36px (44px on phones), md 44px (default), lg 52px. */
  size?: keyof typeof SIZES;
  /** For toggles: sets `aria-pressed`. */
  pressed?: boolean;
}

/**
 * A round, icon-only button with a required label.
 *
 * @example <IconButton icon="x" label={t('common.actions.close')} onClick={close} />
 */
export function IconButton({ label, icon, variant = 'ghost', size = 'md', pressed, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-transparent transition-[background-color,border-color,color,scale] duration-fast motion-ok:active:scale-95',
        'disabled:text-ink-3 disabled:hover:bg-transparent aria-pressed:border-transparent aria-pressed:bg-ink aria-pressed:text-page',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size === 'lg' ? 'lg' : 'md'} />
    </button>
  );
}
