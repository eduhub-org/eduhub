import { useCallback, useEffect, useState } from 'react';
import { EventType, MatrixClient, MatrixEvent, Room, RoomStateEvent } from 'matrix-js-sdk';

export interface RoomModeration {
  /** Event ids pinned in the room, oldest pin first (m.room.pinned_events). */
  pinnedIds: string[];
  /** Whether the signed-in user may change the pins (state_default, 50 in course rooms). */
  canPin: boolean;
  /** Own messages, or anyone's with at least the room's "redact" level (50). */
  canRedact: (event: MatrixEvent) => boolean;
  redact: (event: MatrixEvent) => Promise<void>;
  togglePin: (eventId: string) => Promise<void>;
}

const readPinnedIds = (room: Room): string[] => {
  const pinned = room.currentState.getStateEvents(EventType.RoomPinnedEvents, '')?.getContent()?.pinned;
  return Array.isArray(pinned) ? pinned.filter((id): id is string => typeof id === 'string' && id.length > 0) : [];
};

/**
 * Deleting (redacting) messages and pinning announcements.
 *
 * The permission checks only decide which buttons to show. The homeserver
 * checks every redaction and state event against the room's power levels
 * itself and rejects it with M_FORBIDDEN otherwise.
 */
export const useRoomModeration = (client: MatrixClient, room: Room | null): RoomModeration => {
  const ownUserId = client.getUserId() ?? '';
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  // Re-render on every state change (pins, power levels), so the checks below,
  // which read the room's current state, are always up to date.
  const [, setStateVersion] = useState(0);

  useEffect(() => {
    if (!room) return undefined;
    const onStateEvent = () => {
      setPinnedIds(readPinnedIds(room));
      setStateVersion((version) => version + 1);
    };
    onStateEvent();
    room.on(RoomStateEvent.Events, onStateEvent);
    return () => {
      room.off(RoomStateEvent.Events, onStateEvent);
    };
  }, [room]);

  const canPin = !!room && room.currentState.maySendStateEvent(EventType.RoomPinnedEvents, ownUserId);
  const canRedact = (event: MatrixEvent) => !!room && room.currentState.maySendRedactionForEvent(event, ownUserId);

  const redact = useCallback(
    async (event: MatrixEvent) => {
      const eventId = event.getId();
      if (room && eventId) await client.redactEvent(room.roomId, eventId);
    },
    [client, room]
  );

  // Read-modify-write of one state event: re-read the current pins right
  // before writing, so a pin set by someone else a moment ago is kept.
  const togglePin = useCallback(
    async (eventId: string) => {
      if (!room) return;
      const current = readPinnedIds(room);
      const pinned = current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId];
      await client.sendStateEvent(room.roomId, EventType.RoomPinnedEvents, { pinned }, '');
    },
    [client, room]
  );

  return { pinnedIds, canPin, canRedact, redact, togglePin };
};
