import { Course_Course_by_pk } from '../queries/__generated__/Course';
import { CourseWithEnrollment_Course_by_pk } from '../queries/__generated__/CourseWithEnrollment';
import {
  ManagedCourse_Course_by_pk_CourseEnrollments,
  ManagedCourse_Course_by_pk_Sessions,
} from '../queries/__generated__/ManagedCourse';
import { AttendanceStatus_enum } from '../__generated__/globalTypes';

export const hasProgram = (
  course: Course_Course_by_pk | CourseWithEnrollment_Course_by_pk
): course is CourseWithEnrollment_Course_by_pk => {
  return 'Program' in course;
};

/**
 * Checks if a course has enrollments, indicating that it is a course with enrollment.
 * @param course - The course to check.
 * @returns True if the course has enrollments, false otherwise.
 */
export const hasEnrollments = (
  course: Course_Course_by_pk | CourseWithEnrollment_Course_by_pk
): course is CourseWithEnrollment_Course_by_pk => {
  return 'CourseEnrollments' in course;
};

/**
 * Gets the enrollment status for a course.
 * @param course - The course to get the enrollment status for.
 * @returns The enrollment status for the course, or 'NOT_APPLIED' if the course has no enrollments.
 */
export const enrollmentStatusForCourse = (
  course: Course_Course_by_pk | CourseWithEnrollment_Course_by_pk
) => {
  if (!hasEnrollments(course) || course.CourseEnrollments.length < 1) {
    return 'NOT_APPLIED';
  }

  return course.CourseEnrollments[0].status;
};

/**
 * Gets an array of attendance records for each participant in a course enrollment array.
 * @param participationList - The course enrollment array to get attendance records for.
 * @param sessions - The sessions array to get attendance records for.
 * @returns An array of attendance records for each participant in the provided course enrollment array.
 */
export const getAttendancesForParticipants = (
  participationList: ManagedCourse_Course_by_pk_CourseEnrollments[],
  sessions: ManagedCourse_Course_by_pk_Sessions[]
) => {
  const attendances = participationList.flatMap((participant) => {
    const attendances = sessions.map((session) => {
      //get all attendance records for a single session (there might be multiple if the status was changed over time)
      // const attendancesForSession = enrollment?.User.Attendances.filter(
      const attendancesForSession = participant.User.Attendances.filter(
          (attendance) => attendance.Session.id === session.id
      );
      // get the attendance that was added last by selecting the one with th highest id
      const attendance =
        attendancesForSession &&
        attendancesForSession.length > 0 &&
        attendancesForSession.sort((a, b) => b.id - a.id)[0];
      return {
        userId: participant.userId,
        sessionId: session.id,
        date: session.startDateTime,
        status: attendance?.status || AttendanceStatus_enum.NO_INFO,
      };
    });
    return attendances;
  });
  return attendances;
};
