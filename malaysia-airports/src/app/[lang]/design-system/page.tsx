import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { AirportVignette } from '@/components/art/airport-vignette';
import { TaburField } from '@/components/art/patterns';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { PageHeader } from '@/components/common/page-header';
import { BoardSample } from '@/components/design-system/board-sample';
import { ColourTokens, ContrastTables, IconSamples, LayoutTokens, TypeSpecimens } from '@/components/design-system/foundations';
import { DsSection } from '@/components/design-system/parts';
import {
  ActionsShowcase,
  ArtShowcase,
  ContainersShowcase,
  DataShowcase,
  FormsShowcase,
  PageFurnitureShowcase,
  StatusShowcase,
} from '@/components/design-system/showcase';
import { PreviewToolbar } from '@/components/design-system/toolbar';
import { Container } from '@/components/ui/container';
import { Icon, type IconName } from '@/components/ui/icon';
import { I18nScope, getT, toLang } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(await routeLang());
  return { title: t('designSystem.eyebrow'), description: t('designSystem.lead') };
}

const SECTIONS = ['principles', 'colour', 'contrast', 'type', 'layout', 'icons', 'actions', 'forms', 'containers', 'data', 'status', 'board', 'page', 'art'] as const;

const PRINCIPLES: { key: 'calm' | 'honest' | 'inclusive' | 'malaysian'; icon: IconName }[] = [
  { key: 'calm', icon: 'compass' },
  { key: 'honest', icon: 'badge-check' },
  { key: 'inclusive', icon: 'accessibility' },
  { key: 'malaysian', icon: 'leaf' },
];

/** The living style guide: every token and component, server-rendered in both languages. */
export default async function DesignSystemPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const props = { t, lang };

  return (
    // Package E (fix round, performance-09): design-system copy is no longer in the root dictionary.
    <I18nScope lang={lang} namespaces={['designSystem']}>
      <div className="relative overflow-hidden">
        <TaburField fade className="absolute top-0 right-0 hidden h-72 w-1/2 sm:block" />
        <PageHeader
          className="relative"
          eyebrow={t('designSystem.eyebrow')}
          title={t('designSystem.title')}
          lead={t('designSystem.lead')}
          breadcrumbs={<Breadcrumbs items={[{ label: t('footer.designSystem') }]} />}
          art={<AirportVignette code="kul" terminal="T1" />}
        />
      </div>

      <Container className="pb-4">
        <PreviewToolbar />
        <nav aria-label={t('designSystem.contents')} className="mt-8">
          <h2 className="type-eyebrow mb-3 text-ink-3">{t('designSystem.contents')}</h2>
          <ol className="grid grid-cols-1 border-t border-line-strong xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {SECTIONS.map((id, index) => (
              <li key={id} className="border-b border-line">
                <a href={`#${id}`} className="group flex min-h-11 items-center gap-3 py-2 pr-3 text-ink hover:text-primary-ink">
                  <span className="type-data-sm w-6 text-ink-3">{String(index + 1).padStart(2, '0')}</span>
                  <span className="type-body-sm font-semibold underline decoration-transparent underline-offset-4 group-hover:decoration-gold">
                    {t(`designSystem.sections.${id}`)}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </Container>

      <DsSection id="principles" number={1} title={t('designSystem.sections.principles')}>
        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((principle) => (
            <li key={principle.key} className="border-t border-line-strong pt-4">
              <Icon name={principle.icon} size="lg" className="text-primary-ink" />
              <h3 className="type-display-sm mt-3 text-ink">{t(`designSystem.principles.${principle.key}.title`)}</h3>
              <p className="type-body mt-2 text-ink-2">{t(`designSystem.principles.${principle.key}.body`)}</p>
            </li>
          ))}
        </ul>
      </DsSection>

      <DsSection id="colour" number={2} tone="subtle" title={t('designSystem.sections.colour')} intro={t('designSystem.intro.colour')}>
        <ColourTokens t={t} />
      </DsSection>

      <DsSection id="contrast" number={3} title={t('designSystem.sections.contrast')} intro={t('designSystem.intro.contrast')}>
        <ContrastTables t={t} />
      </DsSection>

      <DsSection id="type" number={4} tone="subtle" title={t('designSystem.sections.type')} intro={t('designSystem.intro.type')}>
        <TypeSpecimens t={t} />
      </DsSection>

      <DsSection id="layout" number={5} title={t('designSystem.sections.layout')} intro={t('designSystem.intro.layout')}>
        <LayoutTokens t={t} />
      </DsSection>

      <DsSection id="icons" number={6} tone="subtle" title={t('designSystem.sections.icons')} intro={t('designSystem.intro.icons')}>
        <IconSamples />
      </DsSection>

      <DsSection id="actions" number={7} title={t('designSystem.sections.actions')} intro={t('designSystem.intro.actions')}>
        <ActionsShowcase {...props} />
      </DsSection>

      <DsSection id="forms" number={8} tone="subtle" title={t('designSystem.sections.forms')} intro={t('designSystem.intro.forms')}>
        <FormsShowcase {...props} />
      </DsSection>

      <DsSection id="containers" number={9} title={t('designSystem.sections.containers')} intro={t('designSystem.intro.containers')}>
        <ContainersShowcase {...props} />
      </DsSection>

      <DsSection id="data" number={10} tone="subtle" title={t('designSystem.sections.data')} intro={t('designSystem.intro.data')}>
        <DataShowcase {...props} />
      </DsSection>

      <DsSection id="status" number={11} title={t('designSystem.sections.status')} intro={t('designSystem.intro.status')}>
        <StatusShowcase {...props} />
      </DsSection>

      <DsSection id="board" number={12} tone="subtle" title={t('designSystem.sections.board')} intro={t('designSystem.intro.board')}>
        <BoardSample {...props} />
      </DsSection>

      <DsSection id="page" number={13} title={t('designSystem.sections.page')} intro={t('designSystem.intro.page')}>
        <PageFurnitureShowcase {...props} />
      </DsSection>

      <DsSection id="art" number={14} tone="subtle" title={t('designSystem.sections.art')} intro={t('designSystem.intro.art')}>
        <ArtShowcase {...props} />
      </DsSection>
    </I18nScope>
  );
}
