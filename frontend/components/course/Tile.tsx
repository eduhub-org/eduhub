import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

import { CourseEnrollmentStatus_enum } from "../../__generated__/globalTypes";
import {
  enrollmentStatusForCourse,
  hasEnrollments,
  hasProgram,
} from "../../helpers/courseHelpers";
import { CourseList_Course } from "../../queries/__generated__/CourseList";
import { CourseListWithEnrollments_Course } from "../../queries/__generated__/CourseListWithEnrollments";
import { CourseWithEnrollment_Course_by_pk_CourseEnrollments } from "../../queries/__generated__/CourseWithEnrollment";
import { useIsInstructor } from "../../hooks/authentication";

interface IProps {
  course: CourseList_Course | CourseListWithEnrollments_Course;
}

const colorForEnrollmentStatus = (
  status: CourseEnrollmentStatus_enum | "NOT_APPLIED",
  enrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments | undefined
): string => {
  if (
    status === CourseEnrollmentStatus_enum.APPLIED ||
    status === CourseEnrollmentStatus_enum.CONFIRMED
  ) {
    return "bg-edu-course-current";
  }
  if (
    status === CourseEnrollmentStatus_enum.REJECTED ||
    status === CourseEnrollmentStatus_enum.ABORTED
  ) {
    return "bg-gray-300";
  }
  if (status === CourseEnrollmentStatus_enum.INVITED) {
    if (
      !enrollment?.invitationExpirationDate ||
      (enrollment && new Date() < enrollment.invitationExpirationDate)
    ) {
      return "bg-edu-course-invited";
    } else {
      // invitation is expired
      return "bg-gray-300";
    }
  }
  return "";
};

const CourseStatusIndicator: FC<{
  enrollmentStatus: CourseEnrollmentStatus_enum | "NOT_APPLIED";
  enrollment: CourseWithEnrollment_Course_by_pk_CourseEnrollments | undefined;
}> = ({ enrollmentStatus, enrollment }) => {
  const color = colorForEnrollmentStatus(enrollmentStatus, enrollment);

  if (enrollmentStatus === CourseEnrollmentStatus_enum.COMPLETED) {
    return (
      <div className="absolute top-0 right-3">
        <Image
          src="/images/course/completed_flag.svg"
          width={37}
          height={46}
          alt="completed flag"
        />
      </div>
    );
  }
  // if (
  //   enrollmentStatus === EnrollmentStatus_enum.APPLIED ||
  //   enrollmentStatus === EnrollmentStatus_enum.CONFIRMED ||
  //   enrollmentStatus === EnrollmentStatus_enum.REJECTED ||
  //   enrollmentStatus === EnrollmentStatus_enum.ABORTED ||
  //   enrollmentStatus === EnrollmentStatus_enum.INVITED
  // )
  else {
    return (
      <div className="absolute top-3 right-3">
        <div className={`rounded-full w-9 h-9 ${color}`} />;
      </div>
    );
  }
};

export const Tile: FC<IProps> = ({ course }) => {
  const enrollmentStatus = enrollmentStatusForCourse(course);

  const program = hasProgram(course) ? course.Program : undefined;
  const enrollment =
    hasEnrollments(course) && course.CourseEnrollments.length === 1
      ? course.CourseEnrollments[0]
      : undefined;

  const currentDate = new Date();
  const isCurrentProgram =
    !!program &&
    program?.applicationStart <= currentDate &&
    currentDate <= program?.achievementRecordUploadDeadline;

  const highlightColor =
    enrollmentStatus === CourseEnrollmentStatus_enum.CONFIRMED &&
      isCurrentProgram
      ? "bg-edu-course-current"
      : "bg-gray-100";

  const isInstructor = useIsInstructor();

  return (
    <Link
      href={
        isInstructor ? `/manage/course/${course.id}` : `/course/${course.id}`
      }
    >
      <div className="relative w-60 h-72 rounded-2xl overflow-hidden">
        <div className="h-1/2 bg-edu-black">
          <img
            src={course.coverImage ?? "https://picsum.photos/240/144"}
            alt="Edu Hub logo"
            width={240}
            height={144}
            className="h-36 w-60"
          />
          <CourseStatusIndicator
            enrollmentStatus={enrollmentStatus}
            enrollment={enrollment}
          />
        </div>
        <div
          className={`flex h-1/2 flex-col justify-between ${highlightColor} p-3`}
        >
          <span className="text-base">{course.title}</span>
          <span className="text-xs uppercase">Kurs</span>
        </div>
      </div>
    </Link>
  );
};
