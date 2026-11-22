/**
 * @jest-environment node
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createCourseSetup } from './operations';
import { createMcpServer } from './server';
import { createFakeCourseStore, createWorld, FakeWorld } from './testing/fakeCourseStore';

const connect = async (world: FakeWorld, userId: string, role: string) => {
  const server = createMcpServer(
    createCourseSetup({ store: createFakeCourseStore(world, userId, role), secret: 'test-secret' })
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
};

const call = async (client: Client, name: string, args: Record<string, unknown>) => {
  const result = (await client.callTool({ name, arguments: args })) as {
    isError?: boolean;
    content: { text: string }[];
  };
  return { isError: !!result.isError, body: JSON.parse(result.content[0].text) };
};

beforeEach(() => jest.spyOn(console, 'info').mockImplementation(() => undefined));
afterEach(() => jest.restoreAllMocks());

describe('EduHub MCP server', () => {
  it('lists the course-setup tools', async () => {
    const client = await connect(createWorld(), 'ins-1', 'instructor');
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      'apply_proposed_change',
      'discard_proposed_change',
      'get_course',
      'get_registration_count',
      'list_courses',
      'propose_course_settings',
      'propose_course_texts',
      'propose_sessions',
    ]);
    expect(tools.find((t) => t.name === 'apply_proposed_change')?.annotations?.destructiveHint).toBe(true);
  });

  it('proposes and applies a change over MCP', async () => {
    const world = createWorld();
    const client = await connect(world, 'ins-1', 'instructor');
    const proposed = await call(client, 'propose_course_texts', { courseId: 1, texts: { tagline: 'Neu' } });
    expect(proposed).toMatchObject({ isError: false, body: { status: 'PROPOSED', before: { tagline: 'Kurz' } } });
    expect(world.courses[0].fields.tagline).toBe('Kurz');

    const applied = await call(client, 'apply_proposed_change', { proposedChangeId: proposed.body.proposedChangeId });
    expect(applied).toMatchObject({ isError: false, body: { status: 'APPLIED' } });
    expect(world.courses[0].fields.tagline).toBe('Neu');
  });

  it('returns rule violations as tool errors with a code', async () => {
    const client = await connect(createWorld(), 'ins-2', 'instructor');
    const result = await call(client, 'propose_sessions', {
      courseId: 2,
      sessions: [{ title: 'X', startDateTime: '2027-01-26T18:00:00+01:00', endDateTime: '2027-01-26T19:00:00+01:00' }],
    });
    expect(result).toMatchObject({ isError: true, body: { error: { code: 'REGISTRATIONS_EXIST' } } });
  });

  it('rejects arguments outside the schema', async () => {
    const client = await connect(createWorld(), 'ins-1', 'instructor');
    const result = (await client.callTool({
      name: 'propose_course_texts',
      arguments: { courseId: 1, texts: { coverImage: 'x' } },
    })) as { isError?: boolean };
    expect(result.isError).toBe(true);
  });
});
