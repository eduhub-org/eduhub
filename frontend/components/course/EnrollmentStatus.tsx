import { FC } from "react";

import { useAuthedQuery } from "../../hooks/authedQuery";
import { Course_Course_by_pk } from "../../queries/__generated__/Course";
import { MyEnrollmentsForCourseQuery } from "../../queries/__generated__/MyEnrollmentsForCourseQuery";
import { MY_ENROLLMENTS_FOR_COURSE } from "../../queries/myEnrollmentsForCourse";

import { ApplyButtonBlock } from "./ApplyButtonBlock";

interface IProps {
  course: Course_Course_by_pk;
}

export const EnrollmentStatus: FC<IProps> = ({ course }) => {
  const {
    data: enrollments,
    loading,
    error,
  } = useAuthedQuery<MyEnrollmentsForCourseQuery>(MY_ENROLLMENTS_FOR_COURSE, {
    variables: {
      courseId: course.Id,
    },
  });

  if (!enrollments) {
    return <ApplyButtonBlock course={course} />;
  }

  return <div>{enrollments.Enrollment.map((e) => e.Status)}</div>;
};
