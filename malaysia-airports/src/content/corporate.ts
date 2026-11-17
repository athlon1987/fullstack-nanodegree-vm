/**
 * Corporate section content: types live in `./types`; this file holds a small verified seed and
 * the lookup helpers. The corporate-network authors add the bulk of the pages and news later.
 *
 * Content authors: add pages to `CORPORATE_PAGES` and announcements to `NEWS_ITEMS`. Use `fact`
 * blocks for figures so that each one carries its own source and date.
 */
import { lt, type CorporatePage, type CorporateSection, type NewsItem } from './types';

/** Corporate pages (`/corporate/<slug>`). */
export const CORPORATE_PAGES: CorporatePage[] = [
  {
    slug: 'network',
    section: 'network',
    title: lt('Our airport network', 'Rangkaian lapangan terbang kami'),
    summary: lt(
      'Malaysia Airports operates 39 airports in Malaysia: five international airports, 17 domestic airports and 17 short take-off and landing ports (STOLports).',
      'Malaysia Airports mengendalikan 39 lapangan terbang di Malaysia: lima lapangan terbang antarabangsa, 17 lapangan terbang domestik dan 17 lapangan terbang berlepas dan mendarat pendek (STOLport).',
    ),
    body: [
      {
        type: 'fact',
        label: lt('Airports operated in Malaysia', 'Lapangan terbang yang dikendalikan di Malaysia'),
        value: lt('39', '39'),
        asOf: '2024-04-29 (Annual Report 2023)',
        sources: ['mahb-annual-report-2023', 'mahb-annual-report-2023-text'],
      },
      {
        type: 'fact',
        label: lt('International airports', 'Lapangan terbang antarabangsa'),
        value: lt(
          'KL International Airport, Penang, Langkawi, Kota Kinabalu and Kuching',
          'Lapangan Terbang Antarabangsa KL, Pulau Pinang, Langkawi, Kota Kinabalu dan Kuching',
        ),
        asOf: '2024-04-29 (Annual Report 2023)',
        sources: ['mahb-annual-report-2023', 'mahb-annual-report-2023-text'],
      },
      {
        type: 'paragraph',
        text: lt(
          'Senai International Airport in Johor, Kerteh Airport and Tanjung Manis Airport are not operated by Malaysia Airports and are not part of this network.',
          'Lapangan Terbang Antarabangsa Senai di Johor, Lapangan Terbang Kerteh dan Lapangan Terbang Tanjung Manis tidak dikendalikan oleh Malaysia Airports dan bukan sebahagian daripada rangkaian ini.',
        ),
      },
    ],
    asOf: '2024-04-29',
    sources: ['mahb-annual-report-2023', 'mahb-annual-report-2023-text'],
  },
];

/** News and announcements (`/corporate/news/<slug>`), newest first is NOT assumed: use `latestNews`. */
export const NEWS_ITEMS: NewsItem[] = [
  {
    slug: 'klia-aerotrain-24-hour-service-resumes',
    title: lt('KLIA Aerotrain returns to 24-hour service', 'Aerotrain KLIA kembali beroperasi 24 jam'),
    date: '2026-06-01',
    summary: lt(
      'The Aerotrain between the Main Terminal Building and the Satellite Building at KLIA Terminal 1 returned to 24-hour service on 1 June 2026. One train continues to serve passengers during the daily engineering hours from 00:00 to 05:00.',
      'Aerotrain antara Bangunan Terminal Utama dan Bangunan Satelit di KLIA Terminal 1 kembali beroperasi 24 jam pada 1 Jun 2026. Satu tren terus beroperasi semasa waktu kejuruteraan harian dari 00:00 hingga 05:00.',
    ),
    airports: ['kul'],
    sources: ['fmt-aerotrain-24-hour-2026', 'thestar-aerotrain-24-hour-2026'],
  },
  {
    slug: 'kota-bharu-expanded-terminal-full-operation',
    title: lt(
      'Expanded terminal at Sultan Ismail Petra Airport in full operation',
      'Terminal baharu Lapangan Terbang Sultan Ismail Petra beroperasi sepenuhnya',
    ),
    date: '2026-03-16',
    summary: lt(
      'The expanded terminal at Sultan Ismail Petra Airport, Kota Bharu, began full operation on 16 March 2026. The expansion raised annual capacity from 1.5 million to 4 million passengers.',
      'Terminal yang diperluas di Lapangan Terbang Sultan Ismail Petra, Kota Bharu, mula beroperasi sepenuhnya pada 16 Mac 2026. Peluasan itu meningkatkan kapasiti tahunan daripada 1.5 juta kepada 4 juta penumpang.',
    ),
    airports: ['kbr'],
    sources: ['thestar-kbr-full-operation-2026'],
  },
];

/** One corporate page by slug (`network`, `sustainability/overview`). */
export function getCorporatePage(slug: string): CorporatePage | undefined {
  return CORPORATE_PAGES.find((page) => page.slug === slug);
}

/** Corporate pages in one section, in authoring order. */
export function corporatePagesBySection(section: CorporateSection): CorporatePage[] {
  return CORPORATE_PAGES.filter((page) => page.section === section);
}

/** Slugs of all corporate pages, for `generateStaticParams`. */
export function corporatePageSlugs(): string[] {
  return CORPORATE_PAGES.map((page) => page.slug);
}

/** One news item by slug. */
export function getNewsItem(slug: string): NewsItem | undefined {
  return NEWS_ITEMS.find((item) => item.slug === slug);
}

/** News items, newest first. Pass `limit` for teasers. */
export function latestNews(limit?: number): NewsItem[] {
  const sorted = [...NEWS_ITEMS].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  return limit === undefined ? sorted : sorted.slice(0, limit);
}
