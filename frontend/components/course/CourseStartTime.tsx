import React from "react";
import { useTranslation } from "react-i18next";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";

interface IProps {
  course: Course_Course_by_pk;
}

export const CourseStartTime: React.FC<IProps> = ({ course }) => {
  const { i18n } = useTranslation();

  const startTime: string =
    course.TimeOfStart?.toLocaleTimeString(i18n.languages, {
      hour: "numeric",
      minute: "numeric",
    }) ?? "";

  return <>{startTime}</>;
};
