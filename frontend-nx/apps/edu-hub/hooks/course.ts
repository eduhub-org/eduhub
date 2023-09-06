import { CourseWithEnrollment_Course_by_pk } from "../queries/__generated__/CourseWithEnrollment";

export const useIsCourseWithEnrollment = (
    course: any
  ): course is CourseWithEnrollment_Course_by_pk => {
    if (!course) return false;
    return 'CourseEnrollments' in course;
  }
  