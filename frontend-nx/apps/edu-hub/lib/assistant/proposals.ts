import type { NextApiRequest, NextApiResponse } from 'next';
import { OperationError, OperationErrorCode } from '../mcp/errors';
import type { CourseSetup } from '../mcp/operations';
import { COURSE_SETUP_ROLES } from './courseSetupTools';
import { AssistantSession, authenticate, refuse, requestedRole } from './handler';
import { errorMessage, toLocale } from './messages';
import { DEFAULT_CONTACT } from './prompt';

/**
 * Apply or discard a Proposed Change from the widget's buttons (issue #2193/#2194):
 * POST `{ proposedChangeId, action: 'apply' | 'discard' }` with the role in `x-hasura-role`.
 *
 * Only this endpoint saves a Proposed Change; the model has no tool for it, so only the
 * Organizer's click can. It runs the MCP operations with the user's own token and role, which
 * check the signature, the proposing user and role, expiry and staleness again.
 *
 * 200 with the operation's result, or `{ error: { code, message } }` with the OperationError code
 * and a message from `assistant.errors` in the asker's locale. The operation's own message is
 * never passed on: it can carry Hasura's raw error text.
 */

const STATUS: Record<OperationErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INVALID: 400,
  NO_CHANGE: 400,
  REGISTRATIONS_EXIST: 409,
  STALE: 409,
  TITLE_TAKEN: 409,
  EXPIRED: 410,
  HASURA_ERROR: 502,
};

export interface ProposalsHandlerDeps {
  getSession(req: NextApiRequest): Promise<AssistantSession | null>;
  /** The course-setup operations as this user and role, or null when the MCP server isn't configured. */
  courseSetup(session: AssistantSession, role: string): CourseSetup | null;
  /** Where people can write when saving fails. */
  contact?: string;
}

export const createProposalsHandler = (deps: ProposalsHandlerDeps) => async (req: NextApiRequest, res: NextApiResponse) => {
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
  const locale = toLocale(body.locale);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED' } });
  }
  const session = await authenticate(req, res, deps.getSession, locale);
  if (!session) return;
  const role = requestedRole(req);
  if (!COURSE_SETUP_ROLES.includes(role) || !session.allowedRoles.includes(role)) {
    return refuse(res, 403, 'ROLE_NOT_ALLOWED', locale);
  }
  const { proposedChangeId, action } = body;
  if (typeof proposedChangeId !== 'string' || !proposedChangeId || proposedChangeId.length > 50_000 || (action !== 'apply' && action !== 'discard')) {
    return refuse(res, 400, 'INVALID_REQUEST', locale);
  }
  const setup = deps.courseSetup(session, role);
  if (!setup) return refuse(res, 503, 'OFF', locale);

  try {
    const result =
      action === 'apply'
        ? await setup.applyProposedChange({ proposedChangeId })
        : await setup.discardProposedChange({ proposedChangeId });
    return res.status(200).json(result);
  } catch (error) {
    const params = { contact: deps.contact ?? DEFAULT_CONTACT };
    if (error instanceof OperationError && STATUS[error.code]) {
      const message = errorMessage(`PROPOSAL_${error.code}`, locale, params);
      return res.status(STATUS[error.code]).json({ error: { code: error.code, message } });
    }
    console.error('Assistant: applying or discarding a Proposed Change failed');
    return res.status(500).json({ error: { code: 'INTERNAL', message: errorMessage('PROPOSAL_FAILED', locale, params) } });
  }
};
