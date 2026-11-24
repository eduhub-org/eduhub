import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { CourseSetup } from '../mcp/operations';
import { createMcpServer } from '../mcp/server';
import { cleanSchema, invalidArguments, parseArguments, ProposalEvent, ToolSet, unknownTool } from './tools';

/**
 * The EduHub MCP server's course-setup tools (ADR 0006) for Organizers, run in-process through an
 * in-memory MCP client, so the Assistant sees exactly the tools and validation external clients
 * get. The CourseSetup is built with the asker's token and role (never admin).
 *
 * The model can read and propose, but never apply or discard: a Proposed Change is streamed to
 * the widget, whose Apply button calls /api/assistant/proposals itself. The model also never sees the signed
 * proposedChangeId, so it could not hand one to anything.
 */

/** Roles that may set up courses; others get no course-setup tools. */
export const COURSE_SETUP_ROLES = ['instructor', 'org_admin', 'admin'];

const NOT_FOR_MODEL = new Set(['apply_proposed_change', 'discard_proposed_change']);

const PROPOSED_FOR_MODEL =
  'Not saved yet. The Organizer sees before and after in the chat and applies or discards it with the buttons there.';

interface McpCallResult {
  isError?: boolean;
  content?: { type: string; text?: string }[];
}

const textOf = (result: McpCallResult) =>
  (result.content ?? [])
    .map((c) => (c.type === 'text' ? c.text ?? '' : ''))
    .join('');

export const createCourseSetupTools = async (
  setup: CourseSetup,
  stripSchemaKeys: string[] = []
): Promise<ToolSet & { close(): Promise<void> }> => {
  const server = createMcpServer(setup);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'eduhub-assistant', version: '1.0.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const { tools } = await client.listTools();
  const offered = tools.filter((t) => !NOT_FOR_MODEL.has(t.name));

  return {
    definitions: offered.map((t) => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description ?? '',
        parameters: cleanSchema(t.inputSchema, stripSchemaKeys),
      },
    })),
    async call(name, raw) {
      if (!offered.some((t) => t.name === name)) return unknownTool(name);
      const parsed = parseArguments(raw);
      if (!parsed.ok) return invalidArguments(parsed.message);
      if (!parsed.value || typeof parsed.value !== 'object' || Array.isArray(parsed.value)) {
        return invalidArguments('expected an object');
      }
      let result: McpCallResult;
      try {
        result = (await client.callTool({ name, arguments: parsed.value as Record<string, unknown> })) as McpCallResult;
      } catch (error) {
        // -32602: the server's schema validation refused the arguments.
        if ((error as { code?: number })?.code === -32602) return invalidArguments('see the tool schema');
        return { status: 'error', errorCode: 'TOOL_FAILED', content: JSON.stringify({ error: { code: 'TOOL_FAILED', message: 'The tool failed.' } }) };
      }
      const text = textOf(result);
      if (result.isError) {
        let body: { error?: { code?: string } } | null = null;
        try {
          body = JSON.parse(text);
        } catch {
          body = null;
        }
        if (!body?.error?.code) {
          // Not an OperationError: the SDK's input validation answers in plain text.
          return /validation/i.test(text) ? invalidArguments(text.slice(0, 500)) : { status: 'error', errorCode: 'TOOL_FAILED', content: JSON.stringify({ error: { code: 'TOOL_FAILED', message: 'The tool failed.' } }) };
        }
        return { status: 'error', errorCode: body.error.code, content: text };
      }
      if (name.startsWith('propose_')) {
        const proposal = JSON.parse(text) as ProposalEvent;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { proposedChangeId, ...forModel } = proposal;
        return {
          status: 'ok',
          content: JSON.stringify({ ...forModel, message: PROPOSED_FOR_MODEL }),
          proposal,
        };
      }
      return { status: 'ok', content: text };
    },
    async close() {
      await client.close();
      await server.close();
    },
  };
};
