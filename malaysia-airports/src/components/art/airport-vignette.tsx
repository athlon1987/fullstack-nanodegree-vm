import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/*
 * One family of line drawings: 320 x 180, a 1px stroke in the current text colour, a faint
 * second weight for texture, and gold for one detail per drawing. Shapes that overlap are
 * filled with the ground colour, so every drawing works on any surface and in both themes.
 */

const GROUNDS = {
  sunken: { box: 'bg-surface-sunken', fill: 'fill-surface-sunken' },
  surface: { box: 'bg-surface', fill: 'fill-surface' },
  page: { box: 'bg-page', fill: 'fill-page' },
  subtle: { box: 'bg-page-subtle', fill: 'fill-page-subtle' },
} as const;

type Ground = keyof typeof GROUNDS;

const FAINT = 'stroke-current [stroke-opacity:0.36]';
const GOLD = 'stroke-gold [stroke-width:1.2]';
const GOLD_FILL = 'fill-gold stroke-none';

interface DrawingProps {
  fill: string;
  clipId: string;
}

/** KLIA Terminal 1: the canopy columns of the main terminal, like trees holding up the roof. */
function KliaT1() {
  const columns = [40, 120, 200, 280];
  const spread = [-38.4, -32, -25.6, -19.2, -12.8, -6.4, 0, 6.4, 12.8, 19.2, 25.6, 32, 38.4];
  const top = [34, 35.1, 37.6, 41.6, 46.9, 53.8, 62, 53.8, 46.9, 41.6, 37.6, 35.1, 34];
  const ribs = columns
    .flatMap((x) => spread.map((dx, i) => `M${(x + dx * 0.14).toFixed(1)} 110Q${(x + dx * 0.42).toFixed(1)} ${(88 - Math.abs(dx) * 0.17).toFixed(1)} ${(x + dx).toFixed(1)} ${top[i]}`))
    .join('');
  const bases = columns.map((x) => `M${x - 6} 110L${x - 3} 158M${x + 6} 110L${x + 3} 158M${x - 7} 110h14M${x - 5} 158h10`).join('');
  return (
    <>
      <path className={FAINT} d="M-40 62Q0 34 40 62M40 62Q80 34 120 62M120 62Q160 34 200 62M200 62Q240 34 280 62M280 62Q320 34 360 62" />
      <path d={ribs} />
      <path d={bases} />
      <path className={GOLD} d="M-40 62Q0 6 40 62M40 62Q80 6 120 62M120 62Q160 6 200 62M200 62Q240 6 280 62M280 62Q320 6 360 62" />
      <path className={GOLD_FILL} d="M0 20l3.5 5-3.5 5-3.5-5zM80 20l3.5 5-3.5 5-3.5-5zM160 20l3.5 5-3.5 5-3.5-5zM240 20l3.5 5-3.5 5-3.5-5zM320 20l3.5 5-3.5 5-3.5-5z" />
      <path d="M0 158H320" />
      <path className={FAINT} d="M14 166h52M92 166h60M176 166h44M244 166h62" />
    </>
  );
}

/** KLIA Terminal 2: the long folded roof of the terminal, the control tower and an aircraft on stand. */
function KliaT2() {
  return (
    <>
      <path className={FAINT} d="M92 30h46M114 38h30M172 22h40M192 30h22M22 34h30" />
      <path d="M285 62V30M291 62V30M282 21v-3h12v3M288 18V8" />
      <path className={GOLD} d="M280 30h16l2.5-9h-21z" />
      <path className={FAINT} d="M8 72V150M312 72V150M16 72V150M304 72V150M24 72V150M296 72V150M32 72V150M288 72V150M40 72V150M280 72V150M48 72V150M272 72V150M56 72V150M264 72V150" />
      <path d="M0 62H64V150M320 62H256V150M0 72H64M320 72H256" />
      <path d="M64 94L72 78L80 94M80 94L88 78L96 94M96 94L104 78L112 94M112 94L120 78L128 94M128 94L136 78L144 94M144 94L152 78L160 94M160 94L168 78L176 94M176 94L184 78L192 94M192 94L200 78L208 94M208 94L216 78L224 94M224 94L232 78L240 94M240 94L248 78L256 94" />
      <path className={GOLD} d="M64 78H256M64 94H256" />
      <path d="M104 94V150M112 94V150M208 94V150M216 94V150" />
      <path d="M120 138c-6-.5-10-2.5-12-5 3-3.5 9-5 16-5h62l12-17h7l-5 17c5 .5 8 2 8 4.5s-4 5-10 5.5Z" />
      <path className={FAINT} d="M150 138l13 8h8l-6-8M126 132h52" />
      <path d="M0 150H320" />
      <path className={FAINT} d="M20 160h36M84 160h48M160 160h36M224 160h60" />
    </>
  );
}

/** Penang: the cable stays of the bridge across the strait, hills behind, water below. */
function Penang() {
  const stays = [112, 208]
    .flatMap((x) => Array.from({ length: 12 }, (_, i) => `M${x} 50L${x + (i % 2 === 0 ? -1 : 1) * (8 + Math.floor(i / 2) * 8)} 112`))
    .join('');
  const wave = (x: number, y: number) => `M${x} ${y}${'q6-5 12 0t12 0'.repeat(14)}`;
  return (
    <>
      <path className={FAINT} d="M0 104Q36 66 78 88T160 78T250 92T320 80" />
      <path className={GOLD} d={stays} />
      <path d="M107 150V46h10V150M107 58h10M107 98h10M203 150V46h10V150M203 58h10M203 98h10" />
      <path d="M16 117V150M40 117V150M280 117V150M304 117V150" />
      <path d="M0 112H320M0 117H320" />
      <path className={FAINT} d={`${wave(-12, 152)}${wave(-5, 161)}${wave(2, 170)}`} />
    </>
  );
}

/** Kota Kinabalu: the ridgeline of Mount Kinabalu with the sun beside it. */
function KotaKinabalu({ fill, clipId }: DrawingProps) {
  const ridge = 'M0 134L34 118L66 96L86 70L96 76L106 52L116 64L126 42L136 58L146 46L156 66L168 56L182 78L206 92L244 112L284 124L320 130';
  const hatch = Array.from({ length: 49 }, (_, i) => `M${-60 + i * 8} 180L${-14 + i * 8} 30`).join('');
  return (
    <>
      <clipPath id={clipId}>
        <path d={`${ridge}V180H0Z`} />
      </clipPath>
      <g clipPath={`url(#${clipId})`} className={FAINT}>
        <path d={hatch} />
      </g>
      <path d={ridge} />
      <circle className={GOLD} cx="246" cy="52" r="15" />
      <path className={fill} d="M0 150Q56 128 120 144T240 140T320 146V180H0Z" />
      <path className={FAINT} d="M10 158h70M128 158h96M252 158h56M32 166h60M142 166h78M246 166h48M54 174h50M156 174h60M240 174h40" />
    </>
  );
}

/** Kuching: rainforest canopy along the Sarawak River. */
function Kuching({ fill }: DrawingProps) {
  const tree = (cx: number, cy: number, r: number) => {
    const rays = [68, 45, 22.5, 0, -22.5, -45]
      .map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        return `M${cx} ${cy}L${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
      })
      .join('');
    return { crown: `M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}Z`, rays: `${rays}M${cx} ${cy}V128` };
  };
  const back = [tree(40, 84, 22), tree(92, 76, 26), tree(150, 82, 22), tree(204, 74, 26), tree(258, 82, 22), tree(306, 78, 20)];
  const front = [tree(16, 104, 24), tree(66, 100, 28), tree(122, 106, 24), tree(176, 98, 30), tree(232, 106, 24), tree(284, 100, 28)];
  return (
    <>
      {back.map((t, i) => (
        <g key={`b${i}`}>
          <path className={cn(fill, '[stroke-opacity:0.45]')} d={t.crown} />
          <path className={FAINT} d={t.rays} />
        </g>
      ))}
      {front.map((t, i) => (
        <g key={`f${i}`}>
          <path className={fill} d={t.crown} />
          <path d={t.rays} />
        </g>
      ))}
      <path d="M0 128H320" />
      <path className={GOLD} d="M-10 146C50 128 110 168 180 146S290 130 330 150M-10 154C50 136 110 176 180 154S290 138 330 158M-10 162C50 144 110 184 180 162S290 146 330 166" />
    </>
  );
}

/** Langkawi: the islands of the archipelago and the sun on the water. */
function Langkawi({ clipId }: DrawingProps) {
  const islands = 'M14 116Q28 82 52 92Q68 60 94 80Q110 70 124 116ZM150 116Q164 92 184 98Q200 76 216 116ZM268 116Q280 98 294 102Q304 96 312 116Z';
  const bands = Array.from({ length: 11 }, (_, i) => `M0 ${64 + i * 5}H320`).join('');
  return (
    <>
      <clipPath id={clipId}>
        <path d={islands} />
      </clipPath>
      <g clipPath={`url(#${clipId})`} className={FAINT}>
        <path d={bands} />
      </g>
      <path d={islands} />
      <path className={GOLD} d="M221 116A18 18 0 0 1 257 116M226 126h26M231 136h16M235 146h8" />
      <path d="M0 116H320" />
      <path className={FAINT} d="M0 126h22M38 126h30M84 126h46M146 126h48M294 126h46M37 136h42M103 136h48M175 136h30M277 136h42M28 146h46M92 146h50M160 146h28M268 146h46M19 156h50M95 156h36M157 156h38M289 156h50M10 166h24M54 166h38M112 166h36M168 166h32M264 166h38" />
    </>
  );
}

/** Subang: a turboprop seen head-on, for the city airport's regional flights. */
function Subang({ fill }: DrawingProps) {
  return (
    <>
      <path d="M20 74H300M36 80H284" />
      <circle className={fill} cx="160" cy="100" r="25" />
      <path d="M145 92q15-9 30 0M160 86v6M160 75V32M130 32h60M150 124v10M170 124v10" />
      <circle cx="150" cy="138" r="3.5" />
      <circle cx="170" cy="138" r="3.5" />
      <path d="M96.9 85Q108.6 92.6 120.4 90Q110.6 82.9 96.9 85M93.5 88.8Q92.8 102.7 101 111.6Q102.3 99.6 93.5 88.8M88.7 87.7Q76.2 94 72.6 105.6Q83.7 100.7 88.7 87.7M87.1 83Q75.4 75.4 63.6 78Q73.4 85.1 87.1 83M90.5 79.2Q91.2 65.3 83 56.4Q81.7 68.4 90.5 79.2M95.3 80.3Q107.8 74 111.4 62.4Q100.3 67.3 95.3 80.3M232.9 85Q244.6 92.6 256.4 90Q246.6 82.9 232.9 85M229.5 88.8Q228.8 102.7 237 111.6Q238.3 99.6 229.5 88.8M224.7 87.7Q212.2 94 208.6 105.6Q219.7 100.7 224.7 87.7M223.1 83Q211.4 75.4 199.6 78Q209.4 85.1 223.1 83M226.5 79.2Q227.2 65.3 219 56.4Q217.7 68.4 226.5 79.2M231.3 80.3Q243.8 74 247.4 62.4Q236.3 67.3 231.3 80.3" />
      <circle className={GOLD} cx="92" cy="84" r="33" strokeDasharray="2 5" />
      <circle className={fill} cx="92" cy="84" r="5" />
      <circle className={GOLD} cx="228" cy="84" r="33" strokeDasharray="2 5" />
      <circle className={fill} cx="228" cy="84" r="5" />
      <path d="M0 142H140M180 142H320" />
      <path className={FAINT} d="M24 152h40M96 152h30M194 152h30M256 152h40" />
    </>
  );
}

/** Any other airport: a control tower, a low terminal under one arched roof, hills and the runway. */
function Generic() {
  return (
    <>
      <path className={FAINT} d="M0 100Q52 74 104 92T212 84T320 94" />
      <circle className={GOLD} cx="262" cy="46" r="14" />
      <path d="M54 150V78M66 150V78M46 78h28l5-16H41z" />
      <path className={GOLD} d="M41 62h38M60 62V44" />
      <path className={FAINT} d="M54 96h12M54 114h12M54 132h12" />
      <path d="M96 124Q200 88 304 124M104 124H296M104 124V150M296 124V150" />
      <path className={FAINT} d="M120 150V124M140 150V124M160 150V124M180 150V124M200 150V124M220 150V124M240 150V124M260 150V124M280 150V124" />
      <path className={FAINT} d="M120 124V117.4M140 124V112.5M160 124V108.9M180 124V106.7M200 124V106M220 124V106.7M240 124V108.9M260 124V112.5M280 124V117.4" />
      <path d="M0 150H320" />
      <path className={FAINT} d="M16 160h40M84 160h52M164 160h40M232 160h60M40 169h36M112 169h44M196 169h36" />
    </>
  );
}

type Drawing = (props: DrawingProps) => ReactNode;

const DRAWINGS: Record<string, Drawing> = {
  'kul-t1': KliaT1,
  'kul-t2': KliaT2,
  kul: KliaT1,
  pen: Penang,
  bki: KotaKinabalu,
  kch: Kuching,
  lgk: Langkawi,
  szb: Subang,
};

/** Airports and terminals that have their own drawing. Everything else gets the generic one. */
export const VIGNETTE_KEYS = ['kul-t1', 'kul-t2', 'pen', 'bki', 'kch', 'lgk', 'szb', 'generic'] as const;

export interface AirportVignetteProps {
  /** IATA code in any case (`kul`, `PEN`), or `generic`. */
  code: string;
  /** For KLIA: `T1` or `T2`. Ignored elsewhere. */
  terminal?: string;
  /** The surface the drawing sits on; overlapping shapes are filled with it. */
  ground?: Ground;
  /** Accessible name. Omit for decoration (the default: the airport name is always in text nearby). */
  label?: string;
  className?: string;
}

/**
 * A line-drawn vignette for an airport, chosen by code and terminal. Drawn in `currentColor`
 * with one gold detail, so the same drawing serves the light and dark themes.
 *
 * @example <AirportVignette code="kul" terminal="T1" className="text-ink" />
 */
export function AirportVignette({ code, terminal, ground = 'sunken', label, className }: AirportVignetteProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const slug = code.toLowerCase();
  const key = slug === 'kul' && terminal ? `kul-${terminal.toLowerCase()}` : slug;
  const Art = DRAWINGS[key] ?? Generic;
  const g = GROUNDS[ground];
  return (
    <svg
      viewBox="0 0 320 180"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('block h-auto w-full text-ink', g.box, className)}
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <Art fill={g.fill} clipId={`vg${id}`} />
    </svg>
  );
}
