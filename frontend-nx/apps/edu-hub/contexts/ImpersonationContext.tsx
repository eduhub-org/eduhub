import { createContext, useCallback, useContext, useEffect, useMemo, useState, FC, ReactNode } from 'react';

import { setImpersonationState } from '../config/impersonationStore';
import { IMPERSONATION_MARKER_COOKIE } from '../helpers/impersonationMarker';

/**
 * Whether this browser is mid-impersonation, answered synchronously from the
 * readable marker cookie. The authoritative answer comes from the server below,
 * but Apollo needs a decision before the first query goes out.
 */
const hasImpersonationMarker = (): boolean => {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((entry) => entry === `${IMPERSONATION_MARKER_COOKIE}=1`);
};

export type ImpersonationTarget = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type ImpersonationContextValue = {
  /** Null unless a super-admin is currently viewing the app as someone else. */
  target: ImpersonationTarget | null;
  /**
   * True only while this browser carries the marker and the server has not said
   * yet who it names. `target` is null either way, so this is what tells "not
   * impersonating" apart from "impersonating somebody, name pending" -- and the
   * identity hooks have to treat the second as an impersonation, because the
   * transport already does.
   */
  loading: boolean;
  start: (userId: string) => Promise<{ ok: boolean; error?: string }>;
  stop: () => Promise<void>;
};

// No provider means no impersonation: loading false, so the identity hooks
// answer from the session as they always did.
const ImpersonationContext = createContext<ImpersonationContextValue>({
  target: null,
  loading: false,
  start: async () => ({ ok: false }),
  stop: async () => undefined,
});

/**
 * Keeps one fact - "who is this browser currently impersonating" - in one place:
 * the module-level store the Apollo link reads, and the React context every
 * identity hook reads.
 *
 * The answer comes from the server, never from the client: the target lives in
 * an httpOnly cookie, so the only way to learn it is to ask.
 */
export const ImpersonationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [target, setTarget] = useState<ImpersonationTarget | null>(null);

  // Route through the proxy from the very first request, before the server has
  // confirmed anything. Getting this wrong fails closed: the proxy refuses a
  // request it cannot authorise.
  //
  // Done inside the initializer, which React runs once, rather than in the
  // render body: from there it re-ran on every render and would put `active`
  // back after the session check below had already cleared it, leaving a
  // browser with a stale marker routing every query into a proxy that refuses
  // all of them.
  const [markerPresent] = useState(() => {
    const present = hasImpersonationMarker();
    if (present && typeof window !== 'undefined') {
      setImpersonationState({ active: true, targetUserId: null });
    }
    return present;
  });

  // Only a browser that is already routing through the proxy has anything to
  // wait for; for everyone else there is nothing pending and the identity hooks
  // must not be held back for even one render.
  const [loading, setLoading] = useState(markerPresent);

  // Apollo caches by query, not by viewer, so anything read as one identity
  // would otherwise still be sitting there for the next one.
  //
  // The client is pulled in here rather than imported at the top: every identity
  // hook reaches this module through useViewAs, so a static import would put
  // config/apollo -- and the HTTP link it builds on import -- in the graph of
  // anything that asks who the user is. It only belongs in the graph of the
  // switch itself, which happens in a browser, on a click.
  const applyTarget = useCallback(async (next: ImpersonationTarget | null) => {
    setImpersonationState({ active: next !== null, targetUserId: next?.id ?? null });
    setTarget(next);
    try {
      const { client } = await import('../config/apollo');
      await client.clearStore();
    } catch {
      /* a failed cache reset must not strand the caller mid-switch */
    }
  }, []);

  useEffect(() => {
    // Nothing to ask about unless this browser was told it is impersonating;
    // most visitors are not, and the course pages are public.
    if (!markerPresent) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch('/api/impersonation/session', { credentials: 'same-origin' });
        const data = await response.json();
        if (cancelled) return;
        if (data?.active && data?.target?.id) {
          setImpersonationState({ active: true, targetUserId: data.target.id });
          setTarget(data.target);
        } else {
          // A stale or forged marker: the server says there is no impersonation.
          setImpersonationState({ active: false, targetUserId: null });
        }
      } catch {
        /* not impersonating is the safe assumption */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [markerPresent]);

  // Both of these answer with a value rather than a rejection. A dropped
  // connection, or the HTML a proxy serves instead of JSON on a bad day, throws
  // out of `fetch`/`json()` -- and callers use try/finally to clear a pending
  // flag, so a rejection reaches nobody and the button looks like it did
  // nothing at all. Refusal and failure are the same thing to them anyway.
  const start = useCallback(
    async (userId: string) => {
      try {
        const response = await fetch('/api/impersonation/start', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await response.json();
        if (!response.ok || !data?.active) {
          return { ok: false, error: data?.error as string | undefined };
        }
        await applyTarget(data.target);
        return { ok: true };
      } catch (error) {
        console.error('Could not start impersonation', error);
        return { ok: false };
      }
    },
    [applyTarget]
  );

  const stop = useCallback(async () => {
    // Only drop the target once the server says the impersonation is over. The
    // stop route clears the cookie before it checks anything, so a refusal here
    // is not expected -- but hiding the banner while the cookie is still live
    // is the one outcome worth ruling out.
    try {
      const response = await fetch('/api/impersonation/stop', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!response.ok) return;
    } catch (error) {
      console.error('Could not stop impersonation', error);
      return;
    }
    await applyTarget(null);
  }, [applyTarget]);

  const value = useMemo(() => ({ target, loading, start, stop }), [target, loading, start, stop]);

  return <ImpersonationContext.Provider value={value}>{children}</ImpersonationContext.Provider>;
};

export const useImpersonation = (): ImpersonationContextValue => useContext(ImpersonationContext);
