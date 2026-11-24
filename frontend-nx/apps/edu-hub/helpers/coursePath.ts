import { ProgramType } from '../types/enums';

/**
 * URL segment per program type. A Course's path says what kind of thing it is, so
 * an event is shared as /event/42 rather than /course/42.
 *
 * "Course" stays the umbrella term in code (see CONTEXT.md: a Course is anything
 * people register for); only the path varies with `Program.type`.
 *
 * `course` is the fallback on purpose. Call sites that do not have the program
 * type loaded still produce a working link, because /course/:id and
 * /manage/course/:id send the visitor on to the matching segment.
 */
const SEGMENT: Record<ProgramType, string> = {
  [ProgramType.COURSES]: 'course',
  [ProgramType.EVENTS]: 'event',
  [ProgramType.DEGREES]: 'degree',
};

/** The three segments a Course can live under, for route-side comparisons. */
export type CourseSegment = 'course' | 'event' | 'degree';

export const courseSegment = (programType?: string | null): CourseSegment =>
  (SEGMENT[programType as ProgramType] ?? SEGMENT[ProgramType.COURSES]) as CourseSegment;

/** Public path of a Course, e.g. /event/42. */
export const coursePath = (id: number, programType?: string | null): string =>
  `/${courseSegment(programType)}/${id}`;

/** Organizer path of a Course, e.g. /manage/event/42. */
export const manageCoursePath = (id: number, programType?: string | null): string =>
  `/manage/${courseSegment(programType)}/${id}`;

/** Absolute public URL, for feeds, emails and anything rendered outside the app. */
export const courseUrl = (id: number, programType: string | null | undefined, baseUrl: string): string =>
  `${baseUrl}${coursePath(id, programType)}`;
