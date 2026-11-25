import {
  ChatEventLike,
  displayContent,
  isEdit,
  latestEdits,
  replyToEventId,
  stripReplyFallback,
} from './messageContent';

type Content = Record<string, unknown>;

const event = (
  id: string,
  sender: string,
  ts: number,
  content: Content,
  { unsigned = {}, replacing = null }: { unsigned?: Record<string, unknown>; replacing?: ChatEventLike | null } = {}
): ChatEventLike => ({
  getId: () => id,
  getSender: () => sender,
  getTs: () => ts,
  getWireContent: () => content,
  getContent: () =>
    replacing ? ((replacing.getWireContent()['m.new_content'] as Content) ?? {}) : content,
  getUnsigned: () => unsigned,
  replacingEvent: () => replacing,
});

const edit = (id: string, sender: string, ts: number, originalId: string, body: string) =>
  event(id, sender, ts, {
    msgtype: 'm.text',
    body: `* ${body}`,
    'm.new_content': { msgtype: 'm.text', body },
    'm.relates_to': { rel_type: 'm.replace', event_id: originalId },
  });

const original = event('$orig', '@ina:test', 1, { msgtype: 'm.text', body: 'Treffen um 10' });

describe('edits', () => {
  it('recognises edit events, which are not shown themselves', () => {
    expect(isEdit(edit('$e1', '@ina:test', 2, '$orig', 'x'))).toBe(true);
    expect(isEdit(original)).toBe(false);
  });

  it('shows the newest edit from the loaded timeline', () => {
    const edits = latestEdits([
      original,
      edit('$e1', '@ina:test', 2, '$orig', 'Treffen um 11'),
      edit('$e2', '@ina:test', 3, '$orig', 'Treffen um 12'),
    ]);
    expect(displayContent(original, edits)).toEqual({
      content: { msgtype: 'm.text', body: 'Treffen um 12' },
      edited: true,
    });
  });

  it("ignores an edit by someone other than the original sender", () => {
    const edits = latestEdits([original, edit('$e1', '@mallory:test', 2, '$orig', 'Fällt aus')]);
    expect(displayContent(original, edits)).toEqual({ content: original.getContent(), edited: false });
  });

  it('uses the edit the server bundled when it is not in the loaded timeline', () => {
    const withBundle = event('$orig', '@ina:test', 1, { msgtype: 'm.text', body: 'alt' }, {
      unsigned: {
        'm.relations': {
          'm.replace': { sender: '@ina:test', content: { 'm.new_content': { msgtype: 'm.text', body: 'neu' } } },
        },
      },
    });
    expect(displayContent(withBundle, new Map())).toEqual({ content: { msgtype: 'm.text', body: 'neu' }, edited: true });
  });

  it('uses an edit matrix-js-sdk already applied', () => {
    const applied = edit('$e1', '@ina:test', 2, '$orig', 'neu');
    const replaced = event('$orig', '@ina:test', 1, { msgtype: 'm.text', body: 'alt' }, { replacing: applied });
    expect(displayContent(replaced, new Map())).toEqual({ content: { msgtype: 'm.text', body: 'neu' }, edited: true });
  });
});

describe('replies', () => {
  it('finds the replied-to message', () => {
    const reply = event('$r', '@tom:test', 2, {
      msgtype: 'm.text',
      body: 'ok',
      'm.relates_to': { 'm.in_reply_to': { event_id: '$orig' } },
    });
    expect(replyToEventId(reply)).toBe('$orig');
    expect(replyToEventId(original)).toBeUndefined();
  });

  it('removes the quote older clients put in front of a reply', () => {
    expect(stripReplyFallback('> <@ina:test> Treffen um 10\n> zweite Zeile\n\nPasst mir')).toBe('Passt mir');
    expect(stripReplyFallback('Keine Antwort')).toBe('Keine Antwort');
  });
});
