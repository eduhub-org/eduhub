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

  it('asks once for the two writes a single date change makes', () => {
    const { result } = renderHook(() => useNotifyParticipantsPrompt(5));

    // The date picker saves the start time and the end time separately.
    act(() => result.current.registerChange(1));
    act(() => result.current.registerChange(1));
    settle();

    expect(result.current.promptOpen).toBe(true);
    expect(result.current.pendingCount).toBe(1);
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
    expect(notifyMutation).toHaveBeenCalledWith({ variables: { sessionId: 1 } });
    expect(notifyMutation).toHaveBeenCalledWith({ variables: { sessionId: 2 } });
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
    expect(notifyMutation).toHaveBeenCalledWith({ variables: { sessionId: 2 } });
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
});
