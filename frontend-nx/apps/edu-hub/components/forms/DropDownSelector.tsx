import React, { useState, useCallback } from 'react';
import { DocumentNode } from 'graphql';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import { HelpOutline } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useDebouncedCallback } from 'use-debounce';
import { useRoleMutation } from '../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';
import { prioritizeClasses } from '../../helpers/util';
import useErrorHandler from '../../hooks/useErrorHandler';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import { ErrorMessageDialog } from '../common/dialogs/ErrorMessageDialog';
import NotificationSnackbar from '../common/dialogs/NotificationSnackbar';

type DropDownSelectorProps = {
  // Determines the visual style and behavior of the component
  // 'material' uses Material-UI components, 'eduhub' uses custom styling
  variant: 'material' | 'eduhub';

  // The label for the dropdown selector (optional)
  label?: string;

  // The currently selected value in the dropdown
  value: string;

  // Array of available options for the dropdown (in format used in the database)
  options: string[];

  // GraphQL mutation to update the selected value
  updateValueMutation: DocumentNode;

  // Callback function triggered after a successful value update (optional)
  onValueUpdated?: (data: any) => void;

  // Array of query names to refetch after a successful update (optional)
  refetchQueries?: string[];

  // Tooltip text to provide additional information about the dropdown (optional)
  helpText?: string;

  // Error message to display when the selection is invalid (optional)
  errorText?: string;

  // Prefix for options translations (optional)
  optionsTranslationPrefix?: string;

  // Indicates if the field is required (optional, default: false)
  isMandatory?: boolean;

  // Additional CSS classes to apply to the component (optional)
  className?: string;

  // Variables to include in the mutation for identification
  identifierVariables: Record<string, any>;
};

const DropDownSelector: React.FC<DropDownSelectorProps> = ({
  variant,
  label,
  value,
  options,
  updateValueMutation,
  onValueUpdated,
  refetchQueries = [],
  helpText,
  optionsTranslationPrefix = '',
  isMandatory = false,
  className = '',
  identifierVariables = {},
}) => {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { error, handleError, resetError } = useErrorHandler();
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  const theme = useTheme();

  const [updateValue] = useRoleMutation(updateValueMutation, {
    onError: (error) => handleError(t(error.message)),
    onCompleted: (data) => {
      if (onValueUpdated) onValueUpdated(data);
      setShowSavedNotification(true);
    },
    refetchQueries,
  });

  const validateValue = (newValue: string) => {
    return isMandatory ? newValue !== '' : true;
  };

  const debouncedUpdateValue = useDebouncedCallback((newValue: string) => {
    if (validateValue(newValue)) {
      const variables = {
        ...identifierVariables,
        value: newValue,
      };
      updateValue({ variables });
      setErrorMessage('');
    } else {
      setErrorMessage(t('unified_dropdown_selector.invalid_selection'));
    }
    setHasBlurred(false);
  }, 300);

  const handleValueChange = useCallback(
    (event: SelectChangeEvent<string> | React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      debouncedUpdateValue(newValue);
    },
    [debouncedUpdateValue]
  );

  const handleBlur = useCallback(() => {
    setHasBlurred(true);
    if (!validateValue(localValue)) {
      setErrorMessage(t('dropdown_selector.invalid_selection'));
      if (variant === 'eduhub') {
        handleError(t('dropdown_selector.invalid_selection'));
      }
    } else {
      setErrorMessage('');
      if (variant === 'eduhub') {
        resetError();
      }
    }
    debouncedUpdateValue.flush();
  }, [variant, localValue, validateValue, debouncedUpdateValue, handleError, resetError, t]);

  const baseClass = 'w-full px-3 py-3 mb-8 text-gray-500 rounded bg-edu-light-gray';
  const finalClassName = prioritizeClasses(`${baseClass} ${className}`);

  const renderMaterialUI = () => (
    <div className="col-span-10 flex mt-3">
      <FormControl variant="standard" className={hasBlurred && errorMessage ? 'w-3/4' : 'w-full'}>
        {label && (
          <InputLabel id={`${label}-label`} style={{ color: hasBlurred && errorMessage ? 'red' : 'rgb(34, 34, 34)' }}>
            {t(label)}
          </InputLabel>
        )}
        <Select
          labelId={label ? `${label}-label` : undefined}
          value={localValue}
          onChange={handleValueChange}
          onBlur={handleBlur}
          style={{ color: hasBlurred && errorMessage ? 'red' : 'inherit' }}
          endAdornment={
            helpText ? (
              <InputAdornment position="end">
                <Tooltip title={t(helpText)} placement="top">
                  <HelpOutline style={{ cursor: 'pointer', color: theme.palette.text.disabled }} />
                </Tooltip>
              </InputAdornment>
            ) : null
          }
        >
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {t(`${optionsTranslationPrefix}${option}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {hasBlurred && errorMessage && <p className="text-red-500 mt-2 ml-2 text-sm">{errorMessage}</p>}
    </div>
  );

  const renderEduhub = () => (
    <div className="px-2">
      <div className="text-gray-400">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            {helpText && (
              <Tooltip title={t(helpText)} placement="top">
                <HelpOutline style={{ cursor: 'pointer', marginRight: '5px' }} />
              </Tooltip>
            )}
            {label}
          </div>
        </div>
        <div>
          <select
            onChange={handleValueChange}
            onBlur={handleBlur}
            value={localValue}
            className={`${finalClassName} ${errorMessage ? 'border-red-500' : ''}`}
          >
            {options.map((option, index) => (
              <option key={index} value={option}>
                {t(`${optionsTranslationPrefix}${option}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {variant === 'material' ? renderMaterialUI() : renderEduhub()}
      {variant === 'material' && error && <AlertMessageDialog alert={error} open={!!error} onClose={resetError} />}
      {variant === 'eduhub' && error && <ErrorMessageDialog errorMessage={error} open={!!error} onClose={resetError} />}
      <NotificationSnackbar
        open={showSavedNotification}
        onClose={() => setShowSavedNotification(false)}
        message="notification_snackbar.saved"
      />
    </>
  );
};

export default DropDownSelector;
