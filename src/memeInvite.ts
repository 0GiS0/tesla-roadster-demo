export const INVITE_DELAY_MS = 8000;
export const INVITE_STORAGE_KEY = 'roadster:meme-invite-seen';

type InviteStorage = Pick<Storage, 'getItem' | 'setItem'> | null;

/** Recording tools and `?invite=0` opt out so captures stay deterministic. */
export function invitesEnabled(search: string, webdriver: boolean): boolean {
  return !webdriver && new URLSearchParams(search).get('invite') !== '0';
}

export function inviteMotion(reducedMotion: boolean): 'static' | 'pulse' {
  return reducedMotion ? 'static' : 'pulse';
}

function safeGet(storage: InviteStorage) {
  try { return storage?.getItem(INVITE_STORAGE_KEY) === '1'; } catch { return false; }
}
function safeSet(storage: InviteStorage) {
  try { storage?.setItem(INVITE_STORAGE_KEY, '1'); } catch { /* storage unavailable */ }
}

export interface MemeInvite {
  /** Shows the invite now (e.g. original manoeuvre finished) if still allowed. */
  trigger(): void;
  /** Cancels the pending or visible invite for the rest of the session. */
  dismiss(): void;
  dispose(): void;
}

export function createMemeInvite(options: {
  enabled: boolean;
  storage: InviteStorage;
  onShow: () => void;
  onHide: () => void;
  delay?: number;
}): MemeInvite {
  const { enabled, storage, onShow, onHide, delay = INVITE_DELAY_MS } = options;
  let done = !enabled || safeGet(storage);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clear = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
  const trigger = () => {
    if (done) return;
    done = true;
    clear();
    safeSet(storage);
    onShow();
  };
  if (!done) timer = setTimeout(trigger, delay);
  return {
    trigger,
    dismiss() {
      clear();
      if (!done) safeSet(storage);
      done = true;
      onHide();
    },
    dispose: clear,
  };
}
