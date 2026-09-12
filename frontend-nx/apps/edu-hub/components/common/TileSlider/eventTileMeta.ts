import { useEffect, useMemo, useState } from 'react';

import { useAppSettings } from '../../../contexts/AppSettingsContext';
import { formatSessionDateSpan, lastSessionEnd, ScheduleSession } from '../../../helpers/sessionSchedule';

type TileCourse = {
  Program?: { type?: string | null } | null;
  Sessions?: ScheduleSession[] | null;
};

/** Beyond this, arming a timer is pointless — and setTimeout overflows near 25 days. */
const MAX_BADGE_TIMER_MS = 24 * 60 * 60 * 1000;

/**
 * What a course tile needs to know about an event. An event has no weekday, so
 * the date line that a course fills with "Mittwoch 18:00 - 20:00" comes from its
 * sessions instead, and the same sessions say whether it is already over.
 *
 * Shared by `Tile` and `TileWidget`, which are otherwise duplicate markup.
 */
export const useEventTileMeta = (course: TileCourse) => {
  const { timeZone } = useAppSettings();
  const programType = course.Program?.type;
  const sessions = course.Sessions;

  const isEvent = programType === 'EVENTS';
  const courseSessions = useMemo(() => sessions ?? [], [sessions]);

  const dateSpan = useMemo(
    () => (isEvent ? formatSessionDateSpan(courseSessions, timeZone) : null),
    [isEvent, courseSessions, timeZone]
  );

  const endsAt = useMemo(
    () => (isEvent ? lastSessionEnd(courseSessions) : null),
    [isEvent, courseSessions]
  );

  const [now, setNow] = useState(() => new Date());

  // Without this the badge would keep whatever value it had when the tile
  // mounted: nothing else re-renders a tile the moment an event finishes.
  useEffect(() => {
    if (!endsAt) return undefined;
    const msUntilEnd = endsAt.getTime() - Date.now();
    if (msUntilEnd <= 0 || msUntilEnd > MAX_BADGE_TIMER_MS) return undefined;

    const timer = setTimeout(() => setNow(new Date()), msUntilEnd + 1000);
    return () => clearTimeout(timer);
  }, [endsAt]);

  return {
    isEvent,
    dateSpan,
    isPast: endsAt != null && endsAt < now,
  };
};
