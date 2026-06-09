import React, { useState, useCallback } from 'react';
import { DocumentNode } from 'graphql';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import { HelpOutline, Cancel } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useDebouncedCallback } from 'use-debounce';
import { useRoleMutation } from '../../hooks/authedMutation';
import { useTranslations } from 'next-intl';
import { prioritizeClasses } from '../../helpers/util';
import useErrorHandler from '../../hooks/useErrorHandler';
import { AlertMessageDialog } from '../common/dialogs/AlertMessageDialog';
import { ErrorMessageDialog } from '../common/dialogs/ErrorMessageDialog';
import NotificationSnackbar from '../common/dialogs/NotificationSnackbar';
import { gql } from 'graphql-tag';

/**
 * TagSelector Component
 *
 * This component provides a flexible tag selector that can operate in two modes:
 * 1. Immediate server update mode
 * 2. Local update mode
 *
 * The mode is determined by the presence or absence of both `insertValueMutation` and `deleteValueMutation` props:
 *
 * 1. When both `insertValueMutation` and `deleteValueMutation` are provided:
 *    - The component will update the server immediately when tags are added or removed.
 *    - It will call the provided mutations to update the server.
 *    - After successful updates, it will call `onValueUpdated` with the server response.
 *    - It will show a "Saved" notification after each successful update.
 *
 * 2. When either `insertValueMutation` or `deleteValueMutation` is not provided:
 *    - The component will not attempt to update the server.
 *    - It will only call `onValueUpdated` with the new tags.
 *    - No "Saved" notification will be shown.
 *
 * In both modes:
 * - Tag changes are debounced to prevent excessive updates or callbacks.
 * - Input validation is performed, and error messages are displayed if the input is invalid.
 * - The component supports both Material-UI and custom EduHub styling variants.
 *
 * This behavior allows the component to be used in various scenarios:
 * - As a standalone tag selector that immediately persists changes to the server.
 * - As part of a larger form where updates are collected locally and submitted together later.
 */

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

  // Ids of options that should be visually marked with a small badge (e.g. to
  // highlight course groups that are shown as a slider on the homepage).
  markedOptionIds?: number[];

  // Badge text shown next to marked options/tags.
  markLabel?: string;
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
  markedOptionIds,
  markLabel,
}) => {
  const t = useTranslations('common');
  const [tags, setTags] = useState(values);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { error, handleError, resetError } = useErrorHandler();
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const theme = useTheme();

  const [insertTag] = useRoleMutation(
    insertValueMutation ||
      gql`
        mutation NoOp {
          __typename
        }
      `,
    {
      onError: (error) => handleError(t(error.message)),
      onCompleted: (data) => {
        if (onValueUpdated) onValueUpdated(data);
        setShowSavedNotification(true);
      },
      refetchQueries,
    }
  );

  const [deleteTag] = useRoleMutation(
    deleteValueMutation ||
      gql`
        mutation NoOp {
          __typename
        }
      `,
    {
      onError: (error) => handleError(t(error.message)),
      onCompleted: (data) => {
        if (onValueUpdated) onValueUpdated(data);
        setShowSavedNotification(true);
      },
      refetchQueries,
    }
  );

  const debouncedUpdateTags = useDebouncedCallback((newTags: { id: number; name: string }[]) => {
    const oldTags = values;

    if (insertValueMutation && deleteValueMutation) {
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
    setShowSavedNotification(!!(insertValueMutation && deleteValueMutation));
  }, debounceTimeout);

  const handleTagChange = useCallback(
    (_event: React.SyntheticEvent, newValue: { id: number; name: string }[]) => {
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

  const getOptionLabel = (option: { id: number; name: string }) =>
    optionsTranslationPrefix ? t(`${optionsTranslationPrefix}${option.name}`) : option.name;
  const isMarked = (id: number) => !!markedOptionIds?.includes(id);

  const baseClass = `w-full px-3 py-3 mb-8 rounded ${
    invertColors ? 'bg-gray-200 text-black' : 'text-label-primary bg-fill-primary'
  }`;
  const finalClassName = prioritizeClasses(`${baseClass} ${className}`);

  const renderMaterialUI = () => (
    <div className="col-span-10 flex mt-3 w-full light">
      <Autocomplete
        multiple
        id="tags-standard"
        options={options}
        getOptionLabel={getOptionLabel}
        renderOption={
          markedOptionIds
            ? (props, option) => (
                <li {...props} key={option.id}>
                  <span className="flex-1">{getOptionLabel(option)}</span>
                  {isMarked(option.id) && markLabel && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide rounded bg-[color:var(--eduhub-brand)] text-white px-1.5 py-0.5">
                      {markLabel}
                    </span>
                  )}
                </li>
              )
            : undefined
        }
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            // Render chips explicitly so the delete (x) icon is always visible:
            // pull `key` out of the spread (React requires it passed directly),
            // keep `onDelete` from the spread, and force a high-contrast icon.
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                {...tagProps}
                deleteIcon={
                  <Cancel
                    sx={{
                      '&&': { color: 'var(--eduhub-label-primary)', opacity: 0.85 },
                      '&&:hover': { color: 'var(--eduhub-error)', opacity: 1 },
                    }}
                  />
                }
                label={
                  isMarked(option.id) && markLabel ? (
                    <span className="flex items-center gap-1">
                      {getOptionLabel(option)}
                      <Tooltip title={markLabel} placement="top">
                        <span aria-label={markLabel}>★</span>
                      </Tooltip>
                    </span>
                  ) : (
                    getOptionLabel(option)
                  )
                }
              />
            );
          })
        }
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
        sx={{
          '& .MuiChip-root': { color: 'var(--eduhub-label-primary)', backgroundColor: 'var(--eduhub-bg-secondary)' },
          '& .MuiChip-deleteIcon': {
            color: 'var(--eduhub-label-primary)',
            opacity: 0.8,
            '&:hover': { color: 'var(--eduhub-error)', opacity: 1 },
          },
          '& .MuiInputBase-input': { color: 'var(--eduhub-label-primary)' },
          '& .MuiInputLabel-root': { color: 'var(--eduhub-label-secondary)' },
          '& .MuiInput-underline:before': { borderBottomColor: 'var(--eduhub-border-primary)' },
        }}
      />
    </div>
  );

  const renderEduHub = () => (
    <div className="px-2 w-full">
      <div className="text-label-primary">
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
        <div className="light">
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
        message={t('notification_snackbar.saved')}
      />
    </>
  );
};

export default TagSelector;
