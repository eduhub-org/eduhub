import type { NextApiRequest, NextApiResponse } from 'next';

import {
  OPEN_SESSION_QUERY,
  OpenSessionResult,
  adminClient,
  clearImpersonationCookie,
  noStore,
  readImpersonationCookie,
  resolveAdminCaller,
} from '../../../helpers/impersonation';

/**
 * Who, if anyone, this browser is currently impersonating. The client uses it to
 * route Apollo through the proxy, to answer "who am I" and to show the banner.
 *
 * A cookie whose session has been closed elsewhere is cleared here, so a tab
 * left open does not keep believing it is impersonating.
 */
export default async function impersonationSession(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const payload = readImpersonationCookie(req);
  if (!payload) {
    return res.status(200).json({ active: false });
  }

  const admin = await resolveAdminCaller(req);
  if (!admin) {
    clearImpersonationCookie(res);
    return res.status(200).json({ active: false });
  }

  try {
    const result = await adminClient().request<OpenSessionResult>(OPEN_SESSION_QUERY, {
      id: payload.sessionId,
      adminUserId: admin.userId,
    });
    const session = result.ImpersonationSession[0];
    if (!session || session.targetUserId !== payload.targetUserId) {
      clearImpersonationCookie(res);
      return res.status(200).json({ active: false });
    }

    return res.status(200).json({
      active: true,
      target: session.TargetUser ?? { id: session.targetUserId },
    });
  } catch (error) {
    console.error('Failed to read impersonation session', error);
    return res.status(500).json({ error: 'Could not read impersonation session.' });
  }
}
