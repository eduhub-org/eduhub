import React, { FC, useCallback, useState, useEffect } from 'react';
import DatePicker, { DatePickerProps } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useTranslation from 'next-translate/useTranslation';

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
 * OptimisticDatePicker provides immediate UI feedback for date selections
 * while handling async mutations in the background.
 *
 * Features:
 * - Immediate UI updates (optimistic updates)
 * - Error handling with automatic rollback
 * - Loading states
 * - Compatible with react-datepicker props
 */
export const OptimisticDatePicker: FC<OptimisticDatePickerProps> = ({
  value,
  onChange,
  onError,
  showLoading = false,
  loadingIndicator,
  className = '',
  disabled = false,
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

  // Local optimistic state
  const [optimisticValue, setOptimisticValue] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

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
