import { useState, useCallback, useEffect } from 'react';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { useDebouncedCallback } from 'use-debounce';
import useErrorHandler from '../../../hooks/useErrorHandler';
import { gql } from '@apollo/client';
import { DocumentNode } from 'graphql';

export const useDatePickerLogic = (
  value: Date | null,
  updateValueMutation: DocumentNode | null,
  itemId: number,
  identifierVariables: Record<string, any> | undefined,
  onValueUpdated: (value: unknown) => void,
  refetchQueries: string[]
) => {
  const [localValue, setLocalValue] = useState<Date | null>(value);
  const { error, handleError, resetError } = useErrorHandler();
  const [showSavedNotification, setShowSavedNotification] = useState(false);
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

  const debouncedUpdateValue = useDebouncedCallback((newValue: Date | null, dateFieldName: string) => {
    if (updateValueMutation) {
      // Convert Date to ISO string format (date only, no time) or null
      const dateValue = newValue ? newValue.toISOString().split('T')[0] : null;
      
      // Use identifierVariables if provided, otherwise default to { programId: itemId }
      const baseVariables = identifierVariables || { programId: itemId };
      
      // Map dateFieldName to the actual mutation variable name
      // The dateFieldName prop tells us which field this is (e.g., 'applicationStart', 'deadline')
      // and we use it directly as the mutation variable name
      const variables = {
        ...baseVariables,
        [dateFieldName]: dateValue,
      };
      
      updateValue({ variables });
    } else if (onValueUpdated) {
      onValueUpdated(newValue);
    }
    setErrorMessage('');
  }, 300);

  const handleValueChange = useCallback(
    async (date: Date | null, dateFieldName: string) => {
      setLocalValue(date);
      await debouncedUpdateValue(date, dateFieldName);
    },
    [debouncedUpdateValue]
  );

  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  // Return different objects based on whether we have a mutation
  if (!updateValueMutation) {
    return {
      localValue: value,
      error: null,
      handleError: handleError,
      resetError: resetError,
      showSavedNotification: false,
      setShowSavedNotification: setShowSavedNotification,
      errorMessage: '',
      handleValueChange: async (date: Date | null, _dateFieldName: string) => {
        onValueUpdated(date);
      },
    };
  }

  return {
    localValue,
    setLocalValue,
    error,
    handleError,
    resetError,
    showSavedNotification,
    setShowSavedNotification,
    errorMessage,
    handleValueChange,
    debouncedUpdateValue,
  };
};

