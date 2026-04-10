/**
 * Whether to show the "extended application period" pill on a course tile.
 * Requires the program opt-in and that the program default application end is in the past
 * while the course application end is still open (same date logic as RegistrationButton).
 */
export function shouldShowExtendedApplicationBanner(course: {
  applicationEnd: string | null | undefined;
  Program: {
    defaultApplicationEnd: string | null | undefined;
    showExtendedApplicationBanner: boolean;
  };
}): boolean {
  if (!course.Program.showExtendedApplicationBanner) {
    return false;
  }
  const programEndRaw = course.Program.defaultApplicationEnd;
  const courseEndRaw = course.applicationEnd;
  if (!programEndRaw || !courseEndRaw) {
    return false;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const programEnd = new Date(programEndRaw);
  programEnd.setHours(0, 0, 0, 0);
  const courseEnd = new Date(courseEndRaw);
  courseEnd.setHours(0, 0, 0, 0);

  const programDeadlinePassed = programEnd < now;
  const courseDeadlineStillOpen = courseEnd > now;

  return programDeadlinePassed && courseDeadlineStillOpen;
}
