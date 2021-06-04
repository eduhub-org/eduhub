import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";

import { Attendences } from "./Attendences";
import { CourseTitleSubTitleBlock } from "./CourseTitleSubTitleBlock";

interface IProps {
  course: Course_Course_by_pk;
}

export const CoursePageStudentView: FC<IProps> = ({ course }) => {
  const { t, i18n } = useTranslation("course-page");

  return (
    <>
      <CourseTitleSubTitleBlock course={course} />
      <Attendences course={course} />
    </>
  );
};
