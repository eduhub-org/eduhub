import { FC, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MdPushPin } from 'react-icons/md';
import type { MatrixClient, MatrixEvent, Room } from 'matrix-js-sdk';

interface PinnedMessage {
  id: string;
  sender: string;
  body: string | null; // null: deleted or not loadable
}

interface PinnedMessagesProps {
  client: MatrixClient;
  room: Room;
  pinnedIds: string[];
  /** The loaded timeline, so pins that are already loaded need no extra request. */
  events: MatrixEvent[];
  canPin: boolean;
  onUnpin: (eventId: string) => void;
}

const bodyOf = (content: Record<string, unknown> | undefined): string | null =>
  typeof content?.body === 'string' ? content.body : null;

/** Announcements pinned by the instructors, newest pin first, above the timeline. */
const PinnedMessages: FC<PinnedMessagesProps> = ({ client, room, pinnedIds, events, canPin, onUnpin }) => {
  const t = useTranslations('matrixChat');
  const [messages, setMessages] = useState<PinnedMessage[]>([]);

  useEffect(() => {
    let cancelled = false;
    const resolve = async (id: string): Promise<PinnedMessage> => {
      const loaded = room.findEventById(id);
      if (loaded) {
        return { id, sender: loaded.getSender() ?? '', body: loaded.isRedacted() ? null : bodyOf(loaded.getContent()) };
      }
      try {
        // An older announcement is usually not in the loaded timeline:
        // GET /rooms/{roomId}/event/{eventId}
        const raw = await client.fetchRoomEvent(room.roomId, id);
        return { id, sender: raw.sender ?? '', body: bodyOf(raw.content as Record<string, unknown>) };
      } catch {
        return { id, sender: '', body: null };
      }
    };
    Promise.all([...pinnedIds].reverse().map(resolve)).then((resolved) => {
      if (!cancelled) setMessages(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [client, room, pinnedIds, events]);

  if (messages.length === 0) return null;

  return (
    <section aria-label={t('pinned_title')} className="border-b border-border-primary bg-bg-secondary px-4 py-3">
      <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-label-secondary">
        <MdPushPin aria-hidden="true" />
        {t('pinned_title')}
      </h3>
      <ul className="mt-2 flex flex-col gap-2">
        {messages.map((message) => (
          <li key={message.id} className="flex items-start gap-3 text-sm">
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-label-primary">
                {room.getMember(message.sender)?.name ?? message.sender}
              </span>{' '}
              <span
                className={`text-label-primary line-clamp-2 whitespace-pre-wrap break-words ${
                  message.body === null ? 'italic opacity-80' : ''
                }`}
              >
                {message.body ?? t('deleted')}
              </span>
            </div>
            {canPin && (
              <button
                type="button"
                onClick={() => onUnpin(message.id)}
                className="shrink-0 text-xs text-label-secondary underline hover:text-brand"
              >
                {t('unpin')}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default PinnedMessages;
