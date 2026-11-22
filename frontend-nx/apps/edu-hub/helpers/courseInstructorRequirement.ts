import { ProgramType } from '../types/enums';

/**
 * A published course or event needs at least one instructor (shown as
 * "organizer" for events); degrees have none. The database enforces the same
 * rule (migration `require_instructor_for_published_course`); these helpers
 * let the management UI explain it before a request fails.
 */
export const requiresInstructorWhenPublished = (programType: ProgramType | null | undefined): boolean =>
  programType !== ProgramType.DEGREES;

/**
 * The courses that cannot be published yet because they have no instructor.
 * Already-published ones are left out: publishing them again changes nothing,
 * and courses published before the rule may lack an instructor.
 */
export const coursesWithoutInstructor = <T extends { published: boolean; CourseInstructors: ReadonlyArray<unknown> }>(
  courses: ReadonlyArray<T>,
  programType: ProgramType | null | undefined
): T[] =>
  requiresInstructorWhenPublished(programType)
    ? courses.filter((c) => !c.published && c.CourseInstructors.length === 0)
    : [];

/** Whether removing one instructor would leave a published course or event without any. */
export const isLastInstructorOfPublishedCourse = (
  course: { published: boolean; CourseInstructors: ReadonlyArray<unknown> },
  programType: ProgramType | null | undefined
): boolean =>
  course.published && requiresInstructorWhenPublished(programType) && course.CourseInstructors.length <= 1;
