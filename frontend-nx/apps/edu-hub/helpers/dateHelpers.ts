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

export const roundTimeToNearestQuarterHour = (date: Date): Date => {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 15) * 15;
  date.setMinutes(roundedMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

export const convertToUTCTimeString = (timeString: string, referenceDate: Date): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  referenceDate.setHours(hours, minutes, 0, 0);
  const utcDate = new Date(referenceDate.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  return utcDate.toISOString();
};

export const convertDateToUTCTimeString = (date: Date): string => {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  return utcDate.toISOString();
};

export const convertToGermanTimeString = (date: Date): string => {
  const berlinDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const hours = berlinDate.getHours().toString().padStart(2, '0');
  const minutes = berlinDate.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
