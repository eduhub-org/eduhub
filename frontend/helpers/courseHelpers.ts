import { Course_Course_by_pk } from "../queries/__generated__/Course";
import { CourseWithEnrollment_Course_by_pk } from "../queries/__generated__/CourseWithEnrollment";

export const hasProgram = (
  course: Course_Course_by_pk | CourseWithEnrollment_Course_by_pk
): course is CourseWithEnrollment_Course_by_pk => {
  return "Program" in course;
};

export const hasEnrollments = (
  course: Course_Course_by_pk | CourseWithEnrollment_Course_by_pk
): course is CourseWithEnrollment_Course_by_pk => {
  return "Enrollments" in course;
};

export const enrollmentStatusForCourse = (
  course: Course_Course_by_pk | CourseWithEnrollment_Course_by_pk
) => {
  if (!hasEnrollments(course) || course.Enrollments.length !== 1) {
    return "NOT_APPLIED";
  }

  return course.Enrollments[0].Status;
};
