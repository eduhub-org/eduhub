import { Holiday } from './OptimisticDatePicker';

/**
 * Utility functions for generating common holidays
 */

export interface HolidayConfig {
  year: number;
  locale?: 'de' | 'us' | 'uk' | 'fr';
}

/**
 * Calculate Easter Sunday for a given year using the algorithm
 */
export const getEasterSunday = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
};

/**
 * Buß- und Bettag falls on the Wednesday between Nov 16 and Nov 22
 * (the Wednesday before Nov 23). Public holiday in Sachsen.
 */
const getBussUndBettag = (year: number): Date => {
  const nov22 = new Date(year, 10, 22);
  const daysToSubtract = (nov22.getDay() - 3 + 7) % 7;
  return new Date(year, 10, 22 - daysToSubtract);
};

/**
 * Generate German holidays for a given year.
 *
 * Includes all nine nationwide federal holidays (className 'national-holiday')
 * plus regional public holidays that are officially recognized in at least one
 * federal state (className 'holiday').
 */
export const getGermanHolidays = (year: number): Holiday[] => {
  const easter = getEasterSunday(year);
  const easterY = easter.getFullYear();
  const easterM = easter.getMonth();
  const easterD = easter.getDate();

  return [
    { date: new Date(year, 0, 1), name: 'Neujahr', className: 'national-holiday' },
    { date: new Date(year, 0, 6), name: 'Heilige Drei Könige', className: 'holiday' },
    { date: new Date(year, 2, 8), name: 'Internationaler Frauentag', className: 'holiday' },
    { date: new Date(easterY, easterM, easterD - 2), name: 'Karfreitag', className: 'national-holiday' },
    { date: new Date(easterY, easterM, easterD + 1), name: 'Ostermontag', className: 'national-holiday' },
    { date: new Date(year, 4, 1), name: 'Tag der Arbeit', className: 'national-holiday' },
    { date: new Date(easterY, easterM, easterD + 39), name: 'Christi Himmelfahrt', className: 'national-holiday' },
    { date: new Date(easterY, easterM, easterD + 50), name: 'Pfingstmontag', className: 'national-holiday' },
    { date: new Date(easterY, easterM, easterD + 60), name: 'Fronleichnam', className: 'holiday' },
    { date: new Date(year, 7, 15), name: 'Mariä Himmelfahrt', className: 'holiday' },
    { date: new Date(year, 8, 20), name: 'Weltkindertag', className: 'holiday' },
    { date: new Date(year, 9, 3), name: 'Tag der Deutschen Einheit', className: 'national-holiday' },
    { date: new Date(year, 9, 31), name: 'Reformationstag', className: 'holiday' },
    { date: new Date(year, 10, 1), name: 'Allerheiligen', className: 'holiday' },
    { date: getBussUndBettag(year), name: 'Buß- und Bettag', className: 'holiday' },
    { date: new Date(year, 11, 25), name: 'Weihnachten', className: 'national-holiday' },
    { date: new Date(year, 11, 26), name: '2. Weihnachtstag', className: 'national-holiday' },
  ];
};

/**
 * Generate US holidays for a given year
 */
export const getUSHolidays = (year: number): Holiday[] => {
  // Helper function to get nth occurrence of a weekday in a month
  const getNthWeekdayOfMonth = (year: number, month: number, weekday: number, n: number): Date => {
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const daysToAdd = (weekday - firstWeekday + 7) % 7;
    const date = new Date(year, month, 1 + daysToAdd + (n - 1) * 7);
    return date;
  };

  // Helper function to get last occurrence of a weekday in a month
  const getLastWeekdayOfMonth = (year: number, month: number, weekday: number): Date => {
    const lastDay = new Date(year, month + 1, 0);
    const lastWeekday = lastDay.getDay();
    const daysToSubtract = (lastWeekday - weekday + 7) % 7;
    return new Date(year, month, lastDay.getDate() - daysToSubtract);
  };

  return [
    { date: new Date(year, 0, 1), name: 'New Year\'s Day', className: 'national-holiday' },
    { 
      date: getNthWeekdayOfMonth(year, 0, 1, 3), // 3rd Monday in January
      name: 'Martin Luther King Jr. Day', 
      className: 'national-holiday' 
    },
    { 
      date: getNthWeekdayOfMonth(year, 1, 1, 3), // 3rd Monday in February
      name: 'Presidents\' Day', 
      className: 'national-holiday' 
    },
    { 
      date: getLastWeekdayOfMonth(year, 4, 1), // Last Monday in May
      name: 'Memorial Day', 
      className: 'national-holiday' 
    },
    { date: new Date(year, 6, 4), name: 'Independence Day', className: 'national-holiday' },
    { 
      date: getNthWeekdayOfMonth(year, 8, 1, 1), // 1st Monday in September
      name: 'Labor Day', 
      className: 'national-holiday' 
    },
    { 
      date: getNthWeekdayOfMonth(year, 9, 1, 2), // 2nd Monday in October
      name: 'Columbus Day', 
      className: 'national-holiday' 
    },
    { date: new Date(year, 10, 11), name: 'Veterans Day', className: 'national-holiday' },
    { 
      date: getNthWeekdayOfMonth(year, 10, 4, 4), // 4th Thursday in November
      name: 'Thanksgiving', 
      className: 'national-holiday' 
    },
    { date: new Date(year, 11, 25), name: 'Christmas Day', className: 'national-holiday' },
  ];
};

/**
 * Generate holidays based on locale and year
 */
export const getHolidaysByLocale = ({ year, locale = 'de' }: HolidayConfig): Holiday[] => {
  switch (locale) {
    case 'de':
      return getGermanHolidays(year);
    case 'us':
      return getUSHolidays(year);
    default:
      return getGermanHolidays(year); // Default to German holidays
  }
};

/**
 * Check if a date is a weekend
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

/**
 * Check if a date is a holiday
 */
export const isHoliday = (date: Date, holidays: Holiday[]): Holiday | undefined => {
  return holidays.find(holiday => 
    holiday.date.getFullYear() === date.getFullYear() &&
    holiday.date.getMonth() === date.getMonth() &&
    holiday.date.getDate() === date.getDate()
  );
};

/**
 * Generate weekend highlighting function for dayClassName prop
 */
export const createWeekendHighlighter = (className = 'weekend-highlight') => {
  return (date: Date) => isWeekend(date) ? className : undefined;
};

/**
 * Create a combined day class name function that highlights both weekends and holidays
 */
export const createCombinedHighlighter = (
  holidays: Holiday[], 
  weekendClassName = 'weekend-highlight'
) => {
  return (date: Date) => {
    const holiday = isHoliday(date, holidays);
    const isWeekendDate = isWeekend(date);
    
    const classes = [];
    if (holiday) {
      classes.push(holiday.className || 'holiday');
    }
    if (isWeekendDate) {
      classes.push(weekendClassName);
    }
    
    return classes.length > 0 ? classes.join(' ') : undefined;
  };
};
