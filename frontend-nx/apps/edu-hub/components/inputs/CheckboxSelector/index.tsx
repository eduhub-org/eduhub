import React from 'react';
import { useCheckboxLogic } from './hooks';
import { CheckboxSelectorProps } from './types';
import { MaterialCheckbox } from './components/MaterialCheckbox';
import { EduhubCheckbox } from './components/EduhubCheckbox';
import useTranslation from 'next-translate/useTranslation';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';

const CheckboxSelector: React.FC<CheckboxSelectorProps> = ({
  variant,
  label,
  checked,
  updateValueMutation,
  onValueUpdated,
  refetchQueries = [],
  helpText,
  className = '',
  identifierVariables,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const handleMutationValueUpdate = (newValue: boolean) => {
    onValueUpdated?.(newValue);
    return newValue;
  };

  const {
    localChecked,
    error,
    resetError,
    showSavedNotification,
    setShowSavedNotification,
    errorMessage,
    handleValueChange,
  } = useCheckboxLogic(checked, updateValueMutation, identifierVariables, handleMutationValueUpdate, refetchQueries);

  const checkboxProps = {
    label,
    localChecked,
    handleValueChange,
    helpText,
    disabled,
    className,
    showSavedNotification,
    errorMessage,
  };

  return (
    <>
      {variant === 'material' ? <MaterialCheckbox {...checkboxProps} /> : <EduhubCheckbox {...checkboxProps} />}

      {/* Notification Components */}
      <NotificationSnackbar
        open={showSavedNotification}
        onClose={() => setShowSavedNotification(false)}
        message={t('notification_snackbar.saved')}
        translationNamespace="common"
      />

      <ErrorMessageDialog errorMessage={error?.message || ''} open={!!error} onClose={resetError} />
    </>
  );
};

export default CheckboxSelector;
