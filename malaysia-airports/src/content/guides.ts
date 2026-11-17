/**
 * "Plan your journey" guides: a small seed plus helpers.
 *
 * Content authors: add guides to `GUIDES` (or spread in arrays from new files under
 * `src/content/guides/`). Every step carries its own provenance tag; a step tagged `official`
 * must cite its own sources. Generic good-practice advice that is not from an authoritative
 * source is `estimated` or `suggestion` and cites `prototype-method`.
 */
import { lt, type Audience, type Guide } from './types';

/** The guide seed. */
export const GUIDES: Guide[] = [
  {
    slug: 'departing',
    title: lt('Departing: from your door to the gate', 'Berlepas: dari rumah ke pintu berlepas'),
    summary: lt(
      'What to do before you leave home and at the airport, in order.',
      'Perkara yang perlu dilakukan sebelum bertolak dan di lapangan terbang, mengikut turutan.',
    ),
    audience: ['departing', 'first-time'],
    sections: [
      {
        id: 'before-you-leave',
        title: lt('Before you leave home', 'Sebelum bertolak'),
        steps: [
          {
            id: 'check-terminal',
            title: lt('Check your terminal', 'Semak terminal anda'),
            body: lt(
              'Your booking confirmation names the airport and, at KLIA, the terminal. KLIA Terminal 1 and KLIA Terminal 2 are separate buildings, so check before you set off.',
              'Pengesahan tempahan anda menyatakan lapangan terbang dan, di KLIA, terminalnya. KLIA Terminal 1 dan KLIA Terminal 2 ialah bangunan berasingan, jadi semak sebelum bertolak.',
            ),
            provenance: 'official',
            sources: ['mahb-klia-t1-home', 'malaymail-klia-rebrand-2023'],
          },
          {
            id: 'plan-arrival-time',
            title: lt('Plan when to arrive', 'Rancang waktu tiba'),
            body: lt(
              'As a guide, aim to be at the airport at least 3 hours before an international flight and at least 2 hours before a domestic flight. Your airline sets the actual check-in deadlines: follow its advice, especially in peak periods.',
              'Sebagai panduan, cuba tiba di lapangan terbang sekurang-kurangnya 3 jam sebelum penerbangan antarabangsa dan 2 jam sebelum penerbangan domestik. Syarikat penerbangan menetapkan had masa daftar masuk sebenar: ikut nasihatnya, terutama pada musim puncak.',
            ),
            provenance: 'estimated',
            sources: ['prototype-method'],
          },
          {
            id: 'check-in-online',
            title: lt('Check in online if your airline offers it', 'Daftar masuk dalam talian jika ditawarkan'),
            body: lt(
              'Online check-in can save queueing time at the airport. You may still need to drop bags at a counter.',
              'Daftar masuk dalam talian boleh menjimatkan masa beratur di lapangan terbang. Anda mungkin masih perlu menyerahkan bagasi di kaunter.',
            ),
            provenance: 'suggestion',
            sources: ['prototype-method'],
          },
        ],
      },
      {
        id: 'at-the-airport',
        title: lt('At the airport', 'Di lapangan terbang'),
        steps: [
          {
            id: 'klia-t1-check-in-level',
            title: lt('KLIA Terminal 1: check in on Level 5', 'KLIA Terminal 1: daftar masuk di Aras 5'),
            body: lt(
              'The departure hall and check-in counters are on Level 5 of the Main Terminal Building. Counter rows can change from day to day, so check the screens.',
              'Balai berlepas dan kaunter daftar masuk terletak di Aras 5 Bangunan Terminal Utama. Barisan kaunter boleh berubah dari hari ke hari, jadi semak skrin.',
            ),
            provenance: 'official',
            sources: ['mh-klia-t1-passenger-journey'],
            actions: [{ label: lt('Open the Terminal 1 map', 'Buka peta Terminal 1'), href: '/kul/map' }],
          },
          {
            id: 'klia-t1-gates',
            title: lt('KLIA Terminal 1: know where your gate is', 'KLIA Terminal 1: ketahui lokasi pintu anda'),
            body: lt(
              'A and B gates (domestic) and G and H gates (international) are in the main terminal. C gates are in the Satellite Building, reached by the Aerotrain in under three minutes.',
              'Pintu A dan B (domestik) serta pintu G dan H (antarabangsa) terletak di terminal utama. Pintu C terletak di Bangunan Satelit, boleh dicapai dengan Aerotrain dalam masa kurang tiga minit.',
            ),
            provenance: 'official',
            sources: ['mh-klia-t1-passenger-journey', 'malaymail-aerotrain-software-oct-2026', 'paultan-aerotrain-resumes-2025'],
          },
          {
            id: 'be-at-the-gate',
            title: lt('Be at the gate before boarding starts', 'Berada di pintu sebelum penumpang mula menaiki pesawat'),
            body: lt(
              'Gates usually close before the departure time. The boarding time on your boarding pass is the one to plan around.',
              'Pintu biasanya ditutup sebelum waktu berlepas. Rancang mengikut waktu menaiki pesawat pada pas masuk anda.',
            ),
            provenance: 'estimated',
            sources: ['prototype-method'],
          },
        ],
      },
    ],
    asOf: '2026-11-16',
    sources: ['mh-klia-t1-passenger-journey', 'mahb-klia-t1-home', 'prototype-method'],
  },
];

/** One guide by slug. */
export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

/** Slugs of all guides, for `generateStaticParams`. */
export function guideSlugs(): string[] {
  return GUIDES.map((guide) => guide.slug);
}

/** Guides written for an audience (guides tagged `all` are always included). */
export function guidesForAudience(audience: Audience): Guide[] {
  return GUIDES.filter((guide) => guide.audience.includes(audience) || guide.audience.includes('all'));
}

/** Guides relevant to an airport: network-wide guides plus those naming the airport. */
export function guidesForAirport(airport: string): Guide[] {
  return GUIDES.filter((guide) => !guide.airports || guide.airports.includes(airport));
}
