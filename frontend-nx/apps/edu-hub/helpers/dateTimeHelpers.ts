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

// Private helper function for the common rounding logic
const roundTimeToInterval = (
  inputDate: Date,
  timeZone: string,
  roundToMinutes: number = 15,
  format: string = 'HH:mm'
): { hours: number, minutes: number } => {
  const formattedTime = formatInTimeZone(inputDate, timeZone, format);
  const [hours, minutes] = formattedTime.split(':').map(Number);
  const roundedMinutes = Math.round(minutes / roundToMinutes) * roundToMinutes;
  const adjustedHours = hours + Math.floor(roundedMinutes / 60);
  const adjustedMinutes = roundedMinutes % 60;
  
  return {
    hours: adjustedHours % 24,
    minutes: adjustedMinutes
  };
};

// Original hook that returns a formatted string
export const useFormatTime = () => {
  const { timeZone } = useAppSettings();
  
  return (
    time: Date | string | null,
    options?: {
      roundToMinutes?: number;
      format?: string;
    }
  ): string => {
    const {
      roundToMinutes = 15,
      format = 'HH:mm'
    } = options || {};

    const inputDate = time == null ? new Date() : (typeof time === 'string' ? parseISO(time) : time);
    const { hours, minutes } = roundTimeToInterval(inputDate, timeZone, roundToMinutes, format);
    
    return `${format2Digits(hours)}:${format2Digits(minutes)}`;
  };
};

// New hook that returns a Date object with properly formatted time
export const useFormatDateTime = () => {
  const { timeZone } = useAppSettings();
  
  return (
    time: Date | string | null,
    options?: {
      roundToMinutes?: number;
    }
  ): Date => {
    const { roundToMinutes = 15 } = options || {};
    
    const inputDate = time == null ? new Date() : (typeof time === 'string' ? parseISO(time) : time);
    const { hours, minutes } = roundTimeToInterval(inputDate, timeZone, roundToMinutes);
    
    // Create a new date with the formatted time
    const formattedDate = new Date(inputDate);
    formattedDate.setHours(hours, minutes, 0, 0);
    
    return formattedDate;
  };
};