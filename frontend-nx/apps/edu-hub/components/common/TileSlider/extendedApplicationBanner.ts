import { isRegistrationClosed } from '../../pages/CourseContent/Registration/types';

/**
 * The course is "extended" once the program's default deadline has passed while
 * the course's own deadline is still open. Both use the same calendar-day rule as
 * the registration button, so the deadline day itself still counts as open and
 * the badge stays up until registration actually closes.
 */
export const shouldShowExtendedApplicationBanner = (
  applicationEnd: Date | null,
  programApplicationEnd: Date | null,
  programBannerEnabled: boolean,
  now: Date = new Date()
): boolean => {
  if (!programBannerEnabled || !applicationEnd || !programApplicationEnd) {
    return false;
  }

  return isRegistrationClosed(programApplicationEnd, now) && !isRegistrationClosed(applicationEnd, now);
};
