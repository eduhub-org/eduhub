import { Course_Course_by_pk } from '../queries/__generated__/Course';

const format2Digits = (n: number) => {
  return `${n < 10 ? '0' : ''}${n}`;
};

export const displayDate = (date: Date | null) => {
  if (date == null) {
    return '';
  }

  return `${format2Digits(date.getDate())}.${format2Digits(
    date.getMonth() + 1
  )}.${date.getFullYear()}`;
};

export const getWeekdayString = (
  course: Course_Course_by_pk,
  t: any,
  short: boolean,
  uppercased: boolean
) => {
  if (!course.weekDay) return null;

  const weekday = short ? t(`${course.weekDay}-short`) : t(course.weekDay);

  return uppercased ? weekday.toUpperCase() : weekday;
};

const formatTimeString = (ts: any, i18n: string) => {
  if (ts == null) {
    return '';
  }

  return (
    new Date(ts).toLocaleTimeString(i18n, {
      hour: 'numeric',
      minute: 'numeric',
    }) ?? ''
  );
};

export const getStartTimeString = (
  course: Course_Course_by_pk,
  i18n: string
) => {
  return formatTimeString(course.startTime, i18n);
};

export const getEndTimeString = (course: Course_Course_by_pk, i18n: string) => {
  return formatTimeString(course.endTime, i18n);
};

export const getWeekdayStartAndEndString = (
  course: Course_Course_by_pk,
  i18n: string,
  t: any
) => {
  const weekday = getWeekdayString(course, t, false, false);
  const startTime = getStartTimeString(course, i18n);
  const endTime = getEndTimeString(course, i18n);

  if (!endTime) return `${weekday} ${startTime}`;

  return `${weekday} ${startTime} - ${endTime}`;
};
