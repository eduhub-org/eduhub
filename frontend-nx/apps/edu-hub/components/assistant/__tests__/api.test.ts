import { parseSseBuffer } from '../api';

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
        'event: delta\ndata: not json\n\n' +
        'event: error\r\ndata: {"code":"RATE_LIMITED","message":"slow down"}\r\n\r\n' +
        'event: done\ndata: {}\n\n'
    );
    expect(events).toEqual([
      { type: 'proposal', proposal },
      { type: 'error', error: { code: 'RATE_LIMITED', message: 'slow down' } },
      { type: 'done' },
    ]);
  });
});
