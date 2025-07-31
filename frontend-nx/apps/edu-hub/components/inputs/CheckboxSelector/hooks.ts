import { useState, useCallback, useEffect } from 'react';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { useDebouncedCallback } from 'use-debounce';
import useErrorHandler from '../../../hooks/useErrorHandler';
import { gql } from '@apollo/client';

export const useCheckboxLogic = (
  checked: boolean,
  updateValueMutation: any | null,
  identifierVariables: any,
  onValueUpdated: (value: any) => any,
  refetchQueries: any[]
) => {
  const [localChecked, setLocalChecked] = useState(checked);
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

  const debouncedUpdateValue = useDebouncedCallback((newChecked: boolean) => {
    if (updateValueMutation) {
      const variables = {
        ...identifierVariables,
        value: newChecked,
      };
      updateValue({ variables });
    } else if (onValueUpdated) {
      onValueUpdated(newChecked);
    }
    setErrorMessage('');
  }, 300);

  const handleValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = event.target.checked;
      setLocalChecked(newChecked);
      debouncedUpdateValue(newChecked);
    },
    [debouncedUpdateValue, setLocalChecked]
  );

  useEffect(() => {
    if (checked !== localChecked) {
      setLocalChecked(checked);
    }
  }, [checked, localChecked]);

  // Return different objects based on whether we have a mutation
  if (!updateValueMutation) {
    return {
      localChecked: checked,
      error: null,
      handleError: handleError,
      resetError: resetError,
      showSavedNotification: false,
      setShowSavedNotification: setShowSavedNotification,
      errorMessage: '',
      handleValueChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        const newChecked = event.target.checked;
        onValueUpdated(newChecked);
      },
    };
  }

  return {
    localChecked,
    setLocalChecked,
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