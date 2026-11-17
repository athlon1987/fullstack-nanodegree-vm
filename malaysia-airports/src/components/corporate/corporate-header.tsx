import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import type { Translator } from '@/lib/i18n';
import { CorporateNav } from './corporate-nav';
import type { CorporateNavId } from './corporate-sections';

export interface CorporateHeaderProps {
  t: Translator;
  /** Which corporate page this is; `null` for the transparency pages outside the corporate section. */
  current: CorporateNavId | null;
  title: string;
  lead?: ReactNode;
  /** Extra crumbs between Corporate and the page (for example the media centre above a story). */
  trail?: { label: string; href: string }[];
  /** Jump links, chips or dates under the lead. */
  meta?: ReactNode;
  actions?: ReactNode;
  /** Decorative line art beside the title from `lg` up. */
  art?: ReactNode;
  size?: 'md' | 'lg';
}

/**
 * Top of every corporate page: the corporate band, then the standard page header with the
 * page's only `h1`. Transparency pages (`current: null`) get the header without the band.
 */
export function CorporateHeader({ t, current, title, lead, trail = [], meta, actions, art, size }: CorporateHeaderProps) {
  const crumbs =
    current === null
      ? [{ label: title }]
      : current === 'overview'
        ? [{ label: t('corporatePages.title') }]
        : [{ label: t('corporatePages.title'), href: '/corporate' }, ...trail, { label: title }];
  return (
    <>
      {current !== null ? <CorporateNav current={current} t={t} /> : null}
      <PageHeader
        eyebrow={current !== null && current !== 'overview' ? t('corporatePages.nav.register') : undefined}
        title={title}
        lead={lead}
        meta={meta}
        actions={actions}
        art={art}
        size={size}
        breadcrumbs={<Breadcrumbs items={crumbs} />}
      />
    </>
  );
}
