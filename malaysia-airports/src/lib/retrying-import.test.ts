import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWaitingImports, retryableLazy, retryingImport, retryWaitingImports, subscribeWaitingImports } from './retrying-import';

/** A browser-like `window` for the Node test environment: events and timers only. */
function fakeWindow() {
  const target = new EventTarget();
  return Object.assign(target, {
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
  });
}

describe('retryingImport (verification round 5: a failed chunk must not take the page down)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', fakeWindow());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('resolves at once when the import succeeds', async () => {
    const load = vi.fn(async () => 'module');
    await expect(retryingImport(load)).resolves.toBe('module');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('never rejects: after a failed fetch it tries again when the browser is back online', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('Failed to load chunk')).mockResolvedValue('module');
    const settled = vi.fn();
    void retryingImport(load).then(settled, settled);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(settled).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(0);
    expect(load).toHaveBeenCalledTimes(2);
    expect(settled).toHaveBeenCalledWith('module');
  });

  it('on an unreliable connection it tries again after a pause that doubles, up to a minute', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('1')).mockRejectedValueOnce(new Error('2')).mockResolvedValue('module');
    const settled = vi.fn();
    void retryingImport(load, 5_000).then(settled);
    await vi.advanceTimersByTimeAsync(4_999);
    expect(load).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(load).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(load).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(load).toHaveBeenCalledTimes(3);
    expect(settled).toHaveBeenCalledWith('module');
  });

  it('on the server a failure is passed through', async () => {
    vi.unstubAllGlobals();
    await expect(retryingImport(() => Promise.reject(new Error('server')))).rejects.toThrow('server');
  });
});

describe('round 6: failed imports a visitor can retry (review-3 9.1 item 1)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', fakeWindow());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('counts an import that failed as waiting, and "Try again" fetches it afresh at once', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('Failed to load chunk')).mockResolvedValue('module');
    const changed = vi.fn();
    const unsubscribe = subscribeWaitingImports(changed);
    const settled = vi.fn();
    void retryingImport(load, 60_000).then(settled);
    await vi.advanceTimersByTimeAsync(0);
    expect(getWaitingImports()).toBe(1);
    expect(changed).toHaveBeenCalledTimes(1);
    // Long before the pause is over: the visitor presses "Try again".
    retryWaitingImports();
    await vi.advanceTimersByTimeAsync(0);
    expect(load).toHaveBeenCalledTimes(2);
    expect(settled).toHaveBeenCalledWith('module');
    expect(getWaitingImports()).toBe(0);
    // The pause's timer and the online listener are gone: no third fetch.
    await vi.advanceTimersByTimeAsync(120_000);
    window.dispatchEvent(new Event('online'));
    expect(load).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('a retryable lazy component imports again after renew (never the failed or cached promise)', () => {
    const load = vi.fn(async () => () => null);
    const Part = retryableLazy(load);
    const first = Part({});
    Part.renew();
    const second = Part({});
    expect(first.type).not.toBe(second.type);
  });
});
