import { I18n, TFunction } from "next-i18next";

import { Course_Course_by_pk } from "../queries/__generated__/Course";

const format2Digits = (n: number) => {
  return `${n < 10 ? "0" : ""}${n}`;
};

export const displayDate = (date: Date | null) => {
  if (date == null) {
    return "";
  }

  return format2Digits(date.getDate()) + "." + format2Digits(date.getMonth() + 1) + "." + date.getFullYear();
}

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
  // TODO timetz handling is unclear
  return "";
  //   if (course.startTime == null) {
  //     return "";
  //   }

  //   const now = new Date();
  //   const todayStr = now.toISOString().split("T")[0];
  //   const str = todayStr + "T" + course.startTime;
  //   console.log(str);
  //   const timeDate = new Date(str);

  //   const startTime: string =
  //     timeDate.toLocaleTimeString(i18n.languages, {
  //       hour: "numeric",
  //       minute: "numeric",
  //     }) ?? "";

  //   return startTime;
};

export const getEndTimeString = (course: Course_Course_by_pk, i18n: I18n) => {
  return "";
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
