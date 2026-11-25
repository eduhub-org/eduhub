import { useEffect, useState } from 'react';

import { useSignedInUserId } from './authentication';
import { getMatrixHomeserverUrl } from '../lib/matrix/config';
import { MatrixClientStatus, subscribeMatrixClient } from '../lib/matrix/sharedClient';

export type UseMatrixClientResult =
  | MatrixClientStatus
  /** No homeserver configured for this deployment. */
  | { state: 'unavailable' };

/**
 * The embedded chat's Matrix client for the signed-in EduHub user.
 *
 * Browser only: it reads the session from localStorage and starts a sync loop,
 * so render its consumers with next/dynamic and `ssr: false`.
 */
export const useMatrixClient = (): UseMatrixClientResult => {
  const eduHubUserId = useSignedInUserId();
  const configured = getMatrixHomeserverUrl() !== null;
  const [status, setStatus] = useState<UseMatrixClientResult>({ state: 'connecting' });

  useEffect(() => {
    if (!configured || !eduHubUserId) {
      setStatus({ state: 'unavailable' });
      return undefined;
    }
    return subscribeMatrixClient(eduHubUserId, setStatus);
  }, [configured, eduHubUserId]);

  return status;
};
