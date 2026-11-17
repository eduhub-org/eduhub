import { FC, FormEvent, KeyboardEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';
import { NotificationCountType, RoomEvent } from 'matrix-js-sdk';
import type { MatrixClient, MatrixEvent } from 'matrix-js-sdk';

import Button from '../../../common/Button';
import Loading from '../../../common/Loading';
import { SectionTitle } from '../../../common/SectionTitle';
import NotificationSnackbar from '../../../common/dialogs/NotificationSnackbar';
import { QuestionConfirmationDialog } from '../../../common/dialogs/QuestionConfirmationDialog';
import { useMatrixClient } from '../../../../hooks/useMatrixClient';
import ChatMessage from './ChatMessage';
import PinnedMessages from './PinnedMessages';
import { useRoomModeration } from './useRoomModeration';
import { useRoomTimeline } from './useRoomTimeline';

/** How close to the bottom (px) still counts as "reading the newest messages". */
const STICK_TO_BOTTOM_PX = 80;

const ChatRoom: FC<{
  client: MatrixClient;
  roomId: string;
  offline: boolean;
  onUnreadChange: (count: number) => void;
}> = ({ client, roomId, offline, onUnreadChange }) => {
  const t = useTranslations('matrixChat');
  const { room, events, edits, joinFailed, canLoadOlder, loadingOlder, loadOlder, send, resend } = useRoomTimeline(
    client,
    roomId
  );
  const { pinnedIds, canPin, canRedact, redact, togglePin } = useRoomModeration(client, room);
  const [draft, setDraft] = useState('');
  const [toRedact, setToRedact] = useState<MatrixEvent | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const heightBeforeOlder = useRef<number | null>(null);
  const ownUserId = client.getUserId();

  // New messages scroll into view while the reader is at the bottom; older
  // messages loaded above keep the current message where it is.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (heightBeforeOlder.current !== null) {
      list.scrollTop += list.scrollHeight - heightBeforeOlder.current;
      heightBeforeOlder.current = null;
    } else if (stickToBottom.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [events]);

  // Unread count as the homeserver computes it from read receipts and push rules.
  useEffect(() => {
    if (!room) return undefined;
    const update = () => onUnreadChange(room.getUnreadNotificationCount(NotificationCountType.Total));
    update();
    room.on(RoomEvent.UnreadNotifications, update);
    return () => {
      room.off(RoomEvent.UnreadNotifications, update);
    };
  }, [room, onUnreadChange]);

  // Someone reading the newest messages in a visible tab has read them: send a
  // read receipt (m.read) for the last message, which resets the unread count
  // on the server and so on every device.
  const markRead = useCallback(() => {
    const last = events[events.length - 1];
    const lastId = last?.getId();
    if (!room || !last || !lastId || last.status || !ownUserId) return;
    if (!stickToBottom.current || document.visibilityState !== 'visible') return;
    if (last.getSender() === ownUserId || room.hasUserReadEvent(ownUserId, lastId)) return;
    client.sendReadReceipt(last).catch((error) => console.warn('Could not send read receipt', error));
  }, [client, room, events, ownUserId]);

  useEffect(() => {
    markRead();
    document.addEventListener('visibilitychange', markRead);
    return () => document.removeEventListener('visibilitychange', markRead);
  }, [markRead]);

  const handleScroll = () => {
    const list = listRef.current;
    if (!list) return;
    const wasAtBottom = stickToBottom.current;
    stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < STICK_TO_BOTTOM_PX;
    if (stickToBottom.current && !wasAtBottom) markRead();
  };

  const handleLoadOlder = () => {
    heightBeforeOlder.current = listRef.current?.scrollHeight ?? null;
    loadOlder();
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    stickToBottom.current = true;
    send(text).catch((error) => console.error('Could not send the chat message', error));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit();
  };

  // The server has the last word on permissions (M_FORBIDDEN); say so if it refuses.
  const reportFailure = (error: unknown) => {
    console.error('Chat moderation action failed', error);
    setActionFailed(true);
  };

  const confirmRedact = () => {
    const event = toRedact;
    setToRedact(null);
    if (event) redact(event).catch(reportFailure);
  };

  const handleTogglePin = (eventId: string) => {
    togglePin(eventId).catch(reportFailure);
  };

  if (joinFailed) return <p className="text-label-secondary">{t('join_failed')}</p>;
  if (!room) return <Loading />;

  return (
    <div className="rounded-2xl border border-border-primary bg-bg-primary overflow-hidden">
      {offline && <p className="px-4 py-2 text-xs bg-bg-secondary text-label-secondary">{t('offline')}</p>}
      <PinnedMessages
        client={client}
        room={room}
        pinnedIds={pinnedIds}
        events={events}
        canPin={canPin}
        onUnpin={handleTogglePin}
      />
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-[28rem] overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label={t('title')}
      >
        <div className="flex justify-center mb-4">
          {canLoadOlder ? (
            <button
              type="button"
              onClick={handleLoadOlder}
              disabled={loadingOlder}
              className="text-xs text-label-secondary hover:text-brand underline disabled:no-underline"
            >
              {loadingOlder ? t('loading_older') : t('load_older')}
            </button>
          ) : (
            <span className="text-xs text-label-secondary">{events.length ? t('no_more') : t('empty')}</span>
          )}
        </div>
        <ul className="flex flex-col gap-3">
          {events.map((event) => {
            const sender = event.getSender() ?? '';
            return (
              <ChatMessage
                key={event.getId() ?? event.getTxnId()}
                client={client}
                room={room}
                event={event}
                edits={edits}
                senderName={room.getMember(sender)?.name ?? sender}
                isOwn={sender === ownUserId}
                onResend={resend}
                canRedact={canRedact(event)}
                onRedact={setToRedact}
                canPin={canPin}
                isPinned={pinnedIds.includes(event.getId() ?? '')}
                onTogglePin={handleTogglePin}
              />
            );
          })}
        </ul>
      </div>
      <form onSubmit={submit} className="flex items-end gap-3 border-t border-border-primary p-3">
        <label htmlFor="course-chat-composer" className="sr-only">
          {t('composer_label')}
        </label>
        <textarea
          id="course-chat-composer"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder={t('composer_placeholder')}
          className="flex-1 resize-none rounded-xl bg-bg-secondary px-3 py-2 text-sm text-label-primary placeholder:text-label-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
        <Button type="submit" filled disabled={!draft.trim()}>
          {t('send')}
        </Button>
      </form>
      <QuestionConfirmationDialog
        open={toRedact !== null}
        title={t('delete_title')}
        question={t('delete_question')}
        confirmationText={t('delete')}
        onClose={() => setToRedact(null)}
        onConfirm={confirmRedact}
      />
      <NotificationSnackbar
        open={actionFailed}
        onClose={() => setActionFailed(false)}
        message={t('action_failed')}
        duration={5000}
      />
    </div>
  );
};

/**
 * The course's Matrix room, embedded on the course page. Load it with
 * next/dynamic and `ssr: false`; it runs a sync loop in the browser.
 */
const CourseChat: FC<{ roomId: string }> = ({ roomId }) => {
  const t = useTranslations('matrixChat');
  const router = useRouter();
  const status = useMatrixClient();
  const [unread, setUnread] = useState(0);
  const [loginHref, setLoginHref] = useState('/matrix/login');

  useEffect(() => {
    setLoginHref(`/matrix/login?returnTo=${encodeURIComponent(router.asPath)}`);
  }, [router.asPath]);

  if (status.state === 'unavailable') return null;

  let content;
  if (status.state === 'ready' || status.state === 'offline') {
    content = (
      <ChatRoom
        client={status.client}
        roomId={roomId}
        offline={status.state === 'offline'}
        onUnreadChange={setUnread}
      />
    );
  } else if (status.state === 'needs-login') {
    content = (
      <div className="flex flex-col items-start gap-4 max-w-2xl">
        <p className="text-label-primary">{t('connect_intro')}</p>
        <Button as="a" href={loginHref} filled>
          {t('connect_button')}
        </Button>
      </div>
    );
  } else if (status.state === 'error') {
    content = (
      <div className="flex flex-col items-start gap-4 max-w-2xl">
        <p className="text-label-primary">{t('connect_failed')}</p>
        <Button onClick={() => window.location.reload()}>{t('try_again')}</Button>
      </div>
    );
  } else if (status.state === 'other-tab') {
    content = <p className="text-label-secondary">{t('other_tab')}</p>;
  } else {
    content = (
      <div className="flex items-center gap-3 text-label-secondary">
        <Loading />
        <span>{t('connecting')}</span>
      </div>
    );
  }

  return (
    <section className="max-w-3xl">
      <SectionTitle className="mb-6">
        <span className="inline-flex items-center gap-3">
          {t('title')}
          {unread > 0 && (status.state === 'ready' || status.state === 'offline') && (
            <span className="rounded-full bg-brand px-2.5 py-0.5 text-sm font-semibold text-white">
              {t('unread', { count: unread })}
            </span>
          )}
        </span>
      </SectionTitle>
      {content}
    </section>
  );
};

export default CourseChat;
