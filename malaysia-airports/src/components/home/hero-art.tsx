import { cn } from '@/lib/cn';

/*
 * "KLIA at dusk": the home hero's art direction while the photo library is empty (see
 * `docs/design/photography.md`). It is an illustration, not a photograph, and never pretends to
 * be one: a midnight sky, the main terminal's canopy of roof shells on its "forest" of columns
 * with the hall glowing warm beneath, a lit apron and the fine arc of a departure. Decorative only
 * (`aria-hidden`), about 5 KB of markup, no request, no script, and nothing in it depends on the
 * clock or on random values: the stars come from a fixed seed, so the server and the browser
 * always draw the same picture.
 *
 * As soon as `HOME_HERO_IMAGES` lists a photograph, `HeroBackdrop` shows that instead.
 */

const W = 1600;
const H = 1000;
/** The apron line: everything below is the lit, reflective ground. */
const HORIZON = 742;

/** A small deterministic sequence (a linear congruential generator with a fixed seed). */
function sequence(count: number, seed: number): number[] {
  const values: number[] = [];
  let state = seed;
  for (let index = 0; index < count; index += 1) {
    state = (state * 1103515245 + 12345) % 2147483648;
    values.push(state / 2147483648);
  }
  return values;
}

const STARS = (() => {
  const values = sequence(150, 20261122);
  const stars: { x: number; y: number; r: number; o: number }[] = [];
  for (let index = 0; index < values.length; index += 3) {
    stars.push({ x: Math.round(values[index] * W), y: Math.round(values[index + 1] ** 1.6 * 470), r: 0.6 + values[index + 2] * 1.1, o: 0.25 + values[index + 2] * 0.6 });
  }
  // Redesign round one (critique item 14): no stars behind the header and navigation (the top
  // band) or behind the headline column on the left, where they sat on letters like stray dots.
  return stars.filter((star) => star.y > 150 && star.x > W * 0.6);
})();

/** Column positions of the canopy: one module every 200 units, spanning the whole width. */
const COLUMNS = [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600];
const ROOF_LOW = 520; // where two shells meet, over a column
const ROOF_HIGH = 462; // the crown of a shell, between columns
const CAPITAL = 598; // where a column opens into its ribs

const roofTop = `M-20 ${ROOF_LOW}${COLUMNS.map((x) => ` Q${x + 100} ${ROOF_HIGH - 58} ${x + 200} ${ROOF_LOW}`).join('')}`;
const roofFill = `${roofTop} L1620 ${ROOF_LOW + 26}${[...COLUMNS].reverse().map((x) => ` Q${x + 100} ${ROOF_LOW - 14} ${x} ${ROOF_LOW + 26}`).join('')} Z`;

/** The ribs fan out from each column's capital to the underside of the two shells it carries. */
const RIBS = COLUMNS.map((x) =>
  [-0.92, -0.74, -0.56, -0.38, -0.2, 0, 0.2, 0.38, 0.56, 0.74, 0.92]
    .map((t) => {
      const ex = x + t * 100;
      const ey = ROOF_LOW + 26 - (1 - Math.abs(t)) * 4 - Math.abs(t) * 20;
      return `M${x + t * 6} ${CAPITAL}Q${x + t * 40} ${CAPITAL - 40} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    })
    .join(''),
).join('');

const COLUMN_SHAFTS = COLUMNS.map((x) => `M${x - 9} ${HORIZON}L${x - 4} ${CAPITAL}H${x + 4}L${x + 9} ${HORIZON}Z`).join('');

/** Facade mullions under the canopy. */
const MULLIONS = Array.from({ length: 41 }, (_, index) => `M${index * 40} ${ROOF_LOW + 30}V${HORIZON}`).join('');

/** Apron lights in perspective, converging on a point near the centre of the horizon. */
const LIGHTS = (() => {
  const vanishing = { x: 880, y: HORIZON };
  const lines = [-1500, -900, -420, 360, 980, 1700];
  const dots: { x: number; y: number; r: number }[] = [];
  for (const end of lines) {
    // Only the lights near the horizon: the large ones at the bottom edge read as a row of
    // evenly spaced dots, like a rendering error (critique item 14).
    for (let step = 1; step <= 6; step += 1) {
      const t = (step / 9) ** 1.8;
      dots.push({ x: Math.round(vanishing.x + (end - vanishing.x) * t), y: Math.round(vanishing.y + (H + 40 - vanishing.y) * t), r: 0.8 + t * 3.2 });
    }
  }
  return dots;
})();

export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
      // Forced colours (Windows contrast themes): the illustration steps aside for the system colours.
      className={cn('block size-full forced-colors:hidden', className)}
    >
      <defs>
        <linearGradient id="ha-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03061a" />
          <stop offset="0.38" stopColor="#0a1338" />
          <stop offset="0.6" stopColor="#1a2458" />
          <stop offset="0.72" stopColor="#3b3157" />
          <stop offset="0.745" stopColor="#6b4e45" />
          <stop offset="0.75" stopColor="#0a0f26" />
          <stop offset="1" stopColor="#04060f" />
        </linearGradient>
        <radialGradient id="ha-glow" cx="0.55" cy="0.7" r="0.55" gradientTransform="matrix(1 0 0 0.45 0 0.39)">
          <stop offset="0" stopColor="#f3c96e" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#c49a50" stopOpacity="0.16" />
          <stop offset="1" stopColor="#c49a50" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ha-lift" cx="0.85" cy="0" r="0.7">
          <stop offset="0" stopColor="#2a3b8f" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2a3b8f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ha-hall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3c96e" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#c98f45" stopOpacity="0.3" />
          <stop offset="1" stopColor="#5e3a1f" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="ha-reflect" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8b864" stopOpacity="0.34" />
          <stop offset="0.5" stopColor="#c49a50" stopOpacity="0.07" />
          <stop offset="1" stopColor="#c49a50" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ha-trail" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#e8cb8c" stopOpacity="0" />
          <stop offset="1" stopColor="#e8cb8c" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill="url(#ha-sky)" />
      <rect width={W} height={H} fill="url(#ha-lift)" />
      <g fill="#ffffff">
        {STARS.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.r.toFixed(2)} opacity={star.o.toFixed(2)} />
        ))}
      </g>

      {/* A single fine gold arc where an aircraft climbed out (the clip-art plane is gone: critique item 14). */}
      <path d="M760 600 C 980 500 1180 380 1460 250" fill="none" stroke="url(#ha-trail)" strokeWidth="1.2" />

      <rect width={W} height={H} fill="url(#ha-glow)" />

      {/* The hall under the canopy, lit warm, with its glass mullions. */}
      <rect x="-20" y={ROOF_LOW + 20} width={W + 40} height={HORIZON - ROOF_LOW - 20} fill="url(#ha-hall)" />
      <path d={MULLIONS} stroke="#0a1030" strokeOpacity="0.28" strokeWidth="2" />
      <path d={`M-20 ${CAPITAL + 46}H${W + 20}`} stroke="#0a1030" strokeOpacity="0.4" strokeWidth="3" />

      {/* Columns and their fans of ribs: the "forest" that holds up the roof. */}
      <path d={RIBS} fill="none" stroke="#1a1430" strokeOpacity="0.55" strokeWidth="2.2" />
      <path d={COLUMN_SHAFTS} fill="#140f26" fillOpacity="0.85" />

      {/* The roof shells in silhouette, with a gold rim catching the last light. */}
      <path d={roofFill} fill="#070b22" />
      <path d={roofTop} fill="none" stroke="#e8cb8c" strokeOpacity="0.75" strokeWidth="2" />

      {/* The apron: a reflection of the hall, taxiway lines and lights in perspective. */}
      <rect x="0" y={HORIZON} width={W} height={H - HORIZON} fill="url(#ha-reflect)" />
      <path d={`M880 ${HORIZON}L-300 ${H + 40}M880 ${HORIZON}L2060 ${H + 40}M880 ${HORIZON}L700 ${H + 40}`} stroke="#e8cb8c" strokeOpacity="0.18" strokeWidth="1.5" />
      <g fill="#f6d68f">
        {LIGHTS.map((dot, index) => (
          <circle key={index} cx={dot.x} cy={dot.y} r={dot.r.toFixed(2)} opacity={0.75} />
        ))}
      </g>
    </svg>
  );
}
