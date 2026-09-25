import { FC, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { Tooltip } from '@mui/material';

import { Course_Course_by_pk_Sessions as Session, Course_Course_by_pk_CourseLocations as CourseLocation } from '../../../queries/__generated__/Course';
import { SectionTitle } from '../../common/SectionTitle';
import UserCard from '../../common/UserCard';
import { useAppSettings } from '../../../contexts/AppSettingsContext';
import { useDisplayDate, useFormatTimeString } from '../../../helpers/dateTimeHelpers';
import { formatDayHeading, groupSessionsByDay } from '../../../helpers/sessionSchedule';
import { isLinkFormat } from '../../../helpers/util';
import { isProgramSession, mergeSessions } from '../../../helpers/programSessions';
import { useIsAdmin, useIsInstructor } from '../../../hooks/authentication';
import {
  ResolvedLocation,
  locationsSignature,
  resolveSessionLocations,
  useSessionAddressMap,
} from './sessionLocations';

interface SessionsProps {
  sessions: Session[];
  /** Program-wide sessions, merged into the schedule and marked as such. */
  programSessions?: Session[] | null;
  programTitle?: string | null;
  courseLocations: CourseLocation[];
  isLoggedInParticipant: boolean;
  /** Events publish an agenda: grouped by day, always expanded, no "Termine" heading. */
  isEvent?: boolean;
}

interface SessionLocationsProps {
  locations: ResolvedLocation[];
  canSeeOnlineLink: boolean;
}

/** The place(s) of a session, rendered either per row or once above the list. */
const SessionLocations: FC<SessionLocationsProps> = ({ locations, canSeeOnlineLink }) => {
  const t = useTranslations('course');

  return (
    <>
      {locations.map((location, index) => (
        <span key={location.key} className="text-sm text-label-secondary ml-0 pl-0">
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
    </>
  );
};

interface SessionRowProps {
  session: Session;
  locations: ResolvedLocation[];
  /** The agenda carries the date in its day heading, so rows there show only times. */
  showDate: boolean;
  canSeeOnlineLink: boolean;
  programTitle?: string | null;
}

const SessionRow: FC<SessionRowProps> = ({ session, locations, showDate, canSeeOnlineLink, programTitle }) => {
  const t = useTranslations('course');
  const displayDate = useDisplayDate();
  const formatTimeString = useFormatTimeString();

  const { startDateTime, endDateTime, title, description, SessionSpeakers } = session;

  return (
    <li className="relative flex flex-col sm:flex-row sm:items-baseline py-4 border-t border-white/10 first:border-t-0">
      {/* The dot on the rail. Purely decorative - the day heading already says
          which day these times belong to. */}
      <span
        aria-hidden="true"
        className="hidden sm:block absolute -left-[28px] top-[26px] w-[7px] h-[7px] rounded-full bg-border-primary"
      />
      {/* A fixed column rather than shrink-to-fit: "19:00 - 21:00" and
          "21:00 - 23:00" render at different widths, so without it the titles
          beside them do not line up. */}
      <div className="flex flex-col flex-shrink-0 sm:w-28 sm:mr-6 mb-1 sm:mb-0">
        {showDate && (
          <span className="block text-sm sm:text-base font-semibold">{displayDate(startDateTime)}</span>
        )}
        <span className="text-sm text-label-secondary whitespace-nowrap tabular-nums">
          {formatTimeString(startDateTime)}
          {' - '}
          {formatTimeString(endDateTime)}
        </span>
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {title ? (
            <span className="block text-base sm:text-lg font-semibold break-words">{title}</span>
          ) : (
            <span className="block text-base sm:text-lg italic text-label-disabled">
              {t('sessions.untitled_session')}
            </span>
          )}
          {isProgramSession(session) && (
            <Tooltip title={t('sessions.program_session_tooltip', { program: programTitle ?? '' })}>
              <span className="inline-block rounded-full border border-brand px-2 py-0.5 text-xs text-brand whitespace-nowrap">
                ◆ {t('sessions.program_session')}
              </span>
            </Tooltip>
          )}
          {session.isMandatory === false && (
            <span className="inline-block rounded-full border border-label-secondary px-2 py-0.5 text-xs text-label-secondary whitespace-nowrap">
              {t('sessions.optional')}
            </span>
          )}
        </div>
        {locations.length > 0 && (
          <div className="break-words">
            <SessionLocations locations={locations} canSeeOnlineLink={canSeeOnlineLink} />
          </div>
        )}
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
  sessions: courseSessions,
  programSessions,
  programTitle,
  courseLocations,
  isLoggedInParticipant,
  isEvent = false,
}) => {
  const t = useTranslations('course');
  const locale = useLocale();
  const { timeZone } = useAppSettings();
  const isAdmin = useIsAdmin();
  const isInstructor = useIsInstructor();
  const [showAllSessions, setShowAllSessions] = useState(false);

  const canSeeOnlineLink = isLoggedInParticipant || isAdmin || isInstructor;

  const initiallyShownSessions = 4;

  const sessions = useMemo(() => mergeSessions(courseSessions, programSessions), [courseSessions, programSessions]);

  // An agenda that hides its second day behind "Alle Termine anzeigen" defeats
  // the purpose, so events always render in full.
  const visibleSessions = useMemo(() => {
    return isEvent || showAllSessions ? sessions : sessions.slice(0, initiallyShownSessions);
  }, [isEvent, showAllSessions, sessions, initiallyShownSessions]);

  const addressMap = useSessionAddressMap(sessions);

  /**
   * The places every single session shares, or null when they differ. Computed
   * over all sessions rather than the visible ones so that expanding "Alle
   * Termine anzeigen" cannot move the addresses around. Repeating one address
   * on every row is noise, so in that case it is hoisted above the list; with a
   * single session there is nothing to repeat and it stays on the row.
   */
  // Program sessions have their own places, so they neither decide nor use
  // the hoisted line - they always show their location on the row.
  const sharedLocations = useMemo(() => {
    if (courseSessions.length < 2) return null;
    const perSession = courseSessions.map((session) => resolveSessionLocations(session, courseLocations, addressMap));
    if (perSession.some((locations) => locations.length === 0)) return null;

    const signature = locationsSignature(perSession[0]);
    return perSession.every((locations) => locationsSignature(locations) === signature) ? perSession[0] : null;
  }, [courseSessions, courseLocations, addressMap]);

  const locationsBySessionId = useMemo(() => {
    const map = new Map<number, ResolvedLocation[]>();
    visibleSessions.forEach((session) => {
      if (sharedLocations && !isProgramSession(session)) return;
      map.set(session.id, resolveSessionLocations(session, courseLocations, addressMap));
    });
    return map;
  }, [visibleSessions, courseLocations, addressMap, sharedLocations]);

  const dayGroups = useMemo(
    () => (isEvent ? groupSessionsByDay(visibleSessions, timeZone) : []),
    [isEvent, visibleSessions, timeZone]
  );

  if (visibleSessions.length === 0) {
    return null;
  }

  // The calendar export used to hang off this header; it lives in the
  // registration rail now, alongside the other whole-course actions.
  const sectionHeader = (title: string) => <SectionTitle className="mb-8">{title}</SectionTitle>;

  // Mandatory is the default, so only the exceptions carry a pill; the hint
  // explains that once, and only when there is an exception to explain.
  const optionalHint = sessions.some((session) => session.isMandatory === false) ? (
    <p className="max-w-2xl -mt-6 mb-6 text-sm text-label-secondary">{t('sessions.optional_hint')}</p>
  ) : null;

  const sharedLocationsLine = sharedLocations ? (
    <div className="max-w-2xl mb-4 break-words">
      <SessionLocations locations={sharedLocations} canSeeOnlineLink={canSeeOnlineLink} />
    </div>
  ) : null;

  if (isEvent) {
    // Every event agenda is grouped by day, a one-session event included: the
    // date is no longer shown above the tagline, so the day heading carries it.
    return (
      <div>
        {sectionHeader(t('sessions.agenda'))}
        {optionalHint}
        <div>
          {dayGroups.map((group) => (
            <div
              key={group.dayKey}
              className="max-w-2xl pt-8 mt-8 border-t border-border-primary first:pt-0 first:mt-0 first:border-t-0"
            >
              {/* The day is the label of the group, not a second heading competing
                  with the session titles under it - so it reads as an eyebrow.
                  Uppercase, tracking and weight carry that on their own; the
                  colour matches the info panel's micro-labels so the page has
                  one label treatment rather than two. */}
              <h3 className="text-sm font-bold uppercase tracking-widest text-label-secondary mb-2">
                {formatDayHeading(group.dayStart, timeZone, locale)}
              </h3>
              {/* Repeated per day rather than hoisted above the whole agenda: the
                  address belongs to the day it heads, not to the section title. */}
              {sharedLocationsLine}
              <ul className="sm:pl-6 sm:border-l sm:border-border-primary">
                {group.sessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    locations={locationsBySessionId.get(session.id) ?? []}
                    showDate={false}
                    canSeeOnlineLink={canSeeOnlineLink}
                    programTitle={programTitle}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {sectionHeader(sessions.length === 1 ? t('sessions.date_singular') : t('sessions.date_plural'))}
      {optionalHint}
      {sharedLocationsLine}
      <ul className="max-w-2xl">
        {visibleSessions.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            locations={locationsBySessionId.get(session.id) ?? []}
            showDate={true}
            canSeeOnlineLink={canSeeOnlineLink}
            programTitle={programTitle}
          />
        ))}
      </ul>
      {sessions.length > initiallyShownSessions &&
        (showAllSessions ? (
          <button
            className="mt-4 text-white text-sm sm:text-base font-semibold hover:text-brand flex items-center min-h-11 touch-manipulation transition-colors"
            onClick={() => setShowAllSessions(false)}
          >
            {t('sessions.hide_dates')}
            <IoIosArrowUp className="ml-1" />
          </button>
        ) : (
          <button
            className="mt-4 text-white text-sm sm:text-base font-semibold hover:text-brand flex items-center min-h-11 touch-manipulation transition-colors"
            onClick={() => setShowAllSessions(true)}
          >
            {t('sessions.show_all_dates')}
            <IoIosArrowDown className="ml-1" />
          </button>
        ))}
    </div>
  );
};
