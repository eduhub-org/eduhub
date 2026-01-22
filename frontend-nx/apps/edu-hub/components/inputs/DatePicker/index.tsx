import React from 'react';
import { useDatePickerLogic } from './hooks';
import { DatePickerProps } from './types';
import OptimisticDatePicker from '../OptimisticDatePicker';
import { useTranslations } from 'next-intl';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { AlertMessageDialog } from '../../common/dialogs/AlertMessageDialog';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import { HelpOutline } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const DatePicker: React.FC<DatePickerProps> = ({
  variant,
  label,
  helpText,
  itemId,
  value,
  updateValueMutation,
  onValueUpdated,
  refetchQueries = [],
  placeholder,
  disabled = false,
  minDate,
  maxDate,
  className = '',
  showHolidays = true,
  showWeekends = false,
  identifierVariables,
  dateFieldName,
}) => {
  const t = useTranslations('common');
  const theme = useTheme();

  const handleMutationValueUpdate = (newValue: Date | null) => {
    onValueUpdated?.(newValue);
    return newValue;
  };

  const {
    localValue,
    error,
    resetError,
    showSavedNotification,
    setShowSavedNotification,
    errorMessage,
    handleValueChange,
  } = useDatePickerLogic(
    value,
    updateValueMutation || null,
    itemId,
    identifierVariables,
    handleMutationValueUpdate,
    refetchQueries
  );

  const handleDateChange = async (date: Date | null) => {
    await handleValueChange(date, dateFieldName);
  };

  const datePickerComponent = (
    <div className="w-full inline-flex items-center border border-gray-300 rounded px-2 py-1 bg-white hover:border-gray-400 focus-within:border-blue-500 focus-within:outline-none focus-within:ring-1 focus-within:ring-blue-500 transition-colors">
      <OptimisticDatePicker
        value={localValue}
        onChange={handleDateChange}
        disabled={disabled}
        className={`${className} w-full`}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholder}
        showHolidays={showHolidays}
        showWeekends={showWeekends}
        onError={(error) => {
          console.error('DatePicker error:', error);
        }}
      />
    </div>
  );

  const renderMaterialUI = () => {
    // If no label, render compact version for table cells
    if (!label) {
      return (
        <>
          <div className="relative">
            {datePickerComponent}
            {helpText && (
              <InputAdornment position="end" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Tooltip title={helpText || ''} placement="top">
                  <HelpOutline style={{ cursor: 'help', color: theme.palette.text.disabled }} />
                </Tooltip>
              </InputAdornment>
            )}
          </div>
          {errorMessage && <p className="text-red-500 mt-1 text-xs">{errorMessage}</p>}
          <NotificationSnackbar
            open={showSavedNotification}
            onClose={() => setShowSavedNotification(false)}
            message={t('notification_snackbar.saved')}
          />
        </>
      );
    }

    // Full version with label
    return (
      <div className="col-span-10 flex mt-3">
        <div className={errorMessage ? 'w-3/4' : 'w-full'}>
          <label className="block text-sm font-medium mb-1" style={{ color: errorMessage ? 'red' : 'rgb(34, 34, 34)' }}>
            {label}
          </label>
          <div className="relative">
            {datePickerComponent}
            {helpText && (
              <InputAdornment position="end" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                <Tooltip title={helpText || ''} placement="top">
                  <HelpOutline style={{ cursor: 'pointer', color: theme.palette.text.disabled }} />
                </Tooltip>
              </InputAdornment>
            )}
          </div>
        </div>
        {errorMessage && <p className="text-red-500 mt-2 ml-2 text-sm">{errorMessage}</p>}
        <NotificationSnackbar
          open={showSavedNotification}
          onClose={() => setShowSavedNotification(false)}
          message={t('notification_snackbar.saved')}
        />
      </div>
    );
  };

  const renderEduHub = () => (
    <div className="px-2">
      <div className="text-gray-400">
        {label && (
          <div className="flex justify-between mb-2">
            <div className="flex items-center">
              {helpText && (
                <Tooltip title={helpText} placement="top">
                  <HelpOutline style={{ cursor: 'pointer', marginRight: '5px' }} />
                </Tooltip>
              )}
              {label}
            </div>
          </div>
        )}
        <div className="relative">
          {datePickerComponent}
        </div>
      </div>
      {errorMessage && <p className="mt-1 text-sm text-red-600">{errorMessage}</p>}
      <NotificationSnackbar
        open={showSavedNotification}
        onClose={() => setShowSavedNotification(false)}
        message={t('notification_snackbar.saved')}
      />
    </div>
  );

  return (
    <>
      {variant === 'material' ? renderMaterialUI() : renderEduHub()}
      {variant === 'material' && error && <AlertMessageDialog alert={error} open={!!error} onClose={resetError} />}
      {variant === 'eduhub' && error && <ErrorMessageDialog errorMessage={error?.message || ''} open={!!error} onClose={resetError} />}
    </>
  );
};

export default DatePicker;

