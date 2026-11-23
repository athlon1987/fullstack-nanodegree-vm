import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { getGuide, guideSlugs, GUIDES } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { formatDate } from '@/lib/time';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LocaleLink } from '@/components/common/locale-link';
import { MissingPage } from '@/components/common/missing-page';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SourceNote } from '@/components/common/source-note';
import { TranslationNotice } from '@/components/common/translation-notice';
import { GuideCard } from '@/components/guides/guide-card';
import { GUIDE_IMAGES, RELATED_GUIDES } from '@/components/guides/guide-meta';
import { PageHero } from '@/components/guides/page-hero';
import { ReadingLayout, ReadingToc } from '@/components/guides/reading-layout';
import { toMediaImage } from '@/components/ui/media';
import { IMAGES } from '@/content/images';
import { GuideSteps } from '@/components/guides/guide-steps';
import { airportNotesForGuide, toGuideCard, toGuideView } from '@/components/guides/guide-views.server';
import { ScopeChips } from '@/components/guides/scope-chips';
import { Callout } from '@/components/ui/callout';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';
import { I18nPageScope } from '@/lib/i18n/page-scope';

export function generateStaticParams() {
  return guideSlugs().map((topic) => ({ topic }));
}

/** Guides are module content: every listed guide is fully static and an unknown slug is a real 404. */
export const ensureStatic = 'navigation';

export async function generateMetadata({ params }: PageProps<'/[lang]/guides/[topic]'>): Promise<Metadata> {
  const { lang: rawLang, topic } = await params;
  const lang = toLang(rawLang);
  const guide = getGuide(topic);
  if (!guide) return { title: getT(lang)('errors.notFoundTitle') };
  const view = toGuideView(guide, lang);
  return { alternates: languageAlternates(lang, `/guides/${topic}`), title: view.title, description: view.summary };
}

/**
 * No page-level `<Suspense>` (round 3, the static shell round 2 gave the airport overview, board and
 * map): every listed guide is complete in the static HTML, so the heading and the first content paint
 * with the document instead of waiting for React's throttled `$RC` reveal script (LCP 4.3 s on
 * transport). Any other guide gets `MissingPage`, a 404 with the site shell.
 */
export default function GuidePage({ params }: PageProps<'/[lang]/guides/[topic]'>) {
  return (
    <I18nPageScope namespaces={['guidePages']}>
      <Guide params={params} />
    </I18nPageScope>
  );
}

async function Guide({ params }: { params: PageProps<'/[lang]/guides/[topic]'>['params'] }) {
  const { lang: rawLang, topic } = await params;
  const lang = toLang(rawLang);
  const guide = getGuide(topic);
  if (!guide) return <MissingPage />;
  const t = getT(lang);
  const view = toGuideView(guide, lang);
  const notes = airportNotesForGuide(guide.slug, lang);
  const related = (RELATED_GUIDES[guide.slug] ?? [])
    .map((slug) => GUIDES.find((item) => item.slug === slug))
    .filter((item): item is (typeof GUIDES)[number] => Boolean(item))
    .map((item) => toGuideCard(item, lang));

  const imageId = GUIDE_IMAGES[guide.slug];
  const toc = [
    ...view.sections.map((section) => ({ id: `section-${section.id}`, label: section.title })),
    ...(notes.length > 0 ? [{ id: 'guide-airports', label: t('guidePages.guide.airportNotesTitle') }] : []),
  ];

  return (
    <>
      {/* Redesign stage two: a photograph for the travel guides that have a truthful one, otherwise a
          quiet editorial header with the guide's emblem. */}
      <PageHero
        image={imageId ? toMediaImage(IMAGES[imageId], lang, { credit: true }) : undefined}
        tone="light"
        emblem={view.icon}
        eyebrow={t('guidePages.guide.eyebrow')}
        title={view.title}
        lead={view.summary}
        breadcrumbs={<Breadcrumbs items={[{ label: t('nav.plan'), href: '/guides' }, { label: view.title }]} />}
        meta={
          <>
            <span className="type-body-sm inline-flex items-center gap-2 font-semibold text-ink">
              <Icon name={view.icon} size="sm" />
              {t.count('guidePages.hub.steps', view.stepCount)}
            </span>
            {view.asOf ? (
              <span className="type-body-sm inline-flex items-center gap-2 text-ink-2">
                <Icon name="calendar-days" size="sm" />
                {t('guidePages.guide.checked', { date: formatDate(view.asOf, lang, 'long') })}
              </span>
            ) : null}
            <ScopeChips scopes={view.scopes} t={t} showLabel />
          </>
        }
      />
      <Container className="pt-10 pb-section sm:pt-14">
        {view.translationMissing ? <TranslationNotice className="mb-8" /> : null}
        <ReadingLayout toc={<ReadingToc items={toc} title={t('guidePages.guide.onThisPage')} titleId="guide-toc-title" />}>
          {view.sections.map((section) => (
            <section key={section.id} aria-labelledby={`section-${section.id}`} className="max-w-[48rem] scroll-mt-32">
              <h2 id={`section-${section.id}`} className="type-display-sm scroll-mt-32 text-ink [text-wrap:balance]">
                {section.title}
              </h2>
              {section.intro ? <p className="type-body-lg mt-3 mb-8 max-w-reading text-ink-2 [text-wrap:pretty]">{section.intro}</p> : <div className="mb-8" />}
              <GuideSteps steps={section.steps} label={t('guidePages.guide.stepsLabel', { section: section.title })} t={t} />
            </section>
          ))}

          {notes.length > 0 ? (
            <section aria-labelledby="guide-airports" className="scroll-mt-32">
              <h2 id="guide-airports" className="type-display-sm text-ink">
                {t('guidePages.guide.airportNotesTitle')}
              </h2>
              <p className="type-body-lg mt-3 mb-8 max-w-reading text-ink-2">{t('guidePages.guide.airportNotesLead')}</p>
              <ul className="grid items-start gap-4 xl:grid-cols-2">
                {notes.map((note) => (
                  <li key={note.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="type-data-sm inline-flex h-7 items-center rounded-pill bg-primary-soft px-2.5 font-semibold text-primary-ink">
                          <abbr title={note.airportName} className="no-underline">
                            {note.airportCode}
                          </abbr>
                        </span>
                        <span className="type-caption text-ink-2">{note.airportName}</span>
                      </span>
                      <ProvenanceTag provenance={note.provenance} length="short" />
                    </div>
                    <h3 className="type-title-md text-ink">{note.title}</h3>
                    <p className="type-body-sm text-ink-2">{note.body}</p>
                    <SourceNote sources={note.sources} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="guide-sources" className="max-w-[48rem] rounded-2xl bg-page-subtle p-5 sm:p-6">
            <h2 id="guide-sources" className="type-title-sm flex items-center gap-2 text-ink">
              <Icon name="file-text" size="sm" className="text-ink-2" />
              {t('guidePages.guide.sourcesTitle')}
            </h2>
            <p className="type-body-sm mt-1 mb-2 text-ink-2">{t('guidePages.guide.sourcesLead')}</p>
            <SourceNote sources={view.sources} />
          </section>

          {related.length > 0 ? (
            <section aria-labelledby="guide-related">
              <h2 id="guide-related" className="type-display-sm mb-8 text-ink">
                {t('guidePages.guide.relatedTitle')}
              </h2>
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {related.map((card) => (
                  <GuideCard key={card.slug} guide={card} />
                ))}
              </ul>
            </section>
          ) : null}

          <Callout
            tone="neutral"
            icon="circle-help"
            title={t('guidePages.guide.helpTitle')}
            actions={
              <Button asChild variant="secondary" size="sm" iconEnd="arrow-right">
                <LocaleLink href="/help">{t('guidePages.guide.helpAction')}</LocaleLink>
              </Button>
            }
          >
            <p>{t('guidePages.guide.helpBody')}</p>
          </Callout>

          <ProvenanceLegend headingLevel={2} />
        </ReadingLayout>
      </Container>
    </>
  );
}
