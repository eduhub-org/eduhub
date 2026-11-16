import { useCallback, useEffect, useState } from 'react';
import { Direction, EventType, KnownMembership, MatrixClient, MatrixEvent, Room, RoomEvent } from 'matrix-js-sdk';

/** Events the chat shows: messages, and the placeholders left by deleted or encrypted ones. */
const isShown = (event: MatrixEvent): boolean =>
  event.getType() === EventType.RoomMessage || event.getType() === EventType.RoomMessageEncrypted;

const OLDER_PAGE_SIZE = 30;

export interface RoomTimeline {
  room: Room | null;
  events: MatrixEvent[];
  joinFailed: boolean;
  /** False once the very first message of the room is loaded. */
  canLoadOlder: boolean;
  loadingOlder: boolean;
  loadOlder: () => Promise<void>;
  send: (text: string) => Promise<void>;
  resend: (event: MatrixEvent) => Promise<void>;
}

/**
 * Joins the course room (its join rule is public, so no invite is needed) and
 * follows its live timeline. matrix-js-sdk keeps the timeline up to date from
 * the sync loop; this hook re-reads it whenever the room says it changed.
 */
export const useRoomTimeline = (client: MatrixClient, roomId: string): RoomTimeline => {
  const [room, setRoom] = useState<Room | null>(null);
  const [events, setEvents] = useState<MatrixEvent[]>([]);
  const [joinFailed, setJoinFailed] = useState(false);
  const [canLoadOlder, setCanLoadOlder] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);

  useEffect(() => {
    setJoinFailed(false);
    setRoom(null);

    // Use the room only once the sync loop knows we are in it. joinRoom()
    // resolves with a detached Room object that never receives updates; the
    // live one arrives with the next /sync, announced by MyMembership.
    const takeIfJoined = (candidate: Room | null) => {
      if (candidate?.roomId === roomId && candidate.getMyMembership() === KnownMembership.Join) setRoom(candidate);
    };
    const onMyMembership = (changedRoom: Room) => takeIfJoined(changedRoom);
    client.on(RoomEvent.MyMembership, onMyMembership);

    const known = client.getRoom(roomId);
    if (known?.getMyMembership() === KnownMembership.Join) {
      setRoom(known);
    } else {
      client
        .joinRoom(roomId)
        .then(() => takeIfJoined(client.getRoom(roomId)))
        .catch((error) => {
          console.error('Could not join the course chat room', error);
          setJoinFailed(true);
        });
    }

    return () => {
      client.off(RoomEvent.MyMembership, onMyMembership);
    };
  }, [client, roomId]);

  const refresh = useCallback(() => {
    if (!room) return;
    const timeline = room.getLiveTimeline();
    setEvents(timeline.getEvents().filter(isShown));
    setCanLoadOlder(timeline.getPaginationToken(Direction.Backward) !== null);
  }, [room]);

  useEffect(() => {
    if (!room) return undefined;
    refresh();
    room.on(RoomEvent.Timeline, refresh);
    room.on(RoomEvent.LocalEchoUpdated, refresh);
    room.on(RoomEvent.Redaction, refresh);
    room.on(RoomEvent.TimelineReset, refresh);
    return () => {
      room.off(RoomEvent.Timeline, refresh);
      room.off(RoomEvent.LocalEchoUpdated, refresh);
      room.off(RoomEvent.Redaction, refresh);
      room.off(RoomEvent.TimelineReset, refresh);
    };
  }, [room, refresh]);

  const loadOlder = useCallback(async () => {
    if (!room || loadingOlder) return;
    setLoadingOlder(true);
    try {
      // GET /rooms/{id}/messages?dir=b&from=<prev_batch> under the hood.
      await client.scrollback(room, OLDER_PAGE_SIZE);
    } finally {
      setLoadingOlder(false);
      refresh();
    }
  }, [client, room, loadingOlder, refresh]);

  // The SDK picks the txnId and shows the message right away as a local echo
  // (status "sending") until the server's copy arrives through /sync.
  const send = useCallback(
    async (text: string) => {
      await client.sendTextMessage(roomId, text);
    },
    [client, roomId]
  );

  const resend = useCallback(
    async (event: MatrixEvent) => {
      if (room) await client.resendEvent(event, room);
    },
    [client, room]
  );

  return { room, events, joinFailed, canLoadOlder, loadingOlder, loadOlder, send, resend };
};
