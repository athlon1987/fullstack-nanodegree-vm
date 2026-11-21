/**
 * ILLUSTRATIVE route templates for the demo flight generator.
 *
 * !! Not published facts. !!
 * Everything in this file feeds ONLY `DemoFlightProvider`. The airlines and destinations are
 * real and broadly known to be served, but frequencies, flight times, flight numbers, terminals
 * and aircraft here are plausible inventions for a demonstration schedule. Never render this
 * data as "airlines at this airport" or "destinations served": published airline facts live in
 * the content layer (`AirlineAtAirport` records with sources).
 *
 * Every template carries `illustrative: true` so that misuse is easy to spot in review.
 */
import type { AirlineAtAirport, AirlineDestination, TerminalId } from '@/content/types';

/** A destination in a demo template, with the invented frequency and flight time. */
export interface DemoDestination extends AirlineDestination {
  /** Flights per day in each direction. */
  daily: number;
  /** Flight time in minutes. */
  minutes: number;
  /** ISO weekdays (1 is Monday) the route operates. Omit for daily. */
  days?: number[];
}

/**
 * One airline's demo routes from one airport. Shares the core shape of `AirlineAtAirport`
 * (code, name, terminal, check-in) so both can be listed by the same components in the design
 * system page, but it is a separate type on purpose.
 */
export interface DemoAirlineRoutes extends Pick<AirlineAtAirport, 'code' | 'name' | 'terminal' | 'checkIn'> {
  illustrative: true;
  destinations: DemoDestination[];
}

/** Static facts about an airline used to decorate demo flights. */
export interface DemoAirlineProfile {
  name: string;
  /** Inclusive range that flight numbers are drawn from. */
  numbers: [number, number];
  /** Aircraft type used for short flights and, when given, for flights over five hours. */
  aircraft: { short: string; long?: string };
  /** Airline codes whose flight numbers may appear as illustrative codeshares. */
  codesharePartners?: string[];
}

/** Airlines that appear in the demo schedule. */
export const DEMO_AIRLINES: Readonly<Record<string, DemoAirlineProfile>> = {
  MH: { name: 'Malaysia Airlines', numbers: [100, 2899], aircraft: { short: 'Boeing 737-800', long: 'Airbus A330-300' }, codesharePartners: ['QR', 'JL', 'CX', 'BA'] },
  AK: { name: 'AirAsia', numbers: [300, 6999], aircraft: { short: 'Airbus A320' } },
  D7: { name: 'AirAsia X', numbers: [100, 899], aircraft: { short: 'Airbus A330-300' } },
  OD: { name: 'Batik Air Malaysia', numbers: [1000, 2999], aircraft: { short: 'Boeing 737-800' } },
  FY: { name: 'Firefly', numbers: [1000, 3999], aircraft: { short: 'ATR 72-500' } },
  MY: { name: 'AirBorneo', numbers: [3000, 3999], aircraft: { short: 'ATR 72-500' } },
  SQ: { name: 'Singapore Airlines', numbers: [100, 199], aircraft: { short: 'Boeing 737-8' } },
  TR: { name: 'Scoot', numbers: [400, 499], aircraft: { short: 'Airbus A320' } },
  EK: { name: 'Emirates', numbers: [340, 349], aircraft: { short: 'Boeing 777-300ER' } },
  QR: { name: 'Qatar Airways', numbers: [840, 859], aircraft: { short: 'Boeing 777-300ER' } },
  CX: { name: 'Cathay Pacific', numbers: [700, 799], aircraft: { short: 'Airbus A330-300' } },
  JL: { name: 'Japan Airlines', numbers: [720, 729], aircraft: { short: 'Boeing 787-9' } },
  KL: { name: 'KLM', numbers: [800, 899], aircraft: { short: 'Boeing 777-300ER' } },
  NH: { name: 'All Nippon Airways', numbers: [800, 899], aircraft: { short: 'Boeing 787-9' } },
  TK: { name: 'Turkish Airlines', numbers: [60, 69], aircraft: { short: 'Airbus A350-900' } },
  BA: { name: 'British Airways', numbers: [30, 39], aircraft: { short: 'Boeing 787-9' } },
  KE: { name: 'Korean Air', numbers: [670, 679], aircraft: { short: 'Airbus A330-300' } },
  EY: { name: 'Etihad Airways', numbers: [410, 419], aircraft: { short: 'Boeing 787-9' } },
  AI: { name: 'Air India', numbers: [380, 389], aircraft: { short: 'Airbus A320neo' } },
  BI: { name: 'Royal Brunei Airlines', numbers: [820, 829], aircraft: { short: 'Airbus A320neo' } },
  CI: { name: 'China Airlines', numbers: [730, 739], aircraft: { short: 'Airbus A321neo' } },
};

const MY = 'Malaysia';

/** Places used by the demo schedule, by IATA code. */
export const DEMO_PLACES: Readonly<Record<string, { city: string; country: string }>> = {
  KUL: { city: 'Kuala Lumpur', country: MY },
  SZB: { city: 'Kuala Lumpur (Subang)', country: MY },
  PEN: { city: 'Penang', country: MY },
  LGK: { city: 'Langkawi', country: MY },
  BKI: { city: 'Kota Kinabalu', country: MY },
  KCH: { city: 'Kuching', country: MY },
  JHB: { city: 'Johor Bahru', country: MY },
  KBR: { city: 'Kota Bharu', country: MY },
  TGG: { city: 'Kuala Terengganu', country: MY },
  AOR: { city: 'Alor Setar', country: MY },
  IPH: { city: 'Ipoh', country: MY },
  KUA: { city: 'Kuantan', country: MY },
  MYY: { city: 'Miri', country: MY },
  SBW: { city: 'Sibu', country: MY },
  BTU: { city: 'Bintulu', country: MY },
  TWU: { city: 'Tawau', country: MY },
  SDK: { city: 'Sandakan', country: MY },
  LBU: { city: 'Labuan', country: MY },
  LDU: { city: 'Lahad Datu', country: MY },
  MZV: { city: 'Mulu', country: MY },
  LMN: { city: 'Limbang', country: MY },
  MKM: { city: 'Mukah', country: MY },
  LWY: { city: 'Lawas', country: MY },
  BBN: { city: 'Bario', country: MY },
  SIN: { city: 'Singapore', country: 'Singapore' },
  XSP: { city: 'Singapore (Seletar)', country: 'Singapore' },
  BKK: { city: 'Bangkok', country: 'Thailand' },
  DMK: { city: 'Bangkok (Don Mueang)', country: 'Thailand' },
  HKT: { city: 'Phuket', country: 'Thailand' },
  CGK: { city: 'Jakarta', country: 'Indonesia' },
  DPS: { city: 'Denpasar (Bali)', country: 'Indonesia' },
  PNK: { city: 'Pontianak', country: 'Indonesia' },
  HKG: { city: 'Hong Kong', country: 'Hong Kong' },
  TPE: { city: 'Taipei', country: 'Taiwan' },
  NRT: { city: 'Tokyo (Narita)', country: 'Japan' },
  HND: { city: 'Tokyo (Haneda)', country: 'Japan' },
  KIX: { city: 'Osaka', country: 'Japan' },
  ICN: { city: 'Seoul', country: 'South Korea' },
  PVG: { city: 'Shanghai', country: 'China' },
  MNL: { city: 'Manila', country: 'Philippines' },
  SGN: { city: 'Ho Chi Minh City', country: 'Vietnam' },
  DEL: { city: 'Delhi', country: 'India' },
  BOM: { city: 'Mumbai', country: 'India' },
  LHR: { city: 'London', country: 'United Kingdom' },
  AMS: { city: 'Amsterdam', country: 'Netherlands' },
  IST: { city: 'Istanbul', country: 'Turkey' },
  DOH: { city: 'Doha', country: 'Qatar' },
  DXB: { city: 'Dubai', country: 'United Arab Emirates' },
  AUH: { city: 'Abu Dhabi', country: 'United Arab Emirates' },
  SYD: { city: 'Sydney', country: 'Australia' },
  MEL: { city: 'Melbourne', country: 'Australia' },
  PER: { city: 'Perth', country: 'Australia' },
  BWN: { city: 'Bandar Seri Begawan', country: 'Brunei' },
};

/** `[destination code, flights per day, flight minutes, ISO weekdays?]` */
type RouteTuple = [code: string, daily: number, minutes: number, days?: number[]];

function routes(code: string, list: RouteTuple[], terminal?: TerminalId, checkIn?: string): DemoAirlineRoutes {
  const profile = DEMO_AIRLINES[code];
  if (!profile) throw new Error(`Demo routes refer to an unknown airline: ${code}`);
  const template: DemoAirlineRoutes = {
    code,
    name: profile.name,
    illustrative: true,
    destinations: list.map(([place, daily, minutes, days]) => {
      const known = DEMO_PLACES[place];
      if (!known) throw new Error(`Demo routes refer to an unknown place: ${place}`);
      const destination: DemoDestination = { code: place, city: known.city, country: known.country, daily, minutes };
      if (days) destination.days = days;
      return destination;
    }),
  };
  if (terminal) template.terminal = terminal;
  if (checkIn) template.checkIn = { en: checkIn };
  return template;
}

/**
 * Illustrative route templates by airport slug. Featured airports have a fuller day; other
 * domestic airports get a handful of flights; STOLports and airports with no reliable scheduled
 * service (Melaka) have none, and their boards show the "no demonstration flights" message.
 */
export const DEMO_ROUTES: Readonly<Record<string, DemoAirlineRoutes[]>> = {
  kul: [
    routes(
      'MH',
      [
        ['PEN', 4, 60], ['BKI', 4, 155], ['KCH', 4, 110], ['LGK', 3, 65], ['KBR', 2, 60], ['JHB', 2, 55],
        ['TGG', 1, 55], ['AOR', 1, 60], ['MYY', 1, 140], ['SBW', 1, 120], ['BTU', 1, 130], ['TWU', 1, 170],
        ['SDK', 1, 170], ['KUA', 1, 45], ['LBU', 1, 150],
        ['SIN', 4, 65], ['CGK', 3, 125], ['BKK', 2, 130], ['DPS', 2, 180], ['LHR', 2, 810], ['HKG', 1, 240],
        ['NRT', 1, 420], ['KIX', 1, 390], ['ICN', 1, 395], ['SYD', 1, 500], ['MEL', 1, 490], ['PER', 1, 335],
        ['DOH', 1, 450], ['DEL', 1, 330], ['BOM', 1, 320], ['MNL', 1, 235], ['SGN', 1, 115], ['PVG', 1, 320],
      ],
      'T1',
    ),
    routes('OD', [['PEN', 2, 60], ['BKI', 1, 155], ['KCH', 1, 110], ['LGK', 1, 65], ['DPS', 1, 180], ['CGK', 1, 125], ['DMK', 1, 130], ['NRT', 1, 420], ['PER', 1, 335]], 'T1'),
    routes('SQ', [['SIN', 4, 65]], 'T1'),
    routes('EK', [['DXB', 3, 430]], 'T1'),
    routes('QR', [['DOH', 3, 450]], 'T1'),
    routes('CX', [['HKG', 3, 240]], 'T1'),
    routes('EY', [['AUH', 2, 430]], 'T1'),
    routes('JL', [['NRT', 1, 420]], 'T1'),
    routes('NH', [['HND', 1, 425]], 'T1'),
    routes('KL', [['AMS', 1, 780]], 'T1'),
    routes('TK', [['IST', 1, 660]], 'T1'),
    routes('BA', [['LHR', 1, 810]], 'T1'),
    routes('KE', [['ICN', 1, 395]], 'T1'),
    routes('AI', [['DEL', 1, 330]], 'T1'),
    routes(
      'AK',
      [
        ['PEN', 4, 60], ['BKI', 4, 155], ['KCH', 4, 110], ['LGK', 3, 65], ['JHB', 3, 55], ['KBR', 2, 60],
        ['TWU', 2, 170], ['SDK', 1, 170], ['MYY', 1, 140], ['SBW', 1, 120], ['AOR', 1, 60], ['TGG', 1, 55],
        ['SIN', 4, 65], ['DMK', 2, 130], ['CGK', 2, 125], ['DPS', 2, 180], ['HKT', 1, 85], ['SGN', 1, 115],
        ['HKG', 1, 240], ['MNL', 1, 235],
      ],
      'T2',
    ),
    routes('D7', [['ICN', 1, 395], ['HND', 1, 425], ['KIX', 1, 390], ['SYD', 1, 500], ['MEL', 1, 490], ['PER', 1, 335], ['TPE', 1, 285], ['DEL', 1, 330]], 'T2'),
  ],
  pen: [
    routes('AK', [['KUL', 6, 60], ['JHB', 2, 75], ['BKI', 1, 165], ['KCH', 1, 120], ['LGK', 1, 35], ['SIN', 2, 90], ['DMK', 1, 110]]),
    routes('MH', [['KUL', 5, 60]]),
    routes('OD', [['KUL', 2, 60], ['SZB', 2, 60]]),
    routes('FY', [['SZB', 4, 70], ['LGK', 1, 40]]),
    routes('SQ', [['SIN', 2, 90]]),
    routes('TR', [['SIN', 3, 90]]),
    routes('CX', [['HKG', 1, 230]]),
    routes('CI', [['TPE', 1, 280]]),
  ],
  bki: [
    routes('AK', [['KUL', 8, 155], ['KCH', 2, 85], ['TWU', 3, 50], ['SDK', 3, 45], ['JHB', 1, 140], ['PEN', 1, 165], ['SIN', 1, 150], ['TPE', 1, 210], ['MNL', 1, 120]]),
    routes('MH', [['KUL', 5, 155]]),
    routes('OD', [['KUL', 2, 155]]),
    routes('MY', [['LBU', 3, 35], ['LDU', 2, 55], ['MZV', 1, 60], ['MYY', 1, 60]]),
    routes('TR', [['SIN', 1, 150]]),
    routes('BI', [['BWN', 1, 40]]),
  ],
  kch: [
    routes('AK', [['KUL', 8, 110], ['BKI', 2, 85], ['SBW', 3, 45], ['MYY', 2, 65], ['BTU', 2, 55], ['JHB', 2, 85], ['PEN', 1, 120], ['SIN', 1, 85], ['PNK', 1, 45]]),
    routes('MH', [['KUL', 4, 110]]),
    routes('OD', [['KUL', 1, 110]]),
    routes('TR', [['SIN', 2, 85]]),
    routes('MY', [['MZV', 1, 90], ['MKM', 1, 60]]),
  ],
  lgk: [
    routes('AK', [['KUL', 5, 65], ['PEN', 1, 35], ['SIN', 1, 95]]),
    routes('MH', [['KUL', 3, 65]]),
    routes('OD', [['KUL', 1, 65]]),
    routes('FY', [['SZB', 2, 75], ['PEN', 1, 40]]),
    routes('TR', [['SIN', 1, 95]]),
  ],
  szb: [
    routes('FY', [['PEN', 4, 70], ['KBR', 3, 70], ['TGG', 2, 65], ['AOR', 2, 75], ['LGK', 2, 75], ['JHB', 2, 70], ['XSP', 2, 90]]),
    routes('OD', [['PEN', 2, 60], ['KBR', 2, 60]]),
    routes('AK', [['KCH', 1, 110], ['BKI', 1, 155]]),
    routes('TR', [['SIN', 1, 70]]),
  ],
  kbr: [
    routes('AK', [['KUL', 4, 60]]),
    routes('MH', [['KUL', 3, 60]]),
    routes('OD', [['KUL', 1, 60], ['SZB', 2, 60]]),
    routes('FY', [['SZB', 3, 70]]),
    routes('TR', [['SIN', 1, 85]]),
  ],
  tgg: [routes('AK', [['KUL', 2, 55]]), routes('MH', [['KUL', 2, 55]]), routes('FY', [['SZB', 2, 65]])],
  iph: [routes('TR', [['SIN', 2, 85]]), routes('AK', [['JHB', 1, 80]])],
  aor: [routes('AK', [['KUL', 3, 60], ['JHB', 1, 90]]), routes('MH', [['KUL', 2, 60]]), routes('FY', [['SZB', 2, 75]])],
  kua: [routes('MH', [['KUL', 1, 45]]), routes('TR', [['SIN', 1, 60, [3, 5, 7]]])],
  myy: [
    routes('AK', [['KUL', 3, 140], ['KCH', 2, 65], ['BKI', 1, 60]]),
    routes('MH', [['KUL', 2, 140]]),
    routes('TR', [['SIN', 1, 125]]),
    routes('MY', [['MZV', 2, 30], ['LMN', 2, 35], ['SBW', 1, 60], ['LBU', 1, 40], ['LWY', 1, 45], ['BBN', 1, 50]]),
  ],
  sbw: [routes('AK', [['KUL', 3, 120], ['KCH', 3, 45]]), routes('MH', [['KUL', 2, 120]]), routes('OD', [['KUL', 1, 120]]), routes('MY', [['MYY', 1, 60]])],
  btu: [routes('AK', [['KUL', 2, 130], ['KCH', 2, 55]]), routes('MH', [['KUL', 2, 130]]), routes('OD', [['KUL', 1, 130]]), routes('MY', [['MYY', 1, 40], ['SBW', 1, 40]])],
  mzv: [routes('MY', [['MYY', 2, 30], ['KCH', 1, 90], ['BKI', 1, 60]])],
  lmn: [routes('MY', [['MYY', 2, 35]])],
  lbu: [routes('MH', [['KUL', 2, 150]]), routes('MY', [['BKI', 3, 35], ['MYY', 1, 40]])],
  sdk: [routes('AK', [['KUL', 3, 170], ['BKI', 3, 45]]), routes('MH', [['KUL', 2, 170]])],
  twu: [routes('AK', [['KUL', 4, 170], ['BKI', 3, 50]]), routes('MH', [['KUL', 2, 170]])],
  ldu: [routes('MY', [['BKI', 3, 55]])],
  mkm: [routes('MY', [['KCH', 1, 60], ['MYY', 1, 50], ['SBW', 1, 30]])],
};

/** Slugs of airports that have demo routes, featured airports first. */
export const DEMO_AIRPORT_SLUGS: readonly string[] = Object.keys(DEMO_ROUTES);

/** True when the demo generator can build a board for the airport. */
export function hasDemoRoutes(airport: string): boolean {
  return (DEMO_ROUTES[airport.toLowerCase()]?.length ?? 0) > 0;
}
