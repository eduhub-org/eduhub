import type { NextApiRequest, NextApiResponse } from 'next';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createHasuraCourseStore, pickRole } from '../../lib/mcp/hasuraCourseStore';
import { createCourseSetup } from '../../lib/mcp/operations';
import { createMcpServer } from '../../lib/mcp/server';

/**
 * EduHub MCP server endpoint (ADR 0006), Streamable HTTP transport in stateless mode.
 *
 * Auth: `Authorization: Bearer <Keycloak access token>` (the one NextAuth holds for the user) and
 * optionally `x-hasura-role`. Both are passed to Hasura unchanged, so the caller can never do more
 * than their own role allows; the admin secret is never used here.
 */
const HASURA_URL = process.env.GRAPHQL_SSR_API_URL || process.env.GRAPHQL_URI || process.env.NEXT_PUBLIC_API_URL;
const PROPOSAL_SECRET = process.env.MCP_PROPOSAL_SECRET;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    // Stateless server: no server-initiated streams (GET) and no sessions to end (DELETE).
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
  }
  if (!HASURA_URL || !PROPOSAL_SECRET) {
    return res.status(503).json({ jsonrpc: '2.0', error: { code: -32000, message: 'MCP server is not configured.' }, id: null });
  }
  const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ jsonrpc: '2.0', error: { code: -32001, message: 'A bearer token is required.' }, id: null });
  }

  const requestedRole = req.headers['x-hasura-role'];
  const role = pickRole(token, Array.isArray(requestedRole) ? requestedRole[0] : requestedRole);
  const store = createHasuraCourseStore({ url: HASURA_URL, token, role });
  const server = createMcpServer(createCourseSetup({ store, secret: PROPOSAL_SECRET }));
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
};

export default handler;
