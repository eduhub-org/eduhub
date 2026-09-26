import React from 'react';
import { useCheckboxLogic } from './hooks';
import { CheckboxSelectorProps } from './types';
import { MaterialCheckbox } from './components/MaterialCheckbox';
import { EduhubCheckbox } from './components/EduhubCheckbox';
import { EduhubSwitch } from './components/EduhubSwitch';
import { useTranslations } from 'next-intl';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';

const CheckboxSelector: React.FC<CheckboxSelectorProps> = ({
  variant,
  label,
  ariaLabel,
  checked,
  updateValueMutation,
  role,
  onValueUpdated,
  refetchQueries = [],
  helpText,
  className = '',
  identifierVariables,
  disabled = false,
  suppressFeedback = false,
}) => {
  const t = useTranslations('common');

  const handleMutationValueUpdate = (value: unknown) => {
    const newValue = value as boolean;
    onValueUpdated?.(newValue);
  };

  const {
    localChecked,
    error,
    resetError,
    showSavedNotification,
    setShowSavedNotification,
    errorMessage,
    handleValueChange,
  } = useCheckboxLogic(checked, updateValueMutation ?? null, identifierVariables ?? {}, handleMutationValueUpdate, refetchQueries, role);

  const checkboxProps = {
    label,
    ariaLabel,
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
      {variant === 'material' ? (
        <MaterialCheckbox {...checkboxProps} />
      ) : variant === 'switch' ? (
        <EduhubSwitch {...checkboxProps} />
      ) : (
        <EduhubCheckbox {...checkboxProps} />
      )}

      {!suppressFeedback ? (
        <>
          <NotificationSnackbar
            open={showSavedNotification}
            onClose={() => setShowSavedNotification(false)}
            message={t('notification_snackbar.saved')}
          />

          <ErrorMessageDialog
            errorMessage={typeof error === 'string' ? error : ''}
            open={!!error}
            onClose={resetError}
          />
        </>
      ) : null}
    </>
  );
};

export default CheckboxSelector;
