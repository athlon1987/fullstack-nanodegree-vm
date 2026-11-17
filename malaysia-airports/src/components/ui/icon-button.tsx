import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './icon';

const VARIANTS = {
  ghost: 'text-ink hover:bg-page-subtle',
  secondary: 'border-line-control bg-surface text-ink hover:border-ink hover:bg-page-subtle',
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  quiet: 'text-ink-3 hover:bg-page-subtle hover:text-ink',
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
 * A square, icon-only button with a required label.
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
        'inline-flex shrink-0 items-center justify-center rounded-md border border-transparent transition-colors duration-fast',
        'disabled:text-ink-3 disabled:hover:bg-transparent aria-pressed:bg-ink aria-pressed:text-page',
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
