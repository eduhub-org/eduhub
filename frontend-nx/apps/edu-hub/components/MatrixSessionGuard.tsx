import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

import { logoutAllMatrixSessions } from '../lib/matrix/oauth';

/**
 * Ends stored chat (Matrix) sessions as soon as nobody is signed in to EduHub.
 *
 * useLogout already does this for the logout button, but an EduHub session can
 * also end on its own (expired refresh token, auth error). Must be rendered
 * inside SessionProvider.
 */
export function MatrixSessionGuard(): null {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') logoutAllMatrixSessions();
  }, [status]);

  return null;
}
