import { cn } from '@/lib/cn';

export interface AirportCodeProps {
  /** IATA code in any case: `kul`, `KUL`. */
  code: string;
  /** The airport's name, exposed as the expansion of the abbreviation. */
  name?: string;
  /** `plain` is mono text; `boxed` adds a hairline box (lists, switchers). */
  variant?: 'plain' | 'boxed';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'type-data-sm', md: 'type-data-md', lg: 'type-data-lg' } as const;

/**
 * An IATA airport code in mono capitals.
 *
 * @example <AirportCode code={airport.code} name={airport.name} variant="boxed" />
 */
export function AirportCode({ code, name, variant = 'plain', size = 'md', className }: AirportCodeProps) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center font-semibold tracking-data uppercase no-underline',
    SIZES[size],
    variant === 'boxed' && 'h-badge min-w-11 rounded-xs border border-line-control px-1.5',
    className,
  );
  return name ? (
    <abbr title={name} className={classes}>
      {code}
    </abbr>
  ) : (
    <span className={classes}>{code}</span>
  );
}
