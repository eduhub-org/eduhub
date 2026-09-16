/**
 * schema.org JSON-LD for the public course page.
 *
 * The three program types are three different things and get three different
 * schema types: an event is an `Event`, a course is a `Course` carrying a
 * `CourseInstance`, and a degree is an `EducationalOccupationalProgram`. Using
 * `Event` for a semester course (or vice versa) would be wrong, and only the
 * first two have a Google rich result.
 *
 * Pure and free of React so the page can call it from `getServerSideProps` and
 * put the result in the initial HTML, where every crawler sees it.
 */

import { getPublicImageUrl } from './filehandling';
import { firstSessionStart, lastSessionEnd, ScheduleSession } from './sessionSchedule';

type SeoUser = { firstName: string | null; lastName: string | null } | null;

export type StructuredDataSession = ScheduleSession & {
  id: number;
  title?: string | null;
  description?: string | null;
  SessionSpeakers?: { User: SeoUser }[] | null;
};

export type StructuredDataCourse = {
  id: number;
  title: string;
  tagline?: string | null;
  coverImage?: string | null;
  language?: string | null;
  applicationEnd?: any;
  basePrice?: number | null;
  currency?: string | null;
  maxParticipants?: number | null;
  requiredEcts?: any;
  contentDescriptionField1?: string | null;
  Program?: { type?: string | null } | null;
  CourseLocations?: { locationOption?: string | null; defaultSessionAddress?: string | null }[] | null;
  Sessions?: StructuredDataSession[] | null;
  CourseInstructors?: { User: SeoUser }[] | null;
  DegreeCourses?:
    | { Course: { id: number; title: string; published: boolean; Program?: { published: boolean } | null } | null }[]
    | null;
};

export interface StructuredDataOptions {
  /** Origin of the current request, e.g. "https://edu.opencampus.sh". */
  siteUrl: string;
}

const personName = (user: SeoUser): string | null => {
  if (!user) return null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || null;
};

const people = (entries: { User: SeoUser }[] | null | undefined) => {
  const names = new Set<string>();
  for (const entry of entries ?? []) {
    const name = personName(entry?.User);
    if (name) names.add(name);
  }
  return [...names].map((name) => ({ '@type': 'Person', name }));
};

const toIsoString = (value: Date | string | null | undefined): string | null => {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/** Drops keys whose value is null, undefined or an empty array. */
const compact = <T extends Record<string, any>>(object: T): Record<string, any> =>
  Object.fromEntries(
    Object.entries(object).filter(([, value]) => value != null && !(Array.isArray(value) && value.length === 0))
  );

const courseUrl = (course: StructuredDataCourse, siteUrl: string) => `${siteUrl}/course/${course.id}`;

const imageUrl = (course: StructuredDataCourse) => getPublicImageUrl(course.coverImage ?? null, 1280) ?? undefined;

const description = (course: StructuredDataCourse) =>
  (course.tagline || course.contentDescriptionField1 || '').trim() || undefined;

const provider = (siteUrl: string) => ({
  '@type': 'EducationalOrganization',
  name: 'EduHub',
  url: siteUrl,
});

const locationOptions = (course: StructuredDataCourse) =>
  (course.CourseLocations ?? []).map((location) => location?.locationOption).filter(Boolean) as string[];

/** OfflineEventAttendanceMode / OnlineEventAttendanceMode / MixedEventAttendanceMode. */
const attendanceMode = (course: StructuredDataCourse): string | undefined => {
  const options = locationOptions(course);
  if (options.length === 0) return undefined;
  const hasOnline = options.includes('ONLINE');
  const hasOffline = options.some((option) => option !== 'ONLINE');
  if (hasOnline && hasOffline) return 'https://schema.org/MixedEventAttendanceMode';
  return hasOnline ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode';
};

/** online / onsite / blended, the CourseInstance equivalent of the above. */
const courseMode = (course: StructuredDataCourse): string | undefined => {
  const options = locationOptions(course);
  if (options.length === 0) return undefined;
  const hasOnline = options.includes('ONLINE');
  const hasOffline = options.some((option) => option !== 'ONLINE');
  if (hasOnline && hasOffline) return 'blended';
  return hasOnline ? 'online' : 'onsite';
};

const locations = (course: StructuredDataCourse, siteUrl: string) =>
  (course.CourseLocations ?? [])
    .map((location) => {
      if (!location?.locationOption) return null;
      if (location.locationOption === 'ONLINE') {
        return { '@type': 'VirtualLocation', url: courseUrl(course, siteUrl) };
      }
      return compact({
        '@type': 'Place',
        name: location.locationOption,
        address: location.defaultSessionAddress?.trim() || location.locationOption,
      });
    })
    .filter(Boolean);

/**
 * Every course has an offer: a paid one carries its price, everything else is
 * explicitly free, which is what search results want to show.
 */
const offers = (course: StructuredDataCourse, siteUrl: string) => {
  const priceInCents = course.basePrice ?? 0;
  return compact({
    '@type': 'Offer',
    price: (priceInCents / 100).toFixed(2),
    priceCurrency: course.currency || 'EUR',
    url: courseUrl(course, siteUrl),
    validThrough: toIsoString(course.applicationEnd),
  });
};

const sessionSpan = (course: StructuredDataCourse) => {
  const sessions = course.Sessions ?? [];
  return {
    startDate: toIsoString(firstSessionStart(sessions)),
    endDate: toIsoString(lastSessionEnd(sessions)),
  };
};

const buildEvent = (course: StructuredDataCourse, siteUrl: string) => {
  const sessions = course.Sessions ?? [];
  const { startDate, endDate } = sessionSpan(course);
  const eventLocations = locations(course, siteUrl);

  // Each session of a multi-session event is a subEvent: that array is exactly
  // the agenda the page renders.
  const subEvents = sessions.map((session) =>
    compact({
      '@type': 'Event',
      name: session.title || course.title,
      description: session.description?.trim() || undefined,
      startDate: toIsoString(session.startDateTime),
      endDate: toIsoString(session.endDateTime),
      location: eventLocations.length > 0 ? eventLocations : undefined,
      performer: people(session.SessionSpeakers),
    })
  );

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: course.title,
    description: description(course),
    url: courseUrl(course, siteUrl),
    image: imageUrl(course),
    startDate,
    endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: attendanceMode(course),
    location: eventLocations,
    organizer: provider(siteUrl),
    performer: people(sessions.flatMap((session) => session.SessionSpeakers ?? [])),
    offers: offers(course, siteUrl),
    subEvent: subEvents.length > 1 ? subEvents : undefined,
  });
};

const buildCourse = (course: StructuredDataCourse, siteUrl: string) => {
  const { startDate, endDate } = sessionSpan(course);

  const courseInstance = compact({
    '@type': 'CourseInstance',
    courseMode: courseMode(course),
    startDate,
    endDate,
    location: locations(course, siteUrl),
    instructor: people(course.CourseInstructors),
  });

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: description(course),
    url: courseUrl(course, siteUrl),
    image: imageUrl(course),
    provider: provider(siteUrl),
    inLanguage: course.language ? course.language.toLowerCase() : undefined,
    hasCourseInstance: Object.keys(courseInstance).length > 1 ? courseInstance : undefined,
    offers: offers(course, siteUrl),
  });
};

/**
 * A degree is thin on purpose. EduHub models no duration, credential name,
 * program mode, occupational category or term structure, so those properties are
 * omitted rather than invented; `hasCourse` is the one that carries real signal.
 */
const buildDegree = (course: StructuredDataCourse, siteUrl: string) => {
  const memberCourses = (course.DegreeCourses ?? [])
    .map((degreeCourse) => degreeCourse?.Course)
    .filter((member) => member?.published && member?.Program?.published)
    .map((member) => ({
      '@type': 'Course',
      name: member!.title,
      url: `${siteUrl}/course/${member!.id}`,
    }));

  return compact({
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    name: course.title,
    description: description(course),
    url: courseUrl(course, siteUrl),
    image: imageUrl(course),
    provider: provider(siteUrl),
    numberOfCredits: course.requiredEcts != null ? Number(course.requiredEcts) : undefined,
    applicationDeadline: toIsoString(course.applicationEnd),
    maximumEnrollment: course.maxParticipants ?? undefined,
    offers: offers(course, siteUrl),
    hasCourse: memberCourses,
  });
};

export const buildCourseStructuredData = (
  course: StructuredDataCourse | null | undefined,
  { siteUrl }: StructuredDataOptions
): Record<string, any> | null => {
  if (!course) return null;

  switch (course.Program?.type) {
    case 'EVENTS':
      return buildEvent(course, siteUrl);
    case 'DEGREES':
      return buildDegree(course, siteUrl);
    default:
      return buildCourse(course, siteUrl);
  }
};
