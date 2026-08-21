import React, { FC, useCallback, useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useLocale } from 'next-intl';
import { getHolidaysByLocale } from './holidayUtils';

// Beautiful highlighting styles for calendar days
const defaultHighlightingStyles = `
  /*
   * react-datepicker wraps the input in two inline-block divs, which causes
   * the input to keep its natural width even when the surrounding container
   * is wider. That leaves a visible "dead zone" between the input edge and
   * any styled wrapper around it. Force the wrappers to fill the available
   * width so the input expands with the parent container.
   */
  .optimistic-datepicker .react-datepicker-wrapper,
  .optimistic-datepicker .react-datepicker__input-container {
    display: block;
    width: 100%;
  }

  .holiday-day {
    background-color: #ecfdf5 !important;
    color: #065f46 !important;
    font-weight: 600 !important;
    border-radius: 4px !important;
    border: 1px solid #6ee7b7 !important;
  }
  
  .holiday-day:hover {
    background-color: #d1fae5 !important;
    color: #047857 !important;
  }
  
  .national-holiday-day {
    background-color: #fef2f2 !important;
    color: #dc2626 !important;
    font-weight: 700 !important;
    border-radius: 4px !important;
    border: 2px solid #ef4444 !important;
  }
  
  .national-holiday-day:hover {
    background-color: #fee2e2 !important;
    color: #b91c1c !important;
  }
  
  .weekend-day {
    background-color: #eff6ff !important;
    color: #2563eb !important;
    font-weight: 500 !important;
    border-radius: 4px !important;
    border: 1px solid #93c5fd !important;
  }
  
  .weekend-day:hover {
    background-color: #dbeafe !important;
    color: #1d4ed8 !important;
  }
`;

// Function to inject styles
const injectHighlightingStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('optimistic-datepicker-highlighting-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'optimistic-datepicker-highlighting-styles';
    styleSheet.textContent = defaultHighlightingStyles;
    document.head.appendChild(styleSheet);
  }
};

// Ensure a portal target exists at body level so the popper isn't clipped by
// ancestors that establish overflow/stacking contexts (e.g. table containers).
const ensurePortalContainer = (id: string) => {
  if (typeof document === 'undefined' || !id) return;
  let container = document.getElementById(id);
  if (!container) {
    container = document.createElement('div');
    container.id = id;
    document.body.appendChild(container);
  }
  // The container is an empty block at the end of <body>, so it adds no layout —
  // but without a stacking context of its own the calendar paints *below* any
  // dialog it was opened from (MUI modals sit at z-index 1300), which looks
  // exactly like a picker that refuses to open. Sits above the modal layer but
  // below MUI's snackbar (1400) and tooltip (1500), so a "saved" notification is
  // never hidden. Applied on every call so an existing container is fixed up too.
  container.style.position = 'relative';
  container.style.zIndex = '1350';
};

export type HighlightDate = {
  /** CSS class name for the highlighted date */
  [className: string]: Date[];
};

export interface Holiday {
  /** Date of the holiday */
  date: Date;
  /** Name/description of the holiday */
  name?: string;
  /** CSS class name for styling (defaults to 'holiday') */
  className?: string;
}

export interface OptimisticDatePickerProps {
  /** Current value from the server/state */
  value: Date | null;

  /** Callback when date changes - should handle the mutation */
  onChange: (date: Date | null) => Promise<void> | void;

  /** Optional error handler */
  onError?: (error: Error) => void;

  /** Whether to show loading state during mutation */
  showLoading?: boolean;

  /** Custom loading indicator */
  loadingIndicator?: React.ReactNode;

  // Holiday and date highlighting features
  /** Whether to automatically highlight holidays based on app locale (default: true) */
  showHolidays?: boolean;

  /** Whether to highlight weekends in light blue (default: false) */
  showWeekends?: boolean;

  /** Custom highlight dates with specific CSS classes */
  highlightDates?: HighlightDate[];

  /** Dates to exclude/disable in the calendar */
  excludeDates?: Date[];

  // Common DatePicker props that we want to expose
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  disabled?: boolean;
  placeholderText?: string;
  dateFormat?: string;
  locale?: string;
  id?: string;
  name?: string;
  title?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  required?: boolean;
  tabIndex?: number;
  /**
   * Render the calendar popper inside a portal at body level. Prevents the
   * calendar from being clipped by ancestor `overflow: hidden`/`auto` (e.g. inside table cells).
   * Defaults to the shared "optimistic-datepicker-portal" id.
   */
  portalId?: string;
  // Add more DatePicker props as needed
}

/**
 * OptimisticDatePicker - Enhanced DatePicker with optimistic updates and smart highlighting
 *
 * A production-ready date picker component that provides immediate UI feedback while handling
 * async mutations in the background, with automatic holiday and weekend highlighting.
 *
 * ## Features
 *
 * ### Core Functionality
 * - **Optimistic Updates**: Immediate UI feedback during async operations
 * - **Error Handling**: Automatic rollback on mutation failures
 * - **Loading States**: Visual feedback during operations
 * - **Full react-datepicker Compatibility**: Supports all standard DatePicker props
 *
 * ### Smart Highlighting
 * - **Automatic Holiday Detection**: Based on app locale (German/US holidays)
 * - **Weekend Highlighting**: Optional light blue highlighting for weekends
 * - **Holiday Tooltips**: Native browser tooltips showing holiday names on hover
 * - **Outside-Month Days**: Highlights weekends/holidays even in previous/next month days
 * - **Locale-Safe**: Works across any displayed month/year regardless of UI language
 *
 * ### Styling Classes
 * - `.holiday-day`: Regular holidays (green styling)
 * - `.national-holiday-day`: National holidays (red styling)
 * - `.weekend-day`: Weekends (light blue styling)
 *
 * ## Usage Examples
 *
 * ### Basic Usage (holidays enabled by default)
 * ```tsx
 * <OptimisticDatePicker
 *   value={selectedDate}
 *   onChange={handleDateChange}
 * />
 * ```
 *
 * ### With Weekend Highlighting
 * ```tsx
 * <OptimisticDatePicker
 *   value={selectedDate}
 *   onChange={handleDateChange}
 *   showWeekends={true}
 * />
 * ```
 *
 * ### Disabled Highlighting
 * ```tsx
 * <OptimisticDatePicker
 *   value={selectedDate}
 *   onChange={handleDateChange}
 *   showHolidays={false}
 *   showWeekends={false}
 * />
 * ```
 *
 * ### With Error Handling
 * ```tsx
 * <OptimisticDatePicker
 *   value={selectedDate}
 *   onChange={handleDateChange}
 *   onError={(error) => toast.error(`Failed to update date: ${error.message}`)}
 *   showLoading={true}
 * />
 * ```
 *
 * ## Props
 *
 * ### Core Props
 * - `value: Date | null` - Current date value from server/state
 * - `onChange: (date: Date | null) => Promise<void> | void` - Async change handler
 * - `onError?: (error: Error) => void` - Optional error handler
 * - `showLoading?: boolean` - Show loading indicator during mutations (default: false)
 *
 * ### Highlighting Props
 * - `showHolidays?: boolean` - Auto-highlight holidays by app locale (default: true)
 * - `showWeekends?: boolean` - Highlight weekends in light blue (default: false)
 * - `highlightDates?: HighlightDate[]` - Custom highlight dates with CSS classes
 * - `excludeDates?: Date[]` - Dates to disable/exclude
 *
 * ### Standard DatePicker Props
 * All standard react-datepicker props are supported: minDate, maxDate, dateFormat,
 * locale, className, disabled, placeholderText, etc.
 *
 * ## Holiday Support
 *
 * Holidays are automatically detected based on the app's configured locale:
 * - **German locale (lang='de')**: German holidays (Pfingstmontag, Fronleichnam, etc.)
 * - **Other locales**: US holidays (Independence Day, Thanksgiving, etc.)
 *
 * Holidays are resolved lazily per displayed year, so any month the user
 * navigates to is highlighted correctly.
 *
 * ## Implementation Notes
 *
 * - Uses react-datepicker's `dayClassName` and `renderDayContents` props to drive
 *   highlighting and tooltips (no DOM scraping, so it works in any UI locale)
 * - Optimistic state is automatically cleared on successful mutations or errors
 * - TypeScript compatible with full type safety
 */
export const OptimisticDatePicker: FC<OptimisticDatePickerProps> = ({
  value,
  onChange,
  onError,
  showLoading = false,
  loadingIndicator,
  className = '',
  disabled = false,
  showHolidays = true,
  showWeekends = false,
  highlightDates = [],
  excludeDates = [],
  minDate,
  maxDate,
  placeholderText,
  dateFormat,
  locale: propLocale,
  id,
  name,
  title,
  autoComplete,
  autoFocus,
  readOnly,
  required,
  tabIndex,
  portalId = 'optimistic-datepicker-portal',
}) => {
  const locale = useLocale();

  // Inject styles and ensure portal container when component mounts
  useEffect(() => {
    injectHighlightingStyles();
    ensurePortalContainer(portalId);
  }, [portalId]);

  // Local optimistic state
  const [optimisticValue, setOptimisticValue] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Lazy per-year holiday lookup. Built on first access for a given year so any
  // navigated month resolves correctly (not just current/next year).
  const lookupHoliday = useMemo(() => {
    if (!showHolidays) return () => undefined;
    const holidayLocale = locale === 'de' ? 'de' : 'us';
    const cache = new Map<number, Map<string, Holiday>>();

    const keyFor = (d: Date) => `${d.getMonth()}-${d.getDate()}`;

    const getYearMap = (year: number): Map<string, Holiday> => {
      let yearMap = cache.get(year);
      if (!yearMap) {
        yearMap = new Map();
        getHolidaysByLocale({ year, locale: holidayLocale }).forEach((h) => {
          yearMap!.set(keyFor(h.date), h);
        });
        cache.set(year, yearMap);
      }
      return yearMap;
    };

    return (date: Date): Holiday | undefined => getYearMap(date.getFullYear()).get(keyFor(date));
  }, [showHolidays, locale]);

  // Lookup for caller-supplied custom highlight dates. Flattens the
  // [{ className: Date[] }] structure into a single map keyed by date.
  const lookupCustomHighlight = useMemo(() => {
    if (highlightDates.length === 0) return () => undefined;
    const map = new Map<string, string>();
    const keyFor = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    highlightDates.forEach((group) => {
      Object.entries(group).forEach(([className, dates]) => {
        dates.forEach((d) => map.set(keyFor(d), className));
      });
    });
    return (date: Date): string | undefined => map.get(keyFor(date));
  }, [highlightDates]);

  const dayClassName = useCallback(
    (date: Date): string => {
      const custom = lookupCustomHighlight(date);
      if (custom) return custom;
      const holiday = lookupHoliday(date);
      if (holiday) {
        return holiday.className === 'national-holiday' ? 'national-holiday-day' : 'holiday-day';
      }
      if (showWeekends) {
        const day = date.getDay();
        if (day === 0 || day === 6) return 'weekend-day';
      }
      return '';
    },
    [lookupHoliday, lookupCustomHighlight, showWeekends]
  );

  const renderDayContents = useCallback(
    (day: number, date?: Date) => {
      const holiday = date ? lookupHoliday(date) : undefined;
      return holiday?.name ? <span title={holiday.name}>{day}</span> : <>{day}</>;
    },
    [lookupHoliday]
  );

  // Reset optimistic state when server value changes
  useEffect(() => {
    setOptimisticValue(null);
    setHasError(false);
  }, [value]);

  const handleDateChange = useCallback(
    async (date: Date | null) => {
      // Immediately update optimistic state
      setOptimisticValue(date);
      setIsLoading(true);
      setHasError(false);

      try {
        // Execute the mutation
        await onChange(date);
      } catch (error) {
        console.error('OptimisticDatePicker: Error updating date:', error);
        setHasError(true);

        // Rollback optimistic state on error
        setOptimisticValue(null);

        // Call error handler if provided
        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [onChange, onError]
  );

  // Determine the display value
  const displayValue = optimisticValue !== null ? optimisticValue : value;

  // Determine if component should be disabled
  const isDisabled = disabled || isLoading;

  // Build className with loading and error states
  const finalClassName = [className, isLoading && showLoading ? 'opacity-50' : '', hasError ? 'border-red-500' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="optimistic-datepicker relative w-full">
      <DatePicker
        selected={displayValue}
        onChange={handleDateChange as any}
        disabled={isDisabled}
        className={finalClassName}
        locale={propLocale || locale}
        dateFormat={dateFormat || (locale === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy')}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholderText}
        excludeDates={excludeDates}
        dayClassName={dayClassName}
        renderDayContents={renderDayContents}
        id={id}
        name={name}
        title={title}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        readOnly={readOnly}
        required={required}
        tabIndex={tabIndex}
        popperPlacement="bottom-start"
        portalId={portalId}
      />

      {/* Loading indicator */}
      {isLoading && showLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {loadingIndicator || (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  );
};

export default OptimisticDatePicker;
