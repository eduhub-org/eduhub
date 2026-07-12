import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';

/**
 * Opened inside the login popup window (see Layout): immediately hands off
 * to Keycloak. `?register=1` deep-links into the registration form via the
 * OIDC `prompt=create` parameter (supported since Keycloak 22).
 */
const AuthPopup = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    signIn(
      'keycloak',
      { callbackUrl: '/auth/popup-done' },
      router.query.register === '1' ? { prompt: 'create' } : undefined
    );
  }, [router.isReady, router.query.register]);

  return (
    <p style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      Anmeldung wird geladen …
    </p>
  );
};

export default AuthPopup;
