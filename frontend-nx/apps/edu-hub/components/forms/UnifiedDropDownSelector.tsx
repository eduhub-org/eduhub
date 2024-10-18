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
import { useAdminMutation, useRoleMutation } from '../../hooks/authedMutation';
import useTranslation from 'next-translate/useTranslation';
import { prioritizeClasses } from '../../helpers/util';
import useErrorHandler from '../../hooks/useErrorHandler';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import log from 'loglevel';
import Snackbar from '@mui/material/Snackbar';

type UnifiedDropDownSelectorProps = {
  variant: 'material' | 'eduhub';
  label?: string;
  itemId: string | number;
  currentValue: string;
  options: string[];
  updateValueMutation: DocumentNode;
  onValueUpdated?: (data: any) => void;
  refetchQueries?: string[];
  helpText?: string;
  errorText?: string;
  translationNamespace?: string;
  translationPrefix?: string;
  isMandatory?: boolean;
  className?: string;
  idVariables?: Record<string, any>;
};

const UnifiedDropDownSelector: React.FC<UnifiedDropDownSelectorProps> = ({
  variant,
  label,
  itemId,
  currentValue,
  options,
  updateValueMutation,
  onValueUpdated,
  refetchQueries = [],
  helpText,
  errorText = 'Invalid selection',
  translationNamespace,
  translationPrefix = '',
  isMandatory = false,
  className = '',
  idVariables = {},
}) => {
  const { t } = useTranslation(translationNamespace);
  const [value, setValue] = useState(currentValue);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { error, handleError, resetError } = useErrorHandler();
  const [showSavedNotification, setShowSavedNotification] = useState(false);

  const theme = useTheme();

  const [updateValue] =
    variant === 'material'
      ? useAdminMutation(updateValueMutation, {
          onCompleted: (data) => {
            if (onValueUpdated) onValueUpdated(data);
            setShowSavedNotification(true);
          },
          refetchQueries,
        })
      : useRoleMutation(updateValueMutation, {
          onError: (error) => handleError(t(error.message)),
          onCompleted: (data) => {
            if (onValueUpdated) onValueUpdated(data);
            setShowSavedNotification(true);
          },
        });

  const validateValue = (newValue: string) => {
    return isMandatory ? newValue !== '' : true;
  };

  const debouncedUpdateValue = useDebouncedCallback((newValue: string) => {
    if (validateValue(newValue)) {
      const variables = variant === 'material' ? { id: itemId, value: newValue } : { ...idVariables, value: newValue };
      updateValue({ variables });
      setErrorMessage('');
    } else {
      setErrorMessage(t(errorText));
    }
    setHasBlurred(false);
  }, 300);

  const handleValueChange = useCallback(
    (event: SelectChangeEvent<string> | React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = event.target.value;
      setValue(newValue);
      debouncedUpdateValue(newValue);
      log.debug('Updating item with new value:', newValue);
    },
    [debouncedUpdateValue]
  );

  const handleBlur = useCallback(() => {
    setHasBlurred(true);
    setErrorMessage(validateValue(value) ? '' : t(errorText));
  }, [value, errorText, t]);

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
          value={value}
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
              {t(`${translationPrefix}${option}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {hasBlurred && errorMessage && <p className="text-red-500 mt-2 ml-2 text-sm">{errorMessage}</p>}
    </div>
  );

  const renderEduHub = () => (
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
          <select onChange={handleValueChange} value={value} className={finalClassName}>
            {options.map((option, index) => (
              <option key={index} value={option}>
                {t(`${translationPrefix}${option}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {variant === 'material' ? renderMaterialUI() : renderEduHub()}
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

export default UnifiedDropDownSelector;
