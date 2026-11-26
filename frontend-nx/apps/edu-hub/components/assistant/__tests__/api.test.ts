/**
 * @jest-environment node
 */
import { ChatEvent, parseSseBuffer, streamChat } from '../api';

describe('parseSseBuffer', () => {
  it('returns complete events and keeps the unfinished rest', () => {
    const { events, rest } = parseSseBuffer(
      'event: delta\ndata: {"text":"Hal"}\n\nevent: delta\ndata: {"text":"lo"}\n\nevent: del'
    );
    expect(events).toEqual([
      { type: 'delta', text: 'Hal' },
      { type: 'delta', text: 'lo' },
    ]);
    expect(rest).toBe('event: del');
  });

  it('parses proposals, errors and done, and skips unknown or broken events', () => {
    const proposal = { status: 'PROPOSED', proposedChangeId: 'p1', kind: 'course_texts', courseId: 1 };
    const { events } = parseSseBuffer(
      `event: proposal\ndata: ${JSON.stringify(proposal)}\n\n` +
        'event: ping\ndata: {}\n\n' +
        'event: tool\ndata: {"name":"search_catalogue","status":"running"}\n\n' +
        'event: delta\ndata: not json\n\n' +
        'event: error\r\ndata: {"code":"RATE_LIMITED","message":"slow down"}\r\n\r\n' +
        'event: done\ndata: {}\n\n'
    );
    expect(events).toEqual([
      { type: 'proposal', proposal },
      { type: 'tool', name: 'search_catalogue', status: 'running' },
      { type: 'error', error: { code: 'RATE_LIMITED', message: 'slow down' } },
      { type: 'done' },
    ]);
  });
});

describe('streamChat', () => {
  const streamOf = (chunks: string[]) => {
    const encoded = chunks.map((chunk) => new TextEncoder().encode(chunk));
    return {
      ok: true,
      body: {
        getReader: () => ({
          read: async () => (encoded.length ? { value: encoded.shift(), done: false } : { value: undefined, done: true }),
          cancel: async () => undefined,
        }),
      },
    };
  };

  const run = async (chunks: string[]) => {
    global.fetch = jest.fn().mockResolvedValue(streamOf(chunks)) as unknown as typeof fetch;
    const events: ChatEvent[] = [];
    await streamChat({ locale: 'en', messages: [], pageContext: { path: '/', route: '/' } }, 'user', (e) => events.push(e));
    return events;
  };

  it('ends normally on `done`', async () => {
    expect(await run(['event: delta\ndata: {"text":"Hi"}\n\n', 'event: done\ndata: {}\n\n'])).toEqual([
      { type: 'delta', text: 'Hi' },
      { type: 'done' },
    ]);
  });

  it('reports an interruption when the stream closes without `done`', async () => {
    expect(await run(['event: delta\ndata: {"text":"Half a"}\n\n'])).toEqual([
      { type: 'delta', text: 'Half a' },
      { type: 'error', error: { code: 'INTERRUPTED', message: '' } },
    ]);
  });
});
