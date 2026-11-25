/**
 * One running Matrix client per browser, shared by every chat on the page.
 *
 * MAS rotates refresh tokens: each refresh returns a new one and retires the
 * old. Two clients holding the same session (two components, React's double
 * mount in development, or two tabs) would race to refresh, and the loser's
 * spent token can end the session. So:
 * - within a tab, all subscribers share one client (reference counted), and
 * - across tabs, a Web Lock lets only one tab run it; the others wait and take
 *   over when that tab closes.
 */
import type { MatrixClient } from 'matrix-js-sdk';

import { createMatrixClientFromSession } from './oauth';
import { clearMatrixSession, loadMatrixSession } from './session';

export type MatrixClientStatus =
  | { state: 'connecting' }
  | { state: 'needs-login' }
  | { state: 'other-tab' }
  /** Starting the client failed (e.g. homeserver unreachable); the session is kept. */
  | { state: 'error' }
  | { state: 'ready'; client: MatrixClient }
  /** The client is still running and retrying; the connection is just down. */
  | { state: 'offline'; client: MatrixClient };

type Listener = (status: MatrixClientStatus) => void;

interface Shared {
  eduHubUserId: string;
  status: MatrixClientStatus;
  listeners: Set<Listener>;
  client?: MatrixClient;
  releaseLock?: () => void;
  stopTimer?: ReturnType<typeof setTimeout>;
  stopped: boolean;
}

/** Keeps the client alive briefly after the last subscriber leaves (re-mounts, page transitions). */
const STOP_DELAY_MS = 2000;

let shared: Shared | null = null;

const setStatus = (s: Shared, status: MatrixClientStatus) => {
  s.status = status;
  s.listeners.forEach((listener) => listener(status));
};

const stop = (s: Shared) => {
  s.stopped = true;
  s.client?.stopClient();
  s.client?.removeAllListeners();
  s.client = undefined;
  s.releaseLock?.();
  s.releaseLock = undefined;
};

const run = async (s: Shared) => {
  const session = loadMatrixSession(s.eduHubUserId);
  if (!session) {
    setStatus(s, { state: 'needs-login' });
    return;
  }

  const { ClientEvent, HttpApiEvent, SyncState } = await import('matrix-js-sdk');
  const client = await createMatrixClientFromSession(s.eduHubUserId, session);
  if (s.stopped) return;
  s.client = client;

  client.on(ClientEvent.Sync, (state) => {
    if (state === SyncState.Prepared || state === SyncState.Syncing || state === SyncState.Catchup) {
      setStatus(s, { state: 'ready', client });
    } else if (state === SyncState.Error || state === SyncState.Reconnecting) {
      setStatus(s, { state: 'offline', client });
    }
  });

  // The token is gone for good (refresh failed, or the session was ended
  // elsewhere): forget it, so the chat offers to connect again.
  client.on(HttpApiEvent.SessionLoggedOut, () => {
    clearMatrixSession(s.eduHubUserId);
    stop(s);
    setStatus(s, { state: 'needs-login' });
  });

  await client.startClient({ initialSyncLimit: 30, lazyLoadMembers: true });
};

const start = (s: Shared) => {
  const lockName = `eduhub-matrix-client-${s.eduHubUserId}`;
  if (typeof navigator === 'undefined' || !navigator.locks) {
    run(s).catch(() => setStatus(s, { state: 'error' }));
    return;
  }

  const holdLockWhileRunning = () =>
    new Promise<void>((resolve) => {
      s.releaseLock = resolve;
      if (s.stopped) {
        resolve();
        return;
      }
      run(s).catch(() => setStatus(s, { state: 'error' }));
    });

  navigator.locks.request(lockName, { ifAvailable: true }, (lock) => {
    if (lock) return holdLockWhileRunning();
    // Another tab runs the chat. Wait in line and take over when it closes.
    setStatus(s, { state: 'other-tab' });
    navigator.locks.request(lockName, () => (s.stopped ? undefined : holdLockWhileRunning()));
    return undefined;
  });
};

/**
 * Subscribes to the shared client of this EduHub user, starting it if needed.
 * The listener is called right away with the current status and on every change.
 * Returns the unsubscribe function.
 */
export const subscribeMatrixClient = (eduHubUserId: string, listener: Listener): (() => void) => {
  if (shared && shared.eduHubUserId !== eduHubUserId) {
    stop(shared);
    shared = null;
  }
  if (!shared) {
    shared = { eduHubUserId, status: { state: 'connecting' }, listeners: new Set(), stopped: false };
    start(shared);
  }

  const s = shared;
  clearTimeout(s.stopTimer);
  s.listeners.add(listener);
  listener(s.status);

  return () => {
    s.listeners.delete(listener);
    if (s.listeners.size > 0) return;
    s.stopTimer = setTimeout(() => {
      stop(s);
      if (shared === s) shared = null;
    }, STOP_DELAY_MS);
  };
};
