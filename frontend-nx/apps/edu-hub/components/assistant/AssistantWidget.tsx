import { FC, FormEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MdArrowUpward,
  MdAutoAwesome,
  MdClose,
  MdHelpOutline,
  MdOutlineAddComment,
  MdOutlineAutoFixHigh,
  MdOutlineMail,
  MdStop,
} from 'react-icons/md';

import { useImpersonation } from '../../contexts/ImpersonationContext';
import {
  useCurrentRole,
  useCurrentUserId,
  useIsLoggedIn,
  useIsOrgAdmin,
  useIsSessionLoading,
} from '../../hooks/authentication';
import { AuthRoles } from '../../types/enums';
import { FeedbackControls } from './FeedbackControls';
import { buildPageContext, readVisibleError } from './pageContext';
import { ProposedChangeCard } from './ProposedChangeCard';
import { suggestionsFor } from './suggestions';
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

/** Text the reader can see; a reply of only whitespace counts as empty. */
const hasText = (message: ConversationMessage) => message.content.trim().length > 0;

const iconButton =
  'flex h-8 w-8 items-center justify-center rounded-lg text-label-secondary hover:bg-bg-secondary hover:text-label-primary disabled:opacity-50';

/** The page's own heading names it best; the path is the fallback. */
const readPageLabel = (path: string): string =>
  document.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80) || path;

/**
 * What goes along with a question, said once above the input instead of under
 * every message: the page, and an error shown on it.
 */
const ContextChip: FC = () => {
  const t = useTranslations('assistant.context');
  const router = useRouter();
  const [label, setLabel] = useState(router.asPath.split(/[?#]/)[0]);
  const [hasError, setHasError] = useState(false);

  // Follow the page, not only the route: a heading that loads later, or an error
  // that appears or goes away, changes what Send includes, so the chip says so too.
  useEffect(() => {
    const path = router.asPath.split(/[?#]/)[0];
    let frame = 0;
    const check = () => {
      frame = 0;
      setLabel(readPageLabel(path));
      setHasError(Boolean(readVisibleError()));
    };
    check();
    const observer = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(check);
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden', 'aria-hidden'],
    });
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [router.asPath]);

  return (
    <p
      className="max-w-full self-start truncate rounded-md bg-bg-secondary px-2 py-1 text-xs text-label-secondary"
      title={t(hasError ? 'chip_with_error' : 'chip', { page: label })}
    >
      {t(hasError ? 'chip_with_error' : 'chip', { page: label })}
    </p>
  );
};

const Reply: FC<{
  message: ConversationMessage;
  contactHref: string;
  onDecide: (id: string, action: 'apply' | 'discard') => void;
}> = ({ message, contactHref, onDecide }) => {
  const t = useTranslations('assistant');
  // A reply that ended without text, proposal or error must not leave an empty gap.
  const empty = !message.streaming && !hasText(message) && message.proposals.length === 0;
  const error = message.error ?? (empty ? { code: 'EMPTY_REPLY', message: '' } : undefined);
  return (
    <div className="min-w-0">
      {hasText(message) && (
        <div className="prose prose-sm prose-invert max-w-none break-words text-label-primary">
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
      {message.streaming && (message.lookingUp || !hasText(message)) && (
        <p className="text-sm text-label-secondary">{message.lookingUp ? t('looking_up') : t('thinking')}</p>
      )}
      {message.proposals.map((state) => (
        <ProposedChangeCard
          key={state.key}
          state={state}
          onApply={() => onDecide(state.key, 'apply')}
          onDiscard={() => onDecide(state.key, 'discard')}
        />
      ))}
      {error && (
        <p className="mt-1 text-sm text-error">
          {/* The backend sends `message` already in the user's language. */}
          {error.message || (t.has(`errors.${error.code}`) ? t(`errors.${error.code}`) : t('errors.generic'))}{' '}
          <a href={contactHref} className="text-label-secondary underline">
            {t('contact')}
          </a>
        </p>
      )}
    </div>
  );
};

const SuggestionGroup: FC<{ label: string; icon: ReactNode; items: string[]; onPick: (text: string) => void }> = ({
  label,
  icon,
  items,
  onPick,
}) => (
  <div className="flex flex-col gap-1">
    <h4 className="px-2 text-xs font-semibold text-label-disabled">{label}</h4>
    <ul className="flex flex-col">
      {items.map((text) => (
        <li key={text}>
          <button
            type="button"
            onClick={() => onPick(text)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-label-secondary hover:bg-bg-secondary hover:text-label-primary"
          >
            <span className="shrink-0 text-base text-label-disabled" aria-hidden="true">
              {icon}
            </span>
            {text}
          </button>
        </li>
      ))}
    </ul>
  </div>
);

const EmptyState: FC<{ role: string; onPick: (text: string) => void }> = ({ role, onPick }) => {
  const t = useTranslations('assistant');
  const router = useRouter();
  const { questions, tasks } = suggestionsFor(router.pathname, role);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold">{t('empty_title')}</h3>
        <p className="text-sm text-label-secondary">{t('intro')}</p>
      </div>
      <SuggestionGroup
        label={t('suggestions.questions_label')}
        icon={<MdHelpOutline />}
        items={questions.map((key) => t(`suggestions.questions.${key}`))}
        onPick={onPick}
      />
      {tasks.length > 0 && (
        <SuggestionGroup
          label={t('suggestions.tasks_label')}
          icon={<MdOutlineAutoFixHigh />}
          items={tasks.map((key) => t(`suggestions.tasks.${key}`))}
          onPick={onPick}
        />
      )}
    </div>
  );
};

type Conversation = ReturnType<typeof useAssistantConversation>;

const Chat: FC<{ conversation: Conversation; role: string; contactHref: string }> = ({
  conversation,
  role,
  contactHref,
}) => {
  const t = useTranslations('assistant');
  const router = useRouter();
  const { messages, sending, send, stop, decide, rate } = conversation;
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);

  // Grow with the text up to a few lines, then scroll.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }, [draft]);

  // Read the page when the question is sent, so the visible error is the current one.
  const ask = (text: string) => send(text, buildPageContext(router));

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (!draft.trim() || sending) return;
    ask(draft);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter that confirms an IME candidate (e.g. Japanese input) must not send the draft.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  };

  const lastAnswerId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div role="log" aria-live="polite" aria-label={t('conversation')} className="flex flex-col gap-5">
          {messages.length === 0 && <EmptyState role={role} onPick={(text) => !sending && ask(text)} />}
          {messages.map((message, index) =>
            message.role === 'user' ? (
              <div key={message.id} className="ml-auto max-w-[85%] min-w-0">
                <p className="sr-only">{t('you_wrote')}</p>
                <p className="whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-bg-secondary px-3.5 py-2.5 text-sm">
                  {message.content}
                </p>
              </div>
            ) : (
              <div key={message.id} className="group max-w-full">
                <p className="sr-only">{t('assistant_wrote')}</p>
                <Reply message={message} contactHref={contactHref} onDecide={decide} />
                {!message.streaming && !message.error && (hasText(message) || message.proposals.length > 0) && (
                  <FeedbackControls
                    persistent={message.id === lastAnswerId}
                    rated={message.rating}
                    onRate={(rating) => rate(message.id, rating)}
                    role={role}
                    route={router.pathname}
                    getMessages={() => toPayload(messages.slice(0, index + 1))}
                  />
                )}
              </div>
            )
          )}
          <div ref={endRef} />
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2 px-4 pb-4 pt-2">
        <ContextChip />
        <label htmlFor="assistant-input" className="sr-only">
          {t('input_label')}
        </label>
        <div className="flex items-end gap-2 rounded-2xl border border-border-primary bg-bg-primary py-2 pl-4 pr-2 focus-within:border-label-secondary">
          <textarea
            id="assistant-input"
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={4000}
            placeholder={t('input_placeholder')}
            className="max-h-40 min-w-0 flex-1 resize-none self-center bg-transparent py-1 text-sm text-label-primary placeholder:text-label-disabled focus:outline-none"
          />
          {sending ? (
            <button
              type="button"
              onClick={stop}
              aria-label={t('stop')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-label-primary text-bg-primary"
            >
              <MdStop aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label={t('send')}
              disabled={!draft.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-label-primary text-bg-primary disabled:bg-bg-secondary disabled:text-label-disabled"
            >
              <MdArrowUpward aria-hidden="true" />
            </button>
          )}
        </div>
      </form>
    </>
  );
};

/** Ctrl+K on Windows/Linux, ⌘K on macOS. */
const useIsMac = () => {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => setIsMac(/Mac|iPhone|iPad/.test(navigator.platform)), []);
  return isMac;
};

/**
 * The Assistant: a bar on every page that opens a drawer at the right edge, next
 * to the page the question is about. Logged-out visitors get a prompt to log in
 * instead. Shared, so StuJo can mount it later via `@eduhub/*`.
 */
export const AssistantWidget: FC<Props> = ({ privacyHref = '/privacy', contactHref = ASSISTANT_CONTACT_HREF }) => {
  const t = useTranslations('assistant');
  const [open, setOpen] = useState(false);
  const isLoggedIn = useIsLoggedIn();
  const isSessionLoading = useIsSessionLoading();
  const { target, loading: impersonationLoading } = useImpersonation();
  const userId = useCurrentUserId();
  const router = useRouter();
  const locale = useLocale();
  const role = useAssistantRole(router.asPath);
  const isMac = useIsMac();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isSessionLoading && !isLoggedIn) clearStoredConversations();
  }, [isSessionLoading, isLoggedIn]);

  // The Assistant acts with the signed-in person's own token. While an admin views
  // the app as someone else, that would be the admin, not the person on screen.
  const viewingAsSomeone = Boolean(target) || impersonationLoading;
  const canChat = isLoggedIn && !viewingAsSomeone;

  // Held here, not in the panel: closing the panel unmounts its content, and a
  // reply or an apply still on its way must keep its state and its outcome.
  const conversation = useAssistantConversation({ userId: canChat ? userId : null, role, locale });

  const close = () => {
    setOpen(false);
    // The launcher is back once the panel is gone; focus it on the next frame.
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  // The chat focuses its input; without a chat (logged out, loading, viewing as
  // someone else) focus the panel itself, so keyboard users land inside it.
  useEffect(() => {
    const panel = panelRef.current;
    if (open && panel && !panel.contains(document.activeElement)) panel.focus();
  }, [open, isSessionLoading, isLoggedIn, viewingAsSomeone]);

  // Escape closes the panel wherever focus is, since the page beside it stays
  // usable, unless another dialog or control already handled the key.
  useEffect(() => {
    if (!open) return undefined;
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('[role="dialog"], [role="alertdialog"]') && !target.closest('[data-assistant-panel]')) return;
      setOpen(false);
      requestAnimationFrame(() => buttonRef.current?.focus());
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [open]);

  useEffect(() => {
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      // Rich-text editors use Ctrl+K for links; leave it to them.
      const inEditor = event.target instanceof HTMLElement && event.target.isContentEditable;
      if (event.defaultPrevented || inEditor) return;
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  return (
    <>
      {!open && (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={t('open')}
          aria-keyshortcuts="Control+K Meta+K"
          className="fixed bottom-4 right-4 z-[1200] flex items-center gap-3 rounded-full border border-border-primary bg-bg-secondary p-3 text-label-secondary shadow-lg hover:text-label-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-label-primary sm:py-2.5 sm:pl-4 sm:pr-2.5"
        >
          <MdAutoAwesome className="text-xl text-brand-light" aria-hidden="true" />
          <span className="hidden text-sm sm:inline">{t('button')}</span>
          <kbd className="hidden rounded-md border border-border-primary bg-bg-primary px-2 py-0.5 font-sans text-xs text-label-disabled sm:inline">
            {isMac ? '⌘ K' : t('shortcut_ctrl')}
          </kbd>
        </button>
      )}

      {open && (
        <aside
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="false"
          aria-labelledby="assistant-title"
          data-assistant-panel
          className="fixed inset-0 z-[1200] flex flex-col bg-bg-primary focus:outline-none text-label-primary sm:left-auto sm:w-[400px] sm:border-l sm:border-border-primary sm:shadow-2xl"
        >
          <header className="flex items-center gap-2 border-b border-border-primary py-3 pl-5 pr-3">
            <div className="min-w-0 flex-1">
              <h2 id="assistant-title" className="font-bold">
                {t('title')}
              </h2>
              <p className="text-xs text-label-disabled">
                {t('ai_notice')}{' '}
                <a href={privacyHref} className="underline hover:text-label-secondary" target="_blank" rel="noopener noreferrer">
                  {t('privacy_link')}
                </a>
              </p>
            </div>
            {canChat && conversation.messages.length > 0 && (
              <button
                type="button"
                onClick={conversation.reset}
                disabled={conversation.sending}
                aria-label={t('new_conversation')}
                title={t('new_conversation')}
                className={iconButton}
              >
                <MdOutlineAddComment aria-hidden="true" />
              </button>
            )}
            <a href={contactHref} aria-label={t('contact')} title={t('contact')} className={iconButton}>
              <MdOutlineMail aria-hidden="true" />
            </a>
            <button type="button" onClick={close} aria-label={t('close')} className={iconButton}>
              <MdClose className="text-lg" aria-hidden="true" />
            </button>
          </header>

          {isSessionLoading ? null : !isLoggedIn ? (
            <div className="flex flex-col items-start gap-3 p-5">
              <p>{t('login_prompt')}</p>
              <button
                type="button"
                onClick={() => signIn('keycloak')}
                className="rounded-full bg-label-primary px-4 py-1 font-semibold text-bg-primary"
              >
                {t('login')}
              </button>
            </div>
          ) : viewingAsSomeone ? (
            <p className="p-5">{t('unavailable_viewing_as')}</p>
          ) : (
            <Chat conversation={conversation} role={role} contactHref={contactHref} />
          )}
        </aside>
      )}
    </>
  );
};
