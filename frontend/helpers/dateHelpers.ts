import { I18n, TFunction } from "next-i18next";

import { Course_Course_by_pk } from "../queries/__generated__/Course";

export const getWeekdayString = (
  course: Course_Course_by_pk,
  t: TFunction,
  short: boolean,
  uppercased: boolean
) => {
  if (!course.DayOfTheWeek) return null;

  const weekday = short
    ? t(`${course.DayOfTheWeek}-short`)
    : t(course.DayOfTheWeek);

  return uppercased ? weekday.toUpperCase() : weekday;
};

export const getStartTimeString = (course: Course_Course_by_pk, i18n: I18n) => {
  const startTime: string =
    course.TimeOfStart?.toLocaleTimeString(i18n.languages, {
      hour: "numeric",
      minute: "numeric",
    }) ?? "";

  return startTime;
};

export const getEndTimeString = (course: Course_Course_by_pk, i18n: I18n) => {
  const endTime = course.Duration
    ? new Date(
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        course.TimeOfStart.getTime() + course.Duration * 60000
      ).toLocaleTimeString(i18n.languages, {
        hour: "numeric",
        minute: "numeric",
      })
    : "";

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
