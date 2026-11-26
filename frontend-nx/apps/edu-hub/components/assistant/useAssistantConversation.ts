import { useCallback, useEffect, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';

import {
  AssistantError,
  ChatMessagePayload,
  decideProposal,
  PageContext,
  ProposalDecision,
  ProposalOutcome,
  sendReport,
  streamChat,
} from './api';
import type { ProposalState } from './ProposedChangeCard';
import type { ReportState } from './ReportCard';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** What was sent about the page with a user message, shown to the user. */
  pageContext?: PageContext;
  proposals: ProposalState[];
  /** Report cards (issue #2234); missing in conversations stored before they existed. */
  reports?: ReportState[];
  error?: AssistantError;
  streaming?: boolean;
  /** The backend is running a tool (looking up data) for this reply. */
  lookingUp?: boolean;
  /** This answer's 👍/👎, kept with the conversation so it can't be sent twice. */
  rating?: 'up' | 'down';
}

const STORAGE_PREFIX = 'eduhub-assistant:';

/** Removes every stored conversation, e.g. after logout, so none outlives its login on a shared computer. */
export const clearStoredConversations = () => {
  try {
    Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Storage blocked: nothing was stored either.
  }
};

/**
 * Apply or discard requests on their way, by proposal key. Module scope, so they
 * outlive the component: navigating to another page remounts the widget, and
 * the new one must neither offer Apply again nor miss the outcome. A full page
 * reload clears this, as it also cancels the requests.
 */
const pending = new Map<string, { action: ProposalDecision; outcome: Promise<ProposalOutcome> }>();

const settle = (p: ProposalState, action: ProposalDecision, outcome: ProposalOutcome): ProposalState => {
  if (!outcome.ok) return { ...p, busy: false, status: 'FAILED', error: outcome.error };
  if (action === 'apply') return { ...p, busy: false, status: 'APPLIED' };
  // Discarding doesn't revoke the signed proposal on the server, so forget
  // its id: nothing in this tab can apply it afterwards.
  return { ...p, busy: false, status: 'DISCARDED', proposal: { ...p.proposal, proposedChangeId: '' } };
};

/** Report cards being sent; a second click before the first re-render must not send twice. */
const sendingReports = new Set<string>();

let counter = 0;
const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

const load = (key: string | null): ConversationMessage[] => {
  if (!key) return [];
  try {
    const stored = window.sessionStorage.getItem(key);
    if (!stored) return [];
    // A stream doesn't survive a remount. An apply does (see `pending`); one that
    // a reload cut off may or may not have been saved, so say exactly that.
    return (JSON.parse(stored) as ConversationMessage[]).map((message) => ({
      ...message,
      streaming: false,
      lookingUp: false,
      // A send a reload cut off may or may not have arrived; the user can ask about their reports.
      reports: message.reports?.map((r) =>
        r.busy ? { ...r, busy: false, status: 'FAILED', error: { code: 'NETWORK', message: '' } } : r
      ),
      proposals: message.proposals.map(
        (p): ProposalState =>
          p.busy && !pending.has(p.key)
            ? { ...p, busy: false, status: 'FAILED', error: { code: 'NETWORK', message: '' } }
            : p
      ),
    }));
  } catch {
    return [];
  }
};

/** The conversation as the backend wants it: text plus what became of each proposal. */
export const toPayload = (messages: ConversationMessage[]): ChatMessagePayload[] =>
  messages
    .filter((message) => message.content || message.proposals.length > 0 || (message.reports?.length ?? 0) > 0)
    .map(({ role, content, proposals, reports = [] }) => {
      const notes = [
        ...proposals.map(({ proposal, status }) => ({
          ...(proposal.proposedChangeId && { proposedChangeId: proposal.proposedChangeId }),
          kind: proposal.kind,
          courseId: proposal.courseId,
          status,
        })),
        // Report cards travel as notes too, so the model knows whether the user sent them.
        ...reports.map(({ draft, status }) => ({ kind: `report_${draft.kind}`, courseId: null, status })),
      ];
      return { role, content, ...(notes.length > 0 && { proposals: notes }) };
    });

/**
 * The conversation lives only in this tab: memory plus sessionStorage, which the
 * browser clears when the tab closes. It is keyed by user so a different login in
 * the same tab starts empty.
 */
export const useAssistantConversation = ({
  userId,
  role,
  locale,
}: {
  userId: string | null;
  role: string;
  locale: string;
}) => {
  const storageKey = userId ? `${STORAGE_PREFIX}${userId}` : null;
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const apollo = useApolloClient();
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  useEffect(() => {
    const loaded = load(storageKey);
    setMessages(loaded);
    // Pick up the outcome of an apply that an earlier mount started.
    loaded
      .flatMap((m) => m.proposals)
      .forEach(({ key }) => {
        const request = pending.get(key);
        request?.outcome.then((outcome) => updateProposal(key, (p) => settle(p, request.action, outcome)));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per stored conversation
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      if (messages.length === 0) window.sessionStorage.removeItem(storageKey);
      else window.sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // Storage full or blocked: the conversation still lives in memory.
    }
  }, [messages, storageKey]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const updateMessage = (id: string, update: (message: ConversationMessage) => ConversationMessage) =>
    setMessages((current) => current.map((message) => (message.id === id ? update(message) : message)));

  const send = useCallback(
    async (text: string, pageContext: PageContext) => {
      const content = text.trim();
      if (!content || sending) return;
      const userMessage: ConversationMessage = { id: newId(), role: 'user', content, pageContext, proposals: [] };
      const reply: ConversationMessage = {
        id: newId(),
        role: 'assistant',
        content: '',
        proposals: [],
        streaming: true,
      };
      const history = [...messages, userMessage];
      setMessages([...history, reply]);
      setSending(true);

      const controller = new AbortController();
      abortRef.current = controller;
      await streamChat(
        { locale, messages: toPayload(history), pageContext },
        role,
        (event) => {
          if (event.type === 'delta') {
            updateMessage(reply.id, (m) => ({ ...m, content: m.content + event.text }));
          } else if (event.type === 'proposal') {
            updateMessage(reply.id, (m) => ({
              ...m,
              proposals: [...m.proposals, { key: newId(), proposal: event.proposal, status: 'PROPOSED', busy: false }],
            }));
          } else if (event.type === 'report') {
            updateMessage(reply.id, (m) => ({
              ...m,
              reports: [...(m.reports ?? []), { key: newId(), draft: event.report, status: 'PROPOSED', busy: false }],
            }));
          } else if (event.type === 'tool') {
            updateMessage(reply.id, (m) => ({ ...m, lookingUp: event.status === 'running' }));
          } else if (event.type === 'error') {
            updateMessage(reply.id, (m) => ({ ...m, error: event.error }));
          }
        },
        controller.signal
      );
      updateMessage(reply.id, (m) => ({ ...m, streaming: false, lookingUp: false }));
      setSending(false);
    },
    [messages, sending, locale, role]
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const updateProposal = useCallback(
    (key: string, update: (state: ProposalState) => ProposalState) => {
      const apply = (current: ConversationMessage[]) =>
        current.map((message) =>
          message.proposals.some((p) => p.key === key)
            ? { ...message, proposals: message.proposals.map((p) => (p.key === key ? update(p) : p)) }
            : message
        );
      if (mounted.current) {
        setMessages(apply);
        return;
      }
      // The user left the page while the apply was on its way: record the outcome
      // in the stored conversation, so the card doesn't offer Apply again.
      if (!storageKey) return;
      try {
        const stored = window.sessionStorage.getItem(storageKey);
        if (stored) window.sessionStorage.setItem(storageKey, JSON.stringify(apply(JSON.parse(stored))));
      } catch {
        // Storage blocked: nothing was stored to correct.
      }
    },
    [storageKey]
  );

  const decide = useCallback(
    async (key: string, action: ProposalDecision) => {
      // Proposals are stateless signed tokens: two applies of one create_course
      // within milliseconds could create two courses. So a double click, or a
      // click while the first request is on its way, is dropped, and nothing
      // retries on its own.
      if (pending.has(key)) return;
      const state = messages.flatMap((m) => m.proposals).find((p) => p.key === key);
      if (!state || state.status === 'APPLIED' || state.status === 'DISCARDED') return;

      const request = { action, outcome: decideProposal(state.proposal.proposedChangeId, action, role, locale) };
      pending.set(key, request);
      updateProposal(key, (p) => ({ ...p, busy: true, error: undefined }));
      const outcome = await request.outcome;
      pending.delete(key);
      // The page behind the panel shows the course; reload its data so it shows the saved change.
      if (outcome.ok && action === 'apply') apollo.refetchQueries({ include: 'active' }).catch(() => undefined);
      updateProposal(key, (p) => settle(p, action, outcome));
    },
    [messages, role, locale, apollo, updateProposal]
  );

  const updateReport = (key: string, update: (state: ReportState) => ReportState) =>
    setMessages((current) =>
      current.map((message) =>
        message.reports?.some((r) => r.key === key)
          ? { ...message, reports: message.reports.map((r) => (r.key === key ? update(r) : r)) }
          : message
      )
    );

  /** Sends or dismisses a report card. Only the user's click calls this; a click while sending is dropped. */
  const decideReport = useCallback(
    async (key: string, action: 'send' | 'dismiss') => {
      const index = messages.findIndex((m) => m.reports?.some((r) => r.key === key));
      const state = messages[index]?.reports?.find((r) => r.key === key);
      if (!state || state.busy || sendingReports.has(key) || state.status === 'APPLIED' || state.status === 'DISCARDED') return;
      if (action === 'dismiss') {
        updateReport(key, (r) => ({ ...r, status: 'DISCARDED', error: undefined }));
        return;
      }
      // The page the user was on when they asked, where the problem happened.
      const route = [...messages.slice(0, index)].reverse().find((m) => m.role === 'user')?.pageContext?.route;
      sendingReports.add(key);
      updateReport(key, (r) => ({ ...r, busy: true, error: undefined }));
      const outcome = await sendReport(state.draft, { role, locale, route });
      sendingReports.delete(key);
      updateReport(key, (r) =>
        outcome.ok
          ? { ...r, busy: false, status: 'APPLIED' }
          : { ...r, busy: false, status: 'FAILED', error: outcome.error }
      );
    },
    [messages, role, locale]
  );

  /** Records (or, after a failed send, clears) the rating of one answer. */
  const rate = useCallback((id: string, rating: 'up' | 'down' | undefined) => {
    setMessages((current) => current.map((message) => (message.id === id ? { ...message, rating } : message)));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setSending(false);
    setMessages([]);
  }, []);

  return { messages, sending, send, stop, decide, decideReport, rate, reset };
};
