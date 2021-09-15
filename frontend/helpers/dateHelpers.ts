import { I18n, TFunction } from "next-i18next";

import { Course_Course_by_pk } from "../queries/__generated__/Course";

export const getWeekdayString = (
  course: Course_Course_by_pk,
  t: TFunction,
  short: boolean,
  uppercased: boolean
) => {
  if (!course.weekDay) return null;

  const weekday = short ? t(`${course.weekDay}-short`) : t(course.weekDay);

  return uppercased ? weekday.toUpperCase() : weekday;
};

export const getStartTimeString = (course: Course_Course_by_pk, i18n: I18n) => {
  const startTime: string =
    course.startTime?.toLocaleTimeString(i18n.languages, {
      hour: "numeric",
      minute: "numeric",
    }) ?? "";

  return startTime;
};

export const getEndTimeString = (course: Course_Course_by_pk, i18n: I18n) => {
  const endTime =
    course.endTime?.toLocaleTimeString(i18n.languages, {
      hour: "numeric",
      minute: "numeric",
    }) ?? "";

  return endTime ?? null;
};

export const getWeekdayStartAndEndString = (
  course: Course_Course_by_pk,
  i18n: I18n,
  t: TFunction
) => {
  const weekday = getWeekdayString(course, t, false, false);
  const startTime = getStartTimeString(course, i18n);
  const endTime = getEndTimeString(course, i18n);

  if (!endTime) return `${weekday} ${startTime}`;

  return `${weekday} ${startTime} - ${endTime}`;
};
