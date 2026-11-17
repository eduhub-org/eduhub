import { act, renderHook } from '@testing-library/react';

import { useRoomModeration } from './useRoomModeration';

jest.mock('matrix-js-sdk', () => ({
  EventType: { RoomPinnedEvents: 'm.room.pinned_events' },
  RoomStateEvent: { Events: 'RoomState.events' },
}));

type Listener = () => void;

/** A room whose pins and permissions the test controls. */
const fakeRoom = ({ pinned = [] as string[], mayPin = true, mayRedact = true } = {}) => {
  const listeners = new Set<Listener>();
  const room = {
    roomId: '!course:test',
    pinned,
    currentState: {
      getStateEvents: () => ({ getContent: () => ({ pinned: room.pinned }) }),
      maySendStateEvent: jest.fn(() => mayPin),
      maySendRedactionForEvent: jest.fn(() => mayRedact),
    },
    on: (_name: string, listener: Listener) => listeners.add(listener),
    off: (_name: string, listener: Listener) => listeners.delete(listener),
    /** Someone changed the room state, as a /sync would deliver it. */
    emitState: () => listeners.forEach((listener) => listener()),
  };
  return room;
};

const fakeClient = () => ({
  getUserId: () => '@ina:test',
  sendStateEvent: jest.fn(async () => ({ event_id: '$pins' })),
  redactEvent: jest.fn(async () => ({ event_id: '$redaction' })),
});

const event = (id: string) => ({ getId: () => id }) as never;

describe('useRoomModeration', () => {
  it('reads the pinned message ids from the room state', () => {
    const room = fakeRoom({ pinned: ['$a', '$b'] });
    const { result } = renderHook(() => useRoomModeration(fakeClient() as never, room as never));
    expect(result.current.pinnedIds).toEqual(['$a', '$b']);
  });

  it('follows pin changes made by others', () => {
    const room = fakeRoom({ pinned: ['$a'] });
    const { result } = renderHook(() => useRoomModeration(fakeClient() as never, room as never));

    room.pinned = ['$a', '$b'];
    act(() => room.emitState());

    expect(result.current.pinnedIds).toEqual(['$a', '$b']);
  });

  it('pins by adding to the current pins, keeping one set by someone else a moment ago', async () => {
    const room = fakeRoom({ pinned: ['$a'] });
    const client = fakeClient();
    const { result } = renderHook(() => useRoomModeration(client as never, room as never));
    room.pinned = ['$a', '$fromSomeoneElse']; // arrived, but not rendered yet

    await act(() => result.current.togglePin('$new'));

    expect(client.sendStateEvent).toHaveBeenCalledWith(
      '!course:test',
      'm.room.pinned_events',
      { pinned: ['$a', '$fromSomeoneElse', '$new'] },
      ''
    );
  });

  it('unpins a pinned message', async () => {
    const room = fakeRoom({ pinned: ['$a', '$b'] });
    const client = fakeClient();
    const { result } = renderHook(() => useRoomModeration(client as never, room as never));

    await act(() => result.current.togglePin('$a'));

    expect(client.sendStateEvent).toHaveBeenCalledWith('!course:test', 'm.room.pinned_events', { pinned: ['$b'] }, '');
  });

  it('asks the room state, as the server would, who may pin and delete', () => {
    const room = fakeRoom({ mayPin: false, mayRedact: false });
    const { result } = renderHook(() => useRoomModeration(fakeClient() as never, room as never));

    expect(result.current.canPin).toBe(false);
    expect(result.current.canRedact(event('$a'))).toBe(false);
    expect(room.currentState.maySendStateEvent).toHaveBeenCalledWith('m.room.pinned_events', '@ina:test');
  });

  it('redacts through the client', async () => {
    const client = fakeClient();
    // Created once, outside the render callback: a new room per render would
    // re-run the hook's effect forever.
    const room = fakeRoom();
    const { result } = renderHook(() => useRoomModeration(client as never, room as never));

    await act(() => result.current.redact(event('$a')));

    expect(client.redactEvent).toHaveBeenCalledWith('!course:test', '$a');
  });
});
