/**
 * Understanding a question: which intent it expresses and which slots it fills (airport,
 * terminal, flight number, destination, facility category, duration, gate). Rule-based and
 * deterministic, in English and Bahasa Malaysia, so it runs the same on the server and in the
 * browser and can be unit-tested.
 */
import type { FacilityCategory, TerminalId } from '@/content/types';
import { AIRLINE_ALIASES } from '@/lib/flights/query';
import { hasPhrase, normalise } from './text';
import type { ConciergeContext, ConciergeIntent, ConciergeKnowledge, ConciergeSlots, Understanding } from './types';

/** Phrases (normalised) that point to a facility category. Order matters: specific first. */
const CATEGORY_PHRASES: readonly [FacilityCategory, readonly string[]][] = [
  ['accessible-toilet', ['accessible toilet', 'disabled toilet', 'tandas oku']],
  ['lost-property', ['lost and found', 'lost property', 'barang hilang']],
  ['prayer-room', ['prayer room', 'prayer rooms', 'pray', 'prayer', 'surau', 'musolla', 'musalla', 'solat', 'sembahyang', 'mosque', 'masjid']],
  ['nursing-room', ['nursing room', 'nursing', 'breastfeed', 'breastfeeding', 'baby room', 'baby care', 'nappy', 'diaper', 'menyusu', 'bilik bayi', 'penjagaan bayi']],
  ['toilet', ['toilet', 'toilets', 'restroom', 'restrooms', 'bathroom', 'washroom', 'loo', 'tandas']],
  ['wifi', ['wifi', 'wi fi', 'internet', 'wireless']],
  ['calm-room', ['calm room', 'quiet room', 'quiet space', 'bilik tenang']],
  ['lounge', ['lounge', 'lounges']],
  ['hotel', ['hotel', 'hotels', 'transit hotel']],
  ['clinic', ['clinic', 'doctor', 'medical', 'first aid', 'klinik', 'doktor', 'perubatan', 'unwell', 'sick']],
  ['pharmacy', ['pharmacy', 'chemist', 'farmasi']],
  ['atm', ['atm', 'atms', 'cash machine', 'withdraw cash', 'mesin atm']],
  ['money-changer', ['money changer', 'currency exchange', 'exchange money', 'change money', 'pengurup wang', 'tukar wang']],
  ['sim', ['sim card', 'sim cards', 'kad sim', 'mobile data']],
  ['information', ['information counter', 'information desk', 'info desk', 'help desk', 'kaunter pertanyaan', 'kaunter maklumat']],
  ['smoking', ['smoking', 'smoke', 'smoking room', 'merokok', 'rokok']],
  ['shower', ['shower', 'showers', 'mandi']],
  ['charging', ['charging', 'charge my phone', 'charger', 'mengecas']],
  ['water', ['drinking water', 'water fountain', 'air minuman']],
  ['play-area', ['play area', 'playground', 'permainan kanak kanak']],
  ['viewing', ['viewing gallery', 'plane spotting', 'galeri tinjau']],
  ['rest', ['sleep', 'nap', 'rest area', 'tidur', 'ruang rehat']],
];

type Rule = readonly [ConciergeIntent, number, readonly string[]];

/** Weighted intent phrases (normalised). */
const RULES: readonly Rule[] = [
  ['flight-delay', 5, ['delay', 'delayed', 'delays', 'late', 'cancel', 'cancelled', 'canceled', 'cancellation', 'missed', 'miss my', 'lewat', 'tertunda', 'ditunda', 'kelewatan', 'dibatalkan', 'batal', 'terlepas']],
  ['check-in', 4, ['check in', 'checkin', 'checking in', 'daftar masuk', 'bag drop', 'drop my bag', 'drop off my bag', 'kaunter daftar']],
  ['terminal-transfer', 5, ['between terminals', 'between the terminals', 'change terminal', 'change terminals', 'changing terminals', 'other terminal', 'inter terminal', 'transfer terminal', 'antara terminal', 'tukar terminal', 'bertukar terminal']],
  ['dining', 4, ['eat', 'eating', 'food', 'hungry', 'restaurant', 'restaurants', 'cafe', 'coffee', 'dine', 'dining', 'meal', 'breakfast', 'lunch', 'dinner', 'snack', 'halal', 'makan', 'makanan', 'minum', 'restoran', 'kafe', 'kopi', 'sarapan']],
  ['parking', 4, ['park', 'parking', 'car park', 'carpark', 'parkir', 'letak kereta', 'tempat letak']],
  ['lost-property', 4, ['lost', 'lose', 'left behind', 'left my', 'forgot', 'forgotten', 'missing', 'did not arrive', 'didnt arrive', 'not arrived', 'hilang', 'tertinggal', 'tercicir', 'keciciran', 'tidak sampai']],
  ['assistance', 4, ['wheelchair', 'wheel chair', 'reduced mobility', 'mobility', 'disabled', 'disability', 'disabilities', 'special assistance', 'assistance', 'oku', 'kerusi roda', 'autism', 'autistic', 'adhd', 'hidden disability', 'butterfly effect', 'elderly', 'warga emas', 'blind', 'deaf', 'cacat', 'bantuan khas']],
  // B-08: direct-answer intents. Weights beat the general topics they overlap with.
  ['fast-track', 9, ['fast track', 'fasttrack', 'laluan pantas', 'priority lane', 'express lane', 'express immigration', 'express security']],
  ['duty-free', 8, ['duty free', 'dutyfree', 'bebas cukai', 'eraman', 'tax free']],
  ['immigration', 6, ['autogate', 'autogates', 'auto gate', 'auto gates', 'immigration', 'imigresen', 'passport control', 'kawalan pasport', 'kaunter imigresen']],
  ['arrival-time', 7, ['how early', 'what time should i arrive', 'what time should i be', 'when should i arrive', 'when should i get to the airport', 'how long before', 'how many hours before', 'perlu sampai', 'berapa awal', 'bila perlu sampai', 'pukul berapa perlu', 'berapa jam sebelum', 'awal mana']],
  ['layover', 4, ['layover', 'lay over', 'stopover', 'stop over', 'connection', 'connecting', 'spare time', 'kill time', 'to spare', 'things to do', 'singgah', 'persinggahan', 'menunggu', 'apa boleh buat', 'apa yang boleh saya buat']],
  ['transport', 2, ['get to', 'go to', 'travel to', 'get into', 'into town', 'into the city', 'city centre', 'train', 'trains', 'bus', 'buses', 'taxi', 'taxis', 'grab', 'e hailing', 'ehailing', 'ekspres', 'shuttle', 'fare', 'fares', 'transport', 'pergi ke', 'tambang', 'teksi', 'kereta api', 'pengangkutan', 'cheapest', 'termurah', 'murah', 'fastest', 'quickest', 'terpantas']],
  ['gate', 3, ['gate', 'gates', 'boarding gate', 'pintu', 'pintu berlepas', 'aerotrain', 'satellite', 'satelit', 'pier']],
  ['notices', 2, ['notice', 'notices', 'advisory', 'disruption', 'closure', 'closed', 'works', 'running', 'operating', 'beroperasi', 'notis', 'gangguan']],
  ['contact', 3, ['contact', 'phone number', 'call', 'email', 'speak to', 'talk to', 'human', 'customer service', 'complain', 'complaint', 'feedback', 'hubungi', 'telefon', 'nombor telefon', 'khidmat pelanggan', 'aduan', 'maklum balas']],
  ['flight-status', 1, ['status', 'on time', 'what time', 'when does', 'landed', 'departed', 'arrive', 'arrival', 'depart', 'departure', 'bila', 'pukul berapa', 'tepat masa']],
];

/** When scores tie, the earlier intent wins. */
const PRIORITY: readonly ConciergeIntent[] = [
  'fast-track',
  'service-status',
  'airline-terminal',
  'fare',
  'duty-free',
  'arrival-time',
  'immigration',
  'lounge',
  'flight-delay',
  'terminal-transfer',
  'check-in',
  'dining',
  'parking',
  'lost-property',
  'assistance',
  'layover',
  'transport',
  'facility',
  'gate',
  'flight-status',
  'contact',
  'notices',
  'greeting',
];

const GREETINGS = ['hi', 'hello', 'hey', 'helo', 'hai', 'salam', 'assalamualaikum', 'good morning', 'good afternoon', 'good evening', 'selamat pagi', 'selamat petang', 'selamat malam', 'thanks', 'thank you', 'terima kasih'];

const NUMBER_WORDS: Readonly<Record<string, number>> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, lapan: 8, sembilan: 9, sepuluh: 10, sebelas: 11,
  a: 1, an: 1,
};

/** Words that look like two-letter airline codes but are ordinary words. */
const NOT_AIRLINES = new Set(['in', 'at', 'on', 'to', 'is', 'it', 'my', 'me', 'by', 'of', 'or', 'an', 'as', 'be', 'do', 'go', 'he', 'if', 'no', 'so', 'up', 'us', 'we', 'am', 'pm', 'ke', 'di', 'ia', 't1', 't2']);

function terminalMentions(text: string): TerminalId[] {
  const found: { at: number; id: TerminalId }[] = [];
  const add = (pattern: RegExp, id: TerminalId) => {
    for (const match of text.matchAll(pattern)) found.push({ at: match.index ?? 0, id });
  };
  add(/\b(?:terminal|t)\s?1\b|\bterminal satu\b/g, 'T1');
  add(/\b(?:terminal|t)\s?2\b|\bterminal dua\b|\bklia\s?2\b/g, 'T2');
  return found.sort((a, b) => a.at - b.at).map((item) => item.id);
}

function durationMinutes(text: string): number | undefined {
  if (/\b(?:half an hour|setengah jam)\b/.test(text)) return 30;
  if (/\bsejam\b/.test(text)) return 60;
  if (/\bsehari\b/.test(text)) return 1440;
  for (const match of text.matchAll(/\b(\d{1,3}(?: \d)?|[a-z]+)\s?(hours?|hrs?|h|jam|minutes?|mins?|minit|days?|hari|nights?)\b/g)) {
    const raw = match[1].replace(' ', '.');
    const amount = /^\d/.test(raw) ? Number.parseFloat(raw) : NUMBER_WORDS[raw];
    if (amount === undefined || !Number.isFinite(amount) || amount <= 0) continue;
    const unit = match[2];
    if (/^(h|hr|hrs|hour|hours|jam)$/.test(unit)) return Math.round(amount * 60);
    if (/^(min|mins|minute|minutes|minit)$/.test(unit)) return Math.round(amount);
    return Math.round(amount * 1440);
  }
  return undefined;
}

/** Airline codes we can recognise in a question. */
function airlineCodes(knowledge: ConciergeKnowledge): Set<string> {
  return new Set([...knowledge.airlines.map((airline) => airline.code), ...Object.values(AIRLINE_ALIASES)]);
}

function flightDesignator(raw: string, knowledge: ConciergeKnowledge): ConciergeSlots['flight'] {
  const known = airlineCodes(knowledge);
  for (const match of raw.matchAll(/\b([A-Za-z]{3}|[A-Za-z]{2}|[A-Za-z]\d|\d[A-Za-z])\s?-?\s?(\d{1,4})\b/g)) {
    const code = match[1];
    const lower = code.toLowerCase();
    const before = raw.slice(0, match.index ?? 0).toLowerCase();
    if (/(?:gate|pintu|terminal|level|aras|row|counter)\s*$/.test(before)) continue;
    let airline: string | undefined;
    if (code.length === 3) airline = AIRLINE_ALIASES[lower];
    else if (/\d/.test(code)) airline = known.has(code.toUpperCase()) ? code.toUpperCase() : undefined;
    else if (!NOT_AIRLINES.has(lower) && (known.has(code.toUpperCase()) || code === code.toUpperCase())) airline = code.toUpperCase();
    if (airline) return { airline, number: String(Number.parseInt(match[2], 10)) };
  }
  return undefined;
}

function matchAirport(text: string, raw: string, knowledge: ConciergeKnowledge, intent: ConciergeIntent | undefined): string | undefined {
  let best: { slug: string; length: number } | undefined;
  for (const airport of knowledge.airports) {
    for (const alias of airport.aliases) {
      if (!hasPhrase(text, alias)) continue;
      // "my flight to Kuching" names the other end of a flight, not the airport the passenger is at.
      if (intent && ['flight-delay', 'flight-status', 'check-in'].includes(intent) && (hasPhrase(text, `to ${alias}`) || hasPhrase(text, `ke ${alias}`))) continue;
      if (!best || alias.length > best.length) best = { slug: airport.slug, length: alias.length };
    }
  }
  if (best) return best.slug;
  // Upper-case IATA codes typed as such ("PEN", "BKI"); lower-case "pen" is just a word.
  for (const match of raw.matchAll(/\b([A-Z]{3})\b/g)) {
    const airport = knowledge.airports.find((item) => item.code === match[1]);
    if (airport) return airport.slug;
  }
  return undefined;
}

/** Normalised destination keys from transport options: "KL Sentral (fare until …)" gives "kl sentral". */
export function destinationKeys(knowledge: ConciergeKnowledge, airport?: string): { key: string; airport: string }[] {
  const keys = new Map<string, string>();
  for (const option of knowledge.transport) {
    if (airport && option.airport !== airport) continue;
    if (option.mode === 'inter-terminal') continue;
    for (const destination of option.destinations) {
      for (const name of [destination.name.en, destination.name.ms ?? '']) {
        const parts = name.split(/[(),&]| and | dan | via /i).map((part) => normalise(part)).filter((part) => part.length >= 3);
        for (const part of parts) {
          if (/^(fare|tambang|terminal|between|antara)\b/.test(part)) continue;
          if (!keys.has(part)) keys.set(part, option.airport);
        }
      }
    }
  }
  return [...keys].map(([key, slug]) => ({ key, airport: slug }));
}

function categoryOf(text: string): FacilityCategory | undefined {
  for (const [category, phrases] of CATEGORY_PHRASES) {
    if (phrases.some((item) => hasPhrase(text, item))) return category;
  }
  return undefined;
}

function airlineNamed(text: string, raw: string, knowledge: ConciergeKnowledge): string | undefined {
  for (const airline of knowledge.airlines) {
    if (hasPhrase(text, normalise(airline.name))) return airline.code;
  }
  for (const match of raw.matchAll(/\b([A-Z][A-Z0-9])\b/g)) {
    const code = match[1];
    if (['T1', 'T2'].includes(code) || hasPhrase(text, `${code.toLowerCase()} sentral`)) continue;
    if (knowledge.airlines.some((airline) => airline.code === code)) return code;
  }
  return undefined;
}

/** The airline named in "which terminal does <airline> use/fly from" as typed, at most four words. */
function airlineAsTyped(raw: string): string | undefined {
  const match =
    /\b(?:does|do|is|for)\s+((?:[A-Z][\w&-]*\s?){1,4}?)\s*(?:use|fly|flies|leave|depart|operate|go|at|in|from|\?|$)/.exec(raw) ??
    /\b(?:untuk|bagi)\s+((?:[A-Z][\w&-]*\s?){1,4})/.exec(raw);
  const name = match?.[1]?.trim();
  return name && !/^(?:KLIA|Terminal|T1|T2)$/i.test(name) ? name : undefined;
}

/**
 * Detect the intent and slots of a question.
 *
 * @example understand('What is the cheapest way to get to KL Sentral?', knowledge)
 *   // { intent: 'transport', slots: { destination: 'kl sentral', priority: 'price', … } }
 */
export function understand(question: string, knowledge: ConciergeKnowledge, context: ConciergeContext = {}): Understanding {
  const text = normalise(question);
  const raw = question;

  const scores = new Map<ConciergeIntent, number>();
  const bump = (intent: ConciergeIntent, amount: number) => scores.set(intent, (scores.get(intent) ?? 0) + amount);
  for (const [intent, weight, phrases] of RULES) {
    const hits = phrases.filter((item) => hasPhrase(text, item)).length;
    if (hits > 0) bump(intent, weight + Math.min(hits - 1, 2));
  }

  // "Is the Aerotrain running?", "Adakah tren antara terminal beroperasi?" (B-08).
  const serviceNamed = ['aerotrain', 'inter terminal train', 'inter terminal shuttle', 'shuttle', 'klia transit', 'klia ekspres', 'ekspres', 'erl', 'train', 'tren', 'kereta api'].some((item) => hasPhrase(text, item));
  const statusAsked = ['running', 'operating', 'working', 'open now', 'closed', 'suspended', 'disrupted', 'status', 'beroperasi', 'berjalan', 'ditutup', 'tergendala'].some((item) => hasPhrase(text, item));
  if (serviceNamed && statusAsked) bump('service-status', 8);
  // A fare for a named way of travelling: "How much is the KLIA Ekspres?", "Berapa tambang KLIA Ekspres?".
  const fareAsked = ['how much', 'fare', 'fares', 'price', 'prices', 'cost', 'costs', 'ticket', 'tickets', 'berapa', 'tambang', 'harga', 'kos', 'tiket'].some((item) => hasPhrase(text, item));
  const modeNamed = ['ekspres', 'express', 'klia transit', 'train', 'tren', 'bus', 'bas', 'coach', 'taxi', 'teksi', 'grab', 'e hailing', 'ehailing', 'shuttle'].some((item) => hasPhrase(text, item));
  if (fareAsked && modeNamed && !['park', 'parking', 'parkir', 'letak kereta'].some((item) => hasPhrase(text, item))) bump('fare', 7);
  // "Which terminal does Emirates use?", "Terminal mana untuk AirAsia?".
  const whichTerminal = /\b(?:which|what) terminal\b|\bterminal (?:mana|apa|yang mana)\b|\bterminal (?:for|does)\b/.test(text) && !/\b(?:between|change|transfer|antara|tukar)\b/.test(text);
  if (whichTerminal) bump('airline-terminal', 8);

  const terminals = terminalMentions(text);
  const flight = flightDesignator(raw, knowledge);
  let category = categoryOf(text);
  const gateMatch =
    /\b(?:gate|pintu)\s([a-z])\s?(\d{1,3})?\b/.exec(text) ?? /\b([a-h])\s?(\d{1,3})\s(?:gate|gates)\b/.exec(text) ?? /\b([b-h])\s(?:gate|gates)\b/.exec(text);
  const gate = gateMatch ? `${gateMatch[1].toUpperCase()}${gateMatch[2] ?? ''}` : undefined;

  // "KLIA Transit" is a train, not a layover.
  if (hasPhrase(text, 'transit') && !hasPhrase(text, 'klia transit')) bump('layover', 3);
  if (new Set(terminals).size >= 2) bump('terminal-transfer', 5);
  if (flight) bump('flight-status', 3);
  if (category === 'lost-property') {
    bump('lost-property', 4);
    category = undefined;
  } else if (category === 'lounge') {
    // Lounges get their own answer: ranked by the gate (B-08, ux-frequent-11).
    bump('lounge', 5);
  } else if (category) {
    bump('facility', 4);
  }
  const duration = durationMinutes(text);
  if (duration !== undefined && (scores.get('layover') ?? 0) > 0) bump('layover', 2);
  const words = text.split(' ').filter(Boolean);
  if (words.length <= 4 && GREETINGS.some((greeting) => text === greeting || text.startsWith(`${greeting} `))) bump('greeting', 5);

  let intent: ConciergeIntent = 'unknown';
  let score = 0;
  for (const candidate of PRIORITY) {
    const value = scores.get(candidate) ?? 0;
    if (value > score) {
      intent = candidate;
      score = value;
    }
  }

  // Airport after intent: a flight's destination is not the airport.
  let airport = matchAirport(text, raw, knowledge, intent);
  const destinations = destinationKeys(knowledge, airport);
  const destinationHit = destinations.filter((item) => hasPhrase(text, item.key)).sort((a, b) => b.key.length - a.key.length)[0];
  if (destinationHit) {
    if (intent === 'unknown' || intent === 'transport' || score < 4) {
      intent = 'transport';
      score = Math.max(score, 6);
    }
    airport ??= destinationHit.airport;
  }

  // A follow-up such as "and at Terminal 2?" keeps the previous topic.
  let followUp = false;
  if ((intent === 'unknown' || score < 2) && context.intent && context.intent !== 'greeting' && context.intent !== 'unknown') {
    if (airport || terminals.length > 0 || duration !== undefined || category) {
      intent = category ? 'facility' : context.intent;
      score = 1;
      if (intent === 'facility') category ??= context.category;
      followUp = true;
    }
  }

  let priority: ConciergeSlots['priority'];
  if (['cheapest', 'cheap', 'cheaper', 'budget', 'lowest fare', 'termurah', 'murah', 'jimat'].some((item) => hasPhrase(text, item))) priority = 'price';
  else if (['fastest', 'quickest', 'quick', 'fast', 'terpantas', 'paling cepat'].some((item) => hasPhrase(text, item))) priority = 'time';
  else if (['step free', 'wheelchair', 'accessible', 'mesra oku'].some((item) => hasPhrase(text, item))) priority = 'accessibility';

  const slots: ConciergeSlots = {
    airport,
    terminals,
    flight,
    destination: destinationHit?.key ?? (followUp && intent === 'transport' ? context.destination : undefined),
    category,
    durationMinutes: duration,
    gate,
    priority,
    airline: airlineNamed(text, raw, knowledge) ?? flight?.airline,
    nearest: ['nearest', 'closest', 'near me', 'nearby', 'terdekat', 'berhampiran', 'paling dekat'].some((item) => hasPhrase(text, item)),
    myFlight: ['my flight', 'our flight', 'penerbangan saya', 'penerbangan kami'].some((item) => hasPhrase(text, item)),
    leave: ['leave the airport', 'go into the city', 'go into town', 'go out', 'visit the city', 'see the city', 'keluar'].some((item) => hasPhrase(text, item)),
    baggage: ['bag', 'bags', 'baggage', 'luggage', 'suitcase', 'bagasi', 'beg'].some((item) => hasPhrase(text, item)),
    accessible: ['accessible', 'step free', 'wheelchair', 'wheel chair', 'elderly', 'older', 'warga emas', 'tua', 'mesra oku', 'oku', 'kerusi roda', 'disabled', 'reduced mobility'].some((item) => hasPhrase(text, item)),
    airlineName: whichTerminal ? airlineAsTyped(raw) : undefined,
  };
  return { intent, score, slots };
}
