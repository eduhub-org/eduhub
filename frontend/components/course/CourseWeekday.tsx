import React from "react";
import { useTranslation } from "react-i18next";

import { Course_Course_by_pk } from "../../queries/__generated__/Course";

interface IProps {
  course: Course_Course_by_pk;
  short?: boolean;
  uppercased?: boolean;
}

export const CourseWeekday: React.FC<IProps> = ({
  course,
  short = false,
  uppercased = false,
}) => {
  const { t } = useTranslation();

  if (!course.DayOfTheWeek) return null;

  const weekday = short
    ? t(`${course.DayOfTheWeek}-short`)
    : t(course.DayOfTheWeek);

  return <>{uppercased ? weekday.toUpperCase() : weekday}</>;
};
