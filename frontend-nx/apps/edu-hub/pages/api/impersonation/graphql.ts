import { parse as parseGraphQL } from 'graphql';
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  OPEN_SESSION_QUERY,
  OpenSessionResult,
  GRAPHQL_URI,
  adminClient,
  isSameOrigin,
  noStore,
  readImpersonationCookie,
  resolveAdminCaller,
} from '../../../helpers/impersonation';
import { AuthRoles } from '../../../types/enums';

/**
 * The impersonation GraphQL proxy.
 *
 * Every Apollo request made while impersonating comes here instead of going
 * straight to Hasura. This route is the whole security boundary, so it re-runs
 * every check on every request rather than trusting that `start` ran once:
 *
 *   1. same-origin POST
 *   2. the caller is a signed-in super-admin
 *   3. the impersonation cookie is one this server signed
 *   4. the recorded session is still open (so `stop` ends it everywhere)
 *   5. the document contains only queries -- see READ-ONLY below
 *   6. forward with the admin secret and a pinned role of `user`
 *
 * Nothing from the client is forwarded except the document, its variables and
 * its operation name. In particular the role and the user id are set here, so a
 * request cannot ask to be someone else or to be admin.
 *
 * READ-ONLY. Impersonation ships read-only, and this is the single place that
 * enforces it: a document is rejected unless every operation in it is a `query`.
 * Turning writes on later is IMPERSONATION_ALLOW_WRITES=true and nothing else --
 * which is also why it is worth knowing what that would open up. Hasura actions
 * are all mutations and their handlers trust `session_variables['x-hasura-user-id']`
 * verbatim, so today they are simply out of reach; enabling writes puts them in
 * reach of the impersonator and should come with per-mutation audit logging.
 */

const ALLOW_WRITES = process.env.IMPERSONATION_ALLOW_WRITES === 'true';

type GraphQLBody = {
  query?: unknown;
  variables?: unknown;
  operationName?: unknown;
};

/** True when every operation in the document is a read. */
export const isReadOnlyDocument = (query: string): boolean => {
  const document = parseGraphQL(query);
  const operations = document.definitions.filter((d) => d.kind === 'OperationDefinition');
  return operations.length > 0 && operations.every((d) => (d as { operation: string }).operation === 'query');
};

export default async function impersonationGraphQL(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ errors: [{ message: 'Method not allowed. Use POST.' }] });
  }
  if (!isSameOrigin(req)) {
    return res.status(403).json({ errors: [{ message: 'Cross-origin request refused.' }] });
  }

  const admin = await resolveAdminCaller(req);
  if (!admin) {
    return res.status(403).json({ errors: [{ message: 'Only super-admins may impersonate.' }] });
  }

  const payload = readImpersonationCookie(req);
  if (!payload) {
    return res.status(403).json({ errors: [{ message: 'No active impersonation.' }] });
  }

  const body = (req.body ?? {}) as GraphQLBody;
  const query = typeof body.query === 'string' ? body.query : null;
  if (!query) {
    return res.status(400).json({ errors: [{ message: 'query is required.' }] });
  }

  if (!ALLOW_WRITES) {
    let readOnly = false;
    try {
      readOnly = isReadOnlyDocument(query);
    } catch {
      return res.status(400).json({ errors: [{ message: 'Could not parse the GraphQL document.' }] });
    }
    if (!readOnly) {
      return res.status(403).json({
        errors: [
          {
            message: 'Impersonated sessions are read-only.',
            extensions: { code: 'IMPERSONATION_READ_ONLY' },
          },
        ],
      });
    }
  }

  try {
    const open = await adminClient().request<OpenSessionResult>(OPEN_SESSION_QUERY, {
      id: payload.sessionId,
      adminUserId: admin.userId,
    });
    const session = open.ImpersonationSession[0];
    if (!session || session.targetUserId !== payload.targetUserId) {
      return res.status(403).json({ errors: [{ message: 'This impersonation has ended.' }] });
    }

    const upstream = await fetch(GRAPHQL_URI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET as string,
        'x-hasura-role': AuthRoles.user,
        'x-hasura-user-id': payload.targetUserId,
      },
      body: JSON.stringify({
        query,
        variables: body.variables ?? {},
        operationName: typeof body.operationName === 'string' ? body.operationName : undefined,
      }),
    });

    const result = await upstream.json();
    return res.status(upstream.status).json(result);
  } catch (error) {
    // Operation name only: the variables and the response are the impersonated
    // person's data and have no business in a log line.
    console.error('Impersonation proxy failed', {
      sessionId: payload.sessionId,
      operationName: typeof body.operationName === 'string' ? body.operationName : undefined,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return res.status(502).json({ errors: [{ message: 'Upstream request failed.' }] });
  }
}
