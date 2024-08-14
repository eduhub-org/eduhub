/**
 * Utility to format a number to two digits (e.g., 1 becomes "01").
 * @param n The number to format.
 * @returns A string representing the two-digit formatted number.
 */
const format2Digits = (n: number): string => {
  return n.toString().padStart(2, '0');
};

/**
 * Rounds the given date to the nearest quarter hour.
 * @param date The date to round.
 * @returns A new Date object rounded to the nearest quarter hour.
 */
export const roundTimeToNearestQuarterHour = (date: Date): Date => {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.round(minutes / 15) * 15;
  const newDate = new Date(date);
  newDate.setMinutes(roundedMinutes, 0, 0); // Reset seconds and milliseconds to zero
  return newDate;
};

/**
 * Gets the correct German timezone abbreviation (CET or CEST) for a given date.
 * @param date The Date object to evaluate.
 * @returns The timezone abbreviation as a string.
 */
const getGermanTimezone = (date: Date): string => {
  // Using Intl.DateTimeFormat to determine the time zone name for the given date.
  const options: Intl.DateTimeFormatOptions = { timeZone: 'Europe/Berlin', timeZoneName: 'short' };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);

  // Extract the time zone name (CET or CEST) from the formatted parts.
  const timeZoneName = parts.find((part) => part.type === 'timeZoneName')?.value;

  return timeZoneName === 'GMT+1' ? 'CET' : 'CEST';
};

/**
 * Converts a time string to a UTC ISO string using a reference date.
 * @param timeString The time string in "HH:mm" format.
 * @param referenceDate The reference date to apply the time to.
 * @returns The UTC ISO string representation of the combined date and time.
 */
export const convertToUTCTimeString = (timeString: string, referenceDate: Date): string => {
  if (!timeString || !/^\d{2}:\d{2}$/.test(timeString)) {
    console.error('Invalid time string:', timeString);
    throw new Error('Invalid time string format, expected HH:mm');
  }

  if (!(referenceDate instanceof Date) || isNaN(referenceDate.getTime())) {
    console.error('Invalid reference date:', referenceDate);
    throw new Error('Invalid reference date');
  }

  const [hours, minutes] = timeString.split(':').map(Number);

  // Create a new Date using the reference date's year, month, and day
  const dateWithTime = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    hours,
    minutes
  );

  // Adjust for Berlin time (Central European Time), which is UTC+1 normally and UTC+2 during daylight saving time
  const berlinTime = new Date(dateWithTime.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));

  // Convert to UTC
  return new Date(berlinTime.getTime() - berlinTime.getTimezoneOffset() * 60000).toISOString();
};

/**
 * Converts a Date object to a time string in "HH:mm TZ" format in German time.
 * @param date The Date object to format.
 * @returns The time string in "HH:mm TZ" format.
 */
export const convertToGermanTimeString = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Invalid date:', date);
    throw new Error('Invalid date');
  }

  const berlinTime = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const hours = format2Digits(berlinTime.getHours());
  const minutes = format2Digits(berlinTime.getMinutes());
  const timezone = getGermanTimezone(berlinTime);
  return `${hours}:${minutes} ${timezone}`;
};

/**
 * Converts a Date object to a UTC ISO string, assuming the date is in German time.
 * @param date The Date object to convert.
 * @returns The UTC ISO string representation of the date.
 */
export const convertDateToUTCTimeString = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.error('Invalid date:', date);
    throw new Error('Invalid date');
  }

  const berlinTime = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const utcDate = new Date(berlinTime.getTime() - berlinTime.getTimezoneOffset() * 60000);
  return utcDate.toISOString();
};

/**
 * Displays a date in the "DD.MM.YYYY" format.
 * @param date The date to format.
 * @returns A string representing the date in "DD.MM.YYYY" format.
 */
export const displayDate = (date: Date | null): string => {
  if (!date) {
    return '';
  }
  return `${format2Digits(date.getDate())}.${format2Digits(date.getMonth() + 1)}.${date.getFullYear()}`;
};

/**
 * Gets the string representation of a course's weekday.
 * @param course The course object.
 * @param t Translation function.
 * @param short Whether to return the short form of the weekday.
 * @param uppercased Whether to return the weekday in uppercase.
 * @returns The formatted weekday string or null if not available.
 */
export const getWeekdayString = (
  course: any, // Replace with actual type of course
  t: any,
  short: boolean,
  uppercased: boolean
): string | null => {
  if (!course.weekDay) return null;

  const weekday = short ? t(`${course.weekDay}-short`) : t(course.weekDay);

  return uppercased ? weekday.toUpperCase() : weekday;
};

/**
 * Formats a timestamp into a localized time string with the correct German timezone.
 * @param ts The timestamp to format.
 * @param i18n The locale to use for formatting.
 * @returns A string representing the time in the specified locale with timezone.
 */
const formatTimeString = (ts: any, i18n: string): string => {
  if (ts == null) {
    return '';
  }

  const date = new Date(ts);
  const timeString = date.toLocaleTimeString(i18n, {
    hour: 'numeric',
    minute: 'numeric',
  });

  const timezone = getGermanTimezone(date);
  return `${timeString} ${timezone}`;
};

/**
 * Gets the start time string for a course in the specified locale.
 * @param course The course object.
 * @param i18n The locale to use for formatting.
 * @returns The formatted start time string with timezone.
 */
export const getStartTimeString = (
  course: any, // Replace with actual type of course
  i18n: string
): string => {
  return formatTimeString(course.startTime, i18n);
};

/**
 * Gets the end time string for a course in the specified locale.
 * @param course The course object.
 * @param i18n The locale to use for formatting.
 * @returns The formatted end time string with timezone.
 */
export const getEndTimeString = (
  course: any, // Replace with actual type of course
  i18n: string
): string => {
  return formatTimeString(course.endTime, i18n);
};

/**
 * Gets the full weekday, start, and end time string for a course.
 * @param course The course object.
 * @param i18n The locale to use for formatting.
 * @param t Translation function.
 * @returns The formatted weekday, start, and end time string.
 */
export const getWeekdayStartAndEndString = (
  course: any, // Replace with actual type of course
  i18n: string,
  t: any
): string => {
  const weekday = getWeekdayString(course, t, false, false);
  const startTime = getStartTimeString(course, i18n);
  const endTime = getEndTimeString(course, i18n);

  if (!endTime) return `${weekday} ${startTime}`;

  return `${weekday} ${startTime} - ${endTime}`;
};

/**
 * Formats the start and end times together in German time with the correct timezone.
 * @param startTime The start time Date object.
 * @param endTime The end time Date object.
 * @returns A string representing the formatted time range in German time.
 */
export const formatGermanTimeRange = (startTime: Date, endTime: Date): string => {
  // Convert start and end times to German time
  const startGermanTime = new Date(startTime.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const endGermanTime = new Date(endTime.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));

  const startHour = startGermanTime.getHours().toString().padStart(2, '0');
  const startMinute = startGermanTime.getMinutes().toString().padStart(2, '0');
  const endHour = endGermanTime.getHours().toString().padStart(2, '0');
  const endMinute = endGermanTime.getMinutes().toString().padStart(2, '0');

  const timeZoneName = getGermanTimezone(startGermanTime);

  return `${startHour}:${startMinute} - ${endHour}:${endMinute} ${timeZoneName}`;
};

/**
 * Extracts the time (in "HH:mm" format) from a given ISO datetime string.
 * @param dateTimeString The ISO datetime string.
 * @returns The time string in "HH:mm" format.
 */
export const extractTimeFromDateTime = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
