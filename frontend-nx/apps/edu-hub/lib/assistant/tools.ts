import { z } from 'zod';
import type { ToolDefinition } from './provider';

/**
 * A set of tools the model may call. `call` takes the raw JSON string the model produced, so
 * arguments that don't parse or validate come back as `invalid` and the chat loop can let the
 * model retry once (issue #2193).
 */

export interface ProposalEvent {
  proposedChangeId: string;
  kind: string;
  courseId: number;
  before: unknown;
  after: unknown;
  expiresAt: string;
}

export type ToolResult =
  | { status: 'ok'; content: string; proposal?: ProposalEvent }
  /** The arguments didn't parse or validate, or the tool doesn't exist. */
  | { status: 'invalid'; content: string }
  /** The tool ran and refused (e.g. FORBIDDEN, REGISTRATIONS_EXIST); the model explains it. */
  | { status: 'error'; content: string; errorCode: string };

export interface ToolSet {
  definitions: ToolDefinition[];
  call(name: string, rawArguments: string): Promise<ToolResult>;
}

export const combineToolSets = (...sets: ToolSet[]): ToolSet => ({
  definitions: sets.flatMap((s) => s.definitions),
  call: (name, raw) => {
    const set = sets.find((s) => s.definitions.some((d) => d.function.name === name));
    return set ? set.call(name, raw) : Promise.resolve(unknownTool(name));
  },
});

export const unknownTool = (name: string): ToolResult => ({
  status: 'invalid',
  content: JSON.stringify({ error: { code: 'UNKNOWN_TOOL', message: `There is no tool "${name}".` } }),
});

export const invalidArguments = (message: string): ToolResult => ({
  status: 'invalid',
  content: JSON.stringify({
    error: { code: 'INVALID_ARGUMENTS', message: `The arguments do not match the tool's schema: ${message}` },
  }),
});

export const parseArguments = (raw: string): { ok: true; value: unknown } | { ok: false; message: string } => {
  try {
    return { ok: true, value: JSON.parse(raw || '{}') };
  } catch {
    return { ok: false, message: 'not valid JSON' };
  }
};

/** JSON-schema keywords some providers reject; `$schema` is always dropped. */
export const cleanSchema = (schema: unknown, strip: string[] = []): Record<string, unknown> => {
  const drop = new Set(['$schema', ...strip]);
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (!node || typeof node !== 'object') return node;
    return Object.fromEntries(
      Object.entries(node as Record<string, unknown>)
        .filter(([key]) => !drop.has(key))
        .map(([key, value]) => [key, key === 'properties' ? Object.fromEntries(Object.entries(value as object).map(([k, v]) => [k, walk(v)])) : walk(value)])
    );
  };
  return walk(schema) as Record<string, unknown>;
};

/** A tool backed by a zod schema; strict objects reject unknown arguments such as a user id. */
export interface ZodTool<S extends z.ZodType> {
  name: string;
  description: string;
  schema: S;
  run(args: z.infer<S>): Promise<unknown>;
}

export const zodToolSet = (tools: ZodTool<z.ZodType>[], strip: string[] = []): ToolSet => ({
  definitions: tools.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: cleanSchema(z.toJSONSchema(t.schema), strip) },
  })),
  async call(name, raw) {
    const tool = tools.find((t) => t.name === name);
    if (!tool) return unknownTool(name);
    const parsed = parseArguments(raw);
    if (!parsed.ok) return invalidArguments(parsed.message);
    const args = tool.schema.safeParse(parsed.value);
    if (!args.success) return invalidArguments(args.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; '));
    try {
      return { status: 'ok', content: JSON.stringify(await tool.run(args.data)) };
    } catch (error) {
      const code = (error as { code?: string })?.code ?? 'TOOL_FAILED';
      return { status: 'error', errorCode: code, content: JSON.stringify({ error: { code, message: 'The lookup failed.' } }) };
    }
  },
});
