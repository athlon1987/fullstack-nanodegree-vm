'use client';

import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/client';
import { ProvenanceTag } from '@/components/common/provenance-tag';

/**
 * The compact demonstration label for one value or one group of rows (content-integrity-01/03):
 * visible text "Demo" with the hazard stripe, accessible name "Demonstration data". Used on
 * board hour headers and next to gate, belt and counter values, so every scrolled view of
 * simulated data carries a label. (When the shared compact demo tag from the design system
 * lands, A-04, this wrapper is the one place to switch to it.)
 */
export function DemoMark({ className }: { className?: string }) {
  const t = useT();
  return (
    <span className={cn('inline-flex shrink-0', className)}>
      <ProvenanceTag provenance="demo" length="short" aria-hidden="true" className="h-5" />
      <span className="sr-only">{t('demo.bannerTitle')}</span>
    </span>
  );
}
