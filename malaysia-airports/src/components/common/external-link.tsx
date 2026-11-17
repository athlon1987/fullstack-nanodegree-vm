'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { Icon } from '@/components/ui/icon';

export interface ExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  /**
   * `inline` (default): an underlined link inside running text.
   * `action`: a standalone link with a 44px touch target on phones.
   * `plain`: styling is left to `className`.
   */
  variant?: 'inline' | 'action' | 'plain';
  /** Hide the trailing icon (the "opens in a new tab" text for assistive technology stays). */
  hideIcon?: boolean;
  children: ReactNode;
}

/**
 * A link that leaves the site. Opens in a new tab, shows the external-link icon and tells
 * assistive technology that it opens a new tab.
 *
 * @example <ExternalLink href={source.url}>{source.title}</ExternalLink>
 */
export function ExternalLink({ href, variant = 'inline', hideIcon = false, className, children, ...rest }: ExternalLinkProps) {
  const t = useT();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn(variant === 'inline' && 'link', variant === 'action' && 'link-action', className)} {...rest}>
      {children}
      {hideIcon ? null : <Icon name="arrow-up-right" size="xs" strokeWidth={2} className="ml-0.5 inline-block align-[-0.1em]" />}
      <span className="sr-only"> ({t('common.labels.newTab')})</span>
    </a>
  );
}
