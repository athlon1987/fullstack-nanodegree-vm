import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHero } from '@/components/guides/page-hero';
import { Container } from '@/components/ui/container';
import type { IconKey } from '@/components/ui/icon';
import type { MediaImage } from '@/components/ui/media';
import type { Translator } from '@/lib/i18n';
import { CorporateNav } from './corporate-nav';
import { CORPORATE_SECTIONS, type CorporateNavId } from './corporate-sections';

export interface CorporateHeaderProps {
  t: Translator;
  /** Which corporate page this is; `null` for the transparency pages outside the corporate section. */
  current: CorporateNavId | null;
  title: string;
  lead?: ReactNode;
  /** Extra crumbs between Corporate and the page (for example the media centre above a story). */
  trail?: { label: string; href: string }[];
  /** Jump links, chips or dates. Shown under the header, on the page, so a row of links never crowds a photograph. */
  meta?: ReactNode;
  actions?: ReactNode;
  /**
   * Redesign stage two: a truthful library photograph of the company's own airports (KLIA from
   * the air, the Terminal 1 roof). Without one, corporate pages get the midnight band and the
   * transparency pages the quiet light header.
   */
  image?: MediaImage;
  /** The emblem beside a title without a photograph (decorative). */
  emblem?: IconKey;
  size?: 'md' | 'lg';
}

/**
 * Top of every corporate page: the corporate band, then the page hero with the page's only `h1`.
 * Transparency pages (`current: null`) get the light header without the band.
 */
export function CorporateHeader({ t, current, title, lead, trail = [], meta, actions, image, emblem, size }: CorporateHeaderProps) {
  const crumbs =
    current === null
      ? [{ label: title }]
      : current === 'overview'
        ? [{ label: t('corporatePages.title') }]
        : [{ label: t('corporatePages.title'), href: '/corporate' }, ...trail, { label: title }];
  return (
    <>
      {current !== null ? <CorporateNav current={current} t={t} /> : null}
      <PageHero
        image={image}
        tone={current === null ? 'light' : 'midnight'}
        emblem={emblem ?? CORPORATE_SECTIONS.find((section) => section.id === current)?.icon}
        size={size}
        eyebrow={current !== null && current !== 'overview' ? t('corporatePages.nav.register') : undefined}
        title={title}
        lead={lead}
        actions={actions}
        breadcrumbs={<Breadcrumbs items={crumbs} />}
      />
      {meta ? <Container className="pt-8 sm:pt-10">{meta}</Container> : null}
    </>
  );
}
