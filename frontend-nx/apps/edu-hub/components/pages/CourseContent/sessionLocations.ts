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
import { blockSchedule, contiguousBlocks, TimedSession } from '../../../helpers/sessionSchedule';
import {
  AddressMap,
  labelledAddress,
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

/** The timezone the export's merged entries spell their schedule in. */
const TIME_ZONE = 'Europe/Berlin';

interface CourseIcalArgs {
  sessions: Session[];
  courseLocations: CourseLocation[];
  addressMap: AddressMap;
  /** Online meeting links are only written into the file for people entitled to them. */
  canSeeOnlineLink: boolean;
  calendarName: string;
  courseUrl?: string;
}

const toDate = (value: Date | string | null | undefined): Date | null => {
  if (value == null) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * The calendar entries for a course: one per run of back-to-back sessions, so
 * a talk followed directly by a get-together is one appointment while a break
 * splits the day. A lone session keeps its own title and description; a merged
 * run is named after the course and lists its sessions in the description.
 */
export const buildCourseIcalEvents = ({
  sessions,
  courseLocations,
  addressMap,
  canSeeOnlineLink,
  calendarName,
  courseUrl,
}: CourseIcalArgs) => {
  const timed = sessions.flatMap((session): TimedSession<Session>[] => {
    const start = toDate(session.startDateTime);
    return start ? [{ session, start, end: toDate(session.endDateTime) ?? start }] : [];
  });

  return contiguousBlocks(timed, TIME_ZONE).map((block) => {
    const [first] = block;
    const end = new Date(Math.max(...block.map((item) => item.end.getTime())));

    const places = block.flatMap(({ session }) =>
      resolveSessionLocations(session, courseLocations, addressMap).map((l) =>
        l.locationOption === 'ONLINE'
          ? canSeeOnlineLink
            ? l.displayAddress || l.locationOption
            : l.locationOption
          : labelledAddress(l.label, l.displayAddress) || l.locationOption
      )
    );
    const location = [...new Set(places.filter(Boolean))].join(' – ');

    const isMerged = block.length > 1;
    const title = isMerged || !first.session.title ? calendarName : `${calendarName} – ${first.session.title}`;
    const description = isMerged
      ? [
          blockSchedule(block, calendarName, TIME_ZONE),
          ...block
            .filter(({ session }) => session.description?.trim())
            .map(({ session }) =>
              session.title?.trim() ? `${session.title.trim()}:\n${session.description}` : session.description
            ),
        ].join('\n\n')
      : first.session.description || undefined;

    return {
      uid: `session-${first.session.id}@eduhub`,
      title,
      startDateTime: first.start.toISOString(),
      endDateTime: end.toISOString(),
      description,
      location: location || undefined,
      url: courseUrl,
    };
  });
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

    const icalEvents = buildCourseIcalEvents({
      sessions,
      courseLocations,
      addressMap,
      canSeeOnlineLink,
      calendarName,
      courseUrl,
    });

    downloadICalFile(
      generateICalString(icalEvents, calendarName),
      `${(calendarName || 'eduhub').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'eduhub'}.ics`
    );
  }, [sessions, courseLocations, addressMap, courseTitle, courseId, canSeeOnlineLink]);

  return courseTitle && sessions.length > 0 ? handleExport : null;
};
