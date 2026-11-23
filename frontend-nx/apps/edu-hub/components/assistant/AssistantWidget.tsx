import { FC, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MdOutlineChat } from 'react-icons/md';

import { DialogShell } from '../common/dialogs/DialogShell';
import { useImpersonation } from '../../contexts/ImpersonationContext';
import {
  useCurrentRole,
  useCurrentUserId,
  useIsLoggedIn,
  useIsOrgAdmin,
  useIsSessionLoading,
} from '../../hooks/authentication';
import { AuthRoles } from '../../types/enums';
import type { PageContext } from './api';
import { FeedbackControls } from './FeedbackControls';
import { buildPageContext } from './pageContext';
import { ProposedChangeCard } from './ProposedChangeCard';
import {
  clearStoredConversations,
  ConversationMessage,
  toPayload,
  useAssistantConversation,
} from './useAssistantConversation';

export const ASSISTANT_CONTACT_HREF = 'mailto:edu@opencampus.sh';

interface Props {
  /** Where the AI notice links to. StuJo can pass its own. */
  privacyHref?: string;
  /** Where to turn when the Assistant can't help. */
  contactHref?: string;
}

/**
 * The role the Assistant acts with. Org admins set up courses on the management
 * screens, where the app uses `org_admin`; everywhere else the normal role applies.
 */
const useAssistantRole = (path: string): string => {
  const currentRole = useCurrentRole();
  const isOrgAdmin = useIsOrgAdmin();
  if (currentRole !== AuthRoles.admin && isOrgAdmin && path.startsWith('/manage')) return AuthRoles.org_admin;
  return currentRole;
};

const SentContext: FC<{ context: PageContext }> = ({ context }) => {
  const t = useTranslations('assistant.context');
  return (
    <details className="mt-1 text-xs text-label-secondary">
      <summary className="cursor-pointer">{t('summary')}</summary>
      <ul className="pl-4">
        <li>{t('page', { path: context.path })}</li>
        {context.courseId && <li>{t('course', { id: context.courseId })}</li>}
        {context.sessionId && <li>{t('session', { id: context.sessionId })}</li>}
        {context.errorMessage && <li>{t('error', { message: context.errorMessage })}</li>}
      </ul>
    </details>
  );
};

const Reply: FC<{
  message: ConversationMessage;
  contactHref: string;
  onDecide: (id: string, action: 'apply' | 'discard') => void;
}> = ({ message, contactHref, onDecide }) => {
  const t = useTranslations('assistant');
  return (
    <div className="min-w-0">
      {message.content && (
        <div className="prose prose-sm max-w-none break-words text-label-primary">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              img: () => null,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      )}
      {message.streaming && (message.lookingUp || !message.content) && (
        <p className="text-label-secondary">{message.lookingUp ? t('looking_up') : t('thinking')}</p>
      )}
      {message.proposals.map((state) => (
        <ProposedChangeCard
          key={state.key}
          state={state}
          onApply={() => onDecide(state.key, 'apply')}
          onDiscard={() => onDecide(state.key, 'discard')}
        />
      ))}
      {message.error && (
        <p className="mt-1 text-error">
          {/* The backend sends `message` already in the user's language. */}
          {message.error.message ||
            (t.has(`errors.${message.error.code}`) ? t(`errors.${message.error.code}`) : t('errors.generic'))}{' '}
          <a href={contactHref} className="underline">
            {t('contact')}
          </a>
        </p>
      )}
    </div>
  );
};

const Chat: FC<{ userId: string | null; contactHref: string }> = ({ userId, contactHref }) => {
  const t = useTranslations('assistant');
  const router = useRouter();
  const locale = useLocale();
  const role = useAssistantRole(router.asPath);
  const { messages, sending, send, stop, decide, reset } = useAssistantConversation({ userId, role, locale });
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!draft.trim() || sending) return;
    // Read the page when the question is sent, so the visible error is the current one.
    send(draft, buildPageContext(router));
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) submit(event);
  };

  const hasReply = messages.some((m) => m.role === 'assistant' && !m.streaming && (m.content || m.proposals.length));

  return (
    <div className="flex min-h-0 flex-col gap-3" data-assistant-panel>
      <div role="log" aria-live="polite" aria-label={t('conversation')} className="flex flex-col gap-3">
        {messages.length === 0 && <p className="text-label-secondary">{t('intro')}</p>}
        {messages.map((message) =>
          message.role === 'user' ? (
            <div key={message.id} className="ml-auto max-w-[85%] min-w-0">
              <p className="sr-only">{t('you_wrote')}</p>
              <p className="whitespace-pre-wrap break-words rounded-lg bg-bg-secondary px-3 py-2">{message.content}</p>
              {message.pageContext && <SentContext context={message.pageContext} />}
            </div>
          ) : (
            <div key={message.id} className="max-w-full">
              <p className="sr-only">{t('assistant_wrote')}</p>
              <Reply message={message} contactHref={contactHref} onDecide={decide} />
            </div>
          )
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <label htmlFor="assistant-input" className="sr-only">
          {t('input_label')}
        </label>
        <textarea
          id="assistant-input"
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          maxLength={4000}
          placeholder={t('input_placeholder')}
          className="w-full resize-none rounded border border-border-primary bg-bg-card p-2 text-label-primary"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-label-secondary">{t('context_note')}</p>
          {sending ? (
            <button type="button" onClick={stop} className="rounded-full border border-label-primary px-4 py-1">
              {t('stop')}
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-full bg-cta px-4 py-1 text-label-primary hover:bg-cta-hover disabled:opacity-50"
            >
              {t('send')}
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-primary pt-2">
        {hasReply ? (
          <FeedbackControls
            key={messages[0]?.id}
            role={role}
            route={router.pathname}
            getMessages={() => toPayload(messages)}
          />
        ) : (
          <span />
        )}
        <div className="flex gap-3 text-xs">
          {messages.length > 0 && (
            <button type="button" onClick={reset} className="underline" disabled={sending}>
              {t('new_conversation')}
            </button>
          )}
          <a href={contactHref} className="underline">
            {t('contact')}
          </a>
        </div>
      </div>
    </div>
  );
};

/**
 * The Assistant: a button on every page that opens the chat. Logged-out visitors
 * get a prompt to log in instead. Shared, so StuJo can mount it later via `@eduhub/*`.
 */
export const AssistantWidget: FC<Props> = ({ privacyHref = '/privacy', contactHref = ASSISTANT_CONTACT_HREF }) => {
  const t = useTranslations('assistant');
  const [open, setOpen] = useState(false);
  const isLoggedIn = useIsLoggedIn();
  const isSessionLoading = useIsSessionLoading();
  const { target, loading: impersonationLoading } = useImpersonation();
  const userId = useCurrentUserId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isSessionLoading && !isLoggedIn) clearStoredConversations();
  }, [isSessionLoading, isLoggedIn]);

  // The Assistant acts with the signed-in person's own token. While an admin views
  // the app as someone else, that would be the admin, not the person on screen.
  const viewingAsSomeone = Boolean(target) || impersonationLoading;

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t('open')}
        className="light fixed bottom-4 right-4 z-[1200] flex items-center gap-2 rounded-full bg-cta px-4 py-3 text-label-primary shadow-lg hover:bg-cta-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-label-primary"
      >
        <MdOutlineChat className="text-xl" aria-hidden="true" />
        <span className="hidden sm:inline">{t('button')}</span>
      </button>

      <DialogShell
        open={open}
        onClose={close}
        title={t('title')}
        ariaLabelledBy="assistant-title"
        fullScreenOnMobile
      >
        <p className="sticky top-0 z-10 mb-3 rounded bg-bg-secondary p-2 text-xs text-label-primary shadow-sm">
          {t('ai_notice')}{' '}
          <a href={privacyHref} className="underline" target="_blank" rel="noopener noreferrer">
            {t('privacy_link')}
          </a>
        </p>

        {isSessionLoading ? null : !isLoggedIn ? (
          <div className="flex flex-col items-start gap-3">
            <p>{t('login_prompt')}</p>
            <button
              type="button"
              onClick={() => signIn('keycloak')}
              className="rounded-full bg-cta px-4 py-1 text-label-primary hover:bg-cta-hover"
            >
              {t('login')}
            </button>
          </div>
        ) : viewingAsSomeone ? (
          <p>{t('unavailable_viewing_as')}</p>
        ) : (
          <Chat userId={userId} contactHref={contactHref} />
        )}
      </DialogShell>
    </>
  );
};
