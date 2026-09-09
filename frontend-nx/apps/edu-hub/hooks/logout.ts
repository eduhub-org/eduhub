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

    // Always clear the local session, even if Keycloak logout preparation
    // failed, then return to a real application page.
    await signOut({ redirect: false });
    router.push(url);
  }, [router]);
};

export default useLogout;
