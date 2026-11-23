import { CourseSegment, coursePath, courseSegment } from './coursePath';

/**
 * Where a course page should send the visitor when the path segment they used
 * does not match the course's program type, or null when it already matches.
 *
 * Pure so the two things that are easy to get wrong here can be tested without a
 * request: keeping the query string (the MOOCHub feed links carry
 * `?source=moochub&...` and the feed must not lose them) and keeping the locale.
 */
export const courseRedirectDestination = ({
  expectedSegment,
  id,
  programType,
  resolvedUrl,
  locale,
  defaultLocale,
}: {
  expectedSegment: CourseSegment;
  id: number;
  programType?: string | null;
  resolvedUrl: string;
  locale?: string;
  defaultLocale?: string;
}): string | null => {
  if (courseSegment(programType) === expectedSegment) return null;

  const queryStart = resolvedUrl.indexOf('?');
  const search = queryStart === -1 ? '' : resolvedUrl.slice(queryStart);

  // Next applies `basePath` to a getServerSideProps redirect but never the
  // locale, so a bare path would drop `/en` and leave an English visitor in
  // German. The default locale is unprefixed and must stay that way.
  const prefix = locale && locale !== defaultLocale ? `/${locale}` : '';

  return `${prefix}${coursePath(id, programType)}${search}`;
};
