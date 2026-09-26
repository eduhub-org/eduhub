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
import { useRoleQuery } from '../../../hooks/authedQuery';
import { LOCATION_ADDRESSES_BY_IDS } from '../../../queries/locationAddress';

/** One location of one session, with its address already resolved for display. */
export interface ResolvedLocation {
  /** Stable per location: `cl-<CourseLocation id>`, or `sa-<SessionAddress id>` for program sessions. */
  key: string;
  locationOption: string | null;
  displayAddress: string;
}

export type AddressMap = Map<number, { address: string }>;

/**
 * Which locations a session takes place at, in the order the course lists them,
 * with each address resolved through the LocationAddress ids and falling back to
 * the legacy free-text fields.
 */
export const resolveSessionLocations = (
  session: Session,
  courseLocations: CourseLocation[],
  addressMap: AddressMap
): ResolvedLocation[] =>
  session.programId != null ? resolveProgramSessionLocations(session, addressMap) : resolveCourseSessionLocations(session, courseLocations, addressMap);

/**
 * Program sessions have no CourseLocation: each SessionAddress carries its own
 * location option and either a LocationAddress or a free-text address (the
 * meeting link for online sessions).
 */
const resolveProgramSessionLocations = (session: Session, addressMap: AddressMap): ResolvedLocation[] =>
  session.SessionAddresses.filter((sa) => sa.locationOption).map((sa) => ({
    key: `sa-${sa.id}`,
    locationOption: sa.locationOption,
    displayAddress:
      sa.locationAddressId && addressMap.has(sa.locationAddressId)
        ? addressMap.get(sa.locationAddressId)!.address
        : sa.address ?? '',
  }));

const resolveCourseSessionLocations = (
  session: Session,
  courseLocations: CourseLocation[],
  addressMap: AddressMap
): ResolvedLocation[] =>
  courseLocations.flatMap((courseLocation) => {
    const sessionAddress = session.SessionAddresses.find((sa) => sa.CourseLocation?.id === courseLocation.id);
    if (!sessionAddress) return [];

    const { address, CourseLocation } = sessionAddress;
    const locationAddressId = (sessionAddress as any).locationAddressId;
    const defaultSessionAddressId = (CourseLocation as any)?.defaultSessionAddressId;
    const effectiveAddressId = locationAddressId || defaultSessionAddressId;

    const displayAddress =
      effectiveAddressId && addressMap.has(effectiveAddressId)
        ? addressMap.get(effectiveAddressId)!.address
        : address && address.trim() !== ''
        ? address
        : CourseLocation?.defaultSessionAddress || '';

    return [
      {
        key: `cl-${courseLocation.id}`,
        locationOption: CourseLocation?.locationOption ?? null,
        displayAddress,
      },
    ];
  });

/** Stable identity of a session's places, so two sessions can be compared. */
export const locationsSignature = (locations: ResolvedLocation[]): string =>
  locations.map((l) => `${l.key}|${l.locationOption ?? ''}|${l.displayAddress}`).join('||');

/**
 * The LocationAddress rows referenced by these sessions, by id. Two callers
 * running this against the same sessions share one Apollo cache entry, so the
 * agenda and the rail do not each pay for the round trip.
 */
export const useSessionAddressMap = (sessions: Session[]): AddressMap => {
  const addressIds = useMemo(() => {
    const ids = new Set<number>();
    (sessions ?? []).forEach((session) => {
      session.SessionAddresses.forEach((sessionAddress) => {
        const locationAddressId = (sessionAddress as any).locationAddressId;
        const defaultSessionAddressId = (sessionAddress.CourseLocation as any)?.defaultSessionAddressId;

        if (locationAddressId) ids.add(locationAddressId);
        if (defaultSessionAddressId) ids.add(defaultSessionAddressId);
      });
    });
    return Array.from(ids);
  }, [sessions]);

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
