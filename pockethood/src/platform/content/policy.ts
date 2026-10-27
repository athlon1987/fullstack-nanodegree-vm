// Content policy: POCKETHOOD is a peaceful, welcoming world. Authored text, partner modules
// and player-entered names stay clear of religious and political topics, hostility, products
// that don't belong in an all-ages game, and commercial claims that only verified records may
// make. The screen is the same in every language and never lists nationalities, ethnicities
// or identities: those are part of everyday life here, not topics to filter. Human review
// (CONTENT_POLICY.md) is still required: a word list is a safety net, not a moderator.

export type PolicyTopic = 'religion' | 'politics' | 'hostility' | 'restricted_product' | 'claim';

/** Terms are matched as whole words, case- and accent-insensitive; a trailing * matches a prefix. */
const TERMS: Record<PolicyTopic, string[]> = {
  religion: [
    'religio*', 'agama', 'keagamaan', 'pray*', 'worship*', 'mosque*', 'masjid*', 'surau*', 'church*', 'gereja*', 'temple*', 'kuil*', 'tokong*',
    'cathedral*', 'chapel*', 'synagogue*', 'shrine*', 'god', 'gods', 'goddess*', 'allah', 'tuhan', 'insyallah', 'insya allah',
    'inshallah', 'insha allah', 'masyaallah', 'masya allah', 'mashallah', 'alhamdulillah', 'assalamualaikum', 'waalaikumsalam',
    'salam alaikum', 'bismillah', 'amen', 'bible*', 'alkitab', 'quran', 'al quran', 'koran', 'scripture*', 'sermon*', 'khutbah',
    'priest*', 'imam', 'monk', 'monks', 'pastor*', 'paderi', 'ustaz*', 'hari raya', 'aidilfitri', 'aidiladha', 'deepavali', 'diwali',
    'christmas', 'krismas', 'easter', 'thaipusam', 'wesak', 'vesak', 'ramadan', 'ramadhan', 'bulan puasa', 'zakat', 'wakaf',
    'waqf', 'sedekah', 'pahala', 'heaven*', 'syurga', 'hell', 'neraka', 'sinful', 'holy', 'suci', 'divine', 'spiritual*',
  ],
  politics: [
    'politic*', 'politik*', 'election*', 'pilihan raya', 'pilihanraya', 'vote', 'votes', 'voting', 'voter*', 'undi', 'mengundi',
    'pengundi', 'parliament*', 'parlimen', 'minister*', 'menteri', 'prime minister', 'perdana menteri', 'government*', 'kerajaan',
    'opposition', 'pembangkang', 'candidate*', 'calon', 'manifesto*', 'propaganda', 'protest*', 'bantahan', 'demonstrasi',
    'demonstration*', 'referendum', 'senator*', 'ideolog*', 'communis*', 'democrat*', 'republican*', 'party politics', 'parti politik', 'political party',
  ],
  hostility: [
    'hate', 'hates', 'hated', 'hatred', 'benci', 'stupid', 'bodoh', 'idiot*', 'kill*', 'bunuh*', 'war', 'wars', 'perang',
    'weapon*', 'senjata', 'gun', 'guns', 'pistol*', 'bomb*', 'bom', 'fight*', 'gaduh', 'bergaduh', 'blood*', 'darah',
  ],
  restricted_product: [
    'beer*', 'bir', 'wine*', 'whisk*', 'vodka', 'alcohol*', 'alkohol', 'arak', 'liquor*', 'cocktail*', 'gambl*', 'judi',
    'casino*', 'kasino', 'betting', 'lottery', 'loteri', 'cigar*', 'rokok', 'tobacco', 'tembakau', 'vape*', 'vaping',
  ],
  // Claims only a verified record may make (halal certificate, sponsor contract, brand licence).
  claim: ['halal', 'sponsored', 'ditaja', 'official partner', 'official brand partner', 'rakan kongsi rasmi'],
};

export const TOPIC_LABEL: Record<PolicyTopic, string> = {
  religion: 'religious topic',
  politics: 'political topic',
  hostility: 'hostile or violent language',
  restricted_product: 'product not allowed in an all-ages game',
  claim: 'claim that only a verified record can make',
};

/** Module content tags (what a module is about). Anything else is rejected. */
export const CONTENT_TAGS = [
  'food', 'drink', 'cafe', 'bakery', 'retail', 'vehicles', 'learning', 'nature', 'gardening', 'music', 'arts', 'crafts',
  'sport', 'community', 'pets', 'celebration', 'travel', 'family', 'technology', 'wellbeing_activity',
] as const;
/** Tags that name subjects POCKETHOOD never carries; listed so the rejection can say why. */
export const BLOCKED_TAGS = ['religion', 'politics', 'gambling', 'alcohol', 'tobacco', 'weapons', 'dating', 'campaign'] as const;

const fold = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const compiled = Object.fromEntries(
  (Object.entries(TERMS) as [PolicyTopic, string[]][]).map(([topic, terms]) => [
    topic,
    terms.map((t) => {
      const prefix = t.endsWith('*');
      const body = fold(t.replace(/\*$/, '')).replace(/ /g, ' +');
      return { term: t, re: new RegExp(`(^| )${body}${prefix ? '[a-z0-9]*' : ''}( |$)`) };
    }),
  ]),
) as Record<PolicyTopic, { term: string; re: RegExp }[]>;

export interface PolicyHit {
  topic: PolicyTopic;
  term: string;
}

/** Screen one string. `topics` defaults to every topic. */
export function screenText(s: string, topics: readonly PolicyTopic[] = Object.keys(TERMS) as PolicyTopic[]): PolicyHit | null {
  const f = fold(s);
  if (!f) return null;
  for (const topic of topics) for (const { term, re } of compiled[topic]) if (re.test(f)) return { topic, term };
  return null;
}

export interface PolicyIssue extends PolicyHit {
  path: string;
  text: string;
}

/** Keys whose values are identifiers or references, not prose. */
const NON_PROSE = new Set(['id', 'schemaVersion', 'version', 'country', 'locales', 'template', 'slot', 'prefab', 'archetype', 'url', 'sha256', 'path', 'icon', 'model']);

/**
 * Walk every string in a content document (all languages) and report policy hits.
 * `skip(path)` exempts subtrees, e.g. the verified halal record of a module.
 */
export function scanDocument(doc: unknown, skip: (path: string) => boolean = () => false, topics?: readonly PolicyTopic[]): PolicyIssue[] {
  const out: PolicyIssue[] = [];
  const walk = (v: unknown, path: string, key: string) => {
    if (skip(path)) return;
    if (typeof v === 'string') {
      if (NON_PROSE.has(key)) return;
      const hit = screenText(v, topics);
      if (hit) out.push({ ...hit, path, text: v });
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, key));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k, k);
  };
  walk(doc, '', '');
  return out;
}

export const describeIssue = (i: PolicyIssue) => `${i.path || '$'}: content policy — ${TOPIC_LABEL[i.topic]} (“${i.term.replace(/\*$/, '')}”)`;

/** Player-entered names (neighbourhood name, shared snapshots). */
export const isAcceptableName = (s: string) => !!s.trim() && screenText(s) === null;
