import { useMemo } from 'react';

import { useAppSettings } from '../../../contexts/AppSettingsContext';
import { formatSessionDateSpan, isPastEvent, ScheduleSession } from '../../../helpers/sessionSchedule';

type TileCourse = {
  Program?: { type?: string | null } | null;
  Sessions?: ScheduleSession[] | null;
};

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

  return useMemo(() => {
    const isEvent = programType === 'EVENTS';
    const courseSessions = sessions ?? [];
    return {
      isEvent,
      dateSpan: isEvent ? formatSessionDateSpan(courseSessions, timeZone) : null,
      isPast: isEvent && isPastEvent(courseSessions, new Date()),
    };
  }, [programType, sessions, timeZone]);
};
