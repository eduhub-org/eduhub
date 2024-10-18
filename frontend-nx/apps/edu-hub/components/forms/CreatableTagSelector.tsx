import React, { useState, useEffect } from 'react';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useAdminMutation } from '../../hooks/authedMutation';
import { DocumentNode } from 'graphql';
import useTranslation from 'next-translate/useTranslation';

type CreatableTagSelectorProps = {
  label: string;
  placeholder: string;
  itemId: number;
  currentTags: string[];
  tagOptions: string[];
  updateTagsMutation: DocumentNode;
  refetchQueries: string[];
  className?: string;
  translationNamespace?: string;
};

interface TagOption {
  inputValue?: string;
  value?: string;
}

const filter = createFilterOptions<TagOption>();

const CreatableTagSelector: React.FC<CreatableTagSelectorProps> = ({
  label,
  placeholder,
  itemId,
  currentTags,
  tagOptions,
  updateTagsMutation,
  refetchQueries,
  className,
  translationNamespace,
}) => {
  const [tags, setTags] = useState<TagOption[]>(currentTags.map((tag) => ({ value: tag })));
  const [inputValue, setInputValue] = useState('');
  const { t } = useTranslation(translationNamespace);

  useEffect(() => {
    setTags(currentTags.map((tag) => ({ value: tag })));
  }, [currentTags]);

  const [updateTags] = useAdminMutation(updateTagsMutation, {
    refetchQueries,
  });

  const handleTagChange = (event: React.SyntheticEvent, newValue: TagOption[]) => {
    const updatedTags = newValue
      .map((option) => option.inputValue?.trim() || option.value?.trim() || '')
      .filter((tag) => tag !== ''); // Filter out empty strings

    const uniqueTags = Array.from(new Set(updatedTags)); // Remove duplicates

    updateTags({
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
        options={tagOptions.map((tag) => ({ value: tag }))}
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
