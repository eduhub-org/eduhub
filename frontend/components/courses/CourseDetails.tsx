import { FC } from "react";
import {
  CourseListWithFilter,
  CourseListWithFilter_Course,
} from "../../queries/__generated__/CourseListWithFilter";

interface IPros {
  course: CourseListWithFilter_Course;
}

const CourseDetails: FC<IPros> = ({ course }) => {
  return (
    <>
      <tr className="h-40" />
      <tr className="h-1" />
    </>
  );
};

export default CourseDetails;
