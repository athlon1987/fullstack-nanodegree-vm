// Social foundation (Phase 5). These interfaces define the contract a real backend
// (e.g. Supabase/Postgres with server-authoritative validation) must implement.
// No online service exists yet: the LocalSocialService reports that honestly and
// never fabricates other players.
import type { BuildingInstance, ItemBag } from '../core/types';

export interface PlayerIdentity {
  /** Local-only identity until an account exists. */
  kind: 'local' | 'online';
  id: string;
  displayName: string;
}

export interface FriendSummary {
  id: string;
  displayName: string;
  hoodName: string;
  level: number;
  lastActive: number;
}

export interface NeighborhoodSnapshot {
  ownerId: string;
  hoodName: string;
  buildings: Pick<BuildingInstance, 'type' | 'x' | 'z' | 'rot' | 'level'>[];
  plots: string[];
  /** Snapshots are read-only and contain no private data (no inventory/currency). */
}

export interface GiftRequest {
  /** Client-generated idempotency key; the server applies each op id once. */
  opId: string;
  to: string;
  items: ItemBag;
}

export interface Hood {
  id: string;
  name: string;
  members: number;
  capacity: number;
}

export interface SocialService {
  readonly online: boolean;
  identity(): Promise<PlayerIdentity>;
  listFriends(): Promise<FriendSummary[]>;
  visit(friendId: string): Promise<NeighborhoodSnapshot>;
  /** Server validates ownership, caps, rate limits and applies atomically. */
  sendGift(req: GiftRequest): Promise<{ ok: boolean; reason?: string }>;
  myHood(): Promise<Hood | null>;
}

export class LocalSocialService implements SocialService {
  readonly online = false;
  constructor(private name: string) {}
  async identity(): Promise<PlayerIdentity> {
    return { kind: 'local', id: 'local-player', displayName: this.name };
  }
  async listFriends(): Promise<FriendSummary[]> {
    return []; // No fake friends: online play is not available yet.
  }
  async visit(): Promise<NeighborhoodSnapshot> {
    throw new Error('Visiting requires online play, which is coming in a later update.');
  }
  async sendGift(): Promise<{ ok: boolean; reason?: string }> {
    return { ok: false, reason: 'Online gifting is coming in a later update.' };
  }
  async myHood(): Promise<Hood | null> {
    return null;
  }
}
