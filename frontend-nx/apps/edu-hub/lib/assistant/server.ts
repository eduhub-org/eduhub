import type { NextApiRequest } from 'next';
import { getToken } from 'next-auth/jwt';
import { readImpersonationCookie } from '../../helpers/impersonation';
import { createHasuraCourseStore } from '../mcp/hasuraCourseStore';
import { createCourseSetup } from '../mcp/operations';
import { readAssistantConfig } from './config';
import { COURSE_SETUP_ROLES, createCourseSetupTools } from './courseSetupTools';
import type { FeedbackHandlerDeps } from './feedback';
import type { ProposalsHandlerDeps } from './proposals';
import type { AssistantSession, ChatHandlerDeps } from './handler';
import { createRateLimiter } from './limits';
import { DEFAULT_CONTACT } from './prompt';
import { ChatProvider, createProvider } from './provider';
import { createHasuraSpendTracker, createMemorySpendTracker } from './spending';
import { createHasuraReportSearch, createReportTools } from './reportTools';
import type { ReportsHandlerDeps } from './reports';
import { combineToolSets } from './tools';
import { createUserTools } from './userTools';

/**
 * Production wiring of the Assistant's endpoints. One instance per server process, so the provider
 * keeps its cached Vertex AI token and the rate limiter its counts between requests.
 */

export const HASURA_URL =
  process.env.GRAPHQL_SSR_API_URL || process.env.GRAPHQL_URI || process.env.NEXT_PUBLIC_API_URL || '';

const HASURA_CLAIMS = 'https://hasura.io/jwt/claims';

interface SessionToken {
  accessToken?: string;
  error?: string;
  profile?: Record<string, { 'x-hasura-user-id'?: string; 'x-hasura-allowed-roles'?: string[] } | undefined>;
}

export const getAssistantSession = async (req: NextApiRequest): Promise<AssistantSession | null> => {
  const token = (await getToken({ req })) as SessionToken | null;
  const claims = token?.profile?.[HASURA_CLAIMS];
  const userId = claims?.['x-hasura-user-id'];
  if (!token?.accessToken || token.error || !userId) return null;
  return {
    accessToken: token.accessToken,
    userId,
    allowedRoles: claims?.['x-hasura-allowed-roles'] ?? [],
    impersonating: !!readImpersonationCookie(req),
  };
};

const stripSchemaKeys = (process.env.ASSISTANT_LLM_STRIP_SCHEMA_KEYS || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

let deps: ChatHandlerDeps | null = null;

export const assistantDeps = (): ChatHandlerDeps => {
  if (deps) return deps;
  const config = readAssistantConfig();
  const adminSecret = process.env.HASURA_ADMIN_SECRET;
  let provider: ChatProvider | null = null;
  deps = {
    config,
    getSession: getAssistantSession,
    provider: () => {
      if (!config.ok) throw new Error('Assistant is off');
      provider ??= createProvider(config.config);
      return provider;
    },
    spend:
      adminSecret && HASURA_URL
        ? createHasuraSpendTracker({ url: HASURA_URL, adminSecret })
        : createMemorySpendTracker(),
    // When the Assistant is off, the handler refuses before the rate limit is consulted.
    rateLimiter: createRateLimiter(config.ok ? config.config.limits : { rateShortMax: 0, rateShortWindowMs: 1, rateDailyMax: 0 }),
    contact: process.env.ASSISTANT_CONTACT || DEFAULT_CONTACT,
    buildTools: async (session, role) => {
      const caller = { url: HASURA_URL, token: session.accessToken, userId: session.userId };
      // Report search reads other people's open reports, so it needs the admin secret (reportTools.ts).
      const reportSearch = adminSecret && HASURA_URL ? createHasuraReportSearch({ url: HASURA_URL, adminSecret }) : null;
      const userTools = combineToolSets(createUserTools(caller, stripSchemaKeys), createReportTools(caller, reportSearch, stripSchemaKeys));
      const secret = process.env.MCP_PROPOSAL_SECRET;
      if (!COURSE_SETUP_ROLES.includes(role) || !secret) return userTools;
      // The course-setup tools act with the asker's token and chosen role, never as admin.
      const setup = createCourseSetup({
        store: createHasuraCourseStore({ url: HASURA_URL, token: session.accessToken, role }),
        secret,
      });
      const courseTools = await createCourseSetupTools(setup, stripSchemaKeys);
      return { ...combineToolSets(userTools, courseTools), close: courseTools.close };
    },
  };
  return deps;
};

let feedback: FeedbackHandlerDeps | null = null;

export const feedbackDeps = (): FeedbackHandlerDeps => {
  const { config, getSession, contact } = assistantDeps();
  feedback ??= {
    config,
    getSession,
    contact,
    hasuraUrl: HASURA_URL,
    // Ratings are rare: 10 per 10 minutes and 30 a day are plenty.
    rateLimiter: createRateLimiter({ rateShortMax: 10, rateShortWindowMs: 10 * 60_000, rateDailyMax: 30 }),
  };
  return feedback;
};

export const proposalsDeps: ProposalsHandlerDeps = {
  getSession: getAssistantSession,
  contact: process.env.ASSISTANT_CONTACT || DEFAULT_CONTACT,
  courseSetup: (session, role) => {
    const secret = process.env.MCP_PROPOSAL_SECRET;
    if (!secret || !HASURA_URL) return null;
    // As the user, with their token and role; never the admin secret.
    return createCourseSetup({
      store: createHasuraCourseStore({ url: HASURA_URL, token: session.accessToken, role }),
      secret,
    });
  },
};

export const reportsDeps: ReportsHandlerDeps = {
  getSession: getAssistantSession,
  hasuraUrl: HASURA_URL,
  contact: process.env.ASSISTANT_CONTACT || DEFAULT_CONTACT,
};
