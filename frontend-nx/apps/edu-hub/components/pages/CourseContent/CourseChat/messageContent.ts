/**
 * How chat messages are shown: edits (m.replace) and replies (m.in_reply_to).
 *
 * Pure functions over a minimal event shape, so they can be tested without
 * matrix-js-sdk (MatrixEvent satisfies it).
 */

type Content = Record<string, unknown>;

export interface ChatEventLike {
  getId(): string | undefined;
  getSender(): string | undefined;
  getTs(): number;
  getContent(): Content;
  getWireContent(): Content;
  getUnsigned(): Record<string, unknown>;
  replacingEvent(): ChatEventLike | null;
}

const relatesTo = (event: ChatEventLike): Content | undefined => {
  const relation = event.getWireContent()['m.relates_to'];
  return relation && typeof relation === 'object' ? (relation as Content) : undefined;
};

/** An edit of another message. It is not shown itself; the original shows its new text. */
export const isEdit = (event: ChatEventLike): boolean => relatesTo(event)?.rel_type === 'm.replace';

const editedEventId = (event: ChatEventLike): string | undefined => {
  const id = relatesTo(event)?.event_id;
  return typeof id === 'string' ? id : undefined;
};

/** The newest edit per original message id, from the loaded timeline. */
export const latestEdits = (events: ChatEventLike[]): Map<string, ChatEventLike> => {
  const edits = new Map<string, ChatEventLike>();
  events.filter(isEdit).forEach((edit) => {
    const originalId = editedEventId(edit);
    if (!originalId) return;
    const known = edits.get(originalId);
    if (!known || known.getTs() <= edit.getTs()) edits.set(originalId, edit);
  });
  return edits;
};

const newContentOf = (edit: { content?: unknown } | Content | undefined): Content | null => {
  const content = (edit && 'content' in edit ? edit.content : undefined) as Content | undefined;
  const replacement = content?.['m.new_content'];
  return replacement && typeof replacement === 'object' ? (replacement as Content) : null;
};

/**
 * The content to show for a message and whether it was edited. Only the
 * original sender may edit a message; anyone else's m.replace is ignored.
 */
export const displayContent = (
  event: ChatEventLike,
  edits: Map<string, ChatEventLike>
): { content: Content; edited: boolean } => {
  const sender = event.getSender();

  // 1. matrix-js-sdk already applied an edit it saw (getContent returns m.new_content).
  const applied = event.replacingEvent();
  if (applied && applied.getSender() === sender) return { content: event.getContent(), edited: true };

  // 2. An edit in the loaded timeline.
  const id = event.getId();
  const loaded = id ? edits.get(id) : undefined;
  if (loaded && loaded.getSender() === sender) {
    const replacement = newContentOf({ content: loaded.getWireContent() });
    if (replacement) return { content: replacement, edited: true };
  }

  // 3. The newest edit the server bundled with the original (unsigned m.relations).
  const relations = event.getUnsigned()['m.relations'] as Content | undefined;
  const bundled = relations?.['m.replace'] as { sender?: string; content?: Content } | undefined;
  if (bundled?.sender === sender) {
    const replacement = newContentOf(bundled);
    if (replacement) return { content: replacement, edited: true };
  }

  return { content: event.getContent(), edited: false };
};

/** The id of the message this one replies to, if any. */
export const replyToEventId = (event: ChatEventLike): string | undefined => {
  const inReplyTo = relatesTo(event)?.['m.in_reply_to'] as Content | undefined;
  return typeof inReplyTo?.event_id === 'string' ? inReplyTo.event_id : undefined;
};

/**
 * Older clients put a quote of the replied-to message in front of the reply
 * ("> <@alice:server> original\n\nreply"). We show the quote ourselves, so the
 * fallback is removed from the text.
 */
export const stripReplyFallback = (body: string): string => {
  const lines = body.split('\n');
  let index = 0;
  while (index < lines.length && lines[index].startsWith('>')) index += 1;
  if (index === 0) return body;
  if (lines[index] === '') index += 1;
  return lines.slice(index).join('\n');
};
