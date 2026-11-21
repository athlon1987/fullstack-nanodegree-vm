/**
 * Server-only builder for the parking page: picks the page language, resolves sources and finds
 * the advice that goes with premium parking, so Client Components never import `@/content`.
 */
import { localizeAirport, pick, type AirportContent, type Lang } from '@/content';
import { needsTranslationNotice, noteView, officialSite, sourceLookup, terminalInfo } from '@/components/transport/transport-data.server';
import { officialSourceUrl, type NoteView } from '@/components/transport/transport-types';
import type { CarParkView, ParkingPageData, ReportedFigure } from './parking-types';

/** The parking page model, plus the notes rendered on the server. */
export interface ParkingPageModel {
  data: ParkingPageData;
  /** True when at least one car park's rates are not verified. */
  someNotVerified: boolean;
  gaps?: NoteView;
  translationMissing: boolean;
}

export function parkingPageModel(content: AirportContent, lang: Lang): ParkingPageModel {
  const premium = content.carParks.some((carPark) => carPark.type === 'preferred');
  const warning = premium ? content.guidesNotes.find((note) => note.id === `${content.airport.slug}-preferred-parking-warning`) : undefined;
  const gaps = content.guidesNotes.find((note) => note.id === `${content.airport.slug}-content-gaps`);
  const sources = sourceLookup([...content.carParks.flatMap((carPark) => carPark.sources), ...(warning?.sources ?? []), ...(gaps?.sources ?? [])]);
  const site = officialSite(content);
  const bookingPage = content.carParks.find((carPark) => carPark.bookingUrl)?.bookingUrl;

  const carParks: CarParkView[] = content.carParks.map((carPark) => {
    const view: CarParkView = {
      id: carPark.id,
      name: pick(carPark.name, lang),
      type: carPark.type,
      rates: carPark.rates,
      rateStatus: carPark.rateStatus,
      features: carPark.features.map((feature) => pick(feature, lang)),
      provenance: carPark.provenance,
      sourceIds: carPark.sources,
      officialUrl: carPark.bookingUrl ?? officialSourceUrl(carPark.sources, sources) ?? bookingPage ?? site,
    };
    if (carPark.terminal) view.terminal = carPark.terminal;
    if (carPark.description) view.description = pick(carPark.description, lang);
    if (carPark.bays !== undefined) view.bays = carPark.bays;
    if (carPark.baysQualifier) view.baysQualifier = carPark.baysQualifier;
    if (carPark.walk) {
      view.walk = {};
      if (carPark.walk.minutes !== undefined) view.walk.minutes = carPark.walk.minutes;
      if (carPark.walk.note) view.walk.note = pick(carPark.walk.note, lang);
    }
    if (carPark.dailyMax !== undefined) view.dailyMax = carPark.dailyMax;
    if (carPark.graceMinutes !== undefined) view.graceMinutes = carPark.graceMinutes;
    if (carPark.payment) view.payment = carPark.payment;
    if (carPark.accessibleBays !== undefined) view.accessibleBays = carPark.accessibleBays;
    if (carPark.evCharging !== undefined) view.evCharging = carPark.evCharging;
    if (carPark.bookingUrl) view.bookingUrl = carPark.bookingUrl;
    if (carPark.asOf) view.asOf = carPark.asOf;
    // Only figures whose source the car park itself cites, so every number keeps its attribution.
    const reported = (carPark.reportedDailyMax ?? [])
      .filter((figure) => carPark.sources.includes(figure.source) && sources[figure.source])
      .map((figure): ReportedFigure => {
        const source = sources[figure.source];
        const item: ReportedFigure = { amount: figure.amount, sourceId: source.id, publisher: source.publisher, retrieved: source.retrieved };
        if (source.asOf) item.asOf = source.asOf;
        return item;
      });
    if (reported.length > 0) view.reported = reported;
    return view;
  });

  const data: ParkingPageData = {
    slug: content.airport.slug,
    airportName: localizeAirport(content.airport, lang).shortName,
    timezone: content.airport.timezone,
    terminals: terminalInfo(content, lang),
    carParks,
    sources,
    officialUrl: bookingPage ?? site,
  };
  if (warning) data.premiumWarning = noteView(warning, lang);

  const model: ParkingPageModel = {
    data,
    someNotVerified: content.carParks.some((carPark) => carPark.rateStatus === 'not-verified'),
    translationMissing: needsTranslationNotice(
      [...content.carParks.flatMap((carPark) => [carPark.name, carPark.description, carPark.walk?.note, ...carPark.features]), warning?.title, warning?.body],
      lang,
    ),
  };
  if (gaps) model.gaps = noteView(gaps, lang);
  return model;
}
