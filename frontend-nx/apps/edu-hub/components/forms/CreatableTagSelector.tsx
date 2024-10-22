import React, { useState, useEffect } from 'react';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useAdminMutation } from '../../hooks/authedMutation';
import { DocumentNode } from 'graphql';
import useTranslation from 'next-translate/useTranslation';

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
  value?: string;
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
  refetchQueries,
  helpText,
  isMandatory,
  debounceTimeout,
  className,
  invertColors,
}) => {
  const [tags, setTags] = useState<TagOption[]>(values.map((tag) => ({ value: tag })));
  const [inputValue, setInputValue] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    setTags(values.map((tag) => ({ value: tag })));
  }, [values]);

  const [updateValues] = useAdminMutation(updateValuesMutation, {
    refetchQueries,
  });

  const handleTagChange = (event: React.SyntheticEvent, newValue: TagOption[]) => {
    const updatedTags = newValue
      .map((option) => option.inputValue?.trim() || option.value?.trim() || '')
      .filter((tag) => tag !== ''); // Filter out empty strings

    const uniqueTags = Array.from(new Set(updatedTags)); // Remove duplicates

    updateValues({
      variables: {
        id: itemId,
        tags: uniqueTags,
      },
    });
    setTags(uniqueTags.map((tag) => ({ value: tag })));
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

  return (
    <div className={className}>
      <Autocomplete
        multiple
        id="tags-autocomplete"
        options={options.map((tag) => ({ value: tag }))}
        value={tags}
        onChange={handleTagChange}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);
          const { inputValue } = params;
          const isExisting = options.some((option) => inputValue === option.value);
          if (inputValue !== '' && !isExisting) {
            filtered.push({
              inputValue: inputValue,
              value: inputValue,
            });
          }
          return filtered;
        }}
        getOptionLabel={(option: TagOption) => option.inputValue || option.value || ''}
        renderOption={(props, option: TagOption) => (
          <li {...props}>
            {option.inputValue ? t('common:CreatableTagSelector.add_tag', { value: option.inputValue }) : option.value}
          </li>
        )}
        renderInput={(params) => (
          <TextField {...params} variant="standard" label={label} placeholder={placeholder} onKeyDown={handleKeyDown} />
        )}
        freeSolo
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        isOptionEqualToValue={(option, value) =>
          (option.value || option.inputValue || '') === (value.value || value.inputValue || '')
        }
      />
    </div>
  );
};

export default CreatableTagSelector;
