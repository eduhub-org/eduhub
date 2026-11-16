import { FC } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MdDeleteOutline, MdOutlinePushPin, MdPushPin } from 'react-icons/md';
import { EventStatus, EventType, MatrixEvent } from 'matrix-js-sdk';

interface ChatMessageProps {
  event: MatrixEvent;
  senderName: string;
  isOwn: boolean;
  onResend: (event: MatrixEvent) => void;
  /** Shown only when the signed-in user may delete this message. */
  canRedact: boolean;
  onRedact: (event: MatrixEvent) => void;
  /** Shown only when the signed-in user may change the room's pins. */
  canPin: boolean;
  isPinned: boolean;
  onTogglePin: (eventId: string) => void;
}

const ACTION_BUTTON =
  'inline-flex items-center gap-1 rounded px-1 text-xs text-label-secondary hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';

const ChatMessage: FC<ChatMessageProps> = ({
  event,
  senderName,
  isOwn,
  onResend,
  canRedact,
  onRedact,
  canPin,
  isPinned,
  onTogglePin,
}) => {
  const t = useTranslations('matrixChat');
  const locale = useLocale();
  const date = event.getDate();
  const time = date ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '';
  const fullDate = date ? date.toLocaleString(locale) : undefined;
  const eventId = event.getId();

  let body: string;
  let isPlaceholder = false;
  if (event.isRedacted()) {
    body = t('deleted');
    isPlaceholder = true;
  } else if (event.getType() === EventType.RoomMessageEncrypted) {
    body = t('encrypted');
    isPlaceholder = true;
  } else {
    const content = event.getContent();
    body = typeof content.body === 'string' ? content.body : t('unsupported');
    isPlaceholder = typeof content.body !== 'string';
  }

  const isSending = event.status === EventStatus.SENDING || event.status === EventStatus.QUEUED;
  const notSent = event.status === EventStatus.NOT_SENT;
  const showPin = canPin && !!eventId && !event.status && !event.isRedacted();

  return (
    <li className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      <div className="flex items-baseline gap-2 text-xs text-label-secondary">
        {!isOwn && <span className="font-semibold text-label-primary">{senderName}</span>}
        <time dateTime={date?.toISOString()} title={fullDate}>
          {time}
        </time>
        {isPinned && (
          <span className="inline-flex items-center gap-0.5 text-brand">
            <MdPushPin aria-hidden="true" />
            {t('pinned_badge')}
          </span>
        )}
      </div>
      <p
        className={`mt-1 max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm ${
          isOwn ? 'bg-brand text-white' : 'bg-bg-secondary text-label-primary'
        } ${isPlaceholder ? 'italic opacity-80' : ''} ${isSending ? 'opacity-60' : ''}`}
      >
        {body}
      </p>
      {(showPin || canRedact) && (
        <div className="mt-1 flex gap-2">
          {showPin && eventId && (
            <button type="button" className={ACTION_BUTTON} onClick={() => onTogglePin(eventId)}>
              {isPinned ? <MdPushPin aria-hidden="true" /> : <MdOutlinePushPin aria-hidden="true" />}
              {isPinned ? t('unpin') : t('pin')}
            </button>
          )}
          {canRedact && (
            <button type="button" className={ACTION_BUTTON} onClick={() => onRedact(event)}>
              <MdDeleteOutline aria-hidden="true" />
              {t('delete')}
            </button>
          )}
        </div>
      )}
      {isSending && <span className="mt-1 text-xs text-label-secondary">{t('sending')}</span>}
      {notSent && (
        <span className="mt-1 text-xs text-error">
          {t('not_sent')}{' '}
          <button type="button" className="underline" onClick={() => onResend(event)}>
            {t('retry')}
          </button>
        </span>
      )}
    </li>
  );
};

export default ChatMessage;
