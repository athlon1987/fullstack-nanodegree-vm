import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { dsCopy } from '@/components/design-system/copy';
import { BoardSample } from '@/components/design-system/board-sample';
import { ColourTokens, ContrastTables, IconSamples, LayoutTokens, TypeSpecimens } from '@/components/design-system/foundations';
import { DsSection } from '@/components/design-system/parts';
import { styleGuideMedia } from '@/components/design-system/sample-media';
import {
  ActionsShowcase,
  ArtShowcase,
  ContainersShowcase,
  DataShowcase,
  FlightStatusShowcase,
  FormsShowcase,
  MediaShowcase,
  PageFurnitureShowcase,
  StatusShowcase,
} from '@/components/design-system/showcase';
import { CONTRAST_PAIRS, TOKEN_THEME_IDS } from '@/components/design-system/token-data';
import { PreviewToolbar } from '@/components/design-system/toolbar';
import { Container } from '@/components/ui/container';
import { HeroMedia } from '@/components/ui/hero-media';
import { Icon, type IconName } from '@/components/ui/icon';
import { I18nScope, getT, toLang } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const lang = toLang(await routeLang());
  const c = dsCopy(lang);
  return { alternates: languageAlternates(lang, '/design-system'), title: getT(lang)('designSystem.eyebrow'), description: c.lead };
}

const SECTIONS = ['principles', 'colour', 'contrast', 'type', 'layout', 'media', 'icons', 'actions', 'forms', 'containers', 'data', 'flight', 'status', 'board', 'page', 'art'] as const;
type SectionId = (typeof SECTIONS)[number];

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
  const c = dsCopy(lang);
  const props = { t, lang, c };
  const title = (id: SectionId) => (id === 'media' || id === 'flight' ? c.sections[id] : t(`designSystem.sections.${id}`));
  const number = (id: SectionId) => SECTIONS.indexOf(id) + 1;
  const media = styleGuideMedia(lang);
  const lowestText = Math.min(...CONTRAST_PAIRS.filter((pair) => pair.kind === 'text').flatMap((pair) => Object.values(pair.ratios))).toFixed(2);

  return (
    // Package E (fix round, performance-09): design-system copy is no longer in the root dictionary.
    <I18nScope lang={lang} namespaces={['designSystem']}>
      <HeroMedia as="header" image={media.hero} preload scrim="left" size="tall" credit={media.heroIsSample ? c.heroNote : undefined}>
        <div data-page-breadcrumbs="" className="mb-8">
          <Breadcrumbs items={[{ label: t('footer.designSystem') }]} />
        </div>
        <p className="type-overline flex items-center gap-3 text-gold-bright">
          <span aria-hidden="true" className="h-px w-8 bg-gold-bright" />
          {c.eyebrow}
        </p>
        <h1 className="type-display-xl mt-5 text-ink">{c.title}</h1>
        <p className="type-lead mt-5 text-ink-2">{c.lead}</p>
        <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-line-strong pt-6">
          {[
            { label: c.stats.pairs, value: CONTRAST_PAIRS.length },
            { label: c.stats.themes, value: TOKEN_THEME_IDS.length },
            { label: c.stats.lowest, value: `${lowestText}:1` },
          ].map((stat) => (
            <div key={stat.label} className="flex min-w-0 flex-col-reverse gap-1">
              <dt className="type-caption text-ink-2">{stat.label}</dt>
              <dd className="type-display-sm text-ink tabular">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </HeroMedia>

      <Container className="pt-10 pb-4 sm:pt-12">
        <PreviewToolbar />
        <nav aria-label={t('designSystem.contents')} className="mt-10">
          <h2 className="type-title-md mb-4 text-ink">{t('designSystem.contents')}</h2>
          <ol className="flex flex-wrap gap-2">
            {SECTIONS.map((id) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="group inline-flex min-h-11 items-center gap-2.5 rounded-pill border border-line bg-surface py-1.5 pr-4 pl-3 text-ink shadow-xs transition-[border-color,box-shadow] duration-fast hover:border-line-strong hover:shadow-sm"
                >
                  <span className="type-data-xs flex size-7 items-center justify-center rounded-full bg-fill text-ink-2">{String(number(id)).padStart(2, '0')}</span>
                  <span className="type-body-sm font-semibold">{title(id)}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </Container>

      <DsSection id="principles" number={number('principles')} tone="midnight" title={title('principles')}>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map((principle) => (
            <li key={principle.key} className="rounded-xl border border-line bg-surface/60 p-6">
              <span className="flex size-11 items-center justify-center rounded-full bg-gold-soft text-gold-bright">
                <Icon name={principle.icon} />
              </span>
              <h3 className="type-title-lg mt-5 text-ink">{t(`designSystem.principles.${principle.key}.title`)}</h3>
              <p className="type-body mt-2 text-ink-2">{t(`designSystem.principles.${principle.key}.body`)}</p>
            </li>
          ))}
        </ul>
      </DsSection>

      <DsSection id="colour" number={number('colour')} tone="subtle" title={title('colour')} intro={c.intro.colour}>
        <ColourTokens t={t} c={c} />
      </DsSection>

      <DsSection id="contrast" number={number('contrast')} title={title('contrast')} intro={c.intro.contrast}>
        <ContrastTables t={t} c={c} />
      </DsSection>

      <DsSection id="type" number={number('type')} tone="subtle" title={title('type')} intro={c.intro.type}>
        <TypeSpecimens t={t} c={c} />
      </DsSection>

      <DsSection id="layout" number={number('layout')} title={title('layout')} intro={c.intro.layout}>
        <LayoutTokens t={t} c={c} />
      </DsSection>

      <DsSection id="media" number={number('media')} tone="subtle" title={title('media')} intro={c.intro.media}>
        <MediaShowcase {...props} />
      </DsSection>

      <DsSection id="icons" number={number('icons')} title={title('icons')} intro={t('designSystem.intro.icons')}>
        <IconSamples />
      </DsSection>

      <DsSection id="actions" number={number('actions')} tone="subtle" title={title('actions')} intro={t('designSystem.intro.actions')}>
        <ActionsShowcase {...props} />
      </DsSection>

      <DsSection id="forms" number={number('forms')} title={title('forms')} intro={t('designSystem.intro.forms')}>
        <FormsShowcase {...props} />
      </DsSection>

      <DsSection id="containers" number={number('containers')} tone="subtle" title={title('containers')} intro={t('designSystem.intro.containers')}>
        <ContainersShowcase {...props} />
      </DsSection>

      <DsSection id="data" number={number('data')} title={title('data')} intro={t('designSystem.intro.data')}>
        <DataShowcase {...props} />
      </DsSection>

      <DsSection id="flight" number={number('flight')} tone="subtle" title={title('flight')} intro={c.intro.flight}>
        <FlightStatusShowcase {...props} />
      </DsSection>

      <DsSection id="status" number={number('status')} title={title('status')} intro={t('designSystem.intro.status')}>
        <StatusShowcase {...props} />
      </DsSection>

      <DsSection id="board" number={number('board')} tone="subtle" title={title('board')} intro={t('designSystem.intro.board')}>
        <BoardSample {...props} />
      </DsSection>

      <DsSection id="page" number={number('page')} title={title('page')} intro={t('designSystem.intro.page')}>
        <PageFurnitureShowcase {...props} />
      </DsSection>

      <DsSection id="art" number={number('art')} tone="subtle" title={title('art')} intro={t('designSystem.intro.art')}>
        <ArtShowcase {...props} />
      </DsSection>
    </I18nScope>
  );
}
