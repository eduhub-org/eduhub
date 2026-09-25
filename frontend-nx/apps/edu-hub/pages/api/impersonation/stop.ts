import type { NextApiRequest, NextApiResponse } from 'next';

import { endImpersonation, isSameOrigin, noStore } from '../../../helpers/impersonation';

/**
 * Ends an impersonation. Closing the audit row matters more than clearing the
 * cookie: the proxy checks that row on every request, so this ends the
 * impersonation for every open tab, not just the one that pressed the button.
 *
 * Idempotent on purpose - a second click and an already-expired session both
 * land here and both succeed.
 */
export default async function impersonationStop(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  if (!isSameOrigin(req)) {
    return res.status(403).json({ error: 'Cross-origin request refused.' });
  }

  await endImpersonation(req, res);
  return res.status(200).json({ active: false });
}
