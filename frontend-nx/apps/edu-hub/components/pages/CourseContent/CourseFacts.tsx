import Image from 'next/image';
import { FC, useMemo, useCallback, Fragment, ReactNode, type JSX } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MdAttachMoney, MdCalendarMonth, MdPeopleOutline, MdSchool } from 'react-icons/md';

import { useStartTimeString, useEndTimeString, getWeekdayString } from '../../../helpers/dateTimeHelpers';
import { useAppSettings } from '../../../contexts/AppSettingsContext';
import { formatSessionDateSpan } from '../../../helpers/sessionSchedule';
import { Course_Course_by_pk } from '../../../queries/__generated__/Course';
import { getRegistrationTypeConfig, isRegistrationClosed } from './Registration/types';

interface IProps {
  course: Course_Course_by_pk;
}

/**
 * The facts of a course - when, where, in which language, what it costs, how
 * many places are left - as a labelled list. Card chrome is the caller's job:
 * this renders inside the registration rail, which owns the surface.
 */

interface FactProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

/**
 * One fact of the panel: icon, what it is, what it says.
 *
 * The panel used to be a two-column grid of centred icons with a 7rem column
 * gap, which forced a date span onto three lines and left almost half the card
 * empty. A labelled row reads at a glance, wraps predictably, and lets the card
 * be as tall as its contents.
 */
const Fact: FC<FactProps> = ({ icon, label, children }) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0 w-5 mt-0.5 text-label-secondary">{icon}</div>
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-label-secondary mb-0.5">{label}</dt>
      <dd className="text-sm font-semibold leading-snug break-words">{children}</dd>
    </div>
  </div>
);

export const CourseFacts: FC<IProps> = ({ course }) => {
  const t = useTranslations('common');
  const tCourse = useTranslations('course');
  const tCoursePage = useTranslations('coursePage');
  const locale = useLocale();

  const getStartTimeString = useStartTimeString();
  const getEndTimeString = useEndTimeString();
  const { timeZone } = useAppSettings();

  // Get ECTS translations object to handle keys with dots/commas
  const ectsTranslations = tCourse.raw('ects') as Record<string, string>;

  // Normalize ECTS key (replace dots with underscores) for translation lookup
  const normalizedEctsKey = course.ects?.replaceAll('.', '_') || course.ects;

  // A degree does not award ECTS of its own - it states how many have to be collected
  // from its member courses (Course.requiredEcts). That is a real number rather than one
  // of the few fixed Course.ects strings, so it is formatted instead of looked up.
  const isDegreeCourse = course.Program?.type === 'DEGREES';
  const isEventCourse = course.Program?.type === 'EVENTS';
  const requiredEctsDisplay =
    course.requiredEcts != null
      ? Number(course.requiredEcts).toLocaleString(locale, { maximumFractionDigits: 1 })
      : null;

  // Format price helper
  const formatPrice = useCallback((priceInCents: number, currency: string): string => {
    const price = priceInCents / 100;
    const formatter = new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatter.format(price)} ${currency}`;
  }, [locale]);

  // Check if registration requires payment
  const registrationConfig = course.registrationType
    ? getRegistrationTypeConfig(course.registrationType)
    : null;
  const requiresPayment = registrationConfig?.requiresPayment ?? false;

  // Check if course has price
  const basePrice = course.basePrice || 0;
  const currency = course.currency || 'EUR';
  const hasPrice = basePrice > 0;
  const hasAddons = course.CourseAddonMappings && course.CourseAddonMappings.length > 0;
  // Only show price if registration requires payment
  const showPrice = requiresPayment && (hasPrice || course.basePrice === 0 || course.basePrice === null);

  // Get next upcoming session (or last session if no future sessions) when weekday is NONE
  const relevantSession = useMemo(() => {
    if (course.weekDay !== 'NONE' || !course.Sessions || course.Sessions.length === 0) {
      return null;
    }
    // Sessions are already ordered by startDateTime asc in the query
    const now = new Date();
    // Find the next future session
    const futureSession = course.Sessions.find(
      (session) => session.startDateTime && new Date(session.startDateTime) > now
    );
    // If no future session exists, return the last session (most recent past session)
    return futureSession || course.Sessions.at(-1);
  }, [course.weekDay, course.Sessions]);

  // Format session date and time
  const sessionDisplay = useMemo(() => {
    if (!relevantSession?.startDateTime) return null;
    const sessionDate = new Date(relevantSession.startDateTime);
    const dateStr = sessionDate.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeStr = getStartTimeString(relevantSession.startDateTime);
    const endTimeStr = relevantSession.endDateTime ? getEndTimeString(relevantSession.endDateTime) : null;
    return (
      <>
        {dateStr} {timeStr}
        {endTimeStr ? <span> - {endTimeStr}</span> : ''}
      </>
    );
  }, [relevantSession, locale, getStartTimeString, getEndTimeString]);

  const eventDateSpan = useMemo(
    () => (isEventCourse ? formatSessionDateSpan(course.Sessions ?? [], timeZone) : null),
    [isEventCourse, course.Sessions, timeZone]
  );

  // Build location text
  const locationText = useMemo(() => {
    if (!course.CourseLocations || course.CourseLocations.length === 0) return null;
    return course.CourseLocations.map((location, index) => (
      <Fragment key={`location-${location.id || index}`}>
        {location.locationOption}
        {index < course.CourseLocations.length - 1 && ' + '}
      </Fragment>
    ));
  }, [course.CourseLocations]);

  const hasEventDateSpan = !!eventDateSpan;
  const hasWeekday = !isEventCourse && course.weekDay !== 'NONE';
  const hasSessionDate = !isEventCourse && course.weekDay === 'NONE' && sessionDisplay;
  // Only show ECTS if achievement certificate is possible
  const hasEcts = isDegreeCourse
    ? !!requiredEctsDisplay
    : !!course.ects && course.achievementCertificatePossible === true;
  const hasLocation = !!locationText;
  const hasLanguage = !!course.language;
  // How many people are taking part is the default, and says the course is
  // alive without advertising how empty it is. How many places are left is the
  // opt-in (Course.showAvailablePlaces), and only while it still means
  // something: a full course says so through the waitlist CTA, and a closed one
  // should not offer free places beside a notice saying you can no longer take
  // them.
  // Two different questions, two different numbers. What the page states is
  // publicParticipantCount (CONFIRMED + REGISTERED): people who have actually
  // taken their place. How many places are left is measured against
  // activeParticipantCount, which also counts INVITED, because a held seat is
  // not available - so a course can read "18 participants" while being full at
  // 20, and both statements are true.
  const participantCount = Number(course.publicParticipantCount ?? 0);
  const occupiedPlaces = Number(course.activeParticipantCount ?? 0);
  // No cap, or a cap of zero, means there is no capacity to report - stated
  // explicitly rather than left to fall out of `placesLeft > 0`, so the rule
  // survives a change to how places are counted.
  const maxParticipants = course.maxParticipants && course.maxParticipants > 0 ? course.maxParticipants : null;
  const placesLeft = maxParticipants != null ? Math.max(0, maxParticipants - occupiedPlaces) : null;
  const showsPlaces =
    !!course.showAvailablePlaces &&
    maxParticipants != null &&
    placesLeft != null &&
    placesLeft > 0 &&
    !isRegistrationClosed(course.applicationEnd);
  const showsParticipantCount = !showsPlaces && participantCount > 0;

  // Build array of info elements to display
  const infoElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    // Event date span, weekday, or single session date
    if (hasEventDateSpan) {
      elements.push(
        <Fact key="event-date" icon={<MdCalendarMonth size={20} />} label={tCourse('info.dates')}>
          {eventDateSpan}
        </Fact>
      );
    } else if (hasWeekday) {
      elements.push(
        <Fact key="weekday" icon={<MdCalendarMonth size={20} />} label={tCourse('info.dates')}>
          {getWeekdayString(course, t, false, false)}
          <span className="block font-medium text-label-secondary mt-0.5">
            {getStartTimeString(course.startTime)}
            {course.endTime ? <span> - {getEndTimeString(course.endTime)}</span> : ''}
          </span>
        </Fact>
      );
    } else if (hasSessionDate) {
      elements.push(
        <Fact key="session-date" icon={<MdCalendarMonth size={20} />} label={tCourse('info.dates')}>
          {sessionDisplay}
        </Fact>
      );
    }

    // ECTS
    if (hasEcts) {
      elements.push(
        <Fact key="ects" icon={<MdSchool size={20} />} label={tCourse('general.ects')}>
          {isDegreeCourse ? requiredEctsDisplay : ectsTranslations[normalizedEctsKey] || course.ects}
        </Fact>
      );
    }

    // Price
    if (showPrice) {
      elements.push(
        <Fact key="price" icon={<MdAttachMoney size={20} />} label={tCourse('info.price')}>
          {hasPrice ? (
            <>
              {formatPrice(basePrice, currency)}
              {hasAddons && (
                <span className="block font-medium text-label-secondary mt-0.5">
                  + {tCoursePage('add_ons')}
                </span>
              )}
            </>
          ) : basePrice === 0 && hasAddons ? (
            tCoursePage('variable_price')
          ) : (
            tCoursePage('free_course')
          )}
        </Fact>
      );
    }

    // Location
    if (hasLocation) {
      elements.push(
        <Fact
          key="location"
          icon={
            <Image
              src="/images/course/pin.svg"
              alt=""
              aria-hidden="true"
              width={20}
              height={20}
              unoptimized
              className="w-5 h-5 object-contain"
            />
          }
          label={tCourse('info.location')}
        >
          {locationText}
        </Fact>
      );
    }

    // Language
    if (hasLanguage) {
      elements.push(
        <Fact
          key="language"
          icon={
            <Image
              src="/images/course/language.svg"
              alt=""
              aria-hidden="true"
              width={20}
              height={20}
              unoptimized
              className="w-5 h-5 object-contain"
            />
          }
          label={tCourse('info.language')}
        >
          {t(course.language ?? '')}
        </Fact>
      );
    }

    // Places left, or simply how many are taking part
    if (showsPlaces && placesLeft != null && maxParticipants != null) {
      elements.push(
        <Fact key="places" icon={<MdPeopleOutline size={20} />} label={tCourse('info.places')}>
          {tCourse('info.places_left', { count: placesLeft })}
          <span className="block font-medium text-label-secondary mt-0.5">
            {tCourse('info.places_total', { count: maxParticipants })}
          </span>
        </Fact>
      );
    } else if (showsParticipantCount) {
      elements.push(
        <Fact key="participants" icon={<MdPeopleOutline size={20} />} label={tCourse('info.participants')}>
          {tCourse('info.participant_count', { count: participantCount })}
        </Fact>
      );
    }

    return elements;
  }, [
    hasEventDateSpan,
    eventDateSpan,
    hasWeekday,
    hasSessionDate,
    hasEcts,
    showPrice,
    showsPlaces,
    showsParticipantCount,
    participantCount,
    placesLeft,
    maxParticipants,
    hasLocation,
    hasLanguage,
    course,
    t,
    tCourse,
    tCoursePage,
    sessionDisplay,
    locationText,
    getStartTimeString,
    getEndTimeString,
    formatPrice,
    basePrice,
    currency,
    hasPrice,
    hasAddons,
    ectsTranslations,
    normalizedEctsKey,
    isDegreeCourse,
    requiredEctsDisplay,
  ]);

  return infoElements.length > 0 ? <dl className="flex flex-col gap-4">{infoElements}</dl> : null;
};
