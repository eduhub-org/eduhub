import { createContext, useCallback, useContext, useEffect, useMemo, useState, FC, ReactNode } from 'react';

import { client } from '../config/apollo';
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
  loading: boolean;
  start: (userId: string) => Promise<{ ok: boolean; error?: string }>;
  stop: () => Promise<void>;
};

const ImpersonationContext = createContext<ImpersonationContextValue>({
  target: null,
  loading: true,
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
  const [loading, setLoading] = useState(true);

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

  // Apollo caches by query, not by viewer, so anything read as one identity
  // would otherwise still be sitting there for the next one.
  const applyTarget = useCallback(async (next: ImpersonationTarget | null) => {
    setImpersonationState({ active: next !== null, targetUserId: next?.id ?? null });
    setTarget(next);
    try {
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

  const start = useCallback(
    async (userId: string) => {
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
    },
    [applyTarget]
  );

  const stop = useCallback(async () => {
    // Only drop the target once the server says the impersonation is over. The
    // stop route clears the cookie before it checks anything, so a refusal here
    // is not expected -- but hiding the banner while the cookie is still live
    // is the one outcome worth ruling out.
    const response = await fetch('/api/impersonation/stop', {
      method: 'POST',
      credentials: 'same-origin',
    });
    if (!response.ok) return;
    await applyTarget(null);
  }, [applyTarget]);

  const value = useMemo(() => ({ target, loading, start, stop }), [target, loading, start, stop]);

  return <ImpersonationContext.Provider value={value}>{children}</ImpersonationContext.Provider>;
};

export const useImpersonation = (): ImpersonationContextValue => useContext(ImpersonationContext);
