import { act, renderHook, waitFor } from '@testing-library/react';

import useNotifyParticipantsPrompt from '../useNotifyParticipantsPrompt';

// Keys are asserted directly — the wording lives in the locale files.
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const notifyMutation = jest.fn();
jest.mock('../../../../../hooks/authedMutation', () => ({
  useRoleMutation: () => [(...args: unknown[]) => notifyMutation(...args)],
}));

const PROMPT_DELAY_MS = 2000;

const succeed = () => notifyMutation.mockResolvedValue({ data: { notifySessionParticipants: { success: true } } });

describe('useNotifyParticipantsPrompt', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    notifyMutation.mockReset();
    succeed();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const settle = () => act(() => { jest.advanceTimersByTime(PROMPT_DELAY_MS); });

  it('stays silent when the course has no participants', () => {
    const { result } = renderHook(() => useNotifyParticipantsPrompt(0));

    act(() => result.current.registerChange(1));
    settle();

    expect(result.current.promptOpen).toBe(false);
  });

  it("asks for a session whose public event has registrants, counting them in", () => {
    const eventRegistrants = (sessionId: number) => (sessionId === 1 ? 3 : 0);
    const { result } = renderHook(() => useNotifyParticipantsPrompt(0, eventRegistrants));

    act(() => result.current.registerChange(2));
    settle();
    expect(result.current.promptOpen).toBe(false);

    act(() => result.current.registerChange(1));
    settle();
    expect(result.current.promptOpen).toBe(true);
    expect(result.current.pendingRecipients).toBe(3);
  });

  it("retries only the event's mailing once the course's went out", async () => {
    const { result } = renderHook(() => useNotifyParticipantsPrompt(5));
    notifyMutation.mockResolvedValueOnce({
      data: { notifySessionParticipants: { success: false, courseSent: true, error: 'event failed' } },
    });

    act(() => result.current.registerChange(1));
    settle();
    await act(async () => { await result.current.confirm(); });
    expect(result.current.promptOpen).toBe(true);

    await act(async () => { await result.current.confirm(); });
    expect(notifyMutation).toHaveBeenLastCalledWith({ variables: { sessionId: 1, skipCourse: true, previous: null } });
    await waitFor(() => expect(result.current.promptOpen).toBe(false));
  });

  it('asks once for the two writes a single date change makes', () => {
    const { result } = renderHook(() => useNotifyParticipantsPrompt(5));

    // The date picker saves the start time and the end time separately.
    act(() => result.current.registerChange(1));
    act(() => result.current.registerChange(1));
    settle();

    expect(result.current.promptOpen).toBe(true);
    expect(result.current.pendingCount).toBe(1);
    expect(result.current.pendingRecipients).toBe(5);
  });

  it('collects several sessions edited in one burst into one prompt', () => {
    const { result } = renderHook(() => useNotifyParticipantsPrompt(5));

    act(() => result.current.registerChange(1));
    act(() => result.current.registerChange(2));
    settle();

    expect(result.current.promptOpen).toBe(true);
    expect(result.current.pendingCount).toBe(2);
  });

  it('notifies each pending session once on confirm', async () => {
    const { result } = renderHook(() => useNotifyParticipantsPrompt(5));

    act(() => result.current.registerChange(1));
    act(() => result.current.registerChange(2));
    settle();

    await act(async () => { await result.current.confirm(); });

    expect(notifyMutation).toHaveBeenCalledTimes(2);
    expect(notifyMutation).toHaveBeenCalledWith({ variables: { sessionId: 1, skipCourse: false, previous: null } });
    expect(notifyMutation).toHaveBeenCalledWith({ variables: { sessionId: 2, skipCourse: false, previous: null } });
    await waitFor(() => expect(result.current.promptOpen).toBe(false));
    expect(result.current.savedMessage).toBe('SessionsTab.notify_participants.sent');
  });

  it('sends nothing on cancel and forgets the pending sessions', () => {
    const { result } = renderHook(() => useNotifyParticipantsPrompt(5));

    act(() => result.current.registerChange(1));
    settle();
    act(() => result.current.cancel());

    expect(notifyMutation).not.toHaveBeenCalled();
    expect(result.current.promptOpen).toBe(false);

    // A cancelled prompt must not resurrect on the next unrelated edit.
    settle();
    expect(result.current.promptOpen).toBe(false);
  });

  it('surfaces a failed notification as an error', async () => {
    notifyMutation.mockResolvedValue({
      data: { notifySessionParticipants: { success: false, error: 'Not an instructor of this course' } },
    });
    const { result } = renderHook(() => useNotifyParticipantsPrompt(5));

    act(() => result.current.registerChange(1));
    settle();
    await act(async () => { await result.current.confirm(); });

    await waitFor(() =>
      expect(result.current.errorMessage).toBe('Not an instructor of this course')
    );
    expect(result.current.savedMessage).toBeNull();
  });

  it('keeps only the sessions that failed, so a retry does not re-mail the rest', async () => {
    notifyMutation.mockImplementation(({ variables }: { variables: { sessionId: number } }) =>
      Promise.resolve({
        data: {
          notifySessionParticipants:
            variables.sessionId === 2
              ? { success: false, error: 'Only 1 of 3 notifications were queued' }
              : { success: true },
        },
      })
    );
    const { result } = renderHook(() => useNotifyParticipantsPrompt(5));

    act(() => result.current.registerChange(1));
    act(() => result.current.registerChange(2));
    settle();
    await act(async () => { await result.current.confirm(); });

    // Session 1 went out; session 2 did not, so the prompt stays up for it.
    await waitFor(() => expect(result.current.pendingCount).toBe(1));
    expect(result.current.promptOpen).toBe(true);
    expect(result.current.errorMessage).toBe('Only 1 of 3 notifications were queued');

    notifyMutation.mockClear();
    succeed();
    await act(async () => { await result.current.confirm(); });

    expect(notifyMutation).toHaveBeenCalledTimes(1);
    expect(notifyMutation).toHaveBeenCalledWith({ variables: { sessionId: 2, skipCourse: false, previous: null } });
    await waitFor(() => expect(result.current.promptOpen).toBe(false));
  });

  it('closes the prompt once every pending session has gone out', async () => {
    const { result } = renderHook(() => useNotifyParticipantsPrompt(5));

    act(() => result.current.registerChange(1));
    settle();
    await act(async () => { await result.current.confirm(); });

    await waitFor(() => expect(result.current.promptOpen).toBe(false));
    expect(result.current.pendingCount).toBe(0);
  });

  describe('the state the mail compares against', () => {
    const snapshot = (sessionId: number, startDateTime: string, courseLocationIds: number[]) => ({
      sessionId,
      startDateTime,
      endDateTime: '2026-11-18T18:30:00.000Z',
      locations: courseLocationIds.map((courseLocationId) => ({ courseLocationId, locationAddressId: null })),
    });
    const hybrid = [snapshot(1, '2026-11-18T17:00:00.000Z', [1, 2])];
    const onlineOnly = [snapshot(1, '2026-11-18T17:00:00.000Z', [2])];
    const onlineLater = [snapshot(1, '2026-11-18T17:30:00.000Z', [2])];
    const previousOf = (call: number) => notifyMutation.mock.calls[call][0].variables.previous;

    it('sends the state from before the edit, even when its refetch landed first', async () => {
      const { result, rerender } = renderHook(({ snapshots }) => useNotifyParticipantsPrompt(5, () => 0, snapshots), {
        initialProps: { snapshots: hybrid },
      });

      rerender({ snapshots: onlineOnly });
      act(() => result.current.registerChange(1));
      settle();
      await act(async () => { await result.current.confirm(); });

      expect(previousOf(0)).toEqual({
        startDateTime: hybrid[0].startDateTime,
        endDateTime: hybrid[0].endDateTime,
        locations: hybrid[0].locations,
      });
    });

    it('compares the next edit with what was announced last', async () => {
      const { result, rerender } = renderHook(({ snapshots }) => useNotifyParticipantsPrompt(5, () => 0, snapshots), {
        initialProps: { snapshots: hybrid },
      });

      rerender({ snapshots: onlineOnly });
      act(() => result.current.registerChange(1));
      settle();
      await act(async () => { await result.current.confirm(); });

      rerender({ snapshots: onlineLater });
      act(() => result.current.registerChange(1));
      settle();
      await act(async () => { await result.current.confirm(); });

      expect(previousOf(1).locations).toEqual(onlineOnly[0].locations);
      expect(previousOf(1).startDateTime).toBe(onlineOnly[0].startDateTime);
    });

    it('starts over from the current state after a dismissed prompt', async () => {
      const { result, rerender } = renderHook(({ snapshots }) => useNotifyParticipantsPrompt(5, () => 0, snapshots), {
        initialProps: { snapshots: hybrid },
      });

      rerender({ snapshots: onlineOnly });
      act(() => result.current.registerChange(1));
      settle();
      await act(async () => { result.current.cancel(); });

      rerender({ snapshots: onlineLater });
      act(() => result.current.registerChange(1));
      settle();
      await act(async () => { await result.current.confirm(); });

      expect(previousOf(0).startDateTime).toBe(onlineOnly[0].startDateTime);
    });

    it('moves on to the freshly fetched state, not a stale rendered one', async () => {
      // The edit's own refetch failed, so the rendered state still shows the session as it was.
      const refresh = jest.fn().mockResolvedValue(onlineOnly);
      const { result } = renderHook(() => useNotifyParticipantsPrompt(5, () => 0, hybrid, refresh));

      act(() => result.current.registerChange(1));
      settle();
      await act(async () => { await result.current.confirm(); });
      act(() => result.current.registerChange(1));
      settle();
      await act(async () => { await result.current.confirm(); });

      expect(previousOf(1).locations).toEqual(onlineOnly[0].locations);
    });

    it('moves on past an edit nobody was there to hear about', async () => {
      const refresh = jest.fn().mockResolvedValue(onlineOnly);
      let participants = 0;
      const { result, rerender } = renderHook(() =>
        useNotifyParticipantsPrompt(participants, () => 0, hybrid, refresh)
      );

      await act(async () => { result.current.registerChange(1); });
      expect(refresh).toHaveBeenCalled();

      participants = 5;
      rerender();
      act(() => result.current.registerChange(1));
      settle();
      await act(async () => { await result.current.confirm(); });

      expect(previousOf(0).locations).toEqual(onlineOnly[0].locations);
    });
  });
});
