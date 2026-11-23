import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { BRAND_FACTS, CORPORATE_KEY_FIGURES, CORPORATE_LINKS } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { JsonLd, organizationJsonLd } from '@/lib/seo';
import { LocaleLink } from '@/components/common/locale-link';
import { SectionHeading } from '@/components/common/section-heading';
import { BrandStatement } from '@/components/corporate/brand-statement';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { corporateImage } from '@/components/corporate/corporate-images';
import { factViews, mediaViews } from '@/components/corporate/corporate-data.server';
import { FactList } from '@/components/corporate/fact-list';
import { MediaList } from '@/components/corporate/media-list';
import { PrototypeNote } from '@/components/corporate/prototype-note';
import { SectionIndex } from '@/components/corporate/section-index';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/corporate'), title: t('corporatePages.title'), description: t('corporatePages.home.metaDescription') };
}

/** Corporate home: the company in numbers, its purpose, the sections and the latest news. Fully static. */
export default async function CorporateHomePage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const brand = factViews([BRAND_FACTS.vision, BRAND_FACTS.promise], lang);

  return (
    <>
      <JsonLd data={organizationJsonLd(lang)} />
      <CorporateHeader
        t={t}
        current="overview"
        size="lg"
        image={corporateImage('overview', lang)}
        title={t('corporatePages.home.title')}
        lead={t('corporatePages.home.lead')}
      />

      <Section spacing="lg" aria-labelledby="corporate-figures">
        <SectionHeading id="corporate-figures" eyebrow={t('corporatePages.home.figuresEyebrow')} title={t('corporatePages.home.figuresTitle')} lead={t('corporatePages.home.figuresLead')} />
        <FactList facts={factViews(CORPORATE_KEY_FIGURES, lang)} t={t} layout="figures" />
      </Section>

      {/* The page's one ivory band: the vision and promise as serif pull quotes. */}
      <Section tone="ivory" spacing="lg" aria-labelledby="corporate-purpose">
        <h2 id="corporate-purpose" className="sr-only">
          {t('corporatePages.home.purposeEyebrow')}
        </h2>
        <BrandStatement statements={brand} asOfLabel={(date) => t('corporatePages.common.asOf', { date })} />
      </Section>

      <Section spacing="lg" aria-labelledby="corporate-index">
        <SectionHeading id="corporate-index" eyebrow={t('corporatePages.home.indexEyebrow')} title={t('corporatePages.home.indexTitle')} />
        <SectionIndex t={t} />
      </Section>

      <Section tone="subtle" spacing="lg" aria-labelledby="corporate-latest">
        <SectionHeading
          id="corporate-latest"
          eyebrow={t('corporatePages.home.latestEyebrow')}
          title={t('corporatePages.home.latestTitle')}
          action={
            <LocaleLink href="/corporate/news" className="link-action text-ink">
              {t('corporatePages.home.allNews')}
              <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
            </LocaleLink>
          }
        />
        <MediaList items={mediaViews(lang, 3)} t={t} variant="cards" />
      </Section>

      <Section spacing="lg" aria-label={t('corporatePages.home.travelTitle')}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-5">
          <div className="surface-midnight on-media flex flex-col gap-3 rounded-2xl p-6 text-ink shadow-md sm:p-8">
            <h2 className="type-display-sm text-ink">{t('corporatePages.home.travelTitle')}</h2>
            <p className="type-body text-ink-2">{t('corporatePages.home.travelBody')}</p>
            <Button asChild variant="gold" iconEnd="arrow-right" className="mt-4 self-start">
              <LocaleLink href="/">{t('corporatePages.home.travelAction')}</LocaleLink>
            </Button>
          </div>
          <PrototypeNote t={t} officialUrl={CORPORATE_LINKS.corporateSite.url} />
        </div>
      </Section>
    </>
  );
}
