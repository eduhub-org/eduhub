import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import MatrixAuthStatus from '../../components/pages/MatrixAuth/MatrixAuthStatus';
import { useSignedInUserId } from '../../hooks/authentication';
import { completeMatrixLogin, MatrixLoginError, parseMatrixCallback } from '../../lib/matrix/oauth';

/**
 * Where the homeserver's OAuth 2.0 server sends the browser back after the
 * chat login, with code and state in the URL fragment (#code=…&state=…).
 */
const MatrixCallbackPage = () => {
  const router = useRouter();
  const t = useTranslations('matrixChat');
  const { status } = useSession();
  const eduHubUserId = useSignedInUserId();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (status === 'loading' || started.current) return;
    started.current = true;

    const { code, state, error: oauthError } = parseMatrixCallback(window.location.hash);
    // Drop the one-time code from the address bar and the browser history.
    window.history.replaceState(null, '', window.location.pathname);

    if (status === 'unauthenticated' || !eduHubUserId) {
      setError(t('session_missing'));
      return;
    }
    if (oauthError) {
      setError(oauthError === 'access_denied' ? t('login_denied') : t('login_failed'));
      return;
    }
    if (!code || !state) {
      setError(t('login_failed'));
      return;
    }

    completeMatrixLogin({ code, state, eduHubUserId, origin: window.location.origin })
      .then(({ returnTo }) => router.replace(returnTo))
      .catch((loginError) => {
        console.error('Could not complete the Matrix login', loginError);
        setError(
          loginError instanceof MatrixLoginError && loginError.reason === 'WRONG_USER'
            ? t('session_missing')
            : t('login_failed')
        );
      });
  }, [status, eduHubUserId, router, t]);

  return <MatrixAuthStatus message={t('login_completing')} error={error} retryHref="/matrix/login" />;
};

export default MatrixCallbackPage;
