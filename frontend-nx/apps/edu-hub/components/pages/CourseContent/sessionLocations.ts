/**
 * Session locations, shared by the agenda and the registration rail.
 *
 * Both need the same answer to "where does this session actually take place":
 * the agenda to render it, the rail to write the LOCATION line of the calendar
 * export. Keeping the resolution in one place is what stops the two from
 * drifting apart.
 */

import { useCallback, useMemo } from 'react';

import {
  Course_Course_by_pk_Sessions as Session,
  Course_Course_by_pk_CourseLocations as CourseLocation,
} from '../../../queries/__generated__/Course';
import { generateICalString, downloadICalFile } from '../../../helpers/icalExport';
import {
  AddressMap,
  referencedAddressIds,
  resolveSessionLocations,
  ResolvedLocation,
} from '../../../helpers/sessionLocationResolution';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { LOCATION_ADDRESSES_BY_IDS } from '../../../queries/locationAddress';

export { resolveSessionLocations };
export type { AddressMap, ResolvedLocation };

/** Stable identity of a session's places, so two sessions can be compared. */
export const locationsSignature = (locations: ResolvedLocation[]): string =>
  locations.map((l) => `${l.key}|${l.locationOption ?? ''}|${l.displayAddress}`).join('||');

/**
 * The LocationAddress rows referenced by these sessions, by id. Two callers
 * running this against the same sessions share one Apollo cache entry, so the
 * agenda and the rail do not each pay for the round trip.
 */
export const useSessionAddressMap = (sessions: Session[]): AddressMap => {
  const addressIds = useMemo(() => referencedAddressIds(sessions), [sessions]);

  const { data } = useRoleQuery(LOCATION_ADDRESSES_BY_IDS, {
    variables: { ids: addressIds },
    skip: addressIds.length === 0,
  });

  return useMemo(() => {
    const map: AddressMap = new Map();
    if (!data?.LocationAddress) return map;
    data.LocationAddress.forEach((addr: any) => {
      map.set(addr.id, addr);
    });
    return map;
  }, [data]);
};

interface CalendarExportArgs {
  sessions: Session[];
  courseLocations: CourseLocation[];
  addressMap: AddressMap;
  /** Online meeting links are only written into the file for people entitled to them. */
  canSeeOnlineLink: boolean;
  courseId?: number;
  courseTitle?: string;
}

/**
 * Downloads the course's sessions as an .ics file. Returns null when there is
 * no course title, because the SUMMARY of every event is built from it and a
 * file full of untitled entries helps nobody.
 */
export const useCourseCalendarExport = ({
  sessions,
  courseLocations,
  addressMap,
  canSeeOnlineLink,
  courseId,
  courseTitle,
}: CalendarExportArgs): (() => void) | null => {
  const handleExport = useCallback(() => {
    const calendarName = courseTitle ?? '';
    const courseUrl =
      typeof window !== 'undefined' && courseId != null
        ? `${window.location.origin}/course/${courseId}`
        : undefined;

    const icalEvents = sessions.map((session) => {
      const locations = resolveSessionLocations(session, courseLocations, addressMap);
      const location = locations
        .map((l) =>
          l.locationOption === 'ONLINE' && !canSeeOnlineLink ? l.locationOption : l.displayAddress || l.locationOption
        )
        .filter(Boolean)
        .join(' – ');

      return {
        uid: `session-${session.id}@eduhub`,
        title: session.title ? `${calendarName} – ${session.title}` : calendarName,
        startDateTime: session.startDateTime,
        endDateTime: session.endDateTime,
        description: session.description || undefined,
        location: location || undefined,
        url: courseUrl,
      };
    });

    downloadICalFile(
      generateICalString(icalEvents, calendarName),
      `${(calendarName || 'eduhub').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'eduhub'}.ics`
    );
  }, [sessions, courseLocations, addressMap, courseTitle, courseId, canSeeOnlineLink]);

  return courseTitle && sessions.length > 0 ? handleExport : null;
};
