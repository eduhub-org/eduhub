import Image from 'next/image';
import { FC, useMemo, useCallback, Fragment, type JSX } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MdAttachMoney, MdCalendarMonth } from 'react-icons/md';

import { useStartTimeString, useEndTimeString, getWeekdayString } from '../../../helpers/dateTimeHelpers';
import { Course_Course_by_pk } from '../../../queries/__generated__/Course';
import UserCard from '../../common/UserCard';
import { getRegistrationTypeConfig } from './Registration/types';

interface IProps {
  course: Course_Course_by_pk;
}

export const InfoPanel: FC<IProps> = ({ course }) => {
  const t = useTranslations('common');
  const tCourse = useTranslations('course');
  const tCoursePage = useTranslations('coursePage');
  const locale = useLocale();

  const getStartTimeString = useStartTimeString();
  const getEndTimeString = useEndTimeString();

  // Get ECTS translations object to handle keys with dots/commas
  const ectsTranslations = tCourse.raw('ects') as Record<string, string>;
  
  // Normalize ECTS key (replace dots with underscores) for translation lookup
  const normalizedEctsKey = course.ects?.replaceAll('.', '_') || course.ects;

  // A degree does not award ECTS of its own - it states how many have to be collected
  // from its member courses (Course.requiredEcts). That is a real number rather than one
  // of the few fixed Course.ects strings, so it is formatted instead of looked up.
  const isDegreeCourse = course.Program?.type === 'DEGREES';
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

  const hasWeekday = course.weekDay !== 'NONE';
  const hasSessionDate = course.weekDay === 'NONE' && sessionDisplay;
  // Only show ECTS if achievement certificate is possible
  const hasEcts = isDegreeCourse
    ? !!requiredEctsDisplay
    : !!course.ects && course.achievementCertificatePossible === true;
  const hasLocation = !!locationText;
  const hasLanguage = !!course.language;

  // Build array of info elements to display
  const infoElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    // Weekday or Session date
    if (hasWeekday) {
      elements.push(
        <div key="weekday" className="flex flex-col items-center">
          <span className="text-lg mt-2 text-center">{getWeekdayString(course, t, false, false)}</span>
          <span className="text-sm mt-2 text-center">
            {getStartTimeString(course.startTime)}
            {course.endTime ? <span> - {getEndTimeString(course.endTime)}</span> : ''}
          </span>
        </div>
      );
    } else if (hasSessionDate) {
      elements.push(
        <div key="session-date" className="flex flex-col items-center">
          <div className="flex justify-center items-center mb-2">
            <MdCalendarMonth className="text-label-primary" size={28} />
          </div>
          <span className="text-sm mt-2 text-center">{sessionDisplay}</span>
        </div>
      );
    }

    // ECTS
    if (hasEcts) {
      elements.push(
        <div key="ects" className="flex flex-col items-center">
          <span className="text-lg mt-2 text-center">{tCourse('general.ects')}</span>
          <span className="text-sm mt-2 text-center">
            {isDegreeCourse ? requiredEctsDisplay : ectsTranslations[normalizedEctsKey] || course.ects}
          </span>
        </div>
      );
    }

    // Price
    if (showPrice) {
      elements.push(
        <div key="price" className="flex flex-col items-center">
          <div className="flex justify-center items-center mt-2">
            <MdAttachMoney className="text-label-primary" size={28} />
          </div>
          <span className="text-sm mt-2 text-center">
            {hasPrice ? (
              <>
                {formatPrice(basePrice, currency)}
                {hasAddons && (
                  <span className="block text-label-secondary text-xs mt-1">
                    + {tCoursePage('add_ons')}
                  </span>
                )}
              </>
            ) : basePrice === 0 && hasAddons ? (
              tCoursePage('variable_price')
            ) : (
              tCoursePage('free_course')
            )}
          </span>
        </div>
      );
    }

    // Location
    if (hasLocation) {
      elements.push(
        <div key="location" className="flex flex-col items-center">
          <div className="flex justify-center items-center mt-2">
            <Image src="/images/course/pin.svg" alt="Location" width={32} height={43} unoptimized className="w-full h-full object-contain max-w-8 max-h-[43px]" />
          </div>
          <span className="text-sm mt-2 text-center">{locationText}</span>
        </div>
      );
    }

    // Language
    if (hasLanguage) {
      elements.push(
        <div key="language" className="flex flex-col items-center">
          <div className="flex justify-center items-center mt-2">
            <Image src="/images/course/language.svg" alt="Language" width={47} height={40} unoptimized className="w-full h-full object-contain max-w-[47px] max-h-10" />
          </div>
          <span className="text-sm mt-2 text-center">{t(course.language ?? '')}</span>
        </div>
      );
    }

    return elements;
  }, [
    hasWeekday,
    hasSessionDate,
    hasEcts,
    showPrice,
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

  return (
    <div className="flex flex-1 flex-col justify-center items-center mx-6 lg:mx-0 mb-9 rounded-2xl lg:max-w-md bg-fill-primary text-label-primary light p-12 sm:p-24">
      {/* All info elements in a 2-column grid */}
      {infoElements.length > 0 && (
        <div className="grid grid-cols-2 gap-x-28 gap-y-8 w-full mb-8">
          {infoElements}
        </div>
      )}

      {/* Instructors */}
      {course.CourseInstructors && course.CourseInstructors.length > 0 && (
        <div className="mt-16 justify-start w-full">
          {course.CourseInstructors.map((instructor) => (
            <UserCard className="flex items-center mb-6" key={`instructor-${instructor.id || instructor.User?.id}`} user={instructor.User} />
          ))}
        </div>
      )}
    </div>
  );
};
