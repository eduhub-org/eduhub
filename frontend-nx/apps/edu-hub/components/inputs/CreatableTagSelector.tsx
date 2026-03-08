import React, { useState, useEffect, useId } from 'react';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useAdminMutation } from '../../hooks/authedMutation';
import { DocumentNode } from 'graphql';
import { useTranslations } from 'next-intl';
import Tooltip from '@mui/material/Tooltip';
import { HelpOutline } from '@mui/icons-material';
import { prioritizeClasses } from '../../helpers/util';
import { ApolloError } from '@apollo/client';

type CreatableTagSelectorProps = {
  // Determines the visual style and behavior of the component
  // 'material' uses Material-UI components, 'eduhub' uses custom styling
  variant: 'material' | 'eduhub';

  // The label text displayed above the input field
  label: string;

  // Placeholder text shown in the input field when it's empty
  placeholder: string;

  // Unique identifier for the item being edited (e.g., organization ID, course ID)
  itemId: number;

  // Array of currently selected tags (strings)
  values: string[];

  // Array of available tag options (strings) to choose from
  options: string[];

  // GraphQL mutation to update the tags
  // This mutation should accept two variables: 'itemId' and 'tags'
  // Example:
  // const UPDATE_TAGS = gql`
  //   mutation UpdateTags($itemId: Int!, $tags: [String!]!) {
  //     updateTags(itemId: $itemId, tags: $tags) {
  //       id
  //       tags
  //     }
  //   }
  // `;
  updateValuesMutation: DocumentNode;

  // Callback function called after successful tag update
  // It receives the data returned by the mutation
  onTagsUpdated?: (data: any) => void;

  // Callback function called when an error occurs during tag update
  // Allows parent component to handle business-specific errors
  onError?: (error: ApolloError, attemptedTags: string[]) => void;

  // List of GraphQL query names to refetch after the mutation
  // This ensures that the UI is updated with the latest data
  refetchQueries?: string[];

  // Text shown in tooltip to provide additional information about the field
  helpText?: string;

  // Indicates if the field is required
  // If true, an error message will be shown if no tags are selected
  isMandatory?: boolean;

  // Delay in milliseconds before triggering the update after input
  // This helps to reduce the number of API calls while typing
  debounceTimeout?: number;

  // Additional CSS classes to apply to the input field
  className?: string;

  // If true, inverts the color scheme (useful for dark mode)
  invertColors?: boolean;
};

interface TagOption {
  inputValue?: string;
  value: string;
}

const filter = createFilterOptions<TagOption>();

const CreatableTagSelector: React.FC<CreatableTagSelectorProps> = ({
  variant,
  label,
  placeholder,
  itemId,
  values,
  options,
  updateValuesMutation,
  onTagsUpdated,
  onError,
  refetchQueries,
  helpText,
  className,
}) => {
  const [tags, setTags] = useState<TagOption[]>(values.map((tag) => ({ value: tag } as TagOption)));
  const [inputValue, setInputValue] = useState('');
  const t = useTranslations();
  const tagsAutocompleteId = useId();

  useEffect(() => {
    setTags(values.map((tag) => ({ value: tag })));
  }, [values]);

  const [updateValues] = useAdminMutation(updateValuesMutation, {
    refetchQueries,
  });

  const handleTagChange = async (_event: React.SyntheticEvent, newValue: TagOption[]) => {
    const updatedTags = newValue
      .map((option) => option.inputValue?.trim() || option.value?.trim() || '')
      .filter((tag) => tag !== ''); // Filter out empty strings

    const uniqueTags = Array.from(new Set(updatedTags)); // Remove duplicates

    try {
      const result = await updateValues({
        variables: {
          id: itemId,
          tags: uniqueTags,
        },
      });
      setTags(uniqueTags.map((tag) => ({ value: tag })));
      if (onTagsUpdated) {
        onTagsUpdated(result.data);
      }
    } catch (error) {
      // Revert to previous tags on error
      setTags(values.map((tag) => ({ value: tag })));

      // Let parent component handle the error
      if (onError && error instanceof ApolloError) {
        onError(error, uniqueTags);
      } else {
        // Fallback: log error if no error handler provided
        console.error('CreatableTagSelector error:', error);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      event.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.some((tag) => tag.value === newTag)) {
        const newTags = [...tags, { value: newTag }];
        handleTagChange(event, newTags);
        setInputValue('');
      }
    }
  };

  const baseClass = 'w-full px-3 py-1 mb-8 text-label-primary rounded bg-fill-primary';
  const finalClassName = prioritizeClasses(baseClass);

  const renderMaterialUI = () => (
    <div className="light">
      <Autocomplete
        multiple
        id={`${tagsAutocompleteId}-tags-autocomplete`}
        options={options.map((tag) => ({ value: tag }))}
        value={tags}
        onChange={(e, v) => handleTagChange(e, v as TagOption[])}
        inputValue={inputValue}
        onInputChange={(_event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        filterOptions={(options, params) => {
          const normalizedOptions: TagOption[] = options.map((opt) =>
            typeof opt === 'string' ? { value: opt, inputValue: undefined } : opt
          );
          const filtered = filter(normalizedOptions, params);
          const { inputValue } = params;
          const isExisting = normalizedOptions.some((opt) => inputValue === opt.value);
          if (inputValue !== '' && !isExisting) {
            filtered.push({
              inputValue: inputValue,
              value: inputValue,
            });
          }
          return filtered;
        }}
        getOptionLabel={(option: TagOption | string) => typeof option === 'string' ? option : (option.inputValue ?? option.value ?? '')}
        renderOption={(props, option: TagOption | string) => {
          const { key, ...otherProps } = props;
          const opt = typeof option === 'string' ? { value: option, inputValue: undefined } : option;
          return (
            <li key={key} {...otherProps}>
              {opt.inputValue ? t('common.CreatableTagSelector.add_tag', { value: opt.inputValue }) : opt.value}
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label={label}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {helpText && (
                    <Tooltip title={helpText} placement="top">
                      <HelpOutline style={{ cursor: 'pointer', marginRight: '6px', color: 'var(--eduhub-label-disabled)' }} />
                    </Tooltip>
                  )}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{
          '& .MuiChip-root': { color: 'var(--eduhub-label-primary)', backgroundColor: 'var(--eduhub-bg-secondary)' },
          '& .MuiChip-deleteIcon': { color: 'var(--eduhub-label-secondary)', '&:hover': { color: 'var(--eduhub-label-primary)' } },
          '& .MuiInputBase-input': { color: 'var(--eduhub-label-primary)' },
          '& .MuiInputLabel-root': { color: 'var(--eduhub-label-secondary)' },
          '& .MuiInput-underline:before': { borderBottomColor: 'var(--eduhub-border-primary)' },
        }}
        freeSolo
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        isOptionEqualToValue={(option, value) => {
          const optStr = typeof option === 'string' ? option : (option.value ?? option.inputValue ?? '');
          const valStr = typeof value === 'string' ? value : (value?.value ?? (value as TagOption & { inputValue?: string })?.inputValue ?? '');
          return optStr === valStr;
        }}
      />
    </div>
  );

  const renderEduhub = () => (
    <div className="px-2">
      <div className="text-label-primary">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            {helpText && (
              <Tooltip title={helpText} placement="top">
                <HelpOutline style={{ cursor: 'pointer', marginRight: '5px' }} />
              </Tooltip>
            )}
            {label}
          </div>
        </div>
        <div className="light">
          <Autocomplete
            multiple
            id={`${tagsAutocompleteId}-tags-autocomplete`}
            options={options.map((tag) => ({ value: tag }))}
            value={tags}
            onChange={(e, v) => handleTagChange(e, v as TagOption[])}
            inputValue={inputValue}
            onInputChange={(_event, newInputValue) => {
              setInputValue(newInputValue);
            }}
            filterOptions={(options, params) => {
              const normalizedOptions: TagOption[] = options.map((opt) =>
                typeof opt === 'string' ? { value: opt, inputValue: undefined } : opt
              );
              const filtered = filter(normalizedOptions, params);
              const { inputValue } = params;
              const isExisting = normalizedOptions.some((opt) => inputValue === opt.value);
              if (inputValue !== '' && !isExisting) {
                filtered.push({
                  inputValue: inputValue,
                  value: inputValue,
                });
              }
              return filtered;
            }}
            getOptionLabel={(option: TagOption | string) => typeof option === 'string' ? option : (option.inputValue ?? option.value ?? '')}
            renderOption={(props, option: TagOption | string) => {
              const { key, ...otherProps } = props;
              const opt = typeof option === 'string' ? { value: option, inputValue: undefined } : option;
              return (
                <li key={key} {...otherProps}>
                  {opt.inputValue
                    ? t('common.CreatableTagSelector.add_tag', { value: opt.inputValue })
                    : opt.value}
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                placeholder={placeholder}
                onKeyDown={handleKeyDown}
                className={finalClassName}
                InputProps={{
                  ...params.InputProps,
                  disableUnderline: true,
                }}
              />
            )}
            freeSolo
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            isOptionEqualToValue={(option, value) => {
              const optStr = typeof option === 'string' ? option : (option.value ?? option.inputValue ?? '');
              const valStr = typeof value === 'string' ? value : (value?.value ?? (value as TagOption & { inputValue?: string })?.inputValue ?? '');
              return optStr === valStr;
            }}
          />
        </div>
      </div>
    </div>
  );

  const content = variant === 'material' ? renderMaterialUI() : renderEduhub();
  
  return (
    <div className={className || ''}>{content}</div>
  );
};

export default CreatableTagSelector;
