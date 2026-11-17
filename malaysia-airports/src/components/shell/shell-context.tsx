'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { SectionAvailability } from './sections';

/** Small, server-computed facts every client part of the shell needs. */
export interface ShellData {
  /** Sections that exist for each airport slug (from the content layer). */
  sections: SectionAvailability;
  /** The official passenger website, from the source registry. Undefined when the source is missing. */
  officialSiteUrl?: string;
}

const ShellContext = createContext<ShellData>({ sections: {} });

/** Mounted once by the root layout. */
export function ShellProvider({ sections, officialSiteUrl, children }: ShellData & { children: ReactNode }) {
  const value = useMemo(() => ({ sections, officialSiteUrl }), [sections, officialSiteUrl]);
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

/** Everything the shell knows from the server. */
export function useShellData(): ShellData {
  return useContext(ShellContext);
}

/**
 * Which sections exist for which airport. Pass it to `sectionHref(section, selection, availability)`
 * so links never point at a section an airport does not have.
 */
export function useSectionAvailability(): SectionAvailability {
  return useContext(ShellContext).sections;
}
