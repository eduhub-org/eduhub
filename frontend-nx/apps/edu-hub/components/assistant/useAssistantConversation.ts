import { useCallback, useEffect, useRef, useState } from 'react';

import {
  AssistantError,
  ChatMessagePayload,
  decideProposal,
  PageContext,
  ProposalDecision,
  streamChat,
} from './api';
import type { ProposalState } from './ProposedChangeCard';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** What was sent about the page with a user message, shown to the user. */
  pageContext?: PageContext;
  proposals: ProposalState[];
  error?: AssistantError;
  streaming?: boolean;
  /** The backend is running a tool (looking up data) for this reply. */
  lookingUp?: boolean;
}

const STORAGE_PREFIX = 'eduhub-assistant:';

let counter = 0;
const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

const load = (key: string | null): ConversationMessage[] => {
  if (!key) return [];
  try {
    const stored = window.sessionStorage.getItem(key);
    if (!stored) return [];
    // A reload mid-stream or mid-apply leaves nothing in flight.
    return (JSON.parse(stored) as ConversationMessage[]).map((message) => ({
      ...message,
      streaming: false,
      lookingUp: false,
      proposals: message.proposals.map((p) => ({ ...p, busy: false })),
    }));
  } catch {
    return [];
  }
};

/** The conversation as the backend wants it: text plus what became of each proposal. */
export const toPayload = (messages: ConversationMessage[]): ChatMessagePayload[] =>
  messages
    .filter((message) => message.content || message.proposals.length > 0)
    .map(({ role, content, proposals }) => ({
      role,
      content,
      ...(proposals.length > 0 && {
        proposals: proposals.map(({ proposal, status }) => ({
          ...(proposal.proposedChangeId && { proposedChangeId: proposal.proposedChangeId }),
          kind: proposal.kind,
          courseId: proposal.courseId,
          status,
        })),
      }),
    }));

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
  const deciding = useRef(new Set<string>());

  useEffect(() => {
    setMessages(load(storageKey));
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
      const reply: ConversationMessage = { id: newId(), role: 'assistant', content: '', proposals: [], streaming: true };
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

  const updateProposal = (key: string, update: (state: ProposalState) => ProposalState) =>
    setMessages((current) =>
      current.map((message) =>
        message.proposals.some((p) => p.key === key)
          ? { ...message, proposals: message.proposals.map((p) => (p.key === key ? update(p) : p)) }
          : message
      )
    );

  const decide = useCallback(
    async (key: string, action: ProposalDecision) => {
      // Proposals are stateless signed tokens: two applies of one create_course
      // within milliseconds could create two courses. So a double click, or a
      // click while the first request is on its way, is dropped, and nothing
      // retries on its own.
      if (deciding.current.has(key)) return;
      const state = messages.flatMap((m) => m.proposals).find((p) => p.key === key);
      if (!state || state.status === 'APPLIED' || state.status === 'DISCARDED') return;

      deciding.current.add(key);
      updateProposal(key, (p) => ({ ...p, busy: true, error: undefined }));
      const outcome = await decideProposal(state.proposal.proposedChangeId, action, role);
      deciding.current.delete(key);
      updateProposal(key, (p) => {
        if (!outcome.ok) return { ...p, busy: false, status: 'FAILED', error: outcome.error };
        if (action === 'apply') return { ...p, busy: false, status: 'APPLIED' };
        // Discarding doesn't revoke the signed proposal on the server, so forget
        // its id: nothing in this tab can apply it afterwards.
        return { ...p, busy: false, status: 'DISCARDED', proposal: { ...p.proposal, proposedChangeId: '' } };
      });
    },
    [messages, role]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setSending(false);
    setMessages([]);
  }, []);

  return { messages, sending, send, stop, decide, reset };
};
