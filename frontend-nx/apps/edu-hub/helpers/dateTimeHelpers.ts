import { parse, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useAppSettings } from '../contexts/AppSettingsContext';

export const format2Digits = (n: number) => {
  return `${n < 10 ? '0' : ''}${n}`;
};

export const useDisplayDate = () => {
  const { timeZone } = useAppSettings();
  
  return (date: Date | string | null) => {
    if (date == null) {
      return '';
    }

    const zonedDate = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(zonedDate, timeZone, 'dd.MM.yyyy');
  };
};

export const useFormatTimeString = () => {
  const { timeZone } = useAppSettings();

  return (ts: string | Date | null) => {
    if (ts == null) {
      return '';
    }

    try {
      if (ts instanceof Date) {
        // If it's a Date object, format it directly
        return formatInTimeZone(ts, timeZone, 'HH:mm');
      }

      // Check if the string is in HH:mm or HH:mm:ss format
      if (typeof ts === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(ts)) {
        // If it's just a time, we need to add a dummy date
        const dummyDate = new Date().toISOString().split('T')[0]; // Current date
        const dateTime = parse(`${dummyDate} ${ts}`, 'yyyy-MM-dd HH:mm:ss', new Date());
        return formatInTimeZone(dateTime, timeZone, 'HH:mm');
      }

      // If it's a full date-time string, use parseISO
      const parsedDate = parseISO(ts);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date');
      }
      return formatInTimeZone(parsedDate, timeZone, 'HH:mm');
    } catch (error) {
      console.error('Error parsing time:', ts, error);
      // If ts is a string, try to extract the time part
      if (typeof ts === 'string') {
        const timeMatch = ts.match(/(\d{2}:\d{2})/);
        return timeMatch ? timeMatch[1] : ts;
      }
      // If ts is not a string (and not a valid Date), return an empty string
      return '';
    }
  };
};

// Define a minimal course type that includes only the properties we need
export type MinimalCourse = {
  weekDay?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export const getWeekdayString = (
  course: MinimalCourse,
  t: any,
  short = false,
  uppercased = false
): string => {
  if (!course.weekDay || course.weekDay === 'NONE') return '';

  const weekday = short ? t(`${course.weekDay}-short`) : t(course.weekDay);

  return uppercased ? weekday.toUpperCase() : weekday;
};

export const useWeekdayStartAndEndString = () => {
  const getStartTimeString = useStartTimeString();
  const getEndTimeString = useEndTimeString();
  
  return (course: MinimalCourse, t: any) => {
    if (!course.weekDay || course.weekDay === 'NONE') return '';

    const weekday = getWeekdayString(course, t);
    const startTime = course.startTime ? getStartTimeString(course.startTime) : '';
    const endTime = course.endTime ? getEndTimeString(course.endTime) : '';

    if (!startTime) return weekday;
    if (!endTime) return `${weekday} ${startTime}`;

    return `${weekday} ${startTime} - ${endTime}`;
  };
};

export const useStartTimeString = () => {
  const formatTimeString = useFormatTimeString();
  
  return (time: string | null) => {
    return time ? formatTimeString(time) : '';
  };
};

export const useEndTimeString = () => {
  const formatTimeString = useFormatTimeString();
  
  return (time: string | null) => {
    return time ? formatTimeString(time) : '';
  };
};

export const useFormatTime = () => {
  const { timeZone } = useAppSettings();
  
  return (time: Date | string | null): string => {
    if (time == null) {
      return formatInTimeZone(new Date(), timeZone, 'HH:mm');
    }
    const zonedTime = typeof time === 'string' ? parseISO(time) : time;
    const formattedTime = formatInTimeZone(zonedTime, timeZone, 'HH:mm');
    
    // Round to nearest 15 minutes
    const [hours, minutes] = formattedTime.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 15) * 15;
    return `${format2Digits(hours)}:${format2Digits(roundedMinutes)}`;
  };
};