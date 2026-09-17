import type { NextApiRequest, NextApiResponse } from 'next';

import {
  adminClient,
  isSameOrigin,
  noStore,
  resolveAdminCaller,
  setImpersonationCookie,
} from '../../../helpers/impersonation';

const GET_TARGET = `
  query ImpersonationTarget($userId: uuid!) {
    User_by_pk(id: $userId) {
      id
      firstName
      lastName
      email
    }
  }
`;

const OPEN_SESSION = `
  mutation OpenImpersonationSession($adminUserId: uuid!, $targetUserId: uuid!) {
    insert_ImpersonationSession_one(
      object: { adminUserId: $adminUserId, targetUserId: $targetUserId }
    ) {
      id
    }
  }
`;

type Target = { id: string; firstName: string | null; lastName: string | null; email: string | null };

/**
 * Begins an impersonation: records it, then hands the browser an httpOnly cookie
 * naming the target. Everything that follows is authorised by that row plus the
 * caller's own admin session, re-checked on every proxied request.
 */
export default async function impersonationStart(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  if (!isSameOrigin(req)) {
    return res.status(403).json({ error: 'Cross-origin request refused.' });
  }

  const admin = await resolveAdminCaller(req);
  if (!admin) {
    return res.status(403).json({ error: 'Only super-admins may impersonate.' });
  }

  const userId = typeof req.body?.userId === 'string' ? req.body.userId : null;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required.' });
  }
  if (userId === admin.userId) {
    return res.status(409).json({ error: 'You are already yourself.' });
  }

  try {
    const client = adminClient();
    const { User_by_pk: target } = await client.request<{ User_by_pk: Target | null }>(GET_TARGET, {
      userId,
    });
    if (!target) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const opened = await client.request<{ insert_ImpersonationSession_one: { id: number } }>(
      OPEN_SESSION,
      { adminUserId: admin.userId, targetUserId: userId }
    );

    setImpersonationCookie(res, {
      targetUserId: userId,
      sessionId: opened.insert_ImpersonationSession_one.id,
      iat: Date.now(),
    });

    // Ids only: this is an audit line, not a place to copy personal data into logs.
    console.info('Impersonation started', {
      adminUserId: admin.userId,
      targetUserId: userId,
      sessionId: opened.insert_ImpersonationSession_one.id,
    });

    return res.status(200).json({ active: true, target });
  } catch (error) {
    console.error('Failed to start impersonation', error);
    return res.status(500).json({ error: 'Could not start impersonation.' });
  }
}
