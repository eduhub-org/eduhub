import { useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

const useLogout = () => {
  const router = useRouter();
  return useCallback(async () => {
    let url = '/';

    try {
      // Fetch the Keycloak end-session URL. The endpoint returns the app home
      // URL when federated logout is unavailable.
      const res = await fetch('/api/auth/logout');
      if (res.ok) {
        const payload = await res.json();
        if (typeof payload?.url === 'string') url = payload.url;
      }
    } catch (error) {
      console.error('Failed to prepare federated logout', error);
    }

    // Leave protected pages before clearing the session. Some pages start a
    // login as soon as they become unauthenticated, which would otherwise
    // race the intended Keycloak logout redirect.
    try {
      await router.replace('/');
    } catch (error) {
      // A failed client-side navigation must not prevent local logout.
      console.error('Failed to leave protected page before logout', error);
    }

    // Always clear the local session, even if Keycloak logout preparation
    // failed, then use a full-page navigation for the external IdP URL.
    await signOut({ redirect: false });
    window.location.replace(url);
  }, [router]);
};

export default useLogout;
