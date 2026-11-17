import type { Metadata } from 'next';
import { lang as routeLang } from 'next/root-params';
import { getNotices } from '@/content';
import { getT, toLang } from '@/lib/i18n';
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import { toNoticeViews } from '@/components/airport/notice-views.server';
import { HomeBoard, HomeConcierge, HomeHero, HomeJourney, HomeNetwork, HomeShopDine } from '@/components/home/home-sections';

export async function generateMetadata(): Promise<Metadata> {
  const t = getT(await routeLang());
  return {
    title: { absolute: `${t('common.appName')}: ${t('home.metaTitle')}` },
    description: t('home.metaDescription'),
  };
}

/**
 * Network home. Everything on it that depends on the clock, the remembered airport or the
 * journey mode is a Client Component fed with server-prepared content, so the page itself is
 * fully static in both languages.
 */
export default async function HomePage() {
  const lang = toLang(await routeLang());
  return (
    <>
      <JsonLd data={[websiteJsonLd(lang), organizationJsonLd(lang)]} />
      <HomeHero lang={lang} notices={toNoticeViews(getNotices(), lang, 'compact')} />
      <HomeBoard lang={lang} />
      <HomeJourney lang={lang} />
      <HomeNetwork lang={lang} />
      <HomeShopDine lang={lang} />
      <HomeConcierge lang={lang} />
    </>
  );
}
