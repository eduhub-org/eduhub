import { FC } from "react";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";

import { CourseEndTime } from "./CourseEndTime";
import { CourseStartTime } from "./CourseStartTime";
import { CourseWeekday } from "./CourseWeekday";

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseTitleSubTitleBlock: FC<IProps> = ({ course }) => {
  return (
    <div className="flex flex-1 flex-col">
      <span className="text-xs">
        <CourseWeekday course={course} /> <CourseStartTime course={course} />
        {" - "}
        <CourseEndTime course={course} />
      </span>
      <span className="text-5xl">{course.Name}</span>
      <span className="text-2xl mt-2">{course.ShortDescription}</span>
    </div>
  );
};
