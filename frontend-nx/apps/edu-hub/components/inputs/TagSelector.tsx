import React, { useState, useCallback } from 'react';
import { DocumentNode } from 'graphql';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
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

type TagSelectorProps = {
  // Determines the visual style and behavior of the component
  // 'material' uses Material-UI components, 'eduhub' uses custom styling
  variant: 'material' | 'eduhub';

  // The label for the tag selector
  label: string;

  // Placeholder text for the input field
  placeholder: string;

  // Unique identifier for the item being edited
  itemId: number;

  // Currently selected tags
  values: { id: number; name: string }[];

  // Available tag options
  options: { id: number; name: string }[];

  // GraphQL mutation to insert a tag
  insertValueMutation?: DocumentNode;

  // GraphQL mutation to delete a tag
  deleteValueMutation?: DocumentNode;

  // Callback function called after successful tag update
  onValueUpdated?: (data: any) => void;

  // List of GraphQL query names to refetch after mutation
  refetchQueries?: string[];

  // Text shown in tooltip to provide additional information
  helpText?: string;

  // Indicates if the field is required
  isMandatory?: boolean;

  // Delay in milliseconds before triggering update after input
  debounceTimeout?: number;

  // Additional CSS classes to apply to the input
  className?: string;

  // If true, inverts the color scheme (for dark mode)
  invertColors?: boolean;

  // Prefix for options/tags translations (optional)
  optionsTranslationPrefix?: string;

  /**
   * Controls whether the tag selector should update the server immediately on change or wait for external trigger.
   *
   * @default true
   *
   * When true (default):
   * - The component will call the insert/delete mutations as soon as tags are added/removed.
   * - This is suitable for standalone selectors or when immediate updates are desired.
   *
   * When false:
   * - The component will not call the mutations directly.
   * - Instead, it will call onValueUpdated with the new tags.
   * - This allows the parent component to control when the update should occur (e.g., on form submission).
   * - Useful for multi-field forms where you want to submit all changes at once.
   */
  immediateUpdate?: boolean;
};

const TagSelector: React.FC<TagSelectorProps> = ({
  variant,
  label,
  placeholder,
  itemId,
  values,
  options,
  insertValueMutation,
  deleteValueMutation,
  onValueUpdated,
  refetchQueries = [],
  helpText,
  isMandatory = false,
  debounceTimeout = 300,
  className = '',
  invertColors = false,
  optionsTranslationPrefix = '',
  immediateUpdate = true,
}) => {
  const { t } = useTranslation();
  const [tags, setTags] = useState(values);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { error, handleError, resetError } = useErrorHandler();
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const theme = useTheme();

  const [insertTag] = insertValueMutation
    ? useRoleMutation(insertValueMutation, {
        onError: (error) => handleError(t(error.message)),
        onCompleted: (data) => {
          if (onValueUpdated) onValueUpdated(data);
          setShowSavedNotification(true);
        },
        refetchQueries,
      })
    : [() => {}];

  const [deleteTag] = deleteValueMutation
    ? useRoleMutation(deleteValueMutation, {
        onError: (error) => handleError(t(error.message)),
        onCompleted: (data) => {
          if (onValueUpdated) onValueUpdated(data);
          setShowSavedNotification(true);
        },
        refetchQueries,
      })
    : [() => {}];

  const debouncedUpdateTags = useDebouncedCallback((newTags: { id: number; name: string }[]) => {
    const oldTags = values;

    if (immediateUpdate && insertValueMutation && deleteValueMutation) {
      for (const tag of newTags) {
        if (!oldTags.some((oldTag) => oldTag.id === tag.id)) {
          // New tag added
          insertTag({ variables: { itemId, tagId: tag.id } });
        }
      }

      for (const tag of oldTags) {
        if (!newTags.some((newTag) => newTag.id === tag.id)) {
          // Tag removed
          deleteTag({ variables: { itemId, tagId: tag.id } });
        }
      }
    } else if (onValueUpdated) {
      onValueUpdated(newTags);
    }

    setHasBlurred(false);
  }, debounceTimeout);

  const handleTagChange = useCallback(
    (event, newValue) => {
      setTags(newValue);
      debouncedUpdateTags(newValue);
    },
    [debouncedUpdateTags]
  );

  const handleBlur = useCallback(() => {
    setHasBlurred(true);
    if (isMandatory && tags.length === 0) {
      setErrorMessage(t('tag_selector.selection_required'));
      if (variant === 'eduhub') {
        handleError(t('tag_selector.selection_required'));
      }
    } else {
      setErrorMessage('');
      if (variant === 'eduhub') {
        resetError();
      }
    }
    debouncedUpdateTags.flush();
  }, [variant, tags, isMandatory, debouncedUpdateTags, handleError, resetError, t]);

  const baseClass = `w-full px-3 py-3 mb-8 rounded ${
    invertColors ? 'bg-gray-200 text-black' : 'text-gray-500 bg-edu-light-gray'
  }`;
  const finalClassName = prioritizeClasses(`${baseClass} ${className}`);

  const renderMaterialUI = () => (
    <div className="col-span-10 flex mt-3 w-full">
      <Autocomplete
        multiple
        id="tags-standard"
        options={options}
        getOptionLabel={(option) => t(`${optionsTranslationPrefix}${option.name}`)}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label={label}
            placeholder={placeholder}
            error={hasBlurred && !!errorMessage}
            helperText={hasBlurred && errorMessage}
            fullWidth
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {helpText && (
                    <InputAdornment position="end">
                      <Tooltip title={t(helpText)} placement="top">
                        <HelpOutline style={{ cursor: 'pointer', color: theme.palette.text.disabled }} />
                      </Tooltip>
                    </InputAdornment>
                  )}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        onChange={handleTagChange}
        onBlur={handleBlur}
        value={tags}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        fullWidth
      />
    </div>
  );

  const renderEduHub = () => (
    <div className="px-2 w-full">
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
        <Autocomplete
          multiple
          id="tags-eduhub"
          options={options}
          getOptionLabel={(option) =>
            optionsTranslationPrefix ? t(`${optionsTranslationPrefix}${option.name}`) : option.name
          }
          renderInput={(params) => (
            <TextField {...params} variant="outlined" placeholder={placeholder} className={finalClassName} fullWidth />
          )}
          onChange={handleTagChange}
          onBlur={handleBlur}
          value={tags}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          fullWidth
        />
        {hasBlurred && errorMessage && <p className="text-red-500 mt-2 text-sm">{errorMessage}</p>}
      </div>
    </div>
  );

  return (
    <>
      {variant === 'material' ? renderMaterialUI() : renderEduHub()}
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

export default TagSelector;
