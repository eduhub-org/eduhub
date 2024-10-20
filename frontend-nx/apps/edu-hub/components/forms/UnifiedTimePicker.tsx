import React, { useState, useCallback, ChangeEvent } from 'react';
import { DocumentNode } from 'graphql';
import { useDebouncedCallback } from 'use-debounce';
import { useRoleMutation } from '../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';
import { prioritizeClasses } from '../../helpers/util';
import useErrorHandler from '../../hooks/useErrorHandler';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import Snackbar from '@mui/material/Snackbar';
import { useFormatTimeString, useFormatTime } from '../../helpers/dateTimeHelpers';

type UnifiedTimePickerProps = {
  variant: 'material' | 'eduhub';
  label: string;
  identifierVariables: Record<string, any>;
  currentValue: Date | string | null;
  updateValueMutation: DocumentNode;
  onValueUpdated?: (data: any) => void;
  refetchQueries?: string[];
  helpText?: string;
  errorText?: string;
  translationNamespace?: string;
  isMandatory?: boolean;
  className?: string;
};

const UnifiedTimePicker: React.FC<UnifiedTimePickerProps> = ({
  variant,
  label,
  identifierVariables,
  currentValue,
  updateValueMutation,
  onValueUpdated,
  refetchQueries = [],
  helpText,
  errorText = 'Invalid time',
  translationNamespace,
  isMandatory = false,
  className = '',
}) => {
  const { t } = useTranslation(translationNamespace);
  const formatTimeString = useFormatTimeString();
  const formatTime = useFormatTime();

  const formatTimeValue = (val: Date | string | null): string => {
    return formatTimeString(val);
  };

  const [value, setValue] = useState<string | null>(currentValue ? formatTimeValue(currentValue) : null);
  const [errorMessage, setErrorMessage] = useState('');
  const { error, handleError, resetError } = useErrorHandler();
  const [showSavedNotification, setShowSavedNotification] = useState(false);

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
      const variables = { ...identifierVariables, value: newValue };
      updateValue({ variables });
      setErrorMessage('');
    } else {
      setErrorMessage(t(errorText));
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

  const baseClass = 'w-full h-12 px-3 py-3 mb-8 text-gray-500 rounded bg-edu-light-gray';
  const finalClassName = prioritizeClasses(`${baseClass} ${className}`);

  return (
    <>
      <div className="px-2">
        <div className="text-gray-400">
          <div className="flex justify-between mb-2">
            <div className="flex items-center">{t(label)}</div>
          </div>
          <div>
            <select className={finalClassName} onChange={handleChange} value={timeValue}>
              <option value="">{t('common:select_time')}</option>
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
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={showSavedNotification}
        autoHideDuration={2000}
        onClose={() => setShowSavedNotification(false)}
        message={t('Saved')}
      />
    </>
  );
};

export default UnifiedTimePicker;
