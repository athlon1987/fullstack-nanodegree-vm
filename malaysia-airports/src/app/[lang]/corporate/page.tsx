import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { BRAND_FACTS, CORPORATE_KEY_FIGURES, CORPORATE_LINKS } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { JsonLd, organizationJsonLd } from '@/lib/seo';
import { LocaleLink } from '@/components/common/locale-link';
import { SectionHeading } from '@/components/common/section-heading';
import { AirportVignette } from '@/components/art/airport-vignette';
import { BrandStatement } from '@/components/corporate/brand-statement';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { factViews, mediaViews } from '@/components/corporate/corporate-data.server';
import { FactList } from '@/components/corporate/fact-list';
import { MediaList } from '@/components/corporate/media-list';
import { PrototypeNote } from '@/components/corporate/prototype-note';
import { SectionIndex } from '@/components/corporate/section-index';
import { Icon } from '@/components/ui/icon';
import { Section } from '@/components/ui/section';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { title: t('corporatePages.title'), description: t('corporatePages.home.metaDescription') };
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
        title={t('corporatePages.home.title')}
        lead={t('corporatePages.home.lead')}
        art={<AirportVignette code="kul" terminal="T1" ground="page" />}
      />

      <Section spacing="md" aria-labelledby="corporate-figures">
        <SectionHeading id="corporate-figures" eyebrow={t('corporatePages.home.figuresEyebrow')} title={t('corporatePages.home.figuresTitle')} lead={t('corporatePages.home.figuresLead')} />
        <FactList facts={factViews(CORPORATE_KEY_FIGURES, lang)} t={t} layout="figures" />
      </Section>

      <Section tone="subtle" spacing="md" aria-labelledby="corporate-purpose">
        <h2 id="corporate-purpose" className="sr-only">
          {t('corporatePages.home.purposeEyebrow')}
        </h2>
        <BrandStatement statements={brand} asOfLabel={(date) => t('corporatePages.common.asOf', { date })} />
      </Section>

      <Section spacing="md" aria-labelledby="corporate-index">
        <SectionHeading id="corporate-index" eyebrow={t('corporatePages.home.indexEyebrow')} title={t('corporatePages.home.indexTitle')} />
        <SectionIndex t={t} />
      </Section>

      <Section spacing="md" aria-labelledby="corporate-latest">
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

      <Section spacing="md" aria-label={t('corporatePages.home.travelTitle')} className="pt-0">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-5">
          <div className="flex flex-col gap-3 rounded-lg bg-inverse p-5 text-on-inverse sm:p-6">
            <h2 className="type-title-md">{t('corporatePages.home.travelTitle')}</h2>
            <p className="type-body-sm text-on-inverse-dim">{t('corporatePages.home.travelBody')}</p>
            <LocaleLink
              href="/"
              className="mt-auto inline-flex min-h-11 items-center gap-2 self-start rounded-md bg-on-inverse px-4 font-semibold text-inverse transition-opacity duration-fast hover:opacity-90"
            >
              {t('corporatePages.home.travelAction')}
              <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
            </LocaleLink>
          </div>
          <PrototypeNote t={t} officialUrl={CORPORATE_LINKS.corporateSite.url} />
        </div>
      </Section>
    </>
  );
}
