/**
 * Corporate section content: types live in `./types`; this file holds a small verified seed and
 * the lookup helpers. The corporate-network authors add the bulk of the pages and news later.
 *
 * Content authors: add pages to `CORPORATE_PAGES` and announcements to `NEWS_ITEMS`. Use `fact`
 * blocks for figures so that each one carries its own source and date.
 *
 * The second half of this file (from "Corporate section extension") holds the facts behind the
 * corporate pages: history, ownership, leadership, brand, traffic, sustainability, business
 * channels and media items. Every value comes from `docs/research/facts/f-corporate.json`
 * (evidence `search`, confidence high or medium) and cites sources from `CORPORATE_SOURCES`
 * or the core registry. Unknown facts are left out; the pages say so and link to the official
 * channel instead.
 */
import { lt, type CorporatePage, type CorporateSection, type LocalizedText, type NewsItem, type Source, type SourceKind } from './types';

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

/* =============================================================================================
 * Corporate section extension (corporate-network team)
 *
 * Kept apart from `CORPORATE_PAGES` and `NEWS_ITEMS` because its sources are not in the core
 * registry yet: `CORPORATE_SOURCES` below holds them, and the corporate pages resolve ids
 * against both. Validated by `src/components/corporate/corporate-content.test.ts`.
 * ========================================================================================== */

const RETRIEVED = '2026-11-16';
const MAHB = 'Malaysia Airports Holdings Berhad';
const MAHB_VIA_ROUTES = 'Malaysia Airports Holdings Berhad (release published on Routesonline)';

function source(id: string, kind: SourceKind, publisher: string, title: string, url: string, asOf?: string): Source {
  return asOf ? { id, kind, publisher, title, url, retrieved: RETRIEVED, asOf } : { id, kind, publisher, title, url, retrieved: RETRIEVED };
}

/**
 * Sources used only by the corporate section. Official pages were read through search results on
 * 16 November 2026 (the official sites could not be fetched directly), which the titles say.
 */
export const CORPORATE_SOURCES: readonly Source[] = [
  /* ---- Malaysia Airports ------------------------------------------------------------------ */
  source('corp-mahb-corporate-site', 'official', MAHB, 'Malaysia Airports corporate website', 'https://corporate.malaysiaairports.com.my/'),
  source('corp-mahb-our-brand', 'official', MAHB, 'Our Core Values / Our Brand (corporate website, as summarised in search results)', 'https://corporate.malaysiaairports.com.my/en/about-us/corporate-profile/our-brand'),
  source('corp-mahb-management-team', 'official', MAHB, 'Management Team (corporate website, as summarised in search results)', 'https://corporate.malaysiaairports.com.my/en/about-us/organisation/management-team'),
  source('corp-mahb-board', 'official', MAHB, 'Board of Directors (corporate website; page found in search results, content not read)', 'https://corporate.malaysiaairports.com.my/en/about-us/organisation/board-directors'),
  source('corp-mahb-subsidiaries', 'official', MAHB, 'Subsidiaries (Malaysia Airports website, as summarised in search results)', 'https://www.malaysiaairports.com.my/about-us/subsidiaries'),
  source('corp-mahb-sustainability', 'official', MAHB, 'Memorable Airport Experiences (corporate website, Sustainability section)', 'https://corporate.malaysiaairports.com.my/en/sustainability/memorable-airport-experiences'),
  source('corp-mahb-careers-portal', 'official', MAHB, 'Malaysia Airports careers portal', 'https://careers.malaysiaairports.com.my/'),
  source('corp-mahb-careers-leaders', 'official', MAHB, 'Our Leaders, Malaysia Airports careers portal (as summarised in search results)', 'https://careers.malaysiaairports.com.my/content/Our-Leaders/?locale=en_GB'),
  source('corp-mahb-news-1787', 'official', MAHB, 'Tan Sri Dr. Azmil Khalid appointed as Malaysia Airports … (media centre; title shortened in search results)', 'https://corporate.malaysiaairports.com.my/en/media-centre/news/1787', '2026-06-18'),
  source('corp-mahb-news-1401', 'official', MAHB, "Managing Director Dato' Mohd Izani Ghani appointed … (media centre; title shortened in search results)", 'https://www.malaysiaairports.com.my/en/media-centre/news/1401'),
  source('corp-mahb-news-1678', 'official', MAHB, 'Strong 2025 passenger growth builds momentum for Visit Malaysia 2026 (media centre)', 'https://corporate.malaysiaairports.com.my/en/media-centre/news/1678', '2026-01-19'),
  source('corp-mahb-news-1686', 'official', MAHB, 'Visit Malaysia 2026 opens with 9.4 million passengers at … (media centre; title shortened in search results)', 'https://corporate.malaysiaairports.com.my/en/media-centre/news/1686', '2026-02'),
  source('corp-mahb-news-273', 'official', MAHB, 'Operating Agreements release (media centre item 273; title not captured)', 'https://corporate.malaysiaairports.com.my/en/media-centre/news/273', '2023-02'),
  source('corp-mahb-aerotrain-back-on-track', 'official', MAHB, 'KLIA Aerotrain replacement project back on track (media centre)', 'https://www.malaysiaairports.com.my/media-centre/news/klia-aerotrain-replacement-project-back-track', '2024-01'),
  source('corp-mahb-ar2020', 'official', MAHB, 'Malaysia Airports Annual Report 2020 microsite', 'http://annualreport2020.malaysiaairports.com.my/', 'Annual Report 2020'),
  source('corp-mahb-sr2019', 'official', MAHB, 'Malaysia Airports Sustainability Report 2019 (PDF)', 'https://drmapssdev.blob.core.windows.net/corporate-cms/2024-06/MAHB-Sustainability-Report-2019.pdf', '2019'),
  source('corp-routes-2025-growth', 'official', MAHB_VIA_ROUTES, "Malaysia Airports' Strong 2025 Passenger Growth Builds Momentum for Visit Malaysia 2026", 'https://www.routesonline.com/airports/9835/malaysia-airports-holdings-berhad/news/299665873/malaysia-airports-strong-2025-passenger-growth-builds-momentum-for-visit-malaysia-2026/', '2026-01'),
  source('corp-routes-vm2026-january', 'official', MAHB_VIA_ROUTES, 'Visit Malaysia 2026 Opens with 9.4 Million Passengers at Airports Nationwide', 'https://www.routesonline.com/airports/9835/malaysia-airports-holdings-berhad/news/299666012/visit-malaysia-2026-opens-with-94-million-passengers-at-airports-nationwide/', '2026-02'),
  source('corp-routes-september-2026', 'official', MAHB_VIA_ROUTES, "Malaysia Airports' Regional Airports Record International Traffic Growth in September", 'https://www.routesonline.com/airports/9835/malaysia-airports-holdings-berhad/news/299667154/malaysia-airports-regional-airports-record-international-traffic-growth-in-september/', '2026-10'),
  source('corp-routes-operating-agreements', 'official', MAHB_VIA_ROUTES, 'New Operating Agreements Ensure Commercial Sustainability and Facilitate Growth for Malaysia Airports', 'https://www.routesonline.com/airports/8/kuala-lumpur-international-airport-klia/news/299400/new-operating-agreements-ensure-commercial-sustainability-and-facilitate-growth-for-malaysia-airports/', '2023-02'),
  source('corp-routes-langkawi-asq', 'official', MAHB_VIA_ROUTES, 'Langkawi International Airport 5th ASQ Awards Win for Best Airport', 'https://www.routesonline.com/airports/6438/langkawi-international-airport/news/299666010/langkawi-international-airport-5th-asq-awards-win-for-best-airport/', '2026'),
  source('corp-edge-solar-advertorial', 'official', 'The Edge Malaysia (advertorial for Malaysia Airports)', "Powering the future of aviation: How KLIA Aeropolis Solar Park supports Malaysia Airports' transformation journey", 'https://theedgemalaysia.com/content/advertise/powering-the-future-of-aviation-how-klia-aeropolis-solar-park-supports-malaysia-airports-transformation-journey', '2026-01'),

  /* ---- Programme operators ---------------------------------------------------------------- */
  source('corp-aci-aca-bki-lgk-2024', 'operator', 'ACI Asia-Pacific & Middle East (operator of Airport Carbon Accreditation)', 'Kota Kinabalu and Langkawi achieve Airport Carbon Accreditation', 'https://www.aci-asiapac.aero/media-centre/news/kota-kinabalu-and-langkawi-achieve-airport-carbon-accreditation', '2024-12-05'),

  /* ---- Press ------------------------------------------------------------------------------ */
  source('corp-fmt-consortium-2024', 'news', 'Free Malaysia Today', 'Khazanah and EPF lead consortium to take over MAHB', 'https://www.freemalaysiatoday.com/category/highlight/2024/05/15/khazanah-and-epf-lead-consortium-to-take-over-mahb', '2024-05-15'),
  source('corp-nst-privatise-2024', 'news', 'New Straits Times', 'Khazanah, EPF, two partners privatise Malaysia Airports RM12.3bil (title from the address)', 'https://nst.com.my/amp/business/corporate/2024/05/1051048/khazanah-epf-two-partners-privatise-malaysia-airports-rm123bil', '2024-05'),
  source('corp-thestar-khazanah-epf-2024', 'news', 'The Star', 'Khazanah, EPF on MAHB privatisation and future benefits', 'https://www.thestar.com.my/news/nation/2024/05/26/khazanah-epf-on-mahb-privatisation-and-future-benefits', '2024-05-26'),
  source('corp-malaymail-takeover-2024', 'news', 'Malay Mail', "What's behind the controversy of MAHB's Khazanah-EPF takeover", 'https://www.malaymail.com/amp/news/malaysia/2024/05/24/whats-behind-the-controversy-of-mahbs-khazanah-epf-takeover-and-what-does-israel-have-to-do-with-it/135866', '2024-05-24'),
  source('corp-nst-ownership-70pct-2024', 'news', 'New Straits Times', 'PM: No sale of MAHB to foreign firms, ownership boosted to 70pct', 'https://www.nst.com.my/amp/news/nation/2024/06/1067999/pm-no-sale-mahb-foreign-firms-ownership-boosted-70pct-watch', '2024-06'),
  source('corp-fmt-offer-2024', 'news', 'Free Malaysia Today', 'Khazanah-led consortium makes formal offer for MAHB at RM11 per share', 'https://fmtv5.freemalaysiatoday.com/category/nation/2024/11/15/khazanah-led-consortium-makes-formal-offer-for-mahb-at-rm11-per-share', '2024-11-15'),
  source('corp-thestar-delisting-2025', 'news', 'The Star', 'Delisting a watershed moment for MAHB privatisation', 'https://www.thestar.com.my/business/business-news/2025/02/25/delisting-a-watershed-moment-for-mahb-privatisation', '2025-02-25'),
  source('corp-malaysiakini-delisting-2025', 'news', 'Malaysiakini', 'MAHB delisting after 25 years a watershed moment for its privatisation', 'https://www.malaysiakini.com/news/735493', '2025-02'),
  source('corp-bernama-delisting-2025', 'news', 'Bernama', 'Report on the MAHB delisting (title not captured in search results)', 'https://www.bernama.com/en/news.php?id=2415761', '2025-02'),
  source('corp-azmilaw-delisting', 'other', 'Azmi & Associates (law firm)', 'Azmi & Associates Advises MAHB on Landmark Takeover and Delisting Exercise', 'https://www.azmilaw.com/news/azmi-associates-advises-mahb-on-landmark-takeover-and-delisting-exercise/'),
  source('corp-capa-ined-2025', 'news', 'CAPA Centre for Aviation', 'MAHB: all independent non-executive directors tender resignations prior to Bursa de-listing', 'https://centreforaviation.com/news/mahb-all-independent-non-executive-directors-tender-resignations-prior-to-bursa-de-listing-1304931', '2025-02'),
  source('corp-thestar-chairman-2026', 'news', 'The Star', 'MAHB appoints Azmil Khalid as non-independent non-executive chairman', 'https://www.thestar.com.my/business/business-news/2026/06/18/mahb-appoints-azmil-khalid-as-non-independent-non-executive-chairman', '2026-06-18'),
  source('corp-edge-chairman-2026', 'news', 'The Edge Malaysia', 'MAHB appoints Azmil Khalid as new chairman', 'https://theedgemalaysia.com/node/807430', '2026-06'),
  source('corp-nst-chairman-2026', 'news', 'New Straits Times', "Malaysia Airports names Azmil Khalid as chairman, extends MD's tenure", 'https://www.nst.com.my/business/corporate/2026/06/1466564/malaysia-airports-names-azmil-khalid-chairman-extends-mds-tenure', '2026-06'),
  source('corp-thestar-traffic-2025', 'news', 'The Star', 'MAHB registers 11.2% rise in passengers for 2025', 'https://www.thestar.com.my/business/business-news/2026/01/20/mahb-registers-112-rise-in-passengers-for-2025', '2026-01-20'),
  source('corp-edge-traffic-2025', 'news', 'The Edge Malaysia', 'Malaysia Airports reports 11.2% rise in passenger traffic in 2025', 'https://theedgemalaysia.com/node/789693', '2026-01'),
  source('corp-xinhua-traffic-2025', 'news', 'Xinhua', "Malaysia airports' passenger movements reach 153.3 mln in 2025", 'https://english.news.cn/20260120/2233e40852214ce390452a2840fc711d/c.html', '2026-01-20'),
  source('corp-edge-august-2026', 'news', 'The Edge Malaysia', "Malaysia Airports' August passenger traffic up 5.2%", 'https://theedgemalaysia.com/node/819567', '2026-09'),
  source('corp-thestar-september-2026', 'news', 'The Star', 'Traffic slows in Malaysia airports in September amid soft domestic demand', 'https://www.thestar.com.my/business/business-news/2026/10/26/traffic-slows-in-malaysia-airports-in-september-amid-soft-domestic-demand', '2026-10-26'),
  source('corp-edge-september-2026', 'news', 'The Edge Malaysia', 'Subang, Ipoh, Penang airports see international passenger growth in September despite national decline', 'https://theedgemalaysia.com/node/823206', '2026-10'),
  source('corp-businesstoday-september-2026', 'news', 'BusinessToday', "Penang Airport International Traffic Rises 5.3% Despite Malaysia Airports' September Decline", 'https://www.businesstoday.com.my/2026/10/26/penang-airport-international-traffic-rises-5-3-despite-malaysia-airports-september-decline/', '2026-10-26'),
  source('corp-hurriyet-istanbul-2025', 'news', 'Hurriyet Daily News', "Istanbul's airports set all-time passenger records in 2025", 'https://hurriyetdailynews.com/istanbuls-airports-set-all-time-passenger-records-in-2025-217313', '2026-01'),
  source('corp-vibes-q3-2025', 'news', 'The Vibes', 'MAHB records 12.2% rise in passenger traffic amid route expansion and airline growth', 'https://www.thevibes.com/articles/business/114341/mahb-records-12.2-rise-in-passenger-traffic-amid-route-expansion-and-airline-growth', '2025-10'),
  source('corp-marketscreener-hourly-2025', 'aggregator', 'MarketScreener (relay of a Malaysia Airports release)', 'KLIA breaks hourly passenger record with more than 12,000 movements', 'https://www.marketscreener.com/news/klia-breaks-hourly-passenger-record-with-more-than-12-000-movements-ce7d5bdbdb8af120', '2025-09'),
  source('corp-malaymail-oa-2023', 'news', 'Malay Mail', 'Minister: Under new deal with MAHB, travellers to also fund airport developments along with govt', 'https://www.malaymail.com/news/malaysia/2023/02/09/minister-under-new-deal-with-mahb-travellers-to-also-fund-airport-developments-along-with-govt/54105', '2023-02-09'),
  source('corp-borneopost-oa-2024', 'news', 'The Borneo Post (via PressReader)', 'Govt, MAHB ink new 45-year deals to upgrade Malaysian airports', 'https://www.pressreader.com/malaysia/the-borneo-post/20240319/281548000876163', '2024-03-19'),
  source('corp-kenanga-oa-2024', 'other', 'Kenanga Research', 'Company update on MAHB (analyst note)', 'https://www.kenanga.com.my/wp-content/uploads/2024/03/AIRPORT-240319-CU-Kenanga.pdf', '2024-03-19'),
  source('corp-malaymail-oa-analysts-2024', 'news', 'Malay Mail', "MAHB's new operating agreement with govt strengthens its earnings prospects, say analysts", 'https://www.malaymail.com/news/money/2024/03/21/mahbs-new-operating-agreement-with-govt-strengthens-its-earnings-prospects-say-analysts/124690', '2024-03-21'),
  source('corp-malaymail-aerotrain-returns-2025', 'news', 'Malay Mail', 'KLIA Aerotrain returns July 1, Anwar to officiate relaunch', 'https://www.malaymail.com/news/malaysia/2025/06/30/klia-aerotrain-returns-july-1-anwar-to-officiate-relaunch-loke-applauds-revival/182306', '2025-06-30'),
  source('corp-malaymail-aerotrain-cost-2025', 'news', 'Malay Mail', 'KLIA Aerotrain to return in second quarter of 2025 after RM456m overhaul, MAHB confirms', 'https://www.malaymail.com/news/malaysia/2025/01/24/klia-aerotrain-to-return-in-second-quarter-of-2025-after-rm456m-overhaul-mahb-confirms/164425', '2025-01-24'),
  source('corp-thestar-aerotrain-cost-2024', 'news', 'The Star', 'Aerotrain back on track but at higher cost', 'https://www.thestar.com.my/business/business-news/2024/01/18/aerotrain-back-on-track-but-at-higher-cost', '2024-01-18'),
  source('corp-malaymail-aerotrain-alstom-2024', 'news', 'Malay Mail', 'MAHB, Alstom, IJMC-Pestech JV tie up to complete KLIA Aerotrain replacement project', 'https://www.malaymail.com/news/money/2024/01/17/mahb-alstom-ijmc-pestech-jv-tie-up-to-complete-klia-aerotrain-replacement-project/112923', '2024-01-17'),
  source('corp-edge-baggage-2022', 'news', 'The Edge Malaysia', 'T7 Global-Siemens consortium wins KLIA baggage handling system contract', 'https://theedgemalaysia.com/article/t7-globalsiemens-consortium-wins-klia-baggage-handling-system-contract', '2022-12'),
  source('corp-thestar-baggage-2022', 'news', 'The Star', 'T7 consortium secures KLIA contract', 'https://www.thestar.com.my/business/business-news/2022/12/15/t7-consortium-secures-klia-contract', '2022-12-15'),
  source('corp-skrine-baggage-2023', 'other', 'Skrine (law firm)', 'Transaction News: Malaysia Airports awards contract for upgrade of baggage handling system at KLIA-1', 'https://www.skrine.com/insights/alerts/january-2023/transaction-news-malaysia-airports-awards-contract', '2023-01'),
  source('corp-thesun-baggage-2028', 'news', 'The Sun', 'T7 Global executes resequencing agreement for KLIA T1 baggage handling system, targeted to be complete by Q4 2028', 'https://thesun.my/business/t7-global-executes-resequencing-agreement-for-klia-t1-baggage-handling-system-targeted-to-be-complete-by-q4-2028/', '2026-01'),
  source('corp-malaymail-solar-2026', 'news', 'Malay Mail', 'DPM Fadillah unveils KLIA Aeropolis solar farm and battery project', 'https://www.malaymail.com/news/malaysia/2026/01/29/dpm-fadillah-unveils-klia-aeropolis-solar-farm-and-battery-project-as-malaysia-powers-up-energy-transition/207242', '2026-01-29'),
  source('corp-bernama-solar-2026', 'news', 'Bernama', "KLIA Aeropolis Solar Farm To Cut KLIA's Carbon Emissions By 30 Pct In 2027 -- MAHB", 'https://www.bernama.com/lite/news.php?id=2518164', '2026-01'),
  source('corp-thestar-aca-2026', 'news', 'The Star', 'Malaysia Airports wins international carbon accreditation recognition', 'https://www.thestar.com.my/business/business-news/2026/05/13/malaysia-airports-wins-international-carbon-accreditation-recognition', '2026-05-13'),
  source('corp-bernama-aca-2024', 'news', 'Bernama', 'Kota Kinabalu And Langkawi Achieve Airport Carbon Accreditation', 'https://bernama.com/en/news.php?id=2371297', '2024-12'),
  source('corp-fmt-skytrax-2025', 'news', 'Free Malaysia Today', 'KLIA climbs to 65th best airport worldwide', 'https://www.freemalaysiatoday.com/category/nation/2025/04/10/klia-climbs-to-65th-best-airport-worldwide', '2025-04-10'),
  source('corp-scoop-skytrax-2025', 'news', 'Scoop', "KLIA improves seven spots to be world's 65th best airport in Skytrax rankings", 'https://www.scoop.my/news/252929/klia-improves-seven-spots-to-be-worlds-65th-best-airport-in-skytrax-rankings/', '2025-04'),
  source('corp-malaymail-asq-2024', 'news', 'Malay Mail', "KLIA makes world's top 10 in 2024 Airport Service Quality survey", 'https://www.malaymail.com/news/malaysia/2025/03/17/klia-makes-worlds-top-10-in-2024-airport-service-quality-survey/169917', '2025-03-17'),

  /* ---- Reference works -------------------------------------------------------------------- */
  source('corp-wikipedia-mahb', 'other', 'Wikipedia', 'Malaysia Airports', 'https://en.wikipedia.org/wiki/Malaysia_Airports'),
  source('corp-nus-ar1999', 'other', 'NUS Libraries (copy of a Malaysia Airports publication)', 'Malaysia Airports Holdings Berhad Annual Report 1999, corporate profile pages', 'https://lib.nus.edu.sg/nus_hl/airport1999-3.pdf', '1999'),
];

/* ---- Shapes ------------------------------------------------------------------------------- */

/** A dated, sourced statement shown as a label and a value. */
export interface CorporateFact {
  id: string;
  label: LocalizedText;
  value: LocalizedText;
  /** One or two sentences of context or a caveat. */
  note?: LocalizedText;
  /** When the fact applies: `YYYY-MM-DD`, `YYYY-MM` or `YYYY`. */
  asOf: string;
  sources: string[];
}

/** A dated moment in the company's history. */
export interface CorporateMilestone {
  id: string;
  /** `YYYY-MM-DD`, `YYYY-MM` or `YYYY`. */
  date: string;
  title: LocalizedText;
  body?: LocalizedText;
  sources: string[];
}

/** A named person in a stated role. */
export interface CorporatePerson {
  id: string;
  name: string;
  role: LocalizedText;
  /** Effective date of the appointment, when published. */
  since?: string;
  note?: LocalizedText;
  sources: string[];
}

/** A passenger figure from a traffic statement. Values in millions of passengers. */
export interface TrafficFigure {
  id: string;
  /** `YYYY`, `YYYY-MM`, or a range `YYYY-MM/YYYY-MM`. */
  period: string;
  scope: 'malaysia' | 'malaysia-international' | 'malaysia-domestic' | 'klia' | 'group' | 'istanbul';
  millions: number;
  /** The source rounds or says "about" / "more than". */
  qualifier?: 'about' | 'over';
  /** Year-on-year change in per cent, when published. */
  changePct?: number;
  /** Date the figure was reported. */
  reported: string;
  sources: string[];
}

/** Airport Carbon Accreditation held by an airport in the network. */
export interface CarbonAccreditation {
  /** Airport slug. */
  airport: string;
  level: number;
  levelName?: LocalizedText;
  /** When the level was reported or attained: `YYYY-MM-DD` or `YYYY-MM`. */
  asOf: string;
  sources: string[];
}

/** An item in the media centre: an official release, or press coverage of company news. */
export interface CorporateMediaItem {
  slug: string;
  /** `release` comes from Malaysia Airports; `coverage` is press reporting of company news. */
  kind: 'release' | 'coverage';
  topic: 'traffic' | 'company' | 'sustainability' | 'recognition' | 'projects';
  /** `YYYY-MM-DD`, or `YYYY-MM` when only the month is known. */
  date: string;
  title: LocalizedText;
  summary: LocalizedText;
  airports?: string[];
  sources: string[];
}

/** An official channel to link out to. */
export interface CorporateLink {
  url: string;
  sources: string[];
}

/* ---- Official channels -------------------------------------------------------------------- */

/** Official addresses the corporate pages link to. Only addresses the research found. */
export const CORPORATE_LINKS = {
  corporateSite: { url: 'https://corporate.malaysiaairports.com.my/', sources: ['corp-mahb-corporate-site'] },
  passengerSite: { url: 'https://airports.malaysiaairports.com.my/', sources: ['mahb-airports-site'] },
  contact: { url: 'https://www.malaysiaairports.com.my/contact', sources: ['mahb-contact'] },
  careChat: { url: 'https://care.malaysiaairports.com.my/chat', sources: ['mahb-care-chat'] },
  feedback: { url: 'https://feedback.malaysiaairports.com.my/', sources: ['mahb-feedback-site'] },
  brand: { url: 'https://corporate.malaysiaairports.com.my/en/about-us/corporate-profile/our-brand', sources: ['corp-mahb-our-brand'] },
  managementTeam: { url: 'https://corporate.malaysiaairports.com.my/en/about-us/organisation/management-team', sources: ['corp-mahb-management-team'] },
  board: { url: 'https://corporate.malaysiaairports.com.my/en/about-us/organisation/board-directors', sources: ['corp-mahb-board'] },
  subsidiaries: { url: 'https://www.malaysiaairports.com.my/about-us/subsidiaries', sources: ['corp-mahb-subsidiaries'] },
  sustainability: { url: 'https://corporate.malaysiaairports.com.my/en/sustainability/memorable-airport-experiences', sources: ['corp-mahb-sustainability'] },
  careers: { url: 'https://careers.malaysiaairports.com.my/', sources: ['corp-mahb-careers-portal'] },
  careersLeaders: { url: 'https://careers.malaysiaairports.com.my/content/Our-Leaders/?locale=en_GB', sources: ['corp-mahb-careers-leaders'] },
  annualReport2023: {
    url: 'https://www.malaysiaairports.com.my/sites/corporate/files/2024-05/MAHB%20AR2023%20%5BSingle%5D-compressed.pdf',
    sources: ['mahb-annual-report-2023'],
  },
  privacyNotice: {
    url: 'https://www.malaysiaairports.com.my/sites/corporate/files/2024-04/Privacy%20Notice%20%28English%20version%29%20FINAL.pdf',
    sources: ['mahb-privacy-notice'],
  },
  scamAlert: { url: 'https://www.malaysiaairports.com.my/scam-alert', sources: ['mahb-scam-alert'] },
  corporateScamAlert: { url: 'https://corporate.malaysiaairports.com.my/en/scam-alert', sources: ['mahb-corporate-scam-alert'] },
} satisfies Record<string, CorporateLink>;

export type CorporateLinkKey = keyof typeof CORPORATE_LINKS;

/* ---- Key figures -------------------------------------------------------------------------- */

/** The headline numbers for the corporate home and the network page. */
export const CORPORATE_KEY_FIGURES: CorporateFact[] = [
  {
    id: 'airports-in-malaysia',
    label: lt('Airports operated in Malaysia', 'Lapangan terbang yang dikendalikan di Malaysia'),
    value: lt('39', '39'),
    asOf: '2026-01-20',
    sources: ['corp-mahb-news-1678', 'corp-thestar-traffic-2025'],
  },
  {
    id: 'passengers-malaysia-2025',
    label: lt('Passengers at airports in Malaysia in 2025', 'Penumpang di lapangan terbang Malaysia pada 2025'),
    value: lt('104.4 million', '104.4 juta'),
    note: lt('Up 11.2% on 2024.', 'Naik 11.2% berbanding 2024.'),
    asOf: '2026-01-20',
    sources: ['corp-mahb-news-1678', 'corp-thestar-traffic-2025', 'corp-edge-traffic-2025'],
  },
  {
    id: 'passengers-klia-2025',
    label: lt('Passengers at KLIA in 2025', 'Penumpang di KLIA pada 2025'),
    value: lt('63.3 million', '63.3 juta'),
    note: lt('Up 10.8%, about 61% of all passengers in Malaysia.', 'Naik 10.8%, kira-kira 61% daripada semua penumpang di Malaysia.'),
    asOf: '2026-01-20',
    sources: ['corp-mahb-news-1678', 'corp-thestar-traffic-2025', 'corp-routes-2025-growth'],
  },
  {
    id: 'passengers-group-2025',
    label: lt('Passenger movements across the group in 2025', 'Pergerakan penumpang seluruh kumpulan pada 2025'),
    value: lt('153.3 million', '153.3 juta'),
    note: lt(
      'The global network includes Istanbul Sabiha Gökçen International Airport in Türkiye.',
      'Rangkaian global termasuk Lapangan Terbang Antarabangsa Istanbul Sabiha Gökçen di Türkiye.',
    ),
    asOf: '2026-01-19',
    sources: ['corp-mahb-news-1678', 'corp-routes-2025-growth', 'corp-xinhua-traffic-2025'],
  },
];

/* ---- History ------------------------------------------------------------------------------ */

/** Milestones the research could source. Earlier history is not verified and is left out. */
export const CORPORATE_MILESTONES: CorporateMilestone[] = [
  {
    id: 'niaga-incorporated',
    date: '1993',
    title: lt('Retail subsidiary incorporated', 'Anak syarikat runcit diperbadankan'),
    body: lt(
      'Malaysia Airports (Niaga) Sdn Bhd, which runs the Eraman duty-free and retail business, was incorporated.',
      'Malaysia Airports (Niaga) Sdn Bhd, yang mengendalikan perniagaan bebas cukai dan runcit Eraman, diperbadankan.',
    ),
    sources: ['corp-mahb-subsidiaries'],
  },
  {
    id: 'macs-established',
    date: '1994',
    title: lt('Consultancy arm established', 'Cabang perundingan ditubuhkan'),
    body: lt(
      'Malaysia Airports Consultancy Services Sdn Bhd was set up to offer management, maintenance and technical services for airports.',
      'Malaysia Airports Consultancy Services Sdn Bhd ditubuhkan untuk menawarkan perkhidmatan pengurusan, penyelenggaraan dan teknikal bagi lapangan terbang.',
    ),
    sources: ['corp-mahb-subsidiaries', 'corp-wikipedia-mahb'],
  },
  {
    id: 'klia-opened',
    date: '1998',
    title: lt('KL International Airport opens', 'Lapangan Terbang Antarabangsa KL dibuka'),
    sources: ['paultan-aerotrain-resumes-2025'],
  },
  {
    id: 'operating-agreements-agreed',
    date: '2023-02-09',
    title: lt('New Operating Agreements agreed in principle', 'Perjanjian Pengendalian baharu dipersetujui secara dasar'),
    body: lt(
      'The Government announced that it had agreed in principle to new Operating Agreements with Malaysia Airports.',
      'Kerajaan mengumumkan bahawa ia telah bersetuju secara dasar dengan Perjanjian Pengendalian baharu bersama Malaysia Airports.',
    ),
    sources: ['corp-malaymail-oa-2023', 'corp-routes-operating-agreements', 'corp-mahb-news-273'],
  },
  {
    id: 'operating-agreements-signed',
    date: '2024-03-18',
    title: lt('Operating Agreements signed for 45 years', 'Perjanjian Pengendalian ditandatangani untuk 45 tahun'),
    body: lt('The agreements run to 11 February 2069.', 'Perjanjian ini berkuat kuasa hingga 11 Februari 2069.'),
    sources: ['corp-borneopost-oa-2024', 'corp-kenanga-oa-2024', 'corp-malaymail-oa-analysts-2024'],
  },
  {
    id: 'privatisation-proposed',
    date: '2024-05-15',
    title: lt('Privatisation proposal announced', 'Cadangan penswastaan diumumkan'),
    body: lt(
      'A consortium led by Khazanah Nasional and the Employees Provident Fund proposed to take Malaysia Airports private.',
      'Konsortium yang diterajui Khazanah Nasional dan Kumpulan Wang Simpanan Pekerja mencadangkan untuk menswastakan Malaysia Airports.',
    ),
    sources: ['corp-fmt-consortium-2024', 'corp-nst-privatise-2024'],
  },
  {
    id: 'managing-director-appointed',
    date: '2024-08-01',
    title: lt("Dato' Mohd Izani Ghani becomes Managing Director", "Dato' Mohd Izani Ghani menjadi Pengarah Urusan"),
    sources: ['corp-mahb-news-1401', 'corp-mahb-careers-leaders'],
  },
  {
    id: 'offer-made',
    date: '2024-11-15',
    title: lt('Formal offer of RM11.00 a share', 'Tawaran rasmi RM11.00 sesaham'),
    body: lt(
      'Gateway Development Alliance offered RM11.00 in cash for each share it did not already own.',
      'Gateway Development Alliance menawarkan RM11.00 tunai bagi setiap saham yang belum dimilikinya.',
    ),
    sources: ['corp-fmt-offer-2024'],
  },
  {
    id: 'aca-bki-lgk',
    date: '2024-12-05',
    title: lt('Kota Kinabalu and Langkawi gain carbon accreditation', 'Kota Kinabalu dan Langkawi menerima akreditasi karbon'),
    body: lt('Both airports achieved Airport Carbon Accreditation Level 1 (Mapping).', 'Kedua-dua lapangan terbang mencapai Akreditasi Karbon Lapangan Terbang Tahap 1 (Pemetaan).'),
    sources: ['corp-aci-aca-bki-lgk-2024', 'corp-bernama-aca-2024'],
  },
  {
    id: 'delisted',
    date: '2025-02-25',
    title: lt('Removed from Bursa Malaysia', 'Dikeluarkan daripada Bursa Malaysia'),
    body: lt(
      'The shares were delisted after just over 25 years as a listed company. Malaysia Airports became a privately held company.',
      'Saham dinyahsenarai selepas lebih sedikit 25 tahun sebagai syarikat tersenarai. Malaysia Airports menjadi syarikat milik persendirian.',
    ),
    sources: ['corp-thestar-delisting-2025', 'corp-malaysiakini-delisting-2025', 'corp-azmilaw-delisting'],
  },
  {
    id: 'aerotrain-returns',
    date: '2025-07-01',
    title: lt('KLIA Aerotrain returns', 'Aerotrain KLIA kembali beroperasi'),
    body: lt('The replaced Aerotrain resumed service after about 28 months.', 'Aerotrain yang diganti kembali beroperasi selepas kira-kira 28 bulan.'),
    sources: ['paultan-aerotrain-resumes-2025', 'corp-malaymail-aerotrain-returns-2025'],
  },
  {
    id: 'solar-unveiled',
    date: '2026-01-29',
    title: lt('KLIA Aeropolis solar farm unveiled', 'Ladang solar KLIA Aeropolis dilancarkan'),
    body: lt('The solar farm and battery storage project was unveiled by the Deputy Prime Minister.', 'Projek ladang solar dan storan bateri dilancarkan oleh Timbalan Perdana Menteri.'),
    sources: ['corp-malaymail-solar-2026', 'corp-edge-solar-advertorial'],
  },
  {
    id: 'kota-bharu-terminal',
    date: '2026-03-16',
    title: lt('Expanded Kota Bharu terminal in full operation', 'Terminal Kota Bharu yang diperluas beroperasi sepenuhnya'),
    body: lt('Annual capacity rose from 1.5 million to 4 million passengers.', 'Kapasiti tahunan meningkat daripada 1.5 juta kepada 4 juta penumpang.'),
    sources: ['thestar-kbr-full-operation-2026'],
  },
  {
    id: 'aca-pen-kch',
    date: '2026-05',
    title: lt('Penang and Kuching gain carbon accreditation', 'Pulau Pinang dan Kuching menerima akreditasi karbon'),
    body: lt('Both airports attained Airport Carbon Accreditation Level 1.', 'Kedua-dua lapangan terbang mencapai Akreditasi Karbon Lapangan Terbang Tahap 1.'),
    sources: ['corp-thestar-aca-2026'],
  },
  {
    id: 'chairman-appointed',
    date: '2026-06-18',
    title: lt('Tan Sri Dr. Azmil Khalid becomes Chairman', 'Tan Sri Dr. Azmil Khalid menjadi Pengerusi'),
    sources: ['corp-mahb-news-1787', 'corp-thestar-chairman-2026'],
  },
];

/* ---- Ownership ---------------------------------------------------------------------------- */

/** Ownership after the 2025 privatisation, and the steps that led to it. */
export const OWNERSHIP_FACTS: CorporateFact[] = [
  {
    id: 'owner',
    label: lt('Owner', 'Pemilik'),
    value: lt('Gateway Development Alliance (GDA)', 'Gateway Development Alliance (GDA)'),
    note: lt(
      'Wholly owned by GDA since the February 2025 delisting. The Government of Malaysia keeps a special share.',
      'Dimiliki sepenuhnya oleh GDA sejak penyahsenaraian Februari 2025. Kerajaan Malaysia mengekalkan satu saham khas.',
    ),
    asOf: '2025-02',
    sources: ['corp-thestar-delisting-2025', 'corp-malaysiakini-delisting-2025'],
  },
  {
    id: 'consortium',
    label: lt('Members of the GDA consortium', 'Anggota konsortium GDA'),
    value: lt(
      'Khazanah Nasional Berhad, the Employees Provident Fund (EPF), the Abu Dhabi Investment Authority (ADIA) and Global Infrastructure Partners (GIP)',
      'Khazanah Nasional Berhad, Kumpulan Wang Simpanan Pekerja (KWSP), Abu Dhabi Investment Authority (ADIA) dan Global Infrastructure Partners (GIP)',
    ),
    asOf: '2025-02-25',
    sources: ['corp-thestar-delisting-2025', 'corp-malaysiakini-delisting-2025', 'corp-bernama-delisting-2025', 'corp-azmilaw-delisting'],
  },
  {
    id: 'planned-stakes',
    label: lt('Planned stakes, as reported in 2024', 'Pegangan yang dirancang, seperti dilaporkan pada 2024'),
    value: lt('Khazanah 40%, EPF 30%, GIP and ADIA together 30%', 'Khazanah 40%, KWSP 30%, GIP dan ADIA bersama 30%'),
    note: lt(
      'Reported as the plan, giving Malaysian institutions 70%. The final stakes after completion were not confirmed in our research.',
      'Dilaporkan sebagai rancangan, memberi institusi Malaysia 70%. Pegangan akhir selepas penyempurnaan tidak disahkan dalam kajian kami.',
    ),
    asOf: '2024-06',
    sources: ['corp-nst-ownership-70pct-2024', 'corp-thestar-khazanah-epf-2024', 'corp-malaymail-takeover-2024'],
  },
  {
    id: 'pre-offer-holdings',
    label: lt('Holdings before the offer', 'Pegangan sebelum tawaran'),
    value: lt('Khazanah about 33.2%, EPF about 7.9%', 'Khazanah kira-kira 33.2%, KWSP kira-kira 7.9%'),
    asOf: '2024-05',
    sources: ['corp-thestar-khazanah-epf-2024', 'corp-malaymail-takeover-2024', 'corp-nst-privatise-2024'],
  },
  {
    id: 'offer-price',
    label: lt('Offer price', 'Harga tawaran'),
    value: lt('RM11.00 cash per share', 'RM11.00 tunai sesaham'),
    note: lt(
      'The cost of the shares not already held by the consortium was reported at about RM12.3 billion.',
      'Kos saham yang belum dimiliki konsortium dilaporkan kira-kira RM12.3 bilion.',
    ),
    asOf: '2024-11-15',
    sources: ['corp-fmt-offer-2024', 'corp-nst-privatise-2024'],
  },
  {
    id: 'acceptances',
    label: lt('Shares held by GDA on 12 February 2025', 'Saham dipegang GDA pada 12 Februari 2025'),
    value: lt('98.68% (1.64 billion shares)', '98.68% (1.64 bilion saham)'),
    asOf: '2025-02-12',
    sources: ['corp-bernama-delisting-2025', 'corp-thestar-delisting-2025'],
  },
  {
    id: 'last-trade',
    label: lt('Last day of trading', 'Hari dagangan terakhir'),
    value: lt('19 February 2025, closing at RM10.90', '19 Februari 2025, ditutup pada RM10.90'),
    note: lt('Trading was suspended from 20 February 2025.', 'Dagangan digantung mulai 20 Februari 2025.'),
    asOf: '2025-02-25',
    sources: ['corp-thestar-delisting-2025', 'corp-malaysiakini-delisting-2025'],
  },
  {
    id: 'delisted',
    label: lt('Removed from the Official List of Bursa Malaysia', 'Dikeluarkan daripada Senarai Rasmi Bursa Malaysia'),
    value: lt('25 February 2025', '25 Februari 2025'),
    note: lt(
      'All five independent non-executive directors resigned with effect from the delisting date.',
      'Kesemua lima pengarah bukan eksekutif bebas meletak jawatan berkuat kuasa tarikh penyahsenaraian.',
    ),
    asOf: '2025-02-25',
    sources: ['corp-thestar-delisting-2025', 'corp-azmilaw-delisting', 'corp-capa-ined-2025'],
  },
];

/* ---- Leadership --------------------------------------------------------------------------- */

/** Date the leadership below was last checked against the sources. */
export const LEADERSHIP_CHECKED = '2026-11-16';

/** Chairman and Managing Director. */
export const LEADERSHIP_BOARD: CorporatePerson[] = [
  {
    id: 'azmil-khalid',
    name: 'Tan Sri Dr. Azmil Khalid',
    role: lt('Chairman (non-independent, non-executive)', 'Pengerusi (bukan bebas, bukan eksekutif)'),
    since: '2026-06-18',
    note: lt(
      'Succeeded Dr. Nungsari Ahmad Radhi, who stepped down after more than two years as Chairman following his appointment to the board of Khazanah Nasional Berhad.',
      'Menggantikan Dr. Nungsari Ahmad Radhi, yang berundur selepas lebih dua tahun sebagai Pengerusi berikutan pelantikannya ke lembaga Khazanah Nasional Berhad.',
    ),
    sources: ['corp-mahb-news-1787', 'corp-thestar-chairman-2026', 'corp-edge-chairman-2026', 'corp-nst-chairman-2026'],
  },
  {
    id: 'izani-ghani',
    name: "Dato' Mohd Izani Ghani",
    role: lt('Managing Director', 'Pengarah Urusan'),
    since: '2024-08-01',
    note: lt(
      'Tenure extended for two years from 1 August 2026, with the approval of the Ministry of Finance (Incorporated). He served on the Malaysia Airports Board from 2011 to 2019.',
      'Tempoh perkhidmatan dilanjutkan dua tahun mulai 1 Ogos 2026, dengan kelulusan Menteri Kewangan (Diperbadankan). Beliau pernah menganggotai Lembaga Malaysia Airports dari 2011 hingga 2019.',
    ),
    sources: ['corp-mahb-news-1401', 'corp-mahb-careers-leaders', 'corp-nst-chairman-2026', 'corp-mahb-news-1787'],
  },
];

/** Chief officers as listed on the corporate management team page (read through search results). */
export const LEADERSHIP_MANAGEMENT: CorporatePerson[] = [
  { id: 'zeid-abdul-razak', name: 'Zeid Abdul Razak', role: lt('Chief Financial Officer', 'Ketua Pegawai Kewangan'), sources: ['corp-mahb-management-team'] },
  { id: 'bryan-thompson', name: 'Bryan John Thompson', role: lt('Chief Airports Officer', 'Ketua Pegawai Lapangan Terbang'), sources: ['corp-mahb-management-team'] },
  { id: 'maureen-bannerman', name: 'Maureen Mary Bannerman', role: lt('Chief Commercial Officer', 'Ketua Pegawai Komersial'), sources: ['corp-mahb-management-team'] },
  { id: 'steven-andersen', name: 'Steven Andersen', role: lt('Chief Development Officer', 'Ketua Pegawai Pembangunan'), sources: ['corp-mahb-management-team'] },
  { id: 'nadiah-tan', name: 'Nadiah Tan Abdullah', role: lt('Chief Human Capital Officer', 'Ketua Pegawai Modal Insan'), sources: ['corp-mahb-management-team'] },
  { id: 'ahmad-zaky-ismail', name: 'Ahmad Zaky Ismail', role: lt('Chief Legal Officer', 'Ketua Pegawai Undang-undang'), sources: ['corp-mahb-management-team'] },
];

/** Roles the management team page lists without names in our research. */
export const LEADERSHIP_UNNAMED_ROLES: LocalizedText[] = [
  lt('Chief Operating Officer, Malaysia Airports Sdn Bhd', 'Ketua Pegawai Operasi, Malaysia Airports Sdn Bhd'),
  lt('Chief Operating Officer, KL International Airport', 'Ketua Pegawai Operasi, Lapangan Terbang Antarabangsa KL'),
  lt('Chief Information Officer', 'Ketua Pegawai Maklumat'),
  lt('Chief Procurement Officer', 'Ketua Pegawai Perolehan'),
  lt('Chief Aviation Development Officer', 'Ketua Pegawai Pembangunan Penerbangan'),
];

/* ---- Brand -------------------------------------------------------------------------------- */

export const BRAND_FACTS = {
  vision: {
    id: 'vision',
    label: lt('Vision', 'Visi'),
    value: lt('A Global Airport Group That Champions Connectivity and Sustainability', 'A Global Airport Group That Champions Connectivity and Sustainability'),
    note: lt('Published in English.', 'Diterbitkan dalam bahasa Inggeris.'),
    asOf: '2026-11-16',
    sources: ['corp-mahb-our-brand', 'mahb-annual-report-2023', 'corp-mahb-ar2020'],
  },
  promise: {
    id: 'brand-promise',
    label: lt('Brand promise', 'Janji jenama'),
    value: lt('Hosting Joyful Connections', 'Hosting Joyful Connections'),
    note: lt(
      'The brand promise replaced the former mission statement; no separate mission is published.',
      'Janji jenama menggantikan pernyataan misi terdahulu; tiada misi berasingan diterbitkan.',
    ),
    asOf: '2026-11-16',
    sources: ['corp-mahb-our-brand', 'mahb-annual-report-2023', 'corp-mahb-sr2019'],
  },
  values: {
    id: 'core-values',
    label: lt('Core values', 'Nilai teras'),
    value: lt('Integrity, Customer-Centricity, Accountability and New Ideas', 'Integrity, Customer-Centricity, Accountability dan New Ideas'),
    note: lt(
      'As stated in the 2020 annual report. The current wording on the official site was not confirmed.',
      'Seperti dinyatakan dalam laporan tahunan 2020. Susunan kata semasa di laman rasmi tidak disahkan.',
    ),
    asOf: '2020',
    sources: ['corp-mahb-ar2020', 'corp-mahb-our-brand'],
  },
} satisfies Record<string, CorporateFact>;

/* ---- Group companies ---------------------------------------------------------------------- */

export const GROUP_COMPANIES: CorporateFact[] = [
  {
    id: 'ma-sepang',
    label: lt('Malaysia Airports (Sepang) Sdn Bhd', 'Malaysia Airports (Sepang) Sdn Bhd'),
    value: lt('Operates KL International Airport (KLIA).', 'Mengendalikan Lapangan Terbang Antarabangsa KL (KLIA).'),
    asOf: '2026-11-16',
    sources: ['corp-mahb-subsidiaries', 'corp-thestar-baggage-2022', 'corp-wikipedia-mahb'],
  },
  {
    id: 'ma-niaga',
    label: lt('Malaysia Airports (Niaga) Sdn Bhd', 'Malaysia Airports (Niaga) Sdn Bhd'),
    value: lt('Runs the Eraman duty-free and retail business. Wholly owned; incorporated in 1993.', 'Mengendalikan perniagaan bebas cukai dan runcit Eraman. Milik penuh; diperbadankan pada 1993.'),
    asOf: '2026-11-16',
    sources: ['corp-mahb-subsidiaries'],
  },
  {
    id: 'kl-airport-hotel',
    label: lt('K.L. Airport Hotel Sdn Bhd', 'K.L. Airport Hotel Sdn Bhd'),
    value: lt('Owns and operates Sama-Sama Hotel KL International Airport, a five-star hotel at KLIA.', 'Memiliki dan mengendalikan Sama-Sama Hotel KL International Airport, hotel lima bintang di KLIA.'),
    asOf: '2026-11-16',
    sources: ['corp-mahb-subsidiaries'],
  },
  {
    id: 'macs',
    label: lt('Malaysia Airports Consultancy Services Sdn Bhd (MACS)', 'Malaysia Airports Consultancy Services Sdn Bhd (MACS)'),
    value: lt(
      'Management, maintenance and technical services for airport operations and development. Established in 1994.',
      'Perkhidmatan pengurusan, penyelenggaraan dan teknikal untuk operasi dan pembangunan lapangan terbang. Ditubuhkan pada 1994.',
    ),
    asOf: '2026-11-16',
    sources: ['corp-mahb-subsidiaries', 'corp-wikipedia-mahb'],
  },
  {
    id: 'istanbul-sabiha-gokcen',
    label: lt('Istanbul Sabiha Gökçen International Airport, Türkiye', 'Lapangan Terbang Antarabangsa Istanbul Sabiha Gökçen, Türkiye'),
    value: lt('Acquired by Malaysia Airports and counted in its global network traffic.', 'Diambil alih oleh Malaysia Airports dan dikira dalam trafik rangkaian globalnya.'),
    asOf: '2025-10',
    sources: ['corp-wikipedia-mahb', 'corp-vibes-q3-2025', 'corp-edge-august-2026'],
  },
];

/* ---- Operating Agreements ----------------------------------------------------------------- */

/** The 2023 Operating Agreements with the Government (OA 2023). */
export const OPERATING_AGREEMENT_FACTS: CorporateFact[] = [
  {
    id: 'oa-signed',
    label: lt('Signed', 'Ditandatangani'),
    value: lt('18 March 2024', '18 Mac 2024'),
    note: lt('Agreed in principle in February 2023.', 'Dipersetujui secara dasar pada Februari 2023.'),
    asOf: '2024-03-19',
    sources: ['corp-borneopost-oa-2024', 'corp-malaymail-oa-2023', 'corp-routes-operating-agreements'],
  },
  {
    id: 'oa-term',
    label: lt('Term', 'Tempoh'),
    value: lt('45 years, to 11 February 2069', '45 tahun, hingga 11 Februari 2069'),
    asOf: '2024-03-19',
    sources: ['corp-borneopost-oa-2024', 'corp-kenanga-oa-2024'],
  },
  {
    id: 'oa-scope',
    label: lt('Scope', 'Skop'),
    value: lt('Operate, manage, maintain and develop 39 airports and STOLports in Malaysia', 'Mengendali, mengurus, menyelenggara dan membangunkan 39 lapangan terbang dan STOLport di Malaysia'),
    asOf: '2024-03-19',
    sources: ['corp-borneopost-oa-2024', 'corp-malaymail-oa-2023'],
  },
  {
    id: 'oa-development-fund',
    label: lt('Airport Development Fund', 'Dana Pembangunan Lapangan Terbang'),
    value: lt(
      'Half of the Passenger Service Charge component of the User Fee goes into a trust account for airport development',
      'Separuh daripada komponen Caj Perkhidmatan Penumpang dalam Fi Pengguna disalurkan ke akaun amanah untuk pembangunan lapangan terbang',
    ),
    asOf: '2024-03-19',
    sources: ['corp-kenanga-oa-2024', 'corp-malaymail-oa-2023', 'corp-malaymail-oa-analysts-2024'],
  },
  {
    id: 'oa-funding',
    label: lt('Paying for development', 'Pembiayaan pembangunan'),
    value: lt(
      'Government development expenditure, or Malaysia Airports through an investment recovery model',
      'Perbelanjaan pembangunan Kerajaan, atau Malaysia Airports melalui model pemulihan pelaburan',
    ),
    note: lt(
      'Malaysia Airports may bring in partners and investors for airport development, subject to Government policy guidelines.',
      'Malaysia Airports boleh membawa masuk rakan kongsi dan pelabur untuk pembangunan lapangan terbang, tertakluk kepada garis panduan dasar Kerajaan.',
    ),
    asOf: '2024-03-19',
    sources: ['corp-kenanga-oa-2024', 'corp-malaymail-oa-2023', 'corp-routes-operating-agreements'],
  },
];

/* ---- Recognition -------------------------------------------------------------------------- */

export const RECOGNITION_FACTS: CorporateFact[] = [
  {
    id: 'skytrax-2025-klia',
    label: lt('Skytrax World’s Top 100 Airports 2025', 'Skytrax World’s Top 100 Airports 2025'),
    value: lt('KLIA ranked 65th', 'KLIA di tempat ke-65'),
    note: lt('KLIA Terminal 2 ranked sixth among the world’s best low-cost airline terminals.', 'KLIA Terminal 2 di tempat keenam antara terminal syarikat penerbangan tambang rendah terbaik dunia.'),
    asOf: '2025-04-10',
    sources: ['corp-fmt-skytrax-2025', 'corp-scoop-skytrax-2025'],
  },
  {
    id: 'asq-2024-klia',
    label: lt('ACI Airport Service Quality 2024, over 40 million passengers', 'ACI Airport Service Quality 2024, lebih 40 juta penumpang'),
    value: lt('KLIA in the world’s top 10, scoring 4.99 out of 5', 'KLIA dalam 10 teratas dunia, dengan skor 4.99 daripada 5'),
    asOf: '2025-03-17',
    sources: ['corp-malaymail-asq-2024'],
  },
  {
    id: 'asq-2025-langkawi',
    label: lt('ACI ASQ Awards 2025, Asia-Pacific, 2 to 5 million passengers', 'Anugerah ACI ASQ 2025, Asia Pasifik, 2 hingga 5 juta penumpang'),
    value: lt('Langkawi named Best Airport for the fifth year in a row', 'Langkawi dinamakan Lapangan Terbang Terbaik bagi tahun kelima berturut-turut'),
    asOf: '2026',
    sources: ['corp-routes-langkawi-asq'],
  },
  {
    id: 'klia-hourly-record',
    label: lt('KLIA hourly record', 'Rekod sejam KLIA'),
    value: lt('12,437 passengers between 19:00 and 20:00 on 13 September 2025', '12,437 penumpang antara 19:00 dan 20:00 pada 13 September 2025'),
    asOf: '2025-09',
    sources: ['corp-marketscreener-hourly-2025'],
  },
];

/* ---- Network development ------------------------------------------------------------------ */

/** Projects with sourced figures, grouped for the network page. */
export const NETWORK_PROJECTS: { id: string; airport: string; title: LocalizedText; facts: CorporateFact[] }[] = [
  {
    id: 'aerotrain',
    airport: 'kul',
    title: lt('KLIA Aerotrain replacement', 'Penggantian Aerotrain KLIA'),
    facts: [
      {
        id: 'aerotrain-cost',
        label: lt('Project cost', 'Kos projek'),
        value: lt('RM456.1 million', 'RM456.1 juta'),
        note: lt('Completed by Alstom with the IJMC-Pestech joint venture.', 'Disiapkan oleh Alstom bersama usaha sama IJMC-Pestech.'),
        asOf: '2025-01-24',
        sources: ['corp-malaymail-aerotrain-cost-2025', 'corp-thestar-aerotrain-cost-2024', 'corp-mahb-aerotrain-back-on-track', 'corp-malaymail-aerotrain-alstom-2024'],
      },
      {
        id: 'aerotrain-service',
        label: lt('Back in service', 'Kembali beroperasi'),
        value: lt('1 July 2025, after about 28 months', '1 Julai 2025, selepas kira-kira 28 bulan'),
        note: lt(
          'Driverless three-car Innovia APM 300R trains carry up to 270 passengers and link the Terminal 1 main building and the satellite building in under three minutes.',
          'Tren tanpa pemandu Innovia APM 300R tiga gerabak membawa sehingga 270 penumpang dan menghubungkan bangunan utama Terminal 1 dengan bangunan satelit dalam masa kurang tiga minit.',
        ),
        asOf: '2025-07-02',
        sources: ['paultan-aerotrain-resumes-2025', 'corp-malaymail-aerotrain-returns-2025'],
      },
    ],
  },
  {
    id: 'baggage',
    airport: 'kul',
    title: lt('KLIA Terminal 1 baggage handling system', 'Sistem pengendalian bagasi KLIA Terminal 1'),
    facts: [
      {
        id: 'baggage-contract',
        label: lt('Contract', 'Kontrak'),
        value: lt('Awarded in 2022 to T7 Kemuncak and Siemens Logistics', 'Dianugerahkan pada 2022 kepada T7 Kemuncak dan Siemens Logistics'),
        note: lt(
          'Includes an early bag store with 2,500 positions and a high-speed tray link between the main terminal and the satellite building.',
          'Termasuk stor bagasi awal dengan 2,500 kedudukan dan laluan dulang berkelajuan tinggi antara terminal utama dan bangunan satelit.',
        ),
        asOf: '2022-12-15',
        sources: ['corp-edge-baggage-2022', 'corp-thestar-baggage-2022', 'corp-skrine-baggage-2023'],
      },
      {
        id: 'baggage-completion',
        label: lt('Target completion', 'Sasaran siap'),
        value: lt('Fourth quarter of 2028', 'Suku keempat 2028'),
        asOf: '2026-01',
        sources: ['corp-thesun-baggage-2028'],
      },
    ],
  },
];

/* ---- Traffic ------------------------------------------------------------------------------ */

/** Passenger figures from monthly and annual traffic statements, as reported. */
export const TRAFFIC_FIGURES: TrafficFigure[] = [
  { id: 'malaysia-2026-jan-sep', period: '2026-01/2026-09', scope: 'malaysia', millions: 75.2, changePct: -2.4, reported: '2026-10-26', sources: ['corp-thestar-september-2026', 'corp-edge-september-2026', 'corp-routes-september-2026'] },
  { id: 'malaysia-international-2026-jan-sep', period: '2026-01/2026-09', scope: 'malaysia-international', millions: 41.3, changePct: 4.5, reported: '2026-10-26', sources: ['corp-thestar-september-2026', 'corp-edge-september-2026'] },
  { id: 'malaysia-2026-09', period: '2026-09', scope: 'malaysia', millions: 7.8, changePct: -12, reported: '2026-10-26', sources: ['corp-thestar-september-2026', 'corp-edge-september-2026', 'corp-businesstoday-september-2026'] },
  { id: 'malaysia-international-2026-09', period: '2026-09', scope: 'malaysia-international', millions: 4.3, changePct: -2.2, reported: '2026-10-26', sources: ['corp-thestar-september-2026'] },
  { id: 'malaysia-domestic-2026-09', period: '2026-09', scope: 'malaysia-domestic', millions: 3.4, changePct: -21.8, reported: '2026-10-26', sources: ['corp-thestar-september-2026'] },
  { id: 'klia-2026-09', period: '2026-09', scope: 'klia', millions: 4.9, qualifier: 'about', reported: '2026-10-26', sources: ['corp-thestar-september-2026', 'corp-edge-september-2026'] },
  { id: 'group-2026-jan-aug', period: '2026-01/2026-08', scope: 'group', millions: 101.3, reported: '2026-09', sources: ['corp-edge-august-2026'] },
  { id: 'group-2026-08', period: '2026-08', scope: 'group', millions: 13.6, reported: '2026-09', sources: ['corp-edge-august-2026'] },
  { id: 'istanbul-2026-08', period: '2026-08', scope: 'istanbul', millions: 5.2, reported: '2026-09', sources: ['corp-edge-august-2026'] },
  { id: 'malaysia-2026-01', period: '2026-01', scope: 'malaysia', millions: 9.4, reported: '2026-02', sources: ['corp-mahb-news-1686', 'corp-routes-vm2026-january'] },
  { id: 'malaysia-2025-12', period: '2025-12', scope: 'malaysia', millions: 10, changePct: 15.5, reported: '2026-01-19', sources: ['corp-mahb-news-1678', 'corp-thestar-traffic-2025', 'corp-routes-2025-growth'] },
  { id: 'group-2025', period: '2025', scope: 'group', millions: 153.3, reported: '2026-01-19', sources: ['corp-mahb-news-1678', 'corp-routes-2025-growth', 'corp-xinhua-traffic-2025'] },
  { id: 'malaysia-2025', period: '2025', scope: 'malaysia', millions: 104.4, changePct: 11.2, reported: '2026-01-20', sources: ['corp-thestar-traffic-2025', 'corp-edge-traffic-2025', 'corp-mahb-news-1678'] },
  { id: 'klia-2025', period: '2025', scope: 'klia', millions: 63.3, changePct: 10.8, reported: '2026-01-20', sources: ['corp-thestar-traffic-2025', 'corp-mahb-news-1678', 'corp-routes-2025-growth'] },
  { id: 'istanbul-2025', period: '2025', scope: 'istanbul', millions: 48, qualifier: 'over', reported: '2026-01', sources: ['corp-hurriyet-istanbul-2025'] },
];

/** How often traffic statements appear. */
export const TRAFFIC_RELEASE_PATTERN: CorporateFact = {
  id: 'traffic-release-pattern',
  label: lt('Traffic statements', 'Kenyataan trafik'),
  value: lt('Monthly, usually in the last week of the following month', 'Bulanan, biasanya pada minggu terakhir bulan berikutnya'),
  asOf: '2026-10-26',
  sources: ['corp-thestar-september-2026', 'corp-mahb-news-1686', 'corp-edge-august-2026'],
};

/* ---- Sustainability ----------------------------------------------------------------------- */

export const SUSTAINABILITY_TARGETS: CorporateFact[] = [
  {
    id: 'net-zero-2050',
    label: lt('Net-zero carbon emissions', 'Pelepasan karbon sifar bersih'),
    value: lt('By 2050', 'Menjelang 2050'),
    note: lt('Set out in the Net Zero Decarbonisation Roadmap.', 'Ditetapkan dalam Pelan Hala Tuju Penyahkarbonan Sifar Bersih.'),
    asOf: '2026-01',
    sources: ['corp-edge-solar-advertorial', 'corp-bernama-solar-2026', 'corp-malaymail-solar-2026'],
  },
  {
    id: 'renewables-2030',
    label: lt('Renewable energy in the mix', 'Tenaga boleh baharu dalam campuran'),
    value: lt('20% by 2030', '20% menjelang 2030'),
    note: lt('An interim target on the way to net zero.', 'Sasaran interim ke arah sifar bersih.'),
    asOf: '2026-01',
    sources: ['corp-edge-solar-advertorial', 'corp-malaymail-solar-2026'],
  },
  {
    id: 'klia-solar-impact',
    label: lt('KLIA Aeropolis solar farm and battery storage', 'Ladang solar dan storan bateri KLIA Aeropolis'),
    value: lt('About 30% renewable energy at KLIA', 'Kira-kira 30% tenaga boleh baharu di KLIA'),
    note: lt(
      'Expected once fully operational, together with a cut of about 30% in KLIA’s carbon emissions in 2027. Unveiled on 29 January 2026.',
      'Dijangka apabila beroperasi sepenuhnya, bersama pengurangan kira-kira 30% pelepasan karbon KLIA pada 2027. Dilancarkan pada 29 Januari 2026.',
    ),
    asOf: '2026-01-29',
    sources: ['corp-bernama-solar-2026', 'corp-malaymail-solar-2026', 'corp-edge-solar-advertorial'],
  },
];

/** Airport Carbon Accreditation in the network, as reported. Other airports: not published. */
export const CARBON_ACCREDITATIONS: CarbonAccreditation[] = [
  { airport: 'kul', level: 3, levelName: lt('Optimisation', 'Pengoptimuman'), asOf: '2026-05-13', sources: ['corp-thestar-aca-2026', 'corp-bernama-aca-2024'] },
  { airport: 'pen', level: 1, asOf: '2026-05', sources: ['corp-thestar-aca-2026'] },
  { airport: 'kch', level: 1, asOf: '2026-05', sources: ['corp-thestar-aca-2026'] },
  { airport: 'bki', level: 1, levelName: lt('Mapping', 'Pemetaan'), asOf: '2024-12-05', sources: ['corp-aci-aca-bki-lgk-2024', 'corp-bernama-aca-2024'] },
  { airport: 'lgk', level: 1, levelName: lt('Mapping', 'Pemetaan'), asOf: '2024-12-05', sources: ['corp-aci-aca-bki-lgk-2024', 'corp-bernama-aca-2024'] },
];

/* ---- Contact and identity ----------------------------------------------------------------- */

export const CORPORATE_IDENTITY: CorporateFact[] = [
  {
    id: 'corporate-office',
    label: lt('Corporate office', 'Pejabat korporat'),
    value: lt(
      'Malaysia Airports Corporate Office, Persiaran Korporat KLIA, 64000 KLIA, Sepang, Selangor Darul Ehsan, Malaysia',
      'Malaysia Airports Corporate Office, Persiaran Korporat KLIA, 64000 KLIA, Sepang, Selangor Darul Ehsan, Malaysia',
    ),
    note: lt('From a reference work, not an official page. Check the official contact page before you send anything.', 'Daripada karya rujukan, bukan halaman rasmi. Semak halaman hubungan rasmi sebelum menghantar apa-apa.'),
    asOf: '2026-11-16',
    sources: ['corp-wikipedia-mahb'],
  },
  {
    id: 'registration-number',
    label: lt('Company registration number (old format)', 'Nombor pendaftaran syarikat (format lama)'),
    value: lt('487092-W', '487092-W'),
    note: lt('As printed in the 1999 annual report. The current 12-digit number was not captured.', 'Seperti dicetak dalam laporan tahunan 1999. Nombor 12 digit semasa tidak diperoleh.'),
    asOf: '1999',
    sources: ['corp-nus-ar1999'],
  },
];

/* ---- Media centre ------------------------------------------------------------------------- */

/** Media centre items beyond `NEWS_ITEMS`. Slugs must not clash with `NEWS_ITEMS`. */
export const MEDIA_ITEMS: CorporateMediaItem[] = [
  {
    slug: 'september-2026-passenger-traffic',
    kind: 'coverage',
    topic: 'traffic',
    date: '2026-10-26',
    title: lt('September 2026 traffic: 7.8 million passengers in Malaysia', 'Trafik September 2026: 7.8 juta penumpang di Malaysia'),
    summary: lt(
      'Airports in Malaysia handled 7.8 million passengers in September 2026, 12% fewer than a year earlier. International traffic fell 2.2% to 4.3 million and domestic traffic 21.8% to 3.4 million. Subang, Ipoh and Penang grew their international traffic, with Penang up 5.3%. From January to September, 75.2 million passengers passed through, 2.4% fewer than in 2025, while international traffic grew 4.5% to 41.3 million.',
      'Lapangan terbang di Malaysia mengendalikan 7.8 juta penumpang pada September 2026, 12% kurang berbanding setahun sebelumnya. Trafik antarabangsa turun 2.2% kepada 4.3 juta dan trafik domestik 21.8% kepada 3.4 juta. Subang, Ipoh dan Pulau Pinang mencatat pertumbuhan trafik antarabangsa, dengan Pulau Pinang naik 5.3%. Dari Januari hingga September, 75.2 juta penumpang dikendalikan, 2.4% kurang berbanding 2025, manakala trafik antarabangsa meningkat 4.5% kepada 41.3 juta.',
    ),
    airports: ['kul', 'szb', 'iph', 'pen'],
    sources: ['corp-thestar-september-2026', 'corp-edge-september-2026', 'corp-businesstoday-september-2026', 'corp-routes-september-2026'],
  },
  {
    slug: 'august-2026-group-traffic',
    kind: 'coverage',
    topic: 'traffic',
    date: '2026-09',
    title: lt('August 2026 traffic: 13.6 million passengers across the group', 'Trafik Ogos 2026: 13.6 juta penumpang seluruh kumpulan'),
    summary: lt(
      'The group handled 13.6 million passengers in August 2026, including 5.2 million at Istanbul Sabiha Gökçen, taking the total for January to August 2026 to 101.3 million.',
      'Kumpulan mengendalikan 13.6 juta penumpang pada Ogos 2026, termasuk 5.2 juta di Istanbul Sabiha Gökçen, menjadikan jumlah Januari hingga Ogos 2026 sebanyak 101.3 juta.',
    ),
    sources: ['corp-edge-august-2026'],
  },
  {
    slug: 'chairman-appointed-md-tenure-extended',
    kind: 'release',
    topic: 'company',
    date: '2026-06-18',
    title: lt('Tan Sri Dr. Azmil Khalid appointed Chairman; Managing Director’s tenure extended', 'Tan Sri Dr. Azmil Khalid dilantik Pengerusi; tempoh Pengarah Urusan dilanjutkan'),
    summary: lt(
      "Tan Sri Dr. Azmil Khalid became non-independent non-executive Chairman with effect from 18 June 2026, succeeding Dr. Nungsari Ahmad Radhi. The tenure of Managing Director Dato' Mohd Izani Ghani was extended for two years from 1 August 2026, with the approval of the Ministry of Finance (Incorporated).",
      "Tan Sri Dr. Azmil Khalid menjadi Pengerusi bukan bebas bukan eksekutif berkuat kuasa 18 Jun 2026, menggantikan Dr. Nungsari Ahmad Radhi. Tempoh perkhidmatan Pengarah Urusan Dato' Mohd Izani Ghani dilanjutkan dua tahun mulai 1 Ogos 2026, dengan kelulusan Menteri Kewangan (Diperbadankan).",
    ),
    sources: ['corp-mahb-news-1787', 'corp-thestar-chairman-2026', 'corp-edge-chairman-2026', 'corp-nst-chairman-2026'],
  },
  {
    slug: 'penang-kuching-carbon-accreditation',
    kind: 'coverage',
    topic: 'sustainability',
    date: '2026-05-13',
    title: lt('Penang and Kuching achieve Airport Carbon Accreditation', 'Pulau Pinang dan Kuching mencapai Akreditasi Karbon Lapangan Terbang'),
    summary: lt(
      'Penang International Airport and Kuching International Airport attained Level 1 Airport Carbon Accreditation in May 2026. KLIA holds Level 3 (Optimisation).',
      'Lapangan Terbang Antarabangsa Pulau Pinang dan Lapangan Terbang Antarabangsa Kuching mencapai Akreditasi Karbon Lapangan Terbang Tahap 1 pada Mei 2026. KLIA memegang Tahap 3 (Pengoptimuman).',
    ),
    airports: ['pen', 'kch', 'kul'],
    sources: ['corp-thestar-aca-2026'],
  },
  {
    slug: 'visit-malaysia-2026-january-traffic',
    kind: 'release',
    topic: 'traffic',
    date: '2026-02',
    title: lt('Visit Malaysia 2026 opens with 9.4 million passengers', 'Tahun Melawat Malaysia 2026 bermula dengan 9.4 juta penumpang'),
    summary: lt(
      'Airports across Malaysia handled 9.4 million passengers in January 2026, the first month of Visit Malaysia 2026.',
      'Lapangan terbang di seluruh Malaysia mengendalikan 9.4 juta penumpang pada Januari 2026, bulan pertama Tahun Melawat Malaysia 2026.',
    ),
    sources: ['corp-mahb-news-1686', 'corp-routes-vm2026-january'],
  },
  {
    slug: 'klia-aeropolis-solar-farm-unveiled',
    kind: 'coverage',
    topic: 'sustainability',
    date: '2026-01-29',
    title: lt('KLIA Aeropolis solar farm and battery storage unveiled', 'Ladang solar dan storan bateri KLIA Aeropolis dilancarkan'),
    summary: lt(
      'Deputy Prime Minister Fadillah Yusof unveiled the KLIA Aeropolis solar farm and battery storage project. Once fully operational it is expected to give KLIA a renewable energy mix of about 30% and to cut KLIA’s carbon emissions by about 30% in 2027.',
      'Timbalan Perdana Menteri Fadillah Yusof melancarkan projek ladang solar dan storan bateri KLIA Aeropolis. Apabila beroperasi sepenuhnya, ia dijangka memberi KLIA campuran tenaga boleh baharu kira-kira 30% dan mengurangkan pelepasan karbon KLIA kira-kira 30% pada 2027.',
    ),
    airports: ['kul'],
    sources: ['corp-malaymail-solar-2026', 'corp-bernama-solar-2026', 'corp-edge-solar-advertorial'],
  },
  {
    slug: 'strong-2025-passenger-growth',
    kind: 'release',
    topic: 'traffic',
    date: '2026-01-19',
    title: lt('2025 traffic: 153.3 million passenger movements across the group', 'Trafik 2025: 153.3 juta pergerakan penumpang seluruh kumpulan'),
    summary: lt(
      'The global network recorded 153.3 million passenger movements in 2025. The 39 airports in Malaysia handled 104.4 million passengers, up 11.2%, and KLIA 63.3 million, up 10.8%. December was the busiest month, with 10 million passengers in Malaysia, 15.5% more than a year earlier.',
      'Rangkaian global merekodkan 153.3 juta pergerakan penumpang pada 2025. 39 lapangan terbang di Malaysia mengendalikan 104.4 juta penumpang, naik 11.2%, dan KLIA 63.3 juta, naik 10.8%. Disember ialah bulan paling sibuk, dengan 10 juta penumpang di Malaysia, 15.5% lebih tinggi berbanding setahun sebelumnya.',
    ),
    airports: ['kul'],
    sources: ['corp-mahb-news-1678', 'corp-routes-2025-growth', 'corp-thestar-traffic-2025', 'corp-xinhua-traffic-2025'],
  },
  {
    slug: 'klia-aerotrain-returns',
    kind: 'coverage',
    topic: 'projects',
    date: '2025-07-01',
    title: lt('KLIA Aerotrain returns after replacement', 'Aerotrain KLIA kembali selepas penggantian'),
    summary: lt(
      'The Aerotrain between the Terminal 1 main building and the satellite building resumed service on 1 July 2025 after about 28 months. The replacement cost RM456.1 million.',
      'Aerotrain antara bangunan utama Terminal 1 dan bangunan satelit kembali beroperasi pada 1 Julai 2025 selepas kira-kira 28 bulan. Penggantian itu menelan kos RM456.1 juta.',
    ),
    airports: ['kul'],
    sources: ['paultan-aerotrain-resumes-2025', 'corp-malaymail-aerotrain-returns-2025', 'corp-malaymail-aerotrain-cost-2025'],
  },
  {
    slug: 'klia-skytrax-2025',
    kind: 'coverage',
    topic: 'recognition',
    date: '2025-04-10',
    title: lt('KLIA climbs to 65th in the Skytrax World’s Top 100 Airports', 'KLIA naik ke tempat ke-65 dalam Skytrax World’s Top 100 Airports'),
    summary: lt(
      'KLIA ranked 65th in the Skytrax World’s Top 100 Airports 2025, and KLIA Terminal 2 ranked sixth among the world’s best low-cost airline terminals.',
      'KLIA di tempat ke-65 dalam Skytrax World’s Top 100 Airports 2025, dan KLIA Terminal 2 di tempat keenam antara terminal syarikat penerbangan tambang rendah terbaik dunia.',
    ),
    airports: ['kul'],
    sources: ['corp-fmt-skytrax-2025', 'corp-scoop-skytrax-2025'],
  },
  {
    slug: 'klia-asq-2024-top-10',
    kind: 'coverage',
    topic: 'recognition',
    date: '2025-03-17',
    title: lt('KLIA among the world’s top 10 in Airport Service Quality', 'KLIA antara 10 teratas dunia dalam Airport Service Quality'),
    summary: lt(
      'KLIA was placed among the world’s top 10 airports with over 40 million passengers in the ACI Airport Service Quality survey for 2024, with a score of 4.99 out of 5.',
      'KLIA berada dalam kalangan 10 lapangan terbang teratas dunia dengan lebih 40 juta penumpang dalam tinjauan ACI Airport Service Quality bagi 2024, dengan skor 4.99 daripada 5.',
    ),
    airports: ['kul'],
    sources: ['corp-malaymail-asq-2024'],
  },
  {
    slug: 'malaysia-airports-delisted',
    kind: 'coverage',
    topic: 'company',
    date: '2025-02-25',
    title: lt('Malaysia Airports leaves Bursa Malaysia', 'Malaysia Airports keluar daripada Bursa Malaysia'),
    summary: lt(
      'Malaysia Airports Holdings Berhad was removed from the Official List of Bursa Malaysia on 25 February 2025, ending just over 25 years as a listed company. Gateway Development Alliance, the consortium of Khazanah Nasional, the Employees Provident Fund, the Abu Dhabi Investment Authority and Global Infrastructure Partners, now owns the company.',
      'Malaysia Airports Holdings Berhad dikeluarkan daripada Senarai Rasmi Bursa Malaysia pada 25 Februari 2025, menamatkan lebih sedikit 25 tahun sebagai syarikat tersenarai. Gateway Development Alliance, konsortium Khazanah Nasional, Kumpulan Wang Simpanan Pekerja, Abu Dhabi Investment Authority dan Global Infrastructure Partners, kini memiliki syarikat itu.',
    ),
    sources: ['corp-thestar-delisting-2025', 'corp-malaysiakini-delisting-2025', 'corp-bernama-delisting-2025', 'corp-azmilaw-delisting'],
  },
  {
    slug: 'kota-kinabalu-langkawi-carbon-accreditation',
    kind: 'coverage',
    topic: 'sustainability',
    date: '2024-12-05',
    title: lt('Kota Kinabalu and Langkawi achieve Airport Carbon Accreditation', 'Kota Kinabalu dan Langkawi mencapai Akreditasi Karbon Lapangan Terbang'),
    summary: lt(
      'Kota Kinabalu International Airport and Langkawi International Airport achieved Level 1 (Mapping) Airport Carbon Accreditation.',
      'Lapangan Terbang Antarabangsa Kota Kinabalu dan Lapangan Terbang Antarabangsa Langkawi mencapai Akreditasi Karbon Lapangan Terbang Tahap 1 (Pemetaan).',
    ),
    airports: ['bki', 'lgk'],
    sources: ['corp-aci-aca-bki-lgk-2024', 'corp-bernama-aca-2024'],
  },
];
