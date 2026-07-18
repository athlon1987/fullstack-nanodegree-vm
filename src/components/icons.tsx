/**
 * Minimal stroke icon set — replaces all emoji with professional glyphs.
 * 1.5px strokes, currentColor, sized via the `size` prop.
 */
interface IconProps {
  size?: number;
  className?: string;
}

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
}

export function LockIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function CheckIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function PlusIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** Compass-needle glyph for the AI-judgment element. */
export function JudgmentIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </svg>
  );
}
