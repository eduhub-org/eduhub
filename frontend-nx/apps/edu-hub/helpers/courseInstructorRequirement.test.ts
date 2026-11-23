import { ProgramType } from '../types/enums';
import { coursesWithoutInstructor, isLastInstructorOfPublishedCourse } from './courseInstructorRequirement';

const course = (instructors: number, published = false) => ({
  published,
  CourseInstructors: Array.from({ length: instructors }, (_, i) => ({ id: i })),
});

describe('coursesWithoutInstructor', () => {
  it('lists courses and events that have no instructor', () => {
    const none = course(0);
    expect(coursesWithoutInstructor([none, course(1)], ProgramType.COURSES)).toEqual([none]);
    expect(coursesWithoutInstructor([none, course(2)], ProgramType.EVENTS)).toEqual([none]);
  });

  it('ignores courses that are already published', () => {
    expect(coursesWithoutInstructor([course(0, true)], ProgramType.COURSES)).toEqual([]);
  });

  it('never blocks degrees, which have no instructors', () => {
    expect(coursesWithoutInstructor([course(0)], ProgramType.DEGREES)).toEqual([]);
  });
});

describe('isLastInstructorOfPublishedCourse', () => {
  it('protects the only instructor of a published course or event', () => {
    expect(isLastInstructorOfPublishedCourse(course(1, true), ProgramType.COURSES)).toBe(true);
    expect(isLastInstructorOfPublishedCourse(course(1, true), ProgramType.EVENTS)).toBe(true);
  });

  it('allows removing an instructor when others remain or the course is unpublished', () => {
    expect(isLastInstructorOfPublishedCourse(course(2, true), ProgramType.COURSES)).toBe(false);
    expect(isLastInstructorOfPublishedCourse(course(1, false), ProgramType.COURSES)).toBe(false);
    expect(isLastInstructorOfPublishedCourse(course(1, true), ProgramType.DEGREES)).toBe(false);
  });
});
