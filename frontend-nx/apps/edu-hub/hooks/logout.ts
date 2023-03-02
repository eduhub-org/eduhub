import { useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

const useLogout = () => {
  const router = useRouter();
  return useCallback(async () => {
    // Fetch Keycloak Logout URL
    const res = await fetch('/api/auth/logout');
    const jsonPayload = await res?.json();
    const url = JSON.parse(jsonPayload).url;

    // Logging user out client side
    await signOut({ redirect: false });

    // Logging user out on keycloak and redirecting back to app
    router.push(url);
  }, [router]);
};

export default useLogout;
