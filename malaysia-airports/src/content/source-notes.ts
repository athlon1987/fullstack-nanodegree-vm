/**
 * Our annotations about sources, in both languages (D-03). They used to be written into source
 * titles and publishers ("(as summarised in search results)", "(third-party guide)"), which put
 * team-written English on Malay pages. A source carries one as `note` (what kind of copy or
 * reading it is) or `asOfNote` (a qualifier for its date); `SourceNote` shows it in the
 * reader's language. Add new annotations here, never in a title.
 *
 * The Malay wording is a draft pending review by a native-speaking editor (OOS-14).
 */
import type { LocalizedText } from './types';

export const NOTES = {
  acaOperator: { en: "Operator of Airport Carbon Accreditation", ms: "Pengendali Akreditasi Karbon Lapangan Terbang" },
  addressFromSearch: { en: "Address as given in search results", ms: "Alamat seperti diberikan dalam hasil carian" },
  advertorial: { en: "Advertorial for Malaysia Airports", ms: "Advertorial untuk Malaysia Airports" },
  airlineGuide: { en: "Airline travel guide about the airport", ms: "Panduan perjalanan syarikat penerbangan tentang lapangan terbang" },
  airportSite: { en: "Malaysia Airports airport site", ms: "Laman lapangan terbang Malaysia Airports" },
  analystNote: { en: "Analyst note", ms: "Nota penganalisis" },
  annualReport2020: { en: "Annual Report 2020", ms: "Laporan Tahunan 2020" },
  annualReportTextCopy: { en: "Text copy of the Annual Report 2023", ms: "Salinan teks Laporan Tahunan 2023" },
  articleTitleNotRecorded: { en: "Article title not recorded", ms: "Tajuk artikel tidak direkodkan" },
  asIndexed: { en: "As indexed by search engines", ms: "Seperti diindeks oleh enjin carian" },
  blog: { en: "Blog", ms: "Blog" },
  corporateFoundNotRead: { en: "Corporate website; page found in search results, content not read", ms: "Laman web korporat; halaman ditemui dalam hasil carian, kandungan tidak dibaca" },
  corporateSearchSummary: { en: "Corporate website, as summarised in search results", ms: "Laman web korporat, seperti diringkaskan dalam hasil carian" },
  corporateSustainability: { en: "Corporate website, Sustainability section", ms: "Laman web korporat, bahagian Kelestarian" },
  directory: { en: "Shop, dine and services directory", ms: "Direktori kedai, makanan dan perkhidmatan" },
  domesticDepartures: { en: "Domestic departures", ms: "Berlepas domestik" },
  headlineFromLink: { en: "Headline as given in the link", ms: "Tajuk berita seperti dalam pautan" },
  indexedNotRead: { en: "Page found in the search index; content not read first hand", ms: "Halaman ditemui dalam indeks carian; kandungan tidak dibaca secara langsung" },
  lawFirm: { en: "Law firm", ms: "Firma guaman" },
  linkNotRecorded: { en: "As quoted in search results on 17 November 2026; exact link not recorded", ms: "Seperti dipetik dalam hasil carian pada 17 November 2026; pautan tepat tidak direkodkan" },
  linkedFromHelp: { en: "Linked from Help on the official site; observed first hand", ms: "Dipautkan dari Bantuan di laman rasmi; dilihat sendiri" },
  listing: { en: "Listing", ms: "Senarai" },
  mahbSearchSummary: { en: "Malaysia Airports website, as summarised in search results", ms: "Laman web Malaysia Airports, seperti diringkaskan dalam hasil carian" },
  mediaCentre: { en: "Media centre", ms: "Pusat media" },
  mediaCentreShortened: { en: "Media centre; title shortened in search results", ms: "Pusat media; tajuk dipendekkan dalam hasil carian" },
  mediaCentreUntitled: { en: "Media centre item 273; title not captured", ms: "Item pusat media 273; tajuk tidak direkodkan" },
  mirror: { en: "Mirror copy", ms: "Salinan cermin" },
  namedNotRead: { en: "Named in search results; content not read", ms: "Dinamakan dalam hasil carian; kandungan tidak dibaca" },
  observedRange: { en: "Flights observed September to October 2026", ms: "Penerbangan diperhatikan September hingga Oktober 2026" },
  officialTikTok: { en: "Official TikTok account", ms: "Akaun TikTok rasmi" },
  olderGuide: { en: "Older guide", ms: "Panduan lama" },
  olderTariff: { en: "Older tariff", ms: "Tarif lama" },
  pageFoundNotRead: { en: "Page found in search results; content not read", ms: "Halaman ditemui dalam hasil carian; kandungan tidak dibaca" },
  postOnThreads: { en: "Post on Threads", ms: "Hantaran di Threads" },
  postOnX: { en: "Post on X", ms: "Hantaran di X" },
  publicationCopy: { en: "Copy of a Malaysia Airports publication", ms: "Salinan penerbitan Malaysia Airports" },
  releaseRelay: { en: "Relay of a Malaysia Airports release", ms: "Salinan semula kenyataan Malaysia Airports" },
  reportedAbout: { en: "Approximate; article date not captured", ms: "Anggaran; tarikh artikel tidak direkodkan" },
  restaurantsCafes: { en: "Restaurants and cafes", ms: "Restoran dan kafe" },
  routesRelay: { en: "Malaysia Airports release, republished by Routes", ms: "Kenyataan Malaysia Airports, diterbitkan semula oleh Routes" },
  searchSummary: { en: "As summarised in search results", ms: "Seperti diringkaskan dalam hasil carian" },
  sitemapOnly: { en: "Listed in the official sitemap; content not captured", ms: "Disenaraikan dalam peta laman rasmi; kandungan tidak dirakam" },
  tabledInParliament: { en: "2024 annual report tabled in Parliament", ms: "Laporan tahunan 2024 yang dibentangkan di Parlimen" },
  thirdPartyGuide: { en: "Third-party guide", ms: "Panduan pihak ketiga" },
  titleFromAddress: { en: "Title taken from the web address", ms: "Tajuk diambil daripada alamat web" },
  titleNotCaptured: { en: "Title not captured in search results", ms: "Tajuk tidak direkodkan dalam hasil carian" },
  titleSeenNotRead: { en: "Title seen in search results; content not read", ms: "Tajuk dilihat dalam hasil carian; kandungan tidak dibaca" },
  undatedCopy: { en: "Undated copy", ms: "Salinan tanpa tarikh" },
  viaPressReader: { en: "Via PressReader", ms: "Melalui PressReader" },
  authorityNotRead: { en: 'Named as the authority; we could not open its site, so its content is not read', ms: 'Dinamakan sebagai pihak berkuasa; kami tidak dapat membuka lamannya, jadi kandungannya tidak dibaca' },
} as const satisfies Record<string, LocalizedText>;

/** Optional extras a source helper accepts after the date. */
export interface SourceExtras {
  note?: LocalizedText;
  asOfNote?: LocalizedText;
  localTitle?: LocalizedText;
  localPublisher?: LocalizedText;
}
