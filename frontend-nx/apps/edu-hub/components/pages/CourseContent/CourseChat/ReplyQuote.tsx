import { FC, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { MatrixClient, Room } from 'matrix-js-sdk';

import { stripReplyFallback } from './messageContent';

interface ReplyQuoteProps {
  client: MatrixClient;
  room: Room;
  eventId: string;
}

/** A short quote of the message a reply answers, above the reply. */
const ReplyQuote: FC<ReplyQuoteProps> = ({ client, room, eventId }) => {
  const t = useTranslations('matrixChat');
  const [quote, setQuote] = useState<{ sender: string; body: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loaded = room.findEventById(eventId);
    if (loaded) {
      const body = loaded.isRedacted() ? null : loaded.getContent().body;
      setQuote({ sender: loaded.getSender() ?? '', body: typeof body === 'string' ? body : null });
      return undefined;
    }
    // Not in the loaded timeline: GET /rooms/{roomId}/event/{eventId}
    client
      .fetchRoomEvent(room.roomId, eventId)
      .then((raw) => {
        const body = (raw.content as { body?: unknown } | undefined)?.body;
        if (!cancelled) setQuote({ sender: raw.sender ?? '', body: typeof body === 'string' ? body : null });
      })
      .catch(() => !cancelled && setQuote({ sender: '', body: null }));
    return () => {
      cancelled = true;
    };
  }, [client, room, eventId]);

  if (!quote) return null;

  return (
    <div className="mb-1 border-l-2 border-brand pl-2 text-xs opacity-90">
      {quote.sender && <span className="font-semibold">{room.getMember(quote.sender)?.name ?? quote.sender}</span>}
      <span className="line-clamp-2 whitespace-pre-wrap break-words">
        {quote.body !== null ? stripReplyFallback(quote.body) : t('reply_unavailable')}
      </span>
    </div>
  );
};

export default ReplyQuote;
