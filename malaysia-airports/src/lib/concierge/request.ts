/**
 * The `/api/concierge` request contract, validated with zod on the server.
 */
import { z } from 'zod';
import { FACILITY_CATEGORIES, LANGS, TERMINAL_IDS } from '@/content/types';
import { CONCIERGE_MAX_QUESTION } from './constants';
import { CONCIERGE_INTENTS } from './types';

export const ConciergeRequestSchema = z.strictObject({
  question: z.string().trim().min(1).max(CONCIERGE_MAX_QUESTION),
  lang: z.enum(LANGS),
  /** Airport slug the visitor is asking about (their remembered choice or the last answer's). */
  airport: z.string().regex(/^[a-z]{3}$/).optional(),
  terminal: z.enum(TERMINAL_IDS).optional(),
  /** A saved flight id, sent only when the visitor switched "include my saved flight" on. */
  flightId: z.string().regex(/^[a-z0-9]{2,3}\d{1,4}[a-z]?-\d{8}-[da]$/).optional(),
  /** Previous intent and slots, for follow-up questions. */
  intent: z.enum(CONCIERGE_INTENTS).optional(),
  category: z.enum(FACILITY_CATEGORIES).optional(),
  destination: z.string().max(80).optional(),
});

export type ConciergeRequest = z.infer<typeof ConciergeRequestSchema>;
