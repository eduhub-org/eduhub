import { FC, useCallback, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { MdCalendarMonth } from 'react-icons/md';

import { Course_Course_by_pk_Sessions as Session, Course_Course_by_pk_CourseLocations as CourseLocation } from '../../../queries/__generated__/Course';
import { SectionTitle } from '../../common/SectionTitle';
import UserCard from '../../common/UserCard';
import { useAppSettings } from '../../../contexts/AppSettingsContext';
import { useDisplayDate, useFormatTimeString } from '../../../helpers/dateTimeHelpers';
import { generateICalString, downloadICalFile } from '../../../helpers/icalExport';
import { formatDayHeading, groupSessionsByDay } from '../../../helpers/sessionSchedule';
import { isLinkFormat } from '../../../helpers/util';
import { useIsAdmin, useIsInstructor } from '../../../hooks/authentication';
import { useRoleQuery } from '../../../hooks/authedQuery';
import { LOCATION_ADDRESSES_BY_IDS } from '../../../queries/locationAddress';

interface SessionsProps {
  sessions: Session[];
  courseLocations: CourseLocation[];
  isLoggedInParticipant: boolean;
  /** Events publish an agenda: grouped by day, always expanded, no "Termine" heading. */
  isEvent?: boolean;
  courseId?: number;
  courseTitle?: string;
}

/** One location of one session, with its address already resolved for display. */
interface ResolvedLocation {
  courseLocationId: number;
  locationOption: string | null;
  displayAddress: string;
}

/**
 * Which locations a session takes place at, in the order the course lists them,
 * with each address resolved through the LocationAddress ids and falling back to
 * the legacy free-text fields. Used both for the rendered markup and for the
 * LOCATION line of the calendar export, so the two cannot drift apart.
 */
const resolveSessionLocations = (
  session: Session,
  courseLocations: CourseLocation[],
  addressMap: Map<number, { address: string }>
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
        courseLocationId: courseLocation.id,
        locationOption: CourseLocation?.locationOption ?? null,
        displayAddress,
      },
    ];
  });

interface SessionRowProps {
  session: Session;
  locations: ResolvedLocation[];
  /** The agenda carries the date in its day heading, so rows there show only times. */
  showDate: boolean;
  canSeeOnlineLink: boolean;
}

const SessionRow: FC<SessionRowProps> = ({ session, locations, showDate, canSeeOnlineLink }) => {
  const t = useTranslations('course');
  const displayDate = useDisplayDate();
  const formatTimeString = useFormatTimeString();

  const { startDateTime, endDateTime, title, description, SessionSpeakers } = session;

  return (
    <li className="flex mb-4">
      <div className="flex flex-wrap items-start flex-shrink-0 mb-2">
        <div className="flex flex-col mr-6">
          {showDate && (
            <span className="block text-sm sm:text-lg font-semibold">{displayDate(startDateTime)}</span>
          )}
          <span className="text-sm whitespace-nowrap">
            {formatTimeString(startDateTime)}
            {' - '}
            {formatTimeString(endDateTime)}
          </span>
        </div>
      </div>
      <div className="flex flex-col flex-1">
        <span className="block text-sm sm:text-lg break-words">{title}</span>
        <div className="break-words">
          {locations.map((location, index) => (
            <span key={location.courseLocationId} className="text-sm text-label-secondary ml-0 pl-0">
              {location.locationOption ? (
                location.locationOption === 'ONLINE' ? (
                  <>
                    {canSeeOnlineLink ? (
                      isLinkFormat(location.displayAddress) ? (
                        <a
                          href={location.displayAddress}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          ONLINE
                        </a>
                      ) : (
                        <>ONLINE {t('general.link_will_be_provided_soon')}</>
                      )
                    ) : (
                      'ONLINE'
                    )}
                  </>
                ) : location.displayAddress ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      location.displayAddress
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {location.displayAddress}
                  </a>
                ) : (
                  <>
                    {location.locationOption} {t('general.address_will_be_provided_soon')}
                  </>
                )
              ) : (
                t('sessions.location_not_available')
              )}
              {/* Add separator if this is not the last location with a SessionAddress */}
              {index < locations.length - 1 && ' +\u00A0'}
            </span>
          ))}
        </div>
        {description ? (
          <p className="mt-1 text-sm text-label-secondary whitespace-pre-line break-words">{description}</p>
        ) : null}
        <div className="flex flex-col">
          {SessionSpeakers &&
            SessionSpeakers.map((speaker, speakerIndex) => (
              <UserCard
                key={speakerIndex}
                className="flex items-center my-3"
                user={speaker.User}
                role={t('general.speaker')}
                size="medium"
              />
            ))}
        </div>
      </div>
    </li>
  );
};

export const Sessions: FC<SessionsProps> = ({
  sessions,
  courseLocations,
  isLoggedInParticipant,
  isEvent = false,
  courseId,
  courseTitle,
}) => {
  const t = useTranslations('course');
  const locale = useLocale();
  const { timeZone } = useAppSettings();
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  const [showAllSessions, setShowAllSessions] = useState(false);

  const canSeeOnlineLink = isLoggedInParticipant || isAdmin || isInstructor;

  const initiallyShownSessions = 4;

  // An agenda that hides its second day behind "Alle Termine anzeigen" defeats
  // the purpose, so events always render in full.
  const visibleSessions = useMemo(() => {
    return isEvent || showAllSessions ? sessions : sessions.slice(0, initiallyShownSessions);
  }, [isEvent, showAllSessions, sessions, initiallyShownSessions]);

  // Collect all location address IDs from sessions
  const addressIds = useMemo(() => {
    const ids = new Set<number>();
    sessions.forEach((session) => {
      session.SessionAddresses.forEach((sessionAddress) => {
        const locationAddressId = (sessionAddress as any).locationAddressId;
        const defaultSessionAddressId = (sessionAddress.CourseLocation as any)?.defaultSessionAddressId;

        if (locationAddressId) ids.add(locationAddressId);
        if (defaultSessionAddressId) ids.add(defaultSessionAddressId);
      });
    });
    return Array.from(ids);
  }, [sessions]);

  // Query location addresses for all IDs
  const { data: addressData } = useRoleQuery(LOCATION_ADDRESSES_BY_IDS, {
    variables: { ids: addressIds },
    skip: addressIds.length === 0,
  });

  // Create a lookup map for addresses by ID
  const addressMap = useMemo(() => {
    if (!addressData?.LocationAddress) return new Map();
    const map = new Map();
    addressData.LocationAddress.forEach((addr: any) => {
      map.set(addr.id, addr);
    });
    return map;
  }, [addressData]);

  const locationsBySessionId = useMemo(() => {
    const map = new Map<number, ResolvedLocation[]>();
    visibleSessions.forEach((session) => {
      map.set(session.id, resolveSessionLocations(session, courseLocations, addressMap));
    });
    return map;
  }, [visibleSessions, courseLocations, addressMap]);

  const dayGroups = useMemo(
    () => (isEvent ? groupSessionsByDay(visibleSessions, timeZone) : []),
    [isEvent, visibleSessions, timeZone]
  );

  const handleExportICal = useCallback(() => {
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

  if (visibleSessions.length === 0) {
    return null;
  }

  // The .ics SUMMARY is built from the course title, so without one there is
  // nothing meaningful to export.
  const addToCalendarButton = !courseTitle ? null : (
    <button
      onClick={handleExportICal}
      className="flex items-center gap-2 mt-2 mb-6 px-4 py-2 min-h-11 touch-manipulation rounded-lg border
        border-border-primary bg-bg-secondary hover:bg-border-primary text-sm text-label-primary transition-colors"
    >
      <MdCalendarMonth />
      {t('sessions.add_to_calendar')}
    </button>
  );

  if (isEvent) {
    // A lone session needs no heading and no date column: the date already sits
    // in the hero and the info panel, so only the title and place are new here.
    if (sessions.length === 1) {
      const session = visibleSessions[0];
      const locations = locationsBySessionId.get(session.id) ?? [];
      if (!session.title && !session.description && locations.length === 0) {
        // Nothing to describe, but the dates are still worth exporting.
        return addToCalendarButton ? <div className="mt-24">{addToCalendarButton}</div> : null;
      }
      return (
        <div className="mt-24">
          <ul className="max-w-2xl">
            <SessionRow
              session={session}
              locations={locations}
              showDate={false}
              canSeeOnlineLink={canSeeOnlineLink}
            />
          </ul>
          {addToCalendarButton}
        </div>
      );
    }

    return (
      <>
        <SectionTitle className="mt-24">{t('sessions.agenda')}</SectionTitle>
        {dayGroups.map((group) => (
          <div key={group.dayKey} className="max-w-2xl mb-8">
            <h3 className="text-lg sm:text-xl font-semibold mb-3">
              {formatDayHeading(group.dayStart, timeZone, locale)}
            </h3>
            <ul>
              {group.sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  locations={locationsBySessionId.get(session.id) ?? []}
                  showDate={false}
                  canSeeOnlineLink={canSeeOnlineLink}
                />
              ))}
            </ul>
          </div>
        ))}
        {addToCalendarButton}
      </>
    );
  }

  return (
    <>
      <SectionTitle className="mt-24">
        {sessions.length === 1 ? t('sessions.date_singular') : t('sessions.date_plural')}
      </SectionTitle>
      <ul className="max-w-2xl">
        {visibleSessions.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            locations={locationsBySessionId.get(session.id) ?? []}
            showDate={true}
            canSeeOnlineLink={canSeeOnlineLink}
          />
        ))}
      </ul>
      {sessions.length > initiallyShownSessions &&
        (showAllSessions ? (
          <button
            className="text-white text-sm sm:text-lg font-semibold hover:underline italic flex items-center pb-6 min-h-11 touch-manipulation"
            onClick={() => setShowAllSessions(false)}
          >
            {t('sessions.hide_dates')}
            <IoIosArrowUp className="ml-1" />
          </button>
        ) : (
          <button
            className="text-white text-sm sm:text-lg font-semibold hover:underline italic flex items-center pb-6 min-h-11 touch-manipulation"
            onClick={() => setShowAllSessions(true)}
          >
            {t('sessions.show_all_dates')}
            <IoIosArrowDown className="ml-1" />
          </button>
        ))}
      {addToCalendarButton}
    </>
  );
};
