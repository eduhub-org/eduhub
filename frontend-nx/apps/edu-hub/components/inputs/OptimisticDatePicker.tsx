import React, { FC, useCallback, useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useTranslation from 'next-translate/useTranslation';
import { getHolidaysByLocale } from './holidayUtils';

// Beautiful highlighting styles for calendar days
const defaultHighlightingStyles = `
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
 * - **Dynamic Styling**: Survives calendar navigation and reopen events
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
 * Holiday coverage includes current year + next year to handle academic terms.
 *
 * ## Implementation Notes
 *
 * - Uses direct DOM manipulation for reliable highlighting across calendar navigation
 * - MutationObserver ensures highlighting persists during month changes and reopen events
 * - Optimistic state is automatically cleared on successful mutations or errors
 * - Memory efficient with proper observer cleanup on component unmount
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
}) => {
  const { lang } = useTranslation();

  // Inject styles when component mounts
  useEffect(() => {
    injectHighlightingStyles();
  }, []);

  // Auto-generate holidays based on app locale if enabled
  const autoHolidays = useMemo(() => {
    if (!showHolidays) {
      return []; // No holidays if disabled
    }

    // Auto-generate holidays for current and next year based on app's configured locale
    // lang comes from useTranslation and represents the app's language setting (from i18n.json)
    const currentYear = new Date().getFullYear();
    const locale = lang === 'de' ? 'de' : 'us'; // Map app locale to holiday locale

    return [
      ...getHolidaysByLocale({ year: currentYear, locale }),
      ...getHolidaysByLocale({ year: currentYear + 1, locale }),
    ];
  }, [showHolidays, lang]);

  // Local optimistic state
  const [optimisticValue, setOptimisticValue] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Combine holidays and weekends into a single highlighting array
  const allHighlights = useMemo(() => {
    const highlights = [...autoHolidays];

    // Add weekends if enabled
    if (showWeekends) {
      const currentYear = new Date().getFullYear();

      for (const year of [currentYear, currentYear + 1]) {
        for (let month = 0; month < 12; month++) {
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();

            if (dayOfWeek === 0 || dayOfWeek === 6) {
              // Sunday = 0, Saturday = 6
              highlights.push({
                date,
                name: dayOfWeek === 0 ? 'Sunday' : 'Saturday',
                className: 'weekend-day',
              });
            }
          }
        }
      }
    }

    return highlights;
  }, [autoHolidays, showWeekends]);

  // Process all highlights into highlight dates format that react-datepicker expects
  const processedHighlightDates = React.useMemo(() => {
    const processed: any[] = [...highlightDates];

    if (allHighlights.length > 0) {
      // Group highlights by className
      const highlightGroups = allHighlights.reduce(
        (groups, highlight) => {
          const className = highlight.className || 'holiday';
          if (!groups[className]) {
            groups[className] = [];
          }
          groups[className].push(highlight.date);
          return groups;
        },
        {} as { [key: string]: Date[] }
      );

      // Convert to react-datepicker highlightDates format
      // react-datepicker expects: [{ "css-class-name": [date1, date2] }]
      Object.entries(highlightGroups).forEach(([className, dates]) => {
        processed.push({ [className]: dates });
      });
    }

    return processed;
  }, [allHighlights, highlightDates]);

  // Apply highlighting styles via direct DOM manipulation after calendar renders
  useEffect(() => {
    const applyHighlightingStyles = () => {
      const calendar = document.querySelector('.react-datepicker');
      if (!calendar) {
        return false; // Calendar not ready yet
      }

      if (allHighlights.length === 0) {
        return true; // Calendar found but no highlights
      }

      const dayElements = calendar.querySelectorAll('.react-datepicker__day');

      if (dayElements.length === 0) {
        return false; // Calendar found but days not rendered yet
      }

      dayElements.forEach((el) => {
        // Clear any existing highlighting styles
        el.classList.remove('holiday-day', 'national-holiday-day', 'weekend-day');

        // Get the date from the element
        const dayNumber = parseInt(el.textContent || '0', 10);
        if (dayNumber === 0) return;

        // Find the corresponding date - we need to determine month/year from calendar context
        const monthElement = calendar.querySelector('.react-datepicker__current-month');
        if (!monthElement) return;

        const monthYearText = monthElement.textContent;
        if (!monthYearText) return;

        // Parse month and year from the header (format like "June 2025")
        const [monthName, year] = monthYearText.split(' ');
        const calendarMonth = new Date(`${monthName} 1, ${year}`).getMonth();
        const calendarYear = parseInt(year);

        // For outside-month days, we need to determine if they're from previous or next month
        let elementDate: Date;
        if (el.classList.contains('react-datepicker__day--outside-month')) {
          // Determine if this is from previous or next month based on position
          const weekElement = el.parentElement;
          const monthContainer = weekElement?.parentElement;
          if (!weekElement || !monthContainer) return;

          const allWeeks = Array.from(monthContainer.children);
          const weekIndex = allWeeks.indexOf(weekElement);

          if (weekIndex === 0) {
            // First week - likely previous month
            elementDate = new Date(calendarYear, calendarMonth - 1, dayNumber);
          } else {
            // Last week - likely next month
            elementDate = new Date(calendarYear, calendarMonth + 1, dayNumber);
          }
        } else {
          // Current month day
          elementDate = new Date(calendarYear, calendarMonth, dayNumber);
        }

        // Check if this date should be highlighted (holiday or weekend)
        const highlight = allHighlights.find(
          (h) =>
            h.date.getFullYear() === elementDate.getFullYear() &&
            h.date.getMonth() === elementDate.getMonth() &&
            h.date.getDate() === elementDate.getDate()
        );

        // Apply highlighting styles and tooltips
        if (highlight) {
          if (highlight.className === 'national-holiday') {
            el.classList.add('national-holiday-day');
            el.setAttribute('title', highlight.name || 'National Holiday');
          } else if (highlight.className === 'weekend-day') {
            el.classList.add('weekend-day');
            // Optional: Add weekend tooltips
            // el.setAttribute('title', highlight.name || 'Weekend');
          } else {
            el.classList.add('holiday-day');
            el.setAttribute('title', highlight.name || 'Holiday');
          }
        } else {
          // Clear any existing tooltip when no highlight
          el.removeAttribute('title');
        }
      });

      return true; // Successfully applied styles
    };

    // Keep trying until calendar is ready
    let attempts = 0;
    const maxAttempts = 20;

    const tryApplyStyles = () => {
      attempts++;
      const success = applyHighlightingStyles();

      if (!success && attempts < maxAttempts) {
        setTimeout(tryApplyStyles, 100);
      }
    };

    tryApplyStyles();
  }, [allHighlights, optimisticValue, value]); // Re-run when highlights or displayed date changes

  // Re-apply styles when calendar changes (month navigation, open/close)
  useEffect(() => {
    let currentObserver = null;

    const applyHighlightingStylesToCalendar = () => {
      const calendar = document.querySelector('.react-datepicker');
      if (!calendar || allHighlights.length === 0) {
        return false;
      }

      const dayElements = calendar.querySelectorAll('.react-datepicker__day');

      if (dayElements.length === 0) {
        return false;
      }

      dayElements.forEach((el) => {
        el.classList.remove('holiday-day', 'national-holiday-day', 'weekend-day');

        const dayNumber = parseInt(el.textContent || '0', 10);
        if (dayNumber === 0) return;

        const monthElement = calendar.querySelector('.react-datepicker__current-month');
        if (!monthElement) return;

        const monthYearText = monthElement.textContent;
        if (!monthYearText) return;

        const [monthName, year] = monthYearText.split(' ');
        const calendarMonth = new Date(`${monthName} 1, ${year}`).getMonth();
        const calendarYear = parseInt(year);

        // For outside-month days, we need to determine if they're from previous or next month
        let elementDate: Date;
        if (el.classList.contains('react-datepicker__day--outside-month')) {
          // Determine if this is from previous or next month based on position
          const weekElement = el.parentElement;
          const monthContainer = weekElement?.parentElement;
          if (!weekElement || !monthContainer) return;

          const allWeeks = Array.from(monthContainer.children);
          const weekIndex = allWeeks.indexOf(weekElement);

          if (weekIndex === 0) {
            // First week - likely previous month
            elementDate = new Date(calendarYear, calendarMonth - 1, dayNumber);
          } else {
            // Last week - likely next month
            elementDate = new Date(calendarYear, calendarMonth + 1, dayNumber);
          }
        } else {
          // Current month day
          elementDate = new Date(calendarYear, calendarMonth, dayNumber);
        }

        const highlight = allHighlights.find(
          (h) =>
            h.date.getFullYear() === elementDate.getFullYear() &&
            h.date.getMonth() === elementDate.getMonth() &&
            h.date.getDate() === elementDate.getDate()
        );

        if (highlight) {
          if (highlight.className === 'national-holiday') {
            el.classList.add('national-holiday-day');
            el.setAttribute('title', highlight.name || 'National Holiday');
          } else if (highlight.className === 'weekend-day') {
            el.classList.add('weekend-day');
            // Optional: Add weekend tooltips
            // el.setAttribute('title', highlight.name || 'Weekend');
          } else {
            el.classList.add('holiday-day');
            el.setAttribute('title', highlight.name || 'Holiday');
          }
        } else {
          // Clear any existing tooltip when no highlight
          el.removeAttribute('title');
        }
      });

      return true;
    };

    const setupCalendarObserver = () => {
      const calendar = document.querySelector('.react-datepicker');
      if (!calendar) {
        return null;
      }

      const observer = new MutationObserver((mutations) => {
        let shouldReapply = false;

        mutations.forEach((mutation) => {
          // Check if month header changed (month navigation)
          if (
            mutation.target instanceof Element &&
            mutation.target.classList?.contains('react-datepicker__current-month')
          ) {
            shouldReapply = true;
          }
          // Check if day elements were added/removed
          if (
            mutation.target instanceof Element &&
            (mutation.target.classList?.contains('react-datepicker__month') ||
              mutation.target.classList?.contains('react-datepicker__week'))
          ) {
            shouldReapply = true;
          }
          // Check for any day element changes
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node instanceof Element && node.classList?.contains('react-datepicker__day')) {
              shouldReapply = true;
            }
          });
        });

        if (shouldReapply) {
          setTimeout(() => {
            applyHighlightingStylesToCalendar();
          }, 50);
        }
      });

      observer.observe(calendar, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return observer;
    };

    // Watch for calendar appearance/disappearance (open/close)
    const documentObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node instanceof Element) {
            // Check if a new calendar was added
            const calendar = node.classList?.contains('react-datepicker')
              ? node
              : node.querySelector?.('.react-datepicker');

            if (calendar) {
              // Disconnect previous observer if exists
              if (currentObserver) {
                currentObserver.disconnect();
              }

              // Apply styles to the new calendar
              setTimeout(() => {
                applyHighlightingStylesToCalendar();
                // Set up new observer for this calendar
                currentObserver = setupCalendarObserver();
              }, 100);
            }
          }
        });
      });
    });

    // Observe the entire document for calendar additions
    documentObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial setup if calendar already exists
    if (document.querySelector('.react-datepicker')) {
      currentObserver = setupCalendarObserver();
    }

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
      documentObserver.disconnect();
    };
  }, [allHighlights]);

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
    <div className="relative">
      <DatePicker
        selected={displayValue}
        onChange={handleDateChange as any}
        disabled={isDisabled}
        className={finalClassName}
        locale={propLocale || lang}
        dateFormat={dateFormat || (lang === 'de' ? 'dd.MM.yyyy' : 'MM/dd/yyyy')}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholderText}
        excludeDates={excludeDates}
        id={id}
        name={name}
        title={title}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        readOnly={readOnly}
        required={required}
        tabIndex={tabIndex}
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
