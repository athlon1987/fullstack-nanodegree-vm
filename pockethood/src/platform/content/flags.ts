// Feature flags: code defaults ← content index (remote) ← local Studio overrides (dev builds).
import { create } from 'zustand';
import { safeGet, safeSet } from '../../utils/safeStorage';

export const DEFAULT_FLAGS: Record<string, boolean> = {
  modules: true,
  zen_mode: true,
  sponsor_labels: true,
  real_world_menus: true,
  visit_links: true,
  weather: true,
  pwa: true,
  /** Developer & content Studio. On in this prototype; production builds switch it off via the index. */
  studio: true,
};

const OVERRIDE_KEY = 'pockethood.flags';

function readOverrides(): Record<string, boolean> {
  try {
    const o = JSON.parse(safeGet(OVERRIDE_KEY) ?? '{}') as Record<string, unknown>;
    return Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === 'boolean')) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export const useFlags = create<{ remote: Record<string, boolean>; overrides: Record<string, boolean> }>(() => ({ remote: {}, overrides: readOverrides() }));

export function flags(): Record<string, boolean> {
  const { remote, overrides } = useFlags.getState();
  return { ...DEFAULT_FLAGS, ...remote, ...overrides };
}
export const flag = (name: string) => !!flags()[name];

export function setRemoteFlags(remote: Record<string, boolean>) {
  useFlags.setState({ remote });
}

/** Local override (Studio). Pass undefined to clear. */
export function overrideFlag(name: string, value: boolean | undefined) {
  const overrides = { ...useFlags.getState().overrides };
  if (value === undefined) delete overrides[name];
  else overrides[name] = value;
  safeSet(OVERRIDE_KEY, JSON.stringify(overrides));
  useFlags.setState({ overrides });
}
