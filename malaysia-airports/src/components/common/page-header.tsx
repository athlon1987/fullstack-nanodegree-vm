import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Container, type ContainerProps } from '@/components/ui/container';

export interface PageHeaderProps {
  /** Small-caps line above the title: the section or the airport. */
  eyebrow?: ReactNode;
  /** The page's single `h1`. */
  title: ReactNode;
  /** One or two sentences that say what the page is for. */
  lead?: ReactNode;
  /** `<Breadcrumbs>` for the page. */
  breadcrumbs?: ReactNode;
  /** Primary actions for the page (buttons or links). */
  actions?: ReactNode;
  /** Chips, freshness or other facts under the lead. */
  meta?: ReactNode;
  /** Line art on the right from `lg` up (an `AirportVignette`). Decorative. */
  art?: ReactNode;
  /** `subtle` puts the header on the quieter page tone with a rule under it. */
  tone?: 'page' | 'subtle';
  /** `lg` for landing pages, `md` (default) for everything else. */
  size?: 'md' | 'lg';
  width?: ContainerProps['size'];
  className?: string;
}

/**
 * The top of every page: breadcrumbs, eyebrow, the `h1`, a lead, and optional actions and art.
 *
 * @example
 * <PageHeader eyebrow={airport.shortName} title={t('parking.title')} lead={...}
 *   breadcrumbs={<Breadcrumbs items={[{ label: airport.shortName, href: `/${airport.slug}` }, { label: t('nav.parking') }]} />} />
 */
export function PageHeader({ eyebrow, title, lead, breadcrumbs, actions, meta, art, tone = 'page', size = 'md', width = 'page', className }: PageHeaderProps) {
  return (
    <header className={cn(tone === 'subtle' && 'border-b border-line bg-page-subtle', className)}>
      <Container size={width} className={cn('pb-8 sm:pb-10', breadcrumbs ? 'pt-3 sm:pt-4' : 'pt-8 sm:pt-12')}>
        {breadcrumbs ? (
          <div data-page-breadcrumbs="" className="mb-4 sm:mb-6">
            {breadcrumbs}
          </div>
        ) : null}
        <div className={cn('grid items-end gap-x-12 gap-y-6', art && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]')}>
          <div className="min-w-0">
            {eyebrow ? (
              <p className="type-eyebrow mb-3 flex items-center gap-2.5 text-gold-ink">
                <span aria-hidden="true" className="h-px w-7 bg-gold" />
                {eyebrow}
              </p>
            ) : null}
            <h1 className={cn('text-ink', size === 'lg' ? 'type-display-xl' : 'type-display-lg')}>{title}</h1>
            {lead ? <p className="type-body-lg mt-4 max-w-reading text-ink-2">{lead}</p> : null}
            {meta ? <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">{meta}</div> : null}
            {actions ? <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div> : null}
          </div>
          {art ? (
            <div aria-hidden="true" className="hidden overflow-hidden rounded-lg border border-line lg:block">
              {art}
            </div>
          ) : null}
        </div>
      </Container>
    </header>
  );
}
