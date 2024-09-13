import { CourseWithEnrollment_Course_by_pk } from "../graphql/__generated__/CourseWithEnrollment";

export const useIsCourseWithEnrollment = (
    course: any
  ): course is CourseWithEnrollment_Course_by_pk => {
    if (!course) return false;
    return 'CourseEnrollments' in course;
  }
  