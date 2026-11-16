import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import MatrixAuthStatus from '../../components/pages/MatrixAuth/MatrixAuthStatus';
import { useSignedInUserId } from '../../hooks/authentication';
import { safeReturnTo } from '../../lib/matrix/config';
import { MatrixLoginError, startMatrixLogin } from '../../lib/matrix/oauth';

/**
 * Starts the chat login: /matrix/login?returnTo=/course/123
 * Requires an EduHub login first, then sends the browser to the homeserver's
 * OAuth 2.0 server, which comes back to /matrix/callback.
 */
const MatrixLoginPage = () => {
  const router = useRouter();
  const t = useTranslations('matrixChat');
  const { status } = useSession();
  const eduHubUserId = useSignedInUserId();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!router.isReady || status === 'loading' || started.current) return;

    if (status === 'unauthenticated') {
      started.current = true;
      signIn('keycloak', { callbackUrl: window.location.href });
      return;
    }
    if (!eduHubUserId) return;

    started.current = true;
    startMatrixLogin({
      eduHubUserId,
      returnTo: safeReturnTo(router.query.returnTo),
      origin: window.location.origin,
    })
      .then((url) => window.location.assign(url))
      .catch((loginError) => {
        console.error('Could not start the Matrix login', loginError);
        setError(
          loginError instanceof MatrixLoginError && loginError.reason === 'NOT_CONFIGURED'
            ? t('not_configured')
            : t('login_failed')
        );
      });
  }, [router.isReady, router.query.returnTo, status, eduHubUserId, t]);

  return <MatrixAuthStatus message={t('login_redirecting')} error={error} retryHref={router.asPath} />;
};

export default MatrixLoginPage;
