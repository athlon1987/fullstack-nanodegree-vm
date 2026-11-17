export interface SkipLinkProps {
  /** `t('common.actions.skipToContent')`. */
  label: string;
  /** Id of the main landmark. */
  target?: string;
}

/**
 * The first focusable element on every page: hidden until focused, then a solid ink button in
 * the top corner. The target needs `tabIndex={-1}` so focus really moves.
 *
 * @example <SkipLink label={t('common.actions.skipToContent')} />
 */
export function SkipLink({ label, target = 'main' }: SkipLinkProps) {
  return (
    <a
      href={`#${target}`}
      className="sr-only rounded-md bg-ink px-4 py-3 font-semibold text-page shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100]"
    >
      {label}
    </a>
  );
}
