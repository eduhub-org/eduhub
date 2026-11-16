import { FC } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { EventStatus, EventType, MatrixEvent } from 'matrix-js-sdk';

interface ChatMessageProps {
  event: MatrixEvent;
  senderName: string;
  isOwn: boolean;
  onResend: (event: MatrixEvent) => void;
}

const ChatMessage: FC<ChatMessageProps> = ({ event, senderName, isOwn, onResend }) => {
  const t = useTranslations('matrixChat');
  const locale = useLocale();
  const date = event.getDate();
  const time = date ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '';
  const fullDate = date ? date.toLocaleString(locale) : undefined;

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

  return (
    <li className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      <div className="flex items-baseline gap-2 text-xs text-label-secondary">
        {!isOwn && <span className="font-semibold text-label-primary">{senderName}</span>}
        <time dateTime={date?.toISOString()} title={fullDate}>
          {time}
        </time>
      </div>
      <p
        className={`mt-1 max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm ${
          isOwn ? 'bg-brand text-white' : 'bg-bg-secondary text-label-primary'
        } ${isPlaceholder ? 'italic opacity-80' : ''} ${isSending ? 'opacity-60' : ''}`}
      >
        {body}
      </p>
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
