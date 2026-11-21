/**
 * The services the operational status lines cover (BR-08), and how each is recognised in the
 * notices until a live operations feed exists (OOS-02). Plain data with no content-layer imports,
 * so both the status component and the concierge engine (which also runs in the browser) can
 * read it.
 */
import type { LocalizedText, TerminalId } from '@/content/types';
import type { WaitCheckpoint } from './types';

const L = (en: string, ms: string): LocalizedText => ({ en, ms });

/** A service whose running state passengers ask about. */
export type OpsServiceId = 'aerotrain' | 'inter-terminal-train' | 'inter-terminal-shuttle' | 'immigration';

export const OPS_SERVICE_IDS: readonly OpsServiceId[] = ['aerotrain', 'inter-terminal-train', 'inter-terminal-shuttle', 'immigration'];

/** How a service is recognised in the notices, until a live operations feed exists (OOS-02). */
export interface OpsServiceDefinition {
  id: OpsServiceId;
  /** Airports where the service exists. */
  airports: readonly string[];
  /** Terminal the service belongs to, when it is inside one. */
  terminal?: TerminalId;
  name: LocalizedText;
  /** Matched against the notice id and English title. */
  pattern: RegExp;
  /** Queue checkpoints shown with the line (demo estimates). */
  waits?: readonly WaitCheckpoint[];
}

export const OPS_SERVICES: readonly OpsServiceDefinition[] = [
  {
    id: 'aerotrain',
    airports: ['kul'],
    terminal: 'T1',
    name: L('Aerotrain to the C gates', 'Aerotrain ke pintu C'),
    pattern: /aerotrain/i,
  },
  {
    id: 'inter-terminal-train',
    airports: ['kul'],
    name: L('Train between Terminal 1 and Terminal 2', 'Tren antara Terminal 1 dan Terminal 2'),
    pattern: /inter-terminal-train|(klia transit|klia ekspres|erl|inter-terminal train)[^.]*(suspend|disrupt|clos|not running|delay|replac)/i,
  },
  {
    id: 'inter-terminal-shuttle',
    airports: ['kul'],
    name: L('Shuttle bus between terminals', 'Bas ulang-alik antara terminal'),
    pattern: /shuttle/i,
  },
  {
    id: 'immigration',
    airports: ['kul', 'pen', 'bki', 'kch', 'lgk', 'szb'],
    name: L('Immigration', 'Imigresen'),
    pattern: /immigration|autogate|imigresen/i,
    // Leaving (security, immigration) and arriving (immigration): each step picks its own.
    waits: ['security', 'immigration-departure', 'immigration-arrival'],
  },
];

