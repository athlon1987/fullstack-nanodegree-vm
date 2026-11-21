import { cn } from '@/lib/cn';
import { BrandMark } from './brand-mark';

const SIZES = {
  sm: { text: 'text-lg', mark: 'size-6', gap: 'gap-2' },
  md: { text: 'text-xl', mark: 'size-7', gap: 'gap-2.5' },
  lg: { text: 'text-2xl', mark: 'size-9', gap: 'gap-3' },
} as const;

export interface WordmarkProps {
  /** The name to set: `t('common.appName')`. */
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Classes for the name only, for example to hide it visually where space is short. */
  nameClassName?: string;
}

/**
 * The mark with "Malaysia Airports" set in the display face. Wrap it in the home link; the
 * name is real text, so the link needs no extra label.
 *
 * @example <LocaleLink href="/"><Wordmark name={t('common.appName')} /></LocaleLink>
 */
export function Wordmark({ name, size = 'md', className, nameClassName }: WordmarkProps) {
  const s = SIZES[size];
  return (
    <span className={cn('inline-flex items-center text-ink', s.gap, className)}>
      <BrandMark className={s.mark} />
      <span className={cn('font-display leading-none font-[520] tracking-[-0.012em] whitespace-nowrap', s.text, nameClassName)}>{name}</span>
    </span>
  );
}
