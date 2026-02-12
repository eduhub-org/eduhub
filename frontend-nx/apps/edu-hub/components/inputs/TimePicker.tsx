import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { DocumentNode } from 'graphql';
import { useDebouncedCallback } from 'use-debounce';
import { useRoleMutation } from '../../hooks/authedMutation';
import { useTranslations } from 'next-intl';
import { prioritizeClasses } from '../../helpers/util';
import useErrorHandler from '../../hooks/useErrorHandler';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import NotificationSnackbar from '../common/dialogs/NotificationSnackbar';
import { useFormatTimeString, useFormatTime } from '../../helpers/dateTimeHelpers';

type TimePickerProps = {
  variant: 'material' | 'eduhub';
  label?: string;
  identifierVariables: Record<string, any>;
  currentValue: Date | string | null;
  updateValueMutation: DocumentNode;
  onValueUpdated?: (data: any) => void;
  refetchQueries?: string[];
  helpText?: string;
  isMandatory?: boolean;
  className?: string;
  saveAsDateTime?: boolean;
  /** When true, reduces padding and margin for compact layouts (e.g. table cells) */
  compact?: boolean;
};

const TimePicker: React.FC<TimePickerProps> = ({
  label,
  identifierVariables,
  currentValue,
  updateValueMutation,
  onValueUpdated,
  refetchQueries = [],
  isMandatory = false,
  className = '',
  saveAsDateTime = false,
  compact = false,
}) => {
  const t = useTranslations('common');
  const formatTimeString = useFormatTimeString();
  const formatTime = useFormatTime();

  const formatTimeValue = useCallback((val: Date | string | null): string => {
    return formatTimeString(val);
  }, [formatTimeString]);

  const originalDateTime = currentValue instanceof Date ? currentValue : null;

  const [value, setValue] = useState<string | null>(currentValue ? formatTimeValue(currentValue) : null);
  const [errorMessage, setErrorMessage] = useState('');
  const { error, handleError, resetError } = useErrorHandler();
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  // Update display value when currentValue changes (e.g., after date picker changes)
  useEffect(() => {
    setValue(currentValue ? formatTimeValue(currentValue) : null);
  }, [currentValue, formatTimeValue]);

  const [updateValue] = useRoleMutation(updateValueMutation, {
    onError: (error) => handleError(t(error.message)),
    onCompleted: (data) => {
      if (onValueUpdated) onValueUpdated(data);
      setShowSavedNotification(true);
    },
    refetchQueries,
  });

  const validateValue = useCallback(
    (newValue: string | null) => {
      return isMandatory ? newValue !== null : true;
    },
    [isMandatory]
  );

  const debouncedUpdateValue = useDebouncedCallback((newValue: string | null) => {
    if (validateValue(newValue)) {
      let valueToSave = newValue;

      if (saveAsDateTime && originalDateTime && newValue) {
        const [hours, minutes] = newValue.split(':').map(Number);
        const updatedDate = new Date(originalDateTime);
        updatedDate.setHours(hours, minutes, 0, 0);
        valueToSave = updatedDate.toISOString();
      }

      const variables = { ...identifierVariables, value: valueToSave };
      updateValue({ variables });
      setErrorMessage('');
    } else {
      setErrorMessage(t('time_picker.invalid_time'));
    }
  }, 300);

  const handleValueChange = useCallback(
    (newValue: string | null) => {
      const formattedValue = newValue ? formatTimeString(newValue) : null;
      setValue(formattedValue);
      debouncedUpdateValue(formattedValue);
    },
    [debouncedUpdateValue, formatTimeString]
  );
  const timeValue = value || '';

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const newValue = event.target.value;
      handleValueChange(newValue === '' ? null : newValue);
    },
    [handleValueChange]
  );

  // Generate time options
  const timeOptions = [];
  for (let i = 0; i < 24 * 4; i++) {
    const date = new Date();
    date.setHours(Math.floor(i / 4), (i % 4) * 15, 0, 0);
    timeOptions.push(formatTime(date));
  }

  const baseClass = compact
    ? 'w-full h-9 px-2 py-1.5 text-label-primary rounded bg-fill-primary'
    : 'w-full h-12 px-3 py-3 mb-8 text-label-primary rounded bg-fill-primary';
  const finalClassName = prioritizeClasses(`${baseClass} ${className}`);

  return (
    <>
      <div className={compact ? 'px-0' : 'px-2'}>
        <div className="text-label-primary">
          {label && (
            <div className="flex justify-between mb-2">
              <div className="flex items-center">{label}</div>
            </div>
          )}
          <div className="light">
            <select className={finalClassName} onChange={handleChange} value={timeValue}>
              <option value="">{t('time_picker.select_time')}</option>
              {timeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {errorMessage && <div className="text-red-500 mt-1">{errorMessage}</div>}
      {error && <AlertMessageDialog alert={error} open={!!error} onClose={resetError} />}
      <NotificationSnackbar
        open={showSavedNotification}
        onClose={() => setShowSavedNotification(false)}
        message={t('notification_snackbar.saved')}
      />
    </>
  );
};

export default TimePicker;
