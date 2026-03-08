import { useSession } from 'next-auth/react';
import { useCurrentRole } from '../hooks/authentication';
import { setAuthState } from '../config/authStore';

/**
 * Updates the module-level auth store used by the Apollo auth link.
 * Must be rendered inside SessionProvider so useSession has access.
 * Runs during render so the store is current before any child queries execute.
 *
 * When status is 'loading' (e.g. token refresh, window focus), we keep the
 * previous auth to avoid clearing it and causing 401s on in-flight requests.
 */
export function AuthStoreUpdater(): null {
  const { data, status } = useSession();
  const currentRole = useCurrentRole();

  if (status !== 'loading') {
    setAuthState({
      accessToken: data?.accessToken ?? null,
      role: currentRole,
    });
  }
  // else: keep previous auth state to avoid 401s during brief loading

  return null;
}
