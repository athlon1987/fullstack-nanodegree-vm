import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { getGuide, guideSlugs, GUIDES } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { formatDate } from '@/lib/time';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { LocaleLink } from '@/components/common/locale-link';
import { MissingPage } from '@/components/common/missing-page';
import { PageHeader } from '@/components/common/page-header';
import { ProvenanceLegend } from '@/components/common/provenance-legend';
import { ProvenanceTag } from '@/components/common/provenance-tag';
import { SectionHeading } from '@/components/common/section-heading';
import { SourceNote } from '@/components/common/source-note';
import { TranslationNotice } from '@/components/common/translation-notice';
import { GuideCard } from '@/components/guides/guide-card';
import { RELATED_GUIDES } from '@/components/guides/guide-meta';
import { GuideSteps } from '@/components/guides/guide-steps';
import { airportNotesForGuide, toGuideCard, toGuideView } from '@/components/guides/guide-views.server';
import { ScopeChips } from '@/components/guides/scope-chips';
import { Badge } from '@/components/ui/badge';
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

  return (
    <>
      <PageHeader
        eyebrow={t('guidePages.guide.eyebrow')}
        title={view.title}
        lead={view.summary}
        breadcrumbs={<Breadcrumbs items={[{ label: t('nav.plan'), href: '/guides' }, { label: view.title }]} />}
        meta={
          <>
            <span className="type-body-sm inline-flex items-center gap-2 text-ink-2">
              <Icon name={view.icon} size="sm" />
              {t.count('guidePages.hub.steps', view.stepCount)}
            </span>
            {view.asOf ? <span className="type-body-sm text-ink-2">{t('guidePages.guide.checked', { date: formatDate(view.asOf, lang, 'long') })}</span> : null}
            <ScopeChips scopes={view.scopes} t={t} showLabel />
          </>
        }
      />
      <Container className="pb-section">
        {view.translationMissing ? <TranslationNotice className="mb-8" /> : null}
        <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-labelledby="guide-toc-title" className="min-w-0 border-l border-line-strong pl-4 lg:sticky lg:top-sticky lg:self-start lg:pt-6">
            <p id="guide-toc-title" className="type-eyebrow mb-2 text-ink-3">
              {t('guidePages.guide.onThisPage')}
            </p>
            <ol className="flex flex-col">
              {view.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#section-${section.id}`} className="link-action type-body-sm text-ink-2 hover:text-ink">
                    {section.title}
                  </a>
                </li>
              ))}
              {notes.length > 0 ? (
                <li>
                  <a href="#guide-airports" className="link-action type-body-sm text-ink-2 hover:text-ink">
                    {t('guidePages.guide.airportNotesTitle')}
                  </a>
                </li>
              ) : null}
            </ol>
          </nav>

          <div className="flex min-w-0 flex-col gap-14">
            {view.sections.map((section, index) => (
              <section key={section.id} aria-labelledby={`section-${section.id}`} className="scroll-mt-32">
                <SectionHeading id={`section-${section.id}`} number={index + 1} title={section.title} lead={section.intro} variant="title" />
                <GuideSteps steps={section.steps} label={t('guidePages.guide.stepsLabel', { section: section.title })} t={t} />
              </section>
            ))}

            {notes.length > 0 ? (
              <section aria-labelledby="guide-airports" className="scroll-mt-32 border-t border-line pt-10">
                <SectionHeading
                  id="guide-airports"
                  title={t('guidePages.guide.airportNotesTitle')}
                  lead={t('guidePages.guide.airportNotesLead')}
                  variant="title"
                />
                <ul className="grid items-start gap-3 xl:grid-cols-2">
                  {notes.map((note) => (
                    <li key={note.id} className="flex min-w-0 flex-col gap-2 rounded-lg border border-line-strong bg-surface p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">
                          <abbr title={note.airportName} className="no-underline">
                            {note.airportCode}
                          </abbr>
                        </Badge>
                        <ProvenanceTag provenance={note.provenance} length="short" />
                      </div>
                      <h3 className="type-title-sm text-ink">{note.title}</h3>
                      <p className="type-body-sm text-ink-2">{note.body}</p>
                      <SourceNote sources={note.sources} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section aria-labelledby="guide-sources" className="border-t border-line pt-10">
              <h2 id="guide-sources" className="type-title-md text-ink">
                {t('guidePages.guide.sourcesTitle')}
              </h2>
              <p className="type-body-sm mt-1 mb-2 text-ink-2">{t('guidePages.guide.sourcesLead')}</p>
              <SourceNote sources={view.sources} />
            </section>

            {related.length > 0 ? (
              <section aria-labelledby="guide-related">
                <SectionHeading id="guide-related" title={t('guidePages.guide.relatedTitle')} variant="title" />
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
          </div>
        </div>
      </Container>
    </>
  );
}
