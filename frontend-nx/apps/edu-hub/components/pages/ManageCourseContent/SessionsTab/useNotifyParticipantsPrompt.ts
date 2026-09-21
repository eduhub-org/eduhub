import { useCallback, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useTranslations } from 'next-intl';

import { useRoleMutation } from '../../../../hooks/authedMutation';
import { NOTIFY_SESSION_PARTICIPANTS } from '../../../../queries/actions';
import {
  NotifySessionParticipants,
  NotifySessionParticipantsVariables,
} from '../../../../queries/__generated__/NotifySessionParticipants';

// Long enough to swallow TimePicker's own 300 ms save debounce and the two
// sequential mutations a single date change fires, so one editing burst asks
// once instead of once per saved field.
const PROMPT_DELAY_MS = 2000;

interface NotifyParticipantsPrompt {
  /** Call after a session's timing was saved. No-op when nobody would be mailed. */
  registerChange: (sessionId: number) => void;
  promptOpen: boolean;
  pendingCount: number;
  sending: boolean;
  confirm: () => Promise<void>;
  cancel: () => void;
  errorMessage: string | null;
  clearError: () => void;
  savedMessage: string | null;
  clearSaved: () => void;
}

/**
 * Collects the sessions whose timing changed and asks once, after a short
 * pause, whether the course's participants should be informed.
 *
 * Informing used to happen automatically via a Hasura event trigger on
 * Session; it now only happens when the editor confirms here.
 */
const useNotifyParticipantsPrompt = (participantCount: number): NotifyParticipantsPrompt => {
  const t = useTranslations('manageCourse');

  // A ref, not state: re-registering the same session while the prompt is
  // pending must not re-render or queue a second mail.
  const pendingSessionIds = useRef<Set<number>>(new Set());

  const [promptOpen, setPromptOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [notifySessionParticipants] = useRoleMutation<
    NotifySessionParticipants,
    NotifySessionParticipantsVariables
  >(NOTIFY_SESSION_PARTICIPANTS);

  const openPrompt = useDebouncedCallback(() => {
    if (pendingSessionIds.current.size === 0) return;
    setPendingCount(pendingSessionIds.current.size);
    setPromptOpen(true);
  }, PROMPT_DELAY_MS);

  const registerChange = useCallback(
    (sessionId: number) => {
      if (participantCount <= 0) return;
      pendingSessionIds.current.add(sessionId);
      openPrompt();
    },
    [participantCount, openPrompt]
  );

  const cancel = useCallback(() => {
    pendingSessionIds.current.clear();
    setPendingCount(0);
    setPromptOpen(false);
  }, []);

  const confirm = useCallback(async () => {
    const sessionIds = [...pendingSessionIds.current];
    setSending(true);
    let notified = 0;
    let failure: string | null = null;

    try {
      for (const sessionId of sessionIds) {
        try {
          const { data } = await notifySessionParticipants({ variables: { sessionId } });
          const result = data?.notifySessionParticipants;
          if (result?.success) {
            // Drop only what demonstrably went out, so retrying the rest
            // cannot mail an already-notified session a second time.
            pendingSessionIds.current.delete(sessionId);
            notified += 1;
          } else {
            failure = result?.error || t('SessionsTab.notify_participants.failed');
          }
        } catch (error) {
          failure = error instanceof Error ? error.message : t('SessionsTab.notify_participants.failed');
        }
      }
    } finally {
      const remaining = pendingSessionIds.current.size;
      setPendingCount(remaining);
      setSending(false);
      // Whatever did not go out keeps the prompt open behind the error, so
      // confirming again retries just those sessions.
      setPromptOpen(remaining > 0);
    }

    if (failure) {
      setErrorMessage(failure);
    } else if (notified > 0) {
      setSavedMessage(t('SessionsTab.notify_participants.sent'));
    }
  }, [notifySessionParticipants, t]);

  return {
    registerChange,
    promptOpen,
    pendingCount,
    sending,
    confirm,
    cancel,
    errorMessage,
    clearError: useCallback(() => setErrorMessage(null), []),
    savedMessage,
    clearSaved: useCallback(() => setSavedMessage(null), []),
  };
};

export default useNotifyParticipantsPrompt;
