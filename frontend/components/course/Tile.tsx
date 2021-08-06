import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

import { EnrollmentStatus_enum } from "../../__generated__/globalTypes";
import { enrollmentStatusForCourse } from "../../helpers/courseHelpers";
import { CourseList_Course } from "../../queries/__generated__/CourseList";
import { CourseListWithEnrollments_Course } from "../../queries/__generated__/CourseListWithEnrollments";

interface IProps {
  course: CourseList_Course | CourseListWithEnrollments_Course;
}

const colorForEnrollmentStatus = (
  status: EnrollmentStatus_enum | "NOT_APPLIED"
): string => {
  if (
    status === EnrollmentStatus_enum.APPLIED ||
    status === EnrollmentStatus_enum.CONFIRMED
  ) {
    return "bg-green-500";
  }
  if (
    status === EnrollmentStatus_enum.REJECTED ||
    status === EnrollmentStatus_enum.ABORTED
  ) {
    return "bg-gray-300";
  }
  if (status === EnrollmentStatus_enum.INVITED) {
    return "bg-red-300";
  }
  return "";
};

const CourseStatusIndicator: FC<{
  enrollmentStatus: EnrollmentStatus_enum | "NOT_APPLIED";
}> = ({ enrollmentStatus }) => {
  const color = colorForEnrollmentStatus(enrollmentStatus);

  if (enrollmentStatus === EnrollmentStatus_enum.COMPLETED) {
    return (
      <div className="absolute top-0 right-3">
        <Image src="/images/course/completed_flag.svg" width={37} height={46} />
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

  return (
    <Link href={`/course/${course.Id}`}>
      <a>
        <div className="relative w-60 h-72 rounded-2xl overflow-hidden">
          <div className="h-1/2 bg-edu-black">
            <Image
              src={course.Image ?? "https://picsum.photos/240/144"}
              alt="Edu Hub logo"
              width={240}
              height={144}
              priority
            />
            <CourseStatusIndicator enrollmentStatus={enrollmentStatus} />
          </div>
          <div className="flex h-1/2 flex-col justify-between bg-gray-100 p-3">
            <span className="text-base">{course.Name}</span>
            <span className="text-xs uppercase">Kurs</span>
          </div>
        </div>
      </a>
    </Link>
  );
};
