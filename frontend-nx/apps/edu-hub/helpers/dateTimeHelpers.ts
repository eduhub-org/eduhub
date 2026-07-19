/**
 * Date and Time Helper Functions
 * 
 * This file contains utility functions and hooks for formatting, parsing, and displaying dates and times.
 * All functions respect the application's timezone setting.
 * 
 * Main hooks:
 * - useDisplayDate: Formats a date as "dd.MM.yyyy"
 * - useFormatTimeString: Parses and formats various time inputs to "HH:mm" without rounding
 * - useFormatTime: Formats and optionally rounds time to intervals, returns a string
 * - useFormatDateTime: Formats and optionally rounds time, returns a Date object
 */

import { useCallback } from 'react';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { useAppSettings } from '../contexts/AppSettingsContext';

/**
 * Formats a number to always have 2 digits by adding a leading zero if needed
 * @param n - Number to format
 * @returns String with 2 digits
 */
export const format2Digits = (n: number) => {
  return `${n < 10 ? '0' : ''}${n}`;
};

/**
 * Hook for formatting a date to "dd.MM.yyyy" based on application timezone
 * @returns Function that takes a date input and returns a formatted date string
 */
export const useDisplayDate = () => {
  const { timeZone } = useAppSettings();

  return useCallback((date: Date | string | null) => {
    if (date == null) {
      return '';
    }

    const zonedDate = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(zonedDate, timeZone, 'dd.MM.yyyy');
  }, [timeZone]);
};

/**
 * Hook for parsing various time formats and displaying as "HH:mm"
 * Handles Date objects, time strings (HH:mm), and ISO date strings
 * Does NOT round times - preserves exact time
 * 
 * @returns Function that parses different time inputs and returns "HH:mm" format
 */
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
      if (typeof ts === 'string' && /^\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(ts)) {
        // Since we're already dealing with a simple HH:mm format, we assume
        // the input is already in the correct timezone and we don't need to
        // convert it.

        // Extract hours and minutes directly from the string
        const [hours, minutes] = ts.split(':').map(Number);
        
        // We're already dealing with a simple HH:mm format, so just ensure
        // the numbers have leading zeros if needed
        return `${format2Digits(hours)}:${format2Digits(minutes)}`;
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

/**
 * Private helper function for rounding time to specified intervals
 * Used by useFormatTime and useFormatDateTime
 */
const roundTimeToInterval = (
  inputDate: Date,
  timeZone: string,
  roundToMinutes = 15,
  format = 'HH:mm'
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

/**
 * Hook for formatting time with optional rounding to intervals
 * RETURNS A STRING in "HH:mm" format (or custom format)
 * Use this when you need a formatted time string with rounding
 * 
 * @returns Function that formats time and returns a string
 */
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

/**
 * Hook for formatting time with optional rounding to intervals
 * RETURNS A DATE OBJECT with the rounded time
 * Use this when you need a Date object with rounded time for calculations
 * 
 * @returns Function that formats time and returns a Date object
 */
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