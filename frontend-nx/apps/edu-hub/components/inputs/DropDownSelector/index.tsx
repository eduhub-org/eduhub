import React, { useState, useCallback, useMemo } from 'react';
import { useDropDownLogic } from './hooks';
import { DropDownSelectorProps, Option } from './types';
import { MaterialDropDown } from './components/MaterialDropDown';
import { EduhubDropDown } from './components/EduhubDropDown';
import { useRoleMutation } from '../../../hooks/authedMutation';
import { useTranslations } from 'next-intl';
import NotificationSnackbar from '../../common/dialogs/NotificationSnackbar';
import { ErrorMessageDialog } from '../../common/dialogs/ErrorMessageDialog';
import { gql } from '@apollo/client';

const DropDownSelector: React.FC<DropDownSelectorProps> = ({
  variant,
  label,
  placeholder,
  value,
  options,
  updateValueMutation,
  onValueUpdated,
  refetchQueries = [],
  helpText,
  isMandatory = false,
  className = '',
  identifierVariables,
  creatable = false,
  searchable = false,
  onOptionCreated,
  createOptionMutation,
  nullable = false,
  nullableLabel,
  disabled = false,
}) => {
  const t = useTranslations('common');
  const [inputValue, setInputValue] = useState('');

  const handleMutationValueUpdate = (newValue: string) => {
    onValueUpdated?.(newValue);
    return newValue;
  };

  // Add nullable option if nullable is true
  const enhancedOptions = useMemo(() => {
    return nullable
      ? [
          {
            label: nullableLabel || t('dropdown_selector.none_option'),
            value: '',
          },
          ...options,
        ]
      : options;
  }, [nullable, nullableLabel, options, t]);

  const {
    localValue,
    localOptions,
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
  } = useDropDownLogic(
    value,
    enhancedOptions,
    updateValueMutation || null,
    identifierVariables,
    handleMutationValueUpdate,
    refetchQueries,
    nullable
  );

  const [createValue] = useRoleMutation(
    createOptionMutation ||
      updateValueMutation ||
      gql`
        mutation NoOp {
          __typename
        }
      `,
    {
      onError: (error) => handleError(error.message),
      onCompleted: (data) => {
        const newValue = data?.createOption?.value || data?.insert_Organization_one?.id;
        if (newValue) {
          const newValueStr = newValue.toString();
          onOptionCreated?.(newValueStr);
          debouncedUpdateValue(newValueStr);
          setInputValue('');
        }
      },
      refetchQueries,
    }
  );

  const getLabelForValue = useCallback(
    (value?: string) => {
      if (!value) return '';
      const option = localOptions.find((opt) => opt.value === value);
      return option ? option.label : '';
    },
    [localOptions]
  );

  const handleCreateOption = useCallback(() => {
    if (disabled) return;
    // "Already on the list" means an option with that name, matched the way CreatableDropDown
    // decides whether to offer creation at all (label or alias, case-insensitive). Comparing the
    // typed text with `option.value` instead compared it with an id for every id-keyed picker
    // (organizations, addresses): it missed real duplicates, and it refused a legitimate creation
    // whenever a name happened to equal an existing row's id — a company called "360".
    // Trimmed throughout: the guard below would otherwise accept "   " as a name and create a
    // blank organization, and a name typed with stray spaces would be stored with them.
    const normalizedName = inputValue.trim();
    const typedName = normalizedName.toLowerCase();
    const nameExists = localOptions.some((option) => {
      if (option.label.trim().toLowerCase() === typedName) return true;
      const aliases: NonNullable<Option['aliases']> = option.aliases ?? [];
      return aliases.some((alias) => {
        const aliasName = typeof alias === 'string' ? alias : alias && 'name' in alias ? alias.name : '';
        return !!aliasName && aliasName.trim().toLowerCase() === typedName;
      });
    });
    if (normalizedName && !nameExists) {
      if (createOptionMutation) {
        createValue({
          variables: {
            ...identifierVariables,
            value: normalizedName,
          },
          onCompleted: (data) => {
            const newValue = data?.createOption?.value || data?.insert_Organization_one?.id || data?.insert_LocationAddress_one?.id;
            if (newValue) {
              const newValueStr = newValue.toString();
              onOptionCreated?.(newValueStr);
              debouncedUpdateValue(newValueStr);
            }
          },
          onError: (error) => {
            if (error.message.includes('Uniqueness violation')) {
              handleError(t('dropdown_selector.name_already_exists'));
            } else {
              handleError(error.message);
            }
          },
        });
      } else {
        onOptionCreated?.(normalizedName);
        debouncedUpdateValue(normalizedName);
      }
    }
  }, [
    inputValue,
    localOptions,
    createOptionMutation,
    createValue,
    identifierVariables,
    onOptionCreated,
    debouncedUpdateValue,
    handleError,
    t,
    disabled,
  ]);

  return (
    <>
      {variant === 'material' ? (
        <MaterialDropDown
          label={label}
          placeholder={placeholder}
          localValue={localValue}
          localOptions={localOptions}
          helpText={helpText}
          errorMessage={errorMessage}
          hasBlurred={hasBlurred}
          creatable={creatable}
          searchable={searchable}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onValueChange={handleValueChange}
          onBlur={() => handleBlur(variant, isMandatory)}
          onCreateOption={handleCreateOption}
          getLabelForValue={getLabelForValue}
          disabled={disabled}
        />
      ) : (
        <EduhubDropDown
          label={label}
          placeholder={placeholder}
          localValue={localValue}
          localOptions={localOptions}
          helpText={helpText}
          errorMessage={errorMessage}
          className={className}
          creatable={creatable}
          searchable={searchable}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onValueChange={handleValueChange}
          onBlur={() => handleBlur(variant, isMandatory)}
          onCreateOption={handleCreateOption}
          getLabelForValue={getLabelForValue}
          disabled={disabled}
        />
      )}
      <NotificationSnackbar
        open={showSavedNotification}
        onClose={() => setShowSavedNotification(false)}
        message={t('notification_snackbar.saved')}
      />
      <ErrorMessageDialog errorMessage={typeof error === 'string' ? error : ''} open={!!error} onClose={resetError} />
    </>
  );
};

export default DropDownSelector;
