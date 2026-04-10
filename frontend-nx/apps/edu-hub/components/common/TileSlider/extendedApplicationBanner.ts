export const shouldShowExtendedApplicationBanner = (
  applicationEnd: Date | null,
  programApplicationEnd: Date | null,
  programBannerEnabled: boolean
): boolean => {
  if (!programBannerEnabled || !applicationEnd || !programApplicationEnd) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizedCourseEnd = new Date(applicationEnd);
  normalizedCourseEnd.setHours(0, 0, 0, 0);

  const normalizedProgramEnd = new Date(programApplicationEnd);
  normalizedProgramEnd.setHours(0, 0, 0, 0);

  return normalizedProgramEnd <= today && normalizedCourseEnd > today;
};
