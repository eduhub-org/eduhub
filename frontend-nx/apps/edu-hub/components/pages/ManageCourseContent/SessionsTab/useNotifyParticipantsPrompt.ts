import { useCallback, useEffect, useRef, useState } from 'react';
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

/** What the mail compares against: a session's time and locations as they were before an edit. */
export interface SessionSnapshot {
  sessionId: number;
  startDateTime: string;
  endDateTime: string;
  locations: { courseLocationId: number; locationAddressId: number | null }[];
}

interface NotifyParticipantsPrompt {
  /** Call after a session's timing or locations were saved. No-op when nobody would be mailed. */
  registerChange: (sessionId: number) => void;
  promptOpen: boolean;
  pendingCount: number;
  /** People the pending mails reach: course participants plus the registrants of the sessions' public events. */
  pendingRecipients: number;
  sending: boolean;
  confirm: () => Promise<void>;
  cancel: () => void;
  errorMessage: string | null;
  clearError: () => void;
  savedMessage: string | null;
  clearSaved: () => void;
}

/**
 * Collects the sessions whose timing or locations changed and asks once, after
 * a short pause, whether the course's participants should be informed. A session that
 * was opened as a public event also has the event's registrants to inform
 * (`eventRegistrantCount`), since its event follows the new time.
 *
 * Informing used to happen automatically via a Hasura event trigger on
 * Session; it now only happens when the editor confirms here.
 *
 * The mail says what the session was before, so each session's state is kept
 * from before its first edit (`snapshots` are the current states). It is only
 * moved on once the change was mailed, the prompt dismissed, or nobody was
 * there to mail: an edit's own refetch may land before or after
 * `registerChange`, so the state to move on to is fetched afresh
 * (`refreshSnapshots`) rather than taken from whatever was rendered last.
 */
const useNotifyParticipantsPrompt = (
  participantCount: number,
  eventRegistrantCount: (sessionId: number) => number = () => 0,
  snapshots: SessionSnapshot[] = [],
  refreshSnapshots?: () => Promise<SessionSnapshot[]>
): NotifyParticipantsPrompt => {
  const t = useTranslations('manageCourse');

  // A ref, not state: re-registering the same session while the prompt is
  // pending must not re-render or queue a second mail.
  const pendingSessionIds = useRef<Set<number>>(new Set());
  // Sessions whose course participants were mailed while their public event's
  // registrants were not: a retry mails only the event.
  const courseSentSessionIds = useRef<Set<number>>(new Set());
  const baselines = useRef<Map<number, SessionSnapshot>>(new Map());
  const latestSnapshots = useRef(snapshots);

  useEffect(() => {
    latestSnapshots.current = snapshots;
    snapshots.forEach((snapshot) => {
      if (!baselines.current.has(snapshot.sessionId)) baselines.current.set(snapshot.sessionId, snapshot);
    });
  }, [snapshots]);

  const refreshRef = useRef(refreshSnapshots);
  refreshRef.current = refreshSnapshots;

  // Called once the given edits are settled. Every edit is saved before it is
  // registered, so a fresh fetch shows its result. A session edited again in
  // the meantime is pending and keeps its state from before that edit.
  const resetBaselines = useCallback(async (sessionIds: number[]) => {
    let current = latestSnapshots.current;
    try {
      if (refreshRef.current) current = await refreshRef.current();
    } catch {
      // Fall back to the last rendered state.
    }
    sessionIds.forEach((sessionId) => {
      if (pendingSessionIds.current.has(sessionId)) return;
      const snapshot = current.find((candidate) => candidate.sessionId === sessionId);
      if (snapshot) baselines.current.set(sessionId, snapshot);
      else baselines.current.delete(sessionId);
    });
  }, []);

  const [promptOpen, setPromptOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingRecipients, setPendingRecipients] = useState(0);
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
    setPendingRecipients(
      [...pendingSessionIds.current].reduce((sum, id) => sum + eventRegistrantCount(id), participantCount)
    );
    setPromptOpen(true);
  }, PROMPT_DELAY_MS);

  const registerChange = useCallback(
    (sessionId: number) => {
      if (participantCount + eventRegistrantCount(sessionId) <= 0) {
        // Nobody to tell now, but whoever registers later must hear about the
        // next change compared with this state.
        void resetBaselines([sessionId]);
        return;
      }
      pendingSessionIds.current.add(sessionId);
      // A new change is news to the course participants as well.
      courseSentSessionIds.current.delete(sessionId);
      openPrompt();
    },
    [participantCount, eventRegistrantCount, openPrompt, resetBaselines]
  );

  const cancel = useCallback(() => {
    const dismissed = [...pendingSessionIds.current];
    pendingSessionIds.current.clear();
    void resetBaselines(dismissed);
    courseSentSessionIds.current.clear();
    setPendingCount(0);
    setPromptOpen(false);
  }, [resetBaselines]);

  const confirm = useCallback(async () => {
    const sessionIds = [...pendingSessionIds.current];
    setSending(true);
    const notified: number[] = [];
    let failure: string | null = null;

    try {
      for (const sessionId of sessionIds) {
        try {
          const skipCourse = courseSentSessionIds.current.has(sessionId);
          const baseline = baselines.current.get(sessionId);
          const previous = baseline
            ? {
                startDateTime: baseline.startDateTime,
                endDateTime: baseline.endDateTime,
                locations: baseline.locations,
              }
            : null;
          const { data } = await notifySessionParticipants({ variables: { sessionId, skipCourse, previous } });
          const result = data?.notifySessionParticipants;
          if (result?.success) {
            // Drop only what demonstrably went out, so retrying the rest
            // cannot mail an already-notified session a second time.
            pendingSessionIds.current.delete(sessionId);
            courseSentSessionIds.current.delete(sessionId);
            notified.push(sessionId);
          } else {
            if (result?.courseSent) courseSentSessionIds.current.add(sessionId);
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

    await resetBaselines(notified);
    if (failure) {
      setErrorMessage(failure);
    } else if (notified.length > 0) {
      setSavedMessage(t('SessionsTab.notify_participants.sent'));
    }
  }, [notifySessionParticipants, t, resetBaselines]);

  return {
    registerChange,
    promptOpen,
    pendingCount,
    pendingRecipients,
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
