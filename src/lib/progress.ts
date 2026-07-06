/**
 * Local-first, per-child progress. Persisted to localStorage; no backend.
 *
 * Model of completion:
 *   - A lesson is COMPLETE when every one of its success_criteria is checked off.
 *     (The checkboxes ARE the unit of progress — self- or parent-verified.)
 *   - A project is COMPLETE when all of its lessons are complete.
 * Gating reads these to lock nodes whose prerequisites aren't done yet.
 */
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'future-founder.progress.v1';

export interface ChildProgress {
  /** scopeId (lesson id) -> which success_criteria indices are checked. */
  criteria: Record<string, number[]>;
}

export interface Child {
  id: string;
  name: string;
  progress: ChildProgress;
}

interface PersistedState {
  activeChildId: string | null;
  children: Record<string, Child>;
}

function emptyChild(id: string, name: string): Child {
  return { id, name, progress: { criteria: {} } };
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed && typeof parsed === 'object' && parsed.children) return parsed;
    }
  } catch {
    // Corrupt/unavailable storage — fall through to a fresh default.
  }
  return { activeChildId: null, children: {} };
}

let state: PersistedState = load();

const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota/availability errors — progress simply won't persist.
  }
}

function setState(next: PersistedState) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): PersistedState {
  return state;
}

// A stable id generator that does not rely on Math.random/Date at module load.
let idCounter = 0;
function newId(): string {
  idCounter += 1;
  return `child_${Date.now().toString(36)}_${idCounter}`;
}

/* ----------------------------- mutations ----------------------------- */

export function addChild(name: string): string {
  const id = newId();
  const child = emptyChild(id, name.trim() || 'Explorer');
  setState({
    activeChildId: id,
    children: { ...state.children, [id]: child },
  });
  return id;
}

export function selectChild(id: string) {
  if (!state.children[id]) return;
  setState({ ...state, activeChildId: id });
}

export function renameChild(id: string, name: string) {
  const child = state.children[id];
  if (!child) return;
  setState({
    ...state,
    children: { ...state.children, [id]: { ...child, name: name.trim() || child.name } },
  });
}

/** Toggle a single success-criterion for a lesson (the atom of progress). */
export function toggleCriterion(childId: string, lessonId: string, index: number) {
  const child = state.children[childId];
  if (!child) return;
  const current = child.progress.criteria[lessonId] ?? [];
  const has = current.includes(index);
  const nextList = has ? current.filter((i) => i !== index) : [...current, index].sort((a, b) => a - b);
  setState({
    ...state,
    children: {
      ...state.children,
      [childId]: {
        ...child,
        progress: {
          ...child.progress,
          criteria: { ...child.progress.criteria, [lessonId]: nextList },
        },
      },
    },
  });
}

/** Check or uncheck ALL criteria for a lesson at once (the "mark complete" action). */
export function setLessonComplete(
  childId: string,
  lessonId: string,
  criteriaCount: number,
  complete: boolean,
) {
  const child = state.children[childId];
  if (!child) return;
  const nextList = complete ? Array.from({ length: criteriaCount }, (_, i) => i) : [];
  setState({
    ...state,
    children: {
      ...state.children,
      [childId]: {
        ...child,
        progress: {
          ...child.progress,
          criteria: { ...child.progress.criteria, [lessonId]: nextList },
        },
      },
    },
  });
}

/* ----------------------------- hooks ----------------------------- */

export function useProgressState(): PersistedState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useActiveChild(): Child | null {
  const s = useProgressState();
  return s.activeChildId ? (s.children[s.activeChildId] ?? null) : null;
}
