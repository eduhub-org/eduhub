import { useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter as useRouterApp } from 'next/navigation';

const useLogout = () => {
  const routerApp = useRouterApp();

  return useCallback(async () => {
    // Fetch Keycloak Logout URL
    const res = await fetch('/api/auth/logout');
    const jsonPayload = await res?.json();
    const url = JSON.parse(jsonPayload).url;

    // Logging user out client side
    await signOut({ redirect: false });

    // Determine which router to use and navigate
    if ('push' in routerApp) {
      // App Router
      routerApp.push(url);
    } else {
      // Pages Router
      const { useRouter: useRouterPages } = await import('next/router');
      const routerPages = useRouterPages();
      routerPages.push(url);
    }
  }, [routerApp]);
};

export default useLogout;
