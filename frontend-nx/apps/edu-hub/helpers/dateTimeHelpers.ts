import { parse, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Course_Course_by_pk } from '../queries/__generated__/Course';
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

export const useFormatTimeString = () => {
  const { timeZone } = useAppSettings();

  return (ts: string | null) => {
    if (ts == null) {
      return '';
    }

    try {
      // Check if the string is in HH:mm or HH:mm:ss format
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(ts)) {
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
      // Instead of returning the original string, let's try to extract the time part
      const timeMatch = ts.match(/(\d{2}:\d{2})/);
      return timeMatch ? timeMatch[1] : ts;
    }
  };
};

export const useStartTimeString = () => {
  const formatTimeString = useFormatTimeString();
  
  return (course: Course_Course_by_pk) => {
    const result = course.startTime ? formatTimeString(course.startTime) : '';
    console.log('Start time input:', course.startTime, 'Formatted:', result);
    return result;
  };
};

export const useEndTimeString = () => {
  const formatTimeString = useFormatTimeString();
  
  return (course: Course_Course_by_pk) => {
    const result = course.endTime ? formatTimeString(course.endTime) : '';
    console.log('End time input:', course.endTime, 'Formatted:', result);
    return result;
  };
};

export const useWeekdayStartAndEndString = () => {
  const getStartTimeString = useStartTimeString();
  const getEndTimeString = useEndTimeString();
  
  return (course: Course_Course_by_pk, t: any) => {
    const weekday = getWeekdayString(course, t, false, false);
    const startTime = getStartTimeString(course);
    const endTime = getEndTimeString(course);

    if (!endTime) return `${weekday} ${startTime}`;

    return `${weekday} ${startTime} - ${endTime}`;
  };
};

export const useFormatTime = () => {
  const { timeZone } = useAppSettings();
  
  return (time: Date | string | null): string => {
    if (time == null) {
      return useFormatTime()(new Date());
    }
    const zonedTime = typeof time === 'string' ? parseISO(time) : time;
    const formattedTime = formatInTimeZone(zonedTime, timeZone, 'HH:mm');
    
    // Round to nearest 15 minutes
    const [hours, minutes] = formattedTime.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 15) * 15;
    return `${format2Digits(hours)}:${format2Digits(roundedMinutes)}`;
  };
};