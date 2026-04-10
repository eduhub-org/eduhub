export const shouldShowExtendedApplicationBanner = (
  applicationEnd: Date | null,
  programApplicationEnd: Date | null,
  programBannerEnabled: boolean
): boolean => {
  if (!programBannerEnabled || !applicationEnd || !programApplicationEnd) {
    return false;
  }

  const toUtcDayStart = (date: Date): number =>
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  const todayUtc = toUtcDayStart(new Date());
  const normalizedCourseEndUtc = toUtcDayStart(new Date(applicationEnd));
  const normalizedProgramEndUtc = toUtcDayStart(new Date(programApplicationEnd));

  return normalizedProgramEndUtc <= todayUtc && normalizedCourseEndUtc > todayUtc;
};
