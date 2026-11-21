import { describe, expect, it } from 'vitest';
import { connectionNotice, savingState, type WorkerStatus } from './sw-client';

const STATUSES: WorkerStatus[] = ['unknown', 'unsupported', 'disabled', 'installing', 'active', 'error'];

describe('round 4: one answer to "what is saved" (gallery note 3)', () => {
  it('says nothing is saved yet when the connection dropped before the worker was ready', () => {
    // The capture: offline about a second after load, so registration failed (the script could
    // not be fetched). It used to read "not switched on in this version of the site".
    expect(savingState('error', false)).toBe('not-ready');
    expect(savingState('installing', false)).toBe('not-ready');
    expect(savingState('unknown', false)).toBe('not-ready');
    expect(savingState('error', true)).toBe('failed');
    expect(savingState('active', false)).toBe('on');
    expect(savingState('disabled', true)).toBe('off');
  });

  it('never says "showing saved information" unless the worker controls the page, and agrees with the card', () => {
    for (const status of STATUSES) {
      const notice = connectionNotice({ online: false, justReconnected: false, servedFromCache: false, status });
      expect(notice, status).toBe(savingState(status, false) === 'on' ? 'offline' : 'offline-nothing-saved');
    }
    expect(connectionNotice({ online: true, justReconnected: false, servedFromCache: true, status: 'active' })).toBe('unreachable');
    expect(connectionNotice({ online: true, justReconnected: true, servedFromCache: false, status: 'active' })).toBe('back');
    expect(connectionNotice({ online: true, justReconnected: false, servedFromCache: false, status: 'active' })).toBeNull();
  });
});
