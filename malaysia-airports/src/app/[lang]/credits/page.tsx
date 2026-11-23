import type { Metadata } from 'next';
import Image from 'next/image';
import { lang as routeLang } from 'next/root-params';
import { imagesByGroup, IMAGE_COUNT, type SiteImage } from '@/content/images';
import { getT, toLang, type Lang, type Translator } from '@/lib/i18n';
import { languageAlternates } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { ExternalLink } from '@/components/common/external-link';
import { PageHeader } from '@/components/common/page-header';
import { Callout } from '@/components/ui/callout';
import { Container } from '@/components/ui/container';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(toLang(await routeLang()));
  return { alternates: languageAlternates(await routeLang(), '/credits'), title: t('creditsPages.title'), description: t('creditsPages.metaDescription') };
}

/**
 * Photo credits: every photograph the site uses, with a thumbnail, the photographer, the licence
 * (linked), the original on Wikimedia Commons and what we changed. Static: everything comes from
 * `src/content/images.ts`, so the page is fully in the static shell (no clock, no Suspense).
 */
export default async function CreditsPage() {
  const lang = toLang(await routeLang());
  const t = getT(lang);
  const groups = imagesByGroup();

  return (
    <>
      <PageHeader
        title={t('creditsPages.title')}
        lead={IMAGE_COUNT > 0 ? t('creditsPages.lead') : t('creditsPages.empty')}
        meta={IMAGE_COUNT > 0 ? <p className="type-body-sm text-ink-2">{t.count('creditsPages.count', IMAGE_COUNT)}</p> : undefined}
        breadcrumbs={<Breadcrumbs items={[{ label: t('creditsPages.title') }]} />}
      />
      <Container className="flex flex-col gap-12 pb-section">
        {/* While the library is empty (images.ts STATUS) the lead says so and nothing else is shown. */}
        {IMAGE_COUNT > 0 ? <Callout className="max-w-reading">{t('creditsPages.notOfficial')}</Callout> : null}

        {groups.map(({ group, images }) => (
          <section key={group} aria-labelledby={`credits-${group}`}>
            <h2 id={`credits-${group}`} className="type-title-md text-ink">
              {t(`creditsPages.groups.${group}`)}
            </h2>
            <ul className="mt-4 grid gap-x-10 lg:grid-cols-2">
              {images.map((image) => (
                <CreditItem key={image.id} image={image} lang={lang} t={t} />
              ))}
            </ul>
          </section>
        ))}

        {IMAGE_COUNT > 0 ? (
          <section aria-labelledby="credits-reuse" className="max-w-reading">
            <h2 id="credits-reuse" className="type-title-md text-ink">
              {t('creditsPages.reuse.heading')}
            </h2>
            <p className="type-body mt-3 text-ink-2">{t('creditsPages.reuse.body')}</p>
            <p className="type-body mt-3 text-ink-2">{t('creditsPages.reuse.changesBody')}</p>
            <p className="type-body mt-3 text-ink-2">{t('creditsPages.reuse.replace')}</p>
          </section>
        ) : null}
      </Container>
    </>
  );
}

function CreditItem({ image, lang, t }: { image: SiteImage; lang: Lang; t: Translator }) {
  const descriptionId = `credit-${image.id}`;
  const { credit } = image;
  return (
    <li className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 border-t border-line py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-5">
      {/* The description beside it says what the photo shows, so the thumbnail itself is decorative. */}
      <Image
        src={image.src}
        width={image.width}
        height={image.height}
        alt=""
        sizes="(min-width: 640px) 160px, 96px"
        placeholder="blur"
        blurDataURL={image.blurDataURL}
        className="aspect-[3/2] h-auto w-full rounded-md bg-page-subtle object-cover"
        style={{ objectPosition: `${image.focal.x * 100}% ${image.focal.y * 100}%` }}
      />
      <div className="min-w-0">
        <p id={descriptionId} className="type-body text-ink">
          {image.alt[lang]}
        </p>
        <dl className="type-body-sm mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-ink-2">
          <dt className="font-medium text-ink">{t('creditsPages.author')}</dt>
          <dd className="min-w-0 break-words">{credit.author}</dd>
          <dt className="font-medium text-ink">{t('creditsPages.licence')}</dt>
          <dd className="min-w-0">
            <ExternalLink href={credit.licenceUrl} aria-describedby={descriptionId}>
              {credit.licence}
            </ExternalLink>
          </dd>
          <dt className="font-medium text-ink">{t('creditsPages.changes')}</dt>
          <dd className="min-w-0">{t(credit.modified.startsWith('cropped') ? 'creditsPages.modified.cropped' : 'creditsPages.modified.resized')}</dd>
        </dl>
        <p className="type-body-sm mt-2">
          <ExternalLink href={credit.sourceUrl} aria-describedby={descriptionId}>
            {t('creditsPages.source')}
          </ExternalLink>
        </p>
      </div>
    </li>
  );
}
