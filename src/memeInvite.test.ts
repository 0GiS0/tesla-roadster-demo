import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INVITE_DELAY_MS, INVITE_STORAGE_KEY, createMemeInvite, inviteMotion, invitesEnabled } from './memeInvite';

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } };
}

describe('meme invite', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows once after the delay and marks the session', () => {
    const storage = memoryStorage();
    const onShow = vi.fn();
    createMemeInvite({ enabled: true, storage, onShow, onHide: vi.fn() });
    vi.advanceTimersByTime(INVITE_DELAY_MS - 1);
    expect(onShow).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(storage.getItem(INVITE_STORAGE_KEY)).toBe('1');
  });

  it('can be triggered early by the end of the manoeuvre, without repeating', () => {
    const onShow = vi.fn();
    const invite = createMemeInvite({ enabled: true, storage: memoryStorage(), onShow, onHide: vi.fn() });
    invite.trigger();
    invite.trigger();
    vi.advanceTimersByTime(INVITE_DELAY_MS * 2);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it('does not repeat in the same session', () => {
    const storage = memoryStorage();
    createMemeInvite({ enabled: true, storage, onShow: vi.fn(), onHide: vi.fn() }).trigger();
    const onShow = vi.fn();
    const again = createMemeInvite({ enabled: true, storage, onShow, onHide: vi.fn() });
    vi.advanceTimersByTime(INVITE_DELAY_MS);
    again.trigger();
    expect(onShow).not.toHaveBeenCalled();
  });

  it('is cancelled by dismissing before it appears', () => {
    const storage = memoryStorage();
    const onShow = vi.fn();
    const onHide = vi.fn();
    const invite = createMemeInvite({ enabled: true, storage, onShow, onHide });
    invite.dismiss();
    vi.advanceTimersByTime(INVITE_DELAY_MS);
    invite.trigger();
    expect(onShow).not.toHaveBeenCalled();
    expect(onHide).toHaveBeenCalled();
    expect(storage.getItem(INVITE_STORAGE_KEY)).toBe('1');
  });

  it('never shows when opted out', () => {
    const onShow = vi.fn();
    const invite = createMemeInvite({ enabled: false, storage: memoryStorage(), onShow, onHide: vi.fn() });
    vi.advanceTimersByTime(INVITE_DELAY_MS);
    invite.trigger();
    expect(onShow).not.toHaveBeenCalled();
  });

  it('survives unavailable storage', () => {
    const storage = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    const onShow = vi.fn();
    createMemeInvite({ enabled: true, storage, onShow, onHide: vi.fn() });
    vi.advanceTimersByTime(INVITE_DELAY_MS);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it('detects the recording opt-out', () => {
    expect(invitesEnabled('', false)).toBe(true);
    expect(invitesEnabled('?invite=0', false)).toBe(false);
    expect(invitesEnabled('?debug=1', true)).toBe(false);
  });

  it('uses a static highlight with reduced motion', () => {
    expect(inviteMotion(true)).toBe('static');
    expect(inviteMotion(false)).toBe('pulse');
  });
});
