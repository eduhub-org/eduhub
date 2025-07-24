import { useState, useCallback, useEffect } from 'react';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { useDebouncedCallback } from 'use-debounce';
import useErrorHandler from '../../../hooks/useErrorHandler';
import { SelectChangeEvent } from '@mui/material';
import { gql } from '@apollo/client';

export const useDropDownLogic = (
  value: string,
  options: Array<any>,
  updateValueMutation: any | null,
  identifierVariables: any,
  onValueUpdated: (value: string) => string,
  refetchQueries: any[],
  nullable = false
) => {
  // Initialize all hooks unconditionally at the top level
  const [localValue, setLocalValue] = useState(value);
  const [localOptions, setLocalOptions] = useState(options);
  const { error, handleError, resetError } = useErrorHandler();
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [updateValue] = useRoleMutation(
    updateValueMutation ||
    gql`
      mutation NoOp {
        __typename
      }
    `,
    {
      onError: (error) => handleError(error.message),
      onCompleted: (data) => {
        if (onValueUpdated) onValueUpdated(data);
        setShowSavedNotification(true);
      },
      refetchQueries,
    }
  );

  const validateValue = useCallback((newValue: string, isMandatory = false) => {
    return isMandatory ? newValue !== '' : true;
  }, []);

  const debouncedUpdateValue = useDebouncedCallback((newValue: string, isMandatory = false) => {
    if (validateValue(newValue, isMandatory)) {
      if (updateValueMutation) {
        // Convert empty string to null for nullable fields
        const finalValue = nullable && newValue === '' ? null : newValue;
        const variables = {
          ...identifierVariables,
          value: finalValue,
        };
        updateValue({ variables });
      } else if (onValueUpdated) {
        onValueUpdated(newValue);
      }
      setErrorMessage('');
    } else {
      setErrorMessage('unified_dropdown_selector.invalid_selection');
    }
    setHasBlurred(false);
  }, 300);

  const handleValueChange = useCallback(
    (event: SelectChangeEvent<string> | React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      debouncedUpdateValue(newValue);
    },
    [debouncedUpdateValue, setLocalValue]
  );

  const handleBlur = useCallback(
    (variant: 'material' | 'eduhub', isMandatory = false) => {
      setHasBlurred(true);
      if (!validateValue(localValue, isMandatory)) {
        setErrorMessage('dropdown_selector.invalid_selection');
        if (variant === 'eduhub') {
          handleError('dropdown_selector.invalid_selection');
        }
      } else {
        setErrorMessage('');
        if (variant === 'eduhub') {
          resetError();
        }
      }
      debouncedUpdateValue.flush();
    },
    [localValue, validateValue, debouncedUpdateValue, handleError, resetError]
  );

  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  // Return different objects based on whether we have a mutation
  if (!updateValueMutation) {
    return {
      localValue: value,
      localOptions: options,
      error: null,
      handleError: handleError,
      resetError: resetError,
      showSavedNotification: false,
      setShowSavedNotification: setShowSavedNotification,
      hasBlurred: false,
      errorMessage: '',
      handleValueChange: (event: SelectChangeEvent<string> | React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = event.target.value;
        onValueUpdated(newValue);
      },
      handleBlur: handleBlur,
      debouncedUpdateValue: (newValue: string) => onValueUpdated(newValue),
    };
  }

  return {
    localValue,
    setLocalValue,
    localOptions,
    setLocalOptions,
    error,
    handleError,
    resetError,
    showSavedNotification,
    setShowSavedNotification,
    hasBlurred,
    errorMessage,
    handleValueChange,
    handleBlur,
    debouncedUpdateValue,
    validateValue,
  };
}; 