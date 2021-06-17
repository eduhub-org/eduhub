import React from "react";
import { useTranslation } from "react-i18next";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseEndTime: React.FC<IProps> = ({ course }) => {
  const { i18n } = useTranslation();

  const endTime = course.Duration
    ? new Date(
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        course.TimeOfStart.getTime() + course.Duration * 60000
      ).toLocaleTimeString(i18n.languages, {
        hour: "numeric",
        minute: "numeric",
      })
    : "";

  return <>{endTime}</>;
};
