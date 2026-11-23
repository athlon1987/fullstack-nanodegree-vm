import { languageAlternates } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { getDictionary, getT, toLang } from '@/lib/i18n';
import { LocaleLink } from '@/components/common/locale-link';
import { CorporateHeader } from '@/components/corporate/corporate-header';
import { Container } from '@/components/ui/container';
import { Icon } from '@/components/ui/icon';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/terms'), title: t('corporatePages.terms.title'), description: t('corporatePages.terms.metaDescription') };
}

/** Terms of use for the prototype: plain, numbered, short. */
export default async function TermsPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const sections = Object.values(getDictionary(lang).corporatePages.terms.sections);

  return (
    <>
      <CorporateHeader t={t} current={null} emblem="file-text" title={t('corporatePages.terms.title')} lead={t('corporatePages.terms.lead')} meta={<p className="type-body-sm text-ink-2">{t('corporatePages.terms.updated')}</p>} />
      <Container className="pt-10 pb-section">
        <ol className="max-w-narrow divide-y divide-line rounded-2xl border border-line bg-surface px-5 shadow-sm sm:px-8">
          {sections.map((section, index) => (
            <li key={section.title} className="grid gap-x-8 gap-y-2 py-7 sm:grid-cols-[3rem_minmax(0,1fr)]">
              <span aria-hidden="true" className="type-display-sm tabular text-gold-ink">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h2 className="type-title-lg text-ink">{section.title}</h2>
                <p className="type-body mt-2 max-w-reading text-ink-2">{section.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
          <LocaleLink href="/privacy" className="link-action text-ink">
            {t('corporatePages.terms.privacyAction')}
            <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
          </LocaleLink>
          <LocaleLink href="/about-this-prototype" className="link-action text-ink">
            {t('corporatePages.terms.aboutAction')}
            <Icon name="arrow-right" size="sm" strokeWidth={1.75} />
          </LocaleLink>
        </div>
      </Container>
    </>
  );
}
